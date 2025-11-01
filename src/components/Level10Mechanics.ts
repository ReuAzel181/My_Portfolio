// Level 10 Triangles: light theme variant with roaming, bouncing, merging triangles.
// Mirrors the modular approach used for other levels.

export type Tri10 = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number; // base length of triangle sides
  count: number; // how many triangles merged
  angle: number; // current rotation angle in radians
  spin: number; // angular speed (radians per frame)
  speedBoost: number; // transient speed increase after bouncing
  burstTimer?: number; // shrink-then-burst countdown when count >= 20
  originalSize?: number; // store original size for pulsing calculation
};

export type TinyTri10 = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // lifetime in frames, pops when it hits a wall
  r: number; // radius
  red?: boolean; // render as red projectile when true
};

export function spawnTriangles10(width: number, height: number, count: number = 2): Tri10[] {
  const tris: Tri10[] = [];
  for (let i = 0; i < count; i++) {
    const size = 22 + Math.random() * 8;
    const x = size + Math.random() * (width - size * 2);
    const y = size + Math.random() * (height - size * 2);
    const vx = (Math.random() - 0.5) * 2.0;
    const vy = (Math.random() - 0.5) * 2.0;
    tris.push({ x, y, vx, vy, size, count: 1, angle: 0, spin: 0, speedBoost: 0 });
  }
  return tris;
}

// Approximate collision radius of a triangle for merging/contact checks
export function triRadius(t: Tri10): number {
  const base = t.size * 0.7;
  // grow sublinearly to avoid runaway sizes
  return base * Math.sqrt(t.count);
}

// Update movement and bounce; handle post-bounce speed decay
export function updateTriangles10(tris: Tri10[], width: number, height: number, playerRadius: number): TinyTri10[] {
  const newTinyTris: TinyTri10[] = [];
  for (const t of tris) {
    // Move faster as triangles become larger, prioritizing translation over spin
    const speedScale = t.count >= 20 ? 2.20 : t.count >= 12 ? 1.90 : t.count >= 8 ? 1.60 : t.count >= 4 ? 1.25 : 1.00;
    const boost = 1 + t.speedBoost;
    t.x += t.vx * speedScale * boost;
    t.y += t.vy * speedScale * boost;

    // Bounce off walls with speed gain that decays
    let bounced = false;
    const r = triRadius(t);
    if (t.x <= r || t.x >= width - r) {
      t.vx *= -1;
      bounced = true;
    }
    if (t.y <= r || t.y >= height - r) {
      t.vy *= -1;
      bounced = true;
    }
    t.x = Math.max(r, Math.min(width - r, t.x));
    t.y = Math.max(r, Math.min(height - r, t.y));

    if (bounced) t.speedBoost = Math.min(1.5, t.speedBoost + 0.4);
    // Remove decay to maintain faster bouncing

    // Spin behavior when count >= 4; increase lateral movement when spinning
    const targetSpin = t.count >= 20 ? 0.15 : t.count >= 8 ? 0.12 : t.count >= 4 ? 0.08 : 0;
    // smooth approach to target spin
    t.spin += (targetSpin - t.spin) * 0.08;
    t.angle += t.spin;
    
    // Ensure spin visual stays centered; remove off-axis lateral boost

    // If in bursting phase (count >= 10), enhanced shrink-then-burst
    if (t.count >= 10) {
      if (t.burstTimer == null) {
        t.burstTimer = 45; // Enhanced timing for dramatic effect
        t.originalSize = t.size; // Store original size for pulsing calculation
      } else {
        t.burstTimer -= 1;
        if (t.burstTimer > 0) {
          // Enhanced shrinking phase with pulsing effect
          const shrinkProgress = (45 - t.burstTimer) / 45;
          const pulseEffect = 1 + Math.sin((45 - t.burstTimer) * 0.5) * 0.1;
          t.size = Math.max(5, t.originalSize * (1 - shrinkProgress * 0.9) * pulseEffect);
        }
      }
    }
  }

  // Merge triangles that touch
  for (let i = 0; i < tris.length; i++) {
    const a = tris[i];
    const ra = triRadius(a);
    for (let j = i + 1; j < tris.length; j++) {
      const b = tris[j];
      const rb = triRadius(b);
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy <= (ra + rb) * (ra + rb)) {
        // Merge: weighted average position and velocity
        const total = a.count + b.count;
        const wa = a.count / total;
        const wb = b.count / total;
        a.x = a.x * wa + b.x * wb;
        a.y = a.y * wa + b.y * wb;
        a.vx = a.vx * wa + b.vx * wb;
        a.vy = a.vy * wa + b.vy * wb;
        a.count = total;
        // Increase base size slightly on merge
        a.size = Math.min(60, a.size + 2);
        // Preserve spin tendency
        a.spin = Math.max(a.spin, b.spin);
        // remove b
        tris.splice(j, 1);
        j--;
      }
    }
  }

  // Enhanced burst when shrink timer completes
  for (let i = tris.length - 1; i >= 0; i--) {
    const t = tris[i];
    if (t.count >= 10 && (t.burstTimer ?? 0) <= 0) {
      const numProjectiles = 20; // Always dramatic burst
      for (let k = 0; k < numProjectiles; k++) {
        const ang = (k / numProjectiles) * Math.PI * 2; // Even distribution
        const speed = 3 + Math.random() * 4; // Faster burst speed
        newTinyTris.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 300, // Longer lasting projectiles
          r: Math.max(2, playerRadius * 0.25),
          red: true,
        });
      }
      tris.splice(i, 1);
    }
  }
  return newTinyTris;
}

