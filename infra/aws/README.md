# Deploying Jarvis on AWS

Start simple (option A), then graduate to managed services (option B).

## Option A: one EC2 instance + Docker Compose (cheapest way to learn)

1. Launch an **EC2** instance (Ubuntu, t3.medium), open ports 22, 80/443 in its **Security Group**.
2. Install Docker: `sudo apt install -y docker.io docker-compose-v2`.
3. Copy the repo and your `.env` to the server, then `sudo docker compose up -d --build`.
4. Put **Nginx + Let's Encrypt** (or an Application Load Balancer) in front for HTTPS.

## Option B: managed services

| Piece | AWS service | Notes |
|---|---|---|
| Container images | **ECR** | `docker build` + `docker push` each service |
| Run containers | **ECS Fargate** (or App Runner) | one service per container; no servers to patch |
| SQL (tasks, analytics) | **RDS PostgreSQL** | set `DATABASE_URL` |
| MongoDB (users, chats) | **MongoDB Atlas on AWS** or **DocumentDB** | set `MONGO_URI` |
| File uploads | **S3** | set `S3_BUCKET`; give the task role `s3:PutObject` |
| Secrets | **Secrets Manager** | inject `ANTHROPIC_API_KEY`, `JWT_SECRET`, `INTERNAL_API_KEY` |
| Frontend | **S3 + CloudFront** | upload `frontend/dist`, route `/api/*` to the ALB |
| Logs / metrics | **CloudWatch** | ECS ships container logs automatically |

### Create the S3 bucket and push an image (AWS CLI)

```bash
aws s3 mb s3://my-jarvis-uploads --region ap-south-1

aws ecr create-repository --repository-name jarvis-ai
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker build -t jarvis-ai ./backend/fastapi-ai
docker tag jarvis-ai <account>.dkr.ecr.ap-south-1.amazonaws.com/jarvis-ai:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/jarvis-ai:latest
```

### Security checklist
- Never put AWS keys in code or images; use **IAM task roles**.
- Keep the AI service private (internal ALB / service discovery). Only the Node gateway is public.
- Set a long random `JWT_SECRET` and `INTERNAL_API_KEY`.
- Set **AWS Budgets** alerts so a mistake can't run up a bill.

### Optional: Claude through AWS
You can also call Claude through **Amazon Bedrock** with the SDK's `AnthropicBedrockMantle` client
(model IDs get an `anthropic.` prefix, e.g. `anthropic.claude-opus-5-5`), billed on your AWS account.
Swap the client in `backend/fastapi-ai/app/llm/claude.py` and set `CLAUDE_FALLBACKS=` (empty): the
server-side `fallbacks` parameter isn't available on Bedrock.
