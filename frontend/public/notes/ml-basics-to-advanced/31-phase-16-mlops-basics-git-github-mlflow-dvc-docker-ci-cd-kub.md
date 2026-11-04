> **You asked:**
>
> Phase 16: MLOps Basics
> Git
> GitHub
> MLflow
> DVC
> Docker
> CI/CD
> Kubernetes Basics
> Monitoring
> Model Versioning all command and use

# Phase 16: MLOps Basics  
# Git, GitHub, MLflow, DVC, Docker, CI/CD, Kubernetes, Monitoring, Model Versioning

MLOps means **Machine Learning Operations**.

Simple meaning:

```text
MLOps = ML + DevOps
```

It helps manage the complete ML lifecycle:

```text
Data → Code → Experiment → Model → Deployment → Monitoring → Retraining
```

---

# 1. What is MLOps?

## Easy Definition

MLOps is a set of practices used to build, train, deploy, monitor, and maintain machine learning models in a professional way.

## Why MLOps is Needed?

In real companies, we need to manage:

```text
Code version
Dataset version
Model version
Experiment tracking
Deployment
Monitoring
Retraining
Team collaboration
```

## Interview Answer

MLOps is the practice of managing the complete machine learning lifecycle using tools and processes for version control, experiment tracking, model deployment, monitoring, and automation.

---

# 2. Complete MLOps Workflow

```text
1. Write ML code
2. Track code using Git
3. Push code to GitHub
4. Track datasets and models using DVC
5. Track experiments using MLflow
6. Save and register best model
7. Build API using FastAPI/Flask
8. Dockerize the application
9. Use CI/CD for testing and deployment
10. Deploy on Kubernetes or cloud
11. Monitor model performance
12. Retrain model when performance drops
```

---

# 3. Git

## Easy Definition

Git is a version control system used to track code changes.

Simple meaning:

```text
Git remembers every change in your code.
```

Git’s official reference lists core commands such as `init`, `clone`, `add`, `status`, `commit`, `branch`, `merge`, `fetch`, `pull`, `push`, `log`, and `diff`. citeturn492573search3

---

## Why Git is Used in MLOps?

```text
Track ML code changes
Create branches for experiments
Rollback old code
Work with team
Maintain project history
```

---

## Git Basic Commands

| Command | Use |
|---|---|
| `git init` | Start Git in project |
| `git status` | Check file status |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Save changes |
| `git log` | See commit history |
| `git diff` | See file differences |
| `git branch` | List branches |
| `git checkout -b branch_name` | Create and switch branch |
| `git switch branch_name` | Switch branch |
| `git merge branch_name` | Merge branch |
| `git remote add origin URL` | Connect local repo to GitHub |
| `git push origin main` | Push code to GitHub |
| `git pull origin main` | Pull latest changes |

GitHub’s docs explain that `git push` usually takes a remote name like `origin` and a branch name like `main`; Git’s docs explain that `git pull` fetches remote changes and integrates them into the current branch. citeturn492573search4turn492573search5

---

## Git Commands Step-by-Step

### Create Git Repository

```bash
git init
```

### Check Status

```bash
git status
```

### Add Files

```bash
git add .
```

### Commit Files

```bash
git commit -m "initial ml project setup"
```

### See Commit History

```bash
git log
```

Short log:

```bash
git log --oneline
```

### Create Branch

```bash
git checkout -b experiment-random-forest
```

or:

```bash
git switch -c experiment-random-forest
```

### Switch Branch

```bash
git switch main
```

### Merge Branch

```bash
git merge experiment-random-forest
```

### Connect to GitHub

```bash
git remote add origin https://github.com/username/ml-project.git
```

### Push Code

```bash
git push origin main
```

### Pull Latest Code

```bash
git pull origin main
```

---

## Git Interview Answer

Git is used for version control. It tracks code changes, helps collaborate with teams, supports branching, and allows rollback to previous versions.

---

# 4. GitHub

## Easy Definition

GitHub is an online platform where we store Git repositories.

Simple meaning:

```text
Git = local version control
GitHub = online code storage and collaboration
```

---

## Why GitHub is Used in MLOps?

