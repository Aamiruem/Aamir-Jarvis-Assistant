import mongoose from 'mongoose';

// WhatsApp messages waiting for (or picked up by) the Azarvis AI service on the owner's PC.
// Kept 14 days, then MongoDB deletes them (TTL index).
const messageSchema = new mongoose.Schema(
  {
    waId: { type: String, required: true, unique: true }, // WhatsApp's message id (Meta may deliver twice)
    from: { type: String, required: true, maxlength: 20 },
    name: { type: String, default: '', maxlength: 80 },
    type: { type: String, default: 'text', maxlength: 20 },
    text: { type: String, default: '', maxlength: 4096 },
    mediaId: { type: String, default: '' },
    owner: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'delivered'], default: 'pending' },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);
messageSchema.index({ status: 1, createdAt: 1 });
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 14 * 24 * 3600 });

// Small key/value facts: when the PC last pulled, when the "PC is offline" notice was last sent.
const stateSchema = new mongoose.Schema({ key: { type: String, required: true, unique: true }, value: mongoose.Schema.Types.Mixed });

export const WhatsAppMessage = mongoose.model('WhatsAppMessage', messageSchema);
export const WhatsAppState = mongoose.model('WhatsAppState', stateSchema);
