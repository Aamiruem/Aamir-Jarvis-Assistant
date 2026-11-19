// TEMPORARY preview harness (deleted right after the visual check).
import { createRoot } from 'react-dom/client';
import './styles.css';
import { api, auth } from './api.js';
import App from './App.jsx';
for (const k of Object.keys(api)) if (typeof api[k] === 'function') api[k] = async () => [];
for (const k of Object.keys(auth)) if (typeof auth[k] === 'function') auth[k] = async () => [];
auth.restore = async () => ({ id: 'u1', name: 'Aamir Hussain', email: 'owner@example.com', role: 'admin', emailVerified: true, preferences: {} });
api.health = async () => ({ server: 'up', ai: 'up', claude: 'ok' });
api.myStats = async () => ({ total_messages: 0, by_intent: {}, recent: [] });
createRoot(document.getElementById('root')).render(<App />);
