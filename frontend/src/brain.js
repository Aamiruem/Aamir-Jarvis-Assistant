// Azarvis's offline "brain" for the website and the demo (no server, no account): answers a few
// kinds of questions and can DO things: set a reminder, open a page, switch the theme.
// respond(text) -> { text, action? }; the page decides how to run the action.

import { LIVE_APPS } from './siteLinks.js';

export const DEMO_TASKS_KEY = 'azarvis-demo-tasks';
const site = (label) => LIVE_APPS.find((a) => a.label === label)?.href;

/** "6 pm", "6:30pm", "18:00" -> "18:00" (24 h), or '' */
export function parseTime(text) {
  const m = text.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?![\w:])/i);
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || '').toLowerCase().replace(/\./g, '');
  if (!m[2] && !ap) return ''; // a bare number is not a time
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export const fmtTime = (hhmm) => {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

/** "remind me to call mom at 6 pm" / "remind me at 6 pm to call mom" -> { text, time } */
export function parseReminder(input) {
  const t = input.trim();
  if (!/\bremind me\b|\bset a reminder\b|\badd (a )?task\b/i.test(t)) return null;
  const time = parseTime(t);
  const what = t
    .replace(/^(hey |ok )?azarvis,?\s*/i, '')
    .replace(/\b(please|set a reminder|add (a )?task|remind me)\b/gi, '')
    .replace(/\b(at|by|for)\s+\d{1,2}([:.]\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/gi, '')
    .replace(/\b(today|tonight)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.:-]+|[\s,.:-]+$/g, '')
    .replace(/^(to|that|about)\s+/i, '');
  return what ? { text: what.charAt(0).toUpperCase() + what.slice(1), time } : null;
}

/** The demo's starting tasks, until the visitor changes them. */
export const SAMPLE_TASKS = () => [
  { id: 1, text: 'Submit the ML assignment', time: '18:00', done: false },
  { id: 2, text: 'Revise chapter 3: decision trees', time: '20:30', done: false },
  { id: 3, text: 'Try the Azarvis demo', time: '', done: true },
];

export function readDemoTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_TASKS_KEY));
    return Array.isArray(saved) ? saved : SAMPLE_TASKS();
  } catch {
    return SAMPLE_TASKS();
  }
}

/** Adds a task to the demo's task list (saved in this browser). */
export function saveDemoTask(task) {
  try {
    const list = readDemoTasks();
    list.unshift({ id: Date.now(), done: false, time: '', ...task });
    localStorage.setItem(DEMO_TASKS_KEY, JSON.stringify(list));
  } catch {}
}

// ---------- Memory: what the demo remembers about the visitor (this browser only) ----------
export const DEMO_MEMORY_KEY = 'azarvis-demo-memory';

export const SAMPLE_MEMORY = () => [
  { id: 1, kind: 'goal', text: 'Learn machine learning, one chapter a day' },
  { id: 2, kind: 'preference', text: 'Likes short answers, read aloud' },
  { id: 3, kind: 'fact', text: 'Studies best in the evening' },
];

export function readDemoMemory() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_MEMORY_KEY));
    return Array.isArray(saved) ? saved : SAMPLE_MEMORY();
  } catch {
    return SAMPLE_MEMORY();
  }
}

/** The visitor's name, when they told the demo ("my name is Riya"). */
export const memoryName = (facts) => facts.find((f) => f.kind === 'name')?.text ?? '';

