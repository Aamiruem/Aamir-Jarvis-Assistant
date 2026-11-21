// TEMPORARY harness for the signed-in Robot Lab check (deleted afterwards): signed-in app, APIs stubbed.
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api, auth } from './api.js';
import App from './App.jsx';
for (const k of Object.keys(api)) if (typeof api[k] === 'function') api[k] = async () => [];
for (const k of Object.keys(auth)) if (typeof auth[k] === 'function') auth[k] = async () => [];
auth.restore = async () => ({ id: 'u1', name: 'Aamir Hussain', email: 'owner@example.com', role: 'admin', emailVerified: true, phoneVerified: false, preferences: {} });
api.health = async () => ({ server: 'up', ai: 'up', claude: 'ok' });
api.myStats = async () => ({ total_messages: 12, by_intent: {}, recent: [] });
api.commandCenter = async () => { throw new Error('stubbed'); };
// /api/chat answers like the real AI stream
const realFetch = window.fetch.bind(window);
window.fetch = (url, opts) => {
  if (String(url).includes('/api/chat')) {
    const body = 'data: {"type":"text","text":"18% GST on 24,999 is 4,499.82, "}\n\ndata: {"type":"text","text":"so the total is 29,498.82."}\n\ndata: {"type":"done"}\n\n';
    return Promise.resolve(new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } }));
  }
  if (String(url).includes('/api/')) return Promise.resolve(new Response('', { status: 200 }));
  return realFetch(url, opts);
};
createRoot(document.getElementById('root')).render(<App />);
