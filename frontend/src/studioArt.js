// Agent Studio's designers: draws each image on a canvas, in the chosen "Look", at the real
// social-media size (carousel 1080×1350, story 1080×1920, thumbnail 1280×720, quote card 1200×1200).
// Designed graphics with your words, not photos. Returns a blob URL (or a data URL as fallback).

export const SIZES = {
  carousel: [1080, 1350],
  poster: [1080, 1350],
  story: [1080, 1920],
  thumbnail: [1280, 720],
  linkedin: [1200, 1200],
};

const LOOK = {
  editorial: { bg: ['#2b2620', '#5b4a37', '#a78a62'], ink: '#f7f1e6', sub: '#e3d5bd', accent: '#e9c27a', font: 'Georgia, "Times New Roman", serif', grain: 0.11, rule: true },
  neon: { bg: ['#07060f', '#120a2a', '#0a1730'], ink: '#ffffff', sub: '#b8c4ff', accent: '#22d3ee', accent2: '#f472b6', font: '"Inter", system-ui, sans-serif', glow: true },
  minimal: { bg: ['#f6f5f1', '#f6f5f1', '#ecebe5'], ink: '#111111', sub: '#4b4b4b', accent: '#ff5a36', font: '"Inter", system-ui, sans-serif', bar: true },
  warm: { bg: ['#ffd6c2', '#f9c6d9', '#d9c8ff'], ink: '#2b1b2e', sub: '#5b4560', accent: '#ff7a59', font: '"Inter", system-ui, sans-serif', blobs: true },
  brand: { bg: ['#0b1120', '#1e1b4b', '#4c1d95'], ink: '#ffffff', sub: '#c7d2fe', accent: '#22d3ee', accent2: '#a78bfa', font: '"Inter", system-ui, sans-serif', glow: true },
};

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Biggest font size (px) at which text fits in maxLines lines of maxWidth. */
function fit(ctx, text, font, weight, maxWidth, maxLines, start, min) {
  for (let size = start; size >= min; size -= 4) {
    ctx.font = `${weight} ${size}px ${font}`;
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = `${weight} ${min}px ${font}`;
  return { size: min, lines: wrap(ctx, text, maxWidth).slice(0, maxLines) };
}

function seeded(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
}
const hash = (s) => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

function background(ctx, w, h, look, rand) {
  const L = LOOK[look];
  const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
  g.addColorStop(0, L.bg[0]);
  g.addColorStop(0.55, L.bg[1]);
  g.addColorStop(1, L.bg[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (L.glow) {
    for (const [c, x, y, r] of [
      [L.accent, 0.85, 0.15, 0.55],
      [L.accent2 || L.accent, 0.1, 0.85, 0.6],
    ]) {
      const rg = ctx.createRadialGradient(w * x, h * y, 0, w * x, h * y, Math.max(w, h) * r);
      rg.addColorStop(0, `${c}55`);
      rg.addColorStop(1, `${c}00`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, w, h);
    }
    // a faint grid, like a night city map
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  if (L.blobs) {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['rgba(255,255,255,0.35)', 'rgba(255,122,89,0.18)', 'rgba(167,139,250,0.22)', 'rgba(255,255,255,0.25)'][i];
      ctx.beginPath();
      ctx.arc(w * rand(), h * rand(), Math.min(w, h) * (0.15 + rand() * 0.25), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (L.grain) {
    // Film grain + vignette for the "editorial photo" look.
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (rand() - 0.5) * 255 * L.grain;
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Draws one image. card: { kind, title, body, tag, poll? }, opts: { look, handle, label }.
 * Resolves to an object URL for an <img> and for downloading.
 */
export async function renderImage(card, { look = 'editorial', handle = '@azarvis', label = '' } = {}) {
  const [w, h] = SIZES[card.kind] || SIZES.poster;
  const L = LOOK[look] || LOOK.editorial;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: Boolean(L.grain) });
  const rand = seeded(hash(card.title + card.kind + look));
  background(ctx, w, h, look, rand);

  const pad = Math.round(w * 0.08);
  const maxW = w - pad * 2;
  ctx.textBaseline = 'top';

  // Top bar: label and tag.
  ctx.font = `700 ${Math.round(w * 0.026)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = L.accent;
  ctx.fillText((label || card.kind).toUpperCase(), pad, pad);
  if (card.tag) {
    const t = String(card.tag);
    const tw = ctx.measureText(t).width;
    ctx.fillStyle = L.sub;
    ctx.fillText(t, w - pad - tw, pad);
  }
  if (L.rule) {
    ctx.fillStyle = L.sub;
    ctx.fillRect(pad, pad + w * 0.05, maxW, 2);
  }
  if (L.bar) {
    ctx.fillStyle = L.accent;
    ctx.fillRect(pad, pad + w * 0.055, w * 0.12, w * 0.012);
  }

  // Headline: as big as fits.
  const isWide = w > h;
  const lines = card.kind === 'story' ? 7 : isWide ? 3 : 6;
  const head = fit(ctx, card.title, L.font, look === 'editorial' ? 700 : 800, maxW, lines, Math.round(w * (isWide ? 0.085 : 0.095)), Math.round(w * 0.045));
  const lineH = Math.round(head.size * 1.12);
  const blockH = head.lines.length * lineH;
  let y = isWide ? Math.round(h * 0.22) : Math.round(h * (card.kind === 'story' ? 0.3 : 0.26));
  if (!isWide && blockH < h * 0.4) y = Math.round((h - blockH) / 2 - h * 0.05);
  ctx.fillStyle = L.ink;
  if (L.glow) {
    ctx.shadowColor = `${L.accent}88`;
    ctx.shadowBlur = Math.round(w * 0.02);
  }
  for (const line of head.lines) {
    ctx.fillText(line, pad, y);
    y += lineH;
  }
  ctx.shadowBlur = 0;

  // Body line.
  if (card.body) {
    y += Math.round(head.size * 0.4);
    const body = fit(ctx, card.body, '"Inter", system-ui, sans-serif', 500, maxW, 3, Math.round(w * 0.04), Math.round(w * 0.026));
    ctx.fillStyle = L.sub;
    for (const line of body.lines) {
      ctx.fillText(line, pad, y);
      y += Math.round(body.size * 1.3);
    }
  }

  // Story poll sticker.
  if (card.poll) {
    const bw = maxW;
    const bh = Math.round(h * 0.09);
    const by = Math.round(h * 0.68);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, pad, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.font = `700 ${Math.round(bh * 0.36)}px "Inter", system-ui, sans-serif`;
    ctx.fillText('Yes, 100%', pad + bw * 0.12, by + bh * 0.32);
    ctx.fillText('Not yet', pad + bw * 0.62, by + bh * 0.32);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(pad + bw / 2, by + bh * 0.2, 2, bh * 0.6);
  }

  // Footer: handle + Azarvis mark.
  ctx.font = `600 ${Math.round(w * 0.03)}px "Inter", system-ui, sans-serif`;
  ctx.fillStyle = L.sub;
  ctx.fillText(handle, pad, h - pad - w * 0.03);
  const mark = 'made with Azarvis';
  ctx.font = `500 ${Math.round(w * 0.022)}px "Inter", system-ui, sans-serif`;
  const mw = ctx.measureText(mark).width;
  ctx.globalAlpha = 0.75;
  ctx.fillText(mark, w - pad - mw, h - pad - w * 0.026);
  ctx.globalAlpha = 1;

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
