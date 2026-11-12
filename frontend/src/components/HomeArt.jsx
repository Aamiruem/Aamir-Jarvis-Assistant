// "AI-designed" banners for the Command Center showcase. Every image is drawn inline as an
// SVG — no photo files, no network request (so it renders on the deployed site's strict CSP),
// and it follows the app theme because colours come from the per-card --hue. Each motif is a
// different generative look: a neural mesh, an orbit, a sound wave, a data grid, etc.

import { useId } from 'react';

// Deterministic tiny PRNG so a motif looks "generated" but is identical on every render.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function Defs({ id, hue }) {
  const h2 = (hue + 60) % 360;
  return (
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 70% 14%)`} />
        <stop offset="1" stopColor={`hsl(${h2} 72% 9%)`} />
      </linearGradient>
      <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={`hsl(${hue} 95% 68%)`} />
        <stop offset="1" stopColor={`hsl(${h2} 95% 66%)`} />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor={`hsl(${hue} 95% 62%)`} stopOpacity="0.55" />
        <stop offset="1" stopColor={`hsl(${hue} 95% 62%)`} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// 160×90 viewBox; the card CSS stretches it to full width.
const VB = { viewBox: '0 0 160 90', preserveAspectRatio: 'xMidYMid slice', className: 'cc-art', 'aria-hidden': 'true' };

function Neural({ id, hue }) {
  const r = rng(7);
  const cols = [20, 55, 90, 125];
  const nodes = cols.map((x, ci) => Array.from({ length: ci === 0 || ci === 3 ? 2 : 3 }, (_, i, a) => ({ x, y: 18 + (i + 0.5) * (54 / a.length) + (r() - 0.5) * 8 })));
  const edges = [];
  for (let c = 0; c < nodes.length - 1; c++) for (const a of nodes[c]) for (const b of nodes[c + 1]) edges.push([a, b]);
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      {edges.map(([a, b], i) => (
        <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={`url(#${id}-line)`} strokeWidth="0.5" opacity={0.25 + r() * 0.4} />
      ))}
      {nodes.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={i % 3 === 0 ? 3 : 2} fill={`url(#${id}-line)`}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur={`${2 + (i % 4) * 0.4}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function Orbit({ id, hue }) {
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      <g transform="translate(80 45)" fill="none" stroke={`url(#${id}-line)`}>
        {[16, 28, 40].map((rx, i) => (
          <ellipse key={i} rx={rx} ry={rx * 0.42} strokeWidth="0.6" opacity="0.5" transform={`rotate(${i * 30})`} />
        ))}
        <circle r="6" fill={`url(#${id}-line)`} stroke="none" />
        {[0, 1, 2].map((i) => (
          <circle key={i} r="2.5" fill={`hsl(${hue} 95% 70%)`} stroke="none">
            <animateMotion dur={`${4 + i * 2}s`} repeatCount="indefinite" path={`M ${16 + i * 12} 0 A ${16 + i * 12} ${(16 + i * 12) * 0.42} 0 1 1 ${-(16 + i * 12)} 0 A ${16 + i * 12} ${(16 + i * 12) * 0.42} 0 1 1 ${16 + i * 12} 0`} />
          </circle>
        ))}
      </g>
    </svg>
  );
}

function Wave({ id, hue }) {
  const bars = Array.from({ length: 34 }, (_, i) => i);
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      <g>
        {bars.map((i) => {
          const h = 6 + Math.abs(Math.sin(i * 0.5)) * 46;
          return (
            <rect key={i} x={6 + i * 4.4} y={45 - h / 2} width="2.4" height={h} rx="1.2" fill={`url(#${id}-line)`}>
              <animate attributeName="height" values={`${h};${h * 0.3};${h}`} dur={`${1.2 + (i % 5) * 0.25}s`} repeatCount="indefinite" />
              <animate attributeName="y" values={`${45 - h / 2};${45 - h * 0.15};${45 - h / 2}`} dur={`${1.2 + (i % 5) * 0.25}s`} repeatCount="indefinite" />
            </rect>
          );
        })}
      </g>
    </svg>
  );
}

function Grid({ id, hue }) {
  const r = rng(21);
  const cells = [];
  for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) cells.push({ x, y, v: r() });
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      {cells.map((c, i) => (
        <rect key={i} x={8 + c.x * 13} y={10 + c.y * 12} width="10" height="9" rx="2"
          fill={c.v > 0.62 ? `url(#${id}-line)` : `hsl(${hue} 60% 30%)`} opacity={0.3 + c.v * 0.6}>
          {c.v > 0.62 && <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (i % 5) * 0.4}s`} repeatCount="indefinite" />}
        </rect>
      ))}
    </svg>
  );
}

function Shield({ id, hue }) {
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      {[30, 22, 14].map((s, i) => (
        <path key={i} d={`M80 ${45 - s} l${s} ${s * 0.4} v${s * 0.5} q0 ${s * 0.7} -${s} ${s} q-${s} -${s * 0.3} -${s} -${s} v-${s * 0.5} Z`}
          fill="none" stroke={`url(#${id}-line)`} strokeWidth={i === 2 ? 1.4 : 0.7} opacity={0.4 + i * 0.25} />
      ))}
      <path d="M72 46 l5 5 10 -11" fill="none" stroke={`hsl(${hue} 95% 72%)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spark({ id, hue }) {
  const r = rng(99);
  const dots = Array.from({ length: 26 }, () => ({ x: r() * 160, y: r() * 90, s: 0.6 + r() * 2 }));
  return (
    <svg {...VB}>
      <Defs id={id} hue={hue} />
      <rect width="160" height="90" fill={`url(#${id}-bg)`} />
      <rect width="160" height="90" fill={`url(#${id}-glow)`} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s} fill={`hsl(${hue} 95% 75%)`}>
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.5 + (i % 6) * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
      <path d="M80 20 l5 16 16 5 -16 5 -5 16 -5 -16 -16 -5 16 -5 Z" fill={`url(#${id}-line)`} opacity="0.95" />
    </svg>
  );
}

const MOTIFS = { neural: Neural, orbit: Orbit, wave: Wave, grid: Grid, shield: Shield, spark: Spark };

/** <HomeArt motif="neural" hue={265} /> — one inline-SVG banner. */
export default function HomeArt({ motif = 'neural', hue = 265 }) {
  const id = useId().replace(/:/g, '');
  const Motif = MOTIFS[motif] || Neural;
  return <Motif id={id} hue={hue} />;
}

export { MOTIFS };
