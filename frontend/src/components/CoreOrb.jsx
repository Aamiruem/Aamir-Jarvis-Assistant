import { useEffect, useRef } from 'react';

// The Azarvis AI core: a rotating wireframe globe on a canvas (points on a sphere joined to their
// neighbours) with two orbit rings. Used by the Command Center and the Home "AI core" card.
// level: optimal (cyan) | attention (amber) | degraded (red). Still under prefers-reduced-motion.
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * The AI core: a rotating wireframe globe drawn on a canvas (points on a sphere, joined to their
 * neighbours) with two orbit rings. Color follows the system status. No 3D library needed.
 */
export default function CoreOrb({ level = 'optimal', speed = 1, className = 'cc-orb-canvas' }) {
  const ref = useRef(null);
  const levelRef = useRef(level);
  levelRef.current = level;
  const speedRef = useRef(speed); // faster spin while Azarvis is talking
  speedRef.current = speed;
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return undefined;
    const N = 220;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2; // Fibonacci sphere: evenly spread points
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(a) * r, y, Math.sin(a) * r];
    });
    const edges = [];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]);
      if (d < 0.27) edges.push([i, j]);
    }
    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    const color = () => ({ optimal: '34,211,238', attention: '251,191,36', degraded: '248,113,113' })[levelRef.current] || '34,211,238';
    let raf;
    let angle = 0;
    let last = 0;
    const draw = (t) => {
      const rgb = color();
      const R = Math.min(w, h) * 0.36;
      const cx = w / 2;
      const cy = h / 2;
      angle += Math.min(64, last ? t - last : 16) * 0.00018 * speedRef.current; // smooth when the speed changes
      last = t;
      const spin = angle;
      const tilt = 0.35;
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5);
      glow.addColorStop(0, `rgba(${rgb},0.20)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      const proj = pts.map(([x, y, z]) => {
        const x1 = x * Math.cos(spin) - z * Math.sin(spin);
        const z1 = x * Math.sin(spin) + z * Math.cos(spin);
        const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
        return [cx + x1 * R, cy + y2 * R, z2];
      });
      ctx.lineWidth = 0.6;
      for (const [i, j] of edges) {
        const depth = (proj[i][2] + proj[j][2]) / 2;
        ctx.strokeStyle = `rgba(${rgb},${0.08 + (depth + 1) * 0.16})`;
        ctx.beginPath();
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
        ctx.stroke();
      }
      for (const [x, y, z] of proj) {
        ctx.fillStyle = `rgba(${rgb},${0.25 + (z + 1) * 0.35})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + (z + 1) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Orbit rings with a moving light on each.
      [[1.32, 0.28, 0.0004, -0.25], [1.18, 0.5, -0.00055, 0.5]].forEach(([k, flat, speed, rot]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${rgb},0.35)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, R * k, R * k * flat, 0, 0, Math.PI * 2);
        ctx.stroke();
        const a = t * speed;
        ctx.fillStyle = `rgba(${rgb},0.95)`;
        ctx.shadowColor = `rgba(${rgb},1)`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R * k, Math.sin(a) * R * k * flat, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      if (!reducedMotion()) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

