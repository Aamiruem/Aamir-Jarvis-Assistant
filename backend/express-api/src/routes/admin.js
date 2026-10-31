import { Router } from 'express';
import { aiFetch } from '../ai.js';
import { publicUser } from '../auth/AuthService.js';

export function createAdminRouter({ requireAuth, requireAdmin, users, conversations, sessions, audit }) {
  const router = Router();
  router.use(requireAuth, requireAdmin);

  // One call that combines account numbers (Node) with SQL analytics (Python).
  router.get('/overview', async (req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [stats, conversationCount, recentUsers, ai] = await Promise.all([
      users.adminStats(since),
      conversations.count(),
      users.recent(10),
      aiFetch('/admin/stats', req.user)
        .then((r) => r.json())
        .catch((err) => ({ error: err.message })),
    ]);
    res.json({
      users: stats.users,
      admins: stats.admins,
      newUsersLast7Days: stats.newUsers,
      lockedAccounts: stats.locked,
      conversations: conversationCount,
      recentUsers: recentUsers.map(publicUser),
      ai,
    });
  });

  router.patch('/users/:id/role', async (req, res) => {
    const { role } = req.body || {};
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'role must be user or admin' });
    if (req.params.id === req.user.id) return res.status(400).json({ error: "You can't change your own role" });
    const user = await users.update(req.params.id, { role });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // End their sessions so the new role takes effect immediately.
    await sessions.revokeAllForUser(user.id, 'role_changed');
    await audit.log('role_changed', { userId: user.id, meta: { role, by: req.user.id } });
    res.json(publicUser(user));
  });

  router.post('/users/:id/unlock', async (req, res) => {
    const user = await users.update(req.params.id, { lockUntil: null, failedLoginAttempts: 0 });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await audit.log('account_unlocked_by_admin', { userId: user.id, meta: { by: req.user.id } });
    res.json(publicUser(user));
  });

  return router;
}
