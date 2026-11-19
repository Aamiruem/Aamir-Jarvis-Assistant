# SEO, Google Search Console and Google Analytics 4

## What is public and what is private

| URL | Indexed? | How |
|---|---|---|
| `/` (home), `/?page=demo` | Yes | In the sitemap; the app sets the title, description and canonical per page |
| `/features`, `/voice-assistant`, `/ai-agents`, `/ai-ml`, `/knowledge-base`, `/automation`, `/technology`, `/docs`, `/about`, `/contact`, `/privacy`, `/terms` | Yes | **Static HTML** built from [`frontend/seo/pages.js`](../frontend/seo/pages.js) by [`seo/render.js`](../frontend/seo/render.js): full text without JavaScript, one `h1`, unique title and description, canonical link, Open Graph, `WebPage`/`AboutPage`/`ContactPage` + `BreadcrumbList` structured data |
| `/?page=login`, `/?page=signup` | No | Not in the sitemap; `noindex` set by `PublicSite.jsx` |
| The signed-in app | No | It exists only after sign-in; Google never signs in |
| `/api/*` | No | `Disallow` in `robots.txt`, and every private route needs a signed-in token (robots.txt is not access control: authentication is) |
| `azarvis-ai.vercel.app/dashboard/*` | No | `noindex` + `Disallow` |

Edit a page's text in `seo/pages.js` (keep the title ≤ 65 characters and the description 50–160).
`npm test` checks every page: unique titles, one `h1`, valid JSON-LD, canonical links, no broken
internal links, and the sitemap. On Vercel, `cleanUrls` serves `features.html` at `/features`.

## ⚠ Two sites compete today

`azarvis-app.vercel.app` (this frontend) and `azarvis-ai.vercel.app` (the Next.js dashboard) both
show the same title and both declare themselves canonical, so Google has to choose between
them. Pick **one** public home (ideally your own domain), then either point the other one's
canonical links at it or `noindex` its landing page. The content pages above live on the frontend site.

## 1. Set the public address (at build time)

| Where | Variable | Example |
|---|---|---|
| `frontend/.env` or Vercel project settings | `VITE_SITE_URL` | `https://azarvis-app.vercel.app` or `https://www.yourdomain.com` |
| `dashboard/.env.local` or Vercel settings | `NEXT_PUBLIC_SITE_URL` | |

No trailing slash. On Vercel the frontend falls back to the project's production address. Rebuild after changing it.

## 2. Google Search Console

**Option A: Domain property (best, covers every subdomain and http/https).** Needs your own domain.
1. <https://search.google.com/search-console> → **Add property → Domain** → enter `yourdomain.com`.
2. Copy the `google-site-verification=…` TXT record and add it at your domain's DNS provider
   (Cloud DNS, GoDaddy, Namecheap…): type **TXT**, host `@`.
3. Wait for DNS (minutes to hours), then click **Verify**.

**Option B: URL-prefix property with the HTML tag** (works for `*.vercel.app`).
1. **Add property → URL prefix** → `https://azarvis-app.vercel.app/`.
2. Choose **HTML tag**, copy only the `content` value.
3. Set it as `VITE_GOOGLE_SITE_VERIFICATION` in the Vercel project (and `GOOGLE_SITE_VERIFICATION`
   for the dashboard), redeploy; the tag is added to the app **and** every content page. Click **Verify**.

**After verification:**
- **Sitemaps** → submit `sitemap.xml`.
- **URL inspection** → the home page and `/features` → **Request indexing**. Check that the
  "Google-selected canonical" matches the "User-declared canonical".
- **Pages** (indexing report): watch for "Duplicate, Google chose different canonical" (the two-site problem) and "Crawled – currently not indexed".
- **Core Web Vitals** and **HTTPS** reports fill in once there is enough traffic (field data); until then use PageSpeed Insights.

Nothing here is verified or indexed until Search Console says so.

## 3. Google Analytics 4

1. <https://analytics.google.com> → **Admin → Create → Property** → add a **Web** data stream for your address.
2. Copy the **Measurement ID** (`G-XXXXXXX`) into `VITE_GA_ID` (frontend) and `NEXT_PUBLIC_GA_ID` (dashboard); redeploy.
3. **Consent:** Analytics loads only after the visitor clicks **Accept** in the small notice
   (saved per browser; "Analytics settings" in the footer reopens it; "Decline" removes `_ga` cookies).
   Google signals and ad personalization are off.
4. **Events sent** (never messages, prompts, voice, files or personal details):

| Event | When | Parameters |
|---|---|---|
| `page_view` | each page of the website | title, address |
| `demo_open` | the demo opens | section |
| `sign_up_start` | sign-up page opened | |
| `sign_up` | account created | `method: email` |
| `login` | signed in | `method: email` |
| `hero_command` | a command tried on the home page | how (voice/text), the kind of answer |
| `workflow_run`, `project_open`, `feedback_sent` | those buttons | workflow id, project name, feedback category and rating |

5. **Key events (conversions):** Admin → Events → mark `sign_up` and `demo_open` as key events.
6. **Test with DebugView:** install the "Google Analytics Debugger" Chrome extension and turn it on,
   open the site, click **Accept**, then Admin → **DebugView** shows the events live.

## 4. Check it
- `https://your-site/robots.txt` and `https://your-site/sitemap.xml` show your real address.
- [Rich Results Test](https://search.google.com/test/rich-results) on `/features` finds the breadcrumbs.
- [PageSpeed Insights](https://pagespeed.web.dev/) on `/features` (static, ~4 KB gzipped, no JavaScript) and `/`.
- Share a link in WhatsApp or LinkedIn to see the preview card.
