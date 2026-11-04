import mongoose from 'mongoose';

const userNoteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    content: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true, maxlength: 40 },
  },
  { timestamps: true },
);

export const UserNote = mongoose.model('UserNote', userNoteSchema);
