import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Unexpected server errors (HTTP 500) are also appended to logs/errors.log, one JSON line each,
// so they can be diagnosed even when nobody saw the terminal. Kept under ~1 MB (older half dropped).
const FILE = fileURLToPath(new URL('../logs/errors.log', import.meta.url));
const MAX_BYTES = 1_000_000;

export function logServerError(err, req) {
  console.error(err);
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    if (fs.existsSync(FILE) && fs.statSync(FILE).size > MAX_BYTES) {
      const text = fs.readFileSync(FILE, 'utf8');
      fs.writeFileSync(FILE, text.slice(text.indexOf('\n', text.length / 2) + 1));
    }
    const line = { at: new Date().toISOString(), method: req.method, path: req.originalUrl, code: err?.code, error: String(err?.stack || err) };
    fs.appendFileSync(FILE, JSON.stringify(line) + '\n');
  } catch {
    // never let logging turn one error into two
  }
}
