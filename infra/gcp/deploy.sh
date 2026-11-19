#!/usr/bin/env bash
# Deploy the Azarvis backend to Google Cloud Run. Read docs/GOOGLE_CLOUD.md first.
#
# Nothing here runs by itself: you run it, from the repository root, after the one-time setup in
# the guide (project, APIs, Artifact Registry, secrets, Cloud SQL, bucket). Cloud SQL and Cloud Run
# cost money beyond the free tier, so check the pricing calculator before creating them.
#
#   PROJECT=my-project REGION=asia-south1 SQL_INSTANCE=azarvis-sql BUCKET=azarvis-files bash infra/gcp/deploy.sh
set -euo pipefail

: "${PROJECT:?set PROJECT (your Google Cloud project id)}"
: "${REGION:=asia-south1}"                   # Mumbai; pick the region closest to your users
: "${REPO:=azarvis}"                         # Artifact Registry repository (Docker format)
: "${SQL_INSTANCE:?set SQL_INSTANCE (Cloud SQL for PostgreSQL instance name)}"
: "${BUCKET:?set BUCKET (Cloud Storage bucket for uploaded files and the AI service data)}"
# Production sign-in codes need an email provider (OTP_PROVIDER=smtp + SMTP_* secrets, see the guide);
# until then plain email + password, as on the current Vercel deployment.
: "${API_AUTH_ENV:=PASSWORD_ONLY=true}"
TAG="$(git rev-parse --short HEAD)"
IMAGES="${REGION}-docker.pkg.dev/${PROJECT}/${REPO}"

echo "Building images with Cloud Build (tag ${TAG})..."
gcloud builds submit backend/fastapi-ai --project "$PROJECT" --tag "${IMAGES}/fastapi-ai:${TAG}"
gcloud builds submit backend/express-api --project "$PROJECT" --tag "${IMAGES}/express-api:${TAG}"

echo "Deploying the AI service (azarvis-ai)..."
# - SYSTEM_CONTROL=false: a cloud server must never try to control "this PC". PC control runs only
#   in the desktop assistant on your own Windows machine.
# - One instance with the bucket mounted at /app/data keeps the document index and ML models
#   (files) persistent; the database itself is Cloud SQL.
# - The internal key comes from Secret Manager; the default key is refused from other hosts.
gcloud run deploy azarvis-ai --project "$PROJECT" --region "$REGION" \
  --image "${IMAGES}/fastapi-ai:${TAG}" \
  --allow-unauthenticated --max-instances 1 --memory 2Gi --cpu 1 --timeout 300 \
  --add-cloudsql-instances "${PROJECT}:${REGION}:${SQL_INSTANCE}" \
  --add-volume "name=data,type=cloud-storage,bucket=${BUCKET}" --add-volume-mount "volume=data,mount-path=/app/data" \
  --set-env-vars "SYSTEM_CONTROL=false,PC_WATCH_INTERVAL_SECONDS=86400,DATA_DIR=/app/data,S3_BUCKET=${BUCKET},S3_ENDPOINT_URL=https://storage.googleapis.com,AWS_REGION=auto" \
  --set-secrets "INTERNAL_API_KEY=azarvis-internal-key:latest,ANTHROPIC_API_KEY=azarvis-anthropic-key:latest,DATABASE_URL=azarvis-database-url:latest,AWS_ACCESS_KEY_ID=azarvis-gcs-hmac-id:latest,AWS_SECRET_ACCESS_KEY=azarvis-gcs-hmac-secret:latest"

AI_URL="$(gcloud run services describe azarvis-ai --project "$PROJECT" --region "$REGION" --format 'value(status.url)')"

echo "Deploying the gateway (azarvis-api) -> ${AI_URL}..."
gcloud run deploy azarvis-api --project "$PROJECT" --region "$REGION" \
  --image "${IMAGES}/express-api:${TAG}" \
  --allow-unauthenticated --memory 512Mi --cpu 1 \
  --set-env-vars "NODE_ENV=production,AI_SERVICE_URL=${AI_URL},COOKIE_SECURE=true,${API_AUTH_ENV}" \
  --set-secrets "INTERNAL_API_KEY=azarvis-internal-key:latest,JWT_SECRET=azarvis-jwt-secret:latest,OTP_SECRET=azarvis-otp-secret:latest,MONGO_URI=azarvis-mongo-uri:latest"

API_URL="$(gcloud run services describe azarvis-api --project "$PROJECT" --region "$REGION" --format 'value(status.url)')"
echo
echo "Smoke test:"
curl -fsS "${API_URL}/api/health" && echo
echo "Done. Gateway: ${API_URL}  AI service: ${AI_URL}"
echo "Next: set CLIENT_ORIGINS on azarvis-api to your website's address, and point the website's /api rewrite at ${API_URL}."
