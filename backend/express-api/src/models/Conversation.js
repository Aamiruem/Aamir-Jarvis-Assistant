import mongoose from 'mongoose';

// A conversation is one document with an embedded array of messages:
// a natural fit for MongoDB's document model (compare with the SQL tables in backend/fastapi-ai).
const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    tools: [{ type: String }],
    intent: String,
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    title: { type: String, default: 'New conversation' },
    messages: [messageSchema],
  },
  { timestamps: true },
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
