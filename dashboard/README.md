# Jarvis Dashboard (Next.js)

A second web client for Jarvis, built with the modern frontend stack: **Next.js 16 + React 19 +
TypeScript + Tailwind CSS 4 + shadcn/ui**. It talks to the same Express gateway as
[`frontend/`](../frontend/) (the original Vite + React app, which is unchanged).

Pages: landing · sign in / register with one-time codes · overview with charts · streaming chat ·
tasks · memories · weather map.

## Run it

```bash
cd dashboard
npm install
npm run dev            # http://localhost:3001  (or `npm run dev` in the project root to start everything)
```

The backend must be running for anything behind sign-in (`npm run dev` in the project root starts
it). The landing page, forms and weather map work without it.

| Script | What it does |
|---|---|
| `npm run dev` | dev server with hot reload (Turbopack) |
| `npm run build` / `npm start` | production build / serve it |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm run typecheck` | generate route types, then `tsc --noEmit` |
| `npm test` | Vitest + React Testing Library unit/component tests |
| `npm run test:e2e` | Playwright browser tests, desktop + mobile (`npx playwright install chromium` once, or `PW_CHANNEL=msedge` to use Edge) |
| `npm run check` | lint + typecheck + tests + build, what CI runs |

## Where each technology is used

| Category | Technology | Where |
|---|---|---|
| Structure | HTML5, semantic HTML, JSX | [`app/page.tsx`](src/app/page.tsx): `header`/`nav`/`main`/`section`/`article`/`footer`, labelled landmarks |
| Styling | CSS3, Tailwind CSS 4 | [`app/globals.css`](src/app/globals.css): design tokens as CSS variables, light + dark |
| | Sass | [`jarvis-orb.module.scss`](src/components/jarvis-orb.module.scss): modules, variables, mixins, `@for` loop |
| Language | TypeScript (strict) | everything; API shapes in [`types/api.ts`](src/types/api.ts) |
| Framework | Next.js App Router | route groups `(auth)`, nested layouts, metadata, `next/font`, `next/dynamic`, route handler, rewrites, Cache Components |
| UI library | shadcn/ui (Radix + CVA) | [`components/ui/`](src/components/ui/): copied-in components you own and edit |
| State | Context API | [`context/auth-context.tsx`](src/context/auth-context.tsx), [`theme-context.tsx`](src/context/theme-context.tsx) |
| | Redux Toolkit | [`store/tasks-slice.ts`](src/store/tasks-slice.ts): async thunks, optimistic toggle with rollback |
| | Zustand | [`store/memories-store.ts`](src/store/memories-store.ts): the same job with far less code |
| API | REST + Axios | [`lib/api-client.ts`](src/lib/api-client.ts): interceptors add the token, refresh on 401 and retry |
| | Fetch API | [`lib/sse.ts`](src/lib/sse.ts): streaming chat over Server-Sent Events; [`lib/weather.ts`](src/lib/weather.ts) |
| | GraphQL | [`app/api/graphql/route.ts`](src/app/api/graphql/route.ts) + [`lib/graphql/schema.ts`](src/lib/graphql/schema.ts): one query fans out to 4 REST calls |
| Forms | React Hook Form + Zod | sign-in, register, one-time code, memories ([`lib/validation.ts`](src/lib/validation.ts)) |
| | Yup | the task form |
| Animation | Framer Motion | sliding nav highlight, list enter/exit, chat bubbles |
| | GSAP | [`jarvis-orb.tsx`](src/components/jarvis-orb.tsx): rotating rings via `useGSAP`, respects reduced motion |
| | CSS scroll-driven animations (`animation-timeline: view()`) | landing page scroll reveals, no JavaScript |
| Charts | Recharts | intents bar chart |
| | Chart.js | sentiment doughnut (canvas) |
| | D3.js | response-time line with hover crosshair (D3 for math, React for DOM) |
| Maps | Leaflet | [`components/maps/weather-map.tsx`](src/components/maps/weather-map.tsx): click for weather (Open-Meteo) |
| Testing | Vitest + React Testing Library | `src/**/*.test.ts(x)`: 19 tests |
| | Playwright | [`e2e/`](e2e/): 7 scenarios × desktop + mobile, including SEO tags, robots.txt and sitemap |
| Tools | ESLint, npm, Git/GitHub Actions | `dashboard` job in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |

Chart colors are checked for color-vision deficiency, every chart has a "Show as table" view, and
nothing relies on color alone.

## How auth works here

Same rules as the original frontend: the access token lives only in memory, and the refresh token
is an httpOnly cookie. `next.config.ts` proxies `/api/*` to the Express gateway (`BACKEND_URL`), so
the cookie stays same-origin and no CORS setup is needed. The one exception is `/api/graphql`,
which this app serves itself.

## Deploy

Every host needs **`BACKEND_URL`** set to the public URL of `backend/express-api`, at build time
as well as runtime (see [`.env.example`](.env.example)).

| Host | How |
|---|---|
| **Vercel** | Import the repo, set Root Directory = `dashboard`, add `BACKEND_URL`. [`vercel.json`](vercel.json) pins the commands. |
| **Netlify** | Import the repo, Base directory = `dashboard`, add `BACKEND_URL`. [`netlify.toml`](netlify.toml) has the build settings. |
| **Cloudflare** | Uses the OpenNext adapter: `npx @opennextjs/cloudflare migrate`, then `npx @opennextjs/cloudflare deploy`. Set `BACKEND_URL` in Workers settings. |
| **AWS Amplify** | Connect the repo; [`amplify.yml`](amplify.yml) builds from `dashboard/`. |
| **AWS ECS / App Runner / EC2** | `docker build --build-arg BACKEND_URL=https://api.example.com -t jarvis-dashboard .`, push to ECR, run on port 3001. See [`infra/aws/`](../infra/aws/). |
| **Docker Compose** | `docker compose up --build` in the project root → <http://localhost:3001> |

## What's deliberately not here

The roadmap list also names **Angular, Vue.js, Nuxt.js** (other frameworks: each would be a separate
app, not part of this one), **Bootstrap, Material UI, Ant Design, Chakra UI** (alternatives to
Tailwind + shadcn/ui; mixing several styling systems in one app makes them fight over global
styles and bloats the bundle), and **Jest** (Vitest runs the same `describe`/`it`/`expect` tests
and is the standard pairing with Vite-era tooling). Each is a good next project on its own.
