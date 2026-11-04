> **You asked:**
>
> Phase 15: Model Deployment
> Save Model (Pickle, Joblib)
> Flask
> FastAPI
> Streamlit
> Docker Basics
> REST API
> Deploy on Cloud (AWS, Azure, GCP) explain all concept with code and use of template and all types

I’ll make this deployment module practical: saving models, building APIs with Flask/FastAPI, making Streamlit apps, Docker basics, REST API concepts, cloud deployment flow, and ready project templates.

# Phase 15: Model Deployment  
# Save Model, Flask, FastAPI, Streamlit, Docker, REST API, Cloud Deployment

Model deployment means making your trained ML model usable by other people or applications.

Simple meaning:

```text
Training model in notebook is not enough.
Deployment means users can give input and get prediction.
```

Example:

```text
Input: Experience = 3 years, Skill Score = 8
Model Output: Predicted Salary = ₹45,000
```

---

# 1. What is Model Deployment?

## Easy Definition

Model deployment is the process of putting a trained machine learning model into a real application so users or other systems can use it.

Example:

```text
ML model trained in Jupyter Notebook
        ↓
Saved as model.pkl
        ↓
Loaded in Flask/FastAPI/Streamlit
        ↓
User gives input
        ↓
Model returns prediction
```

## Interview Answer

Model deployment is the process of integrating a trained machine learning model into a production environment where it can receive input data and return predictions.

---

# 2. Complete ML Deployment Flow

```text
1. Train ML model
2. Evaluate model
3. Save model using Pickle or Joblib
4. Create prediction app/API
5. Test locally
6. Add requirements.txt
7. Dockerize if needed
8. Deploy on cloud
9. Monitor predictions and errors
```

---

# 3. Types of Model Deployment

| Deployment Type | Meaning | Example |
|---|---|---|
| Local deployment | Run on your laptop | Jupyter/Flask local |
| Web app deployment | User enters input on UI | Streamlit app |
| REST API deployment | Other apps call your model | Flask/FastAPI API |
| Batch prediction | Predict many rows at once | Daily sales forecast |
| Real-time prediction | Instant prediction | Fraud detection |
| Docker deployment | App inside container | Dockerized FastAPI |
| Cloud deployment | App hosted online | AWS/Azure/GCP |

---

# 4. Save Model Using Pickle

## Easy Definition

Pickle saves a Python object into a file.

Simple meaning:

```text
Trained model → model.pkl file
```

Scikit-learn’s model persistence guide explains that Python’s `pickle`, `joblib`, and `cloudpickle` can serialize models, and notes that `joblib` is often more efficient than pickle for large NumPy arrays or large ML models. citeturn175543search0

---

## Train and Save Model with Pickle

```python
import pickle
import pandas as pd

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split

# Sample data
df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6],
    "Skill_Score": [5, 6, 7, 8, 8, 9],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

# Train model
model = LinearRegression()
model.fit(X, y)

# Save model
with open("salary_model.pkl", "wb") as file:
    pickle.dump(model, file)

print("Model saved successfully")
```

---

## Load Model with Pickle

```python
import pickle

# Load model
with open("salary_model.pkl", "rb") as file:
    model = pickle.load(file)

# Predict
prediction = model.predict([[3, 8]])

print("Predicted Salary:", prediction[0])
```

---

## Important Security Point

Never load a pickle file from an unknown or untrusted source. Pickle can execute Python object-loading logic, so only load files you created or trust. Scikit-learn’s model persistence documentation discusses security and maintainability issues when using pickle-style serialization. citeturn175543search4

---

# 5. Save Model Using Joblib

## Easy Definition

Joblib is commonly used to save scikit-learn models.

Simple meaning:

```text
Joblib is better for large ML models and NumPy arrays.
```

---

## Save Model with Joblib

