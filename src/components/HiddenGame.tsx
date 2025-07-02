import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
  isSpecial?: boolean;
}

interface GameStats {
  moves: number;
  timeElapsed: number;
  bestTime: number;
  bestMoves: number;
  points: number;
}

interface PowerUpInventory {
  [key: string]: number;
}

const DIFFICULTY_LEVELS = {
  easy: { pairs: 6, timeLimit: 120, reward: 50 },
  medium: { pairs: 8, timeLimit: 90, reward: 100 },
  hard: { pairs: 12, timeLimit: 60, reward: 200 }
};

const SPECIAL_CARDS = {
  '🌟': { description: 'Reveals all cards for 1 second', cost: 100 },
  '⏰': { description: 'Adds 10 seconds to the timer', cost: 150 },
  '🔄': { description: 'Shuffles all unmatched cards', cost: 75 }
};

type DifficultyLevel = keyof typeof DIFFICULTY_LEVELS;

const ALL_EMOJIS = ['🎮', '🎨', '🎵', '💻', '🎯', '🎪', '🎭', '🎪', '🎲', '🎳', '🎯', '🎨', 
                    '🎸', '🎺', '🎻', '🥁', '🎹', '🎷', '🎼', '🎧', '🎤', '🎬', '🎨', '🎭'];

