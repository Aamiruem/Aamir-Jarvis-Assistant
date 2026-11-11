import mongoose from 'mongoose';

// Feedback sent from the public website (no account needed). Read by admins in the Admin tab.
const feedbackSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    rating: { type: Number, min: 1, max: 5, default: null },
    category: { type: String, default: 'general', trim: true, maxlength: 20 },
    name: { type: String, default: '', trim: true, maxlength: 80 },
    email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
    page: { type: String, default: '', trim: true, maxlength: 40 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);
feedbackSchema.index({ createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
