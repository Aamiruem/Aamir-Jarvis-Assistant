// Pure logic for the Command Center "AI insights" strip. Turns the live data the home
// screen already loads (tasks, reminders, notifications, memories, device, chats) into a
// few short, useful observations — the kind an assistant would volunteer. No network, no
// React: just data in, insight objects out, so it is deterministic and testable.

const HOUR = 3600_000;

function hourOf(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getHours();
}

/** A friendly label for an hour-of-day (0-23). */
export function partOfDay(h) {
  if (h == null) return 'anytime';
  if (h < 5) return 'overnight';
  if (h < 12) return 'the morning';
  if (h < 17) return 'the afternoon';
  if (h < 21) return 'the evening';
  return 'late tonight';
}

/** The busiest reminder window across open tasks, or null if there aren't enough. */
export function busiestWindow(tasks, now = new Date()) {
  const soon = now.getTime() + 7 * 24 * HOUR;
  const hours = tasks
    .filter((t) => !t.done && t.remind_at)
    .map((t) => new Date(t.remind_at))
    .filter((d) => !Number.isNaN(d.getTime()) && d.getTime() >= now.getTime() && d.getTime() <= soon)
    .map((d) => d.getHours());
  if (hours.length < 2) return null;
  const buckets = {};
  for (const h of hours) {
    const b = Math.floor(h / 3) * 3; // 3-hour buckets
    buckets[b] = (buckets[b] || 0) + 1;
  }
  const [bucket, count] = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
  return { hour: Number(bucket), count, label: partOfDay(Number(bucket)) };
}

/** The highest device metric, if the bridge reported one. */
export function devicePressure(pc) {
  if (!pc) return null;
  const metrics = [
    ['CPU', pc.cpu],
    ['memory', pc.ram],
    ['disk', pc.disk],
  ].filter(([, v]) => typeof v === 'number');
  if (!metrics.length) return null;
  const [name, value] = metrics.sort((a, b) => b[1] - a[1])[0];
  return { name, value, high: value >= 85 };
}

/**
 * Build the insight cards from the home screen's live data.
 * Each: { id, icon, hue, title, text, action?: {label, prompt?, send?, tab?} }.
 * Ordered most-actionable first, capped at `max`.
 */
export function buildInsights({ tasks = [], memories = [], notes = [], pc = null, conversations = [], now = new Date() } = {}, max = 4) {
  const open = tasks.filter((t) => !t.done);
  const done = tasks.length - open.length;
  const unread = notes.filter((n) => !n.read).length;
  const overdue = open.filter((t) => t.remind_at && new Date(t.remind_at) < now).length;
  const dueToday = open.filter((t) => t.remind_at && new Date(t.remind_at).toDateString() === now.toDateString()).length;
  const out = [];

  if (overdue > 0) {
    out.push({
      id: 'overdue',
      icon: 'alert',
      hue: 8,
      title: `${overdue} overdue ${overdue === 1 ? 'reminder' : 'reminders'}`,
      text: `${overdue === 1 ? 'A reminder has' : 'Some reminders have'} slipped past. Clear ${overdue === 1 ? 'it' : 'them'} or push the time out.`,
      action: { label: 'Review overdue', prompt: 'Show my overdue reminders and suggest new times for each.', send: true },
    });
  }

  if (dueToday > 0) {
    out.push({
      id: 'today',
      icon: 'alarm',
      hue: 38,
      title: `${dueToday} due today`,
      text: `You have ${dueToday} ${dueToday === 1 ? 'reminder' : 'reminders'} landing today. Want a plan for the order to do them in?`,
      action: { label: 'Plan my day', prompt: 'Plan my day from my tasks and reminders: what to do first, what to follow up on, and what can wait.', send: true },
    });
  }

  const busy = busiestWindow(open, now);
  if (busy && busy.count >= 2) {
    out.push({
      id: 'window',
      icon: 'timeline',
      hue: 265,
      title: `Busy in ${busy.label}`,
      text: `${busy.count} reminders cluster around ${busy.label}. Spreading them out keeps the day lighter.`,
      action: { label: 'Rebalance', prompt: `I have ${busy.count} reminders clustered in ${busy.label}. Suggest a better spread across the day.`, send: true },
    });
  }

  const press = devicePressure(pc);
  if (press && press.high) {
    out.push({
      id: 'device',
      icon: 'cpu',
      hue: 190,
      title: `${press.name} at ${press.value}%`,
      text: `Your ${press.name} is running hot. Azarvis can show what's using it and help free it up.`,
      action: { label: 'Open device', tab: 'device' },
    });
  }

  if (unread > 0) {
    out.push({
      id: 'alerts',
      icon: 'bell',
      hue: 330,
      title: `${unread} unread ${unread === 1 ? 'alert' : 'alerts'}`,
      text: 'New notifications are waiting. Ask Azarvis to summarise what actually needs you.',
      action: { label: 'Catch me up', prompt: 'What needs my attention right now, and what can I ignore?', send: true },
    });
  }

  // Encouragement / nudges that are always available, used to fill up to `max`.
  if (done > 0 && open.length === 0) {
    out.push({
      id: 'clear',
      icon: 'check',
      hue: 150,
      title: 'Inbox zero on tasks',
      text: `All ${done} of your tasks are done. A good moment to plan tomorrow.`,
      action: { label: 'Plan tomorrow', prompt: "Help me plan tomorrow. Ask me what matters most, then draft a short list.", send: true },
    });
  }

  if (memories.length === 0) {
    out.push({
      id: 'teach',
      icon: 'brain',
      hue: 290,
      title: 'Teach Azarvis about you',
      text: 'I remember nothing yet. Tell me your city, your work and how you like replies, and I get sharper.',
      action: { label: 'Tell Azarvis', prompt: 'Remember that ', send: false },
    });
  } else {
    out.push({
      id: 'memory',
      icon: 'brain',
      hue: 290,
      title: `${memories.length} ${memories.length === 1 ? 'fact' : 'facts'} remembered`,
      text: 'Azarvis is using what it knows about you to answer. Add more any time with “Remember that…”.',
      action: { label: 'View memory', tab: 'memory' },
    });
  }

  if (conversations.length === 0) {
    out.push({
      id: 'firstchat',
      icon: 'chat',
      hue: 205,
      title: 'Start your first chat',
      text: 'Ask anything — draft an email, explain a topic, plan a trip. Everything stays on your account.',
      action: { label: 'Open chat', tab: 'chat' },
    });
  }

  // Always have at least one thing to say.
  if (out.length === 0) {
    out.push({
      id: 'ready',
      icon: 'sparkles',
      hue: 190,
      title: 'All clear',
      text: 'Nothing is on fire. Try the voice mode, or train your mind in Brain Gym.',
      action: { label: 'Open Brain Gym', tab: 'games' },
    });
  }

  return out.slice(0, max);
}
