// The demo's "server" features, done entirely in this browser so the demo needs no account:
// ML Lab (parse a CSV, train a model, score it on held-back rows), Knowledge (search your own
// documents), Vision (describe an image from its pixels). Nothing here talks to a server.

// ---------- Small helpers ----------

/** A seeded random number generator (mulberry32): the same seed gives the same numbers. */
export function rng(seed = 42) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand) {
  const u = 1 - rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

function shuffled(n, seed) {
  const rand = rng(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// ---------- CSV ----------

/** Parses CSV text (quoted fields, "" escapes, CRLF) into { columns, rows } of strings. */
export function parseCsv(text) {
  const out = [];
  let row = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((f) => f.trim() !== '')) out.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) out.push(row);
  if (out.length < 2) throw new Error('The file needs a header row and at least one data row.');
  const columns = out[0].map((c, i) => c.trim() || `column_${i + 1}`);
  const rows = out.slice(1).map((r) => columns.map((_, i) => (r[i] ?? '').trim()));
  return { columns, rows };
}

const isNum = (v) => v !== '' && Number.isFinite(Number(v));

/** Per column: numeric (90%+ of filled cells are numbers) and how many distinct values it has. */
export function describeColumns({ columns, rows }) {
  return columns.map((name, i) => {
    const filled = rows.map((r) => r[i]).filter((v) => v !== '');
    const numeric = filled.length > 0 && filled.filter(isNum).length / filled.length >= 0.9;
    return { name, numeric, unique: new Set(filled).size, missing: rows.length - filled.length };
  });
}

// ---------- Sample datasets ----------

export const SAMPLE_DATASETS = [
  { id: 'houses', label: 'House prices', file: 'houses.csv', text: 'Flats in Gurgaon: area, bedrooms, age and distance to the metro. Predict the price.', target: 'price_lakh' },
  { id: 'students', label: 'Exam results', file: 'students.csv', text: 'Study hours, attendance and sleep. Predict who passes.', target: 'result' },
];

/** Builds a sample dataset (the same every time) as { columns, rows }. */
export function sampleDataset(id, n = 240) {
  const rand = rng(id === 'houses' ? 7 : 11);
  if (id === 'houses') {
    const columns = ['area_sqft', 'bedrooms', 'age_years', 'metro_km', 'price_lakh'];
    const rows = Array.from({ length: n }, () => {
      const area = Math.round(600 + rand() * 2400);
      const beds = Math.max(1, Math.min(4, Math.round(area / 700 + gauss(rand) * 0.4)));
      const age = Math.round(rand() * 25);
      const metro = round(0.5 + rand() * 11.5, 1);
      const price = 20 + 0.055 * area + 6 * beds - 0.9 * age - 2.2 * metro + gauss(rand) * 8;
      return [area, beds, age, metro, round(Math.max(15, price), 1)].map(String);
    });
    return { columns, rows };
  }
  const columns = ['study_hours', 'attendance_pct', 'sleep_hours', 'result'];
  const rows = Array.from({ length: n }, () => {
    const hours = round(rand() * 10, 1);
    const attendance = Math.round(50 + rand() * 50);
    const sleep = round(4 + rand() * 5, 1);
    const score = 0.6 * hours + 0.05 * attendance + 0.3 * sleep + gauss(rand) * 0.8;
    return [hours, attendance, sleep, score > 8.6 ? 'pass' : 'fail'].map(String);
  });
  return { columns, rows };
}

/** Writes { columns, rows } back to CSV text (for "Download the sample"). */
export function toCsv({ columns, rows }) {
  const cell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [columns, ...rows].map((r) => r.map(cell).join(',')).join('\n');
}

// ---------- Training ----------

const MAX_ROWS = 3000; // the demo trains in the page; bigger files are sampled down to this

/** Solves A x = b (A square) by Gaussian elimination with partial pivoting. */
function solve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      if (f) for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

function knnPredict(trainX, trainY, x, k) {
  const best = []; // [dist, label], kept sorted, at most k long
  for (let i = 0; i < trainX.length; i++) {
    const row = trainX[i];
    let d = 0;
    for (let j = 0; j < x.length; j++) d += (row[j] - x[j]) ** 2;
    if (best.length < k || d < best[best.length - 1][0]) {
      best.push([d, trainY[i]]);
      best.sort((a, b) => a[0] - b[0]);
      if (best.length > k) best.pop();
    }
  }
  const votes = new Map();
  for (const [, label] of best) votes.set(label, (votes.get(label) || 0) + 1);
  return [...votes].sort((a, b) => b[1] - a[1])[0][0];
}

const accuracy = (pred, truth) => pred.filter((p, i) => p === truth[i]).length / truth.length;

/**
 * Trains a model to predict `target` from the other numeric columns, scored on 20% of the rows
 * held back from training. Numeric targets with many values → linear regression (R², MAE);
 * anything else → k-nearest neighbours classification (accuracy).
 */
export function train(data, target, { seed = 42 } = {}) {
  const info = describeColumns(data);
  const ti = data.columns.indexOf(target);
  if (ti < 0) throw new Error('Pick the column to predict.');
  const features = info.filter((c, i) => i !== ti && c.numeric).map((c) => c.name);
  const skipped = info.filter((c, i) => i !== ti && !c.numeric).map((c) => c.name);
  if (!features.length) throw new Error('The model needs at least one number column besides the one you predict.');
  const fi = features.map((f) => data.columns.indexOf(f));
  const kind = info[ti].numeric && info[ti].unique > 10 ? 'regression' : 'classification';

  let rows = data.rows.filter((r) => r[ti] !== '' && fi.every((i) => isNum(r[i])));
  if (kind === 'regression') rows = rows.filter((r) => isNum(r[ti]));
  if (rows.length < 10) throw new Error('Too few complete rows to train on (at least 10 are needed).');
  const sampled = rows.length > MAX_ROWS;
  if (sampled) rows = shuffled(rows.length, seed + 1).slice(0, MAX_ROWS).map((i) => rows[i]);

  const X = rows.map((r) => fi.map((i) => Number(r[i])));
  const y = rows.map((r) => (kind === 'regression' ? Number(r[ti]) : r[ti]));
  const order = shuffled(rows.length, seed);
  const nTest = Math.max(2, Math.round(rows.length * 0.2));
  const testIdx = order.slice(0, nTest);
  const trainIdx = order.slice(nTest);

  // Standardise with the training rows only (no peeking at the test rows).
  const mean = features.map((_, j) => trainIdx.reduce((s, i) => s + X[i][j], 0) / trainIdx.length);
  const std = features.map((_, j) => Math.sqrt(trainIdx.reduce((s, i) => s + (X[i][j] - mean[j]) ** 2, 0) / trainIdx.length) || 1);
  const scale = (x) => x.map((v, j) => (v - mean[j]) / std[j]);
  const Xs = X.map(scale);
  const trX = trainIdx.map((i) => Xs[i]);
  const teX = testIdx.map((i) => Xs[i]);
  const trY = trainIdx.map((i) => y[i]);
  const teY = testIdx.map((i) => y[i]);
  const base = { kind, target, features, skipped, sampled, rows: rows.length, trainRows: trainIdx.length, testRows: testIdx.length, mean, std };

  if (kind === 'regression') {
    // Ridge regression on [1, x...]: (XᵀX + λI) w = Xᵀy, the intercept not penalised.
    const d = features.length + 1;
    const A = Array.from({ length: d }, () => Array(d).fill(0));
    const b = Array(d).fill(0);
    trX.forEach((x, n) => {
      const v = [1, ...x];
      for (let r = 0; r < d; r++) {
        b[r] += v[r] * trY[n];
        for (let c = 0; c < d; c++) A[r][c] += v[r] * v[c];
      }
    });
    for (let r = 1; r < d; r++) A[r][r] += 0.1;
    const w = solve(A, b);
    const predict = (x) => w[0] + x.reduce((s, v, j) => s + v * w[j + 1], 0);
    const pred = teX.map(predict);
    const yMean = trY.reduce((s, v) => s + v, 0) / trY.length;
    const ssRes = pred.reduce((s, p, i) => s + (teY[i] - p) ** 2, 0);
    const ssTot = teY.reduce((s, v) => s + (v - yMean) ** 2, 0) || 1;
    const mae = pred.reduce((s, p, i) => s + Math.abs(teY[i] - p), 0) / pred.length;
    const baseMae = teY.reduce((s, v) => s + Math.abs(v - yMean), 0) / teY.length;
    const total = w.slice(1).reduce((s, v) => s + Math.abs(v), 0) || 1;
    return {
      ...base,
      model: 'Linear regression',
      weights: w,
      score: { r2: round(1 - ssRes / ssTot, 3), mae: round(mae), baseMae: round(baseMae) },
      importance: features.map((f, j) => ({ name: f, share: Math.abs(w[j + 1]) / total, sign: Math.sign(w[j + 1]) })).sort((a, b) => b.share - a.share),
      examples: testIdx.slice(0, 5).map((row, i) => ({ values: X[row], actual: teY[i], predicted: round(pred[i]) })),
    };
  }

  const k = Math.min(5, trX.length);
  const pred = teX.map((x) => knnPredict(trX, trY, x, k));
  const acc = accuracy(pred, teY);
  const counts = new Map();
  trY.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  const majority = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  // Permutation importance: how much test accuracy drops when one column is shuffled.
  const drops = features.map((_, j) => {
    const perm = shuffled(teX.length, seed + 10 + j);
    const broken = teX.map((x, i) => x.map((v, c) => (c === j ? teX[perm[i]][j] : v)));
    return Math.max(0, acc - accuracy(broken.map((x) => knnPredict(trX, trY, x, k)), teY));
  });
  const total = drops.reduce((s, v) => s + v, 0);
  return {
    ...base,
    model: `k-nearest neighbours (k = ${k})`,
    trainX: trX,
    trainY: trY,
    k,
    classes: [...counts.keys()],
    score: { accuracy: round(acc, 3), baseline: round(accuracy(teY.map(() => majority), teY), 3) },
    importance: features.map((f, j) => ({ name: f, share: total ? drops[j] / total : 1 / features.length, sign: 0 })).sort((a, b) => b.share - a.share),
    examples: testIdx.slice(0, 5).map((row, i) => ({ values: X[row], actual: teY[i], predicted: pred[i] })),
  };
}

/** Predicts one row: `values` are the raw feature numbers, in model.features order. */
export function predictOne(model, values) {
  const x = values.map((v, j) => (Number(v) - model.mean[j]) / model.std[j]);
  if (model.kind === 'regression') return round(model.weights[0] + x.reduce((s, v, j) => s + v * model.weights[j + 1], 0));
  return knnPredict(model.trainX, model.trainY, x, model.k);
}

// ---------- Knowledge: search your documents ----------

const STOP = new Set('a an and are as at be but by can do does for from has have how i in is it its me my of on or so that the this to was what when where which who why will with you your'.split(' '));

export const tokenize = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .split(/[^a-z0-9ऀ-ॿ]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));

