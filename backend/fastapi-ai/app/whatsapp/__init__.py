"""WhatsApp Jarvis: talk to Azarvis on WhatsApp (text or voice notes) and it does the work on this PC.

    WhatsApp ──► Meta Cloud API ──► Express API on Vercel (/api/whatsapp/webhook, verified, queued)
                                          ▲            │
                       replies, media ────┘            ▼  every few seconds
                                      this PC: app/whatsapp/loop.py pulls the queue,
                                      runs commands / the Claude agent, replies "✅ Done"

commands.py: instant commands that work without Claude (reminders, tasks, PC status, open apps…).
bot.py: one incoming message → reply (owner commands, voice notes, approval for other people).
relay.py: talks to the Express relay. loop.py: the background loop + forwarding of reminders/alerts.
"""
