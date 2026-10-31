# Jarvis backend

Four separate services. Each has its own language, dependencies, Dockerfile and tests.

```
backend/
├── express-api/      Node.js + Express + MongoDB     auth (OTP, sessions), users, chat history, API gateway
├── fastapi-ai/       Python + FastAPI + SQL + AWS S3  AI: LLM agent, RAG, NLP/ML, CV, tasks, memory
├── streamlit-admin/  Python + Streamlit               admin dashboard (talks to fastapi-ai)
└── mcp-server/       Python + MCP                     exposes Jarvis tools to Claude Desktop / Claude Code
```

```
React ──► express-api :4000 ──(X-Internal-Key, X-User-Id)──► fastapi-ai :8000 ──► Claude API
             │                                                   │
          MongoDB                                         SQLite / PostgreSQL, S3
  users, sessions, OTPs,                               tasks, memories, notifications,
  audit log, conversations                             chat analytics, documents
             │
   AWS SES (email OTP) / SNS (SMS OTP)
```

| Service | Run locally | Tests |
|---|---|---|
| express-api | `cd backend/express-api && npm install && npm run dev` | `npm test` (25, no MongoDB needed) |
| fastapi-ai | `cd backend/fastapi-ai && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload` | `pytest -q` (17) |
| streamlit-admin | `pip install -r backend/streamlit-admin/requirements.txt && streamlit run backend/streamlit-admin/app.py` | |
| mcp-server | `pip install -r backend/mcp-server/requirements.txt && python backend/mcp-server/server.py` | |

All services read the shared `.env` in the project root.

---

## Banking-style authentication (express-api)

### What it does

| Protection | How |
|---|---|
| Strong passwords | 12+ chars, upper, lower, digit, symbol, not common, not your name/email (`PasswordPolicy`) |
| Email verification | Account can't sign in until a 6-digit email OTP is confirmed |
| 2-step login | Password, then a one-time code by email or SMS (`LOGIN_OTP_REQUIRED=true`) |
| OTP security | Crypto-random, only a salted HMAC stored, 5-min expiry, 5 guesses, single use, purpose-bound, resend cooldown |
| Brute-force lockout | 5 wrong passwords → account locked 15 min (HTTP 423); plus per-IP rate limits |
| No account discovery | Same error for unknown email and wrong password; "forgot password" always answers the same; equal timing |
| Short-lived access | 15-min JWT kept only in browser memory |
| Refresh-token rotation | httpOnly, SameSite=Strict cookie; new token on every refresh; only a SHA-256 hash stored |
| Theft detection | Re-using an old refresh token signs out **every** device and records an alert |
| Device management | See signed-in devices, sign one out, or sign out everywhere |
| Security events | Every sign-in, failure, lock, OTP, password change… with IP and device (`/api/auth/activity`) |
| Password changes | Reset via OTP signs out all devices; change signs out all *other* devices |
| Account deletion | Password required; erases data in MongoDB, SQL, vector store and S3 |

### Flows

```
Sign up:   POST /register ─► email OTP ─► POST /verify-email ─► signed in (access token + refresh cookie)
Sign in:   POST /login (password) ─► OTP ─► POST /login/verify ─► signed in
Stay in:   POST /refresh (cookie) ─► new access token + rotated cookie   (the frontend does this automatically)
Forgot:    POST /password/forgot ─► email OTP ─► POST /password/reset (code + new password)
SMS codes: POST /me/phone ─► SMS OTP ─► POST /me/phone/verify ─► PATCH /me {preferences:{otpChannel:"sms"}}
```

In development (`OTP_PROVIDER=console`) the codes are **printed in the express-api terminal**.
For real delivery set `OTP_PROVIDER=aws`, `SES_FROM_EMAIL` (a sender verified in Amazon SES) and
AWS credentials; SMS goes through Amazon SNS.

### OOP design

```
src/
├── auth/
│   ├── errors.js          AppError ◄─ ValidationError, AuthenticationError, AccountLockedError, …   (inheritance)
│   ├── PasswordPolicy.js  one rule set, one class                                              (single responsibility)
│   ├── PasswordHasher.js  wraps bcrypt; swap for argon2 without touching anything else          (encapsulation)
│   ├── TokenService.js    JWT access tokens + random refresh tokens
│   ├── OtpService.js      issue / resend / verify codes; private #methods hide the hashing     (encapsulation)
│   ├── notifiers.js       NotificationSender ◄─ ConsoleSender, MemorySender, SesEmailSender,
│   │                      SnsSmsSender, ChannelRouter; createNotifier() factory                (polymorphism, factory)
│   ├── AuditLogger.js     security event trail
│   └── AuthService.js     every auth rule; knows nothing about Express or MongoDB              (dependency injection)
├── repositories/
│   ├── mongo.js           MongoRepository ◄─ MongoUserRepository, MongoSessionRepository, …    (repository pattern)
│   └── memory.js          InMemoryRepository ◄─ same interface, used by tests                  (interchangeable)
├── container.js           composition root: picks the concrete classes and wires them          (inversion of control)
├── routes/auth.js         thin controller: HTTP in → AuthService → HTTP out
└── app.js                 one error handler maps AppError.status → HTTP response
```

Why it matters: `AuthService` receives its repositories, notifier, hasher and clock through the
constructor. Production passes MongoDB + AWS; the tests pass in-memory repositories, a
`MemorySender` that captures OTPs, and a fake clock to jump past expiry and lock times. All 25
tests run in about 2 seconds with no database.

The Python service uses the same ideas: `VectorStore` with interchangeable embedder classes
(`TfidfEmbedder` / `SentenceTransformerEmbedder`), `IntentClassifier`, FastAPI dependencies
(`get_caller`, `require_admin`) for injection, and Pydantic models for every tool input.

### Endpoints
See [../docs/API.md](../docs/API.md).