/** Splits a document into passages of a few sentences (paragraphs, merged when short). */
export function chunk(text, target = 420) {
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  let cur = '';
  for (const p of paras) {
    if (cur && cur.length + p.length > target) {
      out.push(cur);
      cur = p;
    } else cur = cur ? `${cur} ${p}` : p;
    while (cur.length > target * 2) {
      const cut = cur.lastIndexOf('. ', target * 1.5);
      const at = cut > target / 2 ? cut + 1 : target * 1.5;
      out.push(cur.slice(0, at).trim());
      cur = cur.slice(at).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** BM25 search over every passage of every document. Returns the best passages first. */
export function searchDocs(docs, query, limit = 5) {
  const terms = [...new Set(tokenize(query))];
  if (!terms.length) return [];
  const passages = docs.flatMap((d) => chunk(d.text).map((text) => ({ doc: d, text, tokens: tokenize(text) })));
  if (!passages.length) return [];
  const avg = passages.reduce((s, p) => s + p.tokens.length, 0) / passages.length || 1;
  const df = new Map(terms.map((t) => [t, passages.filter((p) => p.tokens.includes(t)).length]));
  const N = passages.length;
  return passages
    .map((p) => {
      let score = 0;
      for (const t of terms) {
        const tf = p.tokens.filter((w) => w === t).length;
        if (!tf) continue;
        const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
        score += (idf * tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (p.tokens.length / avg)));
      }
      // Titles count too: a passage from "Interview checklist" matches "interview".
      if (terms.some((t) => tokenize(p.doc.title).includes(t))) score += 0.3;
      return { docId: p.doc.id, title: p.doc.title, text: p.text, score, matched: terms.filter((t) => p.tokens.includes(t)) };
    })
    .filter((r) => r.matched.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Splits text into [{ text, hit }] pieces so matched words can be highlighted without HTML. */
export function highlight(text, terms) {
  if (!terms.length) return [{ text, hit: false }];
  const parts = text.split(/([A-Za-z0-9ऀ-ॿ]+)/);
  return parts.filter(Boolean).map((w) => ({ text: w, hit: terms.some((t) => tokenize(w)[0] === t) }));
}

/** The most relevant sentence or two of a passage, for a short answer. */
export function bestSentences(text, query, max = 2) {
  const terms = new Set(tokenize(query));
  const sentences = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const scored = sentences.map((s, i) => ({ s, i, n: tokenize(s).filter((w) => terms.has(w)).length }));
  const top = scored.filter((x) => x.n).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, max).sort((a, b) => a.i - b.i);
  return (top.length ? top : scored.slice(0, 1)).map((x) => x.s).join(' ');
}

export const SAMPLE_DOCS = [
  {
    id: 'guide',
    title: 'Azarvis quick guide',
    sample: true,
    text: `Azarvis is a personal AI voice assistant built by Aamir Hussain Azad. Say "Hey Azarvis" and ask anything; the answer is read out loud, so it works hands-free.

Reminders: say "remind me to call mom at 6 pm". Azarvis saves a task with the time and reminds you when it is due. Today's reminders are read out when you start your day.

Documents: upload PDFs, Word files and text to the Knowledge base. Azarvis splits them into passages, searches them and answers questions from what they say, with the source shown.

Privacy: passwords are hashed with bcrypt, sessions are short-lived and you can delete your account at any time, which removes your chats, notes and documents.

Automate writes drafts for Gmail, LinkedIn, Instagram and YouTube. Azarvis never sends anything on its own; you review every draft and send it yourself.`,
  },
  {
    id: 'ml',
    title: 'Machine learning cheat sheet',
    sample: true,
    text: `Regression predicts a number, such as a house price. Classification predicts a category, such as pass or fail. Both learn from examples where the answer is known.

Always split your data: train on about 80% of the rows and test on the 20% the model never saw. A model that scores well on training rows but badly on test rows is overfitting: it memorised the examples instead of learning the pattern.

Fixes for overfitting: collect more data, use a simpler model, add regularisation (ridge or lasso), or use cross-validation to choose settings.

R squared tells you how much of the variation in the target the model explains: 1 is perfect, 0 is no better than guessing the average. MAE is the average size of the error, in the target's own units.

Accuracy is the share of correct predictions. Compare it with the baseline, always guessing the most common class. Precision asks how many predicted positives were right; recall asks how many real positives were found.`,
  },
  {
    id: 'interview',
    title: 'Interview preparation checklist',
    sample: true,
    text: `Research the company: its products, customers and recent news. Prepare two questions to ask the interviewer about the team and the work.

Answer behavioural questions with the STAR method: Situation, Task, Action and Result. Keep each answer under two minutes and end with what you learned.

For technical rounds, think out loud, start with a simple solution, then improve it. Say the time and space complexity of your answer.

The day before: test your camera and microphone, keep your resume open, and sleep well. Join the call five minutes early.`,
  },
];

// ---------- Vision: describe an image from its pixels ----------

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
};

/** A plain colour name for an RGB colour. */
export function colorName(r, g, b) {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 0.12) return 'black';
  if (l > 0.9 && s < 0.3) return 'white';
  if (s < 0.14) return l > 0.6 ? 'light grey' : l < 0.3 ? 'dark grey' : 'grey';
  if (h < 15 || h >= 345) return l < 0.35 ? 'maroon' : l > 0.75 ? 'pink' : 'red';
  if (h < 40) return l < 0.4 ? 'brown' : 'orange';
  if (h < 65) return l < 0.35 ? 'olive' : 'yellow';
  if (h < 160) return 'green';
  if (h < 195) return 'teal';
  if (h < 250) return l < 0.3 ? 'navy' : 'blue';
  if (h < 290) return 'purple';
  return 'pink';
}

/**
 * Looks at RGBA pixels (a downscaled copy of the image) and returns what can be said without AI:
 * brightness, the main colours, how much detail there is and whether it looks like a screenshot.
 */
export function analyzePixels(data, w, h) {
  const n = w * h;
  const buckets = new Map();
  let lum = 0;
  let sat = 0;
  let edges = 0;
  const grey = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    grey[i] = y;
    lum += y;
    sat += rgbToHsl(r, g, b)[1];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bk = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
    bk.n++;
    bk.r += r;
    bk.g += g;
    bk.b += b;
    buckets.set(key, bk);
  }
  for (let yy = 0; yy < h - 1; yy++)
    for (let x = 0; x < w - 1; x++) {
      const i = yy * w + x;
      edges += Math.abs(grey[i] - grey[i + 1]) + Math.abs(grey[i] - grey[i + w]);
    }
  const brightness = lum / n / 255;
  const saturation = sat / n;
  const detail = edges / ((w - 1) * (h - 1) * 2 * 255);
  // Group the buckets by colour name, so "blue" isn't listed three times.
  const named = new Map();
  for (const bk of buckets.values()) {
    const r = bk.r / bk.n;
    const g = bk.g / bk.n;
    const b = bk.b / bk.n;
    const name = colorName(r, g, b);
    const cur = named.get(name) || { name, n: 0, r: 0, g: 0, b: 0 };
    cur.n += bk.n;
    cur.r += bk.r;
    cur.g += bk.g;
    cur.b += bk.b;
    named.set(name, cur);
  }
  const colors = [...named.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)
    .map((c) => ({ name: c.name, share: c.n / n, hex: `#${[c.r, c.g, c.b].map((v) => Math.round(v / c.n).toString(16).padStart(2, '0')).join('')}` }));
  const top3 = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 3).reduce((s, b) => s + b.n, 0) / n;
  const flat = top3 > 0.45; // a few exact colours cover most of it: a screenshot, slide or graphic
  return { brightness, saturation, detail, colors, flat };
}

/** One or two plain sentences describing the image. */
export function describeImage(a, width, height) {
  const shape = width > height * 1.15 ? 'wide' : height > width * 1.15 ? 'tall' : 'square';
  const light = a.brightness > 0.68 ? 'bright' : a.brightness < 0.32 ? 'dark' : 'evenly lit';
  const colour = a.saturation < 0.12 ? 'almost black and white' : a.saturation > 0.45 ? 'colourful' : 'softly coloured';
  const kind = a.flat ? 'a screenshot, slide or graphic' : 'a photo';
  const main = a.colors.filter((c) => c.share > 0.08).map((c) => c.name);
  const busy = a.detail > 0.09 ? 'lots of fine detail' : a.detail < 0.03 ? 'smooth, simple areas' : 'a moderate amount of detail';
  const list = main.length > 1 ? `${main.slice(0, -1).join(', ')} and ${main.at(-1)}` : main[0] || a.colors[0]?.name;
  return `A ${shape}, ${light}, ${colour} image (${width} × ${height}) with ${busy}. Mostly ${list}. It looks like ${kind}.`;
}
