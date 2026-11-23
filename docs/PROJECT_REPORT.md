# Project report: verified 2026-11-23

Every value below comes from a command run on 2026-11-23 (live HTTP checks, Vercel CLI, GitHub API,
git, npm audit, OSV, Bandit, the test suites). Live checks are repeatable from the **Project HQ** tab.
Not measured: Lighthouse/Core Web Vitals (PageSpeed quota exhausted, needs `PAGESPEED_API_KEY`),
Google Search Console / Analytics data (needs Google sign-in), physical iOS/Android devices.

## Inventory

| Where | Found |
|---|---|
| This PC (git repos) | Aamir-Jarvis-Assistant, Agricultural-Production-Optimization (**no git remote**), Gratia-Estates-Website, Real-Time-Conversession-and-Distraction-Face, projects/arvixa-store |
| Vercel (team aamir-hussain-azads-projects) | 18 projects |
| GitHub (Aamiruem) | 100 public repos (about 15 apps; the rest are course/practice repos) |
| Project HQ | 17 projects tracked and checked |

## Urgent

1. **Farm Service API is down**: `farm-service-gamma.vercel.app` answers HTTP 500 on every route.
   Root cause (Vercel runtime log): `ZodError: Set JWT_SECRET (>= 32 chars) in production` in
   `services/farm-service/src/config/env.js`; the variable isn't set in Vercel production.
   Fix: add a random 32+ character `JWT_SECRET` to the farm-service project, redeploy. *Needs your approval.*
2. **Every GitHub push makes a failed production deploy** of azarvis-app / azarvis-ai / azarvis-api
   (`npm ci` at the repo root finds no lockfile). The live sites keep the last CLI deploy, so pushes don't
   go live. Fix: in Vercel → each project → Settings → Root Directory: `frontend`, `dashboard`,
   `backend/express-api`. *Only you can change project settings.*
3. **Three dead deployments (404)**: cuvette-rock-paper-scissor-seven, pocket-notes-main-o45a,
   cuvette-javascript-project. Delete them in Vercel or redeploy. *Your decision.*

## Per project

| Project | Live URL | Repo | Stack | Status | HTTP · first byte | SEO | TLS days | CI | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Azarvis Voice App | azarvis-app.vercel.app | Aamir-Jarvis-Assistant | React · Vite | warning (84) | 200 · 713 ms | 94 | 67 | success | no CSP; content rendered by JS; live is behind the latest commit (see Urgent 2) |
| Azarvis Dashboard | azarvis-ai.vercel.app | Aamir-Jarvis-Assistant | Next.js · TS | warning (90) | 200 · 697 ms | 100 | 67 | success | no CSP; Next 16.4.3 has 4 moderate advisories (fix ready: 16.4.6) |
| Azarvis API | azarvis-api.vercel.app | Aamir-Jarvis-Assistant | Express · MongoDB | warning (88) | 200 · 584 ms | – | – | success | MongoDB up; reports AI service down (FastAPI not hosted) |
| Azarvis AI service | this PC :8001 | Aamir-Jarvis-Assistant | Python · FastAPI | healthy (100) | 200 · 779 ms | – | – | success | runs only on this PC |
| Portfolio | aamir-hussain-azad.vercel.app | Aamir_Portfolio | HTML | warning (90) | 200 · 362 ms | 96 | 67 | none | only site with GA4 + Search Console tag |
| Arvixa Store | arvixa-store.vercel.app | Shopping-Cart | React · Vite | warning (92) | 200 · 422 ms | 98 | 67 | success | 747-URL sitemap |
| Presence AI | real-time-conversession-and-distrac.vercel.app | Real-Time-Conversession-and-Distraction-Face | React · Vite | warning (72) | 200 · 124 ms | 78 | 67 | skipped | page is `noindex` |
| Gratia Estates | www.gratiaestates.com | Gratia-Real-Estate | React · Vite · Tailwind | warning (84) | 200 · 286 ms | 96 | 147 | success | custom domain |
| Gratia API | backend-neon-gamma-49.vercel.app | Gratia-Real-Estate | Python · FastAPI | healthy (100) | 200 · 558 ms | – | – | success | database ok |
| AgriSmart | agrismart-two-iota.vercel.app | Agricultural-Production-Optimization | React | warning (84) | 200 · 338 ms | 90 | 67 | skipped | local repo has no git remote |
| Farm Service API | farm-service-gamma.vercel.app | Agricultural-Production-Optimization | Node | **critical** | **500** | – | – | skipped | Urgent 1 |
| Crop Yield Prediction | Streamlit | Indian-Crop-Optimization-Production | Python · Streamlit | warning (50) | 200 · 2232 ms | 62 | 47 | success | slow first byte, no title, no HTTPS redirect: Streamlit-controlled |
| Retail Sales Analytics | Streamlit | Retail-sales-customer | Python · Streamlit | warning (50) | 200 · 2355 ms | 62 | 47 | success | same as above |
| Mansik Santulan | mansik-santulan-scores-1.onrender.com | Mansik-Santulan-Scores | Python (Render) | warning (78) | 200 · 426 ms | 82 | 86 | none | no meta description, no sitemap |
| Pocket Notes | pocket-notes-main-peach.vercel.app | pocket-notes-main | JavaScript | warning (68) | 200 · 417 ms | 78 | 67 | none | 2 other copies: one 404, one duplicate |
| Stone Paper Scissor | cuvette-javascript-projects.vercel.app | Cuvette-Javascript-Projects | HTML/JS | warning (72) | 200 · 362 ms | 82 | 67 | none | |
| FastAPI starter | fastapi-chi-one.vercel.app | – | FastAPI template | warning (72) | 200 · 588 ms | 82 | 67 | – | untouched Vercel template: delete or use |

