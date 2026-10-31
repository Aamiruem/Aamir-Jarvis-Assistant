// In-memory implementations with the SAME methods as the Mongo ones. Tests (and quick
// experiments) run the full auth system with no database. Because services depend on
// "a repository" rather than on Mongoose, either can be plugged in (dependency injection).
//
// Pass { file } to keep the rows in a JSON file: that's the development fallback used when
// MongoDB isn't running, so accounts and chats survive a server restart.
import fs from 'node:fs';
import path from 'node:path';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const reviveDates = (_key, value) => (typeof value === 'string' && ISO_DATE.test(value) ? new Date(value) : value);

export class InMemoryRepository {
  constructor({ file } = {}) {
    this.rows = new Map();
    this.nextId = 1;
    this.file = file;
    if (file && fs.existsSync(file)) {
      const saved = JSON.parse(fs.readFileSync(file, 'utf8'), reviveDates);
      for (const row of saved.rows) this.rows.set(row.id, row);
      this.nextId = saved.nextId;
    }
  }

  /** Called after every write. Writes to a temp file first so a crash can't leave half a file. */
  _changed() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const json = JSON.stringify({ nextId: this.nextId, rows: [...this.rows.values()] });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, json);
    // Windows: antivirus or an editor's file watcher can hold the target open for a moment,
    // making rename fail with EPERM/EBUSY. Retry briefly, then write in place rather than fail the request.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        fs.renameSync(tmp, this.file);
        return;
      } catch (err) {
        if (!['EPERM', 'EBUSY', 'EACCES'].includes(err.code)) throw err;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20 * (attempt + 1));
      }
    }
    fs.writeFileSync(this.file, json);
    fs.rmSync(tmp, { force: true });
  }

  #copy(row) {
    return row ? structuredClone(row) : null;
  }

  where(predicate) {
    return [...this.rows.values()].filter(predicate).map((r) => this.#copy(r));
  }

  async findById(id) {
    return this.#copy(this.rows.get(String(id)));
  }

  async create(data) {
    const id = String(this.nextId++);
    const row = { ...structuredClone(data), id };
    this.rows.set(id, row);
    this._changed();
    return this.#copy(row);
  }

  async update(id, patch) {
    const row = this.rows.get(String(id));
    if (!row) return null;
    Object.assign(row, structuredClone(patch));
    this._changed();
    return this.#copy(row);
  }

  async delete(id) {
    if (this.rows.delete(String(id))) this._changed();
  }

  _updateWhere(predicate, patch) {
    let n = 0;
    for (const row of this.rows.values()) {
      if (predicate(row)) {
        Object.assign(row, structuredClone(patch));
        n++;
      }
    }
    if (n) this._changed();
    return n;
  }

  _deleteWhere(predicate) {
    let n = 0;
    for (const [id, row] of this.rows) {
      if (predicate(row)) {
        this.rows.delete(id);
        n++;
      }
    }
    if (n) this._changed();
  }
}

export class InMemoryUserRepository extends InMemoryRepository {
  async findByEmail(email) {
    return this.where((u) => u.email === email.toLowerCase())[0] || null;
  }

  async create(data) {
    const email = data.email.toLowerCase();
    if (await this.findByEmail(email)) throw Object.assign(new Error('duplicate email'), { code: 11000 });
    return super.create({ role: 'user', emailVerified: false, phone: null, phoneVerified: false, failedLoginAttempts: 0, lockUntil: null, preferences: { voice: false, language: 'en-IN', otpChannel: 'email' }, createdAt: new Date(), ...data, email });
  }

  async adminStats(since, now = new Date()) {
    const all = [...this.rows.values()];
    return {
      users: all.length,
      admins: all.filter((u) => u.role === 'admin').length,
      newUsers: all.filter((u) => u.createdAt >= since).length,
      locked: all.filter((u) => u.lockUntil && u.lockUntil > now).length,
    };
  }

  async recent(limit = 10) {
    return this.where(() => true).sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
}

export class InMemorySessionRepository extends InMemoryRepository {
  async findByTokenHash(tokenHash) {
    return this.where((s) => s.tokenHash === tokenHash)[0] || null;
  }

  async listActive(userId, now = new Date()) {
    return this.where((s) => s.userId === userId && !s.revokedAt && s.expiresAt > now).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }

  async revokeFamily(userId, family, reason) {
    return this._updateWhere((s) => s.userId === userId && s.family === family && !s.revokedAt, { revokedAt: new Date(), revokedReason: reason });
  }

  async revokeAllForUser(userId, reason, exceptFamily = null) {
    return this._updateWhere((s) => s.userId === userId && !s.revokedAt && s.family !== exceptFamily, { revokedAt: new Date(), revokedReason: reason });
  }

  async deleteForUser(userId) {
    this._deleteWhere((s) => s.userId === userId);
  }
}

export class InMemoryOtpRepository extends InMemoryRepository {
  async invalidateActive(userId, purpose) {
    this._updateWhere((o) => o.userId === userId && o.purpose === purpose && !o.consumedAt && !o.invalidatedAt, { invalidatedAt: new Date() });
  }

  async deleteForUser(userId) {
    this._deleteWhere((o) => o.userId === userId);
  }
}

export class InMemoryAuditRepository extends InMemoryRepository {
  async listForUser(userId, limit = 30) {
    return this.where((a) => a.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
}

/** Conversations are returned with `_id` (like the Mongo documents) because the frontend uses it. */
export class InMemoryConversationRepository extends InMemoryRepository {
  static #summary(c) {
    return { _id: c.id, title: c.title, updatedAt: c.updatedAt };
  }

  async listForUser(userId, { q = '', limit = 50 } = {}) {
    const needle = q.toLowerCase();
    return this.where((c) => c.userId === userId && (!needle || c.messages.some((m) => m.content.toLowerCase().includes(needle))))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit)
      .map(InMemoryConversationRepository.#summary);
  }

  async findForUser(userId, id) {
    const c = await this.findById(id);
    return c && c.userId === userId ? { ...c, _id: c.id } : null;
  }

  async create({ userId, title }) {
    const now = new Date();
    const c = await super.create({ userId, title, messages: [], createdAt: now, updatedAt: now });
    return { ...c, _id: c.id };
  }

  async rename(userId, id, title) {
    if (!(await this.findForUser(userId, id))) return null;
    return InMemoryConversationRepository.#summary(await this.update(id, { title, updatedAt: new Date() }));
  }

  async deleteForUser(userId, id) {
    if (await this.findForUser(userId, id)) await this.delete(id);
  }

  async appendMessages(id, messages) {
    const c = this.rows.get(String(id));
    if (!c) return;
    const now = new Date();
    c.messages.push(...structuredClone(messages).map((m) => ({ ...m, createdAt: now })));
    c.updatedAt = now;
    this._changed();
  }

  async deleteAllForUser(userId) {
    this._deleteWhere((c) => c.userId === userId);
  }

  async count() {
    return this.rows.size;
  }
}
