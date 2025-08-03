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
  hitTime?: number // Track when player was hit for blink animation
  timestamp?: number // For interpolation and lag compensation
  sequence?: number // For input reconciliation
  invisibilityEnd?: number // When invisibility powerup ends
  bombCount?: number // Number of bombs the player has
  lastBombThrow?: number // When player last threw a bomb
}

interface Pulse {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  playerId: string
  color: string
  damage?: number
  timestamp?: number
  speed?: number // Add speed property for bullet interpolation
}

interface Obstacle {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'wall' | 'rock'
}

interface Powerup {
  id: string
  x: number
  y: number
  type: 'invisibility' | 'bomb'
  timestamp: number // When it was spawned
  duration?: number // How long the effect lasts (for when picked up)
}

interface Bomb {
  id: string
  x: number
  y: number
  dx: number
  dy: number
  playerId: string
  color: string
  timestamp: number
  explodeTime: number // When the bomb will explode
  speed: number
}

interface Explosion {
  id: string
  x: number
  y: number
  timestamp: number
  radius: number
}

interface GameModalProps {
  isOpen: boolean
  onClose: () => void
}

const GameModal: React.FC<GameModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const keysRef = useRef<Set<string>>(new Set())
  const gameStateIntervalRef = useRef<NodeJS.Timeout>()
  const channelRef = useRef<BroadcastChannel | null>(null)
  const playersRef = useRef<Map<string, Player>>(new Map())
  const pulsesRef = useRef<Pulse[]>([])
  const powerupsRef = useRef<Powerup[]>([]) // Add powerups ref
  const bombsRef = useRef<Bomb[]>([]) // Add bombs ref
  const explosionsRef = useRef<Explosion[]>([]) // Add explosions ref
  const lastMovementSync = useRef<number>(0) // Movement sync debouncing
  const lastWorldStateSync = useRef<number>(0) // World state sync debouncing
  const lastBulletSync = useRef<number>(0) // Bullet-specific sync for smoothness
  const lastBombSync = useRef<number>(0) // Bomb-specific sync for smoothness
  const inputBuffer = useRef<any[]>([]) // Store input history for reconciliation
  const lastServerState = useRef<Player | null>(null) // Store last confirmed server state
  const shootingRequested = useRef<boolean>(false) // Track shooting requests to prevent spam
  const spacePressed = useRef<boolean>(false) // Track space key state to prevent holding
  const lastShootingRequest = useRef<number>(0) // Track last shooting request time
  const seenBulletIds = useRef<Set<string>>(new Set()) // Track seen bullet IDs to prevent duplicates
  const movementSyncInterval = useRef<NodeJS.Timeout>() // Movement sync interval
  const worldStateSyncInterval = useRef<NodeJS.Timeout>() // World state sync interval
  const bulletSyncInterval = useRef<NodeJS.Timeout>() // High-frequency bullet sync interval
  const bombSyncInterval = useRef<NodeJS.Timeout>() // High-frequency bomb sync interval
  const lastSuccessfulShot = useRef<number>(0) // Track last successful shot globally
  const localBulletPositions = useRef<Map<string, {x: number, y: number, lastUpdate: number}>>(new Map()) // Track local bullet positions
  const localBombPositions = useRef<Map<string, {x: number, y: number, lastUpdate: number}>>(new Map()) // Track local bomb positions
  const recoilRef = useRef<{active: boolean, angle: number, intensity: number}>({ active: false, angle: 0, intensity: 0 }) // Recoil effect ref
  const screenShakeRef = useRef<{active: boolean, intensity: number}>({ active: false, intensity: 0 }) // Screen shake ref
  const obstaclesHash = useRef<string>('') // Track obstacles hash to prevent unnecessary updates
  
  // Game state
  const [players, setPlayers] = useState<Map<string, Player>>(new Map())
  const [pulses, setPulses] = useState<Pulse[]>([])
  const [obstacles, setObstacles] = useState<Obstacle[]>([])
  const [powerups, setPowerups] = useState<Powerup[]>([]) // Add powerups state
  const [bombs, setBombs] = useState<Bomb[]>([]) // Add bombs state
  const [explosions, setExplosions] = useState<Explosion[]>([]) // Add explosions state
  const [gameStarted, setGameStarted] = useState(false)
  const [localPlayerId] = useState(() => Math.random().toString(36).substr(2, 9))
  const [currentGameCode, setCurrentGameCode] = useState('')
  const [hitPlayers, setHitPlayers] = useState<Set<string>>(new Set()) // Track hit players for animation
  const [gameEnded, setGameEnded] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [isEliminated, setIsEliminated] = useState(false)
  
  // Recoil effect state
  const [recoilEffect, setRecoilEffect] = useState<{active: boolean, angle: number, intensity: number}>({
    active: false, 
    angle: 0, 
    intensity: 0
  })
  const [screenShake, setScreenShake] = useState<{active: boolean, intensity: number}>({
    active: false,
    intensity: 0
  })
  
  // Client-side prediction and lag compensation
  const [localPlayerState, setLocalPlayerState] = useState<Player | null>(null)
  const [serverReconciliation, setServerReconciliation] = useState<Map<string, Player>>(new Map())
  const [inputSequence, setInputSequence] = useState(0)
  const [pendingInputs, setPendingInputs] = useState<any[]>([])
  const lastServerUpdate = useRef<number>(0)
  const interpolationBuffer = useRef<Map<string, Player[]>>(new Map())
  
  // Update refs when state changes
  useEffect(() => {
    playersRef.current = players
  }, [players])
  
  useEffect(() => {
    pulsesRef.current = pulses
  }, [pulses])

  useEffect(() => {
    powerupsRef.current = powerups
  }, [powerups])

  useEffect(() => {
    bombsRef.current = bombs
  }, [bombs])

  useEffect(() => {
    explosionsRef.current = explosions
  }, [explosions])

  // Add obstacle ref to keep collision detection in sync
  const obstaclesRef = useRef<Obstacle[]>([])
  useEffect(() => {
    obstaclesRef.current = obstacles
  }, [obstacles])
  
  // Helper function to check collision between player and obstacles
  const checkPlayerObstacleCollision = useCallback((x: number, y: number, radius: number = 7): boolean => {
    const currentObstacles = obstaclesRef.current
    
    for (const obstacle of currentObstacles) {
      // Check collision between circle (player) and rectangle (obstacle)
      // Use exact collision detection - if player center gets within obstacle bounds
      const closestX = Math.max(obstacle.x, Math.min(x, obstacle.x + obstacle.width))
      const closestY = Math.max(obstacle.y, Math.min(y, obstacle.y + obstacle.height))
      const distanceX = x - closestX
      const distanceY = y - closestY
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
      
      if (distance <= radius) {
        return true
      }
    }
    return false
  }, []) // Remove obstacles dependency to prevent recreation
  
  // Helper function to check collision between player and powerups
  const checkPlayerPowerupCollision = useCallback((x: number, y: number, radius: number = 7): Powerup | null => {
    const currentPowerups = powerupsRef.current
    
    for (const powerup of currentPowerups) {
      // Check collision between player (circle) and powerup (circle)
      const distanceX = x - powerup.x
      const distanceY = y - powerup.y
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
      
      // Powerup radius is 10, player radius is 7, so collision at distance <= 17
      if (distance <= radius + 10) {
        return powerup
      }
    }
    return null
  }, [])
  
  // WebRTC state
  const [connections, setConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const [isHost, setIsHost] = useState(false)
  const [offerCode, setOfferCode] = useState('')
  const [answerCode, setAnswerCode] = useState('')
  const [connectionCode, setConnectionCode] = useState('')

  // Initialize local player
  useEffect(() => {
    if (gameStarted && !localPlayerState) {
      // Initialize local player with random spawn position
      const canvasWidth = 1000
      const canvasHeight = 450
      const margin = 20 // Keep players away from edges
      
      const localPlayer: Player = {
        id: localPlayerId,
        x: margin + Math.random() * (canvasWidth - 2 * margin), // Random X within safe bounds
        y: margin + Math.random() * (canvasHeight - 2 * margin), // Random Y within safe bounds
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        health: 3,
        lastShot: 0,
        rotation: Math.random() * 360, // Random initial rotation
        timestamp: Date.now(),
        sequence: 0
      }
      
      // console.log(`🎮 Local player initialized with random position:`, localPlayer)
      
      // Set both local player state and players map immediately
      setLocalPlayerState(localPlayer)
      setPlayers(new Map([[localPlayerId, localPlayer]]))
      playersRef.current.set(localPlayerId, localPlayer)
      
      // console.log(`🎮 Local player initialized: ${localPlayerId}`, localPlayer)
      
      // Force immediate sync to server after initialization
      if (currentGameCode) {
        setTimeout(async () => {
          try {
            const payload = {
              type: 'initial',
              playerId: localPlayerId,
              playerData: {
                ...localPlayer,
                health: 3, // Explicitly set health
                timestamp: Date.now()
              },
              pulses: []
            }

            const response = await fetch(`/api/game/${currentGameCode}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            
            if (response.ok) {
              // console.log(`✅ Player synced to server successfully`)
            } else {
              console.error('Failed to sync player to server')
            }
          } catch (error) {
            console.error('Error syncing player to server:', error)
          }
        }, 100) // Small delay to ensure game code is set
      }
    }
  }, [gameStarted, localPlayerId, currentGameCode, localPlayerState])

  // Keyboard handlers with proper shooting prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current.add(key)
      
      // Handle space key for shooting - only trigger once per press
      if (key === ' ' && !spacePressed.current) {
        spacePressed.current = true
        // Trigger shooting immediately on key press with proper cooldown check
        if (gameStarted && localPlayerId) {
          const currentPlayer = localPlayerState || playersRef.current.get(localPlayerId)
          if (currentPlayer) {
            const now = Date.now()
            // Use the most recent shot time from either local player or global tracking
            const lastShotTime = Math.max(currentPlayer.lastShot || 0, lastSuccessfulShot.current)
            
            // Strict cooldown check - must wait full 2 seconds AND not already have a pending request
            if (now - lastShotTime >= 2000 && !shootingRequested.current) {
              // Set a flag to trigger shooting in the next game loop
              shootingRequested.current = true
              // console.log(`🔫 Shooting requested - last shot: ${now - lastShotTime}ms ago`)
            } else if (shootingRequested.current) {
              // console.log(`🚫 Shooting blocked - already have pending request`)
            } else {
              const remainingCooldown = 2000 - (now - lastShotTime)
              // console.log(`🚫 Shooting blocked - cooldown remaining: ${remainingCooldown}ms`)
            }
          }
        }
      }

      // Handle B key for bomb throwing
      if (key === 'b' && gameStarted && localPlayerId) {
        const currentPlayer = localPlayerState || playersRef.current.get(localPlayerId)
        if (currentPlayer && (currentPlayer.bombCount || 0) > 0) {
          const now = Date.now()
          const lastBombTime = currentPlayer.lastBombThrow || 0
          
          // Bomb throwing cooldown - 1 second
          if (now - lastBombTime >= 1000) {
            // Send bomb throw request to server
            if (currentGameCode) {
              const payload = {
                type: 'bomb_throw',
                playerId: localPlayerId,
                playerData: {
                  x: currentPlayer.x,
                  y: currentPlayer.y,
                  rotation: currentPlayer.rotation,
                  timestamp: now
                }
              }
              
              fetch(`/api/game/${currentGameCode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              }).catch(error => console.error('Error sending bomb throw:', error))
              
              console.log(`💣 Bomb thrown by player ${localPlayerId}`)
            }
          } else {
            const remainingCooldown = 1000 - (now - lastBombTime)
            console.log(`🚫 Bomb throw blocked - cooldown remaining: ${remainingCooldown}ms`)
          }
        } else {
          console.log(`🚫 No bombs available to throw`)
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current.delete(key)
      
      // Reset space key state when released
      if (key === ' ') {
        spacePressed.current = false
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('keyup', handleKeyUp)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isOpen, gameStarted, localPlayerId, localPlayerState])

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      // Close BroadcastChannel when modal closes
      if (channelRef.current) {
        channelRef.current.close()
        channelRef.current = null
      }
      
      // Clear intervals
      if (gameStateIntervalRef.current) {
        clearInterval(gameStateIntervalRef.current)
      }
      if (movementSyncInterval.current) {
        clearInterval(movementSyncInterval.current)
      }
      if (worldStateSyncInterval.current) {
        clearInterval(worldStateSyncInterval.current)
      }
      if (bulletSyncInterval.current) {
        clearInterval(bulletSyncInterval.current)
      }
      if (bombSyncInterval.current) {
        clearInterval(bombSyncInterval.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      // Reset all game state when modal closes
      setGameStarted(false)
      setGameEnded(false)
      setIsEliminated(false)
      setWinner(null)
      setLocalPlayerState(null)
      setPlayers(new Map())
      setPulses([])
      setObstacles([])
      setPowerups([]) // Add powerup cleanup
      setBombs([]) // Add bomb cleanup
      setExplosions([]) // Add explosion cleanup
      setHitPlayers(new Set())
      
      // Clear all refs
      keysRef.current.clear()
      playersRef.current.clear()
      pulsesRef.current = []
      powerupsRef.current = [] // Add powerup ref cleanup
      bombsRef.current = [] // Add bomb ref cleanup
      shootingRequested.current = false
      spacePressed.current = false
      lastShootingRequest.current = 0
      lastSuccessfulShot.current = 0 // Reset global shot tracking
      seenBulletIds.current.clear() // Clear bullet tracking
      localBulletPositions.current.clear() // Clear local bullet positions
      localBombPositions.current.clear() // Clear local bomb positions
      
      // console.log('🧹 Modal closed - all state cleaned up')
    }
  }, [isOpen])

  // Load other players from localStorage

  // Sync game state with optimized separated architecture
  useEffect(() => {
    if (gameStarted && currentGameCode) {
      
      // MOVEMENT SYNC: Fast, client-prediction based
      const syncMovementToServer = async () => {
        const now = Date.now()
        
        // 30 FPS movement sync for responsiveness
        if (now - lastMovementSync.current < 33) {
          return
        }
        lastMovementSync.current = now
        
        const localPlayer = localPlayerState || playersRef.current.get(localPlayerId)
        if (!localPlayer) {
          return
        }

        try {
          const currentSequence = inputSequence
          setInputSequence(prev => prev + 1)
          
          // Store input in buffer for reconciliation
          inputBuffer.current.push({
            sequence: currentSequence,
            state: { ...localPlayer },
            timestamp: now
          })
          
          // Keep only last 10 inputs for reconciliation
          if (inputBuffer.current.length > 10) {
            inputBuffer.current.shift()
          }
          
          // Movement-only payload
          const payload = {
            type: 'movement',
            playerId: localPlayerId,
            playerData: {
              id: localPlayer.id,
              x: Math.round(localPlayer.x * 100) / 100,
              y: Math.round(localPlayer.y * 100) / 100,
              rotation: Math.round(localPlayer.rotation * 10) / 10,
              sequence: currentSequence,
              timestamp: now
            }
          }

          fetch(`/api/game/${currentGameCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
          }).catch(() => {}) // Silent fail for movement updates
        } catch (error) {
          console.error('Movement sync error:', error)
        }
      }

      // WORLD STATE SYNC: Server-authoritative for bullets and health
      const syncWorldStateFromServer = async () => {
        const now = Date.now()
        
        // Conservative sync frequency for game state (5 FPS)
        if (now - lastWorldStateSync.current < 200) {
          return
        }
        lastWorldStateSync.current = now

        try {
          const response = await fetch(`/api/game/${currentGameCode}`)
          if (response.ok) {
            const gameState = await response.json()
            
            // Update obstacles only if they've actually changed or if we don't have any
            if (gameState.obstacles && Array.isArray(gameState.obstacles)) {
              const currentObstacles = obstaclesRef.current
              const serverObstacles = gameState.obstacles
              
              // Create a simple hash of obstacle data for quick comparison
              const newObstaclesHash = serverObstacles.map((o: Obstacle) => `${o.id}-${o.x}-${o.y}-${o.width}-${o.height}`).join('|')
              
              // Only update if hash is different or we have no obstacles
              if (currentObstacles.length === 0 || obstaclesHash.current !== newObstaclesHash) {
                console.log(`🔄 Updating obstacles: ${currentObstacles.length} → ${serverObstacles.length}`)
                setObstacles(serverObstacles)
                obstaclesRef.current = serverObstacles
                obstaclesHash.current = newObstaclesHash
              }
            } else {
              // Only clear obstacles if we currently have some (prevent unnecessary clears)
              if (obstaclesRef.current.length > 0) {
                console.log(`🗑️ Clearing obstacles`)
                setObstacles([])
                obstaclesRef.current = []
                obstaclesHash.current = ''
              }
            }

            // FAST BULLET SYNC: Update bullets with higher frequency for smoothness
            if (gameState.pulses && Array.isArray(gameState.pulses)) {
              const serverPulses = gameState.pulses.map((serverPulse: any) => ({
                id: serverPulse.id,
                x: serverPulse.x,
                y: serverPulse.y,
                dx: serverPulse.dx,
                dy: serverPulse.dy,
                playerId: serverPulse.playerId,
                color: serverPulse.color,
                damage: serverPulse.damage || 1,
                timestamp: serverPulse.timestamp || now,
                speed: serverPulse.speed || 500 // Ensure speed is always set for smooth interpolation
              }))
              
              setPulses(serverPulses)
              pulsesRef.current = serverPulses
            } else {
              // Clear bullets if none received
              setPulses([])
              pulsesRef.current = []
            }

            // PLAYER STATE SYNC: Less frequent but authoritative
            if (gameState.players) {
              const newPlayers = new Map()
              
              // Process all players from server
              Object.entries(gameState.players).forEach(([playerId, playerData]: [string, any]) => {
                if (now - playerData.lastUpdate < 30000) { // 30 second timeout
                  const player = {
                    id: playerData.id,
                    x: playerData.x,
                    y: playerData.y,
                    color: playerData.color,
                    health: playerData.health !== undefined ? playerData.health : 3, // Ensure health is never undefined
                    lastShot: playerData.lastShot || 0,
                    rotation: playerData.rotation || 0,
                    hitTime: playerData.hitTime,
                    timestamp: playerData.timestamp || now,
                    sequence: playerData.sequence || 0,
                    // SERVER-AUTHORITATIVE: Sync powerup fields from server
                    invisibilityEnd: playerData.invisibilityEnd,
                    bombCount: playerData.bombCount || 0,
                    lastBombThrow: playerData.lastBombThrow
                  }
                  
                  if (playerId === localPlayerId) {
                    // For local player, only sync critical server-authoritative data
                    const localPlayer = localPlayerState || playersRef.current.get(localPlayerId)
                    if (localPlayer) {
                      // Check for health changes
                      if (localPlayer.health !== player.health) {
                        console.log(`💔 Local player health changed: ${localPlayer.health} → ${player.health}`)
                      }
                      
                      // Preserve the most recent lastShot time to maintain accurate cooldown
                      const mostRecentLastShot = Math.max(
                        localPlayer.lastShot || 0, 
                        player.lastShot || 0,
                        lastSuccessfulShot.current || 0
                      )
                      
                      // Only trust server position if local player hasn't moved recently (2 seconds threshold)
                      const shouldTrustServerPosition = (now - (localPlayer.timestamp || 0)) > 2000
                      
                      const reconciledPlayer = {
                        ...localPlayer, // Keep local position for responsiveness
                        // Only override position if we haven't moved recently (prevents server lag from teleporting player)
                        x: shouldTrustServerPosition ? player.x : localPlayer.x,
                        y: shouldTrustServerPosition ? player.y : localPlayer.y,
                        health: player.health, // Trust server for health
                        hitTime: player.hitTime, // Sync hit animations
                        color: player.color, // Ensure color consistency
                        lastShot: mostRecentLastShot, // Use most recent shot time
                        // SERVER-AUTHORITATIVE: Always trust server for powerup data
                        invisibilityEnd: player.invisibilityEnd,
                        bombCount: player.bombCount,
                        lastBombThrow: player.lastBombThrow
                      }
                      newPlayers.set(playerId, reconciledPlayer)
                      setLocalPlayerState(reconciledPlayer)
                    } else {
                      newPlayers.set(playerId, player)
                      setLocalPlayerState(player)
                    }
                  } else {
                    // For other players, use server position with interpolation
                    // Check for health changes in other players
                    const existingPlayer = playersRef.current.get(playerId)
                    if (existingPlayer && existingPlayer.health !== player.health) {
                      console.log(`💔 Player ${playerId} health changed: ${existingPlayer.health} → ${player.health}`)
                    }
                    newPlayers.set(playerId, player)
                  }
                }
              })
              
              setPlayers(newPlayers)
              playersRef.current = newPlayers
              
              // Check for game end conditions
              const alivePlayers = Array.from(newPlayers.values()).filter((p: any) => (p.health !== undefined ? p.health : 3) > 0)
              
              if (alivePlayers.length <= 1 && newPlayers.size > 1 && !gameEnded) {
                if (alivePlayers.length === 1) {
                  const winnerPlayer = alivePlayers[0] as any
                  setWinner(winnerPlayer.id)
                  setGameEnded(true)
                  // console.log(`🏆 WINNER: ${winnerPlayer.id}`)
                } else if (alivePlayers.length === 0) {
                  setWinner(null)
                  setGameEnded(true)
                  // console.log(`🤝 DRAW: All players eliminated`)
                }
              }

              // Check if local player is eliminated
              const localPlayer = newPlayers.get(localPlayerId)
              if (localPlayer && (localPlayer.health !== undefined ? localPlayer.health : 3) <= 0 && !isEliminated) {
                setIsEliminated(true)
                // console.log(`💀 You have been eliminated!`)
              }
            }

            // SERVER-AUTHORITATIVE POWERUPS: Sync powerups from server
            if (gameState.powerups && Array.isArray(gameState.powerups)) {
              const serverPowerups = gameState.powerups.map((serverPowerup: any) => ({
                id: serverPowerup.id,
                x: serverPowerup.x,
                y: serverPowerup.y,
                type: serverPowerup.type,
                timestamp: serverPowerup.timestamp || now,
                duration: serverPowerup.duration
              }))
              
              setPowerups(serverPowerups)
              powerupsRef.current = serverPowerups
            } else {
              // Clear powerups if none received
              setPowerups([])
              powerupsRef.current = []
            }

            // Note: Bombs are now synced separately for smoother movement
          }
        } catch (error) {
          console.error('World state sync error:', error)
          // On error, don't clear obstacles to prevent flickering in production
          // The next successful sync will update them properly
        }
      }

      // STABLE BULLET SYNC: Moderate frequency for consistent updates
      const syncBulletsFromServer = async () => {
        const now = Date.now()
        
        // Stable sync frequency for bullets (15 FPS for reliable updates without overwhelming)
        if (now - lastBulletSync.current < 67) { // ~15 FPS
          return
        }
        lastBulletSync.current = now

        try {
          const response = await fetch(`/api/game/${currentGameCode}`)
          if (response.ok) {
            const gameState = await response.json()
            
            // STABLE BULLET UPDATE: Update bullets with timestamp preservation
            if (gameState.pulses && Array.isArray(gameState.pulses)) {
              const serverPulses = gameState.pulses.map((serverPulse: any) => ({
                id: serverPulse.id,
                x: serverPulse.x,
                y: serverPulse.y,
                dx: serverPulse.dx,
                dy: serverPulse.dy,
                playerId: serverPulse.playerId,
                color: serverPulse.color,
                damage: serverPulse.damage || 1,
                timestamp: serverPulse.timestamp || now,
                speed: serverPulse.speed || 500
              }))
              
              // Always update bullets to ensure smooth sync
              setPulses(serverPulses)
              pulsesRef.current = serverPulses
              
              // Clean up local bullet positions for bullets that no longer exist
              const currentBulletIds = new Set(serverPulses.map((p: Pulse) => p.id))
              const localBulletIds = Array.from(localBulletPositions.current.keys())
              for (const bulletId of localBulletIds) {
                if (!currentBulletIds.has(bulletId)) {
                  localBulletPositions.current.delete(bulletId)
                }
              }
            }
          }
        } catch (error) {
          // Silently handle errors for sync
          console.debug('Bullet sync error:', error)
        }
      }

      // STABLE BOMB SYNC: Dedicated sync for smooth bomb movement
      const syncBombsFromServer = async () => {
        const now = Date.now()
        
        // Stable sync frequency for bombs (15 FPS for reliable updates, same as bullets)
        if (now - lastBombSync.current < 67) { // ~15 FPS
          return
        }
        lastBombSync.current = now

        try {
          const response = await fetch(`/api/game/${currentGameCode}`)
          if (response.ok) {
            const gameState = await response.json()
            
            // STABLE BOMB UPDATE: Update bombs with timestamp preservation
            if (gameState.bombs && Array.isArray(gameState.bombs)) {
              const serverBombs = gameState.bombs.map((serverBomb: any) => ({
                id: serverBomb.id,
                x: serverBomb.x,
                y: serverBomb.y,
                dx: serverBomb.dx,
                dy: serverBomb.dy,
                playerId: serverBomb.playerId,
                color: serverBomb.color,
                timestamp: serverBomb.timestamp || now,
                explodeTime: serverBomb.explodeTime,
                speed: serverBomb.speed || 200
              }))
              
              // Check for bombs that exploded (were removed from server)
              const currentBombIds = new Set(bombsRef.current.map((b: Bomb) => b.id))
              const serverBombIds = new Set(serverBombs.map((b: Bomb) => b.id))
              
              bombsRef.current.forEach(bomb => {
                if (!serverBombIds.has(bomb.id)) {
                  // This bomb was removed from server, likely exploded
                  const explosion: Explosion = {
                    id: `explosion_${bomb.id}`,
                    x: bomb.x,
                    y: bomb.y,
                    timestamp: now,
                    radius: 80 // Match server explosion radius
                  }
                  
                  setExplosions(prevExplosions => [...prevExplosions, explosion])
                  
                  // Remove explosion after animation (1 second)
                  setTimeout(() => {
                    setExplosions(prevExplosions => 
                      prevExplosions.filter(e => e.id !== explosion.id)
                    )
                  }, 1000)
                }
              })
              
              // Always update bombs to ensure smooth sync
              setBombs(serverBombs)
              bombsRef.current = serverBombs
              
              // Clean up local bomb positions for bombs that no longer exist
              const cleanupBombIds = new Set(serverBombs.map((b: Bomb) => b.id))
              const localBombIds = Array.from(localBombPositions.current.keys())
              for (const bombId of localBombIds) {
                if (!cleanupBombIds.has(bombId)) {
                  localBombPositions.current.delete(bombId)
                }
              }
            } else {
              // Clear bombs if none received
              setBombs([])
              bombsRef.current = []
            }
          }
        } catch (error) {
          // Silently handle errors for sync
          console.debug('Bomb sync error:', error)
        }
      }

      // SHOOTING HANDLER: Pure server request, no client prediction
      const handleShooting = async () => {
        if (!shootingRequested.current) return
        
        const now = Date.now()
        
        // Prevent request spam - enforce minimum 200ms between requests
        if (now - lastShootingRequest.current < 200) {
          return
        }
        
        const localPlayer = localPlayerState || playersRef.current.get(localPlayerId)
        if (!localPlayer) {
          shootingRequested.current = false
          return
        }
        
        // Strict client-side cooldown check - must wait FULL 2 seconds
        const lastShotTime = Math.max(localPlayer.lastShot || 0, lastSuccessfulShot.current)
        if (now - lastShotTime < 2000) {
          shootingRequested.current = false
          const remainingCooldown = 2000 - (now - lastShotTime)
          // console.log(`🚫 Shooting handler blocked - cooldown remaining: ${remainingCooldown}ms`)
          return
        }

        try {
          lastShootingRequest.current = now
          // Clear the shooting request flag immediately to prevent rapid fire
          shootingRequested.current = false
          
          // Send pure shooting request to server - NO bullet creation on client
          const payload = {
            type: 'shoot',
            playerId: localPlayerId,
            playerData: {
              x: localPlayer.x,
              y: localPlayer.y,
              rotation: localPlayer.rotation,
              timestamp: now
            }
          }

          // console.log(`🔫 Sending shooting request to server - last shot was ${now - (localPlayer.lastShot || 0)}ms ago`)

          const response = await fetch(`/api/game/${currentGameCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            // Update global shot tracking to prevent rapid fire
            lastSuccessfulShot.current = now
            
            // Trigger recoil effect
            const recoilAngle = localPlayer.rotation + 180 // Opposite direction of shot
            const recoilData = {
              active: true,
              angle: recoilAngle,
              intensity: 2.0 // Increased from 1.0 to 2.0 for more noticeable effect
            }
            setRecoilEffect(recoilData)
            recoilRef.current = recoilData
            
            // Trigger screen shake effect
            const shakeData = {
              active: true,
              intensity: 3.0 // Increased from 2.0 to 3.0 for more dramatic effect
            }
            setScreenShake(shakeData)
            screenShakeRef.current = shakeData
            
            // Clear effects after animation
            setTimeout(() => {
              const clearedRecoil = { active: false, angle: recoilAngle, intensity: 0 }
              const clearedShake = { active: false, intensity: 0 }
              setRecoilEffect(clearedRecoil)
              setScreenShake(clearedShake)
              recoilRef.current = clearedRecoil
              screenShakeRef.current = clearedShake
            }, 500) // Increased from 300ms to 500ms for longer effect
            
            // Update local player's lastShot for local cooldown display
            const updatedPlayer = { 
              ...localPlayer, 
              lastShot: now 
            }
            setLocalPlayerState(updatedPlayer)
            
            setPlayers(prevPlayers => {
              const newPlayers = new Map(prevPlayers)
              newPlayers.set(localPlayerId, updatedPlayer)
              return newPlayers
            })
            
            console.log(`✅ Server accepted shooting request - bullet created on server`)
          } else {
            console.error('❌ Shooting request failed:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Shooting error:', error)
        }
      }

      // Initial sync
      const doInitialSync = async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        // console.log(`🚀 Starting optimized sync for game: ${currentGameCode}`)
        await syncMovementToServer()
        await syncWorldStateFromServer()
      }
      
      doInitialSync()
      
      // Set up separated sync intervals with production-friendly frequencies
      movementSyncInterval.current = setInterval(syncMovementToServer, 100) // 10 FPS movement
      worldStateSyncInterval.current = setInterval(syncWorldStateFromServer, 200) // 5 FPS world state
      bulletSyncInterval.current = setInterval(syncBulletsFromServer, 67) // 15 FPS bullet sync for stability
      bombSyncInterval.current = setInterval(syncBombsFromServer, 67) // 15 FPS bomb sync for stability
      
      // Set up single shooting handler interval - more responsive for better cooldown feedback
      const shootingInterval = setInterval(handleShooting, 50) // Check shooting every 50ms for responsive feedback

      return () => {
        if (movementSyncInterval.current) clearInterval(movementSyncInterval.current)
        if (worldStateSyncInterval.current) clearInterval(worldStateSyncInterval.current)
        if (bulletSyncInterval.current) clearInterval(bulletSyncInterval.current)
        if (bombSyncInterval.current) clearInterval(bombSyncInterval.current)
        clearInterval(shootingInterval)
      }
    }

    return () => {
      if (movementSyncInterval.current) clearInterval(movementSyncInterval.current)
      if (worldStateSyncInterval.current) clearInterval(worldStateSyncInterval.current)
      if (bulletSyncInterval.current) clearInterval(bulletSyncInterval.current)
      if (bombSyncInterval.current) clearInterval(bombSyncInterval.current)
    }
  }, [gameStarted, currentGameCode, localPlayerId])

  // Optimized game loop with client prediction and server-authoritative bullets
  const gameLoop = useCallback(() => {
    if (!gameStarted || !canvasRef.current || gameEnded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Apply screen shake effect
    ctx.save()
    if (screenShakeRef.current.active) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current.intensity * 2
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current.intensity * 2
      ctx.translate(shakeX, shakeY)
      
      // Gradually reduce shake intensity
      screenShakeRef.current.intensity *= 0.9
      setScreenShake({ ...screenShakeRef.current })
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // CLIENT PREDICTION: Update local player movement immediately
    if (!isEliminated) {
      // Always use the most recent player state from playersRef for responsiveness
      let currentPlayer = playersRef.current.get(localPlayerId) || localPlayerState
      
      if (!currentPlayer) {
        // console.log('⚠️ Local player missing during game loop, reinitializing...')
        const canvasWidth = 1000
        const canvasHeight = 450
        const margin = 20
        
        const newLocalPlayer: Player = {
          id: localPlayerId,
          x: margin + Math.random() * (canvasWidth - 2 * margin),
          y: margin + Math.random() * (canvasHeight - 2 * margin),
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          health: 3,
          lastShot: 0,
          rotation: Math.random() * 360,
          timestamp: Date.now(),
          sequence: 0
        }
        setLocalPlayerState(newLocalPlayer)
        playersRef.current.set(localPlayerId, newLocalPlayer)
        currentPlayer = newLocalPlayer
      }
      
      if (currentPlayer && (currentPlayer.health !== undefined ? currentPlayer.health : 3) > 0) {
        const speed = 2.0
        let newX = currentPlayer.x
        let newY = currentPlayer.y
        let newRotation = currentPlayer.rotation
        const now = Date.now()

        // Movement with instant client-side prediction
        let isMoving = false
        let targetRotation = currentPlayer.rotation
        
        if (keysRef.current.has('w') || keysRef.current.has('arrowup')) {
          newY -= speed
          targetRotation = 0
          isMoving = true
        }
        if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) {
          newY += speed
          targetRotation = 180
          isMoving = true
        }
        if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) {
          newX -= speed
          targetRotation = 270
          isMoving = true
        }
        if (keysRef.current.has('d') || keysRef.current.has('arrowright')) {
          newX += speed
          targetRotation = 90
          isMoving = true
        }

        // Handle diagonal movement with proper speed normalization
        if ((keysRef.current.has('w') || keysRef.current.has('arrowup')) && 
            (keysRef.current.has('d') || keysRef.current.has('arrowright'))) {
          targetRotation = 45
          newX = currentPlayer.x + speed * 0.707
          newY = currentPlayer.y - speed * 0.707
        } else if ((keysRef.current.has('w') || keysRef.current.has('arrowup')) && 
                   (keysRef.current.has('a') || keysRef.current.has('arrowleft'))) {
          targetRotation = 315
          newX = currentPlayer.x - speed * 0.707
          newY = currentPlayer.y - speed * 0.707
        } else if ((keysRef.current.has('s') || keysRef.current.has('arrowdown')) && 
                   (keysRef.current.has('d') || keysRef.current.has('arrowright'))) {
          targetRotation = 135
          newX = currentPlayer.x + speed * 0.707
          newY = currentPlayer.y + speed * 0.707
        } else if ((keysRef.current.has('s') || keysRef.current.has('arrowdown')) && 
                   (keysRef.current.has('a') || keysRef.current.has('arrowleft'))) {
          targetRotation = 225
          newX = currentPlayer.x - speed * 0.707
          newY = currentPlayer.y + speed * 0.707
        }

        // Smooth rotation
        if (isMoving) {
          let rotationDiff = targetRotation - newRotation
          if (rotationDiff > 180) rotationDiff -= 360
          if (rotationDiff < -180) rotationDiff += 360
          
          newRotation += rotationDiff * 0.4
          
          if (newRotation < 0) newRotation += 360
          if (newRotation >= 360) newRotation -= 360
        }

        // Boundaries and obstacle collision
        newX = Math.max(7, Math.min(canvas.width - 7, newX))
        newY = Math.max(7, Math.min(canvas.height - 7, newY))
        
        // Apply recoil effect AFTER movement to ensure it's always visible
        if (recoilRef.current.active) {
          const recoilRadians = (recoilRef.current.angle * Math.PI) / 180
          const recoilDistance = 8 * recoilRef.current.intensity // Strong recoil effect
          const timeFactor = Math.max(0, 1 - ((now - lastSuccessfulShot.current) / 500)) // Fade over 500ms to match timeout
          
          // Apply recoil displacement that's additive to movement
          const recoilX = Math.sin(recoilRadians) * recoilDistance * timeFactor
          const recoilY = -Math.cos(recoilRadians) * recoilDistance * timeFactor
          
          newX += recoilX
          newY += recoilY
          
          // Ensure recoil doesn't push player out of bounds
          newX = Math.max(7, Math.min(canvas.width - 7, newX))
          newY = Math.max(7, Math.min(canvas.height - 7, newY))
          
          // Update recoil intensity based on time
          recoilRef.current.intensity *= 0.92 // Slower decay for more visible effect
          setRecoilEffect({ ...recoilRef.current })
        }
        
        // Check obstacle collision and revert position if colliding
        if (checkPlayerObstacleCollision(newX, newY)) {
          newX = currentPlayer.x
          newY = currentPlayer.y
        }

        // Prepare updated player object
        let updatedPlayer = { 
          ...currentPlayer, 
          x: newX, 
          y: newY, 
          rotation: newRotation, 
          timestamp: now 
        }

        // Check powerup collision and apply effects
        const collectedPowerup = checkPlayerPowerupCollision(newX, newY)
        if (collectedPowerup) {
          // Apply powerup effect based on type
          if (collectedPowerup.type === 'invisibility') {
            const powerupDuration = 8000 // 8 seconds of invisibility
            console.log(`🟣 Player ${localPlayerId} collected invisibility powerup!`)
            
            // Update player with invisibility effect
            updatedPlayer.invisibilityEnd = now + powerupDuration
          } else if (collectedPowerup.type === 'bomb') {
            console.log(`💣 Player ${localPlayerId} collected bomb powerup!`)
            
            // Update player with bomb (add 1 bomb to inventory, max 3)
            updatedPlayer.bombCount = Math.min((updatedPlayer.bombCount || 0) + 1, 3)
          }
          
          // Send powerup collection to server (will remove it for all players)
          if (currentGameCode) {
            const payload = {
              type: 'powerup_collect',
              playerId: localPlayerId,
              powerupId: collectedPowerup.id,
              powerupType: collectedPowerup.type,
              timestamp: now
            }
            
            fetch(`/api/game/${currentGameCode}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).catch(error => console.error('Error sending powerup collection:', error))
          }
        }

        // Update local player state immediately (client-side prediction)
        setLocalPlayerState(updatedPlayer)
        playersRef.current.set(localPlayerId, updatedPlayer) // Update ref immediately
        
        // Update players map for rendering
        setPlayers(prevPlayers => {
          const newPlayers = new Map(prevPlayers)
          newPlayers.set(localPlayerId, updatedPlayer)
          return newPlayers
        })
      }
    }

    // SERVER-AUTHORITATIVE BULLETS: No client-side physics

    // RENDERING: Draw obstacles first (background layer)
    const currentObstacles = obstaclesRef.current
    
    currentObstacles.forEach((obstacle, index) => {
      ctx.save()
      
      // Enhanced visual styles for better visibility - make them VERY visible
      if (obstacle.type === 'wall') {
        // Wall - much more contrasting colors
        ctx.fillStyle = '#000000' // Pure black
        ctx.strokeStyle = '#ffffff' // White border
        ctx.lineWidth = 4
      } else {
        // Rock - bright brown with white border
        ctx.fillStyle = '#8B4513' // SaddleBrown
        ctx.strokeStyle = '#ffffff' // White border
        ctx.lineWidth = 3
      }
      
      // Draw main obstacle body
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      
      // Add bright inner highlight for maximum visibility
      ctx.strokeStyle = '#ffff00' // Bright yellow inner border
      ctx.lineWidth = 2
      ctx.strokeRect(obstacle.x + 3, obstacle.y + 3, obstacle.width - 6, obstacle.height - 6)
      
      // Add texture details with bright colors
      if (obstacle.type === 'rock') {
        ctx.fillStyle = '#ff6600' // Bright orange dots
        // Add 3 fixed texture dots to avoid randomness in render loop
        const dots = [
          { x: obstacle.x + obstacle.width * 0.3, y: obstacle.y + obstacle.height * 0.3 },
          { x: obstacle.x + obstacle.width * 0.7, y: obstacle.y + obstacle.height * 0.5 },
          { x: obstacle.x + obstacle.width * 0.5, y: obstacle.y + obstacle.height * 0.8 }
        ]
        dots.forEach(dot => {
          ctx.beginPath()
          ctx.arc(dot.x, dot.y, 4, 0, 2 * Math.PI)
          ctx.fill()
        })
      } else {
        // Add bright metallic panels for walls
        ctx.fillStyle = '#666666' // Brighter gray
        const panelWidth = obstacle.width / 3
        const panelHeight = obstacle.height / 2
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 3; j++) {
            if ((i + j) % 2 === 0) {
              ctx.fillRect(
                obstacle.x + j * panelWidth + 2,
                obstacle.y + i * panelHeight + 2,
                panelWidth - 4,
                panelHeight - 4
              )
            }
          }
        }
      }
      
      ctx.restore()
    })

    // RENDERING: Draw powerups (between obstacles and players)
    const currentPowerups = powerupsRef.current
    
    currentPowerups.forEach(powerup => {
      ctx.save()
      
      // Create pulsing animation for powerups (reuse renderTime from below)
      const currentTime = Date.now()
      const pulseIntensity = (Math.sin(currentTime / 300) + 1) / 2 // Pulse every 600ms
      const scale = 0.8 + (pulseIntensity * 0.4) // Scale between 0.8 and 1.2
      
      ctx.translate(powerup.x, powerup.y)
      ctx.scale(scale, scale)
      
      if (powerup.type === 'invisibility') {
        // Draw invisibility powerup as a translucent crystal
        
        // Outer glow effect
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
        glowGradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)') // BlueViolet
        glowGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.4)')
        glowGradient.addColorStop(1, 'rgba(138, 43, 226, 0)')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(0, 0, 20, 0, 2 * Math.PI)
        ctx.fill()
        
        // Main powerup body - diamond shape
        ctx.fillStyle = 'rgba(138, 43, 226, 0.9)' // BlueViolet with transparency
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(7, 0)
        ctx.lineTo(0, 10)
        ctx.lineTo(-7, 0)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // Inner sparkle effect
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(-2, -3, 1.5, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(3, 2, 1, 0, 2 * Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(0, 4, 0.8, 0, 2 * Math.PI)
        ctx.fill()
        
        // Floating particles around the powerup
        const particleTime = (currentTime + powerup.timestamp) / 100
        for (let i = 0; i < 3; i++) {
          const angle = (particleTime + i * 120) % 360
          const radius = 15 + Math.sin((particleTime + i * 60) / 10) * 3
          const particleX = Math.cos(angle * Math.PI / 180) * radius
          const particleY = Math.sin(angle * Math.PI / 180) * radius
          
          ctx.fillStyle = `rgba(138, 43, 226, ${0.6 + pulseIntensity * 0.4})`
          ctx.beginPath()
          ctx.arc(particleX, particleY, 1.5, 0, 2 * Math.PI)
          ctx.fill()
        }
      } else if (powerup.type === 'bomb') {
        // Draw bomb powerup as a round bomb with fuse
        
        // Outer glow effect
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
        glowGradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)') // OrangeRed
        glowGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.4)')
        glowGradient.addColorStop(1, 'rgba(255, 69, 0, 0)')
        
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(0, 0, 20, 0, 2 * Math.PI)
        ctx.fill()
        
        // Main bomb body - circle
        ctx.fillStyle = 'rgba(50, 50, 50, 0.9)' // Dark gray
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        
        ctx.beginPath()
        ctx.arc(0, 0, 8, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        
        // Bomb fuse
        ctx.strokeStyle = '#8B4513' // SaddleBrown
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(0, -8)
        ctx.lineTo(-2, -12)
        ctx.lineTo(0, -16)
        ctx.stroke()
        
        // Sparking fuse tip
        const sparkIntensity = (Math.sin(currentTime / 100) + 1) / 2
        ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + sparkIntensity * 0.3})` // Gold
        ctx.beginPath()
        ctx.arc(0, -16, 2, 0, 2 * Math.PI)
        ctx.fill()
        
        // Bomb highlight
        ctx.fillStyle = 'rgba(150, 150, 150, 0.7)'
        ctx.beginPath()
        ctx.arc(-2, -2, 2, 0, 2 * Math.PI)
        ctx.fill()
        
        // Floating sparks around the bomb
        const sparkTime = (currentTime + powerup.timestamp) / 80
        for (let i = 0; i < 4; i++) {
          const angle = (sparkTime + i * 90) % 360
          const radius = 12 + Math.sin((sparkTime + i * 45) / 8) * 2
          const sparkX = Math.cos(angle * Math.PI / 180) * radius
          const sparkY = Math.sin(angle * Math.PI / 180) * radius
          
          ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + pulseIntensity * 0.5})`
          ctx.beginPath()
          ctx.arc(sparkX, sparkY, 1, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      
      ctx.restore()
    })

    // RENDERING: Draw all players
    const allPlayers = Array.from(playersRef.current.values())
    const playersForRendering = allPlayers.filter(player => (player.health !== undefined ? player.health : 3) > 0)
    const renderTime = Date.now()
    
    if (playersForRendering.length === 0 && localPlayerState && (localPlayerState.health !== undefined ? localPlayerState.health : 3) > 0) {
      playersForRendering.push(localPlayerState)
    }
    
    playersForRendering.forEach(player => {      
      ctx.save()
      ctx.translate(player.x, player.y)
      ctx.rotate((player.rotation * Math.PI) / 180)
      
      // Calculate player state for background colors
      const timeSinceShot = renderTime - (player.lastShot || 0)
      const isOnCooldown = timeSinceShot < 2000
      const timeSinceHit = renderTime - (player.hitTime || 0)
      const isRecentlyHit = timeSinceHit < 500 // Red flash for 500ms after being hit
      
      // Player rendering with hit blink effect
      const isHit = hitPlayers.has(player.id)
      const blinkAlpha = isHit && Math.floor(renderTime / 100) % 2 === 0 ? 0.3 : 1.0
      
      ctx.globalAlpha = blinkAlpha
      
      // Draw background circle based on player state (only for local player)
      if (player.id === localPlayerId) {
        let backgroundColorStart = 'rgba(100, 100, 100, 0.3)' // Default gray
        let backgroundColorEnd = 'rgba(100, 100, 100, 0.1)'
        let pulseSize = 15 // Default background size
        
        if (isRecentlyHit) {
          // Red background when recently hit - more intense
          const hitIntensity = 1 - (timeSinceHit / 500) // Fade from 1 to 0 over 500ms
          backgroundColorStart = `rgba(255, 20, 20, ${0.9 * hitIntensity})`
          backgroundColorEnd = `rgba(255, 20, 20, ${0.4 * hitIntensity})`
          pulseSize = 18 + (hitIntensity * 5) // Larger when just hit
        } else if (recoilRef.current.active && timeSinceShot < 500) {
          // White/blue flash during recoil for dramatic effect
          const recoilIntensity = 1 - (timeSinceShot / 500) // Updated to match 500ms duration
          backgroundColorStart = `rgba(100, 150, 255, ${0.8 * recoilIntensity})`
          backgroundColorEnd = `rgba(255, 255, 255, ${0.6 * recoilIntensity})`
          pulseSize = 20 + (recoilIntensity * 8) // Dramatic size increase during recoil
        } else if (isOnCooldown) {
          // Orange background during cooldown - more prominent and consistent
          const cooldownProgress = timeSinceShot / 2000 // 0 to 1 over 2 seconds
          const baseIntensity = 0.9 // Higher base intensity
          const intensity = baseIntensity - (cooldownProgress * 0.2) // Gradual fade but stay strong
          backgroundColorStart = `rgba(255, 140, 0, ${intensity})`
          backgroundColorEnd = `rgba(255, 140, 0, ${intensity * 0.5})`
          pulseSize = 17 + (1 - cooldownProgress) * 3 // Larger and more dynamic size
        } else {
          // Green background when ready to shoot - pulsing
          const pulseIntensity = (Math.sin(renderTime / 250) + 1) / 2 // Faster pulse when ready
          const alpha = 0.5 + (pulseIntensity * 0.4)
          backgroundColorStart = `rgba(20, 255, 20, ${alpha})`
          backgroundColorEnd = `rgba(20, 255, 20, ${alpha * 0.2})`
          pulseSize = 15 + (pulseIntensity * 3) // Gentle size pulse
        }
        
        // Create radial gradient background
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize)
        gradient.addColorStop(0, backgroundColorStart)
        gradient.addColorStop(0.7, backgroundColorEnd)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)') // Fade to transparent
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(0, 0, pulseSize, 0, 2 * Math.PI)
        ctx.fill()
        
        // Add a subtle outer ring for better definition
        if (!isRecentlyHit) {
          ctx.strokeStyle = isOnCooldown ? 'rgba(255, 140, 0, 0.8)' : 'rgba(20, 255, 20, 0.4)'
          ctx.lineWidth = isOnCooldown ? 2 : 1 // Thicker orange ring
          ctx.beginPath()
          ctx.arc(0, 0, pulseSize - 1, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
      
      // Check if player is invisible
      const isInvisible = player.invisibilityEnd && renderTime < player.invisibilityEnd
      let playerAlpha = 1.0
      
      if (isInvisible && player.invisibilityEnd) {
        // IMPORTANT: Invisible players should be completely hidden from opponents
        // but visible to themselves for feedback
        if (player.id !== localPlayerId) {
          // COMPLETELY HIDE invisible players from other players
          playerAlpha = 0.0
        } else {
          // Show reduced opacity to the invisible player themselves for feedback
          const invisibilityDuration = 8000 // Match the powerup duration
          const timeRemaining = player.invisibilityEnd - renderTime
          const timeSinceStart = invisibilityDuration - timeRemaining
          
          if (timeSinceStart < 500) {
            // Fade in over first 500ms
            playerAlpha = timeSinceStart / 500 * 0.4
          } else if (timeRemaining < 1000) {
            // Fade out over last 1000ms with blinking
            const blinkProgress = timeRemaining / 1000
            const blinkAlpha = Math.sin(renderTime / 100) * 0.5 + 0.5 // Fast blinking
            playerAlpha = blinkProgress * 0.4 * blinkAlpha
          } else {
            // Steady invisibility (40% opacity for self)
            playerAlpha = 0.4
          }
        }
        
        // Add sparkle effect only for the invisible player themselves
        if (player.id === localPlayerId && playerAlpha > 0.1) {
          for (let i = 0; i < 2; i++) {
            const sparkleAngle = (renderTime / 200 + i * 180) % 360
            const sparkleRadius = 12 + Math.sin(renderTime / 300 + i * Math.PI) * 3
            const sparkleX = Math.cos(sparkleAngle * Math.PI / 180) * sparkleRadius
            const sparkleY = Math.sin(sparkleAngle * Math.PI / 180) * sparkleRadius
            
            ctx.fillStyle = `rgba(138, 43, 226, ${playerAlpha + 0.2})`
            ctx.beginPath()
            ctx.arc(sparkleX, sparkleY, 1, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
      }
      
      // Skip rendering if player is completely invisible to this viewer
      if (playerAlpha <= 0) {
        ctx.restore()
        return
      }
      
      // Apply invisibility alpha
      ctx.globalAlpha = blinkAlpha * playerAlpha
      
      // Draw player as a rotating triangle
      ctx.fillStyle = player.color || '#ff0000'
      ctx.beginPath()
      ctx.moveTo(0, -7)
      ctx.lineTo(-5, 5)
      ctx.lineTo(5, 5)
      ctx.closePath()
      ctx.fill()
      
      // Draw outline for better visibility (adjust alpha for invisibility)
      ctx.strokeStyle = isInvisible ? `rgba(255, 255, 255, ${playerAlpha})` : '#ffffff'
      ctx.lineWidth = 1
      ctx.stroke()
      
      ctx.globalAlpha = 1.0 // Reset alpha
      
      // Draw shooting cooldown indicator for local player
      if (player.id === localPlayerId) {
        const timeSinceShot = renderTime - (player.lastShot || 0)
        const cooldownTime = 2000
        
        if (timeSinceShot < cooldownTime) {
          // Cooldown in progress - draw progress arc
          const progress = timeSinceShot / cooldownTime
          const angle = progress * 2 * Math.PI
          
          // Draw cooldown arc (completed portion)
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(0, 0, 12, -Math.PI / 2, -Math.PI / 2 + angle)
          ctx.stroke()
          
          // Draw remaining cooldown arc (incomplete portion)
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(0, 0, 12, -Math.PI / 2 + angle, -Math.PI / 2 + 2 * Math.PI)
          ctx.stroke()
          
          // Show remaining time in center
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = '8px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          const remainingTime = Math.ceil((cooldownTime - timeSinceShot) / 1000)
          ctx.fillText(remainingTime.toString(), 0, 0)
        } else {
          // Ready to shoot - draw pulsing green circle
          const pulseIntensity = (Math.sin(renderTime / 200) + 1) / 2 // Pulse every 400ms
          const alpha = 0.3 + (pulseIntensity * 0.5) // Alpha between 0.3 and 0.8
          
          // Outer pulsing ring
          ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(0, 0, 12, 0, 2 * Math.PI)
          ctx.stroke()
          
          // Inner solid green circle
          ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
          ctx.beginPath()
          ctx.arc(0, 0, 8, 0, 2 * Math.PI)
          ctx.fill()
          
          // Ready indicator
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.font = 'bold 10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('●', 0, 0) // Bullet ready indicator
        }
        
        // Show bomb count if player has bombs
        if ((player.bombCount || 0) > 0) {
          ctx.fillStyle = 'rgba(255, 69, 0, 0.8)' // OrangeRed background
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          
          // Draw bomb count indicator (small circle)
          ctx.beginPath()
          ctx.arc(15, -15, 8, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          
          // Draw bomb count number
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 10px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText((player.bombCount || 0).toString(), 15, -15)
          
          // Draw small bomb icon
          ctx.fillStyle = 'rgba(50, 50, 50, 0.9)'
          ctx.beginPath()
          ctx.arc(15, -15, 3, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      
      ctx.restore()
    })

    // RENDERING: Draw server-authoritative bullets with smooth interpolation
    const currentPulses = pulsesRef.current
    const currentTime = Date.now()
    
    currentPulses.forEach((pulse, index) => {
      // SMOOTH LOCAL INTERPOLATION: Track bullets locally for consistent movement
      let renderX = pulse.x
      let renderY = pulse.y
      
      // Get or create local position tracking for this bullet
      let localPos = localBulletPositions.current.get(pulse.id)
      
      if (!localPos) {
        // First time seeing this bullet - initialize with server position
        localPos = { x: pulse.x, y: pulse.y, lastUpdate: currentTime }
        localBulletPositions.current.set(pulse.id, localPos)
      } else {
        // Update local position with smooth interpolation
        const deltaTime = currentTime - localPos.lastUpdate
        if (deltaTime > 0 && pulse.speed && pulse.dx !== undefined && pulse.dy !== undefined) {
          // Smoothly interpolate from last local position
          const movement = (deltaTime / 1000) * pulse.speed
          localPos.x += pulse.dx * movement
          localPos.y += pulse.dy * movement
          localPos.lastUpdate = currentTime
          
          // Gradually sync with server position to prevent drift
          const syncStrength = 0.1 // 10% correction per frame
          localPos.x = localPos.x * (1 - syncStrength) + pulse.x * syncStrength
          localPos.y = localPos.y * (1 - syncStrength) + pulse.y * syncStrength
        }
      }
      
      // Use the smoothly interpolated local position
      renderX = localPos.x
      renderY = localPos.y
      
      // Enhanced client-side collision detection - prevent visual pass-through
      let shouldRenderBullet = true
      const bulletRadius = 5 // Match server BULLET_RADIUS
      
      for (const obstacle of obstaclesRef.current) {
        // Optimized circle-rectangle collision detection
        const closestX = Math.max(obstacle.x, Math.min(renderX, obstacle.x + obstacle.width))
        const closestY = Math.max(obstacle.y, Math.min(renderY, obstacle.y + obstacle.height))
        const distanceX = renderX - closestX
        const distanceY = renderY - closestY
        const distanceSquared = distanceX * distanceX + distanceY * distanceY
        
        if (distanceSquared <= bulletRadius * bulletRadius) {
          shouldRenderBullet = false
          break
        }
      }
      
      // Skip rendering if bullet hit an obstacle
      if (!shouldRenderBullet) {
        return
      }
      
      // Draw bullet with simple, smooth visual effects
      ctx.save()
      
      // Simple motion trail for visual smoothness (reduced complexity)
      if (pulse.dx !== 0 || pulse.dy !== 0) {
        const velocity = Math.sqrt(pulse.dx * pulse.dx + pulse.dy * pulse.dy)
        const speed = pulse.speed || 500
        const trailLength = Math.min(velocity * speed / 500 * 15, 25) // Simplified trail calculation
        
        // Single motion trail line (much simpler than multi-segment)
        const trailX = renderX - (pulse.dx * trailLength)
        const trailY = renderY - (pulse.dy * trailLength)
        
        const gradient = ctx.createLinearGradient(trailX, trailY, renderX, renderY)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)') // Transparent start
        gradient.addColorStop(1, pulse.color || '#00ff00') // Full color at bullet
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(trailX, trailY)
        ctx.lineTo(renderX, renderY)
        ctx.stroke()
      }
      
      // Simple glow effect
      ctx.shadowColor = pulse.color || '#00ff00'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Standard bullet size (no complex size calculations)
      const bulletSize = 4
      
      // Outer glow
      ctx.fillStyle = pulse.color?.replace(')', ', 0.4)').replace('rgb', 'rgba') || 'rgba(0, 255, 0, 0.4)'
      ctx.beginPath()
      ctx.arc(renderX, renderY, bulletSize * 1.3, 0, 2 * Math.PI)
      ctx.fill()
      
      // Main bullet body
      ctx.fillStyle = pulse.color || '#00ff00'
      ctx.beginPath()
      ctx.arc(renderX, renderY, bulletSize, 0, 2 * Math.PI)
      ctx.fill()
      
      // Inner bright core
      ctx.shadowBlur = 0
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(renderX, renderY, bulletSize * 0.5, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.restore()
    })

    // RENDERING: Draw server-authoritative bombs with smooth interpolation
    const currentBombs = bombsRef.current
    
    currentBombs.forEach((bomb, index) => {
      // SMOOTH LOCAL INTERPOLATION: Track bombs locally for consistent movement
      let renderX = bomb.x
      let renderY = bomb.y
      
      // Get or create local position tracking for this bomb
      let localPos = localBombPositions.current.get(bomb.id)
      
      if (!localPos) {
        // First time seeing this bomb - initialize with server position
        localPos = { x: bomb.x, y: bomb.y, lastUpdate: currentTime }
        localBombPositions.current.set(bomb.id, localPos)
      } else {
        // Update local position with smooth interpolation
        const deltaTime = currentTime - localPos.lastUpdate
        if (deltaTime > 0 && bomb.speed && bomb.dx !== undefined && bomb.dy !== undefined) {
          // Smoothly interpolate from last local position
          const movement = (deltaTime / 1000) * bomb.speed
          localPos.x += bomb.dx * movement
          localPos.y += bomb.dy * movement
          localPos.lastUpdate = currentTime
          
          // Gradually sync with server position to prevent drift
          const syncStrength = 0.15 // 15% correction per frame (slightly more than bullets for faster sync)
          localPos.x = localPos.x * (1 - syncStrength) + bomb.x * syncStrength
          localPos.y = localPos.y * (1 - syncStrength) + bomb.y * syncStrength
        }
      }
      
      // Use the smoothly interpolated local position
      renderX = localPos.x
      renderY = localPos.y
      
      // Check if bomb should explode soon (visual warning)
      const timeUntilExplosion = bomb.explodeTime - currentTime
      const isAboutToExplode = timeUntilExplosion <= 1000 // Warning in last 1 second
      
      // Client-side collision detection with obstacles
      let shouldRenderBomb = true
      const bombRadius = 6
      
      for (const obstacle of obstaclesRef.current) {
        const closestX = Math.max(obstacle.x, Math.min(renderX, obstacle.x + obstacle.width))
        const closestY = Math.max(obstacle.y, Math.min(renderY, obstacle.y + obstacle.height))
        const distanceX = renderX - closestX
        const distanceY = renderY - closestY
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
        
        if (distance <= bombRadius) {
          shouldRenderBomb = false
          break
        }
      }
      
      // Skip rendering if bomb hit an obstacle
      if (!shouldRenderBomb) {
        return
      }
      
      // Draw bomb with enhanced visual effects
      ctx.save()
      
      // Add smooth motion trail for flying bomb
      if (bomb.dx !== 0 || bomb.dy !== 0) {
        const velocity = Math.sqrt(bomb.dx * bomb.dx + bomb.dy * bomb.dy)
        const speed = bomb.speed || 200
        const trailLength = Math.min(velocity * speed / 200 * 12, 20) // Proportional trail length
        const trailX = renderX - (bomb.dx * trailLength)
        const trailY = renderY - (bomb.dy * trailLength)
        
        // Draw smooth motion trail
        const gradient = ctx.createLinearGradient(trailX, trailY, renderX, renderY)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(0.5, 'rgba(80, 80, 80, 0.4)')
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.8)')
        
        ctx.strokeStyle = gradient
        ctx.lineWidth = 4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(trailX, trailY)
        ctx.lineTo(renderX, renderY)
        ctx.stroke()
      }
      
      // Warning glow effect if about to explode
      if (isAboutToExplode) {
        const warningIntensity = Math.sin(currentTime / 50) * 0.5 + 0.5 // Fast blinking
        ctx.shadowColor = '#ff0000'
        ctx.shadowBlur = 15 * warningIntensity
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }
      
      // Main bomb body
      const bombSize = isAboutToExplode ? 6 + Math.sin(currentTime / 100) * 2 : 6 // Pulsing when about to explode
      ctx.fillStyle = bomb.color || '#333333'
      ctx.beginPath()
      ctx.arc(renderX, renderY, bombSize, 0, 2 * Math.PI)
      ctx.fill()
      
      // Bomb highlight
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(150, 150, 150, 0.7)'
      ctx.beginPath()
      ctx.arc(renderX - 1.5, renderY - 1.5, 2, 0, 2 * Math.PI)
      ctx.fill()
      
      // Fuse effect
      const fuseIntensity = (Math.sin(currentTime / 100) + 1) / 2
      ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + fuseIntensity * 0.3})`
      ctx.beginPath()
      ctx.arc(renderX, renderY - bombSize - 2, 1.5, 0, 2 * Math.PI)
      ctx.fill()
      
      // Outer ring for definition
      ctx.strokeStyle = isAboutToExplode ? '#ff0000' : '#ffffff'
      ctx.lineWidth = isAboutToExplode ? 2 : 1
      ctx.beginPath()
      ctx.arc(renderX, renderY, bombSize, 0, 2 * Math.PI)
      ctx.stroke()
      
      ctx.restore()
    })

    // RENDERING: Draw explosions with animated effects
    explosionsRef.current.forEach((explosion) => {
      const explosionAge = currentTime - explosion.timestamp
      const explosionDuration = 1000 // 1 second total duration
      const progress = Math.min(explosionAge / explosionDuration, 1)
      
      if (progress >= 1) return // Skip fully completed explosions
      
      ctx.save()
      
      // Explosion animation phases
      const expandPhase = Math.min(progress * 2, 1) // First half - expansion
      const fadePhase = Math.max(0, (progress - 0.5) * 2) // Second half - fade out
      
      // Current explosion radius (expands then stays)
      const currentRadius = explosion.radius * expandPhase
      
      // Multiple explosion rings for visual impact
      const rings = [
        { radius: currentRadius * 0.3, color: `rgba(255, 255, 255, ${1 - fadePhase})` },
        { radius: currentRadius * 0.5, color: `rgba(255, 200, 0, ${0.8 - fadePhase * 0.8})` },
        { radius: currentRadius * 0.7, color: `rgba(255, 100, 0, ${0.6 - fadePhase * 0.6})` },
        { radius: currentRadius * 0.9, color: `rgba(255, 50, 0, ${0.4 - fadePhase * 0.4})` },
        { radius: currentRadius, color: `rgba(200, 0, 0, ${0.2 - fadePhase * 0.2})` }
      ]
      
      // Draw rings from largest to smallest for proper layering
      rings.reverse().forEach((ring) => {
        if (ring.radius > 0) {
          ctx.fillStyle = ring.color
          ctx.beginPath()
          ctx.arc(explosion.x, explosion.y, ring.radius, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
      
      // Add sparkle effects during expansion
      if (expandPhase < 1) {
        const sparkleCount = 12
        for (let i = 0; i < sparkleCount; i++) {
          const angle = (i / sparkleCount) * 2 * Math.PI
          const sparkleDistance = currentRadius * (0.8 + Math.random() * 0.4)
          const sparkleX = explosion.x + Math.cos(angle) * sparkleDistance
          const sparkleY = explosion.y + Math.sin(angle) * sparkleDistance
          
          ctx.fillStyle = `rgba(255, 255, 100, ${0.8 - fadePhase})`
          ctx.beginPath()
          ctx.arc(sparkleX, sparkleY, 2 - progress * 2, 0, 2 * Math.PI)
          ctx.fill()
        }
      }
      
      ctx.restore()
    })

    // Restore canvas state (for screen shake)
    ctx.restore()

    animationFrameRef.current = requestAnimationFrame(gameLoop)
  }, [gameStarted, localPlayerId, currentGameCode, gameEnded, isEliminated])

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

  const startAsHost = async () => {
    const gameCode = generateSimpleCode()
    
    // Clear any existing obstacles before starting new game
    setObstacles([])
    obstaclesRef.current = []
    
    // Clear any existing powerups before starting new game
    setPowerups([])
    powerupsRef.current = []
    
    // Clear any existing bombs before starting new game
    setBombs([])
    bombsRef.current = []
    
    // Clear any existing explosions before starting new game
    setExplosions([])
    explosionsRef.current = []
    
    setIsHost(true)
    setGameStarted(true)
    setOfferCode(gameCode)
    setCurrentGameCode(gameCode)
  }

  const generateOffer = async () => {
    // Generate simple 6-character code
    setOfferCode(generateSimpleCode())
  }

  const handleJoinGame = async () => {
    if (connectionCode.trim().length === 6) {
      try {
        // Clear any existing obstacles before joining game
        setObstacles([])
        obstaclesRef.current = []
        
        // Clear any existing powerups before joining game
        setPowerups([])
        powerupsRef.current = []
        
        // Clear any existing bombs before joining game
        setBombs([])
        bombsRef.current = []
        
        // Clear any existing explosions before joining game
        setExplosions([])
        explosionsRef.current = []
        
        setCurrentGameCode(connectionCode)
        setGameStarted(true)
        setIsHost(false)
      } catch (error) {
        console.error('Error joining game:', error)
        alert('Failed to join game. Please try again.')
      }
    } else {
      alert('Please enter a valid 6-character game code!')
    }
  }

  const exitGame = async () => {
    // Remove our player from the server
    if (currentGameCode && localPlayerId) {
      try {
        await fetch(`/api/game/${currentGameCode}?playerId=${localPlayerId}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error removing player from server:', error)
      }
    }

    // Close BroadcastChannel
    if (channelRef.current) {
      channelRef.current.close()
      channelRef.current = null
    }

    // Clear intervals
    if (gameStateIntervalRef.current) {
      clearInterval(gameStateIntervalRef.current)
    }
    if (movementSyncInterval.current) {
      clearInterval(movementSyncInterval.current)
    }
    if (worldStateSyncInterval.current) {
      clearInterval(worldStateSyncInterval.current)
    }
    if (bulletSyncInterval.current) {
      clearInterval(bulletSyncInterval.current)
    }
    if (bombSyncInterval.current) {
      clearInterval(bombSyncInterval.current)
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Reset all state
    setGameStarted(false)
    setIsHost(false)
    setOfferCode('')
    setConnectionCode('')
    setCurrentGameCode('')
    setPlayers(new Map())
    setPulses([])
    setObstacles([])
    setPowerups([]) // Add powerup cleanup
    setBombs([]) // Add bomb cleanup
    setExplosions([]) // Add explosion cleanup
    setHitPlayers(new Set())
    setGameEnded(false)
    setWinner(null)
    setIsEliminated(false)
    setLocalPlayerState(null)
    
    // Reset all refs
    keysRef.current.clear()
    playersRef.current.clear()
    pulsesRef.current = []
    powerupsRef.current = [] // Add powerup ref cleanup
    bombsRef.current = [] // Add bomb ref cleanup
    inputBuffer.current = []
    lastServerState.current = null
    shootingRequested.current = false
    spacePressed.current = false
    lastShootingRequest.current = 0
    lastSuccessfulShot.current = 0 // Reset global shot tracking
    lastMovementSync.current = 0
    lastWorldStateSync.current = 0
    lastServerUpdate.current = 0
    interpolationBuffer.current.clear()
    seenBulletIds.current.clear() // Clear bullet tracking
    localBulletPositions.current.clear() // Clear local bullet positions
    localBombPositions.current.clear() // Clear local bomb positions
    
    // Reset prediction state
    setServerReconciliation(new Map())
    setInputSequence(0)
    setPendingInputs([])
    
    // console.log('🔄 Game state completely reset')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-auto pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col mx-auto my-auto overflow-hidden shadow-2xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
            style={{ minWidth: '320px' }}
          >
            {/* Top Navigation Bar */}
            <div className="flex justify-between items-center p-2 border-b border-gray-600 bg-gray-800/50">
              <button
                onClick={exitGame}
                className="text-gray-400 hover:text-blue-400 px-2 py-1 text-xs font-medium transition-colors"
              >
                BACK
              </button>
              
              {/* Center Game Code Display */}
              {gameStarted && currentGameCode && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">CODE:</span>
                    <span className="text-white font-mono text-sm tracking-wider bg-gray-700 px-2 py-1 rounded-lg border border-gray-600">
                      {currentGameCode}
                    </span>
                    <button
                      onClick={() => navigator.clipboard?.writeText(currentGameCode)}
                      className="text-gray-400 hover:text-blue-400 p-1 transition-colors"
                      title="Copy code"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Player Count */}
                  <div className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded-lg border border-gray-600">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    <span className="text-white text-xs font-medium">{players.size}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-400 p-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              {!gameStarted ? (
                <div className="h-full flex flex-col justify-center p-6">
                  <div className="text-center">
                    <h2 className="text-white text-xl font-bold mb-3">Pulse Battle Game</h2>
                    <p className="text-gray-400 mb-5 text-base">
                      Choose how to play:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                      {/* Host Game */}
                      <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                        <h3 className="font-semibold text-white mb-2 text-base">Host Game</h3>
                        <p className="text-gray-400 mb-3 text-sm">
                          Start a new game and invite others
                        </p>
                        <button
                          onClick={startAsHost}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Start Game
                        </button>
                        {isHost && (
                          <div className="mt-3">
                            <button
                              onClick={generateOffer}
                              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
                            >
                              Generate Code
                            </button>
                            {offerCode && (
                              <div className="mt-2">
                                <label className="block text-xs text-gray-400 mb-1">
                                  Share code:
                                </label>
                                <input
                                  value={offerCode}
                                  readOnly
                                  className="w-full p-2 text-center border border-gray-600 rounded-lg bg-gray-800 text-white font-mono text-sm tracking-wider"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Join Game */}
                      <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                        <h3 className="font-semibold text-white mb-2 text-base">Join Game</h3>
                        <p className="text-gray-400 mb-3 text-sm">
                          Enter a connection code to join
                        </p>
                        <input
                          value={connectionCode}
                          onChange={(e) => setConnectionCode(e.target.value.toUpperCase().slice(0, 6))}
                          placeholder="Enter 6-char code..."
                          className="w-full p-2 border border-gray-600 rounded-lg bg-gray-800 text-white text-center font-mono tracking-widest mb-3 text-sm"
                          maxLength={6}
                        />
                        <button
                          onClick={handleJoinGame}
                          disabled={connectionCode.trim().length !== 6}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          Join Game
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-0">
                  {/* Victory/Elimination Screen */}
                  {gameEnded && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                      <div className="bg-gray-800 p-8 rounded-lg text-center max-w-md mx-4 border border-gray-600">
                        {winner === localPlayerId ? (
                          <div>
                            <h2 className="text-3xl font-bold text-green-400 mb-4">🏆 VICTORY!</h2>
                            <p className="text-lg text-gray-300 mb-4">
                              Congratulations! You are the last player standing!
                            </p>
                          </div>
                        ) : winner ? (
                          <div>
                            <h2 className="text-3xl font-bold text-red-400 mb-4">💀 DEFEATED</h2>
                            <p className="text-lg text-gray-300 mb-4">
                              Player {winner.slice(0, 6)} wins the battle!
                            </p>
                          </div>
                        ) : (
                          <div>
                            <h2 className="text-3xl font-bold text-yellow-400 mb-4">🤝 DRAW</h2>
                            <p className="text-lg text-gray-300 mb-4">
                              All players eliminated! No one wins.
                            </p>
                          </div>
                        )}
                        <button
                          onClick={exitGame}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Return to Menu
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Game Canvas - Large and Centered */}
                  <div className="flex-1 flex items-center justify-center p-3 bg-gray-900/30">
                    <div className="relative w-full max-w-5xl">
                      <canvas
                        ref={canvasRef}
                        width={1000}
                        height={450}
                        className="border border-gray-600 rounded-lg bg-gray-900 w-full h-auto"
                        style={{ maxWidth: '1000px', aspectRatio: '1000/450' }}
                      />
                    </div>
                  </div>

                  {/* Bottom Player Stats Bar */}
                  <div className="p-2 border-t border-gray-700 bg-gray-800/50">
                    <div className="flex justify-center gap-2 flex-wrap">
                      {Array.from(players.values()).map(player => {
                        const now = Date.now()
                        const timeSinceShot = now - (player.lastShot || 0)
                        const isOnCooldown = timeSinceShot < 2000
                        const remainingCooldown = isOnCooldown ? Math.ceil((2000 - timeSinceShot) / 1000) : 0
                        const health = player.health !== undefined ? player.health : 3
                        const isReady = !isOnCooldown && health > 0 && player.id === localPlayerId
                        
                        return (
                          <div 
                            key={player.id || 'unknown'}
                            className={`px-3 py-2 rounded-lg border flex flex-col items-center gap-1 min-w-[100px] transition-all duration-300 ${
                              health <= 0 
                                ? 'border-red-500 bg-red-900/30' 
                                : isReady
                                ? 'border-green-400 bg-gray-700/30 shadow-lg shadow-green-400/50'
                                : 'border-gray-600 bg-gray-700/30'
                            }`}
                            style={{
                              boxShadow: isReady ? '0 0 15px rgba(74, 222, 128, 0.6), inset 0 0 10px rgba(74, 222, 128, 0.2)' : undefined
                            }}
                          >
                            {/* Player Name and Hearts Row */}
                            <div className="flex items-center gap-2 w-full justify-center">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: player.color }}
                              />
                              <span className="text-white font-medium text-xs whitespace-nowrap">
                                {player.id === localPlayerId ? 'YOU' : `P${(player.id || 'U').slice(-1)}`}
                              </span>
                              
                              {/* Health Hearts next to name */}
                              <div className="flex gap-1 flex-shrink-0">
                                {[1, 2, 3].map(heartNum => {
                                  const isHealthy = heartNum <= health
                                  return (
                                    <span 
                                      key={heartNum}
                                      className={`text-sm transition-all duration-300 ${
                                        isHealthy 
                                          ? 'text-red-500 drop-shadow-sm' 
                                          : 'text-gray-500 opacity-50'
                                      }`}
                                      style={{
                                        filter: isHealthy ? 'drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))' : 'grayscale(100%)'
                                      }}
                                    >
                                      {isHealthy ? '❤️' : '🖤'}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                            
                            
                            {/* Eliminated Status */}
                            {health <= 0 && (
                              <div className="text-red-400 text-xs font-bold">
                                ELIMINATED
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
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

export default GameModal
