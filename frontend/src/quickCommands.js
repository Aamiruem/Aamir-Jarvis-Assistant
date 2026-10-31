// Simple "open X" / "play X on YouTube" commands, handled instantly in the browser:
// no AI call, so they work in a split second (and even when Claude is unreachable).
// Anything more complex ("open YouTube and remind me…") still goes to Jarvis, who has an open_website tool.

const SITES = {
  youtube: ['YouTube', 'https://www.youtube.com'],
  google: ['Google', 'https://www.google.com'],
  gmail: ['Gmail', 'https://mail.google.com'],
  mail: ['Gmail', 'https://mail.google.com'],
  whatsapp: ['WhatsApp Web', 'https://web.whatsapp.com'],
  instagram: ['Instagram', 'https://www.instagram.com'],
  facebook: ['Facebook', 'https://www.facebook.com'],
  twitter: ['X (Twitter)', 'https://x.com'],
  x: ['X (Twitter)', 'https://x.com'],
  linkedin: ['LinkedIn', 'https://www.linkedin.com'],
  github: ['GitHub', 'https://github.com'],
  maps: ['Google Maps', 'https://maps.google.com'],
  'google maps': ['Google Maps', 'https://maps.google.com'],
  calendar: ['Google Calendar', 'https://calendar.google.com'],
  drive: ['Google Drive', 'https://drive.google.com'],
  netflix: ['Netflix', 'https://www.netflix.com'],
  spotify: ['Spotify', 'https://open.spotify.com'],
  amazon: ['Amazon', 'https://www.amazon.in'],
  flipkart: ['Flipkart', 'https://www.flipkart.com'],
  wikipedia: ['Wikipedia', 'https://www.wikipedia.org'],
  chatgpt: ['ChatGPT', 'https://chatgpt.com'],
  claude: ['Claude', 'https://claude.ai'],
};

