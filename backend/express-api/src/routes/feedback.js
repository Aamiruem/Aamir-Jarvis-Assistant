// Public feedback from the website and the demo: no account needed, so it is rate-limited per IP
// and every field is checked and trimmed here. Admins read it with GET /api/admin/feedback.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

export const FEEDBACK_CATEGORIES = ['general', 'idea', 'bug', 'praise', 'demo'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns { value } with the cleaned feedback, or { error } with a message for the visitor. */
export function validateFeedback(input = {}) {
  const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const message = text(input.message, 2001);
  if (message.length < 3) return { error: 'Please write a few words of feedback.' };
  if (message.length > 2000) return { error: 'Feedback can be at most 2000 characters.' };
  const email = text(input.email, 161).toLowerCase();
  if (email && (email.length > 160 || !EMAIL.test(email))) return { error: 'That email address does not look right.' };
  let rating = null;
  if (input.rating !== undefined && input.rating !== null && input.rating !== '') {
    rating = Number(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Rating must be 1 to 5 stars.' };
  }
  const category = FEEDBACK_CATEGORIES.includes(input.category) ? input.category : 'general';
  return { value: { message, email, rating, category, name: text(input.name, 80), page: text(input.page, 40) } };
}

export function createFeedbackRouter({ feedback, tokens, settings = {} }) {
  const router = Router();
  const limiter = rateLimit({ windowMs: 60 * 60_000, limit: settings.feedbackPerHour ?? 10, standardHeaders: true, legacyHeaders: false });

  // Optional: a signed-in visitor's feedback is linked to their account.
  const userIdFrom = (req) => {
    const header = req.get('authorization') || '';
    if (!header.startsWith('Bearer ')) return null;
    try {
      return tokens.verifyAccess(header.slice(7))?.sub ?? null;
    } catch {
      return null;
    }
  };

  router.post('/', limiter, async (req, res) => {
    const { value, error } = validateFeedback(req.body || {});
    if (error) return res.status(400).json({ error, code: 'VALIDATION' });
    const saved = await feedback.create({
      ...value,
      userId: userIdFrom(req),
      ip: req.ip || '',
      userAgent: (req.get('user-agent') || '').slice(0, 300),
      createdAt: new Date(),
    });
    res.status(201).json({ id: saved.id, message: 'Thanks! Your feedback was sent.' });
  });

  return router;
}