```text
Store ML project code
Collaborate with team
Review code using Pull Requests
Run CI/CD using GitHub Actions
Track issues and project tasks
```

---

## GitHub Commands

### Clone Repository

```bash
git clone https://github.com/username/ml-project.git
```

### Push New Branch

```bash
git push origin experiment-random-forest
```

### Pull Latest Changes

```bash
git pull origin main
```

### Check Remote URL

```bash
git remote -v
```

### Change Remote URL

```bash
git remote set-url origin https://github.com/username/new-repo.git
```

---

## GitHub Workflow

```text
1. Create branch
2. Make code changes
3. Commit changes
4. Push branch to GitHub
5. Create Pull Request
6. Review code
7. Merge into main
```

---

## GitHub Interview Answer

GitHub is used to host Git repositories online. In MLOps, it helps with collaboration, pull requests, code review, issue tracking, and CI/CD automation.

---

# 5. MLflow

## Easy Definition

MLflow is used to track machine learning experiments and manage models.

Simple meaning:

```text
MLflow remembers:
Which model you trained
Which parameters you used
What accuracy you got
Which model file was saved
```

MLflow Tracking provides an API and UI for logging parameters, code versions, metrics, and output files from ML runs, and MLflow Model Registry is a centralized model store for lifecycle management, versioning, aliases, metadata, and lineage. citeturn879569search9turn879569search1

---

## Why MLflow is Used?

```text
Track experiments
Compare models
Log metrics
Log hyperparameters
Save models
Register best model
Manage model versions
```

---

## Install MLflow

```bash
pip install mlflow
```

---

## MLflow Basic Commands

| Command | Use |
|---|---|
| `mlflow ui` | Start MLflow UI |
| `mlflow server` | Start tracking server |
| `mlflow run .` | Run MLflow project |
| `mlflow models serve` | Serve MLflow model |
| `mlflow experiments list` | List experiments |
| `mlflow gc` | Clean deleted runs |

MLflow’s tracking server is a standalone HTTP server that exposes REST API endpoints for tracking runs and experiments. citeturn492573search15

---

## Start MLflow UI

```bash
mlflow ui
```

Default UI:

```text
http://127.0.0.1:5000
```

---

## MLflow Experiment Tracking Code

```python
import mlflow
import mlflow.sklearn

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
iris = load_iris()
X = iris.data
y = iris.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Set experiment name
mlflow.set_experiment("iris_classification_experiment")

with mlflow.start_run():
    n_estimators = 100
    max_depth = 5

    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=42
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    # Log parameters
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)

    # Log metric
    mlflow.log_metric("accuracy", accuracy)

    # Log model
    mlflow.sklearn.log_model(model, "random_forest_model")

    print("Accuracy:", accuracy)
```

---

## MLflow Model Registry

Model Registry is used to manage model versions.

Example stages:

```text
Development
Staging
Production
Archived
```

## Interview Answer

MLflow is used for experiment tracking and model management. It logs parameters, metrics, artifacts, and models, and it helps compare experiments and manage model versions through Model Registry.

---

# 6. DVC — Data Version Control

## Easy Definition

DVC is used to version control datasets, models, and ML pipelines.

Simple meaning:

```text
Git tracks code.
DVC tracks data and model files.
```

DVC is designed for Git-based data and model versioning in local data science and ML projects, and its official quick start shows workflows such as `dvc pull` for retrieving data from remote storage. citeturn879569search0

---

## Why DVC is Used?

```text
Track dataset versions
Track model versions
Avoid pushing large files to Git
Share data using remote storage
Reproduce ML pipelines
Track metrics
```

---

## Install DVC

```bash
pip install dvc
```

With S3 support:

```bash
pip install "dvc[s3]"
```

With Google Drive support:

```bash
pip install "dvc[gdrive]"
```

With Azure support:

```bash
pip install "dvc[azure]"
```

---

## DVC Basic Commands

| Command | Use |
|---|---|
| `dvc init` | Initialize DVC |
| `dvc add data.csv` | Track dataset |
| `dvc add model.pkl` | Track model |
| `dvc remote add -d storage URL` | Add remote storage |
| `dvc push` | Push data/model to remote |
| `dvc pull` | Pull data/model from remote |
| `dvc status` | Check DVC changes |
| `dvc repro` | Reproduce pipeline |
| `dvc metrics show` | Show metrics |
| `dvc plots show` | Show plots |
| `dvc dag` | Show pipeline graph |
| `dvc checkout` | Restore data/model version |

