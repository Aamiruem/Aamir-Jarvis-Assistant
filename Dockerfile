# Azarvis AI service (backend/fastapi-ai), built from the repository root.
# For hosts that look for a Dockerfile at the top of the repo (a Render web service created without
# a Root Directory). The same image as backend/fastapi-ai/Dockerfile; Docker Compose keeps using that one.
#
# Set on the host (Render → Environment):
#   INTERNAL_API_KEY   same value as INTERNAL_API_KEY on Vercel (project azarvis-api)   [required]
#   OPENAI_API_KEY / ANTHROPIC_API_KEY   at least one with credits, for AI answers
#   DATABASE_URL       a Postgres URL, so data survives restarts (optional; else SQLite inside the container)
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    # A server is not your PC: no opening apps, volume or locking the screen. The host can't override
    # this by accident unless it sets SYSTEM_CONTROL itself.
    SYSTEM_CONTROL=false

COPY backend/fastapi-ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/fastapi-ai/ .
# Run as an unprivileged user; data/ (SQLite, uploads) must stay writable.
RUN useradd --create-home --uid 10001 azarvis && mkdir -p data && chown -R azarvis:azarvis /app
USER azarvis
EXPOSE 8000
# PORT is set by the host (Render: 10000). No --proxy-headers: a forged X-Forwarded-For must never
# make a caller look like 127.0.0.1 (see app/security.py).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