export default function HiddenGame({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState<number>(0);
  const [gameStats, setGameStats] = useState<GameStats>({
    moves: 0,
    timeElapsed: 0,
    bestTime: parseInt(localStorage.getItem('memoryGame_bestTime') || '999'),
    bestMoves: parseInt(localStorage.getItem('memoryGame_bestMoves') || '999'),
    points: parseInt(localStorage.getItem('memoryGame_points') || '0')
  });
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [powerUps, setPowerUps] = useState<PowerUpInventory>(() => {
    const saved = localStorage.getItem('memoryGame_powerups');
    return saved ? JSON.parse(saved) : { '🌟': 0, '⏰': 0, '🔄': 0 };
  });
  const [showAlert, setShowAlert] = useState<{ emoji: string; cost: number } | null>(null);

  const initializeGame = useCallback((level: DifficultyLevel) => {
    const { pairs } = DIFFICULTY_LEVELS[level];
    const gameEmojis = [...ALL_EMOJIS.slice(0, pairs)];
    const initialCards = [...gameEmojis, ...gameEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));

    setCards(initialCards);
    setFlippedCards([]);
    setMatches(0);
    setGameStats(prev => ({ ...prev, moves: 0, timeElapsed: 0 }));
    setGameStarted(false);
    setGameOver(false);
    setMessage('');
  }, []);

  useEffect(() => {
    if (isVisible) {
      initializeGame(difficulty);
    }
  }, [isVisible, difficulty, initializeGame]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameStarted && !gameOver) {
      timer = setInterval(() => {
        setGameStats(prev => {
          const newTime = prev.timeElapsed + 1;
          if (newTime >= DIFFICULTY_LEVELS[difficulty].timeLimit) {
            setGameOver(true);
            setMessage("Time's up! Try again?");
            return prev;
          }
          return { ...prev, timeElapsed: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, difficulty]);

  const addPoints = (amount: number) => {
    setGameStats(prev => {
      const newPoints = prev.points + amount;
      localStorage.setItem('memoryGame_points', newPoints.toString());
      return { ...prev, points: newPoints };
    });
  };

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(''), 1500);
  };

  const buyPowerUp = (emoji: string) => {
    const specialCard = SPECIAL_CARDS[emoji as keyof typeof SPECIAL_CARDS];
    if (gameStats.points < specialCard.cost) {
      setShowAlert({ emoji, cost: specialCard.cost });
      setTimeout(() => setShowAlert(null), 2000);
      return;
    }

    addPoints(-specialCard.cost);
    setPowerUps(prev => {
      const updated = { ...prev, [emoji]: (prev[emoji] || 0) + 1 };
      localStorage.setItem('memoryGame_powerups', JSON.stringify(updated));
      return updated;
    });
    showNotification(`Bought ${emoji} power-up!`);
  };

  const useSpecialCard = (emoji: string) => {
    if (!gameStarted) {
      showNotification("Start the game first!", "error");
      return;
    }

    if (powerUps[emoji] <= 0) {
      showNotification("No power-ups left!", "error");
      return;
    }

    setPowerUps(prev => {
      const updated = { ...prev, [emoji]: prev[emoji] - 1 };
      localStorage.setItem('memoryGame_powerups', JSON.stringify(updated));
      return updated;
    });

    switch (emoji) {
      case '🌟':
        const unmatchedCards = cards.filter(card => !card.isMatched);
        setCards(prev => prev.map(card => ({
          ...card,
          isFlipped: card.isMatched || true
        })));
        setTimeout(() => {
          setCards(prev => prev.map(card => ({
            ...card,
            isFlipped: card.isMatched || flippedCards.includes(card.id)
          })));
        }, 1000);
        showNotification("All cards revealed!");
        break;
      case '⏰':
        setGameStats(prev => ({
          ...prev,
          timeElapsed: Math.max(0, prev.timeElapsed - 10)
        }));
        showNotification('+10 seconds added!');
        break;
      case '🔄':
        const unmatched = cards.filter(card => !card.isMatched);
        const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
        let shuffleIndex = 0;
        
        setCards(prev => prev.map(card => 
          card.isMatched ? card : { ...shuffled[shuffleIndex++], isFlipped: false }
        ));
        setFlippedCards([]);
        showNotification("Cards shuffled!");
        break;
    }
  };

  const handleCardClick = (id: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    if (flippedCards.length === 2 || cards[id].isMatched || flippedCards.includes(id) || gameOver) return;

    const newFlippedCards = [...flippedCards, id];
    setFlippedCards(newFlippedCards);
    setGameStats(prev => ({ ...prev, moves: prev.moves + 1 }));

    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards[firstId];
      const secondCard = cards[secondId];

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        setCards(cards.map(card => 
          card.id === firstId || card.id === secondId
            ? { ...card, isMatched: true }
            : card
        ));
        setMatches(prev => {
          const newMatches = prev + 1;
          if (newMatches === DIFFICULTY_LEVELS[difficulty].pairs) {
            // Game won
            const newBestTime = Math.min(gameStats.timeElapsed, gameStats.bestTime);
            const newBestMoves = Math.min(gameStats.moves + 1, gameStats.bestMoves);
            localStorage.setItem('memoryGame_bestTime', newBestTime.toString());
            localStorage.setItem('memoryGame_bestMoves', newBestMoves.toString());
            
            // Calculate bonus points based on time and moves
            const timeBonus = Math.floor((DIFFICULTY_LEVELS[difficulty].timeLimit - gameStats.timeElapsed) * 0.5);
            const moveBonus = Math.floor((DIFFICULTY_LEVELS[difficulty].pairs * 4 - gameStats.moves) * 2);
            const totalReward = DIFFICULTY_LEVELS[difficulty].reward + Math.max(0, timeBonus) + Math.max(0, moveBonus);
            
            addPoints(totalReward);
            setGameOver(true);
            setMessage(`🎉 You won! +${totalReward} points!`);
          }
          return newMatches;
        });
        setFlippedCards([]);
      } else {
        // No match
        setTimeout(() => setFlippedCards([]), 1000);
      }
    }
  };

  if (!isVisible) return null;

  const timeLeft = DIFFICULTY_LEVELS[difficulty].timeLimit - gameStats.timeElapsed;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-[800px] w-[90%] mx-4 overflow-hidden"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Memory Game</h2>
                <div className="text-sm opacity-90 flex items-center gap-1">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">
                    🪙 {gameStats.points} points
                  </span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="px-2 py-1 rounded bg-white/20 text-sm border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                  disabled={gameStarted && !gameOver}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <button
                  onClick={() => initializeGame(difficulty)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  title="Reset Game"
                >
                  🔄
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-between mt-3 text-sm font-medium">
              <div className="flex gap-4">
                <div>Moves: {gameStats.moves}</div>
                <div className={`font-mono ${timeLeft < 10 ? 'text-red-200 animate-pulse' : ''}`}>
                  ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <div>Reward: {DIFFICULTY_LEVELS[difficulty].reward}🪙</div>
            </div>
          </div>

          {/* Game Content */}
          <div className="p-6">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center font-bold mb-4 py-2 px-4 rounded-lg ${
                  message.includes('Need') 
                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                }`}
              >
                {message}
              </motion.div>
            )}

            <div className="flex gap-6 mb-6">
              {/* Game Grid */}
              <div className="flex-1">
                <div className={`grid gap-2 ${
                  difficulty === 'easy' ? 'grid-cols-3' : 
                  difficulty === 'medium' ? 'grid-cols-4' : 
                  'grid-cols-4'
                }`}>
                  {cards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-2xl
                        ${card.isMatched || flippedCards.includes(card.id)
                          ? 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800'
                          : 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'
                        } shadow-sm hover:shadow-md transition-shadow`}
                      onClick={() => handleCardClick(card.id)}
                    >
                      <motion.span
                        initial={false}
                        animate={{
                          rotateY: (card.isMatched || flippedCards.includes(card.id)) ? 0 : 180,
                          scale: (card.isMatched || flippedCards.includes(card.id)) ? 1 : 0.8
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {(card.isMatched || flippedCards.includes(card.id)) ? card.emoji : '?'}
                      </motion.span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Power-ups Sidebar */}
              <div className="w-64 flex flex-col gap-3">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-1">Power-ups</h3>
                {Object.entries(SPECIAL_CARDS).map(([emoji, { description, cost }]) => (
                  <motion.div
                    key={emoji}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md relative overflow-hidden border border-gray-200 dark:border-gray-700"
                  >
                    {/* Alert Overlay */}
                    <AnimatePresence>
                      {showAlert?.emoji === emoji && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute inset-0 bg-red-500/95 dark:bg-red-900/95 flex flex-col items-center justify-center text-white p-2 text-center z-10"
                        >
                          <div className="text-lg font-bold mb-1">Not enough coins!</div>
                          <div className="text-sm">
                            Need {showAlert.cost - gameStats.points} more 🪙
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <span className="text-2xl">{emoji}</span>
                        {powerUps[emoji] > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center font-bold shadow-lg">
                            {powerUps[emoji]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{
                          emoji === '🌟' ? 'Reveal' :
                          emoji === '⏰' ? 'Time Boost' :
                          'Shuffle'
                        }</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => buyPowerUp(emoji)}
                        disabled={gameStats.points < cost}
                        className={
                          gameStats.points >= cost
                            ? 'bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 active:bg-blue-700 shadow-lg'
                            : 'bg-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm font-bold cursor-not-allowed'
                        }
                      >
                        Buy (🪙 {cost})
                      </button>
                      <button
                        onClick={() => useSpecialCard(emoji)}
                        disabled={!gameStarted || powerUps[emoji] <= 0}
                        className={
                          powerUps[emoji] > 0 && gameStarted
                            ? 'bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-600 active:bg-green-700 shadow-lg'
                            : 'bg-gray-200 text-gray-500 px-3 py-2 rounded-lg text-sm font-bold cursor-not-allowed'
                        }
                      >
                        Use {powerUps[emoji] > 0 ? `(${powerUps[emoji]})` : ''}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 