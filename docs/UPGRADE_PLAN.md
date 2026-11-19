# Azarvis / Jarvis Next-Gen upgrade: assessment and checklist

The living plan for the "Master Prompt 2.0" upgrade. It upgrades the existing app and never
replaces it. A box is ticked only after the feature has run and its tests pass.
Last updated: 2026-11-19 (Phase 1 done).

## 1. What exists today (inspected 2026-11-19)

| Layer | What is there | State |
|---|---|---|
| Gateway | `backend/express-api`: Express 5 + MongoDB. JWT + refresh-token rotation with theft detection, email/SMS codes, lockout, passkeys, roles, admin, audit/activity log, helmet, CORS, rate limits (Redis-ready store via `scale/`), conversations, WhatsApp webhook relay, proxy `/api/ai/*` → FastAPI | Solid |
| AI service | `backend/fastapi-ai`: FastAPI + SQLAlchemy (SQLite, or Postgres via `DATABASE_URL`). Hand-written streaming Claude agent with ~30 tools, web search/fetch, RAG (per-user index, local or Voyage embeddings), NLP intent + emotion models, vision, ML Lab, PC control (allowlisted actions only), PC watcher, reminders scheduler, WhatsApp brain, neural TTS, Command Center API | Solid; single LLM provider |
| Web app | `frontend`: React 18 + Vite. Chat (SSE), hands-free voice (wake word, barge-in, echo filter, 39 languages), Command Center HUD, Tasks, Memory, Notes, ML Lab, Agent Studio, Vision, Device, Contacts, Admin, PWA | Solid |
| Second client | `dashboard`: Next.js 16 + TypeScript (charts, chat, tasks, maps) + Playwright e2e | Exists |
| Other | MCP server, Streamlit admin, CLI, Docker Compose (Mongo + Postgres), GitHub Actions CI, AWS guide | Exists |
| Tests | 166 Python, 62 Node, 183 frontend, plus dashboard Vitest/Playwright | Passing |

### Weaknesses found
- **Security (fixed in Phase 1):** the public default `INTERNAL_API_KEY` was accepted from any
  network address, and Docker published the AI service, Streamlit admin and an unauthenticated
  MongoDB on every interface. There was no prompt-injection isolation, so web pages, documents,
  the clipboard and the screen reached the model as plain tool output. Memory would store
  passwords and keys. The SSRF filter missed CGNAT, IPv4-mapped and benchmark ranges.
- **Brain:** Claude only, with no fallback provider or router. When the Claude key fails, nothing answers.
- **Agents:** one agent with many tools. No orchestrator, no per-agent permissions or limits, and no approval queue.
- **Automation:** no Playwright browser agent and no click/type desktop control (by design so far).
- **Integrations:** no Gmail or Google Calendar OAuth (emails open as drafts only).
- **Backend:** no Alembic migrations (`create_all`), no Redis in the AI service, no WebSocket push, no Prometheus metrics.
- **Environment:** Windows Smart App Control on the dev PC intermittently blocks compiled
  Python files (scikit-learn, `_reachability`). The tests in `test_security_phase1.py` and
  `test_command_center.py` avoid that path.

## 2. Phase checklist

### Phase 1: Security and backend architecture ✅ (2026-11-19)
- [x] Public default internal key accepted only from this computer (`app/security.py`); the gateway refuses to start in production with the default key and a remote AI service (`express-api/src/config.js`)
- [x] Docker: MongoDB, Postgres, AI service and Streamlit admin bound to `127.0.0.1`
- [x] SSRF: "Add a web page" fetches only globally routable addresses (also checked on every redirect)
- [x] Prompt-injection isolation: untrusted tool output wrapped as data with a notice; injection signals detected (English + Hinglish); after detection, high-impact tools are paused for the rest of that request (human re-confirms in a new message); web search/fetch results scanned too; a notice appears in the chat (`app/agent/safety.py`)
- [x] System prompt rule: retrieved content can never override instructions
- [x] Secrets (passwords, PINs, OTPs, API keys, JWTs, card numbers, private keys) refused as memories at the database layer, covering the agent, the Memory screen, MCP and the CLI
- [x] Tests: `tests/test_security_phase1.py` (37 checks); full suites green