/** "remember that I like tea" / "my name is Riya" -> { kind, text }, or null */
export function parseMemory(input) {
  const t = input.trim().replace(/^(hey |ok )?azarvis,?\s*/i, '');
  const name = t.match(/^(?:hi,?\s*|hello,?\s*)?(?:my name is|call me|i am called)\s+(\p{L}[\p{L}' -]{0,30}?)[.!]*$/iu);
  if (name) return { kind: 'name', text: name[1].trim().replace(/^\p{L}/u, (c) => c.toUpperCase()) };
  const m = t.match(/^(?:please\s+)?(?:remember|note|don't forget)\s+(?:that\s+)?(.{3,160}?)[.!]*$/i);
  if (!m || /^(to|me)\b/i.test(m[1])) return null; // "remember to…" is a reminder, not a fact
  const text = m[1].replace(/^i\b/i, 'You').replace(/^my\b/i, 'Your');
  return { kind: 'fact', text: text.charAt(0).toUpperCase() + text.slice(1) };
}

// "open the notes", "take me to projects"...
const PLACES = [
  // Aamir's live projects (opened in a new tab).
  [/\b(arvixa|store|shopping|marketplace)\b/, { type: 'link', href: site('Arvixa Store') }, 'Opening Arvixa Store, Aamir’s online marketplace.'],
  [/\b(presence|interview coach|focus tracker|distraction)\b/, { type: 'link', href: site('Presence AI') }, 'Opening Presence AI, the interview coach and focus tracker.'],
  [/\b(gratia|real estate|property|properties|flats?|house prices?)\b/, { type: 'link', href: site('Gratia Estates') }, 'Opening Gratia Estates for real estate in Gurgaon.'],
  [/\b(crop|farm\w*)\b/, { type: 'link', href: site('Crop Yield Prediction') }, 'Opening the crop yield prediction app.'],
  [/\b(tasks?|to-?dos?|reminders)\b/, { type: 'demo', section: 'tasks' }, 'Opening your tasks in the demo.'],
  [/\b(ml ?lab|machine learning lab|train(ing)? a model)\b/, { type: 'demo', section: 'mllab' }, 'Opening ML Lab. Pick a dataset and train a model, right in your browser.'],
  [/\b(knowledge|documents?|docs)\b/, { type: 'demo', section: 'knowledge' }, 'Opening Knowledge, where I search your documents.'],
  [/\b(vision|camera|room watch|photos?|images?)\b/, { type: 'demo', section: 'vision' }, 'Opening Vision. Show me an image.'],
  [/\b(memory|memories)\b/, { type: 'demo', section: 'memory' }, 'Opening Memory: everything I remember about you.'],
  [/\b(notes?|courses?|study)\b/, { type: 'demo', section: 'notes' }, 'Opening the study notes.'],
  [/\b(automate|automation|drafts?|posts?)\b/, { type: 'demo', section: 'automate' }, 'Opening Automate, where drafts are written.'],
  [/\bchat\b/, { type: 'demo', section: 'chat' }, 'Opening the chat.'],
  [/\bdemo\b/, { type: 'demo', section: 'home' }, 'Opening the live demo.'],
  [/\b(projects?|portfolio|github)\b/, { type: 'scroll', id: 'projects' }, "Here are Aamir's live projects."],
  [/\bfeatures?\b/, { type: 'scroll', id: 'features' }, 'Here is everything Azarvis can do.'],
  [/\b(faq|questions)\b/, { type: 'scroll', id: 'faq' }, 'Here are the common questions.'],
  [/\bfeedback\b/, { type: 'scroll', id: 'feedback' }, 'Opening the feedback form. Thank you!'],
  [/\b(sign ?up|register|create (an )?account)\b/, { type: 'page', page: 'signup' }, "Let's create your account."],
  [/\b(sign ?in|log ?in)\b/, { type: 'page', page: 'login' }, 'Opening sign in.'],
];

export function respond(input) {
  const raw = input.trim();
  const t = raw.toLowerCase();
  const now = new Date();

  const reminder = parseReminder(raw);
  if (reminder) {
    return {
      text: reminder.time
        ? `Done. I'll remind you at ${fmtTime(reminder.time)}: “${reminder.text}”. It's saved in the demo's Tasks.`
        : `Done. “${reminder.text}” is on your task list in the demo. Add a time, like “at 6 pm”, for a reminder.`,
      action: { type: 'task', task: reminder },
    };
  }
  const memory = parseMemory(raw);
  if (memory) {
    return {
      text: memory.kind === 'name' ? `Nice to meet you, ${memory.text}! I'll remember your name.` : `Got it. I'll remember: “${memory.text}”. You can see and delete it in Memory.`,
      action: { type: 'memory', fact: memory },
    };
  }
  if (/\b(battery|charg(er|ing)|system (info|details|status)|device (info|details)|my (pc|device|computer|laptop|phone)|cpu|ram|internet speed|network status)\b/.test(t))
    return { text: 'Here are your live device details: battery and charger, network, CPU and memory, with AI insights.', action: { type: 'demo', section: 'system' } };
  if (/what do you (know|remember)|what('s| is) my name|who am i\b/.test(t)) {
    const facts = readDemoMemory();
    const name = memoryName(facts);
    const rest = facts.filter((f) => f.kind !== 'name').map((f) => `• ${f.text}`);
    if (!name && !rest.length) return { text: "I don't remember anything about you yet. Say “remember that I like tea” or “my name is …”." };
    return { text: `${name ? `Your name is ${name}.` : "I don't know your name yet."}${rest.length ? `\n\nI also remember:\n${rest.join('\n')}` : ''}` };
  }
  if (/\b(dark|night) (mode|theme)\b/.test(t)) return { text: 'Switching to the dark theme.', action: { type: 'theme', mode: 'dark' } };
  if (/\b(light|day) (mode|theme)\b/.test(t)) return { text: 'Switching to the light theme.', action: { type: 'theme', mode: 'light' } };
  if (/\b(open|show|go to|take me to|see)\b/.test(t)) {
    const hit = PLACES.find(([re]) => re.test(t));
    if (hit) return { text: hit[2], action: hit[1] };
  }
  if (/\b(time|date|day is it|today)\b/.test(t))
    return { text: `It's ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} on ${now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}.` };
  if (/what can you do|help|feature|capabilit/.test(t))
    return {
      text: 'In the full app I answer anything out loud, set reminders, find things in your notes and documents, write drafts for Gmail and LinkedIn, and control your computer.\n\nHere every section works: try “Remind me to call mom at 6 pm”, “My name is …”, “Open ML Lab” or “Dark mode”.',
    };
  if (/overfit/.test(t))
    return { text: "Overfitting is when a model memorises its training data instead of learning the pattern: perfect on old examples, lost on new ones.\n\nYou spot it when the training score is high but the score on unseen data is low. Fixes: more data, a simpler model, regularisation or cross-validation." };
  if (/machine learning|\bml\b|\bai\b/.test(t))
    return { text: 'Machine learning teaches a computer from examples instead of rules: show it many houses with prices and it learns to price a new one. The Notes section has full chapters, from basics to advanced.' };
  if (/joke|funny/.test(t)) return { text: 'Why did the neural network break up with the decision tree?\nIt felt the tree was too quick to split.' };
  if (/\b(email|gmail|linkedin|instagram|youtube)\b/.test(t))
    return { text: 'Automate writes those drafts: pick Gmail, LinkedIn, Instagram or YouTube, type the topic and copy the draft. Azarvis never sends anything on its own.', action: { type: 'demo', section: 'automate', ask: true } };
  if (/weather|news|stock/.test(t)) return { text: 'Live weather and news need the Azarvis server. Create a free account and ask me again.' };
  if (/who (are|made|built|created)|about you|your name/.test(t))
    return { text: "I'm Azarvis, a personal AI voice assistant built by Aamir Hussain Azad. In the full app my answers come from Claude by Anthropic." };
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(t)) return { text: 'Hello! I am Azarvis. Try “Remind me to drink water at 5 pm” or “Open the notes”.' };
  if (/thank/.test(t)) return { text: 'You are welcome! If you liked it, the feedback form helps a lot.' };
  return { text: 'Here I know a few things: reminders (“remind me at 6 pm to…”), remembering facts (“remember that…”), opening sections (“open ML Lab”), the time and the theme. Create a free account and I will answer anything, out loud.' };
}

/** Reads text aloud with the browser's own voice. Returns false when it can't. */
export function speak(text, { onEnd } = {}) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[•\n“”"]+/g, ' '));
  u.rate = 1.03;
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find((v) => /en-IN/i.test(v.lang) && /natural|neural|online/i.test(v.name)) || voices.find((v) => /en-(IN|GB|US)/i.test(v.lang)) || null;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
  return true;
}
