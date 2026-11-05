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
  name: "Jarvis AI Assistant",
  shortName: "Jarvis",
  url: siteUrl(),
  title: "Jarvis – AI Voice Assistant for Tasks, Reminders & Your PC",
  description:
    "Jarvis is a personal AI voice assistant powered by Claude: reminders, tasks, study notes, answers from your documents and hands-free control of your PC.",
  keywords: [
    "AI assistant",
    "AI voice assistant",
    "Jarvis AI",
    "personal assistant",
    "voice assistant for PC",
    "hands-free assistant",
    "task manager with reminders",
    "Claude AI",
    "chat with documents",
    "productivity app",
  ],
  author: "Aamir Hussain Azad",
  authorUrl: "https://aamir-hussain-azad.vercel.app/",
  authorProfiles: [
    "https://github.com/Aamiruem",
    "https://www.linkedin.com/in/aamir-hussain-azad-62623924b",
    "https://leetcode.com/u/Aamiruem/",
  ],
  locale: "en_IN",
  // Google Search Console > Settings > Ownership verification > HTML tag: the content="…" value.
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
} as const;

/** Public pages, for the sitemap. Everything under /dashboard is private (noindex). */
export const PUBLIC_ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/register", priority: 0.6, changeFrequency: "yearly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
] as const;
