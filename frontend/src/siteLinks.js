// Links shown in the site footer: the Azarvis sites, Aamir's other projects (from the portfolio:
// the live demo when there is one, else the source) and where to find him.
// The dashboard has the same lists in dashboard/src/lib/site.ts.

export const PORTFOLIO_URL = 'https://aamir-hussain-azad.vercel.app/';
export const DASHBOARD_URL = 'https://azarvis-ai.vercel.app/';
export const CONTACT_EMAIL = 'aamirhussainazad786@gmail.com';
export const REPO_URL = 'https://github.com/Aamiruem/Aamir-Jarvis-Assistant';

// Inside the app these open the tab; on the sign-in screen they go to the website's features.
export const PRODUCT_LINKS = [
  { tab: 'home', label: 'Voice assistant', icon: 'mic' },
  { tab: 'chat', label: 'Chat', icon: 'chat' },
  { tab: 'automate', label: 'Automate', icon: 'rocket' },
  { tab: 'notes', label: 'Notes & courses', icon: 'notes' },
  { tab: 'tasks', label: 'Tasks & reminders', icon: 'tasks' },
  { tab: 'knowledge', label: 'Knowledge base', icon: 'book' },
  { tab: 'mllab', label: 'ML Lab', icon: 'flask' },
  { tab: 'vision', label: 'Vision', icon: 'camera' },
];

// What the Automate tab writes for and opens (drafts you send yourself).
export const WORKS_WITH = [
  { tab: 'automate', label: 'Gmail', icon: 'mail' },
  { tab: 'automate', label: 'Google Drive', icon: 'drive' },
  { tab: 'automate', label: 'YouTube', icon: 'youtube' },
  { tab: 'automate', label: 'LinkedIn', icon: 'linkedin' },
  { tab: 'automate', label: 'Instagram', icon: 'instagram' },
  { href: 'https://www.anthropic.com/claude', label: 'Claude AI', icon: 'sparkles' },
];

export const RESOURCES = [
  { href: `${DASHBOARD_URL}dashboard`, label: 'Dashboard', icon: 'chart' },
  { href: `${DASHBOARD_URL}#how-it-works`, label: 'How it works', icon: 'timeline' },
  { href: `${DASHBOARD_URL}#faq`, label: 'FAQ', icon: 'help' },
  { href: REPO_URL, label: 'Source code', icon: 'github' },
  { href: `${REPO_URL}/tree/main/backend/mcp-server`, label: 'MCP server', icon: 'cpu' },
];

const CROP_URL = 'https://indian-crop-optimization-appuction-kqfhgqkn6wfg6qeb44efik.streamlit.app/';
const RETAIL_URL = 'https://retail-sales-customer-fdug7zphhdjmvfoonctdkw.streamlit.app/';
const MANSIK_URL = 'https://mansik-santulan-scores-1.onrender.com';
const ARVIXA_URL = 'https://arvixa-store.vercel.app/';
const PRESENCE_URL = 'https://real-time-conversession-and-distrac.vercel.app/xky-fqlf-bao';
const GRATIA_URL = 'https://gratia-estates.vercel.app/';

export const PROJECTS = [
  { label: 'Arvixa Store', href: ARVIXA_URL, live: true },
  { label: 'Presence AI', href: PRESENCE_URL, live: true },
  { label: 'Gratia Estates', href: GRATIA_URL, live: true },
  { label: 'Crop Yield Prediction', href: CROP_URL, live: true },
  { label: 'Retail Sales Analytics', href: RETAIL_URL, live: true },
  { label: 'Mansik Santulan', href: MANSIK_URL, live: true },
  { label: 'EstateIQ Price Predictor', href: 'https://github.com/Aamiruem/Real-Estate-Price-Predictor' },
  { label: 'RAG Chatbot', href: PORTFOLIO_URL },
  { label: 'Email Spam Classifier', href: 'https://github.com/Aamiruem/EmailChecker/tree/main' },
  { label: 'Email Checker Pro', href: 'https://github.com/Aamiruem/Professional-Email-Checker/tree/main' },
  { label: 'Zoom Clone', href: 'https://github.com/Aamiruem/ApnaCollegeZoomClone/tree/main' },
  { label: 'Airbnb Clone', href: 'https://github.com/Aamiruem/Airbnb-Clone-main/tree/master' },
  { label: 'Zerodha Clone', href: 'https://github.com/Aamiruem/Zerodha-Clone/tree/main' },
];

