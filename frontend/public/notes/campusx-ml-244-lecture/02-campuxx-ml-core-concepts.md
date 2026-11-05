# Lecture 02: ML Core Concepts and Workflow

## What is machine learning?
Machine learning is a branch of AI where systems learn patterns from data instead of being explicitly programmed for every rule.

The general workflow is:
1. collect data
2. clean and prepare data
3. split the dataset
4. choose an algorithm
5. train the model
6. evaluate the model
7. deploy or improve it

## Supervised learning
Model learns from labeled examples.

Examples:
- house price prediction
- spam detection
- handwritten digit classification

```python
from sklearn.linear_model import LinearRegression

X = [[1], [2], [3], [4]]
y = [2, 4, 6, 8]
model = LinearRegression()
model.fit(X, y)
print(model.predict([[5]]))
```

## Unsupervised learning
Model learns patterns without labels.

Examples:
- customer segmentation
- anomaly detection
- topic grouping

## Train-test split
We usually divide the data so the model is trained on some examples and tested on unseen ones.

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```

## Loss function
A loss function measures how wrong the model is.

Common examples:
- Mean Squared Error (MSE) for regression
- Cross-entropy for classification

## Model evaluation
For classification, common metrics are:
- accuracy
- precision
- recall
- F1-score

For regression, common metrics are:
- MAE
- MSE
- RMSE

## Bias-variance tradeoff
A model should not be too simple or too complex.

- High bias: underfitting
- High variance: overfitting

## Summary
The core machine learning idea is learning from data and improving performance on unseen examples. The quality of the data and the model choice heavily influence the result.

## Interview note
A common question is: “What is the difference between supervised and unsupervised learning?” The answer: supervised uses labeled data; unsupervised finds structure without labels.
