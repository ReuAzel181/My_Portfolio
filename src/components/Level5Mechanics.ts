// Level 5 mechanics extracted: new obstacle motion and display helpers
// Keep this module self-contained so MaintenanceGame.tsx stays lean.

export type Level5Motion = {
  baseX: number;
  baseY: number;
  ax: number; // amplitude X
  ay: number; // amplitude Y
  freqX: number; // frequency X (radians per ms)
  freqY: number; // frequency Y (radians per ms)
  phase: number; // phase offset
  diamond: boolean; // render as diamond vs rounded rect
};

export type Level5State = {
  motions: Level5Motion[];
};

type MovableRect = { x: number; y: number; w: number; h: number; vx: number; vy: number; round?: boolean };

// Create new Level 5 obstacles and associated motion params.
export function createLevel5(width: number, height: number, count = 6): { obstacles: MovableRect[]; state: Level5State } {
  const obstacles: MovableRect[] = [];
  const motions: Level5Motion[] = [];
  for (let i = 0; i < count; i++) {
    const w = 36 + Math.random() * 36;
    const h = 18 + Math.random() * 36;
    const x = Math.random() * (width - w);
    const y = Math.random() * (height - h);
    const diamond = Math.random() < 0.5;
    obstacles.push({ x, y, w, h, vx: 0, vy: 0, round: !diamond });
    motions.push({
      baseX: x,
      baseY: y,
      ax: 40 + Math.random() * 60,
      ay: 30 + Math.random() * 50,
      freqX: 0.001 + Math.random() * 0.0015,
      freqY: 0.0012 + Math.random() * 0.0015,
      phase: Math.random() * Math.PI * 2,
      diamond,
    });
  }
  return { obstacles, state: { motions } };
}

// Update positions using parametric drift and gently wrap around edges.
export function updateLevel5(state: Level5State, obstacles: MovableRect[], tMs: number, width: number, height: number): void {
  const m = state.motions;
  const n = Math.min(obstacles.length, m.length);
  for (let i = 0; i < n; i++) {
    const o = obstacles[i];
    const mm = m[i];
    const nx = mm.baseX + mm.ax * Math.sin(mm.freqX * tMs + mm.phase);
    const ny = mm.baseY + mm.ay * Math.cos(mm.freqY * tMs + mm.phase * 0.7);
    // soft clamp
    o.x = Math.min(Math.max(0, nx), width - o.w);
    o.y = Math.min(Math.max(0, ny), height - o.h);
    // derive small velocity for collision separation visuals
    o.vx = (Math.random() * 0.2 - 0.1);
    o.vy = (Math.random() * 0.2 - 0.1);
  }
}