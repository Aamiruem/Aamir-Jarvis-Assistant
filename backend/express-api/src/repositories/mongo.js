// MongoDB implementations of the repositories (OOP: inheritance from a generic base class).
// Every method returns plain objects with a string `id`, so services never see Mongoose.
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { AuditLog, OtpChallenge, Session } from '../models/Security.js';
import { User } from '../models/User.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class MongoRepository {
  constructor(model) {
    this.model = model;
  }

  static toPlain(doc) {
    if (!doc) return null;
    const { _id, __v, ...rest } = doc;
    return { id: String(_id), ...rest };
  }

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return MongoRepository.toPlain(await this.model.findById(id).lean());
  }

  async create(data) {
    const doc = await this.model.create(data);
    return MongoRepository.toPlain(doc.toObject());
  }

  async update(id, patch) {
    if (!mongoose.isValidObjectId(id)) return null;
    return MongoRepository.toPlain(await this.model.findByIdAndUpdate(id, patch, { new: true }).lean());
  }

  async delete(id) {
    if (mongoose.isValidObjectId(id)) await this.model.deleteOne({ _id: id });
  }
}

export class MongoUserRepository extends MongoRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return MongoRepository.toPlain(await this.model.findOne({ email: email.toLowerCase() }).lean());
  }

  async adminStats(since, now = new Date()) {
    const [users, admins, newUsers, locked] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ role: 'admin' }),
      this.model.countDocuments({ createdAt: { $gte: since } }),
      this.model.countDocuments({ lockUntil: { $gt: now } }),
    ]);
    return { users, admins, newUsers, locked };
  }

  async recent(limit = 10) {
    const docs = await this.model.find().sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(MongoRepository.toPlain);
  }
}

export class MongoSessionRepository extends MongoRepository {
  constructor() {
    super(Session);
  }

  async findByTokenHash(tokenHash) {
    return MongoRepository.toPlain(await this.model.findOne({ tokenHash }).lean());
  }

  async listActive(userId, now = new Date()) {
    const docs = await this.model.find({ userId, revokedAt: null, expiresAt: { $gt: now } }).sort({ lastUsedAt: -1 }).lean();
    return docs.map(MongoRepository.toPlain);
  }

  async revokeFamily(userId, family, reason) {
    const r = await this.model.updateMany({ userId, family, revokedAt: null }, { revokedAt: new Date(), revokedReason: reason });
    return r.modifiedCount;
  }

  async revokeAllForUser(userId, reason, exceptFamily = null) {
    const filter = { userId, revokedAt: null, ...(exceptFamily ? { family: { $ne: exceptFamily } } : {}) };
    const r = await this.model.updateMany(filter, { revokedAt: new Date(), revokedReason: reason });
    return r.modifiedCount;
  }

  async deleteForUser(userId) {
    await this.model.deleteMany({ userId });
  }
}

export class MongoOtpRepository extends MongoRepository {
  constructor() {
    super(OtpChallenge);
  }

  async invalidateActive(userId, purpose) {
    await this.model.updateMany({ userId, purpose, consumedAt: null, invalidatedAt: null }, { invalidatedAt: new Date() });
  }

  async deleteForUser(userId) {
    await this.model.deleteMany({ userId });
  }
}

export class MongoAuditRepository extends MongoRepository {
  constructor() {
    super(AuditLog);
  }

  async listForUser(userId, limit = 30) {
    const docs = await this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(MongoRepository.toPlain);
  }
}

/** A conversation is one document with an embedded array of messages (see models/Conversation.js). */
export class MongoConversationRepository {
  async listForUser(userId, { q = '', limit = 50 } = {}) {
    const filter = { userId };
    if (q) filter['messages.content'] = { $regex: escapeRegex(q), $options: 'i' };
    return Conversation.find(filter).select('title updatedAt').sort({ updatedAt: -1 }).limit(limit).lean();
  }

  async findForUser(userId, id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Conversation.findOne({ _id: id, userId }).lean();
  }

  async create({ userId, title }) {
    return (await Conversation.create({ userId, title, messages: [] })).toObject();
  }

  async rename(userId, id, title) {
    if (!mongoose.isValidObjectId(id)) return null;
    return Conversation.findOneAndUpdate({ _id: id, userId }, { title }, { new: true, projection: 'title updatedAt' }).lean();
  }

  async deleteForUser(userId, id) {
    if (mongoose.isValidObjectId(id)) await Conversation.deleteOne({ _id: id, userId });
  }

  async appendMessages(id, messages) {
    await Conversation.updateOne({ _id: id }, { $push: { messages: { $each: messages } } });
  }

  async deleteAllForUser(userId) {
    await Conversation.deleteMany({ userId });
  }

  async count() {
    return Conversation.countDocuments();
  }
}