---

## DVC Step-by-Step

### Initialize DVC

```bash
dvc init
```

### Track Dataset

```bash
dvc add data/raw/dataset.csv
```

This creates:

```text
data/raw/dataset.csv.dvc
```

Now Git should track the `.dvc` file, not the large dataset.

```bash
git add data/raw/dataset.csv.dvc .gitignore
git commit -m "track dataset with dvc"
```

### Add Remote Storage

Local remote:

```bash
dvc remote add -d myremote /tmp/dvc-storage
```

S3 remote:

```bash
dvc remote add -d myremote s3://my-bucket/path
```

Google Drive remote:

```bash
dvc remote add -d myremote gdrive://folder-id
```

### Push Data to Remote

```bash
dvc push
```

### Pull Data from Remote

```bash
dvc pull
```

### Check DVC Status

```bash
dvc status
```

---

## DVC Pipeline Example

Project structure:

```text
ml_project/
│
├── data/
│   └── raw.csv
├── src/
│   ├── preprocess.py
│   ├── train.py
│   └── evaluate.py
├── params.yaml
├── dvc.yaml
└── metrics.json
```

---

## `params.yaml`

```yaml
train:
  n_estimators: 100
  max_depth: 5
```

---

## Create DVC Pipeline Stages

### Preprocess Stage

```bash
dvc stage add -n preprocess \
  -d src/preprocess.py \
  -d data/raw.csv \
  -o data/processed.csv \
  python src/preprocess.py
```

### Train Stage

```bash
dvc stage add -n train \
  -d src/train.py \
  -d data/processed.csv \
  -p train.n_estimators,train.max_depth \
  -o models/model.pkl \
  python src/train.py
```

### Evaluate Stage

```bash
dvc stage add -n evaluate \
  -d src/evaluate.py \
  -d models/model.pkl \
  -M metrics.json \
  python src/evaluate.py
```

### Run Full Pipeline

```bash
dvc repro
```

### Show Metrics

```bash
dvc metrics show
```

### Show Pipeline Graph

```bash
dvc dag
```

---

## DVC Interview Answer

DVC is used to version datasets, models, and ML pipelines. Git tracks code, while DVC tracks large files like datasets and trained models using lightweight metadata files.

---

# 7. Docker

## Easy Definition

Docker packages the application, code, model, and dependencies into one container.

Simple meaning:

```text
Docker solves: "It works on my machine but not on server."
```

Docker’s official docs describe a Dockerfile as a text document containing instructions used to build an image, and `docker build` builds an image from a Dockerfile and build context. citeturn744460search8turn744460search4

---

## Why Docker is Used in MLOps?

```text
Same environment everywhere
Easy deployment
Avoid dependency issues
Run ML API in container
Cloud-friendly deployment
```

---

## Docker Basic Commands

| Command | Use |
|---|---|
| `docker --version` | Check Docker version |
| `docker build -t app-name .` | Build Docker image |
| `docker images` | List images |
| `docker run -p 8000:8000 app-name` | Run container |
| `docker ps` | List running containers |
| `docker ps -a` | List all containers |
| `docker stop container_id` | Stop container |
| `docker rm container_id` | Remove container |
| `docker rmi image_id` | Remove image |
| `docker logs container_id` | Show logs |
| `docker exec -it container_id bash` | Enter container |
| `docker tag image repo/image:tag` | Tag image |
| `docker push repo/image:tag` | Push image |

---

## Dockerfile for FastAPI ML App

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Build Docker Image

```bash
docker build -t ml-api .
```

---

## Run Docker Container

```bash
docker run -p 8000:8000 ml-api
```

---

## Check Running Containers

```bash
docker ps
```

---

## Show Logs

```bash
docker logs container_id
```

---

## Docker Interview Answer

Docker is a containerization tool that packages an application with all dependencies so it can run consistently across local machines, servers, and cloud platforms.

---

# 8. CI/CD

## Easy Definition

CI/CD automates testing, building, and deployment.

