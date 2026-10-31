# Learning roadmap

Work through the phases in order. Each one points at the exact files to read, then gives
exercises that change the code. Finish the exercises before moving on, because that's where the
learning happens.

---

## Phase 1: Python + FastAPI (backend fundamentals)
**Read:** `backend/fastapi-ai/app/main.py`, `routers/misc.py`, `config.py`, `security.py`
- Routers, Pydantic request models, dependency injection (`Depends`), lifespan startup.
- Settings from environment variables; why secrets never live in code.

**Exercises**
1. Add `GET /tasks/{id}` returning one task (404 if missing).
2. Add a `priority` field (low/medium/high) to tasks, end to end.
3. Open `/docs` and call every endpoint by hand with the `X-Internal-Key` header.

## Phase 2: SQL vs. NoSQL
**Read:** `backend/fastapi-ai/app/db/sql.py` (SQLAlchemy) and `backend/express-api/src/models/*.js` (Mongoose)
- SQL: fixed schema, tables, `GROUP BY` aggregates (`chat_stats`). Good for analytics.
- MongoDB: a conversation is *one document* with embedded messages. Good for chat logs.

**Exercises**
1. Switch from SQLite to PostgreSQL (`DATABASE_URL`, or just use Docker Compose).
2. Write a raw SQL query: messages per day for the last 7 days. Add it to `/stats`.
3. Add a MongoDB text index on `messages.content` and a `/api/conversations/search?q=` route.

## Phase 3: MERN (React + Express + MongoDB + Node)
**Read:** `backend/express-api/src/index.js`, `routes/chat.js`, `middleware/auth.js`; `frontend/src/App.jsx`, `api.js`, `components/Chat.jsx`
- JWT auth flow: register → token → `Authorization: Bearer` → middleware.
- API gateway pattern: Node owns users/history and proxies AI calls with a service key.
- **Server-Sent Events**: how tokens stream Python → Node → React (`streamChat`).
- React state, effects, refs, custom hooks (`useSpeech.js`).

**Exercises**
1. Rename conversations (PATCH route + inline edit in the sidebar).
2. Add a light/dark theme toggle (CSS variables are already set up in `styles.css`).
3. Add a "regenerate last answer" button.

## Phase 4: LLMs & generative AI
**Read:** `backend/fastapi-ai/app/llm/claude.py`, `cv/vision.py` (`describe_image`)
- Messages API: `system`, `messages`, content blocks (text, image).
- Model choice and **effort** (`CLAUDE_EFFORT`): the trade between speed, cost and quality.
- Streaming, stop reasons (`end_turn`, `tool_use`, `max_tokens`, `refusal`), token usage.

**Exercises**
1. Change Jarvis's personality in `SYSTEM_PROMPT` (agent/agent.py) and compare answers.
2. Try `CLAUDE_EFFORT=low` vs `high`; compare latency and tokens in the Streamlit dashboard.
3. Add a `/summarize` endpoint that summarises a conversation into 3 bullet points.

## Phase 5: Agents & tool use (agentic AI)
**Read:** `backend/fastapi-ai/app/agent/agent.py` (the loop) and `agent/tools.py` (the tools)
- The loop: model asks for tools → you run them → send results → repeat until done.
- Parallel tool calls (all results go back in one message), error results (`is_error`).
- Why tool input is validated (Pydantic) and why `calculate` never uses `eval()`.

**Exercises**
1. Add a `get_news` or `wikipedia_summary` tool (free public APIs).
2. Add a `send_email` tool that only *drafts*, and requires user confirmation in the UI before sending
   (human-in-the-loop).
3. Set `ENABLE_WEB_SEARCH=true` and watch Claude use an Anthropic-hosted server tool.

## Phase 6: RAG (retrieval-augmented generation)
**Read:** `backend/fastapi-ai/app/rag/store.py`, `routers/rag.py`
- Chunking with overlap → embeddings → cosine similarity → top-k.
- **Classic RAG** (`/rag/query`: always retrieve) vs **agentic RAG** (the agent decides when
  to call `search_knowledge`). Try both from the Streamlit Knowledge page.