```python
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestRegressor

df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6],
    "Skill_Score": [5, 6, 7, 8, 8, 9],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

model = RandomForestRegressor(random_state=42)
model.fit(X, y)

joblib.dump(model, "salary_model.joblib")

print("Model saved successfully")
```

---

## Load Model with Joblib

```python
import joblib

model = joblib.load("salary_model.joblib")

prediction = model.predict([[3, 8]])

print("Predicted Salary:", prediction[0])
```

---

# 6. Pickle vs Joblib

| Pickle | Joblib |
|---|---|
| Python built-in module | External library |
| Good for general Python objects | Good for ML models |
| Can be slower for large arrays | Efficient for large NumPy arrays |
| File extension: `.pkl` | File extension: `.joblib` |

## Interview Answer

Pickle and Joblib are used to save trained machine learning models. Pickle is a general Python serialization module, while Joblib is commonly preferred for large scikit-learn models and NumPy arrays.

---

# 7. Save Complete Pipeline

Best practice is to save the complete preprocessing + model pipeline.

Why?

```text
If you scale data during training,
you must apply same scaling during prediction.
```

---

## Pipeline Save Code

```python
import joblib
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6],
    "Skill_Score": [5, 6, 7, 8, 8, 9],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LinearRegression())
])

pipeline.fit(X, y)

joblib.dump(pipeline, "salary_pipeline.joblib")
```

## Load Pipeline

```python
import joblib

pipeline = joblib.load("salary_pipeline.joblib")

prediction = pipeline.predict([[3, 8]])

print(prediction[0])
```

## Interview Answer

Saving the complete pipeline is better than saving only the model because preprocessing steps like scaling, encoding, and imputation must be applied exactly the same during prediction.

---

# 8. REST API

## Easy Definition

REST API is a way for applications to communicate using HTTP.

Simple meaning:

```text
Client sends request → Server returns response
```

Example:

```text
Frontend app sends customer data
        ↓
ML API receives data
        ↓
Model predicts result
        ↓
API returns prediction
```

---

## Common HTTP Methods

| Method | Use |
|---|---|
| GET | Read data |
| POST | Send data and get result |
| PUT | Update data |
| DELETE | Delete data |

For ML prediction, we mostly use:

```text
POST
```

Because we send input data to the model.

---

## REST API Example

Request:

```json
{
  "experience": 3,
  "skill_score": 8
}
```

Response:

```json
{
  "predicted_salary": 52000
}
```

## Interview Answer

REST API is an interface that allows different applications to communicate over HTTP. In ML deployment, REST APIs are used to send input data to the model and receive predictions.

---

# 9. Flask

## Easy Definition

Flask is a lightweight Python web framework used to build web apps and APIs.

Simple meaning:

```text
Flask helps convert ML model into a web API.
```

Flask’s official quickstart shows that a Flask app can be run using the `flask` command or `python -m flask`, and if the file is named `app.py`, Flask can discover it automatically. citeturn175543search1

---

## Flask Folder Template

```text
flask_ml_app/
│
├── app.py
├── salary_pipeline.joblib
├── requirements.txt
└── templates/
    └── index.html
```

---

## Flask API Code — `app.py`

```python
from flask import Flask, request, jsonify
import joblib

app = Flask(__name__)

# Load saved model/pipeline
model = joblib.load("salary_pipeline.joblib")

@app.route("/")
def home():
    return "ML Model API is running"

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()

        experience = data["experience"]
        skill_score = data["skill_score"]

        prediction = model.predict([[experience, skill_score]])

        return jsonify({
            "predicted_salary": float(prediction[0])
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 400

if __name__ == "__main__":
    app.run(debug=True)
```

---

## Flask Requirements File

```text
flask
scikit-learn
joblib
pandas
numpy
```

---

## Run Flask App

```bash
python app.py
```

Or:

```bash
flask --app app run
```

---

## Test Flask API

Using Python:

```python
import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "experience": 3,
    "skill_score": 8
}

response = requests.post(url, json=data)

print(response.json())
```

