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

export const PROJECTS = [
  { label: 'Crop Yield Prediction', href: 'https://indian-crop-optimization-appuction-kqfhgqkn6wfg6qeb44efik.streamlit.app/', live: true },
  { label: 'Retail Sales Analytics', href: 'https://retail-sales-customer-fdug7zphhdjmvfoonctdkw.streamlit.app/', live: true },
  { label: 'Mansik Santulan', href: 'https://mansik-santulan-scores-1.onrender.com', live: true },
  { label: 'EstateIQ Price Predictor', href: 'https://github.com/Aamiruem/Real-Estate-Price-Predictor' },
  { label: 'Arvixa Marketplace', href: 'https://github.com/Aamiruem/Shopping-Cart' },
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

// Live apps shown first in the Projects section (platform = where it is hosted). Repositories
// whose GitHub "homepage" points at a live site are added to these automatically.
export const LIVE_APPS = [
  { label: 'Azarvis Voice App', href: 'https://azarvis-app.vercel.app/', platform: 'vercel', text: 'This assistant: voice, chat, tasks, notes and automations.', repo: 'Aamir-Jarvis-Assistant' },
  { label: 'Azarvis Dashboard', href: 'https://azarvis-ai.vercel.app/', platform: 'vercel', text: 'Next.js dashboard and landing page for Azarvis.', repo: 'Aamir-Jarvis-Assistant' },
  { label: 'Portfolio', href: PORTFOLIO_URL, platform: 'vercel', text: 'Aamir Hussain Azad: AI/ML engineer and full-stack developer.', repo: 'Aamir_Portfolio' },
  { label: 'Crop Yield Prediction', href: PROJECTS[0].href, platform: 'streamlit', text: 'Indian crop optimization and yield prediction for farmers, with ML.', repo: 'Indian-Crop-Optimization-Production' },
  { label: 'Retail Sales Analytics', href: PROJECTS[1].href, platform: 'streamlit', text: 'Retail sales and customer analytics dashboard.', repo: 'Retail-sales-customer' },
  { label: 'Mansik Santulan', href: PROJECTS[2].href, platform: 'render', text: 'Machine-learning scores for mental balance (mansik santulan).', repo: 'Mansik-Santulan-Scores' },
];
