// TEMPORARY QA harness — mounts HomePanel with fake props and seeded data so the new
// AI-insights strip and Explore showcase can be screenshotted without a backend.
import { createRoot } from 'react-dom/client';
import HomePanel from './components/HomePanel.jsx';
import { api } from './api.js';
import './styles.css';

const now = Date.now();
const iso = (mins) => new Date(now + mins * 60000).toISOString();
// Seed the client so insights have something real to say.
api.health = async () => ({ server: 'up', ai: 'up', storage: 'mongo', systemControl: true });
api.systemStatus = async () => ({ cpu: 41, ram: 88, disk: 63, disk_free_gb: 214, battery: 76, charging: true });
api.tasks = async () => [
  { id: 1, title: 'Reply to Priya about the demo', done: false, remind_at: iso(-90) },
  { id: 2, title: 'Pay electricity bill', done: false, remind_at: iso(120) },
  { id: 3, title: 'Gym at 6', done: false, remind_at: iso(300) },
  { id: 4, title: 'Finish portfolio section', done: true },
];
api.notifications = async () => [{ id: 1, title: 'Build finished', body: 'azarvis-app deployed', read: false }];
api.memories = async () => [
  { id: 1, fact: 'Lives in Mumbai' },
  { id: 2, fact: 'Prefers short, direct answers' },
  { id: 3, fact: 'Full-stack + AI/ML engineer' },
];
api.myStats = async () => ({ asks: 128 });

createRoot(document.getElementById('root')).render(
  <HomePanel
    user={{ name: 'Aamir Hussain Azad', role: 'admin' }}
    conversations={[{ _id: 'a', title: 'Plan a trip to Goa' }, { _id: 'b', title: 'Explain transformers' }]}
    onOpenTab={(t) => console.log('open tab', t)}
    onAsk={(p, s) => console.log('ask', { p, s })}
    onOpenConversation={(id) => console.log('open conv', id)}
    onStartSession={() => console.log('start session')}
  />,
);