---

## Flask Interview Answer

Flask is a lightweight Python framework used to create web applications and REST APIs. In ML deployment, Flask can load a saved model and expose a prediction endpoint.

---

# 10. Flask with HTML Form Template

## `templates/index.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Salary Prediction</title>
</head>
<body>
    <h2>Salary Prediction App</h2>

    <form action="/predict_form" method="post">
        <label>Experience:</label>
        <input type="number" name="experience" step="0.1" required>
        <br><br>

        <label>Skill Score:</label>
        <input type="number" name="skill_score" step="0.1" required>
        <br><br>

        <button type="submit">Predict</button>
    </form>

    {% if prediction %}
        <h3>Predicted Salary: {{ prediction }}</h3>
    {% endif %}
</body>
</html>
```

## Flask App with Template

```python
from flask import Flask, render_template, request
import joblib

app = Flask(__name__)

model = joblib.load("salary_pipeline.joblib")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict_form", methods=["POST"])
def predict_form():
    experience = float(request.form["experience"])
    skill_score = float(request.form["skill_score"])

    prediction = model.predict([[experience, skill_score]])[0]

    return render_template(
        "index.html",
        prediction=round(prediction, 2)
    )

if __name__ == "__main__":
    app.run(debug=True)
```

---

# 11. FastAPI

## Easy Definition

FastAPI is a modern Python framework used to build fast APIs.

Simple meaning:

```text
FastAPI is very good for ML model APIs.
```

FastAPI automatically generates OpenAPI-based interactive documentation, which powers built-in API docs for testing endpoints. citeturn175543search2

---

## Why FastAPI?

```text
Fast
Modern
Automatic API docs
Good validation using Pydantic
Production-friendly
Easy for ML APIs
```

FastAPI’s own documentation also explains that `fastapi dev` can detect the app in `main.py` and start a development server using Uvicorn. citeturn175543search6

---

## FastAPI Folder Template

```text
fastapi_ml_app/
│
├── main.py
├── salary_pipeline.joblib
└── requirements.txt
```

---

## FastAPI Code — `main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI(title="Salary Prediction API")

model = joblib.load("salary_pipeline.joblib")

class SalaryInput(BaseModel):
    experience: float
    skill_score: float

@app.get("/")
def home():
    return {"message": "ML Model API is running"}

@app.post("/predict")
def predict(data: SalaryInput):
    prediction = model.predict([[data.experience, data.skill_score]])

    return {
        "predicted_salary": float(prediction[0])
    }
```

---

## FastAPI Requirements

```text
fastapi
uvicorn
scikit-learn
joblib
pandas
numpy
```

---

## Run FastAPI App

```bash
uvicorn main:app --reload
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

---

## Test FastAPI with Python

```python
import requests

url = "http://127.0.0.1:8000/predict"

data = {
    "experience": 3,
    "skill_score": 8
}

response = requests.post(url, json=data)

print(response.json())
```

---

## FastAPI Interview Answer

FastAPI is a modern Python framework for building APIs. It is commonly used for ML model deployment because it is fast, supports data validation with Pydantic, and automatically provides interactive API documentation.

---

# 12. Flask vs FastAPI

| Flask | FastAPI |
|---|---|
| Lightweight and simple | Modern and faster |
| Good for beginners | Good for production APIs |
| Manual validation needed | Pydantic validation |
| No automatic docs by default | Automatic `/docs` |
| Good for small apps | Good for scalable APIs |

## Interview Answer

Flask is simple and beginner-friendly, while FastAPI is faster, modern, and provides automatic validation and documentation, making it a strong choice for production ML APIs.

---

# 13. Streamlit

## Easy Definition

Streamlit is a Python framework used to build interactive data apps and ML dashboards.

Simple meaning:

```text
Streamlit helps create ML web apps without HTML/CSS.
```

Streamlit describes itself as an open-source Python framework for data scientists and ML engineers to build interactive data apps in only a few lines of code. citeturn175543search7