**Exercises**
1. `pip install -r requirements-dl.txt`, set `RAG_EMBEDDER=sentence-transformers`, and compare
   results for paraphrased questions (keywords vs. meaning).
2. Move vectors into **pgvector** or **MongoDB Atlas Vector Search**.
3. Add hybrid search: combine TF-IDF and dense scores.
4. Build a mini eval: 10 questions + expected source doc; measure hit-rate@4.

## Phase 7: NLP & classic machine learning
**Read:** `backend/fastapi-ai/app/nlp/intent.py`, `nlp/analyzer.py`, `ml/train_intent.py`
- Text → TF-IDF features → Logistic Regression; train/test, cross-validation, precision/recall.
- Rule-based sentiment with negation; regex vs. spaCy NER.

**Exercises**
1. Run `python -m ml.train_intent`. Accuracy starts around 66% with 10 examples per intent.
   Add 20 more examples per intent and see how far you can push it.
2. Try `LinearSVC` or `MultinomialNB` instead of Logistic Regression; compare reports.
3. Install spaCy (`requirements-dl.txt`) and compare entity output in the NLP playground.

## Phase 8: Deep learning
**Read:** `backend/fastapi-ai/ml/train_intent_dl.py`
- Tensors, `nn.Module`, loss, backprop, optimizer, train/validation split, overfitting.

**Exercises**
1. Replace bag-of-words with `nn.Embedding` + mean pooling, then an `nn.LSTM`.
2. Fine-tune `distilbert-base-uncased` on `intents.json` with Hugging Face `transformers`.
3. Serve the PyTorch model from FastAPI as `/nlp/analyze?engine=dl`.

## Phase 9: Computer vision
**Read:** `backend/fastapi-ai/app/cv/vision.py`, `frontend/src/components/VisionPanel.jsx`
- Classic CV (Haar cascade, grayscale, image statistics) vs. a multimodal LLM.
- Webcam capture in the browser (`getUserMedia` → canvas → JPEG blob → upload).

**Exercises**
1. Add object detection with **YOLO** (`ultralytics`) and draw labelled boxes.
2. Add OCR with `pytesseract` and compare it with asking Claude to read the text.
3. Face *recognition*: store embeddings of known faces and greet the user by name.

## Phase 10: MCP (Model Context Protocol)
**Read:** `backend/mcp-server/server.py`
- MCP standardises tools/resources so any AI client can use them.
- `claude mcp add jarvis -- python <path>/backend/mcp-server/server.py`, then ask Claude Code
  "what's on my Jarvis task list?"

**Exercises**
1. Add an MCP **prompt** (e.g. "daily briefing") alongside the tools.
2. Make the *ai-service agent itself* an MCP **client** that loads tools from external MCP servers
   (see the `anthropic[mcp]` helpers in the Anthropic SDK docs).

## Phase 11: Streamlit
**Read:** `backend/streamlit-admin/app.py`
- Python-only web apps for data and ML demos; top-to-bottom reruns; widgets and state.

**Exercise:** add a page that charts messages per day and average sentiment over time.

## Phase 12: AWS & deployment
**Read:** `docker-compose.yml`, every `Dockerfile`, `infra/aws/README.md`, `backend/fastapi-ai/app/storage/s3.py`
1. Run everything with `docker compose up --build`.
2. Create an S3 bucket, set `S3_BUCKET`, upload a doc, and find it in the S3 console.
3. Deploy to one EC2 instance (option A), then to ECS Fargate + RDS (option B).
4. Add a GitHub Actions workflow: run `pytest` and `npm run build` on every push.

---

### Capstone ideas
- **Wake word**: listen continuously and start recording when it hears "Jarvis".
- **Proactive reminders**: a scheduler checks due tasks and pushes browser notifications.
- **Long-term memory**: extract facts about the user from chats into a `memories` collection
  and feed the relevant ones back into the system prompt.
- **Smart-home control**: a tool that talks to Home Assistant's REST API.
