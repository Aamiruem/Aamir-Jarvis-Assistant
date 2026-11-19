# Deploying the backend to Google Cloud

This deploys the **gateway** (`backend/express-api`) and the **AI service** (`backend/fastapi-ai`) to
Cloud Run. The website can stay on Vercel (it is static files) and point its `/api` rewrite at the new gateway.

> Cost: Cloud Run has a free tier. **Cloud SQL is billed from the moment the instance exists**
> (the smallest shared-core instance is roughly a few hundred rupees a month). Check
> <https://cloud.google.com/products/calculator> first. Nothing in this repository creates
> resources by itself: you run every command below.

## What goes where

| Workload | Google Cloud service | Why |
|---|---|---|
| Gateway (Express) | Cloud Run `azarvis-api` | Stateless HTTP, scales to zero |
| AI service (FastAPI) | Cloud Run `azarvis-ai`, 1 instance, 2 GiB | Keeps its document index in memory; `SYSTEM_CONTROL=false` |
| Tasks, memories, chat logs | Cloud SQL for PostgreSQL | `DATABASE_URL` (SQLAlchemy, `psycopg`) |
| Uploaded files, document index, ML models | Cloud Storage bucket | Read through its S3-compatible API (`S3_ENDPOINT_URL`) and mounted at `/app/data` |
| Accounts, sessions, conversations | MongoDB Atlas (choose a GCP region) | The gateway uses MongoDB; Google has no managed MongoDB |
| Secrets | Secret Manager | Injected as environment variables; never in the image or the repository |
| Images | Artifact Registry + Cloud Build | Built from the Dockerfiles in this repo |
| Logs and metrics | Cloud Logging / Monitoring | Automatic for Cloud Run (both services log one line per request) |
| Your own PC (voice, apps, files, screen) | **Not the cloud** | Run `npm run dev` on your Windows PC; a cloud server can't and mustn't control your computer |

## One-time setup

Install the Google Cloud CLI (<https://cloud.google.com/sdk/docs/install>), then:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  sqladmin.googleapis.com secretmanager.googleapis.com storage.googleapis.com
gcloud artifacts repositories create azarvis --repository-format=docker --location=asia-south1
```

**Database (billed):**
```bash
gcloud sql instances create azarvis-sql --database-version=POSTGRES_16 --region=asia-south1 --tier=db-f1-micro --storage-size=10GB --backup-start-time=02:00
gcloud sql databases create azarvis --instance=azarvis-sql
gcloud sql users create azarvis --instance=azarvis-sql --password='A-LONG-RANDOM-PASSWORD'
```
The AI service creates its tables on first start.

**Bucket and its S3-compatible key:**
```bash
gcloud storage buckets create gs://YOUR-BUCKET --location=asia-south1 --uniform-bucket-level-access --public-access-prevention
gcloud storage hmac create SERVICE_ACCOUNT_EMAIL     # prints an access id and secret: store them below
```
Use the Cloud Run runtime service account (by default `PROJECT_NUMBER-compute@developer.gserviceaccount.com`)
and give it `roles/storage.objectAdmin` on the bucket and `roles/secretmanager.secretAccessor`
and `roles/cloudsql.client` on the project.

**Secrets** (each value from a file or stdin, so it never lands in your shell history):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | gcloud secrets create azarvis-internal-key --data-file=-
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | gcloud secrets create azarvis-jwt-secret --data-file=-
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" | gcloud secrets create azarvis-otp-secret --data-file=-
gcloud secrets create azarvis-anthropic-key --data-file=anthropic.txt
gcloud secrets create azarvis-mongo-uri --data-file=mongo-uri.txt
printf 'postgresql+psycopg://azarvis:PASSWORD@/azarvis?host=/cloudsql/PROJECT:asia-south1:azarvis-sql' | gcloud secrets create azarvis-database-url --data-file=-
gcloud secrets create azarvis-gcs-hmac-id --data-file=hmac-id.txt
gcloud secrets create azarvis-gcs-hmac-secret --data-file=hmac-secret.txt
```
Delete the `.txt` files afterwards.

## Deploy (and redeploy)

```bash
PROJECT=YOUR_PROJECT_ID REGION=asia-south1 SQL_INSTANCE=azarvis-sql BUCKET=YOUR-BUCKET bash infra/gcp/deploy.sh
```
It builds both images with Cloud Build, deploys `azarvis-ai`, then `azarvis-api` pointed at it,
and finishes with a `/api/health` smoke test. Real sign-in codes by email: add
`API_AUTH_ENV="OTP_PROVIDER=smtp,SMTP_USER=you@gmail.com"` and an `SMTP_PASS` secret; otherwise it
uses plain email + password, as the current Vercel deployment does.

Then:
1. `gcloud run services update azarvis-api --region asia-south1 --update-env-vars CLIENT_ORIGINS=https://your-site`
2. Point the website at the gateway: in `frontend/vercel.json` change the `/api/:path*` rewrite
   destination to `https://azarvis-api-…run.app/api/:path*` and redeploy the website.

## Your own domain and HTTPS

Cloud Run gives every service an HTTPS address with a managed certificate. For `api.yourdomain.com`:
**Cloud Run → Manage custom domains → Add mapping**, then add the DNS records it shows at your
domain registrar (or in Cloud DNS). The certificate is issued automatically once DNS resolves.
(In regions without domain mapping, put a global external HTTPS load balancer with a serverless
NEG in front instead.)

## Environments

Use one project per environment (`azarvis-dev`, `azarvis-staging`, `azarvis-prod`), each with its own
secrets, database and bucket. The same script deploys any of them: change `PROJECT`.

## Backups and recovery

- Cloud SQL: automatic daily backups (`--backup-start-time` above) and point-in-time recovery:
  `gcloud sql instances patch azarvis-sql --enable-point-in-time-recovery`. Restore with
  `gcloud sql backups restore BACKUP_ID --restore-instance=azarvis-sql`.
- Bucket: turn on object versioning (`gcloud storage buckets update gs://YOUR-BUCKET --versioning`).
- MongoDB Atlas: enable its cloud backups.
- Roll back a bad release: `gcloud run services update-traffic azarvis-api --to-revisions=PREVIOUS_REVISION=100`.

## Limits to know
- The AI service runs **one** instance because its document index lives in memory and on the
  mounted bucket. That is plenty for a personal assistant; scaling out needs a shared vector store (planned: pgvector).
- Voice recognition happens in the browser; the neural voice and everything else work in the cloud.
  PC control, the PC watcher and the screen tools only work on your own computer.
