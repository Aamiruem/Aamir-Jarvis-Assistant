# Lecture 04: Supervised Learning Algorithms

## Linear regression
Linear regression models a relationship between input features and a continuous target.

```python
from sklearn.linear_model import LinearRegression

X = [[1],[2],[3],[4],[5]]
y = [3, 5, 7, 9, 11]

model = LinearRegression()
model.fit(X, y)
print(model.predict([[6]]))
```

## Logistic regression
Used for binary classification problems.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)
print(model.predict(X_test))
```

## Decision tree
A decision tree splits data based on feature values.

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(max_depth=3)
model.fit(X_train, y_train)
```

## Random forest
An ensemble of multiple trees improves stability and reduces overfitting.

```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
```

## Model selection
Common factors to compare:
- accuracy
- precision
- recall
- training time
- generalization quality

## Summary
Supervised learning uses labeled data to make predictions. Different algorithms suit different problem types, and the right choice depends on the dataset and business problem.

## Interview note
A common question is: “When would you use logistic regression instead of linear regression?” The key difference is target variable type: continuous for regression and categorical for classification.
