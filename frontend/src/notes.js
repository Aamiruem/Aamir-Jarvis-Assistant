// Notes (frontend/public/notes, made by scripts/import_notes.py): loading, search, practice cards
// and reading progress. Pure helpers are unit-tested in notes.test.js.

const BASE = '/notes';
const cache = new Map();

async function getText(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((r) => {
      if (!r.ok) throw new Error(`Couldn't load ${path} (${r.status})`);
      return r.text();
    }));
  }
  return cache.get(path);
}

export const loadLibrary = async () => JSON.parse(await getText(`${BASE}/index.json`));
export const loadBook = async (slugName) => JSON.parse(await getText(`${BASE}/${slugName}/index.json`));
export const loadChapter = (slugName, file) => getText(`${BASE}/${slugName}/${file}`);
export const chaptersOf = (book) => book.parts.flatMap((p) => p.chapters.map((c) => ({ ...c, part: p.name })));

export function slug(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

/**
 * The notes write formulas as \( … \) and \[ … \]; the Markdown math plugin reads $$ … $$.
 * Converted outside code blocks only, for display; the stored notes stay word for word.
 */
export function toDollarMath(md) {
  let fence = false;
  return md
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fence = !fence;
        return line;
      }
      if (fence) return line;
      if (/^\s*\\\[\s*$/.test(line) || /^\s*\\\]\s*$/.test(line)) return line.replace(/\\[[\]]/, '$$$$');
      return line.replace(/\\\[(.+?)\\\]/g, (_, m) => `$$${m}$$`).replace(/\\\((.+?)\\\)/g, (_, m) => `$$${m}$$`);
    })
    .join('\n');
}

/** Top-level (#) sections outside code blocks: [{ title, body }]. */
export function sections(md) {
  const out = [];
  let fence = false;
  let current = null;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (!fence && line.startsWith('# ')) {
      current = { title: line.slice(2).trim(), body: '' };
      out.push(current);
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  return out;
}

const GENERIC = /^(definition|example|examples|code|output|formula|summary|explanation|note|notes|important|interview answer|interview questions?)$/i;

/** Practice cards: each topic section with enough to recall (headings like "Code" alone are skipped). */
export function practiceCards(md) {
  return sections(md)
    .map((s, i) => ({ id: i, title: s.title.replace(/\s+/g, ' ').trim(), body: s.body.trim() }))
    .filter((c) => c.body.length > 80 && !GENERIC.test(c.title.replace(/^\d+(\.\d+)*\.?\s*/, '')) && !/^Phase \d+/.test(c.title));
}

/** Full-text search across chapters: [{ chapter, heading, snippet }] (case-insensitive, every word must match). */
export function searchText(chapters, texts, query, limit = 60) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const hits = [];
  chapters.forEach((ch, i) => {
    const text = texts[i] || '';
    let heading = ch.title;
    let fence = false;
    for (const line of text.split('\n')) {
      if (/^\s*```/.test(line)) fence = !fence;
      if (!fence && /^#{1,3} /.test(line)) heading = line.replace(/^#+ /, '').trim();
      const low = line.toLowerCase();
      if (line.trim() && words.every((w) => low.includes(w))) {
        const at = low.indexOf(words[0]);
        hits.push({ chapter: ch, heading, snippet: line.trim().slice(Math.max(0, at - 60), at + 140) });
        if (hits.length >= limit) return;
      }
    }
  });
  return hits.slice(0, limit);
}

// ---- progress (per browser) ----
const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
export const readChapters = (book) => new Set(read(`jarvis-notes-read:${book}`, []));
export const setChapterRead = (book, id, done) => {
  const s = readChapters(book);
  if (done) s.add(id);
  else s.delete(id);
  write(`jarvis-notes-read:${book}`, [...s]);
  return s;
};
export const cardMarks = (book, chapter) => read(`jarvis-notes-cards:${book}:${chapter}`, {});
export const markCard = (book, chapter, cardId, mark) => {
  const marks = { ...cardMarks(book, chapter), [cardId]: mark };
  write(`jarvis-notes-cards:${book}:${chapter}`, marks);
  return marks;
};
