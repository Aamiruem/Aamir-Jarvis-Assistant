// TEMPORARY audit harness (deleted after the light-theme check): signed-in app, every API stubbed.
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api, auth } from './api.js';
import App from './App.jsx';
for (const k of Object.keys(api)) if (typeof api[k] === 'function') api[k] = async () => [];
for (const k of Object.keys(auth)) if (typeof auth[k] === 'function') auth[k] = async () => [];
const user = { id: 'u1', name: 'Aamir Hussain', email: 'owner@example.com', role: 'admin', emailVerified: true, phoneVerified: false, preferences: {} };
auth.restore = async () => user;
api.health = async () => ({ server: 'up', ai: 'up', claude: 'ok' });
api.myStats = async () => ({ total_messages: 12, by_intent: {}, recent: [] });
api.commandCenter = async () => { throw new Error('stubbed'); };
api.securityPcCheck = async () => ({ supported: true, checks: [] });
const now = new Date().toISOString();
const reply = [
  '## Day 1',
  'Beaches in **North Goa**, *sunset* at Vagator. Use `python` to check:',
  '',
  '```python',
  'for day in range(3):',
  '    print(day)',
  '```',
  '',
  '| Day | Plan |',
  '|---|---|',
  '| 1 | Beaches |',
  '| 2 | Forts |',
  '',
  '> Tip: book early.',
  '',
  '- [x] Flights',
  '- [ ] Hotel',
  '',
  '[Goa tourism](https://goa-tourism.com)',
].join('\n');
api.conversations = async () => [{ _id: 'c1', id: 'c1', title: 'Plan my Goa trip', updatedAt: now, createdAt: now }, { _id: 'c2', id: 'c2', title: 'Explain gradient descent', updatedAt: now, createdAt: now }];
api.conversation = async () => ({ _id: 'c1', title: 'Plan my Goa trip', messages: [{ role: 'user', content: 'Plan a 3 day Goa trip and show me some code' }, { role: 'assistant', content: reply, tools: ['web_search'] }] });
api.tasks = async () => [{ id: 1, title: 'Call mom', due: 'today', remind_at: now, done: false, created_at: now }, { id: 2, title: 'Finish ML notes', due: null, remind_at: null, done: true, created_at: now }];
api.memories = async () => [{ id: 1, fact: 'Prefers metric units', created_at: now }, { id: 2, fact: 'Lives in Gurugram', created_at: now }];
api.contacts = async () => [{ id: 1, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 98xxxxxx', company: 'Acme', favorite: true }];
api.notifications = async () => [{ id: 1, title: 'Reminder: Call mom', body: 'It is 6 pm', read: false, created_at: now }];
api.userNotes = async () => [{ _id: 'n1', id: 'n1', title: 'My note', content: '# Heading\nSome **bold** text', category: 'General', updatedAt: now }];
api.documents = async () => [{ doc_id: 'd1', source: 'resume.pdf', chunks: 4 }];
createRoot(document.getElementById('root')).render(<App />);
