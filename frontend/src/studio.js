// Agent Studio: one voice call or one typed idea, one manager, a team of specialist agents.
//
//  * Create mode: Azarvis interviews you (idea, story, quote, proof, hot take, audience), then
//    the manager briefs 8 specialists who write a week of content and design 9 images.
//  * Solve mode: you describe a problem; 6 specialists listen, diagnose, check, plan, fix and verify.
//
// Everything here runs in the browser in milliseconds (no server, no account), so the studio
// works on the live website. Pure functions only; images are drawn in studioArt.js.

export const TONES = [
  ['founder', 'Founder, honest'],
  ['teacher', 'Friendly teacher'],
  ['bold', 'Bold & punchy'],
  ['pro', 'Professional'],
];
export const LOOKS = [
  ['editorial', 'Editorial photo'],
  ['neon', 'Neon night'],
  ['minimal', 'Clean minimal'],
  ['warm', 'Warm pastel'],
  ['brand', 'Azarvis gradient'],
];

export const QUESTIONS = {
  create: [
    { key: 'idea', label: 'Idea', ask: "Hi, I'm Azarvis. What's the one idea you want to share this week?" },
    { key: 'story', label: 'Story', ask: "Love it. What's a real moment or story behind it?" },
    { key: 'quote', label: 'Quote', ask: 'Give me one line people should remember.' },
    { key: 'proof', label: 'Proof', ask: 'Any number, result or example that proves it?' },
    { key: 'take', label: 'Hot take', ask: 'What do most people get wrong about this?' },
    { key: 'audience', label: 'Audience', ask: 'Last one. Who is this for?' },
  ],
  solve: [
    { key: 'problem', label: 'Problem', ask: "Hi, I'm Azarvis. Tell me the problem, in your own words." },
    { key: 'since', label: 'Since when', ask: 'When did it start, and does anything make it worse?' },
    { key: 'tried', label: 'Tried', ask: 'What have you tried already?' },
    { key: 'goal', label: 'Goal', ask: 'And what does "fixed" look like for you?' },
  ],
};

export const TEAMS = {
  create: [
    { id: 'carousel', name: 'Carousel designer', icon: 'screenshot', hue: 330, makes: 'Instagram carousel', detail: '5 slides · 3 images' },
    { id: 'shorts', name: 'Shorts director', icon: 'youtube', hue: 0, makes: 'YouTube Short', detail: '45 s script + thumbnail' },
    { id: 'story', name: 'Story designer', icon: 'instagram', hue: 300, makes: 'Instagram story', detail: '3 frames' },
    { id: 'poster', name: 'Poster designer', icon: 'sparkles', hue: 45, makes: 'Poster', detail: '1 image' },
    { id: 'linkedin', name: 'LinkedIn writer', icon: 'linkedin', hue: 210, makes: 'LinkedIn post', detail: 'post + quote card' },
    { id: 'xthread', name: 'X thread writer', icon: 'chat', hue: 190, makes: 'X thread', detail: '6 posts' },
    { id: 'newsletter', name: 'Newsletter editor', icon: 'mail', hue: 150, makes: 'Newsletter', detail: 'subject + issue' },
    { id: 'calendar', name: 'Calendar planner', icon: 'calendar', hue: 85, makes: 'Content calendar', detail: '7 days' },
  ],
  solve: [
    { id: 'listener', name: 'Listener', icon: 'mic', hue: 190, makes: 'What you said', detail: 'summary + urgency' },
    { id: 'diagnoser', name: 'Diagnoser', icon: 'search', hue: 265, makes: 'Likely causes', detail: 'ranked' },
    { id: 'researcher', name: 'Researcher', icon: 'book', hue: 210, makes: 'Quick checks', detail: 'to confirm the cause' },
    { id: 'planner', name: 'Planner', icon: 'timeline', hue: 45, makes: 'Step-by-step plan', detail: 'in order' },
    { id: 'fixer', name: 'Fixer', icon: 'zap', hue: 330, makes: 'Do this now', detail: '3 quick wins' },
    { id: 'checker', name: 'Checker', icon: 'check', hue: 150, makes: 'Is it fixed?', detail: 'checklist + reminders' },
  ],
};

export const DEMO_IDEAS = {
  create: 'Consistency beats talent. Last year I posted one small project every week, even when nobody watched. "Ship small, ship often." In 12 months I got 3 job offers and 4,000 followers. Most people wait for the perfect idea instead of starting. For students learning AI and web development.',
  solve: 'My laptop is very slow and hangs when I open Chrome and VS Code together. It started last week and gets worse in the evening. I tried restarting. I want it fast enough to code without freezing.',
};

