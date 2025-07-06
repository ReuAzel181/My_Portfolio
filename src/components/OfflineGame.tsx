'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'tallBlock' | 'doubleSpike' | 'floatingBlock';
}

interface GameState {
  score: number;
  isJumping: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  playerY: number;
  playerVelocity: number;
  obstacles: Obstacle[];
  gameSpeed: number;
}

export default function OfflineGame() {
  const [isMounted, setIsMounted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    isJumping: false,
    gameStarted: false,
    gameOver: false,
    playerY: 0,
    playerVelocity: 0,
    obstacles: [],
    gameSpeed: 3
  });

  const gameLoopRef = useRef<number>();
  const lastObstacleId = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [groundOffset, setGroundOffset] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const [waitingForStart, setWaitingForStart] = useState(true);

  // Ensure we're on the client side before doing any window/document operations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sound effects
  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' | 'sawtooth' = 'sine') => {
    if (!isMounted) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration);
  }, [isMounted]);

  const handleJump = useCallback(() => {
    if (!gameState.gameOver && gameState.gameStarted && gameState.playerY === 0) {
      setGameState(prev => ({
        ...prev,
        isJumping: true,
        playerVelocity: 15 // positive for up
      }));
      playSound(400, 0.1, 'square'); // Jump sound
    }
  }, [gameState.gameOver, gameState.gameStarted, gameState.playerY, playSound]);

  const startGame = useCallback(() => {
    // Blur any focused element to ensure spacebar works
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameOver: false,
      score: 0,
      playerY: 0,
      playerVelocity: 0,
      obstacles: [],
      gameSpeed: 3
    }));
    setGroundOffset(0);
    setBgOffset(0);
    playSound(200, 0.2, 'sine'); // Start sound
  }, [playSound]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      gameStarted: false,
      gameOver: false,
      score: 0,
      playerY: 0,
      playerVelocity: 0,
      obstacles: [],
      gameSpeed: 3
    }));
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const gameLoop = () => {
      setGameState(prev => {
        // Update player physics
        let newPlayerY = prev.playerY;
        let newPlayerVelocity = prev.playerVelocity;
        let newIsJumping = prev.isJumping;

        newPlayerVelocity -= 0.8; // Gravity pulls down
        newPlayerY += newPlayerVelocity;

        // Ground collision
        if (newPlayerY <= 0) {
          newPlayerY = 0;
          newPlayerVelocity = 0;
          newIsJumping = false;
        }

        // Update obstacles
        const newObstacles = prev.obstacles
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - prev.gameSpeed
          }))
          .filter(obstacle => obstacle.x > -50);

        // Generate new obstacles
        const minGap = 320;
        const maxGap = 480;
        const lastObstacle = newObstacles.length > 0 ? newObstacles[newObstacles.length - 1] : null;
        if (!lastObstacle || lastObstacle.x < 600) {
          // Randomly choose obstacle type
          const rand = Math.random();
          let obstacleType: Obstacle['type'];
          if (rand < 0.3) obstacleType = 'spike';
          else if (rand < 0.5) obstacleType = 'block';
          else if (rand < 0.7) obstacleType = 'tallBlock';
          else if (rand < 0.85) obstacleType = 'doubleSpike';
          else obstacleType = 'floatingBlock';

          let y = 0;
          let width = 30;
          let height = 40;
          if (obstacleType === 'block') {
            width = 40;
            height = 40;
          } else if (obstacleType === 'tallBlock') {
            width = 40;
            height = 70;
          } else if (obstacleType === 'doubleSpike') {
            width = 60;
            height = 40;
          } else if (obstacleType === 'floatingBlock') {
            width = 40;
            height = 40;
            y = 80 + Math.random() * 32; // always jumpable, not too high
          }

          let newX = lastObstacle ? lastObstacle.x + (Math.random() * (maxGap - minGap) + minGap) : 800;

          if (obstacleType === 'doubleSpike') {
            // Place two spikes with a small gap
            newObstacles.push({
              id: ++lastObstacleId.current,
              x: newX,
              y: 0,
              width: 30,
              height: 40,
              type: 'spike'
            });
            newObstacles.push({
              id: ++lastObstacleId.current,
              x: newX + 40,
              y: 0,
              width: 30,
              height: 40,
              type: 'spike'
            });
          } else {
            newObstacles.push({
              id: ++lastObstacleId.current,
              x: newX,
              y,
              width,
              height,
              type: obstacleType
            });
          }
        }

        // Collision detection
        // Player hitbox (smaller than visual)
        const playerRect = {
          x: 100 + 0.1 * 32, // 10% padding left
          y: newPlayerY + 0.1 * 32, // 10% padding bottom
          width: 0.8 * 32, // 80% of 32px
          height: 0.8 * 32
        };
        // Previous player bottom for landing detection
        const prevPlayerBottom = prev.playerY + 0.1 * 32 + 0.8 * 32;
        const prevPlayerTop = prev.playerY + 0.1 * 32;

        let newGameOver = prev.gameOver;
        for (const obstacle of newObstacles) {
          let obsRect = {
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.width,
            height: obstacle.height
          };
          if (obstacle.type === 'spike') {
            // Make spike hitbox smaller and centered
            const spikeHitbox = {
              x: obsRect.x + obsRect.width * 0.2,
              y: obsRect.y,
              width: obsRect.width * 0.6,
              height: obsRect.height * 0.8
            };
            if (
              spikeHitbox.x < playerRect.x + playerRect.width &&
              spikeHitbox.x + spikeHitbox.width > playerRect.x &&
              playerRect.y < spikeHitbox.y + spikeHitbox.height &&
              playerRect.y + playerRect.height > spikeHitbox.y
            ) {
              newGameOver = true;
              playSound(150, 0.3, 'sawtooth'); // Death sound
              break;
            }
          } else {
            // Platformer landing logic
            const prevBottom = prevPlayerBottom;
            const currBottom = playerRect.y + playerRect.height;
            const blockTop = obsRect.y;
            const blockLeft = obsRect.x;
            const blockRight = obsRect.x + obsRect.width;
            const playerLeft = playerRect.x;
            const playerRight = playerRect.x + playerRect.width;
            // Check for overlap
            const isOverlapping =
              blockLeft < playerRight &&
              blockRight > playerLeft &&
              playerRect.y < obsRect.y + obsRect.height &&
              currBottom > blockTop;
            // Safe landing: was above, now at or below top, falling, and horizontal overlap
            const isLanding =
              prevBottom <= blockTop &&
              currBottom >= blockTop &&
              newPlayerVelocity < 0 &&
              playerRight > blockLeft + 4 &&
              playerLeft < blockRight - 4;
            if (isOverlapping) {
              if (isLanding) {
                // Snap player to top of block if landing
                newPlayerY = obsRect.y + obsRect.height - 128;
                newPlayerVelocity = 0;
                newIsJumping = false;
              } else {
                newGameOver = true;
                playSound(150, 0.3, 'sawtooth');
                break;
              }
            }
          }
        }

        // Update score
        const newScore = prev.score + 1;

        // Increase game speed
        const newGameSpeed = Math.min(prev.gameSpeed + 0.001, 8);

        return {
          ...prev,
          playerY: newPlayerY,
          playerVelocity: newPlayerVelocity,
          isJumping: newIsJumping,
          obstacles: newObstacles,
          score: newScore,
          gameOver: newGameOver,
          gameSpeed: newGameSpeed
        };
      });
      // Move ground and background for parallax effect
      setGroundOffset(prev => (prev - gameState.gameSpeed * 2) % 80);
      setBgOffset(prev => (prev - gameState.gameSpeed * 0.5) % 400);
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, playSound, gameState.gameSpeed]);

  // Allow game start by spacebar
  useEffect(() => {
    if (!gameState.gameStarted && waitingForStart) {
      const handleStartKey = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          e.preventDefault();
          setWaitingForStart(false);
          startGame();
        }
      };
      window.addEventListener('keydown', handleStartKey);
      return () => window.removeEventListener('keydown', handleStartKey);
    }
  }, [gameState.gameStarted, waitingForStart, startGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleJump]);

  // On game over, reset to waiting for start
  useEffect(() => {
    if (gameState.gameOver) {
      setTimeout(() => {
        setWaitingForStart(true);
        setGameState(prev => ({
          ...prev,
          gameStarted: false,
          gameOver: false,
          score: 0,
          playerY: 0,
          playerVelocity: 0,
          obstacles: [],
          gameSpeed: 3
        }));
      }, 500); // short delay for feedback
    }
  }, [gameState.gameOver]);

  if (!gameState.gameStarted || waitingForStart) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
            GEOMETRY DASH
          </h1>
          <div className="space-y-4">
            <div className="text-lg text-blue-200 mb-2 animate-bounce">
              Play for a bit while we reconnect your internet...<br/>
              (Press SPACE to start)
            </div>
            {/* Pulsing dot only when waiting to start */}
            <div className="mx-auto w-6 h-6 bg-yellow-300 rounded-full animate-pulse shadow-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Parallax background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 40px, transparent 40px 80px)`,
          backgroundPositionX: `${bgOffset}px`,
          transition: 'background-position-x 0.1s linear',
        }}
      />
      {/* Background grid */}
      <div className="absolute inset-0 opacity-20 z-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-px bg-white"
            style={{ left: `${i * 5}%` }}
          />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-white"
            style={{ top: `${i * 10}%` }}
          />
        ))}
      </div>
      {/* Score display */}
      <div className="absolute top-8 left-8 z-10">
        <div className="text-4xl font-bold text-white drop-shadow-lg">
          Score: {gameState.score}
        </div>
        <div className="text-lg text-gray-300">
          Speed: {gameState.gameSpeed.toFixed(1)}x
        </div>
      </div>
      {/* Game area */}
      <div className="relative w-full h-full z-10">
        {/* Player */}
        <div 
          className="absolute w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg z-20 animate-pulse"
          style={{
            left: '100px',
            bottom: `${128 + gameState.playerY}px`,
            transform: `rotate(${gameState.playerVelocity * 2}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
        </div>
        {/* Ground - solid color */}
        <div
          className="absolute bottom-0 left-0 w-full h-32 z-10 bg-gray-800"
          style={{
            borderTop: '4px solid #222',
          }}
        />
        {/* Obstacles */}
        {gameState.obstacles.map(obstacle => {
          if (obstacle.type === 'spike') {
            return (
              <div
                key={obstacle.id}
                className="absolute z-20 bg-gradient-to-t from-red-600 to-red-400 clip-path-triangle"
                style={{
                  left: `${obstacle.x}px`,
                  bottom: `128px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`,
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                }}
              />
            );
          } else if (obstacle.type === 'block') {
            return (
              <div
                key={obstacle.id}
                className="absolute z-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg"
                style={{
                  left: `${obstacle.x}px`,
                  bottom: `128px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`
                }}
              />
            );
          } else if (obstacle.type === 'tallBlock') {
            return (
              <div
                key={obstacle.id}
                className="absolute z-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border-2 border-white"
                style={{
                  left: `${obstacle.x}px`,
                  bottom: `128px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`
                }}
              />
            );
          } else if (obstacle.type === 'floatingBlock') {
            return (
              <div
                key={obstacle.id}
                className="absolute z-20 bg-gradient-to-br from-yellow-400 to-green-400 rounded-lg border-2 border-white shadow-lg"
                style={{
                  left: `${obstacle.x}px`,
                  bottom: `${128 + obstacle.y}px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`
                }}
              />
            );
          }
          return null;
        })}
      </div>
      {/* Controls hint */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center z-30">
        <div className="text-white text-lg font-semibold drop-shadow-lg">
          Press SPACE or UP ARROW to jump
        </div>
        <div className="text-gray-300 text-sm mt-2">
          Avoid obstacles and survive as long as possible!
      </div>
      </div>
    </div>
  );
} 