Common to every site: **no Content-Security-Policy header.** Google Analytics is only on the portfolio.

## Security (this repository)

| Check | Result |
|---|---|
| npm audit (production deps) | frontend: 4 low (katex chain) · express-api: **0** (was 1 high, nodemailer 6.10.1, 22 advisories → fixed, 10.4.0) · dashboard: 1 moderate (Next 16.4.3; 16.4.6 fixes it) |
| OSV.dev (1168 packages) | the nodemailer finding above; fixed |
| Committed secrets | 0 in git (14 local `.env`-style values, not committed) |
| Bandit (Python) | 2 high "weak SHA1": both were cache keys → marked `usedforsecurity=False` (identical output); 6 medium remain |

## Fixed and verified today

- nodemailer 6.10.1 → 10.4.0 (release ≥ 2 weeks old): express tests 65/65, test send works, audit 0 vulnerabilities.
- SHA1 cache keys marked non-security: 24 related tests pass, output identical.
- Gratia in Project HQ now points at the real domain and repo; 6 discovered deployments added.
- Frontend `node_modules` repaired after an interrupted `npm ci` deleted 239 of 267 packages: 0 missing, 33/33 test files, 311/311 tests, build OK.
- C: drive was 100% full: freed 4.4 GB (npm + pip caches, Claude's own temp files) with your approval.
- Dashboard `next` reinstalled after the full disk truncated 107 of its files: `next --version` works, dashboard back to HTTP 200, matches the official package.

## Still open (needs you)

1. Farm Service `JWT_SECRET` + redeploy (approve and I'll do it).
2. Vercel Root Directory for the 3 Azarvis projects.
3. Next.js 16.4.6 for the dashboard: stop `npm run dev` first (its dev server locks the compiler file), then I install and run lint, typecheck, tests and build.
4. Deploy today's work (Bookings redesign, AI-offline card, nodemailer fix): approve and I'll deploy frontend and API.
5. Free more disk space: 4.2 GB free of 221 GB is still very low.
6. Keys for deeper checks: `PAGESPEED_API_KEY` (Lighthouse/Web Vitals), Google sign-in (Search Console/GA4), `GITHUB_TOKEN` (private repos, more API calls).
7. Agricultural-Production-Optimization: add its GitHub remote (`git remote add origin …`) so the local work is backed up.