### Phase 2: AI brain and model routing (next)
- [ ] Provider interface: Anthropic (current) + any OpenAI-compatible API (OpenAI, Ollama, Groq, OpenRouter, Gemini's OpenAI endpoint)
- [ ] Router: fallback when Claude is down or out of credits; "private" mode → local Ollama; per-request latency/token/cost log
- [ ] Model performance panel on the Command Center
- [ ] Conversation summarization for long chats (context compression)

### Phase 3: Agent orchestration
- [ ] Agent registry (role, allowed tools, permissions, timeout, step limit) built on the existing tool groups
- [ ] Approval queue for high-impact actions (persisted, shown in the Command Center), replacing "ask again"
- [ ] Execution history per agent run

### Phase 4: Real-time voice
- [ ] Microphone selection, push-to-talk key, voice history playback
- [ ] Server speech-to-text option (Whisper via Groq/OpenAI-compatible) as a fallback to the browser

### Phase 5: Multimodal
- [ ] DOCX / Excel / CSV ingestion into RAG; OCR for images; audio transcription upload

### Phase 6: RAG and memory
- [ ] Hybrid search (keyword + vector) with reranking and citations
- [ ] Memory categories, provenance, expiry, export

### Phase 7: Browser and computer automation
- [ ] Playwright browser agent (isolated profile, allowlisted sites, confirmation before submit/send/buy)
- [ ] Emergency stop and action log

### Phase 8: Coding and data science
- [ ] Sandboxed code execution with time and memory limits; diff preview + rollback for file edits

### Phase 9: Productivity integrations
- [ ] Google OAuth (Gmail read/summarize, Calendar), least-privilege scopes, send only after approval

### Phase 10: Dashboard
- [x] Command Center (live data)
- [ ] Security Center (audit log, sessions, safety events, approvals)

### Public website, SEO and Google (Master Prompt 3, 2026-11-19) ✅ first pass
- [x] 12 static, crawlable content pages (`frontend/seo/pages.js` → `/features` … `/privacy`, `/terms`) with unique titles, descriptions, canonical, Open Graph, `WebPage`/`AboutPage`/`ContactPage` + `BreadcrumbList` JSON-LD; linked from the site footer; `cleanUrls` on Vercel
- [x] Sitemap lists home, demo and every content page; sign-in pages left out and `noindex`
- [x] GA4 behind a consent notice (nothing loads before "Accept"; "Decline" clears `_ga` cookies); `sign_up` / `login` events added; no private data in any event
- [x] Search Console (Domain DNS + HTML tag) and GA4 (key events, DebugView) guide in `docs/SEO.md`
- [ ] Choose one canonical public site (azarvis-app vs azarvis-ai both self-canonical today), owner's decision
- [ ] Owner: Search Console verification code, GA4 Measurement ID, then redeploy
- [ ] Prerender the home page itself (today: the splash and JS render; content pages are static)

### Google Cloud deployment ✅ prepared (not deployed)
- [x] AI service Dockerfile: `$PORT` for Cloud Run, non-root user (no `--proxy-headers`, which would let a forged `X-Forwarded-For` pass the loopback check)
- [x] Cloud Storage via the S3-compatible API (`S3_ENDPOINT_URL`); account deletion removes files one by one (GCS has no batch delete); tested
- [x] `infra/gcp/deploy.sh` (Cloud Build → Artifact Registry → Cloud Run, Secret Manager, Cloud SQL, bucket mount, smoke test) + `docs/GOOGLE_CLOUD.md`
- [ ] Owner: create the project/resources (billed) and run the script; Docker and gcloud are not installed on the dev PC, so images were not built here

### Phase 11: Monitoring and deployment
- [ ] Alembic baseline migration; `/metrics` (Prometheus format); backup/restore script

## 3. Needs outside accounts or paid services
| Feature | Needs |
|---|---|
| Claude brain | `ANTHROPIC_API_KEY` (paid) |
| Fallback models | `OPENAI_API_KEY` (paid) or Groq (free tier) or Ollama (free, local) |
| Gmail / Calendar | Google Cloud OAuth client (free; app verification for wide use) |
| WhatsApp | Meta WhatsApp Cloud API (free tier) |
| Real email/SMS codes | SMTP (Gmail app password) or AWS SES/SNS |

## 4. How to run
```bash
npm run dev                 # gateway + AI service + web app (Windows-friendly)
cd backend/fastapi-ai && .venv\Scripts\python -m pytest -q
cd backend/express-api && npm test
cd frontend && npx vitest run
```
Docker: set your own `INTERNAL_API_KEY` in `.env` first (the default only works on one PC), then `docker compose up --build`.