Full form:

```text
CI = Continuous Integration
CD = Continuous Delivery / Continuous Deployment
```

Simple meaning:

```text
Push code to GitHub
        ↓
Tests run automatically
        ↓
Docker image builds automatically
        ↓
App deploys automatically
```

GitHub Actions workflows are YAML files made of jobs and steps; GitHub’s docs describe a workflow as a configurable automated process made up of one or more jobs. citeturn879569search6

---

## Why CI/CD is Used in MLOps?

```text
Automatically test ML code
Check code quality
Build Docker image
Deploy ML API
Reduce manual errors
Make deployment faster
```

---

## GitHub Actions Folder Structure

```text
.github/
└── workflows/
    └── ci.yml
```

---

## Basic CI Pipeline

```yaml
name: ML CI Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        run: |
          pytest tests/
```

---

## CI/CD with Docker Build

```yaml
name: Build Docker Image

on:
  push:
    branches: [ "main" ]

jobs:
  docker-build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build -t ml-api .
```

---

## CI/CD Interview Answer

CI/CD automates testing, building, and deployment. In MLOps, it ensures that ML code, APIs, and Docker images are tested and deployed consistently whenever code changes.

---

# 9. Kubernetes Basics

## Easy Definition

Kubernetes is used to manage containers at scale.

Simple meaning:

```text
Docker runs one container.
Kubernetes manages many containers.
```

Kubernetes official docs define Kubernetes as an open-source container orchestration engine for automating deployment, scaling, and management of containerized applications. citeturn744460search5

---

## Why Kubernetes is Used in MLOps?

```text
Deploy ML APIs
Scale prediction service
Restart failed containers
Manage multiple model services
Expose ML app using service
Rolling updates
```

---

## Important Kubernetes Terms

| Term | Easy Meaning |
|---|---|
| Cluster | Group of machines |
| Node | One machine/server |
| Pod | Smallest deployable unit |
| Container | Docker container inside Pod |
| Deployment | Manages Pods |
| Service | Exposes Pods |
| Namespace | Logical project space |
| ConfigMap | Store config |
| Secret | Store sensitive data |
| Ingress | External HTTP access |

Kubernetes docs explain that a Deployment manages Pods and ReplicaSets for application workloads, while a Service exposes a network application running on one or more Pods. citeturn879569search7turn879569search11

---

## kubectl Commands

| Command | Use |
|---|---|
| `kubectl version` | Check client/server version |
| `kubectl cluster-info` | Show cluster info |
| `kubectl get nodes` | List nodes |
| `kubectl get pods` | List pods |
| `kubectl get deployments` | List deployments |
| `kubectl get services` | List services |
| `kubectl apply -f file.yaml` | Create/update resource |
| `kubectl delete -f file.yaml` | Delete resource |
| `kubectl describe pod pod_name` | Details of pod |
| `kubectl logs pod_name` | Show pod logs |
| `kubectl exec -it pod_name -- bash` | Enter pod |
| `kubectl scale deployment app --replicas=3` | Scale app |
| `kubectl rollout status deployment/app` | Check rollout |
| `kubectl rollout undo deployment/app` | Rollback deployment |

The official kubectl reference covers kubectl syntax, command operations, and examples for interacting with Kubernetes clusters. citeturn744460search1

---

## Kubernetes Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ml-api-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ml-api
  template:
    metadata:
      labels:
        app: ml-api
    spec:
      containers:
        - name: ml-api
          image: username/ml-api:latest
          ports:
            - containerPort: 8000
```

---

## Kubernetes Service YAML

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ml-api-service
spec:
  type: LoadBalancer
  selector:
    app: ml-api
  ports:
    - port: 80
      targetPort: 8000
```

---

## Apply Kubernetes Files

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

---

## Check Pods

```bash
kubectl get pods
```

---

## Check Service

```bash
kubectl get svc
```

---

## Scale Deployment

```bash
kubectl scale deployment ml-api-deployment --replicas=5
```

---

## Rollback Deployment

```bash
kubectl rollout undo deployment/ml-api-deployment
```

---

## Kubernetes Interview Answer

Kubernetes is used to deploy, scale, and manage containerized applications. In MLOps, it helps deploy ML APIs, scale prediction services, and manage production model containers.

