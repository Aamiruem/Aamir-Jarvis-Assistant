import { useEffect, useRef, useState } from 'react';
import { track } from '../analytics.js';
import { fmtTime, readDemoTasks, saveDemoTask, speak } from '../brain.js';
import { Icon } from '../icons.jsx';
import { LIVE_APPS } from '../siteLinks.js';

// Automation workflows: what Azarvis does, step by step, for one sentence you say. Each card
// can run a real demo version right here, without an account: steps light up in order, tasks
// are saved in this browser (the demo's Tasks), and the result is read aloud.

const app = (label) => LIVE_APPS.find((a) => a.label === label)?.href;
const inMinutes = (m) => {
  const d = new Date(Date.now() + m * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const nowText = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
// Whatever the user said, greet them for the actual time of day.
const greeting = () => {
  const h = new Date().getHours();
  return h < 5 ? 'Still up? Hello!' : h < 12 ? 'Good morning!' : h < 17 ? 'Good afternoon!' : 'Good evening!';
};

const WORKFLOWS = [
  {
    id: 'morning',
    icon: 'sun',
    hue: 38,
    title: 'Morning briefing',
    say: '“Good morning, Azarvis”',
    who: 'Start every day knowing what matters',
    steps: [
      ['mic', 'Hears the wake phrase'],
      ['clock', 'Checks the time and the weather'],
      ['tasks', 'Reads today’s reminders'],
      ['target', 'Picks your top priority'],
      ['volume', 'Speaks a 20-second briefing'],
    ],
    run() {
      const open = readDemoTasks().filter((t) => !t.done);
      const first = open.find((t) => t.time) || open[0];
      const lines = [
        `${greeting()} It’s ${nowText()}.`,
        open.length ? `You have ${open.length} thing${open.length > 1 ? 's' : ''} on your list.` : 'Your list is clear today.',
        ...open.slice(0, 3).map((t) => `• ${t.text}${t.time ? ` at ${fmtTime(t.time)}` : ''}`),
        first ? `Top priority: ${first.text}.` : 'A good day to start something new.',
      ];
      return { lines, actions: [{ label: 'Open my tasks', demo: 'tasks' }] };
    },
  },
  {
    id: 'study',
    icon: 'notes',
    hue: 48,
    title: 'Study session',
    say: '“Start a 45-minute ML study session”',
    who: 'Students preparing for exams and interviews',
    steps: [
      ['brain', 'Understands the goal and the time'],
      ['alarm', 'Sets a break reminder in 45 minutes'],
      ['book', 'Opens your next unread chapter'],
      ['check', 'Quizzes you with practice cards'],
    ],
    run() {
      const time = inMinutes(45);
      saveDemoTask({ text: 'Study break: stretch, then review the practice cards', time });
      return {
        lines: [`Your session has started. I’ll remind you to take a break at ${fmtTime(time)}.`, 'Opening the AI/ML notes: 86 chapters, with practice cards at the end of each one.'],
        actions: [{ label: 'Open the notes', demo: 'notes' }, { label: 'See the reminder', demo: 'tasks' }],
      };
    },
  },
  {
    id: 'interview',
    icon: 'target',
    hue: 160,
    title: 'Interview prep',
    say: '“I have an interview at 4 pm, help me prepare”',
    who: 'Job seekers, with Aamir’s Presence AI coach',
    steps: [
      ['heart', 'Senses if you sound stressed and calms the tone'],
      ['alarm', 'Reminds you 15 minutes before'],
      ['chat', 'Lists the questions you’ll likely get'],
      ['target', 'Opens the Presence AI interview coach'],
    ],
    run() {
      saveDemoTask({ text: 'Interview at 4 pm: join 5 minutes early', time: '15:45' });
      return {
        lines: [
          'You’ve got this. Reminder set for 3:45 PM.',
          'Likely questions: • Tell me about yourself • Your hardest project and what you learned • Why this role?',
          'Practise them out loud with the Presence AI interview coach: it gives feedback on your speech and focus.',
        ],
        actions: [{ label: 'Open Presence AI', href: app('Presence AI') }, { label: 'See the reminder', demo: 'tasks' }],
      };
    },
  },
  {
    id: 'email',
    icon: 'mail',
    hue: 0,
    title: 'Email follow-up',
    say: '“Draft a follow-up email to the recruiter”',
    who: 'Professionals who write a lot of email',
    steps: [
      ['contacts', 'Finds the recruiter in your contacts'],
      ['edit', 'Writes a polite, specific draft'],
      ['mail', 'Opens it in Gmail, ready to send'],
      ['shield', 'You read it and press send yourself'],
    ],
    run() {
      return {
        lines: [
          'Draft ready:',
          '“Hi Priya, thank you for the conversation on Monday. I’m very interested in the role and happy to share anything else you need. Looking forward to the next steps. Best, Aamir”',
          'Azarvis never sends anything on its own.',
        ],
        actions: [{ label: 'Write more drafts', demo: 'automate' }],
      };
    },
  },
  {
    id: 'house',
    icon: 'house',
    hue: 205,
    title: 'Home search',
    say: '“What’s a fair price for a 3BHK in Gurgaon?”',
    who: 'Home buyers, with Aamir’s Gratia Estates',
    steps: [
      ['brain', 'Understands the city and the size'],
      ['flask', 'Estimates with the house-price ML model'],
      ['house', 'Opens Gratia Estates to compare projects'],
      ['alarm', 'Saves a site-visit reminder'],
    ],
    run() {
      saveDemoTask({ text: 'Site visit: shortlist 3 projects on Gratia Estates', time: '11:00' });
      return {
        lines: [
          'In your account, Azarvis estimates the price with its own trained house-price model (ML Lab).',
          'Compare new-launch and ready-to-move projects in Gurgaon on Gratia Estates. Site-visit reminder saved for 11:00 AM.',
        ],
        actions: [{ label: 'Open Gratia Estates', href: app('Gratia Estates') }, { label: 'See the reminder', demo: 'tasks' }],
      };
    },
  },
  {
    id: 'focus',
    icon: 'zap',
    hue: 280,
    title: 'Focus mode',
    say: '“I keep getting distracted, help me focus”',
    who: 'Anyone with deep work to finish',
    steps: [
      ['heart', 'Notices the frustration and answers calmly'],
      ['alarm', 'Starts a 25-minute focus block'],
      ['monitor', 'On your PC: mutes sound, opens the right app'],
      ['target', 'Tracks distraction with Presence AI'],
    ],
    run() {
      const time = inMinutes(25);
      saveDemoTask({ text: 'Focus block done: take a 5-minute break', time });
      return {
        lines: [`Focus block started. I’ll tell you when it ends at ${fmtTime(time)}.`, 'Presence AI can watch for distraction while you work (it runs in your browser).'],
        actions: [{ label: 'Open Presence AI', href: app('Presence AI') }, { label: 'See the timer', demo: 'tasks' }],
      };
    },
  },
];

function Workflow({ flow, onNavigate }) {
  const [step, setStep] = useState(-1); // -1 idle, 0..n-1 running, n done
  const [result, setResult] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearInterval(timer.current), []);
  const running = step >= 0 && step < flow.steps.length;

  const run = () => {
    clearInterval(timer.current);
    setResult(null);
    setStep(0);
    track('workflow_run', { workflow: flow.id });
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= flow.steps.length) {
        clearInterval(timer.current);
        const out = flow.run();
        setResult(out);
        speak(out.lines.join(' ').replace(/•/g, ', '));
      }
    }, 650);
  };

  return (
    <li className={`flow ${running ? 'flow--running' : ''}`} style={{ '--hue': flow.hue }}>
      <div className="flow-head">
        <span className="feature-icon"><Icon name={flow.icon} size="1.25em" /></span>
        <div className="grow">
          <h3>{flow.title}</h3>
          <p className="flow-who">{flow.who}</p>
        </div>
      </div>
      <p className="flow-say"><Icon name="mic" size="0.95em" /> {flow.say}</p>
      <ol className="flow-steps">
        {flow.steps.map(([icon, label], i) => (
          <li key={label} className={step > i ? 'done' : step === i ? 'active' : ''}>
            <span className="flow-step-icon"><Icon name={step > i ? 'check' : icon} size="0.95em" /></span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
      {result && (
        <div className="flow-result" role="status">
          {result.lines.map((l) => <p key={l}>{l}</p>)}
          <div className="flow-actions">
            {result.actions.map((a) =>
              a.href ? (
                <a key={a.label} className="btn sm" href={a.href} target="_blank" rel="noopener noreferrer">{a.label} <Icon name="external" size="0.85em" /></a>
              ) : (
                <button key={a.label} type="button" className="btn sm" onClick={() => onNavigate('demo', a.demo)}>{a.label}</button>
              ),
            )}
          </div>
        </div>
      )}
      <button type="button" className="btn primary flow-run" onClick={run} disabled={running}>
        <Icon name={running ? 'refresh' : 'play'} size="1em" /> {running ? 'Running…' : result ? 'Run again' : 'Run it now'}
      </button>
    </li>
  );
}

export default function Workflows({ onNavigate }) {
  return (
    <>
      <ul className="flows">
        {WORKFLOWS.map((f) => <Workflow key={f.id} flow={f} onNavigate={onNavigate} />)}
      </ul>
      <p className="flows-note">
        <Icon name="shield" size="0.95em" /> Runs here are a demo: reminders are saved in this browser and the result is read aloud. With an account, Azarvis does each step for real, with your tasks, contacts, documents and computer.
      </p>
    </>
  );
}