---

## Streamlit Folder Template

```text
streamlit_ml_app/
│
├── app.py
├── salary_pipeline.joblib
└── requirements.txt
```

---

## Streamlit App Code — `app.py`

```python
import streamlit as st
import joblib

# Load model
model = joblib.load("salary_pipeline.joblib")

st.title("Salary Prediction App")
st.write("Enter employee details to predict salary.")

experience = st.number_input(
    "Experience in years",
    min_value=0.0,
    max_value=50.0,
    value=3.0
)

skill_score = st.number_input(
    "Skill Score",
    min_value=0.0,
    max_value=10.0,
    value=8.0
)

if st.button("Predict Salary"):
    prediction = model.predict([[experience, skill_score]])[0]

    st.success(f"Predicted Salary: ₹{prediction:,.2f}")
```

---

## Streamlit Requirements

```text
streamlit
scikit-learn
joblib
pandas
numpy
```

---

## Run Streamlit App

```bash
streamlit run app.py
```

Streamlit’s official docs also show that `python -m streamlit run your_script.py` is equivalent to `streamlit run your_script.py`. citeturn175543search3

---

## Streamlit Interview Answer

Streamlit is used to build interactive ML web applications quickly using only Python. It is useful for dashboards, model demos, and data science projects.

---

# 14. Flask vs FastAPI vs Streamlit

| Tool | Best Use | User Interface? | API? |
|---|---|---:|---:|
| Flask | Small web app/API | Yes, with HTML | Yes |
| FastAPI | Production REST API | No by default | Yes |
| Streamlit | ML dashboard/demo | Yes | Not mainly |
| Django | Large web apps | Yes | Yes |
| Gradio | ML demos | Yes | Limited |

---

# 15. Docker Basics

## Easy Definition

Docker packages your app, code, libraries, and environment into a container.

Simple meaning:

```text
Works on my laptop
Works on server also
```

Docker’s Python guide teaches how to containerize a Python app using a Dockerfile, and Docker’s Dockerfile docs describe a Dockerfile as a text document with instructions used to build a container image. citeturn512010search0turn512010search8

---

## Important Docker Terms

| Term | Easy Meaning |
|---|---|
| Dockerfile | Instructions to build image |
| Image | App package/template |
| Container | Running image |
| Port | Door for app access |
| Build | Create image |
| Run | Start container |

---

## Docker Folder Template

```text
docker_fastapi_app/
│
├── main.py
├── salary_pipeline.joblib
├── requirements.txt
└── Dockerfile
```

---

## Dockerfile for FastAPI

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Build Docker Image

```bash
docker build -t salary-api .
```

---

## Run Docker Container

```bash
docker run -p 8000:8000 salary-api
```

Now open:

```text
http://127.0.0.1:8000/docs
```

---

## Dockerfile for Streamlit

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8501

CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0"]
```

Run:

```bash
docker build -t salary-streamlit .
docker run -p 8501:8501 salary-streamlit
```

---

## Docker Interview Answer

Docker is a containerization tool that packages an application with all dependencies so it can run consistently across different environments.

---

# 16. Requirements File Template

For Flask:

```text
flask
gunicorn
scikit-learn
joblib
pandas
numpy
```

For FastAPI:

```text
fastapi
uvicorn
gunicorn
scikit-learn
joblib
pandas
numpy
```

For Streamlit:

```text
streamlit
scikit-learn
joblib
pandas
numpy
```

For advanced ML:

```text
xgboost
lightgbm
catboost
tensorflow
torch
transformers
```

---

# 17. Production Folder Template

Best structure:

```text
ml_deployment_project/
│
├── app/
│   ├── main.py
│   ├── schemas.py
│   ├── predictor.py
│   └── __init__.py
│
├── models/
│   └── salary_pipeline.joblib
│
├── notebooks/
│   └── training.ipynb
│
├── data/
│   └── salary.csv
│
├── tests/
│   └── test_api.py
│
├── requirements.txt
├── Dockerfile
├── README.md
└── .gitignore
```

---

# 18. Professional FastAPI Template

## `app/schemas.py`

```python
from pydantic import BaseModel