---

# 10. Monitoring

## Easy Definition

Monitoring means continuously checking whether your ML model and system are working properly.

Simple meaning:

```text
After deployment, we must watch model performance.
```

---

## Types of Monitoring in MLOps

| Monitoring Type | Meaning |
|---|---|
| System Monitoring | CPU, memory, disk, latency |
| API Monitoring | Request count, error rate, response time |
| Data Monitoring | Input data distribution |
| Model Monitoring | Accuracy, precision, recall, drift |
| Business Monitoring | Revenue, fraud caught, conversion rate |

---

## Why Monitoring is Important?

```text
Model accuracy may decrease
Data pattern may change
API may become slow
Server may crash
Prediction errors may increase
```

---

## Data Drift

Data drift means input data changes over time.

Example:

```text
Training data: customers aged 20-40
Production data: customers aged 50-70
```

Model may perform poorly.

---

## Model Drift

Model drift means model performance decreases over time.

Example:

```text
Fraud patterns changed
Old model cannot detect new fraud
```

---

## Monitoring Tools

| Tool | Use |
|---|---|
| Prometheus | Collect metrics |
| Grafana | Dashboard visualization |
| Evidently AI | Data drift and model monitoring |
| MLflow | Experiment/model tracking |
| CloudWatch | AWS monitoring |
| Azure Monitor | Azure monitoring |
| GCP Cloud Monitoring | GCP monitoring |

Prometheus scrapes metrics from instrumented jobs and stores time-series samples; Grafana can query, visualize, alert on, and understand metrics across data sources. citeturn744460search2turn744460search7

---

## Prometheus Metrics Example in FastAPI

Install:

```bash
pip install prometheus-client
```

Code:

```python
from fastapi import FastAPI
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import Response
import time

app = FastAPI()

REQUEST_COUNT = Counter(
    "prediction_requests_total",
    "Total prediction requests"
)

REQUEST_LATENCY = Histogram(
    "prediction_latency_seconds",
    "Prediction request latency"
)

@app.get("/")
def home():
    return {"message": "ML API running"}

@app.post("/predict")
def predict():
    REQUEST_COUNT.inc()

    start_time = time.time()

    # Dummy prediction
    prediction = 1

    latency = time.time() - start_time
    REQUEST_LATENCY.observe(latency)

    return {"prediction": prediction}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

Now Prometheus can scrape:

```text
/metrics
```

---

## Monitoring Interview Answer

Monitoring in MLOps means tracking system health, API performance, data drift, model drift, and business impact after deployment. It helps identify when a model needs retraining.

---

# 11. Model Versioning

## Easy Definition

Model versioning means keeping track of different versions of trained models.

Simple meaning:

```text
model_v1.pkl
model_v2.pkl
model_v3.pkl
```

But in professional MLOps, model versioning is managed using tools like:

```text
MLflow Model Registry
DVC
Cloud model registry
```

MLflow Model Registry supports model lifecycle management with versioning, aliases, metadata, and lineage, while DVC supports Git-based versioning of model files through metadata and remote storage. citeturn879569search1turn879569search0

---

## Why Model Versioning is Needed?

```text
Compare model versions
Rollback bad model
Know which dataset trained which model
Track production model
Reproduce old results
```

---

## Manual Model Versioning

```text
models/
├── salary_model_v1.pkl
├── salary_model_v2.pkl
└── salary_model_v3.pkl
```

Better naming:

```text
model_randomforest_2026_07_12_acc_0.92.pkl
```

---

## Model Versioning with MLflow

```python
import mlflow
import mlflow.sklearn

with mlflow.start_run():
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path="model",
        registered_model_name="SalaryPredictionModel"
    )
