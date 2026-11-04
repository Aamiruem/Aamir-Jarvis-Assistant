# Machine Learning Fundamentals and Algorithms

## What is Machine Learning?

Machine Learning is a way to allow computers to learn patterns from data and make predictions or decisions without hard-coded rules for every situation.

A simple example:

- if you show a model thousands of emails labeled as spam or not spam, it learns the pattern of spam messages
- later it can classify new emails automatically

## Supervised Learning

Supervised learning learns from labeled examples.

### Regression
Regression predicts continuous numerical values.

Examples:
- price prediction
- temperature forecasting
- sales estimation

Popular algorithms:
- linear regression
- polynomial regression
- decision tree regressor
- random forest regressor

### Classification
Classification predicts categories or labels.

Examples:
- spam/not spam
- disease/no disease
- cat/dog

Popular algorithms:
- logistic regression
- decision trees
- support vector machines
- k-nearest neighbors
- naive Bayes

## Unsupervised Learning

Unsupervised learning works without labels. The goal is to discover hidden patterns.

### Clustering
Clustering groups similar items together.

Examples:
- customer segmentation
- document grouping
- image grouping

Popular algorithms:
- k-means
- hierarchical clustering
- DBSCAN

### Dimensionality Reduction
This reduces the number of features while keeping important information.

Examples:
- PCA for data compression
- feature extraction for large datasets

## Feature Engineering

Feature engineering means preparing the input data so that the model can learn better.

Important ideas:

- remove missing or incorrect data
- convert categories to numeric representation
- normalize or scale numerical features
- create useful new features from existing data
- avoid leakage between train and test sets

## Model Training

Training is the process of adjusting model parameters to minimize the error between predicted values and actual values.

### Training process
1. Split data into training and test sets
2. Choose a model
3. Feed training data into the model
4. Measure errors
5. Update parameters to reduce error
6. Repeat until performance is satisfactory

### Overfitting
A model fits training data too closely and performs poorly on new data.

### Underfitting
A model is too simple and cannot learn the pattern well.

## Evaluation Metrics

### Classification Metrics
- accuracy
- precision
- recall
- F1-score
- confusion matrix
- ROC-AUC

### Regression Metrics
- MAE (Mean Absolute Error)
- MSE (Mean Squared Error)
- RMSE (Root Mean Squared Error)
- R-squared

## Decision Tree and Ensemble Models

### Decision Tree
A decision tree splits data based on feature values to make decisions.

### Random Forest
Random forest combines many decision trees to improve stability and accuracy.

### Gradient Boosting
Gradient boosting creates a series of small models that correct previous mistakes.

Examples:
- XGBoost
- LightGBM
- CatBoost

## Key ML Principle

The goal of machine learning is not only to train a model, but to build a model that generalizes well to new data. Good machine learning solutions balance accuracy, speed, explainability, and deployment readiness.
