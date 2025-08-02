import { NextRequest, NextResponse } from 'next/server'

interface Player {
  id: string
  x: number
  y: number
  color: string
  health: number
  lastShot: number
  rotation: number
  lastUpdate: number
  hitTime?: number
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
  damage: number
  timestamp: number
  speed: number
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
  timestamp: number
  duration?: number
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
  explodeTime: number
  speed: number
}

interface GameState {
  players: Record<string, Player>
  pulses: Pulse[]
  obstacles: Obstacle[]
  powerups: Powerup[]
  bombs: Bomb[]
  lastUpdate: number
  created: number
  lastPowerupSpawn: number // Track when last powerup was spawned
}

// In-memory storage for development (will be replaced by Vercel KV in production)
const gameStorage: Record<string, GameState> = {}

// Game physics constants
const BULLET_SPEED = 500 // Increased from 25 for much faster bullets
const BULLET_DAMAGE = 1
const CANVAS_WIDTH = 1000 // Updated to match GameModal canvas
const CANVAS_HEIGHT = 450 // Updated to match GameModal canvas
const PLAYER_RADIUS = 7
const BULLET_RADIUS = 5
const SHOOT_COOLDOWN = 2000
const OBSTACLE_COUNT = 10 // Fixed number of obstacles per game (as requested)
const BULLET_MAX_AGE = 5000 // Maximum bullet age in milliseconds (5 seconds)

// Generate 10 static obstacles with varying sizes for a new game
function generateObstacles(): Obstacle[] {
  const obstacles: Obstacle[] = []
  const margin = 50 // Keep obstacles away from edges and spawn areas
  
  // Create 10 obstacles with predefined size variations
  const sizePresets = [
    { width: 30, height: 60 }, // Tall wall
    { width: 60, height: 30 }, // Wide wall
    { width: 40, height: 40 }, // Square rock
    { width: 25, height: 45 }, // Narrow wall
    { width: 50, height: 25 }, // Low wall
    { width: 35, height: 35 }, // Medium square
    { width: 20, height: 50 }, // Thin tall wall
    { width: 55, height: 35 }, // Wide rectangle
    { width: 45, height: 20 }, // Low wide obstacle
    { width: 30, height: 30 }  // Small square
  ]
  
  for (let i = 0; i < OBSTACLE_COUNT; i++) {
    const size = sizePresets[i] || { width: 30, height: 30 } // Fallback size
    
    // Find a non-overlapping position
    let x, y, attempts = 0
    let validPosition = false
    
    do {
      x = margin + Math.random() * (CANVAS_WIDTH - 2 * margin - size.width)
      y = margin + Math.random() * (CANVAS_HEIGHT - 2 * margin - size.height)
      
      // Check overlap with existing obstacles
      validPosition = true
      for (const existing of obstacles) {
        if (x < existing.x + existing.width + 20 && 
            x + size.width > existing.x - 20 &&
            y < existing.y + existing.height + 20 && 
            y + size.height > existing.y - 20) {
          validPosition = false
          break
        }
      }
      
      attempts++
    } while (!validPosition && attempts < 100)
    
    obstacles.push({
      id: `obstacle_${i + 1}`,
      x,
      y,
      width: size.width,
      height: size.height,
      type: Math.random() > 0.5 ? 'wall' : 'rock'
    })
  }
  
  return obstacles
}

// Check collision between a circle and a rectangle
function checkCircleRectCollision(cx: number, cy: number, radius: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw))
  const closestY = Math.max(ry, Math.min(cy, ry + rh))
  const distanceX = cx - closestX
  const distanceY = cy - closestY
  return (distanceX * distanceX + distanceY * distanceY) <= (radius * radius)
}

// Collision detection helper
function checkCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  const dx = x1 - x2
  const dy = y1 - y2
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance < (r1 + r2)
}