```

This registers model in MLflow Model Registry.

---

## Model Versioning with DVC

```bash
dvc add models/model.pkl
git add models/model.pkl.dvc .gitignore
git commit -m "add model version 1"
dvc push
```

If model changes:

```bash
dvc add models/model.pkl
git add models/model.pkl.dvc
git commit -m "update model version 2"
dvc push
```

Checkout old version:

```bash
git checkout old_commit_id
dvc checkout
```

---

## Model Versioning Interview Answer

Model versioning is used to track different trained model versions, their metrics, datasets, and code. It allows comparison, rollback, and reproducibility.

---

# 12. Complete MLOps Project Template

## Folder Structure

```text
mlops_project/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── data/
│   ├── raw/
│   └── processed/
│
├── models/
│   └── model.pkl
│
├── notebooks/
│   └── experiment.ipynb
│
├── src/
│   ├── preprocess.py
│   ├── train.py
│   ├── evaluate.py
│   └── predict.py
│
├── app/
│   ├── main.py
│   └── schemas.py
│
├── tests/
│   └── test_api.py
│
├── dvc.yaml
├── params.yaml
├── metrics.json
├── requirements.txt
├── Dockerfile
├── README.md
└── .gitignore
```

---

# 13. `requirements.txt`

```text
pandas
numpy
scikit-learn
joblib
mlflow
dvc
fastapi
uvicorn
pytest
prometheus-client
```

---

# 14. `params.yaml`

```yaml
train:
  test_size: 0.2
  random_state: 42
  n_estimators: 100
  max_depth: 5
```

---

# 15. Training Code with MLflow — `src/train.py`

```python
import json
import joblib
import mlflow
import mlflow.sklearn
import pandas as pd

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Load data
iris = load_iris()
X = iris.data
y = iris.target

# Parameters
test_size = 0.2
random_state = 42
n_estimators = 100
max_depth = 5

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=test_size,
    random_state=random_state
)

mlflow.set_experiment("mlops_iris_experiment")

with mlflow.start_run():
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    # Save locally
    joblib.dump(model, "models/model.pkl")

    # Save metrics
    metrics = {
        "accuracy": accuracy
    }

    with open("metrics.json", "w") as f:
        json.dump(metrics, f, indent=4)

    # MLflow logging
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)
    mlflow.log_metric("accuracy", accuracy)
    mlflow.sklearn.log_model(model, "model")

    print("Accuracy:", accuracy)
```

---

# 16. FastAPI App — `app/main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
from prometheus_client import Counter, Histogram, generate_latest
from fastapi.responses import Response
import time

app = FastAPI(title="MLOps ML API")

model = joblib.load("models/model.pkl")

REQUEST_COUNT = Counter(
    "prediction_requests_total",
    "Total prediction requests"
)

REQUEST_LATENCY = Histogram(
    "prediction_latency_seconds",
    "Prediction latency"
)

class IrisInput(BaseModel):
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float

@app.get("/")
def home():
    return {"message": "MLOps API is running"}

@app.post("/predict")
def predict(data: IrisInput):
    REQUEST_COUNT.inc()
    start_time = time.time()

    features = [[
        data.sepal_length,
        data.sepal_width,
        data.petal_length,
        data.petal_width
    ]]

    prediction = int(model.predict(features)[0])

    latency = time.time() - start_time
    REQUEST_LATENCY.observe(latency)

    return {
        "prediction": prediction
    }

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

---

# 17. Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

# 18. GitHub Actions CI — `.github/workflows/ci.yml`

```yaml
name: MLOps CI

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  test-and-build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run training
        run: |
          python src/train.py

      - name: Run tests
        run: |
          pytest tests/ || true

      - name: Build Docker image
        run: |
          docker build -t mlops-api .
```

---

# 19. `.gitignore`

```text
__pycache__/
*.pyc
.env
venv/
.venv/
.ipynb_checkpoints/
mlruns/
.DS_Store

# DVC-tracked large files
/data/raw/*
/data/processed/*
/models/*
!/data/raw/.gitkeep
!/data/processed/.gitkeep
!/models/.gitkeep
```

---

# 20. All Important MLOps Commands Cheat Sheet

## Git Commands

```bash
git init
git status
git add .
git commit -m "message"
git log --oneline
git checkout -b new-branch
git switch main
git merge new-branch
git remote add origin repo-url
git push origin main
git pull origin main
```

---

## GitHub Commands

```bash
git clone repo-url
git remote -v
git push origin branch-name
git pull origin main
```

---

## MLflow Commands

```bash
pip install mlflow
mlflow ui
mlflow server --host 0.0.0.0 --port 5000
mlflow experiments list
mlflow run .
```

