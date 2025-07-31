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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-lg p-3 w-[98vw] h-[98vh] max-w-6xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pulse Battle Game
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!gameStarted ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                      Welcome to Pulse Battle! Choose how to play:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Host Game */}
                      <div className="p-3 border rounded-lg dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Host Game</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Start a new game and invite others
                        </p>
                        <button
                          onClick={startAsHost}
                          className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm"
                        >
                          Start Game
                        </button>
                        {isHost && (
                          <div className="mt-2">
                            <button
                              onClick={generateOffer}
                              className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Generate Connection Code
                            </button>
                            {offerCode && (
                              <div className="mt-1">
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Share this code:
                                </label>
                                <textarea
                                  value={offerCode}
                                  readOnly
                                  className="w-full p-1 text-xs border rounded dark:bg-gray-800 dark:border-gray-700"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Join Game */}
                      <div className="p-3 border rounded-lg dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Join Game</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Enter a connection code to join
                        </p>
                        <input
                          value={connectionCode}
                          onChange={(e) => setConnectionCode(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="Enter 6-character code..."
                          className="w-full p-2 text-xs border rounded dark:bg-gray-800 dark:border-gray-700 mb-2 text-center font-mono tracking-widest"
                          maxLength={6}
                        />
                        <button
                          onClick={handleJoinGame}
                          disabled={connectionCode.trim().length !== 6}
                          className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
                        >
                          Join Game
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 h-full flex flex-col">
                  {/* Game Canvas */}
                  <div className="flex justify-center flex-shrink-0">
                    <canvas
                      ref={canvasRef}
                      width={900}
                      height={380}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-900"
                    />
                  </div>

                  {/* Connection Code for Host */}
                  {isHost && offerCode && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex-shrink-0">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Share this game code with friends:
                      </label>
                      <div
                        className="w-full p-2 text-center text-lg font-mono tracking-widest border rounded dark:bg-gray-900 dark:border-gray-700 bg-white cursor-pointer select-all"
                        onClick={(e) => {
                          window.getSelection()?.selectAllChildren(e.currentTarget)
                          navigator.clipboard?.writeText(offerCode)
                        }}
                      >
                        {offerCode}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Click to select and copy</p>
                    </div>
                  )}

                  {/* Game Controls */}
                  <div className="flex justify-between items-center flex-shrink-0">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <p>WASD/Arrows: Move • Space: Shoot (2s cooldown)</p>
                      <p>Players online: {players.size}</p>
                    </div>
                    <button
                      onClick={exitGame}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      Exit Game
                    </button>
                  </div>

                  {/* Player Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1 flex-shrink-0">
                    {Array.from(players.values()).map(player => (
                      <div 
                        key={player.id}
                        className="p-1 rounded border dark:border-gray-700 text-center text-xs"
                      >
                        <div 
                          className="w-2 h-2 rounded-full mx-auto mb-1" 
                          style={{ backgroundColor: player.color }}
                        />
                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                          {player.id === localPlayerId ? 'You' : `P${player.id.slice(0, 2)}`}
                        </div>
                        <div className="text-xs">❤️ {player.health}/3</div>
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
