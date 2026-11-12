import { useMemo, useState } from 'react';
import { Icon } from '../icons.jsx';
import { ALGOS, categoryCounts, CATEGORIES, filterAlgos } from '../neuralAlgos.js';
import './NeuralAlgos.css';

// Tiny inline-SVG diagram per algorithm (viewBox 100×58). Stroke/fill inherit `currentColor`
// from the card, so they follow the theme. One motif can be shared by related algorithms.
const V = { viewBox: '0 0 100 58', className: 'na-dia', 'aria-hidden': 'true' };
const line = (p, extra) => <path d={p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...extra} />;
const dot = (x, y, r = 2.4, o = 1) => <circle cx={x} cy={y} r={r} fill="currentColor" opacity={o} />;

const DIAGRAMS = {
  linep: () => (
    <svg {...V}>
      {[[20, 20], [28, 30], [34, 22], [24, 38]].map(([x, y], i) => dot(x, y, 2.4))}
      {[[66, 36], [74, 24], [60, 28], [78, 40]].map(([x, y], i) => dot(x, y, 2.4, 0.55))}
      {line('M14 46 L86 14')}
    </svg>
  ),
  layers: () => (
    <svg {...V}>
      {[18, 42, 66, 86].map((x, ci, cols) => {
        const count = ci === 0 ? 3 : ci === cols.length - 1 ? 2 : 4;
        return Array.from({ length: count }, (_, i) => dot(x, 10 + (i + 0.5) * (40 / count), 2.6, ci === 0 ? 0.7 : 1));
      })}
      {line('M18 20 L42 12 M18 20 L42 24 M42 12 L66 10 M42 24 L66 30 M66 10 L86 20 M66 30 L86 34', { strokeWidth: 0.7, opacity: 0.5 })}
    </svg>
  ),
  conv: () => (
    <svg {...V}>
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={10 + (i % 3) * 9} y={14 + Math.floor(i / 3) * 9} width="8" height="8" rx="1.5" fill="currentColor" opacity={0.25 + (i % 4) * 0.2} />)}
      {line('M44 29 L56 29 M52 25 L56 29 L52 33', { strokeWidth: 1.6 })}
      {Array.from({ length: 4 }, (_, i) => <rect key={i} x={64 + (i % 2) * 11} y={18 + Math.floor(i / 2) * 11} width="10" height="10" rx="1.5" fill="currentColor" opacity={0.5 + (i % 2) * 0.4} />)}
    </svg>
  ),
  loop: () => (
    <svg {...V}>
      {[22, 50, 78].map((x) => <rect key={x} x={x - 9} y={20} width="18" height="18" rx="9" fill="none" stroke="currentColor" strokeWidth="2" />)}
      {line('M31 29 L41 29 M59 29 L69 29', { strokeWidth: 1.6 })}
      {[22, 50, 78].map((x) => line(`M${x} 20 q 10 -10 3 -14`, { key: x, strokeWidth: 1.3, opacity: 0.7 }))}
    </svg>
  ),
  cells: () => (
    <svg {...V}>
      {[20, 50, 80].map((x) => <rect key={x} x={x - 12} y={16} width="24" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />)}
      {[20, 50, 80].map((x) => dot(x, 29, 2.2, 0.8))}
      {line('M32 29 L38 29 M62 29 L68 29', { strokeWidth: 1.6 })}
      {line('M20 42 L20 50 M50 42 L50 50 M80 42 L80 50', { strokeWidth: 1.2, opacity: 0.6 })}
    </svg>
  ),
  attention: () => (
    <svg {...V}>
      {[16, 34, 52, 70, 88].map((x) => dot(x, 44, 2.6))}
      {[[16, 52], [34, 70], [52, 88], [16, 70], [34, 88]].map(([a, b], i) => line(`M${a} 42 Q ${(a + b) / 2} ${10 + i * 2} ${b} 42`, { key: i, strokeWidth: 1.1, opacity: 0.6 }))}
    </svg>
  ),
  block: () => (
    <svg {...V}>
      {[0, 1, 2].map((i) => <rect key={i} x={34} y={10 + i * 14} width="32" height="10" rx="3" fill="currentColor" opacity={0.35 + i * 0.25} />)}
      {line('M50 20 L50 24 M50 34 L50 38', { strokeWidth: 1.4, opacity: 0.7 })}
    </svg>
  ),
  residual: () => (
    <svg {...V}>
      {line('M8 38 L30 38')}
      <rect x="30" y="28" width="22" height="20" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="41" y="42" textAnchor="middle" fontSize="9" fill="currentColor">F</text>
      {line('M52 38 L72 38')}
      <circle cx="78" cy="38" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      {line('M75 38 L81 38 M78 35 L78 41', { strokeWidth: 1.4 })}
      {line('M30 38 Q 54 8 74 33', { strokeWidth: 1.4, opacity: 0.6, strokeDasharray: '3 3' })}
    </svg>
  ),
  parallel: () => (
    <svg {...V}>
      {dot(12, 29, 3)}
      {line('M15 29 L30 14 M15 29 L30 29 M15 29 L30 44', { strokeWidth: 1.2, opacity: 0.7 })}
      {[14, 29, 44].map((y) => <rect key={y} x="30" y={y - 5} width="22" height="10" rx="2" fill="currentColor" opacity="0.6" />)}
      {line('M52 14 L70 29 M52 29 L70 29 M52 44 L70 29', { strokeWidth: 1.2, opacity: 0.7 })}
      {dot(74, 29, 3)}
    </svg>
  ),
  gan: () => (
    <svg {...V}>
      <rect x="16" y="20" width="24" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="28" y="33" textAnchor="middle" fontSize="10" fill="currentColor">G</text>
      <rect x="60" y="20" width="24" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="72" y="33" textAnchor="middle" fontSize="10" fill="currentColor">D</text>
      {line('M40 25 L60 25 M56 22 L60 25 L56 28', { strokeWidth: 1.4 })}
      {line('M60 33 L40 33 M44 30 L40 33 L44 36', { strokeWidth: 1.4, opacity: 0.7 })}
    </svg>
  ),
  auto: () => (
    <svg {...V}>
      {line('M14 10 L34 24 L34 34 L14 48 Z', { opacity: 0.8 })}
      {line('M86 10 L66 24 L66 34 L86 48 Z', { opacity: 0.8 })}
      <rect x="44" y="24" width="12" height="10" rx="2" fill="currentColor" />
      {line('M34 29 L44 29 M56 29 L66 29', { strokeWidth: 1.4, opacity: 0.7 })}
    </svg>
  ),
  rl: () => (
    <svg {...V}>
      <rect x="6" y="22" width="22" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="17" y="32" textAnchor="middle" fontSize="7" fill="currentColor">state</text>
      <rect x="38" y="20" width="24" height="18" rx="4" fill="currentColor" opacity="0.8" />
      <text x="50" y="32" textAnchor="middle" fontSize="7" fill="var(--panel-solid,#111)">Q-net</text>
      <rect x="72" y="22" width="22" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="83" y="32" textAnchor="middle" fontSize="6.5" fill="currentColor">action</text>
      {line('M28 29 L38 29 M62 29 L72 29', { strokeWidth: 1.3 })}
    </svg>
  ),
  unet: () => (
    <svg {...V}>
      {line('M16 10 L16 22 L28 34 L28 46', { opacity: 0.9 })}
      {line('M84 10 L84 22 L72 34 L72 46', { opacity: 0.9 })}
      {line('M28 46 L72 46', { strokeWidth: 1.6 })}
      {line('M16 14 L84 14 M28 26 L72 26', { strokeWidth: 1.1, opacity: 0.5, strokeDasharray: '3 3' })}
    </svg>
  ),
  detect: () => (
    <svg {...V}>
      <rect x="10" y="10" width="80" height="38" rx="3" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
      <rect x="20" y="20" width="26" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="56" y="16" width="20" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.8" />
    </svg>
  ),
  diffusion: () => (
    <svg {...V}>
      {Array.from({ length: 10 }, (_, i) => dot(14 + i * 2.2 + (i % 3), 16 + (i % 4) * 4, 1.4, 0.8))}
      {line('M40 29 L58 29 M54 25 L58 29 L54 33', { strokeWidth: 1.5 })}
      <rect x="64" y="16" width="24" height="24" rx="3" fill="currentColor" opacity="0.8" />
    </svg>
  ),
};
const MOTIF = { line: 'linep', layers: 'layers', conv: 'conv', loop: 'loop', cells: 'cells', attention: 'attention', block: 'block', residual: 'residual', parallel: 'parallel', gan: 'gan', auto: 'auto', rl: 'rl', unet: 'unet', detect: 'detect', diffusion: 'diffusion' };