class SalaryInput(BaseModel):
    experience: float
    skill_score: float

class SalaryOutput(BaseModel):
    predicted_salary: float
```

---

## `app/predictor.py`

```python
import joblib
from pathlib import Path

MODEL_PATH = Path("models/salary_pipeline.joblib")

model = joblib.load(MODEL_PATH)

def predict_salary(experience: float, skill_score: float) -> float:
    prediction = model.predict([[experience, skill_score]])
    return float(prediction[0])
```

---

## `app/main.py`

```python
from fastapi import FastAPI
from app.schemas import SalaryInput, SalaryOutput
from app.predictor import predict_salary

app = FastAPI(title="Salary Prediction API")

@app.get("/")
def home():
    return {"message": "Salary Prediction API is running"}

@app.post("/predict", response_model=SalaryOutput)
def predict(data: SalaryInput):
    salary = predict_salary(data.experience, data.skill_score)

    return SalaryOutput(predicted_salary=salary)
```

---

## Run

```bash
uvicorn app.main:app --reload
```

---

# 19. Deploy on Cloud

There are many deployment choices:

| Cloud | Good Service for ML API |
|---|---|
| AWS | Elastic Beanstalk, EC2, ECS, Lambda, SageMaker |
| Azure | App Service, Container Apps, AKS, Azure ML |
| GCP | Cloud Run, App Engine, Compute Engine, Vertex AI |

---

# 20. AWS Deployment

## Common AWS Options

| AWS Service | Use |
|---|---|
| Elastic Beanstalk | Easy Flask/FastAPI deployment |
| EC2 | Full server control |
| ECS/Fargate | Docker container deployment |
| Lambda | Serverless small APIs |
| SageMaker | ML model training/deployment |

AWS Elastic Beanstalk can deploy web applications on supported platforms and handles infrastructure tasks such as provisioning EC2 instances, load balancing, health monitoring, and scaling. citeturn512010search5

---

## AWS Elastic Beanstalk Flask Deployment Flow

AWS has an official tutorial for deploying a Flask application to Elastic Beanstalk using a Python virtual environment, Flask app, and EB CLI. citeturn512010search1

Project files:

```text
aws_flask_app/
│
├── application.py
├── salary_pipeline.joblib
└── requirements.txt
```

Important: Elastic Beanstalk often expects Flask app object as:

```python
application = Flask(__name__)
```

Example:

```python
from flask import Flask, request, jsonify
import joblib

application = Flask(__name__)

model = joblib.load("salary_pipeline.joblib")

@application.route("/")
def home():
    return "AWS Flask ML API running"

@application.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    prediction = model.predict([[
        data["experience"],
        data["skill_score"]
    ]])

    return jsonify({
        "predicted_salary": float(prediction[0])
    })

if __name__ == "__main__":
    application.run()
