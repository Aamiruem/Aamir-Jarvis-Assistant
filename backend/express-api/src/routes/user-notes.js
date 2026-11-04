import { Router } from 'express';

export function createUserNotesRouter({ requireAuth, notes }) {
  const router = Router();

  router.get('/', requireAuth, async (req, res) => {
    const rows = await notes.listForUser(req.user.id);
    res.json(rows);
  });

  router.post('/', requireAuth, async (req, res) => {
    const { title, content, category } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }

    const row = await notes.create({
      userId: req.user.id,
      title: title.trim(),
      content: content.trim(),
      category: typeof category === 'string' && category.trim() ? category.trim() : 'General',
    });

    res.status(201).json(row);
  });

  router.put('/:id', requireAuth, async (req, res) => {
    const { title, content, category } = req.body ?? {};
    const existing = await notes.findForUser(req.user.id, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const patch = {};
    if (typeof title === 'string') patch.title = title.trim() || existing.title;
    if (typeof content === 'string') patch.content = content.trim() || existing.content;
    if (typeof category === 'string') patch.category = category.trim() || existing.category;

    if (!Object.keys(patch).length) {
      return res.json(existing);
    }

    const updated = await notes.update(req.params.id, patch);
    if (!updated) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(updated);
  });

  router.delete('/:id', requireAuth, async (req, res) => {
    const existing = await notes.findForUser(req.user.id, req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Note not found' });
    }
    await notes.delete(req.params.id);
    res.json({ deleted: req.params.id });
  });

  return router;
}
