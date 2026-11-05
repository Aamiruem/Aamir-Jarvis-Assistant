# Lecture 08: Deployment, MLOps and Projects

## Model deployment
After a model is trained, it should be made available to users through APIs or web apps.

```python
from fastapi import FastAPI

app = FastAPI()

@app.get('/health')
def health():
    return {'status': 'ok'}
```

## Flask and FastAPI
Typical deployment options:
- Flask for lightweight APIs
- FastAPI for modern, typed APIs
- Docker for containerization
- cloud deployment for scaling

## Monitoring and drift
Models need monitoring after deployment for:
- prediction drift
- sudden data shifts
- model accuracy feedback
- failures in real-world use

## Project roadmap
A complete ML project usually contains:
1. problem statement
2. data collection
3. data cleaning and EDA
4. feature engineering
5. model training
6. evaluation
7. deployment
8. monitoring and retraining

## Recommended final project ideas
- churn prediction model
- house price prediction app
- sentiment analysis dashboard
- customer segmentation system
- fraud detection pipeline

## Summary
The full ML lifecycle is not just model creation. It includes productionization, monitoring, maintenance, and continuous improvement. This is where strong engineering and data science skills meet.

## Interview note
A good answer is: “Production ML is not only about accuracy; it also includes reliability, scalability, monitoring, and maintaining trust in the deployed system.”