const SEARCH = {
  youtube: ['YouTube', (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`],
  google: ['Google', (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`],
  amazon: ['Amazon', (q) => `https://www.amazon.in/s?k=${encodeURIComponent(q)}`],
  spotify: ['Spotify', (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`],
  maps: ['Google Maps', (q) => `https://www.google.com/maps/search/${encodeURIComponent(q)}`],
};

// Apps and folders the AI service can open on Windows, Linux or macOS (same names as
// backend/fastapi-ai/app/system_control.py; a name the computer's OS lacks gets a friendly error).
const APPS = [
  'notepad', 'calculator', 'paint', 'file explorer', 'explorer', 'task manager', 'command prompt', 'terminal',
  'powershell', 'control panel', 'settings', 'wifi settings', 'bluetooth settings', 'display settings',
  'sound settings', 'camera', 'clock', 'alarms', 'photos', 'microsoft store', 'snipping tool', 'edge', 'chrome',
  'vs code', 'visual studio code', 'word', 'excel', 'powerpoint', 'spotify',
  'firefox', 'safari', 'finder', 'files', 'text editor', 'notes', 'activity monitor', 'system monitor',
];
const FOLDERS = ['downloads', 'documents', 'desktop', 'pictures', 'music', 'videos'];
const SYSTEM_PHRASES = [
  [/^(?:volume up|increase (?:the )?volume|turn (?:the )?volume up|turn it up|louder)$/i, 'volume_up', 'Volume up.'],
  [/^(?:volume down|decrease (?:the )?volume|lower (?:the )?volume|turn (?:the )?volume down|turn it down|quieter)$/i, 'volume_down', 'Volume down.'],
  [/^(?:mute|unmute|mute (?:the )?(?:sound|volume|audio))$/i, 'mute', 'Toggled mute.'],
  [/^(?:pause|play|resume|play pause|pause (?:the )?(?:music|song|video)|resume (?:the )?(?:music|song|video))$/i, 'play_pause', 'Done.'],
  [/^(?:next|next (?:song|track|video)|skip(?: (?:song|track))?)$/i, 'next_track', 'Next track.'],
  [/^(?:previous|previous (?:song|track|video)|go back a (?:song|track))$/i, 'previous_track', 'Previous track.'],
  [/^lock (?:the |my )?(?:computer|pc|laptop|screen|system)$/i, 'lock', 'Locking the PC.'],
  [/^(?:take (?:a )?)?screenshot$|^(?:take|capture) (?:a )?(?:screen ?shot|screen capture)(?: of (?:the |my )?screen)?$/i, 'screenshot', 'Screenshot taken.'],
  // Must work instantly, even when the AI is slow: the safety net for a scheduled shutdown/restart.
  [/^(?:cancel|stop|abort|don't|do not) (?:the )?(?:shut ?down|restart|reboot)$/i, 'cancel_shutdown', 'Cancelled. The computer stays on.'],
  [/^(?:sleep|put) (?:the |my )?(?:computer|pc|laptop|system)(?: to sleep)?$/i, 'sleep', 'Going to sleep.'],
  // Shutdown and restart are left to the AI on purpose: it asks for confirmation first.
];
const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// Polite filler around a command: "hello Jarvis, please open the YouTube for me"
const FILLER = /^(?:(?:hello|hi|hey|ok|okay|yo)\b[\s,]*)?(?:jarvis\b[\s,]*)?(?:(?:please|can you|could you|will you|kindly)\s+)*/i;
const TAIL = /[\s,]*(?:please|for me|now|right now|jarvis|thanks|thank you)?[\s.!?]*$/i;

/**
 * Returns { label, url, say } for a website/search, { system: {action, target}, say } for a
 * Windows action, or null when Jarvis (Claude) should handle the request.
 */
export function quickCommand(text) {
  const t = text.trim().replace(FILLER, '').replace(TAIL, '').trim();

  const search = (site, query) => {
    const [label, make] = SEARCH[site.toLowerCase()];
    const q = query.replace(/^(?:the|a|some)\s+/i, '').trim();
    return { label: `${label}: ${q}`, url: make(q), say: `Searching ${label} for ${q}.` };
  };
  const SITE = '(youtube|google|amazon|spotify|maps)';
  const VERB = '(?:play|search(?: for)?|find|look up|look for|show me)';

  // "play lofi music on youtube", "search cheap flights on google", "find pizza on maps"
  let m = t.match(new RegExp(`^${VERB}\\s+(.+?)\\s+(?:on|in)\\s+(?:the\\s+)?${SITE}$`, 'i'));
  if (m) return search(m[2], m[1]);
  // "open the youtube and search campus videos", "open youtube then play arijit singh songs"
  m = t.match(new RegExp(`^(?:open|go to|launch)\\s+(?:the\\s+)?${SITE}\\s*(?:,|and|then|and then)?\\s+${VERB}\\s+(.+)$`, 'i'));
  if (m) return search(m[1], m[2].replace(/\s+(?:on|in)\s+(?:it|there|youtube|google)$/i, ''));
  // "youtube search lofi music", "search youtube for lofi music"
  m = t.match(new RegExp(`^(?:${SITE}\\s+${VERB}|search\\s+(?:on\\s+)?${SITE}\\s+for)\\s+(.+)$`, 'i'));
  if (m) return search(m[1] || m[2], m[3]);
  // "search the videos of campus x python", "show me videos about react hooks", "play arijit singh songs"
  m = t.match(/^(?:search|find|show me|look for|play)\s+(?:the\s+|some\s+)?(?:videos?|songs?|music)\s+(?:of|for|about|on|by)\s+(?:the\s+)?(.+)$/i)
    || t.match(/^(?:watch|play)\s+(.+)$/i);
  if (m) return search('youtube', m[1].replace(/\bcampus\s*x\b/i, 'CampusX'));
  // "search for best laptops under 50000", "google react hooks": everything else → Google
  m = t.match(/^(?:search(?: for)?|google|look up)\s+(.+)$/i);
  if (m && !/\b(?:my|documents?|files?|notes?|tasks?|reminders?|memory|memories)\b/i.test(m[1])) return search('google', m[1]);
  // "open youtube", "launch the gmail", "go to whatsapp"
  m = t.match(/^(?:open|launch|start|go to|show)\s+(?:the\s+|my\s+)?(.+?)(?:\s+(?:website|site|app|tab))?$/i);
  if (m) {
    const name = m[1].toLowerCase();
    const site = SITES[name.replace(/\.(com|in|org)$/, '')];
    if (site) return { label: site[0], url: site[1], say: `Opening ${site[0]}.` };
    if (APPS.includes(name)) return { system: { action: 'open_app', target: name }, say: `Opening ${titleCase(name)}.` };
    const folder = name.replace(/\s+folder$/, '');
    if (FOLDERS.includes(folder)) return { system: { action: 'open_folder', target: folder }, say: `Opening your ${folder} folder.` };
  }
  // "close notepad", "quit the calculator app"
  m = t.match(/^(?:close|quit|exit|kill)\s+(?:the\s+|my\s+)?(.+?)(?:\s+app)?$/i);
  if (m && APPS.includes(m[1].toLowerCase())) {
    const name = m[1].toLowerCase();
    return { system: { action: 'close_app', target: name }, say: `Closing ${titleCase(name)}.` };
  }
  // volume, media keys, lock, screenshot, sleep, cancel shutdown
  for (const [re, action, say] of SYSTEM_PHRASES) {
    if (re.test(t)) return { system: { action }, say };
  }
  return null;
}

/** Opens a URL in a new tab. Returns false if the browser blocked the pop-up. */
export function openUrl(url) {
  const w = window.open(url, '_blank');
  if (!w) return false;
  w.opener = null;
  return true;
}