// Spawn random powerup at safe location
function spawnRandomPowerup(): Powerup | null {
  const CANVAS_WIDTH = 1000
  const CANVAS_HEIGHT = 450
  const MARGIN = 30 // Keep powerups away from edges
  const MAX_ATTEMPTS = 50 // Prevent infinite loops

  // Randomly choose between invisibility and bomb powerups
  const powerupTypes: ('invisibility' | 'bomb')[] = ['invisibility', 'bomb']
  const powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const x = MARGIN + Math.random() * (CANVAS_WIDTH - 2 * MARGIN)
    const y = MARGIN + Math.random() * (CANVAS_HEIGHT - 2 * MARGIN)
    
    // Check if position is safe (not too close to obstacles)
    // For now, we'll spawn anywhere since we don't have obstacle data here
    // In a full implementation, you'd pass obstacles and check collision
    
    const powerup: Powerup = {
      id: `powerup_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      x: x,
      y: y,
      type: powerupType,
      timestamp: Date.now(),
      duration: powerupType === 'invisibility' ? 8000 : undefined
    }
    
    return powerup
  }
  
  // If we couldn't find a safe spot after MAX_ATTEMPTS, don't spawn
  return null
}

// Handle bomb explosion and damage
function handleBombExplosion(gameState: GameState, bomb: Bomb, now: number): void {
  const EXPLOSION_RADIUS = 80 // Explosion affects players within this radius
  const EXPLOSION_DAMAGE = 2 // Damage dealt by explosion
  
  console.log(`💥 Bomb ${bomb.id} exploded at (${bomb.x}, ${bomb.y})`)
  
  // Check all players for explosion damage
  Object.values(gameState.players).forEach(player => {
    if (player.health > 0) {
      // Calculate distance from bomb explosion
      const distance = Math.sqrt(
        Math.pow(player.x - bomb.x, 2) + Math.pow(player.y - bomb.y, 2)
      )
      
      // If player is within explosion radius
      if (distance <= EXPLOSION_RADIUS) {
        // Check if player is invisible (still takes damage but reduced)
        const isInvisible = player.invisibilityEnd && now < player.invisibilityEnd
        const actualDamage = isInvisible ? Math.floor(EXPLOSION_DAMAGE * 0.5) : EXPLOSION_DAMAGE
        
        // Apply damage
        player.health = Math.max(0, player.health - actualDamage)
        player.hitTime = now
        player.lastUpdate = now
        
        console.log(`💥 Player ${player.id} hit by explosion! Distance: ${distance.toFixed(1)}, Damage: ${actualDamage}, Health: ${player.health}`)
      }
    }
  })
}

// Update game physics (bullets movement and collision)
function updateGamePhysics(gameState: GameState): void {
  const now = Date.now()
  const deltaTime = 8.33 // ~120 FPS for smoother bullet movement at high speeds
  
  // Update bullet positions
  gameState.pulses = gameState.pulses.filter(pulse => {
    // Check bullet age - remove bullets older than 5 seconds
    const bulletAge = now - pulse.timestamp
    if (bulletAge > BULLET_MAX_AGE) {
      return false
    }
    
    // Move bullet with smaller time steps for smoother movement
    pulse.x += pulse.dx * pulse.speed * (deltaTime / 1000)
    pulse.y += pulse.dy * pulse.speed * (deltaTime / 1000)
    
    // Remove bullets that are off-screen (give more margin for high-speed bullets)
    if (pulse.x < -50 || pulse.x > CANVAS_WIDTH + 50 || 
        pulse.y < -50 || pulse.y > CANVAS_HEIGHT + 50) {
      return false
    }
    
    // Check collision with obstacles - precise collision detection
    for (const obstacle of gameState.obstacles || []) {
      // Check if bullet center is inside the obstacle rectangle
      if (pulse.x >= obstacle.x && pulse.x <= obstacle.x + obstacle.width &&
          pulse.y >= obstacle.y && pulse.y <= obstacle.y + obstacle.height) {
        return false // Remove bullet immediately when it touches obstacle
      }
    }
    
    // Check collision with players
    let hitPlayer = false
    Object.values(gameState.players).forEach(player => {
      if (player.id !== pulse.playerId && player.health > 0) {
        // Check if player is invisible
        const isInvisible = player.invisibilityEnd && now < player.invisibilityEnd
        
        if (!isInvisible && checkCollision(pulse.x, pulse.y, BULLET_RADIUS, player.x, player.y, PLAYER_RADIUS)) {
          // Hit detected!
          player.health = Math.max(0, player.health - pulse.damage)
          player.hitTime = now
          player.lastUpdate = now
          hitPlayer = true
          console.log(`🎯 Player ${player.id} hit by ${pulse.playerId}! Health: ${player.health}`)
        } else if (isInvisible) {
          // console.log(`🟣 Bullet passed through invisible player ${player.id}`)
        }
      }
    })
    
    // Remove bullet if it hit someone
    return !hitPlayer
  })

  // BOMB PHYSICS: Update bomb positions and handle explosions
  gameState.bombs = gameState.bombs.filter(bomb => {
    // Update bomb position
    bomb.x += bomb.dx * bomb.speed * (deltaTime / 1000)
    bomb.y += bomb.dy * bomb.speed * (deltaTime / 1000)
    
    // Check if bomb is out of bounds
    if (bomb.x < 0 || bomb.x > 1000 || bomb.y < 0 || bomb.y > 450) {
      return false // Remove bomb
    }
    
    // Check collision with obstacles
    for (const obstacle of gameState.obstacles || []) {
      if (bomb.x >= obstacle.x && bomb.x <= obstacle.x + obstacle.width &&
          bomb.y >= obstacle.y && bomb.y <= obstacle.y + obstacle.height) {
        // Bomb hit obstacle - explode immediately
        handleBombExplosion(gameState, bomb, now)
        return false // Remove bomb
      }
    }
    
    // Check if bomb should explode (time-based)
    if (now >= bomb.explodeTime) {
      handleBombExplosion(gameState, bomb, now)
      return false // Remove bomb
    }
    
    return true // Keep bomb
  })
}

// Simple cleanup of old games
setInterval(() => {
  const now = Date.now()
  Object.keys(gameStorage).forEach(gameCode => {
    const game = gameStorage[gameCode]
    // Keep games for 15 minutes after last update
    const maxAge = 900000 // 15 minutes
    if (now - game.lastUpdate > maxAge) {
      console.log(`🧹 Cleaning up old game: ${gameCode}`)
      delete gameStorage[gameCode]
    }
  })
}, 60000) // Clean every minute

// GET: Retrieve game state
export async function GET(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const { gameCode } = params
    
    if (!gameCode || gameCode.length !== 6) {
      return NextResponse.json({ error: 'Invalid game code' }, { status: 400 })
    }

    // Get game state from memory
    let gameState = gameStorage[gameCode]
    
    if (!gameState) {
      // Return empty game state if not found
      return NextResponse.json({
        players: {},
        pulses: [],
        obstacles: [],
        lastUpdate: Date.now(),
        created: Date.now()
      })
    }

    // Clean up old players (older than 30 seconds)
    const now = Date.now()
    const activePlayers: Record<string, Player> = {}
    
    Object.entries(gameState.players || {}).forEach(([playerId, player]) => {
      if (now - player.lastUpdate < 30000) { // 30 second timeout
        activePlayers[playerId] = player
      }
    })

    gameState = {
      ...gameState,
      players: activePlayers,
      lastUpdate: now
    }

    // Update the cleaned state and run physics
    if (Object.keys(activePlayers).length > 0) {
      gameState.players = activePlayers
      gameStorage[gameCode] = gameState
      
      // Update game physics
      updateGamePhysics(gameState)
    } else {
      // Clear players but keep the game state with obstacles
      gameState.players = {}
      gameStorage[gameCode] = gameState
    }

    return NextResponse.json(gameState)
  } catch (error) {
    console.error('Error getting game state:', error)
    return NextResponse.json({ error: 'Failed to get game state' }, { status: 500 })
  }
}

// POST: Update game state
export async function POST(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const { gameCode } = params
    const body = await request.json()
    
    if (!gameCode || gameCode.length !== 6) {
      return NextResponse.json({ error: 'Invalid game code' }, { status: 400 })
    }

    // Get current game state
    let gameState = gameStorage[gameCode]
    
    if (!gameState) {
      // Create new game state with 10 static obstacles
      const obstacles = generateObstacles()
      gameState = {
        players: {},
        pulses: [],
        obstacles: obstacles,
        powerups: [], // Initialize empty powerups array
        bombs: [], // Initialize empty bombs array
        lastUpdate: Date.now(),
        created: Date.now(),
        lastPowerupSpawn: Date.now() // Initialize powerup spawn timer
      }
    }

    // Handle different types of updates
    if (body.type === 'shoot' && body.playerId && body.playerData) {
      // Handle shooting request
      const shootingPlayer = gameState.players[body.playerId]
      if (shootingPlayer) {
        const now = Date.now()
        const timeSinceLastShot = now - (shootingPlayer.lastShot || 0)
        
        // Enforce server-side cooldown
        if (timeSinceLastShot >= SHOOT_COOLDOWN) {
          // Create bullet
          const rotation = body.playerData.rotation || 0
          const radians = (rotation * Math.PI) / 180
          const bulletId = `${body.playerId}_${now}_${Math.random().toString(36).substr(2, 5)}`
          
          const newBullet: Pulse = {
            id: bulletId,
            x: body.playerData.x,
            y: body.playerData.y,
            dx: Math.sin(radians),
            dy: -Math.cos(radians),
            playerId: body.playerId,
            color: shootingPlayer.color,
            damage: BULLET_DAMAGE,
            timestamp: now,
            speed: BULLET_SPEED
          }
          
          // Add bullet to game state
          gameState.pulses = gameState.pulses || []
          gameState.pulses.push(newBullet)
          
          // Update player's last shot time
          shootingPlayer.lastShot = now
          shootingPlayer.lastUpdate = now
          
          console.log(`🔫 Player ${body.playerId} shot bullet ${bulletId}`)
        } else {
          console.log(`🚫 Player ${body.playerId} shot too soon - ${SHOOT_COOLDOWN - timeSinceLastShot}ms remaining`)
        }
      }
    } else if (body.playerId && body.playerData) {
      // Update player data (movement, etc.)
      gameState.players = gameState.players || {}
      const existingPlayer = gameState.players[body.playerId]
      
      gameState.players[body.playerId] = {
        ...existingPlayer, // Preserve existing data like health
        ...body.playerData,
        health: existingPlayer?.health !== undefined ? existingPlayer.health : 3, // Preserve health
        lastUpdate: Date.now()
      }
    }

    // Handle powerup collection
    if (body.type === 'powerup_collect' && body.playerId && body.powerupId) {
      const player = gameState.players[body.playerId]
      const powerupIndex = gameState.powerups.findIndex(p => p.id === body.powerupId)
      
      if (player && powerupIndex !== -1) {
        const powerup = gameState.powerups[powerupIndex]
        console.log(`🟣 Player ${body.playerId} collected ${powerup.type} powerup`)
        
        // Apply powerup effect to player
        if (powerup.type === 'invisibility') {
          const powerupDuration = 8000 // 8 seconds
          player.invisibilityEnd = Date.now() + powerupDuration
          console.log(`🟣 Applied invisibility to player ${body.playerId} until ${player.invisibilityEnd}`)
        } else if (powerup.type === 'bomb') {
          // Add bomb to player inventory (max 3)
          player.bombCount = Math.min((player.bombCount || 0) + 1, 3)
          console.log(`💣 Added bomb to player ${body.playerId}, total: ${player.bombCount}`)
        }
        
        // Remove the powerup from the game
        gameState.powerups.splice(powerupIndex, 1)
        
        // Update player in game state
        gameState.players[body.playerId] = player
      }
    }

    // Handle bomb throwing
    if (body.type === 'bomb_throw' && body.playerId && body.playerData) {
      const throwingPlayer = gameState.players[body.playerId]
      if (throwingPlayer && (throwingPlayer.bombCount || 0) > 0) {
        const now = Date.now()
        const timeSinceLastThrow = now - (throwingPlayer.lastBombThrow || 0)
        
        // Enforce server-side cooldown (1 second)
        if (timeSinceLastThrow >= 1000) {
          // Create bomb projectile
          const rotation = body.playerData.rotation || 0
          const radians = (rotation * Math.PI) / 180
          const bombId = `bomb_${body.playerId}_${now}_${Math.random().toString(36).substr(2, 5)}`
          
          const newBomb: Bomb = {
            id: bombId,
            x: body.playerData.x,
            y: body.playerData.y,
            dx: Math.sin(radians), // Direction X
            dy: -Math.cos(radians), // Direction Y (negative because canvas Y is inverted)
            playerId: body.playerId,
            color: throwingPlayer.color,
            timestamp: now,
            explodeTime: now + 3000, // Explode after 3 seconds
            speed: 200 // Bomb travel speed
          }
          
          gameState.bombs.push(newBomb)
          
          // Decrease player bomb count and update throw time
          throwingPlayer.bombCount = Math.max((throwingPlayer.bombCount || 1) - 1, 0)
          throwingPlayer.lastBombThrow = now
          
          console.log(`💣 Player ${body.playerId} threw bomb ${bombId}`)
        } else {
          console.log(`🚫 Bomb throw blocked for ${body.playerId} - cooldown active`)
        }
      }
    }

    // Legacy pulse handling (remove this eventually)
    if (body.pulses) {
      // Update pulses data - replace all pulses
      gameState.pulses = body.pulses
    }

    if (body.newPulse) {
      // Add single new pulse
      gameState.pulses = gameState.pulses || []
      gameState.pulses.push(body.newPulse)
    }
    
    gameState.lastUpdate = Date.now()

    // POWERUP SPAWNING: Randomly spawn powerups
    const now = Date.now()
    const timeSinceLastPowerupSpawn = now - (gameState.lastPowerupSpawn || 0)
    const POWERUP_SPAWN_INTERVAL = 15000 // Spawn a powerup every 15 seconds
    const MAX_POWERUPS = 3 // Maximum powerups on map at once
    
    if (timeSinceLastPowerupSpawn >= POWERUP_SPAWN_INTERVAL && gameState.powerups.length < MAX_POWERUPS) {
      // Only spawn powerups if there are players in the game
      const playerCount = Object.keys(gameState.players).length
      if (playerCount > 0) {
        const powerup = spawnRandomPowerup()
        if (powerup) {
          gameState.powerups.push(powerup)
          gameState.lastPowerupSpawn = now
          console.log(`🟣 Spawned ${powerup.type} powerup at (${powerup.x}, ${powerup.y})`)
        }
      }
    }

    // Update physics before saving
    updateGamePhysics(gameState)

    // Save updated state
    gameStorage[gameCode] = gameState

    return NextResponse.json({ success: true, gameState })
  } catch (error) {
    console.error('Error updating game state:', error)
    return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 })
  }
}

// DELETE: Remove player from game
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const { gameCode } = params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    
    if (!gameCode || !playerId) {
      return NextResponse.json({ error: 'Missing game code or player ID' }, { status: 400 })
    }

    // Get current game state
    const gameState = gameStorage[gameCode]
    
    if (gameState && gameState.players && gameState.players[playerId]) {
      delete gameState.players[playerId]
      gameState.lastUpdate = Date.now()
      
      if (Object.keys(gameState.players).length > 0) {
        gameStorage[gameCode] = gameState
      } else {
        // Delete empty games
        delete gameStorage[gameCode]
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing player:', error)
    return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
  }
}
