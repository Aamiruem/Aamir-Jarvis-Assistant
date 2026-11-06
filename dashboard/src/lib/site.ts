// One place for what search engines and link previews say about the site.
// NEXT_PUBLIC_SITE_URL must be the public address (https://jarvis.example.com) in production:
// canonical links, the sitemap and Open Graph images are built from it at BUILD time.
function siteUrl(raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  const fallback = "http://localhost:3001";
  if (!raw) return fallback; // unset or blank (Docker passes "" when .env leaves it empty)
  try {
    return new URL(raw).href.replace(/\/$/, "");
  } catch {
    console.warn(`NEXT_PUBLIC_SITE_URL is not a URL (${JSON.stringify(raw)}); using ${fallback}`);
    return fallback;
  }
}

export const SITE = {
  name: "Azarvis AI Assistant",
  shortName: "Azarvis",
  url: siteUrl(),
  // Other names people may search for; Google uses alternateName when it picks the site name.
  alternateNames: ["Azarvis AI", "Azarvis by Aamir Hussain Azad", "Jarvis by Aamir Hussain Azad"],
  title: "Azarvis – AI Voice Assistant by Aamir Hussain Azad",
  description:
    "Azarvis by Aamir Hussain Azad is a personal AI voice assistant powered by Claude: reminders, tasks, study notes, documents and hands-free control of your PC.",
  keywords: [
    "Azarvis",
    "Azarvis AI",
    "Aamir Hussain Azad",
    "Jarvis by Aamir Hussain Azad",
    "AI assistant",
    "AI voice assistant",
    "personal assistant",
    "voice assistant for PC",
    "hands-free assistant",
    "task manager with reminders",
    "Claude AI",
    "chat with documents",
    "productivity app",
  ],
  author: "Aamir Hussain Azad",
  authorJobTitle: "AI/ML Engineer & Full-Stack Developer",
  authorUrl: "https://aamir-hussain-azad.vercel.app/",
  authorProfiles: [
    "https://github.com/Aamiruem",
    "https://www.linkedin.com/in/aamir-hussain-azad-62623924b",
    "https://leetcode.com/u/Aamiruem/",
  ],
  locale: "en_IN",
  // Shown in the footer. Fixed on purpose: the pages are prerendered, and a clock call would fail the build.
  copyrightYear: 2026,
  // Google Search Console > Settings > Ownership verification > HTML tag: the content="…" value.
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  // Google Analytics 4 > Admin > Data streams > Web: the "G-…" measurement ID. Unset = no analytics.
  gaId: /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "") ? process.env.NEXT_PUBLIC_GA_ID!.trim() : "",
} as const;

/** The voice web app (a separate deployment from this dashboard). */
export const APP_URL = "https://azarvis-app.vercel.app/";
export const CONTACT_EMAIL = "aamirhussainazad786@gmail.com";

/**
 * Aamir's other projects, from the portfolio: the live demo when there is one, else the source.
 * The web app's footer has the same list in frontend/src/siteLinks.js.
 */
export const PROJECTS = [
  { label: "Crop Yield Prediction", href: "https://indian-crop-optimization-appuction-kqfhgqkn6wfg6qeb44efik.streamlit.app/", live: true },
  { label: "Retail Sales Analytics", href: "https://retail-sales-customer-fdug7zphhdjmvfoonctdkw.streamlit.app/", live: true },
  { label: "Mansik Santulan", href: "https://mansik-santulan-scores-1.onrender.com", live: true },
  { label: "EstateIQ Price Predictor", href: "https://github.com/Aamiruem/Real-Estate-Price-Predictor" },
  { label: "Arvixa Marketplace", href: "https://github.com/Aamiruem/Shopping-Cart" },
  { label: "RAG Chatbot", href: "https://aamir-hussain-azad.vercel.app/" },
  { label: "Email Spam Classifier", href: "https://github.com/Aamiruem/EmailChecker/tree/main" },
  { label: "Email Checker Pro", href: "https://github.com/Aamiruem/Professional-Email-Checker/tree/main" },
  { label: "Zoom Clone", href: "https://github.com/Aamiruem/ApnaCollegeZoomClone/tree/main" },
  { label: "Airbnb Clone", href: "https://github.com/Aamiruem/Airbnb-Clone-main/tree/master" },
  { label: "Zerodha Clone", href: "https://github.com/Aamiruem/Zerodha-Clone/tree/main" },
] as const;

/** Public pages, for the sitemap. Everything under /dashboard is private (noindex). */
export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/register", priority: 0.6, changeFrequency: "yearly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
] as const;
