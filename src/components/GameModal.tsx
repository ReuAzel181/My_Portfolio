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
  const localBulletPositions = useRef<Map<string, {x: number, y: number, lastUpdate: number, serverX: number, serverY: number}>>(new Map()) // Track local bullet positions for smooth interpolation
  const localBombPositions = useRef<Map<string, {x: number, y: number, lastUpdate: number, serverX: number, serverY: number}>>(new Map()) // Track local bomb positions
  const recoilRef = useRef<{active: boolean, angle: number, intensity: number}>({ active: false, angle: 0, intensity: 0 }) // Recoil effect ref
  const screenShakeRef = useRef<{active: boolean, intensity: number}>({ active: false, intensity: 0 }) // Screen shake ref
  const obstaclesHash = useRef<string>('') // Track obstacles hash to prevent unnecessary updates
  
  // Frame rate monitoring for bullet smoothness debugging
  const frameTimeRef = useRef<number[]>([])
  const lastFrameTime = useRef<number>(0)
  
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
      explosionsRef.current = [] // Add explosion ref cleanup
      shootingRequested.current = false
      spacePressed.current = false
      lastShootingRequest.current = 0
      lastSuccessfulShot.current = 0 // Reset global shot tracking
      seenBulletIds.current.clear() // Clear bullet tracking
      seenBulletIds.current.clear() // Clear bullet tracking
      localBulletPositions.current.clear() // Clear local bullet positions
      localBombPositions.current.clear() // Clear local bomb positions
      
      // Reset sync timing to prevent conflicts
      lastMovementSync.current = 0
      lastWorldStateSync.current = 0
      lastBulletSync.current = 0
      lastBombSync.current = 0
      
      // Reset prediction state
      setInputSequence(0)
      setPendingInputs([])
      setServerReconciliation(new Map())
      interpolationBuffer.current.clear()
      obstaclesHash.current = ''
      
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
        const syncStartTime = Date.now()
        
        // Conservative frequency for deployment stability (6.7 FPS)
        if (syncStartTime - lastWorldStateSync.current < 150) {
          return
        }

        try {
          const response = await fetch(`/api/game/${currentGameCode}`)
          if (response.ok) {
            // Read the response data ONCE
            const data = await response.json()
            const syncEndTime = Date.now()
            const syncDuration = syncEndTime - syncStartTime
            
            // Log sync timing and bullet count for analysis
            const bulletCount = data.bullets?.length || 0
            const timeSinceLastSync = syncStartTime - lastWorldStateSync.current
            if (Math.random() < 0.02) { // Log 2% of syncs (reduced from 10%)
              console.log(`🌐 WORLD SYNC:`, {
                duration: syncDuration + 'ms',
                bulletCount,
                timeSinceLastSync: timeSinceLastSync + 'ms',
                expectedInterval: '150ms'
              })
            }
            
            lastWorldStateSync.current = syncStartTime
            
            // Process data with proper timestamp
            const now = syncEndTime
            const gameState = data // Use the already parsed data
            
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

            // FAST BULLET SYNC: Update bullets from world state data with deployment-stable logic
            if (gameState.pulses && Array.isArray(gameState.pulses)) {
              // Log bullet data for debugging
              if (gameState.pulses.length > 0 && Math.random() < 0.01) { // Reduced from 5% to 1%
                console.log(`📊 RECEIVED BULLETS: ${gameState.pulses.length}`, gameState.pulses.map((p: any) => ({
                  id: p.id?.substring(0, 8),
                  pos: `(${p.x?.toFixed(1)}, ${p.y?.toFixed(1)})`,
                  speed: p.speed,
                  velocity: `(${p.dx?.toFixed(2)}, ${p.dy?.toFixed(2)})`
                })))
              }
              
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
              
              // DEPLOYMENT FIX: Always update bullet positions for smooth movement
              const currentBulletIds = new Set(pulsesRef.current.map((p: any) => p.id))
              const serverBulletIds = new Set(serverPulses.map((p: any) => p.id))
              
              // Check for new or removed bullets
              const hasNewBullets = Array.from(serverBulletIds).some(id => !currentBulletIds.has(id))
              const hasRemovedBullets = Array.from(currentBulletIds).some(id => !serverBulletIds.has(id))
              const significantChange = hasNewBullets || hasRemovedBullets
              
              // CRITICAL FIX: Always update bullet state for smooth movement
              // Handle both server bullets and client predictions
              const currentBullets = pulsesRef.current
              const serverBullets = [...serverPulses]
              
              // Keep client-predicted bullets that haven't been confirmed by server yet
              const clientPredictedBullets = currentBullets.filter((bullet: any) => 
                bullet._clientPredicted && 
                !serverBullets.some((sb: any) => sb.playerId === bullet.playerId && 
                  Math.abs(sb.timestamp - bullet.timestamp) < 500) // Match bullets within 500ms
              )
              
              // Combine server bullets with remaining client predictions
              const mergedBullets = [...serverBullets, ...clientPredictedBullets]
              
              // Debug logging for bullet merging (reduced frequency)
              if ((clientPredictedBullets.length > 0 || serverBullets.length > 0) && Math.random() < 0.01) { // 1% chance
                console.log(`🔄 BULLET MERGE: Server=${serverBullets.length}, ClientPredicted=${clientPredictedBullets.length}, Total=${mergedBullets.length}`)
              }
              
              // Remove old fade-out logic since we're using client prediction instead
              setPulses(mergedBullets)
              pulsesRef.current = mergedBullets
              
              if (significantChange) {
                // Clean up local bullet positions and seen bullet IDs for bullets that no longer exist
                // BUT: Add a grace period to avoid cleaning up bullets that might just be temporarily missing from sync
                const gracePeriod = 300 // 300ms grace period for bullets to reappear
                const seenIds = Array.from(seenBulletIds.current.keys())
                const localBulletIds = Array.from(localBulletPositions.current.keys())
                
                for (const bulletId of seenIds) {
                  if (!serverBulletIds.has(bulletId)) {
                    seenBulletIds.current.delete(bulletId)
                  }
                }
                
                // Track bullet cleanup for debugging
                const removedBullets = localBulletIds.filter(id => !serverBulletIds.has(id))
                if (removedBullets.length > 0) {
                  // Only log if bullets have been missing for longer than grace period
                  const staleRemovals = removedBullets.filter(id => {
                    const localPos = localBulletPositions.current.get(id)
                    return !localPos || (now - localPos.lastUpdate) > gracePeriod
                  })
                  
                  if (staleRemovals.length > 0) {
                    console.log(`🧹 BULLET CLEANUP: Removing ${staleRemovals.length} stale bullets:`, staleRemovals.map(id => id.substring(0, 8)))
                  }
                }
                
                // Only remove bullets that have been missing for longer than grace period
                for (const bulletId of localBulletIds) {
                  if (!serverBulletIds.has(bulletId)) {
                    const localPos = localBulletPositions.current.get(bulletId)
                    if (!localPos || (now - localPos.lastUpdate) > gracePeriod) {
                      localBulletPositions.current.delete(bulletId)
                    }
                  }
                }
              }
            } else if (pulsesRef.current.length > 0) {
              // Only clear bullets if we currently have some (prevent unnecessary clears)
              setPulses([])
              pulsesRef.current = []
              seenBulletIds.current.clear()
              localBulletPositions.current.clear()
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
                      
                      // Only trust server position if local player hasn't moved recently (5 seconds threshold) or if there's a significant position difference
                      const shouldTrustServerPosition = (now - (localPlayer.timestamp || 0)) > 5000
                      const positionDifference = Math.sqrt(
                        Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2)
                      )
                      const hasSignificantPositionDrift = positionDifference > 50 // Only reconcile if positions are very different
                      
                      const reconciledPlayer = {
                        ...localPlayer, // Keep local data for responsiveness
                        // Only override position if we haven't moved recently AND there's significant drift
                        x: (shouldTrustServerPosition && hasSignificantPositionDrift) ? player.x : localPlayer.x,
                        y: (shouldTrustServerPosition && hasSignificantPositionDrift) ? player.y : localPlayer.y,
                        health: player.health, // Trust server for health
                        hitTime: player.hitTime, // Sync hit animations
                        color: player.color || localPlayer.color, // Ensure color consistency
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

            // SERVER-AUTHORITATIVE POWERUPS: Deployment-stable sync (prevent flickering)
            if (gameState.powerups && Array.isArray(gameState.powerups)) {
              const serverPowerups = gameState.powerups.map((serverPowerup: any) => ({
                id: serverPowerup.id,
                x: serverPowerup.x,
                y: serverPowerup.y,
                type: serverPowerup.type,
                timestamp: serverPowerup.timestamp || now,
                duration: serverPowerup.duration
              }))
              
              // DEPLOYMENT FIX: Conservative powerup update strategy
              const currentPowerupIds = new Set(powerupsRef.current.map((p: any) => p.id))
              const serverPowerupIds = new Set(serverPowerups.map((p: any) => p.id))
              
              // Only update for structural changes (add/remove), not position updates
              const hasNewPowerups = Array.from(serverPowerupIds).some(id => !currentPowerupIds.has(id))
              const hasRemovedPowerups = Array.from(currentPowerupIds).some(id => !serverPowerupIds.has(id))
              const significantChange = hasNewPowerups || hasRemovedPowerups
              
              if (significantChange || powerupsRef.current.length === 0) {
                setPowerups(serverPowerups)
                powerupsRef.current = serverPowerups
                console.log(`🟣 Powerup sync: ${powerupsRef.current.length} → ${serverPowerups.length}`)
              } else {
                // For existing powerups, update positions without state change to prevent flicker
                serverPowerups.forEach((serverPowerup: any) => {
                  const existingPowerup = powerupsRef.current.find((p: any) => p.id === serverPowerup.id)
                  if (existingPowerup) {
                    // Update only position data to maintain stability
                    existingPowerup.x = serverPowerup.x
                    existingPowerup.y = serverPowerup.y
                  }
                })
              }
            } else if (powerupsRef.current.length > 0) {
              // Only clear powerups if we currently have some (prevent unnecessary clears)
              setPowerups([])
              powerupsRef.current = []
              console.log(`🟣 Cleared all powerups`)
            }

            // SERVER-AUTHORITATIVE BOMBS: Deployment-stable sync for smooth bomb movement
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
              const currentBombIds = new Set(bombsRef.current.map((b: any) => b.id))
              const serverBombIds = new Set(serverBombs.map((b: any) => b.id))
              
              bombsRef.current.forEach((bomb: any) => {
                if (!serverBombIds.has(bomb.id)) {
                  // This bomb was removed from server, likely exploded
                  
                  // CRITICAL FIX: Use the smoothly interpolated position for explosion instead of server position
                  // This ensures the explosion appears where the player actually saw the bomb
                  let explosionX = bomb.x
                  let explosionY = bomb.y
                  
                  const localPos = localBombPositions.current.get(bomb.id)
                  if (localPos) {
                    // Use the smooth interpolated position that was visible to the player
                    explosionX = localPos.x
                    explosionY = localPos.y
                    console.log(`💥 BOMB EXPLOSION: Using smooth position (${explosionX.toFixed(1)}, ${explosionY.toFixed(1)}) instead of server (${bomb.x.toFixed(1)}, ${bomb.y.toFixed(1)})`)
                  }
                  
                  const explosion = {
                    id: `explosion_${bomb.id}`,
                    x: explosionX,
                    y: explosionY,
                    timestamp: now,
                    radius: 80 // Match server explosion radius
                  }
                  
                  setExplosions((prevExplosions: any) => [...prevExplosions, explosion])
                  
                  // Remove explosion after animation (1 second)
                  setTimeout(() => {
                    setExplosions((prevExplosions: any) => 
                      prevExplosions.filter((e: any) => e.id !== explosion.id)
                    )
                  }, 1000)
                }
              })
              
              // DEPLOYMENT FIX: Always update bomb positions for smooth movement
              const hasNewBombs = Array.from(serverBombIds).some(id => !currentBombIds.has(id))
              const hasRemovedBombs = Array.from(currentBombIds).some(id => !serverBombIds.has(id))
              const significantChange = hasNewBombs || hasRemovedBombs
              
              // CRITICAL FIX: Always update bomb state for smooth movement
              setBombs(serverBombs)
              bombsRef.current = serverBombs
              
              if (significantChange) {
                // Clean up local bomb positions for bombs that no longer exist
                const localBombIds = Array.from(localBombPositions.current.keys())
                for (const bombId of localBombIds) {
                  if (!serverBombIds.has(bombId)) {
                    localBombPositions.current.delete(bombId)
                  }
                }
              }
            } else if (bombsRef.current.length > 0) {
              // Only clear bombs if we currently have some
              setBombs([])
              bombsRef.current = []
              localBombPositions.current.clear()
            }

            // Note: All game objects (bullets, bombs, powerups) are synced together for deployment efficiency
          }
        } catch (error) {
          console.error('World state sync error:', error)
          // On error, don't clear obstacles to prevent flickering in production
          // The next successful sync will update them properly
          // Also, don't break the sync loop - just continue to next attempt
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
            
            // CLIENT-SIDE PREDICTION: Create immediate bullet for smooth experience
            // This bullet will be replaced by server bullet when sync arrives
            const bulletId = `client_${localPlayerId}_${now}`
            const bulletSpeed = 500
            const bulletDirection = {
              x: Math.sin((localPlayer.rotation * Math.PI) / 180),
              y: -Math.cos((localPlayer.rotation * Math.PI) / 180)
            }
            
            const predictiveBullet = {
              id: bulletId,
              x: localPlayer.x,
              y: localPlayer.y,
              dx: bulletDirection.x,
              dy: bulletDirection.y,
              playerId: localPlayerId,
              color: localPlayer.color || '#00ff00',
              damage: 1,
              timestamp: now,
              speed: bulletSpeed,
              _clientPredicted: true // Mark as client prediction
            }
            
            // Add predictive bullet immediately for smooth experience
            setPulses(prevPulses => [...prevPulses, predictiveBullet])
            pulsesRef.current = [...pulsesRef.current, predictiveBullet]
            
            console.log(`🎯 CLIENT PREDICTION: Created immediate bullet ${bulletId.substring(0, 12)} at (${localPlayer.x.toFixed(1)}, ${localPlayer.y.toFixed(1)})`)
            
            // Remove client prediction after 2 seconds (max bullet lifetime)
            setTimeout(() => {
              setPulses(prevPulses => prevPulses.filter(p => p.id !== bulletId))
              pulsesRef.current = pulsesRef.current.filter(p => p.id !== bulletId)
              localBulletPositions.current.delete(bulletId)
              console.log(`🧹 CLIENT PREDICTION: Cleaned up bullet ${bulletId.substring(0, 12)}`)
            }, 2000)
            
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
        // Reduced delay for faster obstacle loading
        await new Promise(resolve => setTimeout(resolve, 50))
        // console.log(`🚀 Starting optimized sync for game: ${currentGameCode}`)
        await syncMovementToServer()
        await syncWorldStateFromServer()
        
        // Force immediate obstacle sync if we don't have any
        if (obstaclesRef.current.length === 0) {
          setTimeout(async () => {
            await syncWorldStateFromServer()
            console.log(`🔄 Force obstacle sync completed, obstacles: ${obstaclesRef.current.length}`)
          }, 100)
        }
      }
      
      doInitialSync()
      
      // Set up optimized sync intervals for deployment stability
      movementSyncInterval.current = setInterval(syncMovementToServer, 100) // 10 FPS movement
      worldStateSyncInterval.current = setInterval(syncWorldStateFromServer, 100) // 10 FPS world state (faster to reduce bullet stuttering)
      // Note: All game objects (bullets, bombs, powerups) are synced together to prevent conflicts
      
      // Set up single shooting handler interval - more responsive for better cooldown feedback
      const shootingInterval = setInterval(handleShooting, 50) // Check shooting every 50ms for responsive feedback

      return () => {
        if (movementSyncInterval.current) clearInterval(movementSyncInterval.current)
        if (worldStateSyncInterval.current) clearInterval(worldStateSyncInterval.current)
        clearInterval(shootingInterval)
      }
    }

    return () => {
      if (movementSyncInterval.current) clearInterval(movementSyncInterval.current)
      if (worldStateSyncInterval.current) clearInterval(worldStateSyncInterval.current)
    }
  }, [gameStarted, currentGameCode, localPlayerId])

  // Optimized game loop with client prediction and server-authoritative bullets
  const gameLoop = useCallback(() => {
    if (!gameStarted || !canvasRef.current || gameEnded) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Frame rate monitoring for debugging bullet smoothness
    const currentFrameTime = Date.now()
    if (lastFrameTime.current > 0) {
      const frameTime = currentFrameTime - lastFrameTime.current
      frameTimeRef.current.push(frameTime)
      
      // Keep only last 60 frames for analysis
      if (frameTimeRef.current.length > 60) {
        frameTimeRef.current.shift()
      }
      
      // Log frame rate statistics every 2 seconds
      if (frameTimeRef.current.length === 60 && Math.random() < 0.01) {
        const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length
        const fps = 1000 / avgFrameTime
        const minFrameTime = Math.min(...frameTimeRef.current)
        const maxFrameTime = Math.max(...frameTimeRef.current)
        const minFps = 1000 / maxFrameTime
        const maxFps = 1000 / minFrameTime
        
        console.log(`📊 FRAME RATE ANALYSIS:`, {
          avgFps: fps.toFixed(1),
          minFps: minFps.toFixed(1),
          maxFps: maxFps.toFixed(1),
          avgFrameTime: avgFrameTime.toFixed(1) + 'ms',
          frameTimeRange: `${minFrameTime.toFixed(1)}-${maxFrameTime.toFixed(1)}ms`
        })
      }
    }
    lastFrameTime.current = currentFrameTime

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

    // COLLISION DETECTION: Handle bullet-obstacle collisions BEFORE rendering
    // This prevents multiple collision detections and array modification during iteration
    const currentTime = Date.now()
    const bulletsToRemove: string[] = []
    const destroyedBullets = new Set<string>() // Track bullets already processed this frame
    const bulletsForCollision = pulsesRef.current
    
    // DEBUG: Log collision detection start
    if (bulletsForCollision.length > 0 && Math.random() < 0.1) {
      console.log(`🔍 COLLISION CHECK START: Processing ${bulletsForCollision.length} bullets`, bulletsForCollision.map(b => ({
        id: b.id?.substring(0, 8),
        destroyed: (b as any).destroyed || false,
        pos: `(${b.x?.toFixed(1)}, ${b.y?.toFixed(1)})`
      })))
    }
    
    bulletsForCollision.forEach((pulse) => {
      // Skip if already marked for removal, already processed, or already destroyed
      if (bulletsToRemove.includes(pulse.id) || destroyedBullets.has(pulse.id) || (pulse as any).destroyed) {
        if (Math.random() < 0.1) {
          console.log(`⏭️ SKIPPING BULLET: ${pulse.id?.substring(0, 8)} - InRemoveList: ${bulletsToRemove.includes(pulse.id)}, InDestroyedSet: ${destroyedBullets.has(pulse.id)}, DestroyedFlag: ${(pulse as any).destroyed}`)
        }
        return
      }
      
      // Get the current rendered position (same logic as rendering)
      let renderX = pulse.x
      let renderY = pulse.y
      
      const localPos = localBulletPositions.current.get(pulse.id)
      if (localPos) {
        renderX = localPos.x
        renderY = localPos.y
      } else {
        // Calculate compensated position for new bullets
        const bulletAge = currentTime - (pulse.timestamp || currentTime)
        const compensatedMovement = (bulletAge / 1000) * (pulse.speed || 500)
        renderX = pulse.x + (pulse.dx || 0) * compensatedMovement
        renderY = pulse.y + (pulse.dy || 0) * compensatedMovement
      }
      
      // Check collision with obstacles
      const bulletRadius = 5
      for (const obstacle of obstaclesRef.current) {
        const closestX = Math.max(obstacle.x, Math.min(renderX, obstacle.x + obstacle.width))
        const closestY = Math.max(obstacle.y, Math.min(renderY, obstacle.y + obstacle.height))
        const distanceX = renderX - closestX
        const distanceY = renderY - closestY
        const distanceSquared = distanceX * distanceX + distanceY * distanceY
        
        if (distanceSquared <= bulletRadius * bulletRadius) {
          bulletsToRemove.push(pulse.id)
          destroyedBullets.add(pulse.id) // Mark as processed to prevent duplicate detection
          ;(pulse as any).destroyed = true // Immediately mark bullet as destroyed
          
          // Notify server immediately
          if (currentGameCode) {
            fetch(`/api/game/${currentGameCode}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'bullet_destroy',
                bulletId: pulse.id,
                obstacleHit: true,
                timestamp: currentTime
              })
            }).catch(error => console.error('Error notifying server of bullet destruction:', error))
          }
          
          if (Math.random() < 0.3) { // Increased logging frequency for debugging
            console.log(`💥 BULLET DESTROYED: ${pulse.id?.substring(0, 8)} hit obstacle at (${renderX.toFixed(1)}, ${renderY.toFixed(1)}) - Destroyed flag: ${(pulse as any).destroyed}, Already in remove list: ${bulletsToRemove.includes(pulse.id)}`)
          }
          break
        }
      }
    })
    
    // Remove all collided bullets at once (prevents array modification during iteration)
    bulletsToRemove.forEach(bulletId => {
      const bulletIndex = pulsesRef.current.findIndex(p => p.id === bulletId)
      if (bulletIndex !== -1) {
        pulsesRef.current.splice(bulletIndex, 1)
      }
      localBulletPositions.current.delete(bulletId)
    })

    // COLLISION DETECTION: Handle bomb-obstacle collisions BEFORE rendering
    const bombsToExplode: Array<{id: string, x: number, y: number}> = []
    const explodedBombs = new Set<string>() // Track bombs already processed this frame
    const bombsForCollision = bombsRef.current
    
    bombsForCollision.forEach((bomb) => {
      // Skip if already marked for explosion, already processed, or already destroyed
      if (bombsToExplode.some(b => b.id === bomb.id) || explodedBombs.has(bomb.id) || (bomb as any).destroyed) return
      
      // Get the current rendered position (same logic as rendering)
      let renderX = bomb.x
      let renderY = bomb.y
      
      const localPos = localBombPositions.current.get(bomb.id)
      if (localPos) {
        renderX = localPos.x
        renderY = localPos.y
      } else {
        // Calculate compensated position for new bombs
        const bombAge = currentTime - (bomb.timestamp || currentTime)
        const compensatedMovement = (bombAge / 1000) * (bomb.speed || 200)
        renderX = bomb.x + (bomb.dx || 0) * compensatedMovement
        renderY = bomb.y + (bomb.dy || 0) * compensatedMovement
      }
      
      // Check collision with obstacles
      const bombRadius = 6
      for (const obstacle of obstaclesRef.current) {
        const closestX = Math.max(obstacle.x, Math.min(renderX, obstacle.x + obstacle.width))
        const closestY = Math.max(obstacle.y, Math.min(renderY, obstacle.y + obstacle.height))
        const distanceX = renderX - closestX
        const distanceY = renderY - closestY
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
        
        if (distance <= bombRadius) {
          bombsToExplode.push({id: bomb.id, x: renderX, y: renderY})
          explodedBombs.add(bomb.id) // Mark as processed to prevent duplicate detection
          ;(bomb as any).destroyed = true // Immediately mark bomb as destroyed
          
          // Notify server immediately
          if (currentGameCode) {
            fetch(`/api/game/${currentGameCode}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'bomb_explode',
                bombId: bomb.id,
                x: renderX,
                y: renderY,
                obstacleHit: true,
                timestamp: currentTime
              })
            }).catch(error => console.error('Error notifying server of bomb explosion:', error))
          }
          
          console.log(`💥 BOMB EXPLODED: ${bomb.id.substring(0, 8)} hit obstacle at (${renderX.toFixed(1)}, ${renderY.toFixed(1)})`)
          break
        }
      }
    })
    
    // Process all bomb explosions at once
    bombsToExplode.forEach(({id, x, y}) => {
      // Remove bomb from game state
      const bombIndex = bombsRef.current.findIndex(b => b.id === id)
      if (bombIndex !== -1) {
        bombsRef.current.splice(bombIndex, 1)
      }
      localBombPositions.current.delete(id)
      
      // Create explosion
      const explosion = {
        id: `explosion_${id}_obstacle`,
        x: x,
        y: y,
        timestamp: currentTime,
        radius: 80
      }
      
      setExplosions((prevExplosions: any) => [...prevExplosions, explosion])
      
      // Remove explosion after animation
      setTimeout(() => {
        setExplosions((prevExplosions: any) => 
          prevExplosions.filter((e: any) => e.id !== explosion.id)
        )
      }, 1000)
    })

    // RENDERING: Draw server-authoritative bullets with instant smooth movement
    const currentPulses = pulsesRef.current
    
    // DEBUG: Log bullet rendering details (very reduced frequency)
    if (currentPulses.length > 0 && Math.random() < 0.002) { // 0.2% chance to log
      console.log(`🎨 RENDERING BULLETS: ${currentPulses.length} bullets`, currentPulses.map(p => ({
        id: p.id?.substring(0, 8),
        pos: `(${p.x?.toFixed(1)}, ${p.y?.toFixed(1)})`,
        color: p.color,
        clientPredicted: (p as any)._clientPredicted || false
      })))
    }
    
    // Cleanup old bullet position tracking data to prevent memory leaks
    // Handle both server bullets and client predictions gracefully
    const currentBulletIds = new Set(currentPulses.map(pulse => pulse.id))
    localBulletPositions.current.forEach((localPos, bulletId) => {
      if (!currentBulletIds.has(bulletId)) {
        // For client-predicted bullets, remove immediately when they're gone
        // For server bullets, use grace period
        const isClientPredicted = bulletId.startsWith('client_')
        const gracePeriod = isClientPredicted ? 0 : 500
        
        if (currentTime - localPos.lastUpdate > gracePeriod) {
          localBulletPositions.current.delete(bulletId)
        }
      }
    })
    
    currentPulses.forEach((pulse, index) => {
      // Skip destroyed bullets
      if ((pulse as any).destroyed) return
      
      // DEBUG: Log each bullet being processed (very reduced frequency)
      if (Math.random() < 0.005) { // 0.5% chance to log each bullet
        console.log(`🔵 PROCESSING BULLET ${index}: ${pulse.id?.substring(0, 8)} at (${pulse.x?.toFixed(1)}, ${pulse.y?.toFixed(1)})`)
      }
      
      // SMOOTH BULLET MOVEMENT: Use client-side prediction for ultra-smooth rendering
      let renderX = pulse.x
      let renderY = pulse.y
      
      // Get or create local position tracking for this bullet
      let localPos = localBulletPositions.current.get(pulse.id)
      
      if (!localPos) {
        // SMOOTHNESS FIX: When first receiving a bullet, calculate where it should be NOW
        // based on its age to eliminate stuttering from sync delays
        const bulletAge = currentTime - (pulse.timestamp || currentTime)
        const compensatedMovement = (bulletAge / 1000) * (pulse.speed || 500)
        
        const compensatedX = pulse.x + (pulse.dx || 0) * compensatedMovement
        const compensatedY = pulse.y + (pulse.dy || 0) * compensatedMovement
        
        // Initialize with compensated position for smooth appearance
        localPos = { 
          x: compensatedX, 
          y: compensatedY, 
          lastUpdate: currentTime, 
          serverX: pulse.x,
          serverY: pulse.y 
        }
        localBulletPositions.current.set(pulse.id, localPos)
        
        // Use compensated position for rendering
        renderX = compensatedX
        renderY = compensatedY
        
        if (Math.random() < 0.01) { // Reduced logging frequency to 1%
          console.log(`🔫 BULLET INIT: ${pulse.id.substring(0, 8)} age=${bulletAge}ms, server=(${pulse.x.toFixed(1)}, ${pulse.y.toFixed(1)}), compensated=(${compensatedX.toFixed(1)}, ${compensatedY.toFixed(1)})`)
        }
      } else {
        // CRITICAL FIX: Smooth interpolation WITHOUT position resets to eliminate stuttering
        const deltaTime = currentTime - localPos.lastUpdate
        
        // ANTI-STUTTER: Always extrapolate forward based on velocity, ignore server position jumps
        // This prevents the back-and-forth stuttering caused by server position resets
        const timeSinceUpdate = deltaTime / 1000 // Convert to seconds
        
        // Limit extrapolation to prevent large jumps during lag spikes (max 200ms worth of movement)
        const maxExtrapolationTime = Math.min(timeSinceUpdate, 0.2)
        
        const speed = pulse.speed || 500
        const moveDistance = maxExtrapolationTime * speed
        
        // SMOOTH MOVEMENT: Always move forward based on velocity, never reset position
        localPos.x += (pulse.dx || 0) * moveDistance
        localPos.y += (pulse.dy || 0) * moveDistance
        localPos.lastUpdate = currentTime
        
        // ANTI-STUTTER: Only update server tracking for debugging, don't reset render position
        if (pulse.x !== localPos.serverX || pulse.y !== localPos.serverY) {
          const serverJumpDistance = Math.sqrt(
            Math.pow(pulse.x - localPos.serverX, 2) + Math.pow(pulse.y - localPos.serverY, 2)
          )
          
          // Debug log significant server position jumps that would cause stuttering
          if (serverJumpDistance > 10 && Math.random() < 0.1) {
            console.log(`🔧 ANTI-STUTTER: Server position jump detected ${serverJumpDistance.toFixed(1)}px - maintaining smooth extrapolation`)
          }
        }
        
        localPos.serverX = pulse.x
        localPos.serverY = pulse.y
        
        // Use smoothly extrapolated position for rendering (no jumps!)
        renderX = localPos.x
        renderY = localPos.y
      }
      
      // Bounds checking to prevent visual artifacts from client-side prediction
      const canvas = canvasRef.current
      if (canvas) {
        renderX = Math.max(-50, Math.min(canvas.width + 50, renderX))
        renderY = Math.max(-50, Math.min(canvas.height + 50, renderY))
      }
      
      // Client-side collision is now handled in pre-rendering section above
      // DEBUG: Log successful bullet rendering (very reduced frequency)
      
      // Collision detection is now handled in pre-rendering section above
      
      // DEBUG: Log successful bullet rendering (very reduced frequency)



            

              console.log(`� BULLET DESTROYED: ${pulse.id?.substring(0, 8)} hit obstacle at (${renderX.toFixed(1)}, ${renderY.toFixed(1)})`)

      

      
      // DEBUG: Log successful bullet rendering (very reduced frequency)
      if (Math.random() < 0.005) { // 0.5% chance to log successful renders
        console.log(`✅ RENDERING BULLET ${pulse.id?.substring(0, 8)} at (${renderX.toFixed(1)}, ${renderY.toFixed(1)}) with color ${pulse.color}`)
      }
      
      // Draw bullet with enhanced smooth visual effects
      ctx.save()
      
      // Handle client-predicted bullets with slight transparency
      const isClientPredicted = (pulse as any)._clientPredicted
      const bulletOpacity = isClientPredicted ? 0.8 : 1.0 // Slightly transparent for predictions
      if (bulletOpacity < 1.0) {
        ctx.globalAlpha = bulletOpacity
      }
      
      // Enhanced motion trail for ultra-smooth visual feedback
      if (pulse.dx !== 0 || pulse.dy !== 0) {
        const velocity = Math.sqrt(pulse.dx * pulse.dx + pulse.dy * pulse.dy)
        const speed = pulse.speed || 500
        const baseTrailLength = Math.min(velocity * speed / 500 * 20, 35) // Longer trail for smoother appearance
        
        // Multi-segment trail for ultra-smooth appearance
        const trailSegments = 5
        for (let i = 0; i < trailSegments; i++) {
          const segmentProgress = (i + 1) / trailSegments
          const segmentLength = baseTrailLength * segmentProgress
          const trailX = renderX - (pulse.dx * segmentLength)
          const trailY = renderY - (pulse.dy * segmentLength)
          
          const gradient = ctx.createLinearGradient(trailX, trailY, renderX, renderY)
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)') // Transparent start
          const trailColor = pulse.color?.replace(')', `, ${0.6 * bulletOpacity})`).replace('rgb', 'rgba') || `rgba(0, 255, 0, ${0.6 * bulletOpacity})`
          gradient.addColorStop(1, trailColor)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 4 - (i * 0.6) // Decreasing thickness
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(trailX, trailY)
          ctx.lineTo(renderX, renderY)
          ctx.stroke()
        }
      }
      
      // Enhanced glow effect (adjusted for client prediction)
      ctx.shadowColor = pulse.color || '#00ff00'
      ctx.shadowBlur = 12 * bulletOpacity
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Consistent bullet size
      const bulletSize = 4
      
      // Enhanced outer glow with multiple layers (adjusted for client prediction)
      for (let i = 0; i < 3; i++) {
        const glowSize = bulletSize * (1.5 + i * 0.3)
        const alpha = (0.4 - (i * 0.1)) * bulletOpacity
        ctx.fillStyle = pulse.color?.replace(')', `, ${alpha})`).replace('rgb', 'rgba') || `rgba(0, 255, 0, ${alpha})`
        ctx.beginPath()
        ctx.arc(renderX, renderY, glowSize, 0, 2 * Math.PI)
        ctx.fill()
      }
      
      // Main bullet body (adjusted for client prediction)
      const mainAlpha = bulletOpacity
      ctx.fillStyle = pulse.color?.replace(')', `, ${mainAlpha})`).replace('rgb', 'rgba') || `rgba(0, 255, 0, ${mainAlpha})`
      ctx.beginPath()
      ctx.arc(renderX, renderY, bulletSize, 0, 2 * Math.PI)
      ctx.fill()
      
      // Bright inner core (adjusted for client prediction)
      ctx.shadowBlur = 0
      ctx.fillStyle = `rgba(255, 255, 255, ${bulletOpacity})`
      ctx.beginPath()
      ctx.arc(renderX, renderY, bulletSize * 0.5, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.restore()
    })

    // RENDERING: Draw server-authoritative bombs with instant smooth movement
    const currentBombs = bombsRef.current
    
    // Cleanup old bomb position tracking data to prevent memory leaks
    // BUT: Use a grace period to avoid removing bombs that might just be temporarily missing
    const currentBombIds = new Set(currentBombs.map(bomb => bomb.id))
    localBombPositions.current.forEach((localPos, bombId) => {
      if (!currentBombIds.has(bombId)) {
        // Only remove if it's been missing for more than 500ms
        if (currentTime - localPos.lastUpdate > 500) {
          localBombPositions.current.delete(bombId)
        }
      }
    })
    
    currentBombs.forEach((bomb, index) => {
      // Skip destroyed bombs
      if ((bomb as any).destroyed) return
      
      // SMOOTH BOMB MOVEMENT: Use client-side prediction for ultra-smooth rendering
      let renderX = bomb.x
      let renderY = bomb.y
      
      // Get or create local position tracking for this bomb
      let localPos = localBombPositions.current.get(bomb.id)
      
      if (!localPos) {
        // SMOOTHNESS FIX: When first receiving a bomb, calculate where it should be NOW
        // based on its age to eliminate stuttering from sync delays
        const bombAge = currentTime - (bomb.timestamp || currentTime)
        const compensatedMovement = (bombAge / 1000) * (bomb.speed || 200)
        
        const compensatedX = bomb.x + (bomb.dx || 0) * compensatedMovement
        const compensatedY = bomb.y + (bomb.dy || 0) * compensatedMovement
        
        // Initialize with compensated position for smooth appearance
        localPos = { 
          x: compensatedX, 
          y: compensatedY, 
          lastUpdate: currentTime,
          serverX: bomb.x,
          serverY: bomb.y
        }
        localBombPositions.current.set(bomb.id, localPos)
        
        // Use compensated position for rendering
        renderX = compensatedX
        renderY = compensatedY
        
        if (Math.random() < 0.01) { // Reduced logging frequency to 1% (consistent with bullets)
          console.log(`💣 BOMB INIT: ${bomb.id.substring(0, 8)} age=${bombAge}ms, server=(${bomb.x.toFixed(1)}, ${bomb.y.toFixed(1)}), compensated=(${compensatedX.toFixed(1)}, ${compensatedY.toFixed(1)})`)
        }
      } else {
        // CRITICAL FIX: Smooth interpolation WITHOUT position resets to eliminate stuttering (same as bullets)
        const deltaTime = currentTime - localPos.lastUpdate
        
        // ANTI-STUTTER: Always extrapolate forward based on velocity, ignore server position jumps
        // This prevents the back-and-forth stuttering caused by server position resets
        const timeSinceUpdate = deltaTime / 1000 // Convert to seconds
        
        // Limit extrapolation to prevent large jumps during lag spikes (max 200ms worth of movement)
        const maxExtrapolationTime = Math.min(timeSinceUpdate, 0.2)
        
        const speed = bomb.speed || 200
        const moveDistance = maxExtrapolationTime * speed
        
        // SMOOTH MOVEMENT: Always move forward based on velocity, never reset position
        localPos.x += (bomb.dx || 0) * moveDistance
        localPos.y += (bomb.dy || 0) * moveDistance
        localPos.lastUpdate = currentTime
        
        // ANTI-STUTTER: Only update server tracking for debugging, don't reset render position
        if (bomb.x !== localPos.serverX || bomb.y !== localPos.serverY) {
          const serverJumpDistance = Math.sqrt(
            Math.pow(bomb.x - localPos.serverX, 2) + Math.pow(bomb.y - localPos.serverY, 2)
          )
          
          // Debug log significant server position jumps that would cause stuttering
          if (serverJumpDistance > 10 && Math.random() < 0.1) {
            console.log(`🔧 ANTI-STUTTER BOMB: Server position jump detected ${serverJumpDistance.toFixed(1)}px - maintaining smooth extrapolation`)
          }
        }
        
        localPos.serverX = bomb.x
        localPos.serverY = bomb.y
        
        // Use smoothly extrapolated position for rendering (no jumps!)
        renderX = localPos.x
        renderY = localPos.y
      }
      
      // Bounds checking to prevent visual artifacts from client-side prediction
      const canvas = canvasRef.current
      if (canvas) {
        renderX = Math.max(-50, Math.min(canvas.width + 50, renderX))
        renderY = Math.max(-50, Math.min(canvas.height + 50, renderY))
      }
      
      // Check if bomb should explode soon (visual warning)
      const timeUntilExplosion = bomb.explodeTime - currentTime
      const isAboutToExplode = timeUntilExplosion <= 1000 // Warning in last 1 second
      
      // Draw bomb with enhanced smooth visual effects (matching bullets)
      ctx.save()
      
      // Enhanced smooth motion trail for flying bomb
      if (bomb.dx !== 0 || bomb.dy !== 0) {
        const velocity = Math.sqrt(bomb.dx * bomb.dx + bomb.dy * bomb.dy)
        const speed = bomb.speed || 200
        const baseTrailLength = Math.min(velocity * speed / 200 * 15, 25) // Proportional trail length
        
        // Multi-segment trail for smooth appearance (same as bullets)
        const trailSegments = 3
        for (let i = 0; i < trailSegments; i++) {
          const segmentProgress = (i + 1) / trailSegments
          const segmentLength = baseTrailLength * segmentProgress
          const trailX = renderX - (bomb.dx * segmentLength)
          const trailY = renderY - (bomb.dy * segmentLength)
          
          const gradient = ctx.createLinearGradient(trailX, trailY, renderX, renderY)
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
          gradient.addColorStop(0.5, `rgba(80, 80, 80, ${0.4 - i * 0.1})`)
          gradient.addColorStop(1, `rgba(100, 100, 100, ${0.8 - i * 0.2})`)
          
          ctx.strokeStyle = gradient
          ctx.lineWidth = 5 - (i * 0.8) // Decreasing thickness
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(trailX, trailY)
          ctx.lineTo(renderX, renderY)
          ctx.stroke()
        }
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
    
    // Immediately load obstacles when hosting
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/game/${gameCode}`)
        if (response.ok) {
          const gameState = await response.json()
          if (gameState.obstacles && Array.isArray(gameState.obstacles)) {
            console.log(`🏗️ Host loading obstacles immediately: ${gameState.obstacles.length}`)
            setObstacles(gameState.obstacles)
            obstaclesRef.current = gameState.obstacles
            const newObstaclesHash = gameState.obstacles.map((o: any) => `${o.id}-${o.x}-${o.y}-${o.width}-${o.height}`).join('|')
            obstaclesHash.current = newObstaclesHash
          }
        }
      } catch (error) {
        console.error('Error loading initial obstacles:', error)
      }
    }, 100)
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
        
        // Immediately load obstacles when joining
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/game/${connectionCode}`)
            if (response.ok) {
              const gameState = await response.json()
              if (gameState.obstacles && Array.isArray(gameState.obstacles)) {
                console.log(`🚪 Player loading obstacles immediately: ${gameState.obstacles.length}`)
                setObstacles(gameState.obstacles)
                obstaclesRef.current = gameState.obstacles
                const newObstaclesHash = gameState.obstacles.map((o: any) => `${o.id}-${o.x}-${o.y}-${o.width}-${o.height}`).join('|')
                obstaclesHash.current = newObstaclesHash
              }
            }
          } catch (error) {
            console.error('Error loading initial obstacles:', error)
          }
        }, 100)
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
    explosionsRef.current = [] // Add explosion ref cleanup
    inputBuffer.current = []
    lastServerState.current = null
    shootingRequested.current = false
    spacePressed.current = false
    lastShootingRequest.current = 0
    lastSuccessfulShot.current = 0 // Reset global shot tracking
    lastMovementSync.current = 0
    lastWorldStateSync.current = 0
    lastBulletSync.current = 0 // Reset bullet sync timing
    lastBombSync.current = 0 // Reset bomb sync timing
    lastServerUpdate.current = 0
    interpolationBuffer.current.clear()
    seenBulletIds.current.clear() // Clear bullet tracking
    localBulletPositions.current.clear() // Clear local bullet positions
    localBombPositions.current.clear() // Clear local bomb positions
    obstaclesHash.current = '' // Reset obstacles hash
    
    // Reset effects
    recoilRef.current = { active: false, angle: 0, intensity: 0 }
    screenShakeRef.current = { active: false, intensity: 0 }
    setRecoilEffect({ active: false, angle: 0, intensity: 0 })
    setScreenShake({ active: false, intensity: 0 })
    
    // Reset prediction state
    setServerReconciliation(new Map())
    setInputSequence(0)
    setPendingInputs([])
    
    console.log('🔄 Game state completely reset and cleaned up')
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
