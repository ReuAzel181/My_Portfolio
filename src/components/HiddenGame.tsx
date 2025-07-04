import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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

  const handleCardClick = (id: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }
    
    if (!cards[id] || flippedCards.length === 2 || cards[id].isMatched || flippedCards.includes(id) || gameOver) return;

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

  const useSpecialCard = (emoji: string) => {
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
        // Reveal all cards
        setCards(cards.map(card => ({
          ...card,
          isFlipped: true
        })));

        // After 1 second, hide unmatched cards
        setTimeout(() => {
          setCards(cards.map(card => ({
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
        const matchedCards = cards.filter(card => card.isMatched);
        const unmatchedCards = cards.filter(card => !card.isMatched);
        const shuffledUnmatched = [...unmatchedCards]
          .sort(() => Math.random() - 0.5)
          .map(card => ({ ...card, isFlipped: false }));
        
        setCards([...matchedCards, ...shuffledUnmatched]);
        setFlippedCards([]);
        showNotification("Cards shuffled!");
        break;
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
          className="bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl backdrop-blur-xl max-w-[820px] w-[95%] mx-4 overflow-hidden transition-colors"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
        >
          {/* Header */}
          <div className="bg-white/90 dark:bg-slate-800/90 p-6 border-b border-gray-200 dark:border-slate-700 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">Memory Game</h2>
                  <div className="bg-white/80 dark:bg-slate-700/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="text-amber-500 dark:text-amber-400 text-lg">🪙</span>
                    <span className="font-medium text-gray-900 dark:text-white">{gameStats.points}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Moves:</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">{gameStats.moves}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Time:</span>
                    <div className={`font-mono font-bold text-lg ${timeLeft < 10 ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-gray-900 dark:text-white'} drop-shadow-sm`}>
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Reward:</span>
                    <div className="font-bold text-lg flex items-center gap-1 text-gray-900 dark:text-white">
                      <span>{DIFFICULTY_LEVELS[difficulty].reward}</span>
                      <span className="text-amber-500 dark:text-amber-400">🪙</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Custom Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-700/80 text-base font-medium text-gray-900 dark:text-white w-[120px] flex items-center justify-between gap-2 shadow border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all focus:outline-none ${dropdownOpen ? 'ring-2 ring-blue-500/60 dark:ring-blue-400/60' : ''}`}
                    onClick={() => setDropdownOpen((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                  >
                    <span>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                    <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {dropdownOpen && (
                    <ul
                      tabIndex={-1}
                      className="absolute left-0 mt-2 w-full rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-lg ring-1 ring-black/10 z-50 py-1"
                      role="listbox"
                    >
                      {['easy', 'medium', 'hard'].map((level) => (
                        <li
                          key={level}
                          role="option"
                          aria-selected={difficulty === level}
                          className={`px-4 py-2 cursor-pointer text-base rounded-xl transition-colors ${
                            difficulty === level
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold'
                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                          onClick={() => {
                            setDifficulty(level as DifficultyLevel);
                            setDropdownOpen(false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setDifficulty(level as DifficultyLevel);
                              setDropdownOpen(false);
                            }
                          }}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={() => initializeGame(difficulty)}
                  className="w-9 h-9 flex items-center justify-center text-2xl bg-white/80 dark:bg-slate-700/80 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-full shadow transition-colors"
                  title="Reset Game"
                >
                  🔄
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-700/80 border border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors text-lg text-gray-900 dark:text-white shadow"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Height Container */}
          <div className="relative">
            {/* Notification Area - Fixed Position */}
            <div className="h-10 relative">
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute inset-x-0 text-center font-bold py-1.5 px-4 rounded-lg shadow-md mx-auto w-fit
                      ${message.includes('won') 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/30'
                        : message.includes('error') || message.includes('up')
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/30'
                        : 'bg-[var(--button-bg)]/10 dark:bg-[var(--button-bg)]/20 text-[var(--button-bg)] dark:text-[var(--button-text)] border-[var(--button-bg)]/20 dark:border-[var(--button-bg)]/30'
                      } border backdrop-blur-md transition-colors`}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Game Content */}
            <div className="p-4 bg-gray-50/50 dark:bg-slate-900/50">
              <div className="flex justify-center items-start gap-8">
                {/* Game Grid */}
                <div>
                  <div className={`grid gap-3 ${
                    difficulty === 'easy' 
                      ? 'grid-cols-3 w-[360px]' 
                      : 'grid-cols-4 w-[440px]'
                  }`}>
                    {cards.map((card) => (
                      <motion.button
                        key={card.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold
                          ${card.isFlipped || card.isMatched || flippedCards.includes(card.id)
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-lg border border-blue-200 dark:border-blue-800'
                            : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700 shadow'
                          } hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5`}
                        onClick={() => handleCardClick(card.id)}
                      >
                        <motion.span
                          initial={false}
                          animate={{
                            rotateY: (card.isFlipped || card.isMatched || flippedCards.includes(card.id)) ? 0 : 180,
                            scale: (card.isFlipped || card.isMatched || flippedCards.includes(card.id)) ? 1 : 0.8
                          }}
                          transition={{ duration: 0.3 }}
                          className="font-bold text-2xl"
                        >
                          {(card.isFlipped || card.isMatched || flippedCards.includes(card.id)) ? card.emoji : '?'}
                        </motion.span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Power-ups Sidebar */}
                <div className="w-[290px] flex flex-col gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white sticky top-0 bg-white/90 dark:bg-slate-800/90 py-1 px-2 rounded-xl shadow-sm">Power-ups</h3>
                  <div className="space-y-3">
                    {Object.entries(SPECIAL_CARDS).map(([emoji, { description, cost }]) => (
                      <motion.div
                        key={emoji}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-lg relative overflow-hidden"
                      >
                        {/* Alert Overlay */}
                        <AnimatePresence>
                          {showAlert?.emoji === emoji && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="absolute inset-0 bg-red-100 dark:bg-red-900/90 flex flex-col items-center justify-center text-red-700 dark:text-red-300 p-2 text-center z-10 rounded-xl shadow-xl"
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
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 dark:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shadow-lg">
                                {powerUps[emoji]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{
                              emoji === '🌟' ? 'Reveal' :
                              emoji === '⏰' ? 'Time Boost' :
                              'Shuffle'
                            }</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">{description}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => buyPowerUp(emoji)}
                            disabled={gameStats.points < cost}
                            className={`
                              relative overflow-hidden rounded-lg text-sm font-bold shadow-lg transition-all duration-200
                              ${gameStats.points >= cost
                                ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              }
                              before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-300
                              px-3 py-1.5
                            `}
                          >
                            {cost}🪙
                          </button>
                          <button
                            onClick={() => useSpecialCard(emoji)}
                            disabled={powerUps[emoji] <= 0}
                            className={`
                              relative overflow-hidden rounded-lg text-sm font-bold shadow-lg transition-all duration-200
                              ${powerUps[emoji] > 0
                                ? 'bg-amber-500 dark:bg-amber-600 text-white hover:bg-amber-600 dark:hover:bg-amber-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                                : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              }
                              before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-300
                              px-3 py-1.5
                            `}
                          >
                            Use {powerUps[emoji] > 0 ? `(${powerUps[emoji]})` : ''}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Add styles for dropdown options globally */}
      <style jsx global>{`
        select option {
          padding: 8px 12px;
          background-color: var(--button-bg);
          color: var(--button-text);
        }
        select option:hover {
          background-color: var(--button-hover);
        }
      `}</style>
    </AnimatePresence>
  );
} 