---

## DVC Commands

```bash
pip install dvc
dvc init
dvc add data/raw/dataset.csv
dvc add models/model.pkl
dvc remote add -d myremote /tmp/dvc-storage
dvc push
dvc pull
dvc status
dvc repro
dvc metrics show
dvc plots show
dvc dag
dvc checkout
```

---

## Docker Commands

```bash
docker --version
docker build -t ml-api .
docker images
docker run -p 8000:8000 ml-api
docker ps
docker ps -a
docker logs container_id
docker stop container_id
docker rm container_id
docker rmi image_id
docker exec -it container_id bash
```

---

## Kubernetes Commands

```bash
kubectl version
kubectl cluster-info
kubectl get nodes
kubectl get pods
kubectl get deployments
kubectl get services
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl describe pod pod_name
kubectl logs pod_name
kubectl scale deployment ml-api-deployment --replicas=3
kubectl rollout status deployment/ml-api-deployment
kubectl rollout undo deployment/ml-api-deployment
kubectl delete -f deployment.yaml
```

---

# 21. MLOps Tools Summary Table

| Tool | Use in MLOps |
|---|---|
| Git | Code version control |
| GitHub | Remote repository and collaboration |
| MLflow | Experiment tracking and model registry |
| DVC | Data/model version control |
| Docker | Containerization |
| GitHub Actions | CI/CD automation |
| Kubernetes | Container orchestration |
| Prometheus | Metrics collection |
| Grafana | Monitoring dashboard |
| FastAPI | ML model API |
| Cloud | Production deployment |

---

# 22. Most Asked MLOps Interview Questions

## Q1. What is MLOps?

MLOps is the practice of managing the complete ML lifecycle, including data, code, experiments, model deployment, monitoring, and retraining.

---

## Q2. Why is MLOps important?

MLOps is important because ML models need versioning, reproducibility, deployment automation, monitoring, and retraining in production.

---

## Q3. Git vs DVC?

| Git | DVC |
|---|---|
| Tracks code | Tracks data and model files |
| Good for small text files | Good for large ML files |
| Stores code history | Stores data/model version history |
| Used by developers | Used by ML/data teams |

---

## Q4. What is MLflow?

MLflow is used to track experiments, log parameters and metrics, save models, and manage model versions.

---

## Q5. What is model registry?

A model registry is a central place to store, version, review, promote, and manage machine learning models.

---

## Q6. What is Docker?

Docker packages an application and its dependencies into a container so it runs the same everywhere.

---

## Q7. What is CI/CD?

CI/CD automates testing, building, and deployment whenever code changes.

---

## Q8. What is Kubernetes?

Kubernetes manages containerized applications at scale. It handles deployment, scaling, service exposure, and recovery.

---

## Q9. What is model monitoring?

Model monitoring means tracking model performance, data drift, prediction quality, latency, and errors after deployment.

---

## Q10. What is data drift?

Data drift happens when production input data becomes different from training data.

---

## Q11. What is model drift?

Model drift happens when model performance decreases over time because real-world patterns change.

---

# 23. Final Interview Summary

```text
MLOps is the combination of Machine Learning and DevOps. It helps manage the complete ML lifecycle from data preparation to deployment and monitoring.

Git is used for code versioning, while GitHub is used for remote collaboration and CI/CD.

DVC is used for versioning datasets, models, and ML pipelines.

MLflow is used for experiment tracking, logging parameters, metrics, artifacts, and managing model versions through Model Registry.

Docker is used to containerize ML applications so they run consistently everywhere.

CI/CD automates testing, building, and deployment using tools like GitHub Actions.

Kubernetes is used to deploy and scale containerized ML APIs in production.

Monitoring is used to track API health, latency, errors, data drift, model drift, and business performance.

Model versioning helps compare, reproduce, rollback, and promote models safely.
```

## One-Line Interview Answer

```text
In an MLOps project, I use Git and GitHub for code versioning, DVC for data and model versioning, MLflow for experiment tracking and model registry, Docker for containerization, GitHub Actions for CI/CD, Kubernetes for scalable deployment, and monitoring tools like Prometheus and Grafana to track model and system performance in production.
```