```

---

# 21. Azure Deployment

## Common Azure Options

| Azure Service | Use |
|---|---|
| Azure App Service | Deploy Flask/FastAPI web apps |
| Azure Container Apps | Deploy containerized apps |
| Azure Kubernetes Service | Large-scale container orchestration |
| Azure Machine Learning | ML lifecycle and model serving |

Azure’s Python App Service quickstart covers deploying Django, Flask, and FastAPI apps; for FastAPI, it shows using Gunicorn with Uvicorn workers as the startup command. citeturn857790search0

---

## Azure FastAPI Startup Command

```bash
gunicorn -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 main:app
```

Azure’s docs also explain that custom startup commands can be configured in App Service either through the Azure portal or Azure CLI. citeturn857790search1

---

## Azure Container Deployment Flow

Azure also provides tutorials for deploying Flask/FastAPI apps as containers to Azure App Service or Azure Container Apps using Docker and Azure CLI. citeturn857790search2turn857790search9

Basic flow:

```text
1. Create Dockerfile
2. Build Docker image
3. Push image to Azure Container Registry
4. Deploy container to Azure App Service or Container Apps
5. Set port and environment variables
```

---

# 22. GCP Deployment

## Common GCP Options

| GCP Service | Use |
|---|---|
| Cloud Run | Deploy containerized APIs |
| App Engine | Deploy web apps |
| Compute Engine | Virtual machine deployment |
| Vertex AI | ML training/deployment |
| GKE | Kubernetes deployment |

Google Cloud Run is a fully managed platform for running scalable containerized apps written in languages such as Python, Java, Node.js, Go, .NET, and Ruby. citeturn512010search7

---

## GCP Cloud Run Deployment Flow

Google Cloud Run docs include quickstarts for deploying containers and running stateless containerized services. citeturn512010search3turn512010search11

Basic flow:

```text
1. Create FastAPI/Flask app
2. Add Dockerfile
3. Build container image
4. Push image to Google Artifact Registry
5. Deploy to Cloud Run
6. Get public URL
```

---

# 23. Simple Cloud Deployment Commands Concept

## Docker Build

```bash
docker build -t salary-api .
```

## Docker Run Local

```bash
docker run -p 8000:8000 salary-api
```

## Cloud Deployment General Flow

```text
Local Code
   ↓
Docker Image
   ↓
Container Registry
   ↓
Cloud Service
   ↓
Public URL
```

---

# 24. Environment Variables

## Easy Definition

Environment variables store secret/config values outside code.

Examples:

```text
API_KEY
DATABASE_URL
MODEL_PATH
PORT
```

Code:

```python
import os