// ---------- text helpers ----------

const STOP = new Set('a an and are as at be but by can do for from has have how i in is it its me my of on or so that the this to was we what when with you your our their they them it\'s im just really very about into than then there these those will would should could more most'.split(' '));

export const sentences = (text) =>
  (text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*["”’]?/g) || []).map((s) => s.trim()).filter((s) => s.length > 1);

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const trimEnd = (s) => s.replace(/[\s.,;:!?]+$/, '');
const clip = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…`);

/** The few words a piece is "about", for hashtags and titles. */
export function keywords(text, n = 3) {
  const counts = new Map();
  for (const w of text.toLowerCase().match(/[a-z][a-z0-9+#-]{2,}/g) || []) if (!STOP.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).slice(0, n).map(([w]) => w);
}

/** Splits a typed idea into the idea map's fields (anything missing is filled in later). */
export function parseIdea(text) {
  const all = sentences(text);
  const map = {};
  const quoted = text.match(/["“]([^"”]{6,140})["”]/);
  if (quoted) map.quote = trimEnd(quoted[1]);
  const rest = all.filter((s) => !quoted || !s.includes(quoted[1]));
  const take = (re) => {
    const i = rest.findIndex(re.test.bind(re));
    return i < 0 ? undefined : trimEnd(rest.splice(i, 1)[0]);
  };
  map.audience = take(/^(for|this is for|it'?s for|made for)\b/i)?.replace(/^(for|this is for|it'?s for|made for)\s+/i, '');
  map.proof = take(/\d|%|percent|\bx\b|times|doubled|tripled/i);
  map.take = take(/\b(most people|everyone thinks|myth|wrong|mistake|instead of|stop |don'?t|nobody)\b/i);
  map.story = take(/\b(i|we|my|our|last (year|week|month)|yesterday|when i)\b/i);
  map.idea = rest.length ? trimEnd(rest.shift()) : map.story || map.take || trimEnd(all[0] || text);
  if (!map.quote && rest.length) map.quote = trimEnd(rest.sort((a, b) => a.length - b.length)[0]);
  for (const k of Object.keys(map)) if (!map[k]) delete map[k];
  return map;
}

export function parseProblem(text) {
  const all = sentences(text);
  const map = { problem: trimEnd(all[0] || text) };
  const rest = all.slice(1);
  const find = (re) => {
    const i = rest.findIndex(re.test.bind(re));
    return i < 0 ? undefined : trimEnd(rest.splice(i, 1)[0]);
  };
  map.since = find(/\b(since|started|ago|last (week|month|night)|yesterday|every|when|worse|after)\b/i);
  map.tried = find(/\b(tried|restart|reinstall|already|checked|cleared|updated)\b/i);
  map.goal = find(/\b(want|need|goal|so that|fixed|able to)\b/i);
  if (rest.length) map.problem = `${map.problem}. ${rest.map(trimEnd).join('. ')}`;
  for (const k of Object.keys(map)) if (!map[k]) delete map[k];
  return map;
}

/** How complete the idea map is (0-100) and what to say about it. */
export function strength(map, mode = 'create') {
  const qs = QUESTIONS[mode];
  const weight = mode === 'create' ? { idea: 26, story: 18, quote: 14, proof: 16, take: 14, audience: 12 } : { problem: 40, since: 20, tried: 20, goal: 20 };
  let score = 0;
  for (const q of qs) {
    const v = (map[q.key] || '').trim();
    if (!v) continue;
    score += weight[q.key] * Math.min(1, 0.55 + v.split(/\s+/).length / 20);
  }
  score = Math.round(score);
  const missing = qs.filter((q) => !(map[q.key] || '').trim()).map((q) => q.label.toLowerCase());
  const label = score >= 85 ? 'Strong' : score >= 60 ? 'Good' : score >= 30 ? 'Getting there' : 'Just started';
  return { score, label, missing };
}

/** Fills gaps in the idea map so every specialist has something to work with. */
export function completeIdea(map) {
  const idea = trimEnd(map.idea || map.story || 'Small daily habits build big results');
  const kw = keywords([idea, map.story, map.take].filter(Boolean).join(' '));
  return {
    idea,
    story: trimEnd(map.story || `I learned this the hard way while working on ${kw[0] || 'my own projects'}`),
    quote: trimEnd(map.quote || idea),
    proof: trimEnd(map.proof || `People who apply this for 30 days see the difference`),
    take: trimEnd(map.take || `Most people wait for motivation instead of building the habit`),
    audience: trimEnd(map.audience || `anyone who wants to get better at ${kw[0] || 'their work'}`),
    keywords: kw.length ? kw : ['growth'],
  };
}

// ---------- the content team ----------

const VOICE = {
  founder: { hook: (i) => `Honest truth: ${lc(i)}.`, cta: 'If this helped, tell me what you are building.', sign: 'Building in public' },
  teacher: { hook: (i) => `Here's a simple idea that changes a lot: ${lc(i)}.`, cta: 'Save this for later and share it with a friend who needs it.', sign: 'Learn with me' },
  bold: { hook: (i) => `${trimEnd(cap(i))}. Period.`, cta: 'Agree or disagree? Fight me in the comments.', sign: 'No fluff' },
  pro: { hook: (i) => `A practical insight: ${lc(i)}.`, cta: 'I would value your perspective in the comments.', sign: 'Insights' },
};
function lc(s) {
  const t = trimEnd(s);
  return /^[A-Z][a-z]/.test(t) && !/^I\b/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
const tags = (kw, extra = []) => [...kw, ...extra].slice(0, 5).map((k) => `#${k.replace(/[^a-z0-9]/gi, '')}`).join(' ');

/** What each specialist delivers: { title, text, images: [{ kind, title, body, tag }] }. */
export function runSpecialist(id, raw, { tone = 'founder', handle = '@azarvis' } = {}) {
  const m = completeIdea(raw);
  const v = VOICE[tone] || VOICE.founder;
  const title = clip(cap(m.idea), 64);
  const kw = m.keywords;
  switch (id) {
    case 'carousel': {
      const slides = [
        ['Cover', title, `Swipe → ${handle}`],
        ['The story', clip(cap(m.story), 140), 'Where it started'],
        ['The mistake', clip(cap(m.take), 140), 'What most people get wrong'],
        ['The proof', clip(cap(m.proof), 140), 'It works'],
        ['Remember', `“${clip(cap(m.quote), 110)}”`, v.cta],
      ];
      return {
        title: 'Instagram carousel · 5 slides',
        text: `${slides.map(([h, b], i) => `Slide ${i + 1} · ${h}\n${b}`).join('\n\n')}\n\nCaption:\n${v.hook(m.idea)} ${v.cta}\n\n${tags(kw, ['learning', 'growth'])}`,
        images: [
          { kind: 'carousel', title, body: 'A swipe-through guide', tag: '1 / 5' },
          { kind: 'carousel', title: clip(cap(m.take), 90), body: 'What most people get wrong', tag: '3 / 5' },
          { kind: 'carousel', title: `“${clip(cap(m.quote), 80)}”`, body: v.cta, tag: '5 / 5' },
        ],
      };
    }
    case 'shorts':
      return {
        title: 'YouTube Short · 45 s script',
        text: [
          `0-3 s  HOOK: ${v.hook(m.idea)}`,
          `3-12 s  STORY: ${cap(m.story)}.`,
          `12-22 s  MISTAKE: ${cap(m.take)}.`,
          `22-34 s  PROOF: ${cap(m.proof)}.`,
          `34-42 s  LESSON: “${cap(m.quote)}.”`,
          `42-45 s  CTA: Follow for more on ${kw[0]}.`,
          '',
          `On-screen text: ${clip(title, 40)}`,
          `Title: ${clip(title, 60)} #shorts`,
          `Description: ${cap(m.quote)}. For ${m.audience}. ${tags(kw, ['shorts'])}`,
        ].join('\n'),
        images: [{ kind: 'thumbnail', title: clip(title.toUpperCase(), 44), body: kw[0] ? `The truth about ${kw[0]}` : 'Watch this', tag: '45 s' }],
      };
    case 'story':
      return {
        title: 'Instagram story · 3 frames',
        text: `Frame 1 (hook): ${title}\nFrame 2 (insight): ${cap(m.take)}. Instead: ${lc(m.quote)}.\nFrame 3 (poll): Do you agree? Yes / Not yet\n\nSticker: link to the full carousel. Music: calm, upbeat.`,
        images: [
          { kind: 'story', title, body: 'Tap to see why →', tag: '1/3' },
          { kind: 'story', title: clip(cap(m.take), 80), body: `Instead: ${clip(lc(m.quote), 70)}`, tag: '2/3' },
          { kind: 'story', title: 'Do you agree?', body: 'Yes, 100%   ·   Not yet', tag: '3/3', poll: true },
        ],
      };
    case 'poster':
      return {
        title: 'Poster',
        text: `Headline: “${cap(m.quote)}”\nSub-line: ${clip(cap(m.idea), 80)}\nFooter: ${handle} · ${v.sign}\nSize: 1080 × 1350 (feed) — print-ready at A4 when scaled.`,
        images: [{ kind: 'poster', title: `“${clip(cap(m.quote), 90)}”`, body: clip(cap(m.idea), 80), tag: v.sign }],
      };
    case 'linkedin':
      return {
        title: 'LinkedIn post',
        text: `${v.hook(m.idea)}\n\n${cap(m.story)}.\n\nWhat I learned:\n• ${cap(m.take)} — and that's the trap.\n• ${cap(m.proof)}.\n• “${cap(m.quote)}.”\n\nIf you are ${m.audience.replace(/^(anyone|people) who /, 'someone who ')}, start this week.\n\n${v.cta}\n\n${tags(kw, ['careers', 'learning'])}`,
        images: [{ kind: 'linkedin', title: `“${clip(cap(m.quote), 100)}”`, body: handle, tag: 'LinkedIn' }],
      };
    case 'xthread':
      return {
        title: 'X thread · 6 posts',
        text: [
          `1/ ${v.hook(m.idea)} A thread 🧵`,
          `2/ ${cap(m.story)}.`,
          `3/ The mistake: ${lc(m.take)}.`,
          `4/ The proof: ${lc(m.proof)}.`,
          `5/ The rule I follow now: “${cap(m.quote)}.”`,
          `6/ ${v.cta} Follow ${handle} for more on ${kw.slice(0, 2).join(' & ')}.`,
        ].map((t) => clip(t, 280)).join('\n\n'),
        images: [],
      };
    case 'newsletter':
      return {
        title: 'Newsletter issue',
        text: `Subject: ${clip(title, 50)}\nPreview: ${clip(cap(m.quote), 90)}\n\nHi friend,\n\n${cap(m.story)}.\n\nHere's the thing: ${lc(m.take)}. ${cap(m.proof)}.\n\nThis week, try one thing: ${lc(m.quote)}.\n\n— ${handle.replace(/^@/, '')}\n\nP.S. ${v.cta}`,
        images: [],
      };
    case 'calendar': {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const plan = [
        ['LinkedIn post', '9:00 am'],
        ['Instagram carousel', '7:00 pm'],
        ['X thread', '10:00 am'],
        ['YouTube Short', '6:00 pm'],
        ['Instagram story + poll', '1:00 pm'],
        ['Poster (feed + WhatsApp status)', '11:00 am'],
        ['Newsletter', '8:00 am'],
      ];
      return {
        title: 'Content calendar · 7 days',
        text: `${plan.map(([what, when], i) => `${days[i]}  ${when.padEnd(8)}  ${what}`).join('\n')}\n\nBest times are for an Indian audience (IST). Reply to every comment in the first hour.`,
        plan: plan.map(([what, when], i) => ({ day: days[i], what, when })),
        images: [],
      };
    }
    default:
      return { title: id, text: '', images: [] };
  }
}

// ---------- the problem-solving team ----------

const KB = [
  {
    id: 'slow-pc',
    re: /\b(slow|lag|hang|freez|stuck|not responding|100%|cpu|ram|memory|heat|hot|fan)\b/i,
    name: 'Slow or freezing computer',
    causes: ['Memory (RAM) is almost full, so Windows swaps to the disk', 'Too many apps and browser tabs start with the PC', 'The disk is nearly full (under 15% free)', 'A background update, antivirus scan or indexer is running', 'Dust and heat make the processor slow itself down'],
    checks: ['Open Task Manager (Ctrl+Shift+Esc) and sort by Memory and CPU', 'Open Azarvis → My device: is memory above 85% or the disk above 90%?', 'Look at the Startup apps tab in Task Manager', 'Feel the bottom of the laptop: very hot means heat is part of it'],
    steps: ['Close the top 3 memory users you don\'t need right now', 'Disable heavy apps in Task Manager → Startup apps', 'Free at least 20 GB: empty the Recycle Bin, Downloads and run Disk Cleanup', 'Keep Chrome under ~10 tabs; turn on Memory Saver in Chrome settings', 'Install pending Windows updates, then restart once', 'If it is still slow: add RAM or move to an SSD'],
    quick: ['Restart the PC (not just sleep)', 'Close unused Chrome tabs', 'Plug in the charger and choose Best performance power mode'],
  },
  {
    id: 'internet',
    re: /\b(internet|wifi|wi-fi|network|router|slow net|no connection|disconnect|buffer|ping|lag in game|data)\b/i,
    name: 'Internet problems',
    causes: ['Weak Wi-Fi signal (far from the router or walls in between)', 'The router needs a restart', 'Too many devices are streaming at once', 'The provider has an outage or you hit a data limit'],
    checks: ['Open Azarvis → My device: look at response time and quality', 'Try another device on the same Wi-Fi', 'Move next to the router and test again', 'Check the provider app for outages or data balance'],
    steps: ['Restart the router: unplug for 30 seconds', 'Move closer, or connect a network cable', 'Switch to the 5 GHz Wi-Fi band if your router has one', 'Forget the Wi-Fi network and join again', 'Call the provider if every device is slow'],
    quick: ['Restart the router', 'Turn Wi-Fi off and on', 'Pause big downloads and streams'],
  },
  {
    id: 'battery',
    re: /\b(battery|charg|drain|power|plug)\b/i,
    name: 'Battery or charging',
    causes: ['Screen brightness and background apps use most of the power', 'The battery has aged (fewer full charges left)', 'The charger, cable or port is loose or not enough watts'],
    checks: ['Azarvis → My device shows if the charger is connected right now', 'Windows: Settings → System → Power & battery → Battery usage', 'Try another socket and cable'],
    steps: ['Lower brightness and turn on Battery saver below 30%', 'Close apps with high battery usage', 'Use the original charger, plugged straight into the wall', 'Run "powercfg /batteryreport" to see battery health'],
    quick: ['Lower the brightness', 'Turn on Battery saver', 'Check the cable is fully in'],
  },
  {
    id: 'code',
    re: /\b(error|bug|crash|exception|undefined|null|npm|python|code|build|compile|deploy|vercel|react|api|500|404)\b/i,
    name: 'Code, app or build error',
    causes: ['A dependency version changed or is missing', 'An environment variable or API key is missing', 'The code expects data that is empty or undefined', 'A cached build is out of date'],
    checks: ['Read the first error line, not the last one', 'Check the .env values the app needs', 'Reproduce it with the smallest input', 'Compare with the last version that worked (git diff)'],
    steps: ['Copy the exact error message and the file:line', 'Reinstall dependencies (npm ci / pip install -r requirements.txt)', 'Add a log right before the failing line to see the real values', 'Fix one thing at a time and run the tests', 'Write a test for the bug so it never comes back'],
    quick: ['Restart the dev server', 'Clear the cache / delete the build folder', 'Search the exact error message'],
  },
  {
    id: 'study',
    re: /\b(study|exam|focus|concentrat|procrastinat|syllabus|marks|revision|distract|learn)\b/i,
    name: 'Study and focus',
    causes: ['The plan is too big, so starting feels hard', 'The phone and notifications break focus', 'Too little sleep or long sessions without breaks', 'Reading without testing yourself'],
    checks: ['How many hours did you really study yesterday?', 'How often did you pick up the phone?', 'Which topic do you avoid most?'],
    steps: ['Split the syllabus into 25-minute tasks', 'Study in Pomodoros: 25 minutes on, 5 off', 'Test yourself with practice cards (Azarvis Notes has them)', 'Do the hardest topic first in the morning', 'Review on day 1, 3 and 7 (spaced repetition)'],
    quick: ['Put the phone in another room', 'Start a 25-minute timer now', 'Write the 3 topics for today'],
  },
  {
    id: 'career',
    re: /\b(job|interview|resume|cv|career|internship|placement|hr|offer|salary|linkedin)\b/i,
    name: 'Job search and interviews',
    causes: ['The resume does not show results with numbers', 'Applying widely instead of to the right roles', 'Little interview practice out loud'],
    checks: ['Does every resume line show an impact (number, result)?', 'How many applications got a reply?', 'Have you done a mock interview this week?'],
    steps: ['Rewrite resume bullets as action + result + number', 'Pick 10 target companies and tailor each application', 'Practise answers out loud with the STAR method', 'Build one public project that matches the role', 'Follow up politely after 5-7 days'],
    quick: ['Fix the top 3 resume bullets', 'Do one mock interview today', 'Message one person at a target company'],
  },
  {
    id: 'stress',
    re: /\b(stress|anxious|anxiety|tired|sleep|burnout|overwhelm|sad|lonely|motivation|demotivated)\b/i,
    name: 'Stress, sleep and energy',
    causes: ['Too many open tasks at once', 'Irregular sleep and late screens', 'No time for movement or people'],
    checks: ['How many hours did you sleep the last 3 nights?', 'What is the one task that worries you most?', 'When did you last take a real break?'],
    steps: ['Write everything down, then pick only 3 for today', 'Same sleep and wake time for a week', 'A 20-minute walk every day', 'Talk to someone you trust', 'If it lasts for weeks or feels heavy, talk to a doctor or counsellor'],
    quick: ['Take 5 slow breaths', 'Drink water and step outside', 'Pick the single next small step'],
  },
];
const GENERIC = {
  id: 'general',
  name: 'General problem',
  causes: ['Something changed recently (an update, a new setting, a new habit)', 'Two things are mixed together and need to be separated', 'The real goal is not written down yet'],
  checks: ['What exactly happens, and when?', 'What changed just before it started?', 'Does it happen every time, or only sometimes?'],
  steps: ['Write the problem in one sentence', 'List what you know vs. what you guess', 'Change one thing at a time and watch the result', 'Set a time to review progress', 'Ask an expert if it is still stuck after 2 tries'],
  quick: ['Write the problem down', 'Undo the most recent change', 'Take a short break and come back fresh'],
};

/** The best-matching kind of problem (by keywords) and how sure the match is. */
export function classifyProblem(text) {
  const scores = KB.map((k) => ({ k, n: (text.match(new RegExp(k.re.source, 'gi')) || []).length })).sort((a, b) => b.n - a.n);
  const best = scores[0];
  if (!best || !best.n) return { topic: GENERIC, confidence: 0.3 };
  const total = scores.reduce((s, x) => s + x.n, 0);
  return { topic: best.k, confidence: Math.round((0.45 + 0.55 * (best.n / total)) * 100) / 100 };
}

export function urgency(text) {
  if (/\b(urgent|asap|right now|immediately|deadline today|exam tomorrow|interview tomorrow|can'?t work|not working at all|lost|emergency)\b/i.test(text)) return 'High';
  if (/\b(soon|this week|tomorrow|every day|worse|again)\b/i.test(text)) return 'Medium';
  return 'Normal';
}

export function runSolver(id, map) {
  const all = Object.values(map).filter(Boolean).join('. ');
  const { topic, confidence } = classifyProblem(all);
  const tried = (map.tried || '').toLowerCase();
  const fresh = (list) => list.filter((s) => !tried || !keywords(s, 2).some((w) => tried.includes(w)));
  switch (id) {
    case 'listener':
      return {
        title: 'What you said',
        text: `Problem: ${cap(trimEnd(map.problem || all))}.\n${map.since ? `Since: ${cap(trimEnd(map.since))}.\n` : ''}${map.tried ? `Already tried: ${cap(trimEnd(map.tried))}.\n` : ''}${map.goal ? `Goal: ${cap(trimEnd(map.goal))}.\n` : ''}\nType: ${topic.name} (${Math.round(confidence * 100)}% match)\nUrgency: ${urgency(all)}`,
        topic: topic.name,
      };
    case 'diagnoser':
      return { title: 'Likely causes', text: topic.causes.map((c, i) => `${i + 1}. ${c}`).join('\n') };
    case 'researcher':
      return { title: 'Quick checks', text: topic.checks.map((c) => `• ${c}`).join('\n') };
    case 'planner':
      return { title: 'Step-by-step plan', text: fresh(topic.steps).map((s, i) => `Step ${i + 1}. ${s}`).join('\n') };
    case 'fixer':
      return { title: 'Do this now', text: fresh(topic.quick).slice(0, 3).map((s) => `⚡ ${s}`).join('\n') || '⚡ Write the problem down and try step 1 of the plan' };
    case 'checker':
      return {
        title: 'Is it fixed?',
        text: `☐ ${map.goal ? cap(trimEnd(map.goal)) : 'The problem no longer happens'}\n☐ It stays fixed for 2 days\n☐ You know what caused it\n\nIf not fixed after the plan: ask an expert, and share these notes with them.`,
        reminders: [
          { text: `Try the fix plan: ${clip(topic.name.toLowerCase(), 40)}`, time: '' },
          { text: `Check if "${clip(trimEnd(map.problem || all), 40)}" is fixed`, time: '20:00' },
        ],
      };
    default:
      return { title: id, text: '' };
  }
}
