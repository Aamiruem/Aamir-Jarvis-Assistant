import { api } from '../api.js';
import { PageHeader, toast } from '../ui.jsx';
import AgentStudio from './AgentStudio.jsx';
import { openTab, reach } from '../artActions.js';

// The signed-in app's "Agent Studio" tab: the same studio, with reminders saved to your real
// task list and a "Deeper answer with Claude" button that opens the AI chat.

function addTask({ text, time }) {
  let remindAt = null;
  if (time) {
    const [h, m] = time.split(':').map(Number);
    const at = new Date();
    at.setHours(h, m, 0, 0);
    if (at < new Date()) at.setDate(at.getDate() + 1);
    remindAt = at.toISOString();
  }
  api.addTask(text, null, remindAt).catch(() => toast('Could not save the reminder. Is the AI service running?', 'error'));
}

// Spots on the page picture (agents, chat, status, activity, builder, templates): each runs that feature.
const SPOTS = [
  { x: 31, y: 30, label: 'Agent team', hint: 'Run several agents at once', run: () => openTab('agents') },
  { x: 54, y: 30, label: 'AI chat', hint: 'Open a chat', run: () => openTab('chat') },
  { x: 70, y: 22, label: 'System status', hint: 'This device, live', run: () => openTab('device') },
  { x: 71, y: 46, label: 'Activity', hint: 'Live activity in the Command Center', run: () => openTab('command') },
  { x: 37, y: 68, label: 'Solve a problem', hint: 'Diagnose it and plan the fix', run: () => reach('.as-seg button', { click: true, text: 'Solve a problem' }) },
  { x: 68, y: 72, label: 'Create content', hint: 'A week of posts and 9 images', run: () => reach('.as-seg button', { click: true, text: 'Create content' }) },
];

export default function StudioPanel({ onAsk }) {
  return (
    <div className="panel studio-panel">
      <PageHeader
        icon="workflow"
        hue={85}
        title="Agent Studio"
        art="/art/workflows.webp" spots={SPOTS}
        artAlt="A workflow of connected AI agents and tools shown as a hologram"
        subtitle="Talk or type once. A manager and a team of specialists write a week of content and design images, or diagnose a problem and plan the fix."
      />
      <AgentStudio onAsk={onAsk} onAddTask={addTask} />
    </div>
  );
}
