# AZARVIS - a full-stack AI assistant you build to learn

Built by **[Aamir Hussain Azad](https://aamir-hussain-azad.vercel.app/)** (AI/ML Engineer & Full-Stack Developer) · [GitHub](https://github.com/Aamiruem) · [LinkedIn](https://www.linkedin.com/in/aamir-hussain-azad-62623924b)

One project that touches the whole modern stack: **React + Node/Express + MongoDB (MERN)**,
**Python FastAPI**, **SQL**, **Streamlit**, **AWS**, and the AI layer, **LLMs, agents,
RAG, MCP, NLP, classic ML, deep learning and computer vision**.

```
frontend/ (React)                backend/
  voice · webcam      ┌──────────────────────────────────┐
  ──────────────────► │ express-api/   Node + Express    │──► MongoDB (users, sessions, OTPs,
                      │ banking-style auth + OTP (OOP)   │     audit log, conversations)
                      │ chat history · API gateway       │──► AWS SES / SNS (OTP email/SMS)
                      └───────────────┬──────────────────┘
                                      │ X-Internal-Key + X-User-Id
  streamlit-admin/ ──┐                ▼
  jarvis.py (CLI) ───┼──► ┌──────────────────────────────────┐
  mcp-server/ ───────┘    │ fastapi-ai/    Python + FastAPI  │──► Claude API (LLM, agent)
  (Claude Desktop/Code)   │ agent · RAG · NLP/ML · CV        │──► SQLite / PostgreSQL
                          │ tasks · memory · reminders       │──► AWS S3 (files)
                          └──────────────────────────────────┘
```

**Backend overview, OOP design and auth flows:** [backend/README.md](backend/README.md)

| Folder | Tech | What it does |
|---|---|---|
| [backend/express-api/](backend/express-api/) | Node, Express 5, Mongoose, JWT, AWS SDK | Banking-style auth (OTP, lockout, sessions), chat history, gateway |
| [backend/fastapi-ai/](backend/fastapi-ai/) | FastAPI, Anthropic SDK, scikit-learn, OpenCV, SQLAlchemy, boto3 | The brain: streaming agent, RAG, NLP, CV, tasks |
| [frontend/](frontend/) | React 18, Vite, Web Speech API | Chat UI, voice in/out, webcam vision, docs, tasks |
| [dashboard/](dashboard/) | Next.js 16, TypeScript, Tailwind, shadcn/ui, Redux Toolkit, Zustand, GraphQL, Recharts/Chart.js/D3, Leaflet, Vitest, Playwright | Second web client (port 3001): overview charts, streaming chat, tasks, memories, weather map |
| [backend/mcp-server/](backend/mcp-server/) | MCP (FastMCP) | Exposes Azarvis tools to Claude Desktop / Claude Code |
| [backend/streamlit-admin/](backend/streamlit-admin/) | Streamlit, pandas | Admin: analytics, RAG testing, NLP playground |
| [backend/fastapi-ai/ml/](backend/fastapi-ai/ml/) | scikit-learn, PyTorch | Training scripts for the intent models |
| [infra/aws/](infra/aws/) | EC2, ECS, RDS, S3, ECR | Deployment guide |
| [jarvis.py](jarvis.py) | Python stdlib | Terminal client |

**Learning path:** see [docs/LEARNING_ROADMAP.md](docs/LEARNING_ROADMAP.md).
**Voice commands, "Hey Azarvis", Room Watch and Windows/Linux/macOS control:** see [docs/VOICE_AND_PC_CONTROL.md](docs/VOICE_AND_PC_CONTROL.md).
**Every endpoint:** see [docs/API.md](docs/API.md).
**SEO and Google Search Console:** see [docs/SEO.md](docs/SEO.md).
**ML Lab (AutoML, house price prediction, train on your CSV):** see [docs/ML_LAB.md](docs/ML_LAB.md).

### Backend features

| Feature | Where |
|---|---|
| Banking-style auth: email OTP verification, 2-step login (email/SMS OTP), lockout, refresh-token rotation with theft detection, device list, security activity, OTP password reset | [backend/express-api/src/auth/](backend/express-api/src/auth/) |
| Roles: `user` / `admin` (`ADMIN_EMAILS`), admin overview & role management | [backend/express-api/src/routes/admin.js](backend/express-api/src/routes/admin.js) |
| Chat history in MongoDB: list, search, rename, delete | [backend/express-api/src/routes/conversations.js](backend/express-api/src/routes/conversations.js) |
| Streaming agent chat (SSE) with 10 tools | [backend/fastapi-ai/app/agent/](backend/fastapi-ai/app/agent/) |
| **Per-user data isolation** for tasks, documents, memories, notifications, stats | every query filters on `user_id` |
| Long-term memory (Azarvis remembers facts about you) | `remember`/`forget` tools, `/memories` |
| Tasks with timed reminders + background scheduler + notifications | [backend/fastapi-ai/app/scheduler.py](backend/fastapi-ai/app/scheduler.py) |
| RAG over your PDFs/notes (per-user index), classic vs agentic | [backend/fastapi-ai/app/rag/](backend/fastapi-ai/app/rag/) |
| ML Lab: EDA, 7 algorithms with cross-validation, tuning, held-out testing, feature importance, PCA/K-means, model registry + experiment log; house price prediction (XGBoost, test R² 0.86) | [backend/fastapi-ai/app/mllab/](backend/fastapi-ai/app/mllab/), [docs/ML_LAB.md](docs/ML_LAB.md) |
| NLP + ML intent model, computer vision | [backend/fastapi-ai/app/nlp/](backend/fastapi-ai/app/nlp/), [cv/](backend/fastapi-ai/app/cv/) |
| Account deletion that erases data across MongoDB, SQL, vector store and S3 | `DELETE /api/auth/me` |
| Request logging with request ids, graceful shutdown, JSON 404s | `app/main.py`, `backend/express-api/src/app.js` |
| Tests: 63 Python, 39 Node, 38 frontend (voice, session start, alerts), 19 dashboard + 14 Playwright, CI on every push | [backend/fastapi-ai/tests/](backend/fastapi-ai/tests/), [backend/express-api/test/](backend/express-api/test/), [frontend/src/](frontend/src/) `*.test.js(x)`, [.github/workflows/ci.yml](.github/workflows/ci.yml) |

---

## Quick start (local, no Docker)

You need Python 3.11+, Node 20+, and MongoDB (local install or a free MongoDB Atlas cluster).

```bash
cp .env.example .env        # then set ANTHROPIC_API_KEY, JWT_SECRET, OTP_SECRET, ADMIN_EMAILS=<your email>
```

**1. AI service: FastAPI** (terminal 1)
```bash
cd backend/fastapi-ai
python -m venv .venv
.venv\Scripts\activate             # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
pytest -q                          # 63 tests, no API key needed
uvicorn app.main:app --reload --port 8000
```
Open http://localhost:8000/docs for the interactive API.

**2. API + auth: Express** (terminal 2)
```bash
cd backend/express-api
npm install
npm test                           # 39 tests, no MongoDB needed
npm run dev                        # http://localhost:4000 - OTP codes are printed here
```

**3. Frontend** (terminal 3)
```bash
cd frontend
npm install
npm test                           # 38 tests: voice timing, echo, interruptions, session start, alerts
npm run dev                        # http://localhost:5173: register, enter the OTP, then "Start talking"
```

**4. Optional extras**
```bash
pip install -r backend/streamlit-admin/requirements.txt && streamlit run backend/streamlit-admin/app.py
pip install -r backend/mcp-server/requirements.txt && claude mcp add jarvis -- python "%CD%\backend\mcp-server\server.py"
python jarvis.py                   # terminal chat
```

## Quick start (Docker)

```bash
cp .env.example .env               # add ANTHROPIC_API_KEY
docker compose up --build
```
UI → http://localhost:3000 · Admin → http://localhost:8501 · API docs → http://localhost:8000/docs
(Docker runs MongoDB **and** PostgreSQL for you.) Sign-up and sign-in codes appear in
`docker compose logs -f express-api` until you set `OTP_PROVIDER=aws`.

## Windows note: Smart App Control

If Windows blocks a file with *"An Application Control policy has blocked this file"*, that's
**Smart App Control** refusing freshly downloaded native binaries. On this machine it blocked
`jiter` (needed by the `anthropic` package). The frontend avoids the same problem by using
Rollup's WebAssembly build (`overrides` in `frontend/package.json`). Workarounds for the Python
side: run the stack with **Docker** or inside **WSL** (Linux isn't affected).

## Things to try once it runs

- "Remind me to stretch in 2 minutes", then wait for the 🔔.
- "Remember that I'm vegetarian", then in a new chat: "suggest a dinner recipe".
- "Remind me to renew my passport next Friday", then "what's on my list?"
- Upload a PDF in **Knowledge**, then ask about it in **Chat** (agentic RAG).
- "What's 18% GST on 74,999 and the weather in Jaipur?" (parallel tool calls).
- **Vision** tab → start camera → "What's on my desk?"
- Click **Start talking** when Azarvis opens: the first time it asks a few questions and remembers you.
- **Notes**: your *AIML Basics to Advanced* and *AIML 244 Lecture* notes (read, search and practice as flashcards); **Teach Azarvis these notes** lets Azarvis answer from them. Import another ChatGPT share with `python scripts/import_notes.py <link>`.- **Notes → CampusX**: all 244 lectures of the CampusX Data Science Mentorship Program 2022-23 in order and by section, with the video, chapter timestamps, code links, your own notes per lecture, and **Make notes with Azarvis** (complete notes with the master prompt in `backend/fastapi-ai/app/study_notes.py`). Re-import or add a playlist with `python scripts/import_youtube_course.py <playlist link> <slug>` (needs `pip install yt-dlp`).
- **Knowledge → Add a web page** (e.g. your portfolio) and Azarvis answers from it; Azarvis also searches the web and reads links you give it.
- **Install app** (sidebar or More on a phone) puts Azarvis on your desktop or home screen; **Share** sends Azarvis or any reply through the phone's share sheet. Past chats are under **History** in Chat.
- **Automate → Azarvis watches this PC**: Azarvis tells you about low battery, a full disk, finished downloads, USB drives and internet drops.
- Open **ML Lab**: try the house price model, or upload a CSV and pick a column to predict.
- Open **Automate** for one-click automations (plan my day, social media plan, customer replies) and your apps.
- On your phone: start with `npm run dev:phone`, then open the link it prints (same Wi-Fi). Away from home, use Tailscale; Automate shows the steps.
- Click 🎙 and talk; tick 🔊 to hear replies. In **Voice mode**, talk over Azarvis to interrupt it.
- Watch the Streamlit **Overview** fill with intents, latency and token counts.
