FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Run as an unprivileged user; data/ (SQLite, uploads, models when not on S3/GCS) must stay writable.
RUN useradd --create-home --uid 10001 azarvis && mkdir -p data && chown -R azarvis:azarvis /app
USER azarvis
EXPOSE 8000
# PORT: set by Cloud Run (8080) and similar hosts; 8000 under Docker Compose.
# No --proxy-headers: a forged X-Forwarded-For must never make a caller look like 127.0.0.1
# (the default internal key is only accepted from loopback, see app/security.py).
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
