import { useEffect, useRef } from 'react';

// Animated "neural network" background for the Command Center: drifting nodes joined by
// faint links, drawn on one <canvas>. Built to stay cheap on a busy PC:
//  - ~30 fps cap and devicePixelRatio capped at 1.5
//  - node count scales with the area (max 70)
//  - stops completely when the tab is hidden or the canvas is off-screen
//  - prefers-reduced-motion: draws one still frame
const COLORS = ['56, 225, 255', '139, 92, 246', '244, 114, 182'];
const LINK = 130; // px: nodes closer than this are joined

export default function NeuralField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, nodes = [], frame = 0, last = 0, onScreen = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.round((w * h) / 22000));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.6,
        c: COLORS[i % COLORS.length],
      }));
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(${a.c}, ${0.16 * (1 - d / LINK)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${n.c}, 0.75)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (t) => {
      frame = requestAnimationFrame(step);
      if (t - last < 33) return; // ~30 fps is plenty for a background
      last = t;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      draw();
    };
    const play = () => {
      cancelAnimationFrame(frame);
      if (!still && onScreen && !document.hidden) frame = requestAnimationFrame(step);
    };

    const sizeWatch = new ResizeObserver(resize);
    sizeWatch.observe(canvas);
    const viewWatch = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      play();
    });
    viewWatch.observe(canvas);
    document.addEventListener('visibilitychange', play);
    resize();
    play();
    return () => {
      cancelAnimationFrame(frame);
      sizeWatch.disconnect();
      viewWatch.disconnect();
      document.removeEventListener('visibilitychange', play);
    };
  }, []);

  return <canvas ref={ref} className="cc-field" aria-hidden="true" />;
}
