# Maintenance Game Mechanics (src/components/MaintenanceGame.tsx)

This document explains key mechanics and UI patterns implemented in `src/components/MaintenanceGame.tsx`.

## Overview
- Single-canvas click-to-move game with moving obstacles and collectibles.
- Progression increases difficulty every 1000 score (level system).
- Level 5 introduces new mechanics: Slow Zones, Speed Gates, and a Spawner Core.
- Guide and Shop implemented as modal overlays with outside-click close and an “×” header.

## Player Movement
- Movement lerp: `player -> target` with `moveRate` adjusted by zones and gates.
- Clamp to canvas edges; soft visual feedback when hitting walls.

## Collectibles
- Foods (amber circles): wandering items with lifetimes; earlier pickup grants more points.
- Blue Orbs: enable a temporary trail effect with subtle particle magnetism.
- Lucky Box (green rectangle): grants a one-time shield.

## Obstacles
- Rectangles with bounce; some have rounded corners and are ~25% faster.
- Spawner Core emits small rounded obstacles at intervals.

## Shield & Collision Handling
- When shielded and colliding:
  - Consume shield and spawn burst particles.
  - Emit a burst wave centered on the player that repels nearby obstacles (position nudge + outward velocity).
  - Keep player position unchanged; sync `target` to current to avoid snap-back.
  - Set invulnerability frames (`invulRef`) so subsequent overlaps won’t kill.
  - Break out of the obstacle loop on that frame.
- While invulnerable, collisions only perform light separation and never trigger defeat.

## Camera & Visual Effects
- Canvas applies mild translation for wall hits and a defeat-only swipe/blur.
- Shield collisions do not move the camera (no shake on knockback).

## Level 5 Mechanics
- Slow Zones: purple circles reduce movement rate inside.
- Speed Gates: green bars grant a brief speed boost on pass-through.
- Spawner Core: pink core periodically emits small rounded obstacles.

## HUD & Modals
- HUD (Score, Best, Level, Guide, Shop) sits outside the canvas.
- Modals:
  - Outside-click closes overlay; content stops propagation.
  - Top-right “×” header; glassy panel with shadow and ring.
  - Guide uses card-style rows with clear shapes and labels.

## Persistence
- `localStorage` keys:
  - `maintenance_best_score`
  - `maintenance_coins`
  - `maintenance_inventory`

## Best Score Celebration
- “Hooray! New Best 🎉” appears only on game end (loss), not mid-run.

## Validation Checklist
- Shield collision: no death while shield is consumed; clean knockback; invulnerability active.
- Camera: no shake on shield collision; defeat swipe/blur only when lost.
- Guide: legible cards, accurate shapes; outside-click and “×” to close.
- Shop: outside-click and “×” to close; inventory and coins persist.

## Level Progression Mechanics
- Level 1: Base gameplay; foods, blue orbs, lucky box (shield).
- Level 2+: On every new level, a golden star spawns with a 3s lifetime.
  - Star Pickup: activates Star Power (orbiting stars around the player).
  - Star Power: destroys up to 5 obstacles on contact with a pop animation.
  - Visual: 6 small stars orbit the player; angle advances continuously.
- Level 5: Introduces Slow Zones, Speed Gates, and Spawner Core (as above).

## Star Power
- Activation: pick up a golden star collectible (lifetime: ~3s).
- Effect: 6 orbiting stars circle the player (radius ~22px) and destroy up to 5 obstacles when they touch.
- Visuals: amber stars with subtle outline; pop particles on obstacle destruction.
- Termination: ends after 5 obstacle destructions or when manually deactivated.

---
For deeper changes, consider adding unit tests for collision resolution and invulnerability duration, and snapshot tests for modal UI.