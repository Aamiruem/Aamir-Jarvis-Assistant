import { Router } from 'express';

/** @param {{requireAuth: Function, conversations: import('../repositories/mongo.js').MongoConversationRepository}} deps */
export function createConversationRouter({ requireAuth, conversations }) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const q = (req.query.q || '').toString().trim().slice(0, 100);
    res.json(await conversations.listForUser(req.user.id, { q, limit: 50 }));
  });

  router.get('/:id', async (req, res) => {
    const convo = await conversations.findForUser(req.user.id, req.params.id);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    res.json(convo);
  });

  router.patch('/:id', async (req, res) => {
    const title = (req.body?.title || '').toString().trim().slice(0, 100);
    if (!title) return res.status(400).json({ error: 'A title is required' });
    const convo = await conversations.rename(req.user.id, req.params.id, title);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    res.json(convo);
  });

  router.delete('/:id', async (req, res) => {
    await conversations.deleteForUser(req.user.id, req.params.id);
    res.status(204).end();
  });

  return router;
}
