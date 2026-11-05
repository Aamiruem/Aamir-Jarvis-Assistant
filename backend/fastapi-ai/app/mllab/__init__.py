"""ML Lab: classic machine learning inside Azarvis.

    data.py      CSV -> typed table, and an exploratory profile (EDA)
    automl.py    preprocessing pipeline, model comparison with cross-validation, tuning,
                 held-out test evaluation, feature importance, clustering and PCA
    registry.py  saved models with a model card, an experiment log, prediction with drift checks
    housing.py   the flagship project: house price prediction on California census data
    jobs.py      training runs in the background; the app polls for progress

Accuracy is always measured on data the model never saw while training (the test split),
so the numbers on a model card are what to expect on new data. No model is 100% accurate.
"""