// brand: the hover color of each round button in the footer.
export const SOCIAL = [
  { href: PORTFOLIO_URL, label: 'Portfolio', icon: 'briefcase', brand: '#8b5cf6' },
  { href: 'https://github.com/Aamiruem', label: 'GitHub', icon: 'github', brand: '#6e7681' },
  { href: 'https://www.linkedin.com/in/aamir-hussain-azad-62623924b', label: 'LinkedIn', icon: 'linkedin', brand: '#0a66c2' },
  { href: 'https://leetcode.com/u/Aamiruem/', label: 'LeetCode', icon: 'code', brand: '#ffa116' },
  { href: `mailto:${CONTACT_EMAIL}`, label: 'Email', icon: 'mail', brand: '#ea4335' },
];

// GitHub account whose public repositories the website's Projects section loads live.
export const GITHUB_USER = 'Aamiruem';

// Repository homepages that are set on GitHub but don't load (checked 2026-11-11: both answer
// 404). They are left out of the live apps; remove an entry once its deployment works again.
export const HIDDEN_HOMEPAGES = ['cuvette-javascript-project.vercel.app', 'pocket-notes-main-o45a.vercel.app'];

// Live apps shown first in the Projects section (platform = where it is hosted). Repositories
// whose GitHub "homepage" points at a live site are added to these automatically.
// icon / hue: how the app's button looks on the website (Live projects strip, footer).
export const LIVE_APPS = [
  { label: 'Arvixa Store', short: 'Online shopping marketplace', href: ARVIXA_URL, platform: 'vercel', icon: 'cart', hue: 25, text: 'Online marketplace for India: mobiles, fashion, groceries and more, with cart and checkout.', repo: 'Shopping-Cart' },
  { label: 'Presence AI', short: 'AI focus tracker & interview coach', href: PRESENCE_URL, platform: 'vercel', icon: 'target', hue: 160, text: 'AI focus tracker and interview coach: live distraction detection, mock interviews and a speech coach.', repo: 'Real-Time-Conversession-and-Distraction-Face' },
  { label: 'Gratia Estates', short: 'Real estate & price prediction', href: GRATIA_URL, platform: 'vercel', icon: 'house', hue: 205, text: 'Real estate in Gurgaon: compare new-launch and ready-to-move projects, with price prediction.', repo: 'Gratia-Estates-Website' },
  { label: 'Azarvis Voice App', short: 'This voice assistant', href: 'https://azarvis-app.vercel.app/', platform: 'vercel', icon: 'mic', hue: 265, text: 'This assistant: voice, chat, tasks, notes and automations.', repo: 'Aamir-Jarvis-Assistant' },
  { label: 'Azarvis Dashboard', short: 'Next.js dashboard', href: 'https://azarvis-ai.vercel.app/', platform: 'vercel', icon: 'chart', hue: 230, text: 'Next.js dashboard and landing page for Azarvis.', repo: 'Aamir-Jarvis-Assistant' },
  { label: 'Portfolio', short: 'Aamir Hussain Azad', href: PORTFOLIO_URL, platform: 'vercel', icon: 'briefcase', hue: 280, text: 'Aamir Hussain Azad: AI/ML engineer and full-stack developer.', repo: 'Aamir_Portfolio' },
  { label: 'Crop Yield Prediction', href: CROP_URL, short: 'ML for Indian farmers', platform: 'streamlit', icon: 'flask', hue: 120, text: 'Indian crop optimization and yield prediction for farmers, with ML.', repo: 'Indian-Crop-Optimization-Production' },
  { label: 'Retail Sales Analytics', href: RETAIL_URL, short: 'Sales & customer analytics', platform: 'streamlit', icon: 'chart', hue: 0, text: 'Retail sales and customer analytics dashboard.', repo: 'Retail-sales-customer' },
  { label: 'Mansik Santulan', href: MANSIK_URL, short: 'Mental-balance ML scores', platform: 'render', icon: 'brain', hue: 330, text: 'Machine-learning scores for mental balance (mansik santulan).', repo: 'Mansik-Santulan-Scores' },
];