function Diagram({ motif }) {
  const D = DIAGRAMS[MOTIF[motif] || 'layers'];
  return D ? <D /> : null;
}

// Each category gets its own hue so the grid reads like the cheatsheet's colour blocks.
const CAT_HUE = { Foundations: 38, Vision: 190, Sequence: 265, Transformers: 300, Generative: 330, Reinforcement: 150, Unsupervised: 205 };

export default function NeuralAlgos({ onAsk }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null); // expanded algo id
  const counts = useMemo(categoryCounts, []);
  const list = useMemo(() => filterAlgos(cat, q), [cat, q]);

  return (
    <div className="na">
      <div className="na-head">
        <div>
          <h3 className="na-title"><span className="na-count">20</span> Neural Network Algorithms</h3>
          <p className="na-sub">A compact, searchable cheatsheet — ideas, use cases and a diagram for each. Click any card for more.</p>
        </div>
        <div className="na-search">
          <Icon name="search" size="1em" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: cnn, image, attention…" aria-label="Search algorithms" />
          {q && <button className="na-clear" onClick={() => setQ('')} aria-label="Clear"><Icon name="x" size="0.9em" /></button>}
        </div>
      </div>

      <div className="na-cats">
        {CATEGORIES.map((c) => (
          <button key={c} className={`na-cat ${cat === c ? 'on' : ''}`} style={{ '--hue': CAT_HUE[c] || 190 }} onClick={() => setCat(c)}>
            {c} <small>{counts[c]}</small>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="na-empty">No algorithm matches “{q}”. Try “vision”, “attention” or “generation”.</p>
      ) : (
        <div className="na-grid">
          {list.map((a) => {
            const isOpen = open === a.id;
            return (
              <article key={a.id} className={`na-card ${isOpen ? 'open' : ''}`} style={{ '--hue': CAT_HUE[a.cat] || 190 }}>
                <button className="na-card-main" onClick={() => setOpen(isOpen ? null : a.id)} aria-expanded={isOpen}>
                  <div className="na-diawrap"><Diagram motif={a.motif} /></div>
                  <div className="na-card-top">
                    <span className="na-num">{a.n}</span>
                    <strong>{a.name}</strong>
                    <span className="na-cat-tag">{a.cat}</span>
                  </div>
                  <p className="na-tag">{a.tagline}</p>
                  {a.formula && <code className="na-formula">{a.formula}</code>}
                  <ul className="na-points">
                    {a.points.map((p) => <li key={p}><Icon name="star" size="0.85em" /> {p}</li>)}
                  </ul>
                  <p className="na-use"><b>Use:</b> {a.use}</p>
                </button>
                {isOpen && onAsk && (
                  <div className="na-actions">
                    <button onClick={() => onAsk(`Explain the ${a.name} neural network in very easy English, with a real example and when to use it.`, true)}>
                      <Icon name="sparkles" size="0.9em" /> Explain with Azarvis
                    </button>
                    <button onClick={() => onAsk(`Give me a tiny Python (PyTorch) example of ${a.name}.`, true)}>
                      <Icon name="code" size="0.9em" /> Show code
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
