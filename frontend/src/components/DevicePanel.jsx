import { PageHeader } from '../ui.jsx';
import DeviceCard from './DeviceCard.jsx';
import { askAzarvis, openSearch, openTab, startVoice } from '../artActions.js';

// The signed-in app's "Device" tab: live battery, charger, network, CPU, memory and disk.
// Spots on the page picture (calendar, projects, assistant, panels, keyboard, orb): each runs that feature.
const SPOTS = [
  { x: 21, y: 45, label: "Today's schedule", hint: 'Tasks and reminders in time order', run: () => askAzarvis("Summarize today's schedule from my tasks and reminders, in time order.", true) },
  { x: 34, y: 34, label: 'Projects', hint: 'Your tasks', run: () => openTab('tasks') },
  { x: 58, y: 42, label: 'Talk to Azarvis', hint: 'Start a voice conversation', run: () => startVoice() },
  { x: 76, y: 29, label: 'PC health check', hint: 'Azarvis checks this computer', run: () => askAzarvis('Check this PC’s health and tell me if anything needs attention.', true) },
  { x: 29, y: 73, label: 'Search', hint: 'Search everything', run: () => openSearch('') },
  { x: 77, y: 80, label: 'Command Center', hint: 'Everything live, in one place', run: () => openTab('command') },
];

export default function DevicePanel() {
  return (
    <div className="panel">
      <PageHeader
        icon="cpu"
        hue={205}
        title="Your device"
        art="/art/planner.webp" spots={SPOTS}
        artAlt="A desk computer with an AI assistant hologram beside calendar and project panels"
        subtitle="Live details about this computer or phone, with AI insights: battery forecast, connection quality and slowdowns."
      />
      <DeviceCard />
    </div>
  );
}
