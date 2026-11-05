# Lecture 05: Unsupervised Learning and Ensembles

## K-means clustering
K-means groups similar data points into clusters.

```python
from sklearn.cluster import KMeans

X = [[1,2],[1,4],[10,2],[10,4]]
model = KMeans(n_clusters=2, random_state=42)
labels = model.fit_predict(X)
print(labels)
```

## PCA
Principal Component Analysis reduces dimensionality while preserving important variation.

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X)
```

## Bagging and boosting
Ensemble learning combines multiple models to improve performance.

- bagging: builds multiple models independently, then averages or votes
- boosting: builds models in sequence, fixing mistakes from earlier models

## XGBoost
XGBoost is a powerful boosting library often used in tabular ML competitions.

```python
import xgboost as xgb

model = xgb.XGBClassifier()
model.fit(X_train, y_train)
```

## Hyperparameter tuning
Important tuning parameters include:
- learning rate
- number of trees
- max depth
- regularization strength

## Summary
Unsupervised learning finds hidden structure without labels, while ensembles often give stronger performance than single models. In many real projects, a tuned ensemble is a strong baseline.

## Interview note
A strong explanation between bagging and boosting is: bagging reduces variance by training independent learners, while boosting reduces bias by focusing on hard examples.
