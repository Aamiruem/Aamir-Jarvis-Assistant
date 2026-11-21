// Spoken or typed robot commands → actions for the 3D Robot Lab (engine.js).
// Pure functions (no DOM, no three.js), so they are unit-tested.
//
// Activities (what the robot works on, it walks to the right place by itself):
//   coding · reading · teaching · speaking · research · thinking · dance · idle
// Actions: start · stop · walk · run · sit · stand · rotate-left · rotate-right · spin · look · wave
//          auto · reset

export const ACTIVITIES = {
  coding: { label: 'Coding', icon: 'code', station: 'desk', sit: true, say: 'Writing and debugging code.' },
  reading: { label: 'Reading', icon: 'book', station: 'desk', sit: true, say: 'Reading the research paper.' },
  teaching: { label: 'Teaching', icon: 'sparkles', station: 'board', say: 'Let me explain how a neural network learns.' },
  speaking: { label: 'Speaking', icon: 'mic', station: 'center', say: "Hello! I'm Azarvis. Ask me anything, in any language." },
  research: { label: 'Research', icon: 'search', station: 'desk', sit: true, say: 'Scanning sources and comparing the results.' },
  thinking: { label: 'Thinking', icon: 'brain', station: 'center', say: 'Thinking it through, step by step.' },
  dance: { label: 'Dance', icon: 'heart', station: 'center', say: 'A little celebration!' },
  idle: { label: 'Idle', icon: 'user', station: null, say: '' },
};

/** The order Auto mode works through. */
export const AUTO_ORDER = ['coding', 'teaching', 'reading', 'speaking', 'research', 'thinking', 'dance'];

const RULES = [
  [/\b(stop|pause|freeze|halt)\b/, { type: 'stop' }],
  [/\b(reset|home position|go home|start over)\b/, { type: 'reset' }],
  [/\b(auto(matic)?( mode)?|on your own|by yourself|surprise me)\b/, { type: 'auto' }],
  [/\b(run|jog|sprint)\b/, { type: 'run' }],
  [/\b(walk|patrol|move around|stroll)\b/, { type: 'walk' }],
  [/\b(sit( down)?|take a seat)\b/, { type: 'sit' }],
  [/\b(stand( up)?|get up|rise)\b/, { type: 'stand' }],
  [/\b(spin|rotate (all the way|360|around)|turn around|360)\b/, { type: 'spin' }],
  [/\b(rotate|turn) left\b/, { type: 'rotate', dir: 1 }],
  [/\b(rotate|turn) right\b/, { type: 'rotate', dir: -1 }],
  [/\b(look around|look about|scan the room|look left and right)\b/, { type: 'look' }],
  [/\b(wave|say hi|greet|hello there)\b/, { type: 'wave' }],
  [/\b(dance|gesture|celebrate|party)\b/, { type: 'activity', activity: 'dance' }],
  [/\b(cod(e|ing)|program(ming)?|debug|develop)\b/, { type: 'activity', activity: 'coding' }],
  [/\b(read(ing)?|book|paper|document)\b/, { type: 'activity', activity: 'reading' }],
  [/\b(teach(ing)?|explain|lesson|class)\b/, { type: 'activity', activity: 'teaching' }],
  [/\b(research|study|studying|analy[sz]e|watch(ing)?|monitor)\b/, { type: 'activity', activity: 'research' }],
  [/\b(think(ing)?|solve|ponder)\b/, { type: 'activity', activity: 'thinking' }],
  [/\b(speak(ing)?|talk(ing)?|conversation)\b/, { type: 'activity', activity: 'speaking' }],
  // after the activities, so "start coding" means coding
  [/\b(start|resume|continue|go on)\b/, { type: 'start' }],
];

/**
 * A command for the robot in plain words ("robot, sit down", "start coding", "turn left"), or null
 * when the text is a question for the assistant instead. Only short phrases count as commands, so
 * "how do I read a CSV file in pandas?" is answered, not obeyed.
 */
export function parseCommand(text) {
  const t = (text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const words = t.replace(/^(hey |ok |okay )?(robot|azarvis|jarvis)\b ?/, '').split(' ');
  if (words.length > 6 || /^(what|how|why|who|when|where|which|can you tell|tell me|explain what|is|are|do|does)\b/.test(words.join(' ')) && words.length > 3) return null;
  const s = words.join(' ');
  for (const [re, action] of RULES) if (re.test(s)) return { ...action };
  return null;
}

/** What the robot says back when it obeys a command. */
export function confirmation(action) {
  switch (action.type) {
    case 'stop': return 'Pausing. I will keep an eye on things.';
    case 'start': return 'Back to work.';
    case 'reset': return 'Returning to my home position.';
    case 'auto': return 'Auto mode on. I will work through my tasks.';
    case 'walk': return 'Walking.';
    case 'run': return 'Running!';
    case 'sit': return 'Taking a seat.';
    case 'stand': return 'Standing up.';
    case 'spin': return 'Full rotation.';
    case 'rotate': return action.dir > 0 ? 'Turning left.' : 'Turning right.';
    case 'look': return 'Looking around.';
    case 'wave': return 'Hello!';
    case 'activity': return ACTIVITIES[action.activity]?.say || 'On it.';
    default: return '';
  }
}
