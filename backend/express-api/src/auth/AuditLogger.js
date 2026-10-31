/**
 * Security audit trail ("recent activity" in a banking app). Every security-relevant event
 * is recorded with time, IP and device, so users and admins can spot suspicious access.
 * Logging must never break the request, so failures are only printed.
 */
export class AuditLogger {
  constructor({ auditRepo }) {
    this.auditRepo = auditRepo;
  }

  async log(event, { userId = null, ctx = {}, meta = {} } = {}) {
    try {
      await this.auditRepo.create({
        event,
        userId,
        ip: ctx.ip || null,
        userAgent: (ctx.userAgent || '').slice(0, 300),
        meta,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('audit log failed', event, err.message);
    }
  }

  recent(userId, limit = 30) {
    return this.auditRepo.listForUser(userId, limit);
  }
}
