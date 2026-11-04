# ML Lab: classic machine learning inside Jarvis

Open the **ML Lab** tab, or just ask Jarvis ("what would a home in Los Angeles cost?",
"use my churn model on a monthly customer with 6 support calls").

## What happens when you train

Code: [backend/fastapi-ai/app/mllab/](../backend/fastapi-ai/app/mllab/)

| Step | What it does | Roadmap topic |
|---|---|---|
| Read & profile | CSV → typed columns; missing values, mean/median, outliers (IQR), unique counts, correlation with the target; ID-like and constant columns are left out | Python, NumPy, statistics, EDA |
| Split | 80% train, 20% test (stratified for classes). Test rows are untouched until the end | Training/testing |
| Pipeline | Numbers: median imputation (+ missing flags) and scaling. Text: one-hot categories, rare ones grouped, missing as its own category. Fitted inside every fold, so nothing leaks | Feature engineering, data leakage |
| Compare | Ridge / logistic regression, KNN, decision tree, random forest, gradient boosting (LightGBM-style histogram boosting), XGBoost, SVM (up to 5,000 rows); 5-fold cross-validation, mean ± spread | Supervised learning, cross-validation |
| Tune | Randomized hyperparameter search on the winner | Hyperparameter tuning |
| Test | One score on the held-out rows, next to a naive baseline it must beat; train vs validation gap → good fit / overfitting / underfitting | Model evaluation, over/underfitting |
| Explain | Permutation feature importance; an error band from the test residuals | Feature selection, model evaluation |
| Explore | PCA (directions holding 90% of the variation) and K-means segments (k by silhouette, outlier-resistant) | Unsupervised learning |
| Track | Model card (`card.json`) + pipeline (`model.joblib`) per model; every run appended to `runs.jsonl` (shown as the experiment log) | MLOps: experiment tracking, model registry |
| Predict | Input checks: unknown columns, values far outside the training range, unseen categories → warnings with the prediction | Model monitoring, drift detection |

Regression metrics: R², MAE, RMSE. Classification: accuracy, macro F1, ROC-AUC (two classes), confusion matrix.

## Accuracy

No model is 100% accurate on real data; a score of 100% almost always means the model was tested on
rows it had already seen. Every number ML Lab shows comes from the 20% of rows held back from
training, which is the honest estimate for new data.

## Built-in project: house price prediction

California housing (1990 US census, 20,640 neighborhoods, downloaded once by scikit-learn) with
two engineered features (rooms per person, bedroom share). Trained automatically the first time
ML Lab is opened (about 5 minutes on a laptop). Result on this PC:

| Model | 5-fold CV R² |
|---|---|
| **XGBoost (tuned)** | **0.842 ± 0.003**, test R² **0.858**, typical error ±$28,400 |
| Gradient boosting | 0.834 |
| Random forest | 0.803 |
| K-nearest neighbors | 0.741 |
| Decision tree | 0.689 |
| Ridge regression | 0.669 |
| Always guess the average | 0.00 (±$90,700) |

Each row is a neighborhood, not one house, and values above $500,000 were recorded as $500,000.

## API

`/api/ai/mllab/...` through the gateway (see [routers/mllab.py](../backend/fastapi-ai/app/routers/mllab.py)):
`POST datasets` (upload CSV), `GET datasets/{id}/profile`, `POST datasets/{id}/train`, `GET jobs/{id}`,
`GET models`, `GET models/{id}`, `POST models/{id}/predict`, `DELETE models/{id}`, `GET runs`,
`GET house-price`, `POST house-price/predict`. Jarvis's agent tools: `predict_house_price`,
`list_ml_models`, `predict_with_model`.

## Windows note

pandas' compiled files are blocked by Smart App Control on this PC, so ML Lab reads CSVs with
Python's `csv` module and NumPy. A newly installed scikit-learn or XGBoost file can also be blocked
the very first time it loads; running again works. XGBoost is optional: if it can't load, the
other six algorithms still run.

## Next projects on the roadmap

Stock forecasting (time series, LSTM vs XGBoost, walk-forward validation, with the caveat that
prices are close to unpredictable), real-time distraction detection (OpenCV + MediaPipe), a
multi-agent workflow, and MLflow/DVC, Redis caching and Kubernetes manifests for deployment.
