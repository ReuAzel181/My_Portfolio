"use client"

import { useRef, useEffect, useState } from "react";

type Obstacle = {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
};

export default function MaintenanceGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [lost, setLost] = useState(false);

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
  // Food collectibles: pulse, lifetime-based scoring, despawn if not collected
  type Food = { x: number; y: number; r: number; vx: number; vy: number; life: number; maxLife: number; pulse: number };
  const foodsRef = useRef<Food[]>([]);

  // Canvas swipe effect when hitting walls
  const swipeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Swipe/blur effect on defeat to make transition obvious
  const defeatSwipeRef = useRef<{ x: number; y: number; blur: number }>({ x: 0, y: 0, blur: 0 });

  // Simple particle trail when grabbing an orb
  type Particle = { x: number; y: number; vx: number; vy: number; life: number; r: number; alpha: number };
  const particlesRef = useRef<Particle[]>([]);

  // Score/HUD
  const scoreRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const hudFrameRef = useRef<number>(0);
  const levelRef = useRef<number>(1);

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
    // Spawn a few obstacles with random positions/velocities
    const obs: Obstacle[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const w = 40 + Math.random() * 40;
      const h = 20 + Math.random() * 40;
      const x = Math.random() * (width - w);
      const y = Math.random() * (height - h);
      const vx = (Math.random() * 2 - 1) * (1.2 + Math.random());
      const vy = (Math.random() * 2 - 1) * (1.2 + Math.random());
      obs.push({ x, y, w, h, vx, vy });
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

      // Move player towards target
      if (target.current) {
        const boost = powerRef.current.active ? 1.6 : 1;
        player.current.x = lerp(player.current.x, target.current.x, 0.08 * boost);
        player.current.y = lerp(player.current.y, target.current.y, 0.08 * boost);
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
        // Trigger swipe offset based on the side we touched
        if (clampedX !== px) {
          swipeRef.current.x += clampedX === r ? 18 : -18;
        }
        if (clampedY !== py) {
          swipeRef.current.y += clampedY === r ? 12 : -12;
        }
      }
      wallHit.current *= 0.92; // decay pulse
      // Decay swipe and apply to canvas transform
      swipeRef.current.x *= 0.88;
      swipeRef.current.y *= 0.88;
      // Combine with defeat swipe
      defeatSwipeRef.current.x *= 0.92;
      defeatSwipeRef.current.y *= 0.92;
      defeatSwipeRef.current.blur *= 0.92;
      const tx = swipeRef.current.x + defeatSwipeRef.current.x;
      const ty = swipeRef.current.y + defeatSwipeRef.current.y;
      canvas.style.transform = `translate(${tx}px, ${ty}px)`;
      canvas.style.filter = `blur(${defeatSwipeRef.current.blur.toFixed(2)}px)`;

      // Update obstacles with boundary bounce
      const obs = obstaclesRef.current;
      for (const o of obs) {
        // Slow down slightly if defeated for a smoother freeze
        const damp = defeat.current.active ? 0.96 : 1;
        o.x += o.vx * damp;
        o.y += o.vy * damp;
        if (o.x <= 0 || o.x + o.w >= width) o.vx *= -1;
        if (o.y <= 0 || o.y + o.h >= height) o.vy *= -1;
      }

      // Update and draw orbs
      const orbs = orbsRef.current;
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x - orb.r <= 0 || orb.x + orb.r >= width) orb.vx *= -1;
        if (orb.y - orb.r <= 0 || orb.y + orb.r >= height) orb.vy *= -1;
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

      // Update foods (move, pulse, lifetime)
      for (const f of foodsRef.current) {
        f.x += f.vx;
        f.y += f.vy;
        if (f.x - f.r <= 0 || f.x + f.r >= width) f.vx *= -1;
        if (f.y - f.r <= 0 || f.y + f.r >= height) f.vy *= -1;
        f.life -= 1;
        f.pulse += 0.08;
      }
      // Remove expired foods
      foodsRef.current = foodsRef.current.filter((f) => f.life > 0);
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
        ctx.fillStyle = "rgba(96, 165, 250, 0.25)"; // blue-400/25
        ctx.strokeStyle = "rgba(96, 165, 250, 0.6)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(o.x, o.y, o.w, o.h);
        ctx.fill();
        ctx.stroke();
      }

      // Draw player (glowing circle)
      const pulse = 0.08 * Math.sin(t * 0.008);
      const squash = 0.18 * wallHit.current;
      const drawR = player.current.r * (1 + pulse + squash);
      ctx.shadowColor = "rgba(99,102,241,0.8)"; // indigo glow
      ctx.shadowBlur = 14;
      ctx.fillStyle = "#6366f1"; // indigo-500
      ctx.beginPath();
      ctx.arc(player.current.x, player.current.y, drawR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Collision check
      if (!defeat.current.active) {
        for (const o of obs) {
          if (circleRectCollide(player.current.x, player.current.y, player.current.r, o)) {
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
      if (!defeat.current.active) {
        for (const orb of orbs) {
          if (circleCircle(player.current.x, player.current.y, player.current.r, orb.x, orb.y, orb.r)) {
            powerRef.current = { active: true, timer: 180 }; // ~3s at 60fps
            // trail burst particles
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
            // Score bonus
            scoreRef.current += 50;
          }
        }
        // Food collision: earlier pickup yields higher score
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
            const bonus = Math.max(10, Math.floor(100 * (f.life / f.maxLife)));
            scoreRef.current += bonus;
            foodsRef.current.splice(i, 1);
          }
        }
      }
      if (powerRef.current.active) {
        powerRef.current.timer -= 1;
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

      // Increment score over time (boost doubles rate)
      if (!defeat.current.active) {
        scoreRef.current += powerRef.current.active ? 2 : 1;
        // Level up at thresholds: 100, 200, ...
        const threshold = levelRef.current * 100;
        if (scoreRef.current >= threshold) {
          levelRef.current += 1;
          // Increase obstacle count and speed
          const addCount = 2;
          for (let i = 0; i < addCount; i++) {
            const w = 40 + Math.random() * 40;
            const h = 20 + Math.random() * 40;
            const x = Math.random() * (width - w);
            const y = Math.random() * (height - h);
            const vx = (Math.random() * 2 - 1) * (1.4 + Math.random());
            const vy = (Math.random() * 2 - 1) * (1.4 + Math.random());
            obstaclesRef.current.push({ x, y, w, h, vx, vy });
          }
          for (const o of obstaclesRef.current) {
            o.vx *= 1.15;
            o.vy *= 1.15;
          }
        }
        // Lightly respawn foods over time
        if (foodsRef.current.length < 3 && Math.random() < 0.012) {
          foodsRef.current.push(spawnFood(width, height));
        }
        hudFrameRef.current++;
        if (hudFrameRef.current % 10 === 0) setScore(Math.floor(scoreRef.current));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Start loop
    rafRef.current = requestAnimationFrame(tick);

    // Click-to-move
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
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

  // Update best when lost
  useEffect(() => {
    if (lost) {
      if (scoreRef.current > best) {
        setBest(Math.floor(scoreRef.current));
        try {
          localStorage.setItem("maintenance_best_score", String(Math.floor(scoreRef.current)));
        } catch {}
      }
    }
  }, [lost, best]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-sm pb-8">
      {/* HUD */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/60 dark:bg-black/40 backdrop-blur-sm border border-indigo-200/40 dark:border-indigo-900/30 text-xs sm:text-sm">
        <span className="font-semibold text-gray-800 dark:text-gray-100">Score: {score}</span>
        <span className="text-gray-600 dark:text-gray-300">Best: {best}</span>
        {powerRef.current.active && <span className="text-indigo-600 dark:text-indigo-300">Boost!</span>}
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />

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
    </div>
  );
}