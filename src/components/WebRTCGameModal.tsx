'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  x: number
  y: number
  color: string
  health: number
  lastShot: number
  rotation: number
}

interface Pulse {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  playerId: string
  color: string
}

interface WebRTCGameModalProps {
  isOpen: boolean
  onClose: () => void
}

const WebRTCGameModal: React.FC<WebRTCGameModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const keysRef = useRef<Set<string>>(new Set())
  
  // Game state
  const [players, setPlayers] = useState<Map<string, Player>>(new Map())
  const [pulses, setPulses] = useState<Pulse[]>([])
  const [gameStarted, setGameStarted] = useState(false)
  const [localPlayerId] = useState(() => Math.random().toString(36).substr(2, 9))
  
  // WebRTC state
  const [connections, setConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const [isHost, setIsHost] = useState(false)
  const [offerCode, setOfferCode] = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [connectionCode, setConnectionCode] = useState('')

  // Initialize local player
  useEffect(() => {
    if (gameStarted) {
      // Initialize local player
      const localPlayer: Player = {
        id: localPlayerId,
        x: Math.random() * 850 + 25,
        y: Math.random() * 450 + 25,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        health: 3,
        lastShot: 0,
        rotation: 0
      }
      setPlayers(new Map([[localPlayerId, localPlayer]]))
    }
  }, [gameStarted, localPlayerId])

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase())
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isOpen])

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameStarted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Update local player
    setPlayers(prevPlayers => {
      const newPlayers = new Map(prevPlayers)
      const localPlayer = newPlayers.get(localPlayerId)
      if (!localPlayer) return prevPlayers

      const speed = 0.12
      let newX = localPlayer.x
      let newY = localPlayer.y
      let newRotation = localPlayer.rotation

      // Movement with rotation facing direction
      let isMoving = false
      let targetRotation = localPlayer.rotation
      
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
        newY -= speed
        targetRotation = 0 // Face up
        isMoving = true
      }
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
        newY += speed
        targetRotation = 180 // Face down
        isMoving = true
      }
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
        newX -= speed
        targetRotation = 270 // Face left
        isMoving = true
      }
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
        newX += speed
        targetRotation = 90 // Face right
        isMoving = true
      }

      // Handle diagonal movement
      if ((keysRef.current.has('w') || keysRef.current.has('arrowup')) && 
          (keysRef.current.has('d') || keysRef.current.has('arrowright'))) {
        targetRotation = 45 // Up-right
      } else if ((keysRef.current.has('w') || keysRef.current.has('arrowup')) && 
                 (keysRef.current.has('a') || keysRef.current.has('arrowleft'))) {
        targetRotation = 315 // Up-left
      } else if ((keysRef.current.has('s') || keysRef.current.has('arrowdown')) && 
                 (keysRef.current.has('d') || keysRef.current.has('arrowright'))) {
        targetRotation = 135 // Down-right
      } else if ((keysRef.current.has('s') || keysRef.current.has('arrowdown')) && 
                 (keysRef.current.has('a') || keysRef.current.has('arrowleft'))) {
        targetRotation = 225 // Down-left
      }

      // Smooth rotation towards target when moving
      if (isMoving) {
        // Calculate shortest rotation path
        let rotationDiff = targetRotation - newRotation
        if (rotationDiff > 180) rotationDiff -= 360
        if (rotationDiff < -180) rotationDiff += 360
        
        // Smooth rotation
        newRotation += rotationDiff * 0.15
        
        // Normalize rotation
        if (newRotation < 0) newRotation += 360
        if (newRotation >= 360) newRotation -= 360
      }

      // Boundaries
      newX = Math.max(7, Math.min(canvas.width - 7, newX))
      newY = Math.max(7, Math.min(canvas.height - 7, newY))

      // Shooting
      const now = Date.now()
      if (keysRef.current.has(' ') && now - localPlayer.lastShot > 2000) {
        // Calculate shooting direction based on player rotation
        const angle = (newRotation * Math.PI) / 180
        const bulletSpeed = 0.4 // Even slower bullet speed
        
        const newPulse: Pulse = {
          id: Math.random().toString(36).substr(2, 9),
          x: newX,
          y: newY,
          dx: Math.sin(angle) * bulletSpeed,
          dy: -Math.cos(angle) * bulletSpeed,
          playerId: localPlayerId,
          color: localPlayer.color
        }
        setPulses(prev => [...prev, newPulse])
        localPlayer.lastShot = now
      }

      newPlayers.set(localPlayerId, { ...localPlayer, x: newX, y: newY, rotation: newRotation })
      return newPlayers
    })

    // Update pulses
    setPulses(prevPulses => {
      return prevPulses
        .map(pulse => ({
          ...pulse,
          x: pulse.x + pulse.dx,
          y: pulse.y + pulse.dy
        }))
        .filter(pulse => 
          pulse.x > -50 && pulse.x < canvas.width + 50 && 
          pulse.y > -50 && pulse.y < canvas.height + 50
        )
    })

    // Draw players
    players.forEach(player => {
      ctx.save()
      ctx.translate(player.x, player.y)
      ctx.rotate((player.rotation * Math.PI) / 180)
      
      // Draw player as a rotating triangle
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(-5, 5)
      ctx.lineTo(5, 5)
      ctx.closePath()
      ctx.fill()
      
      ctx.restore()
    })

    // Draw pulses
    pulses.forEach(pulse => {
      ctx.fillStyle = pulse.color
      ctx.beginPath()
      ctx.arc(pulse.x, pulse.y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameStarted, players, pulses, localPlayerId])

  useEffect(() => {
    if (gameStarted) {
      gameLoop()
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameLoop, gameStarted])

  const generateSimpleCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const startAsHost = () => {
    setIsHost(true)
    setGameStarted(true)
    // Generate simple 6-character code
    setOfferCode(generateSimpleCode())
  }

  const generateOffer = async () => {
    // Generate simple 6-character code
    setOfferCode(generateSimpleCode())
  }

  const handleJoinGame = () => {
    if (connectionCode.trim().length === 6) {
      // Simulate joining by adding a remote player
      const remotePlayer: Player = {
        id: `host-${connectionCode}`,
        x: Math.random() * 850 + 25,
        y: Math.random() * 450 + 25,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        health: 3,
        lastShot: 0,
        rotation: 0
      }
      
      setGameStarted(true)
      setPlayers(prev => {
        const newPlayers = new Map(prev)
        newPlayers.set(remotePlayer.id, remotePlayer)
        return newPlayers
      })
      
      console.log('Joined game with code:', connectionCode)
    } else {
      alert('Please enter a valid 6-character game code!')
    }
  }

  const exitGame = () => {
    setGameStarted(false)
    setIsHost(false)
    setOfferCode('')
    setConnectionCode('')
    setPlayers(new Map())
    setPulses([])
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-[95vw] h-[90vh] max-w-5xl flex flex-col mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-purple-500">⚡</span>
                Pulse Battle Game
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!gameStarted ? (
                <div className="space-y-6 h-full flex flex-col justify-center">
                  <div className="text-center">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to Pulse Battle!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-base">
                        Choose how to play and start your adventure
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                      {/* Host Game */}
                      <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 transition-colors bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🎮</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Host Game</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Start a new game and invite friends to join
                          </p>
                        </div>
                        <button
                          onClick={startAsHost}
                          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-lg hover:shadow-xl"
                        >
                          Start New Game
                        </button>
                        {isHost && (
                          <div className="mt-4">
                            <button
                              onClick={generateOffer}
                              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                            >
                              Generate Connection Code
                            </button>
                            {offerCode && (
                              <div className="mt-3">
                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  Share this code with friends:
                                </label>
                                <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3">
                                  <textarea
                                    value={offerCode}
                                    readOnly
                                    className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 text-center font-mono tracking-wider"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Join Game */}
                      <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <div className="text-center mb-4">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-2xl">🚀</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Join Game</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enter a connection code to join an existing game
                          </p>
                        </div>
                        <div className="space-y-3">
                          <input
                            value={connectionCode}
                            onChange={(e) => setConnectionCode(e.target.value.toUpperCase().slice(0, 6))}
                            placeholder="Enter 6-character code..."
                            className="w-full p-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 text-center font-mono tracking-widest focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                            maxLength={6}
                          />
                          <button
                            onClick={handleJoinGame}
                            disabled={connectionCode.trim().length !== 6}
                            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
                          >
                            Join Game
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col">
                  {/* Game Canvas */}
                  <div className="flex justify-center flex-shrink-0">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={900}
                        height={380}
                        className="border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-900 shadow-lg"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm">
                        Players online: {players.size}
                      </div>
                    </div>
                  </div>

                  {/* Connection Code for Host */}
                  {isHost && offerCode && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 p-4 rounded-xl flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-500">🎯</span>
                        <label className="block text-sm font-medium text-green-700 dark:text-green-300">
                          Share this game code with friends:
                        </label>
                      </div>
                      <div
                        className="w-full p-3 text-center text-xl font-mono tracking-widest border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg dark:bg-gray-800 bg-white cursor-pointer select-all hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                        onClick={(e) => {
                          window.getSelection()?.selectAllChildren(e.currentTarget)
                          navigator.clipboard?.writeText(offerCode)
                        }}
                      >
                        {offerCode}
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                        ✨ Click to select and copy • Share with friends to play together
                      </p>
                    </div>
                  )}

                  {/* Game Controls */}
                  <div className="flex justify-between items-center flex-shrink-0 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500">⌨️</span>
                          <span>WASD/Arrows: Move</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-red-500">🎯</span>
                          <span>Space: Shoot (2s cooldown)</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={exitGame}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                    >
                      <span>🚪</span>
                      Exit Game
                    </button>
                  </div>

                  {/* Player Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
                    {Array.from(players.values()).map(player => (
                      <div 
                        key={player.id}
                        className="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="w-4 h-4 rounded-full mx-auto mb-2 border-2 border-white shadow-sm" 
                          style={{ backgroundColor: player.color }}
                        />
                        <div className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
                          {player.id === localPlayerId ? '👤 You' : `🤖 P${player.id.slice(0, 2)}`}
                        </div>
                        <div className="text-sm flex items-center justify-center gap-1">
                          <span>❤️</span>
                          <span className="font-bold">{player.health}/3</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WebRTCGameModal
