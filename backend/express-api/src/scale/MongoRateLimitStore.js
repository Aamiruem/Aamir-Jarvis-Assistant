// A rate-limit counter shared by every copy of the API. With the default in-memory counter each
// replica (and each CPU worker) counts on its own, so 3 replicas would allow 3x the attempts:
// a password-guessing limit of 30 would really be 90. Here every copy counts in one MongoDB
// collection, with one atomic update per request, and MongoDB's TTL index deletes old windows.
//
// Implements the express-rate-limit (v7) Store interface: init / increment / decrement / resetKey.
import mongoose from 'mongoose';

const COLLECTION = 'ratelimits';
let indexReady = null;

export class MongoRateLimitStore {
  /** @param {{ prefix: string, collection?: import('mongodb').Collection }} options */
  constructor({ prefix, collection } = {}) {
    this.prefix = `${prefix}:`;
    this.localKeys = false; // counts are shared between processes
    this.collection = collection;
  }

  #coll() {
    this.collection ??= mongoose.connection.collection(COLLECTION);
    // Once per process: expired windows are removed by MongoDB itself.
    indexReady ??= this.collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }).catch((err) => {
      indexReady = null;
      throw err;
    });
    return this.collection;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const now = new Date();
    const fresh = { $lte: [{ $ifNull: ['$resetAt', new Date(0)] }, now] }; // no window yet, or it ended
    // One atomic step: start a new window, or add one hit to the current one. Both fields are
    // computed from the document as it was before this update, so concurrent requests can't race.
    const doc = await this.#coll().findOneAndUpdate(
      { _id: this.prefix + key },
      [
        {
          $set: {
            hits: { $cond: [fresh, 1, { $add: ['$hits', 1] }] },
            resetAt: { $cond: [fresh, new Date(now.getTime() + this.windowMs), '$resetAt'] },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' },
    );
    return { totalHits: doc.hits, resetTime: doc.resetAt };
  }

  async decrement(key) {
    await this.#coll().updateOne({ _id: this.prefix + key, hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key) {
    await this.#coll().deleteOne({ _id: this.prefix + key });
  }
}
