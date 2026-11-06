// Links shown in the site footer: the Azarvis sites, Aamir's other projects (from the portfolio:
// the live demo when there is one, else the source) and where to find him.
// The dashboard has the same lists in dashboard/src/lib/site.ts.

export const PORTFOLIO_URL = 'https://aamir-hussain-azad.vercel.app/';
export const DASHBOARD_URL = 'https://azarvis-ai.vercel.app/';
export const CONTACT_EMAIL = 'aamirhussainazad786@gmail.com';

export const AZARVIS_LINKS = [
  { href: DASHBOARD_URL, label: 'Azarvis website' },
  { href: `${DASHBOARD_URL}dashboard`, label: 'Dashboard' },
  { href: `${DASHBOARD_URL}#features`, label: 'Features' },
  { href: `${DASHBOARD_URL}#faq`, label: 'FAQ' },
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

export const SOCIAL = [
  { href: PORTFOLIO_URL, label: 'Portfolio', icon: 'globe' },
  { href: 'https://github.com/Aamiruem', label: 'GitHub', icon: 'github' },
  { href: 'https://www.linkedin.com/in/aamir-hussain-azad-62623924b', label: 'LinkedIn', icon: 'linkedin' },
  { href: 'https://leetcode.com/u/Aamiruem/', label: 'LeetCode', icon: 'code' },
  { href: `mailto:${CONTACT_EMAIL}`, label: 'Email', icon: 'mail' },
];
