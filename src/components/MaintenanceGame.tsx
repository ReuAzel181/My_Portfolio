"use client"

import { useRef, useEffect, useState } from "react";

type Obstacle = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  round?: boolean; // rounded corners and 25% faster
};
// Level 5 mechanics types
type Zone = { x: number; y: number; r: number };
type Gate = { x: number; y: number; w: number; h: number };
type Spawner = { x: number; y: number; cooldown: number };

export default function MaintenanceGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [lost, setLost] = useState(false);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(false);

  // Player state
  const player = useRef({ x: 100, y: 100, r: 12 });
  const target = useRef<{ x: number; y: number } | null>(null);

  // Visual/animation state
  const wallHit = useRef(0); // fades from 1 -> 0 when clamped to wall
  const defeat = useRef<{ active: boolean; t: number }>({ active: false, t: 0 });
  const startTime = useRef<number>(0);

  // Obstacles
  const obstaclesRef = useRef<Obstacle[]>([]);
  type Orb = { x: number; y: number; r: number; vx: number; vy: number };
  const orbsRef = useRef<Orb[]>([]);
  const powerRef = useRef<{ active: boolean; timer: number }>({ active: false, timer: 0 });
  // Star collectible (level-up reward) and star power (orbiting destroyers)
  type StarItem = { x: number; y: number; r: number; vx: number; vy: number; life: number };
  const starsRef = useRef<StarItem[]>([]);
  const starPowerRef = useRef<{ active: boolean; killsRemaining: number; angle: number }>({ active: false, killsRemaining: 0, angle: 0 });
  const prevLevelRef = useRef<number>(1);
  // Food collectibles: pulse, lifetime-based scoring, despawn if not collected
  type Food = { x: number; y: number; r: number; vx: number; vy: number; life: number; maxLife: number; pulse: number };
  const foodsRef = useRef<Food[]>([]);
  // Lucky box power-up (one-time shield)
  type LuckyBox = { x: number; y: number; w: number; h: number; vx: number; vy: number };
  const luckyRef = useRef<LuckyBox | null>(null);
  const shieldRef = useRef<boolean>(false);

  // Canvas swipe effect when hitting walls
  const swipeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Swipe/blur effect on defeat to make transition obvious
  const defeatSwipeRef = useRef<{ x: number; y: number; blur: number }>({ x: 0, y: 0, blur: 0 });
  const invulRef = useRef<number>(0); // brief invulnerability frames after shield absorption

  // Simple particle trail when grabbing an orb
  type Particle = { x: number; y: number; vx: number; vy: number; life: number; r: number; alpha: number };
  const particlesRef = useRef<Particle[]>([]);
  // Food collection rings (pickup effect)
  type CollectionRing = { x: number; y: number; life: number };
  const collectionRingsRef = useRef<CollectionRing[]>([]);
  // Shield hits (support multi-hit shields)
  const shieldHitsRef = useRef<number>(0);

  // Score/HUD
  const scoreRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const hudFrameRef = useRef<number>(0);
  const levelRef = useRef<number>(1);
  const lastHundredRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideShownRef = useRef<boolean>(false);
  const comboRef = useRef<number>(1);
  const comboTimerRef = useRef<number>(0);
  const [newBestFlash, setNewBestFlash] = useState(false);
  const newBestTimerRef = useRef<number>(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [coins, setCoins] = useState<number>(0);
  const [inventory, setInventory] = useState<string[]>([]);
  // Level-based points system: 5 points per level (incrementing by 5 each level)
  const [levelPoints, setLevelPoints] = useState<number>(0);
  const levelPointsRef = useRef<number>(0);
  // Star count system: starts with 5, reduces on obstacle collision
  const [starCount, setStarCount] = useState<number>(5);
  const starCountRef = useRef<number>(5);
  // Level 5 mechanic refs
  const zonesRef = useRef<Zone[]>([]);
  const gatesRef = useRef<Gate[]>([]);
  const gateBoostRef = useRef<number>(0);
  const spawnerRef = useRef<Spawner | null>(null);

  const resetGame = (canvas?: HTMLCanvasElement) => {
    setLost(false);
    const c = canvas || canvasRef.current;
    if (!c) return;
    const { width, height } = c;
    player.current = { x: width / 2, y: height / 2, r: 12 };
    target.current = null;
    wallHit.current = 0;
    defeat.current = { active: false, t: 0 };
    defeatSwipeRef.current = { x: 0, y: 0, blur: 0 };
    // Spawn a few obstacles with random positions/velocities (moderate at level 1)
    const obs: Obstacle[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const w = 40 + Math.random() * 40;
      const h = 20 + Math.random() * 40;
      const x = Math.random() * (width - w);
      const y = Math.random() * (height - h);
      let vx = (Math.random() * 2 - 1) * (0.9 + Math.random() * 0.6);
      let vy = (Math.random() * 2 - 1) * (0.9 + Math.random() * 0.6);
      // Some obstacles have rounded corners and are 25% faster
      const round = Math.random() < 0.3;
      if (round) {
        vx *= 1.25;
        vy *= 1.25;
      }
      obs.push({ x, y, w, h, vx, vy, round });
    }
    obstaclesRef.current = obs;
    // Spawn collectibles
    const orbs: Orb[] = [];
    const orbCount = 3;
    for (let i = 0; i < orbCount; i++) {
      const r = 6 + Math.random() * 6;
      const x = r + Math.random() * (width - 2 * r);
      const y = r + Math.random() * (height - 2 * r);
      const vx = (Math.random() * 2 - 1) * 0.6;
      const vy = (Math.random() * 2 - 1) * 0.6;
      orbs.push({ x, y, r, vx, vy });
    }
    orbsRef.current = orbs;
    // Reset stars and star power
    starsRef.current = [];
    starPowerRef.current = { active: false, killsRemaining: 0, angle: 0 };
    prevLevelRef.current = 1;
    powerRef.current = { active: false, timer: 0 };
    // Initial foods
    const foods: Food[] = [];
    const foodCount = 2;
    for (let i = 0; i < foodCount; i++) {
      const r = 8 + Math.random() * 6;
      const x = r + Math.random() * (width - 2 * r);
      const y = r + Math.random() * (height - 2 * r);
      const vx = (Math.random() * 2 - 1) * 0.4;
      const vy = (Math.random() * 2 - 1) * 0.4;
      const life = 600 + Math.floor(Math.random() * 600); // ~10–20s
      foods.push({ x, y, r, vx, vy, life, maxLife: life, pulse: Math.random() * Math.PI * 2 });
    }
    foodsRef.current = foods;
    particlesRef.current = [];
    scoreRef.current = 0;
    levelRef.current = 1;
    setScore(0);
    luckyRef.current = null;
    shieldRef.current = false;
    startedRef.current = false;
    setStarted(false);
    comboRef.current = 1;
    comboTimerRef.current = 0;
    lastHundredRef.current = 0;
    pausedRef.current = false;
    setGuideOpen(false);
    guideShownRef.current = false;
    zonesRef.current = [];
    gatesRef.current = [];
    gateBoostRef.current = 0;
    spawnerRef.current = null;
  };

  const spawnFood = (width: number, height: number): Food => {
    const r = 8 + Math.random() * 6;
    const x = r + Math.random() * (width - 2 * r);
    const y = r + Math.random() * (height - 2 * r);
    const vx = (Math.random() * 2 - 1) * 0.4;
    const vy = (Math.random() * 2 - 1) * 0.4;
    const life = 600 + Math.floor(Math.random() * 600);
    return { x, y, r, vx, vy, life, maxLife: life, pulse: Math.random() * Math.PI * 2 };
  };

  // Spawn Level 5 mechanics entities (slow zones, speed gates, spawner core)
  const spawnLevel5Entities = (width: number, height: number) => {
    zonesRef.current = [
      { x: width * 0.3, y: height * 0.35, r: 55 },
      { x: width * 0.72, y: height * 0.65, r: 65 },
    ];
    gatesRef.current = [
      { x: width * 0.15, y: height * 0.15, w: 90, h: 10 },
      { x: width * 0.75, y: height * 0.25, w: 90, h: 10 },
    ];
    spawnerRef.current = { x: width * 0.5, y: height * 0.5, cooldown: 240 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high-DPI scaling and resize
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Fill available parent space
      const targetWidth = Math.max(320, Math.floor(rect.width));
      // If parent has little or no height, fall back to viewport fraction
      const parentHeight = rect.height > 0 ? rect.height : Math.floor(window.innerHeight * 0.8);
      const canvasPaddingBottom = 24; // ensure canvas doesn't touch bottom
      const targetHeight = Math.max(240, parentHeight - canvasPaddingBottom);

      canvas.width = Math.floor(targetWidth * dpr);
      canvas.height = Math.floor(targetHeight * dpr);
      canvas.style.width = targetWidth + "px";
      canvas.style.height = targetHeight + "px";
      resetGame(canvas);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const circleRectCollide = (cx: number, cy: number, r: number, rect: Obstacle) => {
      const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
      const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
      return dx * dx + dy * dy <= r * r;
    };

    const tick = (now?: number) => {
      if (!startTime.current) startTime.current = now || performance.now();
      const t = (now || performance.now()) - startTime.current; // ms since start
      const width = canvas.width;
      const height = canvas.height;

      // Background gradient (soft pastel) with gentle drift
      const ang = 0.25 + 0.15 * Math.sin(t * 0.0005);
      const x2 = Math.cos(ang) * width + width * 0.5;
      const y2 = Math.sin(ang) * height + height * 0.5;
      const grad = ctx.createLinearGradient(width * 0.5, height * 0.5, x2, y2);
      grad.addColorStop(0, "#f5f7ff");
      grad.addColorStop(1, "#e7ecff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      // Canvas stroke
      ctx.strokeStyle = "rgba(99,102,241,0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // Move player towards target (only after start, no speed boost)
      if (startedRef.current && !pausedRef.current && target.current) {
        // Level 5 mechanics: slow zones and speed gates adjust movement rate
        let moveRate = 0.08;
        // Speed gate temporary boost
        if (gateBoostRef.current > 0) moveRate *= 1.25;
        // Slow zones reduce move rate
        for (const z of zonesRef.current) {
          const dx = player.current.x - z.x;
          const dy = player.current.y - z.y;
          if (dx * dx + dy * dy <= z.r * z.r) {
            moveRate *= 0.65;
            break;
          }
        }
        player.current.x = lerp(player.current.x, target.current.x, moveRate);
        player.current.y = lerp(player.current.y, target.current.y, moveRate);
        const dx = player.current.x - target.current.x;
        const dy = player.current.y - target.current.y;
        if (Math.hypot(dx, dy) < 0.8) target.current = null;
      }

      // Clamp to walls, trigger a subtle squash pulse when hitting edges
      const px = player.current.x;
      const py = player.current.y;
      const r = player.current.r;
      const clampedX = Math.min(Math.max(r, px), width - r);
      const clampedY = Math.min(Math.max(r, py), height - r);
      if (clampedX !== px || clampedY !== py) {
        player.current.x = clampedX;
        player.current.y = clampedY;
        wallHit.current = Math.min(1, wallHit.current + 0.6);
        // Canvas no longer moves when hitting edges - removed swipe offset
      }
      wallHit.current *= 0.92; // decay pulse
      // Decay swipe and apply to canvas transform (no camera movement on shield knockback)
      swipeRef.current.x *= 0.88;
      swipeRef.current.y *= 0.88;
      // Combine with defeat swipe
      defeatSwipeRef.current.x *= 0.92;
      defeatSwipeRef.current.y *= 0.92;
      defeatSwipeRef.current.blur *= 0.92;
      const tx = swipeRef.current.x + defeatSwipeRef.current.x; // shield knockback no longer contributes here
      const ty = swipeRef.current.y + defeatSwipeRef.current.y;
      canvas.style.transform = `translate(${tx}px, ${ty}px)`;
      canvas.style.filter = `blur(${defeatSwipeRef.current.blur.toFixed(2)}px)`;

      // Update obstacles with boundary bounce (only after start)
      const obs = obstaclesRef.current;
      if (startedRef.current && !pausedRef.current) {
        for (const o of obs) {
          // Slow down slightly if defeated for a smoother freeze
          const damp = defeat.current.active ? 0.96 : 1;
          o.x += o.vx * damp;
          o.y += o.vy * damp;
          if (o.x <= 0 || o.x + o.w >= width) o.vx *= -1;
          if (o.y <= 0 || o.y + o.h >= height) o.vy *= -1;
        }
      }

      // Update and draw blue orbs
      const orbs = orbsRef.current;
      if (startedRef.current && !pausedRef.current) {
        for (const orb of orbs) {
          orb.x += orb.vx;
          orb.y += orb.vy;
          if (orb.x - orb.r <= 0 || orb.x + orb.r >= width) orb.vx *= -1;
          if (orb.y - orb.r <= 0 || orb.y + orb.r >= height) orb.vy *= -1;
        }
      }
      for (const orb of orbs) {
        ctx.fillStyle = "rgba(99,102,241,0.25)"; // indigo/25
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(99,102,241,0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Update and draw star collectibles (spawned on level-ups ≥2)
      const stars = starsRef.current;
      if (startedRef.current && !pausedRef.current) {
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          s.x += s.vx;
          s.y += s.vy;
          // gentle bounce
          if (s.x - s.r <= 0 || s.x + s.r >= width) s.vx *= -1;
          if (s.y - s.r <= 0 || s.y + s.r >= height) s.vy *= -1;
          s.life -= 1;
          if (s.life <= 0) stars.splice(i, 1);
        }
      }
      for (const s of stars) {
        // draw a small golden star
        const R = s.r;
        const cx = s.x, cy = s.y;
        ctx.fillStyle = "#f59e0b"; // amber-500
        ctx.strokeStyle = "#b45309"; // amber-700
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const outerAng = ((Math.PI * 2) * k) / 5 - Math.PI / 2;
          const innerAng = outerAng + Math.PI / 5;
          const ox = cx + Math.cos(outerAng) * R;
          const oy = cy + Math.sin(outerAng) * R;
          const ix = cx + Math.cos(innerAng) * (R * 0.5);
          const iy = cy + Math.sin(innerAng) * (R * 0.5);
          if (k === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Update foods (move, pulse, lifetime) only when started
      if (startedRef.current && !pausedRef.current) {
        for (const f of foodsRef.current) {
          f.x += f.vx;
          f.y += f.vy;
          if (f.x - f.r <= 0 || f.x + f.r >= width) f.vx *= -1;
          if (f.y - f.r <= 0 || f.y + f.r >= height) f.vy *= -1;
          f.life -= 1;
          f.pulse += 0.08;
        }
        // Magnet effect: while trail active, pull nearby foods slightly toward player
        if (powerRef.current.active) {
          for (const f of foodsRef.current) {
            const dx = player.current.x - f.x;
            const dy = player.current.y - f.y;
            const dist2 = dx * dx + dy * dy;
            if (dist2 < 160 * 160) {
              const ax = dx * 0.0006;
              const ay = dy * 0.0006;
              f.vx += ax;
              f.vy += ay;
            }
          }
        }
        // Remove expired foods
        foodsRef.current = foodsRef.current.filter((f) => f.life > 0);
      }
      // Draw foods (amber, fades with remaining life)
      for (const f of foodsRef.current) {
        const lifeRatio = Math.max(0, Math.min(1, f.life / f.maxLife));
        const s = 1 + Math.sin(f.pulse) * 0.25;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(234,179,8,${0.15 + 0.35 * lifeRatio})`; // amber-400
        ctx.fill();
        ctx.strokeStyle = `rgba(234,179,8,0.7)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw obstacles
      for (const o of obs) {
        ctx.lineWidth = 2;
        if (o.round) {
          ctx.fillStyle = "rgba(96,165,250,0.25)"; // blue-400/25
          ctx.strokeStyle = "rgba(96,165,250,0.9)"; // brighter stroke
          drawRoundedRect(o.x, o.y, o.w, o.h, 8);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(96,165,250,0.25)"; // blue-400/25
          ctx.strokeStyle = "rgba(96,165,250,0.6)";
          ctx.beginPath();
          ctx.rect(o.x, o.y, o.w, o.h);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Lucky box update/draw
      if (startedRef.current && luckyRef.current) {
        const lb = luckyRef.current;
        lb.x += lb.vx;
        lb.y += lb.vy;
        if (lb.x <= 0 || lb.x + lb.w >= width) lb.vx *= -1;
        if (lb.y <= 0 || lb.y + lb.h >= height) lb.vy *= -1;
      }
      if (luckyRef.current) {
        const lb = luckyRef.current;
        ctx.fillStyle = "rgba(16,185,129,0.25)"; // emerald/25
        ctx.strokeStyle = "rgba(16,185,129,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(lb.x, lb.y, lb.w, lb.h);
        ctx.fill();
        ctx.stroke();
      }

      // Draw player (glowing circle)
      const pulse = 0; // disable pulsing for a steady player size
      const squash = 0.18 * wallHit.current;
      const drawR = player.current.r * (1 + pulse + squash);
      ctx.shadowColor = "rgba(99,102,241,0.8)"; // indigo glow
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#6366f1"; // indigo-500
      ctx.beginPath();
      ctx.arc(player.current.x, player.current.y, drawR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Visible aura when shield is active
      if (shieldRef.current) {
        ctx.strokeStyle = "rgba(16,185,129,0.8)"; // emerald
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, drawR + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw orbiting stars when star power is active
      if (starPowerRef.current.active && starPowerRef.current.killsRemaining > 0) {
        const orbitCount = starPowerRef.current.killsRemaining; // Show only remaining stars
        const orbitR = 22;
        const pr = 6;
        const angBase = starPowerRef.current.angle;
        ctx.fillStyle = "#f59e0b";
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.2;
        for (let k = 0; k < orbitCount; k++) {
          const a = angBase + (Math.PI * 2 * k) / Math.max(orbitCount, 1); // Prevent division by zero
          const sx = player.current.x + Math.cos(a) * orbitR;
          const sy = player.current.y + Math.sin(a) * orbitR;
          // draw small star polygon
          ctx.beginPath();
          for (let p = 0; p < 5; p++) {
            const outerAng = ((Math.PI * 2) * p) / 5 - Math.PI / 2;
            const innerAng = outerAng + Math.PI / 5;
            const ox = sx + Math.cos(outerAng) * pr;
            const oy = sy + Math.sin(outerAng) * pr;
            const ix = sx + Math.cos(innerAng) * (pr * 0.5);
            const iy = sy + Math.sin(innerAng) * (pr * 0.5);
            if (p === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Collision check (shield absorbs one hit)
      if (startedRef.current && !pausedRef.current && !defeat.current.active) {
        // Star pickup: touching a star activates orbiting destroyers (5 obstacle kills)
        for (let i = starsRef.current.length - 1; i >= 0; i--) {
          const s = starsRef.current[i];
          const dx = player.current.x - s.x;
          const dy = player.current.y - s.y;
          if (dx * dx + dy * dy <= (player.current.r + s.r) * (player.current.r + s.r)) {
            starPowerRef.current = { active: true, killsRemaining: 5, angle: 0 };
            // pickup burst
            for (let j = 0; j < 14; j++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.8 + Math.random() * 1.4;
              particlesRef.current.push({
                x: s.x,
                y: s.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 32 + Math.floor(Math.random() * 20),
                r: 2 + Math.random() * 2,
                alpha: 0.9,
              });
            }
            starsRef.current.splice(i, 1);
          }
        }
        // Star power obstacle destruction: orbiting stars collide with obstacles
        if (starPowerRef.current.active && starPowerRef.current.killsRemaining > 0) {
          const orbitCount = Math.max(1, starPowerRef.current.killsRemaining);
          const orbitR = 22;
          const pr = 6; // radius of each orbiting star collider
          const angBase = starPowerRef.current.angle;
          // iterate obstacles backwards to allow removal
          for (let oi = obstaclesRef.current.length - 1; oi >= 0 && starPowerRef.current.killsRemaining > 0; oi--) {
            const o = obstaclesRef.current[oi];
            let hit = false;
            for (let k = 0; k < orbitCount; k++) {
              const a = angBase + (Math.PI * 2 * k) / orbitCount;
              const sx = player.current.x + Math.cos(a) * orbitR;
              const sy = player.current.y + Math.sin(a) * orbitR;
              if (circleRectCollide(sx, sy, pr, o)) { hit = true; break; }
            }
            if (hit) {
              // pop animation and remove obstacle
              for (let j = 0; j < 16; j++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 0.8 + Math.random() * 1.2;
                particlesRef.current.push({
                  x: o.x + o.w / 2,
                  y: o.y + o.h / 2,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  life: 26 + Math.floor(Math.random() * 18),
                  r: 2 + Math.random() * 2,
                  alpha: 0.95,
                });
              }
              obstaclesRef.current.splice(oi, 1);
              starPowerRef.current.killsRemaining -= 1;
              if (starPowerRef.current.killsRemaining <= 0) {
                starPowerRef.current.active = false;
                break;
              }
            }
          }
          // advance orbit angle
          starPowerRef.current.angle += 0.08;
        }
        // Lucky box pickup: entering grants one-time shield
        if (luckyRef.current) {
          const lb = luckyRef.current;
          if (circleRectCollide(player.current.x, player.current.y, player.current.r, { x: lb.x, y: lb.y, w: lb.w, h: lb.h, vx: 0, vy: 0 })) {
            shieldRef.current = true;
            shieldHitsRef.current = Math.max(shieldHitsRef.current, 1); // lucky box grants 1-hit shield
            luckyRef.current = null;
            // brief pickup particles
            for (let i = 0; i < 16; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.6 + Math.random() * 1.0;
              particlesRef.current.push({
                x: player.current.x,
                y: player.current.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 28 + Math.floor(Math.random() * 16),
                r: 2 + Math.random() * 2,
                alpha: 0.9,
              });
            }
          }
        }
        for (const o of obs) {
          if (circleRectCollide(player.current.x, player.current.y, player.current.r, o)) {
            if (shieldRef.current) {
              // Consume one shield hit and emit a burst wave that repels obstacles
              if (shieldHitsRef.current > 1) {
                shieldHitsRef.current -= 1;
                shieldRef.current = true;
              } else {
                shieldHitsRef.current = 0;
                shieldRef.current = false;
              }
              for (let i = 0; i < 24; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 1.2 + Math.random() * 1.4;
                particlesRef.current.push({
                  x: player.current.x,
                  y: player.current.y,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  life: 26 + Math.floor(Math.random() * 18),
                  r: 2 + Math.random() * 2,
                  alpha: 0.95,
                });
              }
              // Burst wave: repel nearby obstacles away from the player
              const burstRadius = 140; // affects obstacles in this radius
              const pushMag = 3.2; // impulse added to obstacle velocity
              for (const oo of obs) {
                const cx = oo.x + oo.w / 2;
                const cy = oo.y + oo.h / 2;
                let dx = cx - player.current.x;
                let dy = cy - player.current.y;
                const dist = Math.hypot(dx, dy) || 1;
                if (dist <= burstRadius) {
                  dx /= dist;
                  dy /= dist;
                  // Small positional nudge outwards to resolve overlap immediately
                  const nudge = 14;
                  oo.x = Math.min(Math.max(0, oo.x + dx * nudge), width - oo.w);
                  oo.y = Math.min(Math.max(0, oo.y + dy * nudge), height - oo.h);
                  // Add outward velocity impulse so they disperse
                  oo.vx += dx * pushMag;
                  oo.vy += dy * pushMag;
                }
              }
              // Keep current target at player to avoid snap-back
              target.current = { x: player.current.x, y: player.current.y };
              // Brief invulnerability so overlaps this frame won’t defeat the player
              invulRef.current = Math.max(invulRef.current, 40);
              break;
            }
            if (invulRef.current > 0) {
              // light separation without defeat while invulnerable
              const cx = o.x + o.w / 2;
              const cy = o.y + o.h / 2;
              let dx = player.current.x - cx;
              let dy = player.current.y - cy;
              const len = Math.hypot(dx, dy) || 1;
              dx /= len;
              dy /= len;
              const kb = 16;
              player.current.x = Math.min(Math.max(player.current.r, player.current.x + dx * kb), width - player.current.r);
              player.current.y = Math.min(Math.max(player.current.r, player.current.y + dy * kb), height - player.current.r);
              continue;
            }
            setLost(true);
            defeat.current = { active: true, t: 0 };
            // Kick in a visible swipe + blur on defeat
            const dir = Math.sign(player.current.x - width / 2) || -1;
            defeatSwipeRef.current.x = 64 * dir;
            defeatSwipeRef.current.y = -24;
            defeatSwipeRef.current.blur = 3.5;
            break;
          }
        }
      }

      // Collectibles collision: circle-circle
      const circleCircle = (ax: number, ay: number, ar: number, bx: number, by: number, br: number) => {
        const dx = ax - bx;
        const dy = ay - by;
        return dx * dx + dy * dy <= (ar + br) * (ar + br);
      };
      if (startedRef.current && !pausedRef.current && !defeat.current.active) {
        for (const orb of orbs) {
          if (circleCircle(player.current.x, player.current.y, player.current.r, orb.x, orb.y, orb.r)) {
            powerRef.current = { active: true, timer: 180 }; // ~3s trail effect
            // trail pickup burst particles
            for (let i = 0; i < 18; i++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.6 + Math.random() * 1.4;
              particlesRef.current.push({
                x: player.current.x,
                y: player.current.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 40 + Math.floor(Math.random() * 20),
                r: 2 + Math.random() * 2,
                alpha: 0.9,
              });
            }
            // Respawn orb elsewhere
            const nr = orb.r;
            orb.x = nr + Math.random() * (width - 2 * nr);
            orb.y = nr + Math.random() * (height - 2 * nr);
          }
        }
        // Food collision: earlier pickup yields higher score + combo multiplier
        for (let i = foodsRef.current.length - 1; i >= 0; i--) {
          const f = foodsRef.current[i];
          if (circleCircle(player.current.x, player.current.y, player.current.r, f.x, f.y, f.r)) {
            // burst particles
            for (let j = 0; j < 14; j++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.6 + Math.random() * 1.2;
              particlesRef.current.push({
                x: f.x,
                y: f.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 28 + Math.floor(Math.random() * 16),
                r: 2 + Math.random() * 2,
                alpha: 0.95,
              });
            }
            // pickup ring effect
            collectionRingsRef.current.push({ x: f.x, y: f.y, life: 24 });
            const bonus = Math.max(10, Math.floor(100 * (f.life / f.maxLife)));
            scoreRef.current += bonus * Math.max(1, comboRef.current);
            comboTimerRef.current = 120; // ~2s window
            comboRef.current = Math.min(comboRef.current + 1, 5);
            foodsRef.current.splice(i, 1);
          }
        }
      }
      if (powerRef.current.active) {
        powerRef.current.timer -= 1;
        // emit continuous trail particles while active
        for (let i = 0; i < 2; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 0.3 + Math.random() * 0.8;
          particlesRef.current.push({
            x: player.current.x,
            y: player.current.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 24 + Math.floor(Math.random() * 12),
            r: 1.5 + Math.random() * 1.5,
            alpha: 0.8,
          });
        }
        if (powerRef.current.timer <= 0) powerRef.current.active = false;
      }

      // Update particles
      const parts = particlesRef.current;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= 1;
        p.alpha *= 0.97;
        if (p.life <= 0 || p.alpha < 0.05) parts.splice(i, 1);
      }
      for (const p of parts) {
        ctx.fillStyle = `rgba(99,102,241,${Math.max(0, Math.min(1, p.alpha))})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Defeat animation: soft shockwave ring and fade glow
      if (defeat.current.active) {
        defeat.current.t += 1; // frame counter
        const dt = defeat.current.t;
        const ringR = drawR + dt * 2.5;
        const alpha = Math.max(0, 0.6 - dt * 0.02);
        ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
        ctx.lineWidth = 2 + dt * 0.05;
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, ringR, 0, Math.PI * 2);
        ctx.stroke();
        // Add slight desaturation overlay
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(0, 0, width, height);
      }

      // Progression rules (only after start)
      if (startedRef.current && !pausedRef.current && !defeat.current.active) {
        // Update computed level: every 1000 score is a level
        levelRef.current = Math.floor(scoreRef.current / 1000) + 1;
        // On level-up, spawn a star collectible (level ≥ 2) and award level points
        if (levelRef.current !== prevLevelRef.current) {
          // Award level points: 5 points per level (incrementing by 5 each level)
          const pointsAwarded = levelRef.current * 5;
          levelPointsRef.current += pointsAwarded;
          setLevelPoints(levelPointsRef.current);
          
          if (levelRef.current >= 2) {
            const r = 7;
            const x = r + Math.random() * (width - 2 * r);
            const y = r + Math.random() * (height - 2 * r);
            const vx = (Math.random() * 2 - 1) * 0.8;
            const vy = (Math.random() * 2 - 1) * 0.8;
            starsRef.current.push({ x, y, r, vx, vy, life: 180 }); // 3s lifetime
          }
          prevLevelRef.current = levelRef.current;
        }
        // Decay combo timer
        if (comboTimerRef.current > 0) {
          comboTimerRef.current -= 1;
          if (comboTimerRef.current <= 0) comboRef.current = 1;
        }
        // Add obstacles on each new 200 breakpoint: add (level) obstacles
        const hundredBucket = Math.floor(scoreRef.current / 200);
        if (hundredBucket > lastHundredRef.current) {
          const addCount = Math.max(1, levelRef.current);
          for (let i = 0; i < addCount; i++) {
            const w = 32 + Math.random() * 40;
            const h = 16 + Math.random() * 40;
            const x = Math.random() * (width - w);
            const y = Math.random() * (height - h);
            let vx = (Math.random() * 2 - 1) * (1.1 + Math.random());
            let vy = (Math.random() * 2 - 1) * (1.1 + Math.random());
            const round = Math.random() < 0.35;
            if (round) {
              vx *= 1.25;
              vy *= 1.25;
            }
            obstaclesRef.current.push({ x, y, w, h, vx, vy, round });
          }
          lastHundredRef.current = hundredBucket;
        }
        // Respawn foods over time, scaling with level to offset obstacle growth
        const maxFoods = Math.min(3 + Math.floor(levelRef.current / 2), 10);
        const baseChance = 0.008; // base spawn chance per frame
        const levelBoost = Math.min(0.002 * levelRef.current, 0.02); // scale chance by level, capped
        if (foodsRef.current.length < maxFoods && Math.random() < baseChance + levelBoost) {
          foodsRef.current.push(spawnFood(width, height));
        }
        // Randomly spawn lucky box if none exists
        if (!luckyRef.current && Math.random() < 0.004) {
          const w = 36 + Math.random() * 36;
          const h = 18 + Math.random() * 36;
          const x = Math.random() * (width - w);
          const y = Math.random() * (height - h);
          const vx = (Math.random() * 2 - 1) * (1.2 + Math.random() * 0.8);
          const vy = (Math.random() * 2 - 1) * (1.2 + Math.random() * 0.8);
          luckyRef.current = { x, y, w, h, vx, vy };
        }
        // Level 5: show guide and enable new mechanics
        if (levelRef.current >= 5 && !guideShownRef.current) {
          pausedRef.current = true;
          setGuideOpen(true);
          guideShownRef.current = true;
          // Spawn level 5 mechanics entities
          spawnLevel5Entities(width, height);
        }
        hudFrameRef.current++;
        if (hudFrameRef.current % 10 === 0) {
          const s = Math.floor(scoreRef.current);
          setScore(s);
          if (!defeat.current.active && s > best) {
            setBest(s);
            try { localStorage.setItem("maintenance_best_score", String(s)); } catch {}
            setNewBestFlash(true);
            newBestTimerRef.current = 180;
          }
        }
        // decay hooray flash
        if (newBestTimerRef.current > 0) {
          newBestTimerRef.current -= 1;
          if (newBestTimerRef.current <= 0) setNewBestFlash(false);
        }
        // decay invulnerability
        if (invulRef.current > 0) invulRef.current -= 1;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Start loop
    rafRef.current = requestAnimationFrame(tick);

    // Click-to-play then click-to-move
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      if (!startedRef.current) {
        startedRef.current = true;
        setStarted(true);
        return;
      }
      target.current = { x, y };
      if (lost) {
        setLost(false);
        defeat.current = { active: false, t: 0 };
        defeatSwipeRef.current = { x: 0, y: 0, blur: 0 };
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("click", onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [lost]);

  // Initialize best score
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maintenance_best_score");
      const num = saved ? parseInt(saved, 10) : 0;
      setBest(Number.isFinite(num) ? num : 0);
    } catch {}
  }, []);

  // Initialize shop state
  useEffect(() => {
    try {
      const c = localStorage.getItem("maintenance_coins");
      const inv = localStorage.getItem("maintenance_inventory");
      setCoins(c ? parseInt(c, 10) || 0 : 0);
      setInventory(inv ? JSON.parse(inv) : []);
    } catch {}
  }, []);

  const grantCoins = () => {
    const newCoins = coins + 20;
    setCoins(newCoins);
    try { localStorage.setItem("maintenance_coins", String(newCoins)); } catch {}
  };
  const buyItem = (id: string, cost: number) => {
    if (coins < cost) return;
    const newCoins = coins - cost;
    const newInv = [...inventory, id];
    setCoins(newCoins);
    setInventory(newInv);
    try {
      localStorage.setItem("maintenance_coins", String(newCoins));
      localStorage.setItem("maintenance_inventory", JSON.stringify(newInv));
    } catch {}
  };
  // Spend level points to activate immediate powerups
  const buyWithPoints = (id: string, cost: number) => {
    if (levelPointsRef.current < cost) return;
    levelPointsRef.current -= cost;
    setLevelPoints(levelPointsRef.current);
    if (id === "shield-2hit") {
      // Durable shield: 2 hits
      shieldRef.current = true;
      shieldHitsRef.current = Math.max(shieldHitsRef.current, 2);
    } else if (id === "star-power-plus") {
      // Star Power+: 7 obstacle destroys
      starPowerRef.current = { active: true, killsRemaining: 7, angle: 0 };
    } else if (id === "orb-overdrive") {
      // Orb Overdrive: extend trail power to ~6s
      const extend = 360; // ~6s at 60fps
      powerRef.current = { active: true, timer: Math.max(powerRef.current.timer, extend) };
    } else if (id === "speed-burst") {
      // Speed Burst: temporary movement boost (~3s)
      gateBoostRef.current = Math.max(gateBoostRef.current, 180);
    }
  };

  // Update best and show hooray only when lost
  useEffect(() => {
    if (lost) {
      if (scoreRef.current > best) {
        const s = Math.floor(scoreRef.current);
        setBest(s);
        try {
          localStorage.setItem("maintenance_best_score", String(s));
        } catch {}
        setNewBestFlash(true);
        newBestTimerRef.current = 180; // ~3s
      }
    }
  }, [lost, best]);

  return (
    <div className="relative w-full h-full rounded-2xl shadow-sm">
      {/* Top bar (outside canvas) */}
      <div className="w-full grid grid-cols-3 items-center px-4 py-2 text-xs sm:text-sm">
        <div className="flex items-center gap-3 justify-self-start">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Score: {score}</span>
          <span className="text-gray-600 dark:text-gray-300">Best: {best}</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400">Points: {levelPoints}</span>
        </div>
        <div className="justify-self-center">
          <span className="inline-block px-3 py-1 rounded-lg ring-1 ring-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-extrabold text-sm sm:text-xl tracking-wide">
            Level {levelRef.current}
          </span>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <button onClick={() => setInfoOpen(true)} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs sm:text-sm shadow hover:bg-indigo-600">Guide!</button>
          <button onClick={() => setShopOpen(true)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs sm:text-sm shadow hover:bg-emerald-600">Shop</button>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-full border-2 border-indigo-300 rounded-xl" />

      {!started && !lost && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/70 backdrop-blur-sm" onClick={() => { startedRef.current = true; setStarted(true); }}>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Click to Play</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Click anywhere to start, then click to move.</p>
          </div>
        </div>
      )}

      {lost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">You lost</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Try avoiding those shapes and click to move.</p>
            <button
              onClick={() => {
                const c = canvasRef.current;
                if (!c) return;
                resetGame(c);
                if (!rafRef.current) rafRef.current = requestAnimationFrame(() => {});
                setLost(false);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              Restart
            </button>
          </div>
        </div>
      )}

      {guideOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm" onClick={() => { pausedRef.current = false; setGuideOpen(false); }}>
          <div className="mx-4 max-w-md w-full rounded-2xl border border-indigo-300/40 dark:border-indigo-800/40 bg-white/80 dark:bg-black/60 p-5 text-sm shadow-2xl ring-1 ring-indigo-200/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Level 5 Mechanics Guide</p>
              <button onClick={() => { pausedRef.current = false; setGuideOpen(false); }} className="w-8 h-8 grid place-items-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">×</button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-400/40 border border-purple-500" />
                <span className="text-gray-700 dark:text-gray-200">Slow Zone: movement reduced inside the purple circle.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-4 rounded bg-emerald-500" />
                <span className="text-gray-700 dark:text-gray-200">Speed Gate: pass through for a brief speed boost.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-pink-400 ring-2 ring-pink-600" />
                <span className="text-gray-700 dark:text-gray-200">Spawner Core: periodically emits small rounded obstacles.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {infoOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm" onClick={() => setInfoOpen(false)}>
          <div className="mx-4 max-w-2xl w-full rounded-2xl border border-indigo-300/40 dark:border-indigo-800/40 bg-white/85 dark:bg-black/70 p-6 shadow-2xl ring-1 ring-indigo-200/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-bold text-gray-900 dark:text-white">Game Guide</p>
              <button onClick={() => setInfoOpen(false)} className="w-8 h-8 grid place-items-center rounded-lg bg-indigo-500 text-white hover:bg-indigo-600">×</button>
            </div>
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Level Points System</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Each level grants points equal to Level × 5 (Level 1 = 5 pts, Level 2 = 10 pts, etc.). Use points to buy powerups in the Shop!</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base text-gray-800 dark:text-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-7 h-7 rounded-full bg-indigo-500" /> <div><span className="font-semibold">Player</span> — click to move; avoid obstacles.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-10 h-6 bg-blue-400" /> <div><span className="font-semibold">Obstacle</span> — bouncing rectangle.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-10 h-6 bg-blue-400 rounded-md" /> <div><span className="font-semibold">Fast Obstacle</span> — rounded, ~25% faster.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900">
                <div className="w-7 h-7 relative">
                  <svg viewBox="0 0 32 32" className="absolute inset-0">
                    <defs>
                      <radialGradient id="appleGrad" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </radialGradient>
                    </defs>
                    <circle cx="14" cy="18" r="9" fill="url(#appleGrad)" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="18" cy="18" r="9" fill="url(#appleGrad)" stroke="#f59e0b" strokeWidth="1.5" />
                    <path d="M16 8 L16 12" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
                    <path d="M17 10 C21 8, 23 10, 20 13 C18 14, 17 12, 17 10 Z" fill="#10b981" />
                  </svg>
                </div>
                <div><span className="font-semibold">Yellow Food</span> — apple-like; earlier pickups grant more points.</div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-6 h-6 rounded-full bg-indigo-400 ring-2 ring-indigo-600" /> <div><span className="font-semibold">Blue Orb</span> — temporary trail power with particles.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-10 h-6 bg-emerald-500" /> <div><span className="font-semibold">Lucky Box</span> — grants one-time shield.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-6 h-6 rounded-full bg-amber-500 ring-2 ring-yellow-400" /> <div><span className="font-semibold">Golden Star</span> — spawns on level-up (≥2); grants star power.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="flex items-center justify-center w-8 h-8"><div className="w-3 h-3 bg-amber-400 rounded-full animate-spin" style={{animationDuration: '2s'}} /><div className="w-2 h-2 bg-yellow-300 rounded-full absolute animate-spin" style={{animationDuration: '1.5s', animationDirection: 'reverse'}} /></div> <div><span className="font-semibold">Star Power</span> — orbiting stars destroy 5 obstacles.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-7 h-7 rounded-full bg-purple-400/40 border border-purple-500" /> <div><span className="font-semibold">Slow Zone</span> — movement slowed inside.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-16 h-4 rounded bg-emerald-500" /> <div><span className="font-semibold">Speed Gate</span> — brief speed boost on pass-through.</div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-indigo-100 dark:border-indigo-900"><div className="w-7 h-7 rounded-full bg-pink-400 ring-2 ring-pink-600" /> <div><span className="font-semibold">Spawner Core</span> — emits small rounded obstacles.</div></div>
            </div>
          </div>
        </div>
      )}

      {shopOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm" onClick={() => setShopOpen(false)}>
          <div className="mx-4 max-w-3xl w-full rounded-2xl border border-indigo-300/40 dark:border-indigo-800/40 bg-white/80 dark:bg-black/60 p-5 text-sm shadow-2xl ring-1 ring-indigo-200/40" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">Shop</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-amber-100 text-amber-900">Points: {levelPoints}</span>
                <button onClick={() => setShopOpen(false)} className="w-8 h-8 grid place-items-center rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs hover:bg-gray-400 dark:hover:bg-gray-600">×</button>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm font-semibold mb-2">Equipment (Points)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "shield-2hit", name: "Durable Shield (2 hits)", cost: 20 },
                  { id: "star-power-plus", name: "Star Power+ (7 kills)", cost: 25 },
                  { id: "orb-overdrive", name: "Orb Overdrive (~6s)", cost: 15 },
                  { id: "speed-burst", name: "Speed Burst (~3s)", cost: 10 },
                ].map((it) => (
                  <div key={it.id} className="rounded-xl border border-amber-200/50 dark:border-amber-800/40 p-3 bg-amber-50/60 dark:bg-amber-900/20">
                    <p className="font-medium text-amber-800 dark:text-amber-200">{it.name}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">Cost: {it.cost} points</p>
                    <button
                      disabled={levelPoints < it.cost}
                      onClick={() => buyWithPoints(it.id, it.cost)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm disabled:opacity-50 hover:bg-amber-600"
                    >
                      Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold">Inventory</p>
              {inventory.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-300">No items yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {inventory.map((id, i) => (
                    <span key={`${id}-${i}`} className="px-2 py-1 rounded bg-indigo-200 text-indigo-900 text-xs">{id}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}