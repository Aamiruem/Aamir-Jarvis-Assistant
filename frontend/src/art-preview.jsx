// TEMPORARY harness for the picture-spot check (deleted afterwards): signed-in app, every API stubbed.
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
api.pcWatcher = async () => ({ enabled: false, checks: [] });
api.whatsappStatus = async () => ({});
api.whatsappServer = async () => ({});
api.network = async () => ({ lanAddresses: [] });
createRoot(document.getElementById('root')).render(<App />);
