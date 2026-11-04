// What Jarvis says and asks when a session starts.
//   First time:   a short spoken interview (name, city, work, what to help with), saved to memory.
//   Every time after: a greeting, today's reminders and one question to get the day going.
import { api } from './api.js';

const strip = (re) => (a) => a.replace(re, '').trim();
const tidy = (a) =>
  a
    .replace(/^(?:well|so|okay|ok|um+|uh+|hmm+)[,\s]+/i, '')
    .replace(/[.!?]+$/, '')
    .trim();

/**
 * The interview. `ask` may use earlier answers (so Jarvis can say your name back);
 * `clean` keeps the useful part of a spoken answer ("call me Aamir" -> "Aamir").
 */
export const ONBOARDING_QUESTIONS = [
  {
    key: 'name',
    ask: () => 'First, what should I call you?',
    clean: strip(/^(?:you can |please )?(?:call me|my name is|my name's|i am|i'm|it's|it is|this is)\s+/i),
    fact: (a) => `The user wants to be called ${a}.`,
  },
  {
    key: 'city',
    ask: ({ name }) => `Nice to meet you${name ? `, ${name}` : ''}. Which city do you live in? I'll use it for weather and local information.`,
    clean: strip(/^(?:i (?:live|stay) in|i'm (?:in|from)|i am (?:in|from)|from|in)\s+/i),
    fact: (a) => `The user lives in ${a}.`,
  },
  {
    key: 'work',
    ask: () => 'What do you do, for work or studies?',
    clean: strip(/^(?:i (?:work as|am working as)|i am|i'm)\s+(?:an?\s+)?/i),
    fact: (a) => `The user's work or studies: ${a}.`,
  },
  {
    key: 'help',
    ask: () => 'And what would you like my help with the most?',
    clean: strip(/^(?:i(?:'d| would) like (?:help|your help) with|help (?:me )?with|mostly|mainly)\s+/i),
    fact: (a) => `The user mainly wants help with: ${a}.`,
  },
  {
    key: 'day',
    ask: () => 'Last one: what time do you usually start your day?',
    clean: strip(/^(?:i (?:usually |normally )?(?:start|wake up|get up)(?: my day)?(?: at| around)?|at|around)\s+/i),
    fact: (a) => `The user usually starts their day around ${a}.`,
  },
];

export const SKIP_WORDS = /^(skip|next|pass|no idea|i don't know|don't know|rather not|skip it|skip this)$/i;

/** The useful part of a spoken answer, or '' when the user skipped the question. */
export function cleanAnswer(question, heard) {
  const said = tidy(heard || '');
  if (!said || SKIP_WORDS.test(said)) return '';
  return tidy(question.clean ? question.clean(said) : said);
}

const DAILY_QUESTIONS = [
  "What's the most important thing you want to get done today?",
  'How are you feeling today?',
  'Is there anything you want me to remind you about today?',
  "What's on your mind?",
];

/** Same question all day, a different one tomorrow. */
export function dailyQuestion(date = new Date()) {
  const day = Math.floor(date.getTime() / 86_400_000);
  return DAILY_QUESTIONS[day % DAILY_QUESTIONS.length];
}

export function hello(date = new Date()) {
  const h = date.getHours();
  return h < 5 ? 'Hello' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** "You have 2 reminders today: call the bank at 11:00 AM, gym at 6:00 PM." or '' */
export function remindersLine(tasks, now = new Date()) {
  const endOfDay = new Date(now).setHours(23, 59, 59, 999);
  const today = tasks.filter((t) => !t.done && t.remind_at && new Date(t.remind_at).getTime() <= endOfDay);
  if (!today.length) return '';
  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const list = today.slice(0, 3).map((t) => `${t.title} at ${time(t.remind_at)}`).join(', ');
  return `You have ${today.length} reminder${today.length > 1 ? 's' : ''} today: ${list}.`;
}

const onboardedKey = (userId) => `jarvis-onboarded-${userId}`;
export function markOnboarded(userId) {
  try {
    localStorage.setItem(onboardedKey(userId), new Date().toISOString());
  } catch {}
}
function wasOnboarded(userId) {
  try {
    return Boolean(localStorage.getItem(onboardedKey(userId)));
  } catch {
    return false;
  }
}

/** The name Jarvis was told to use, from memory ("The user wants to be called Aamir."). */
export function nameFromMemories(memories) {
  for (const m of memories) {
    const hit = /wants to be called (.+?)\.?$/i.exec(m.fact || '');
    if (hit) return hit[1];
  }
  return '';
}

/**
 * Everything the chat needs to open a spoken session:
 *   { greeting, interview: [...questions] }  - first time
 *   { greeting, question }                    - every time after
 */
export async function sessionPlan(user, { arrival = false, interview = false } = {}) {
  const [memories, tasks] = await Promise.all([
    api.memories().catch(() => []),
    api.tasks(false).catch(() => []),
  ]);
  const name = nameFromMemories(memories) || (user?.name || '').split(' ')[0];
  if (interview || (!wasOnboarded(user?.id) && memories.length < 2)) {
    return {
      greeting: `${hello()}${name ? `, ${name}` : ''}! I'm Jarvis, your personal assistant. Let me ask you a few quick questions so I can help you better. You can say "skip" at any time.`,
      interview: ONBOARDING_QUESTIONS,
    };
  }
  const question = dailyQuestion();
  const reminders = remindersLine(tasks);
  const opener = arrival ? `${hello()}${name ? `, ${name}` : ''}. Welcome back.` : `${hello()}${name ? `, ${name}` : ''}.`;
  return { greeting: [opener, reminders, question].filter(Boolean).join(' '), question };
}
