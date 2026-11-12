import { api } from '../api.js';
import { PageHeader, toast } from '../ui.jsx';
import AgentStudio from './AgentStudio.jsx';

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

export default function StudioPanel({ onAsk }) {
  return (
    <div className="panel studio-panel">
      <PageHeader
        icon="workflow"
        hue={85}
        title="Agent Studio"
        subtitle="Talk or type once. A manager and a team of specialists write a week of content and design images, or diagnose a problem and plan the fix."
      />
      <AgentStudio onAsk={onAsk} onAddTask={addTask} />
    </div>
  );
}