// Render triangles; spinning ones rotate like blades
export function renderTriangles10(ctx: CanvasRenderingContext2D, tris: Tri10[]): void {
  for (const t of tris) {
    const r = triRadius(t);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);
    // Colors: red when spinning (>=4) or imploding (>=10), indigo otherwise
    const isRed = t.count >= 4;
    const fill = isRed
      ? "rgba(239,68,68,0.25)" // red-500/25
      : t.count >= 8
      ? "rgba(99,102,241,0.28)"
      : t.count >= 4
      ? "rgba(99,102,241,0.20)"
      : "rgba(99,102,241,0.14)";
    const stroke = isRed
      ? "rgba(220,38,38,0.95)" // red-600
      : t.count >= 8
      ? "rgba(99,102,241,0.95)"
      : t.count >= 4
      ? "rgba(99,102,241,0.85)"
      : "rgba(99,102,241,0.75)";
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = isRed ? 3.0 : t.count >= 8 ? 2.5 : t.count >= 4 ? 2.0 : 1.6;
    // Regular pentagon centered at origin
    const s = r; // use radius as size proxy
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const ang = (Math.PI * 2 / 5) * i - Math.PI / 2; // Start from top
      const px = s * Math.cos(ang);
      const py = s * Math.sin(ang);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

// Update and render tiny triangles from imploded mega-triangles
export function updateTinyTriangles10(tinyTris: TinyTri10[], width: number, height: number): void {
  for (let i = tinyTris.length - 1; i >= 0; i--) {
    const tt = tinyTris[i];
    tt.x += tt.vx;
    tt.y += tt.vy;
    tt.life--;

    if (tt.life <= 0) {
      tinyTris.splice(i, 1);
      continue;
    }

    // Pop on wall hit
    if (tt.x <= tt.r || tt.x >= width - tt.r || tt.y <= tt.r || tt.y >= height - tt.r) {
      // Pop: just remove for now. Add particles in-game if needed.
      tinyTris.splice(i, 1);
    }
  }
}

export function renderTinyTriangles10(ctx: CanvasRenderingContext2D, tinyTris: TinyTri10[]): void {
  ctx.save();
  for (const tt of tinyTris) {
    ctx.fillStyle = tt.red ? "rgba(220, 38, 38, 0.85)" : "rgba(99, 102, 241, 0.8)"; // red vs indigo
    ctx.beginPath();
    ctx.arc(tt.x, tt.y, tt.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Contact helper: triangle approximated as circle vs player circle
export function triangleTouchesCircle(t: Tri10, px: number, py: number, pr: number): boolean {
  const r = triRadius(t);
  const dx = px - t.x;
  const dy = py - t.y;
  const radSum = r + pr;
  return dx * dx + dy * dy <= radSum * radSum;
}

// Contact helper: tiny projectile vs player circle
export function tinyTriangleTouchesCircle(tt: TinyTri10, px: number, py: number, pr: number): boolean {
  const dx = px - tt.x;
  const dy = py - tt.y;
  const radSum = tt.r + pr;
  return dx * dx + dy * dy <= radSum * radSum;
}

// Level 10 Light Theme: a distinct pattern from Level 5 lattice.
// Soft radial rings and drifting dots to signal “sharper” Level 10 without being dark.
export function drawLevel10Theme(
  ctx: CanvasRenderingContext2D,
  tMs: number,
  width: number,
  height: number
): void {
  // Gentle diagonal shimmer using indigo hues
  ctx.save();
  const wave = 0.35 + 0.25 * Math.sin(tMs * 0.0006);
  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 1.0;
  const step = 28;
  for (let x = -step; x < width + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + step * wave, height);
    ctx.stroke();
  }
  ctx.restore();

  // Soft radial rings that subtly pulse
  ctx.save();
  const rings = 6;
  for (let i = 0; i < rings; i++) {
    const cx = (width * (i + 1)) / (rings + 1);
    const cy = height * (0.3 + 0.4 * ((i % 3) / 2));
    const rr = 22 + 10 * Math.sin(tMs * 0.001 + i * 0.8);
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "#818cf8"; // indigo-300
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.abs(rr), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}