model_path = os.getenv("MODEL_PATH", "models/salary_pipeline.joblib")
```

Why use environment variables?

```text
Do not hardcode passwords or secret keys in code.
```

---

# 25. `.gitignore` Template

```text
__pycache__/
*.pyc
.env
venv/
.venv/
models/*.pkl
models/*.joblib
.ipynb_checkpoints/
.DS_Store
```

Important:

```text
Do not push secret keys or large model files accidentally.
```

---

# 26. README Template

```markdown
# Salary Prediction API

This project deploys a machine learning model using FastAPI.

## Features

- Trained ML model
- Saved pipeline using Joblib
- REST API prediction endpoint
- Docker support

## Run Locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Endpoint

POST `/predict`

Request:

```json
{
  "experience": 3,
  "skill_score": 8
}
```

Response:

```json
{
  "predicted_salary": 52000
}
```

## Docker

```bash
docker build -t salary-api .
docker run -p 8000:8000 salary-api
```
```

---

# 27. Complete Mini Project: Salary Prediction Deployment

## Step 1: Train Model

```python
# train_model.py

import joblib
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression

df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6],
    "Skill_Score": [5, 6, 7, 8, 8, 9],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", LinearRegression())
])

pipeline.fit(X, y)

joblib.dump(pipeline, "salary_pipeline.joblib")

print("Model trained and saved")
```

Run:

```bash
python train_model.py
```

---

## Step 2: FastAPI App

```python
# main.py

from fastapi import FastAPI
from pydantic import BaseModel
import joblib

app = FastAPI(title="Salary Prediction API")

model = joblib.load("salary_pipeline.joblib")

class InputData(BaseModel):
    experience: float
    skill_score: float

@app.get("/")
def home():
    return {"message": "API is running"}

@app.post("/predict")
def predict(data: InputData):
    prediction = model.predict([[data.experience, data.skill_score]])

    return {
        "predicted_salary": round(float(prediction[0]), 2)
    }
```

---

## Step 3: Requirements

```text
fastapi
uvicorn
scikit-learn
joblib
pandas
numpy
```

---

## Step 4: Run API

```bash
uvicorn main:app --reload
```

---

## Step 5: Test API

```python
import requests

response = requests.post(
    "http://127.0.0.1:8000/predict",
    json={
        "experience": 3,
        "skill_score": 8
    }
)

print(response.json())
```

---

# 28. Best Practices for ML Deployment

```text
1. Save preprocessing + model together as pipeline.
2. Keep train/test code separate from deployment code.
3. Validate API inputs.
4. Use requirements.txt.
5. Use Docker for consistent environment.
6. Do not expose secret keys.
7. Add error handling.
8. Log requests and errors.
9. Monitor model performance.
10. Retrain model when data changes.
```

---

# 29. Most Asked Interview Questions

## Q1. What is model deployment?

Model deployment is the process of making a trained ML model available for real-world use through an app, API, or cloud service.

---

## Q2. Why do we save a model?

We save a model so we do not need to train it again every time. We can load it and make predictions directly.

---

## Q3. Pickle vs Joblib?

```text
Pickle is a general Python serialization module.
Joblib is commonly preferred for large scikit-learn models and NumPy arrays.
```

---

## Q4. What is Flask?

Flask is a lightweight Python web framework used to build web applications and APIs.

---

## Q5. What is FastAPI?

FastAPI is a modern Python framework used to build fast REST APIs with automatic validation and documentation.

---

## Q6. Flask vs FastAPI?

```text
Flask is simple and beginner-friendly.
FastAPI is faster, modern, and provides automatic API documentation.
```

---

## Q7. What is Streamlit?

Streamlit is a Python framework used to build interactive ML and data science web apps quickly.

---

## Q8. What is REST API?

REST API allows applications to communicate over HTTP. In ML deployment, APIs receive input data and return model predictions.

---

## Q9. What is Docker?

Docker packages the application, code, dependencies, and environment into a container so it runs consistently everywhere.

---

## Q10. Why use Docker in ML deployment?

Docker avoids environment issues and makes deployment easier across local machines, servers, and cloud platforms.

---

## Q11. What cloud services can deploy ML APIs?

```text
AWS: Elastic Beanstalk, EC2, ECS, SageMaker
Azure: App Service, Container Apps, Azure ML
GCP: Cloud Run, App Engine, Vertex AI
```

---

# 30. Final Summary Table

| Concept | Easy Meaning | Use |
|---|---|---|
| Model Deployment | Make model usable | Real-world prediction |
| Pickle | Save Python object | Small model saving |
| Joblib | Save ML model efficiently | Scikit-learn models |
| Flask | Lightweight web framework | Small APIs/apps |
| FastAPI | Modern API framework | Production ML API |
| Streamlit | Interactive ML app | Dashboard/demo |
| REST API | HTTP communication | Input/output prediction |
| Docker | Containerize app | Same environment everywhere |
| AWS | Cloud platform | Elastic Beanstalk/EC2/SageMaker |
| Azure | Cloud platform | App Service/Azure ML |
| GCP | Cloud platform | Cloud Run/Vertex AI |

---

# Final Interview Summary

```text
Model deployment means making a trained machine learning model available for real users or applications.

First, I train and evaluate the model. Then I save the model using Pickle or Joblib. In production, I prefer saving the complete preprocessing pipeline with the model.

For deployment, I can use Flask or FastAPI to create REST APIs. Flask is simple and lightweight, while FastAPI is modern, fast, and provides automatic documentation.

For quick ML demos and dashboards, I use Streamlit because it creates interactive apps using only Python.

Docker is used to package the application with all dependencies so it can run consistently on any machine or cloud platform.

For cloud deployment, I can deploy on AWS using Elastic Beanstalk or EC2, on Azure using App Service or Container Apps, and on GCP using Cloud Run or Vertex AI.

In a real project, I would create a FastAPI app, load the saved model, expose a `/predict` endpoint, Dockerize the app, and deploy it to a cloud platform.
```
