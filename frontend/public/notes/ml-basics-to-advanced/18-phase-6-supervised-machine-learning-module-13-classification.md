> **You asked:**
>
> Module 13: Classification
> Logistic Regression
> KNN
> Naive Bayes
> Decision Tree
> Random Forest
> SVM
> AdaBoost
> Gradient Boosting
> XGBoost
> LightGBM
> CatBoost
> Neural Network

# Phase 6: Supervised Machine Learning  
# Module 13: Classification Algorithms

Classification means predicting a **category/class**.

Examples:

```text id="3tbdcc"
Spam or Not Spam
Disease or No Disease
Pass or Fail
Fraud or Not Fraud
Customer Churn or Not Churn
Loan Approved or Rejected
```

Classification output is usually:

```text id="ndsjws"
0 or 1
Yes or No
Class A or Class B
Multiple categories
```

---

# 1. Classification vs Regression

| Regression | Classification |
|---|---|
| Predicts number | Predicts category |
| Salary prediction | Spam detection |
| House price prediction | Disease prediction |
| Output is continuous | Output is class label |

## Interview Answer

Classification is a supervised learning technique used to predict categorical output labels.

---

# 2. Important Classification Metrics

Before algorithms, remember these terms.

## Confusion Matrix

| Actual / Predicted | Predicted Positive | Predicted Negative |
|---|---:|---:|
| Actual Positive | TP | FN |
| Actual Negative | FP | TN |

```text id="7bnmg7"
TP = True Positive
TN = True Negative
FP = False Positive
FN = False Negative
```

genui{"inference_regression_ml_learning_block_staging":{"type_id":"CONFUSION_MATRIX_METRICS","locale_override":"en-US"}}

## Metrics

```text id="iy7izj"
Accuracy  = Correct predictions / Total predictions
Precision = TP / (TP + FP)
Recall    = TP / (TP + FN)
F1 Score  = 2 × Precision × Recall / (Precision + Recall)
```

## When to Use Which Metric?

| Situation | Best Metric |
|---|---|
| Balanced classes | Accuracy |
| False positive is costly | Precision |
| False negative is costly | Recall |
| Imbalanced data | F1 Score |
| Probability ranking | ROC-AUC |

Example:

```text id="o167kd"
Disease detection → Recall is important
Spam detection → Precision is important
Fraud detection → Recall and F1 are important
```

---

# 3. Logistic Regression

## Easy Definition

Logistic Regression is a classification algorithm used mostly for binary classification.

Even though its name has “Regression”, it is used for classification.

Example:

```text id="3gz1fa"
Email → Spam or Not Spam
Student → Pass or Fail
Customer → Buy or Not Buy
```

Scikit-learn’s `LogisticRegression` implements regularized logistic regression, and regularization is applied by default. citeturn582004search1

## Main Idea

Linear Regression gives any number:

```text id="9i4gpb"
-10, 0, 5, 100
```

Logistic Regression converts output into probability between `0` and `1`.

```text id="bzt2rh"
0.85 → 85% chance of Yes
0.20 → 20% chance of Yes
```

## Sigmoid Function

```text id="1x3dim"
Sigmoid = 1 / (1 + e^-z)
```

Where:

```text id="qzlhce"
z = b0 + b1x1 + b2x2 + ...
```

## Decision Rule

```text id="ns5whd"
If probability >= 0.5 → Class 1
If probability < 0.5  → Class 0
```

genui{"inference_regression_ml_learning_block_staging":{"type_id":"CLASSIFICATION_THRESHOLD","locale_override":"en-US"}}

## Code

```python id="jvfgzj"
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

model = LogisticRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))
```

## When to Use

```text id="awiqxy"
Binary classification
Simple baseline model
Need explainable model
Linear decision boundary
```

## Interview Answer

Logistic Regression is a supervised classification algorithm that predicts class probability using the sigmoid function. It is commonly used for binary classification.

---

# 4. KNN — K-Nearest Neighbors

## Easy Definition

KNN classifies a new data point based on its nearest neighbors.

Simple meaning:

```text id="fzwh3x"
Tell me your nearest friends,
I will predict your class.
```

## Example

If `K = 5`, KNN checks 5 nearest points.

```text id="f6ivk3"
3 neighbors are Class A
2 neighbors are Class B

Prediction = Class A
```

genui{"inference_regression_ml_learning_block_staging":{"type_id":"KNN_NEIGHBOR_VOTING","locale_override":"en-US"}}

## Important Point

KNN is distance-based, so feature scaling is very important.

```text id="mgjkcj"
Age: 20 to 60
Salary: 30000 to 200000
```

Salary can dominate distance calculation if scaling is not done.

## Code

```python id="5ac8qg"
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

model = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(n_neighbors=5))
])

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="cs3s33"
Small or medium dataset
Non-linear decision boundary
Simple classification problem
```

## Limitations

```text id="9f2c0n"
Slow prediction on large data
Sensitive to scaling
Sensitive to irrelevant features
Choosing K is important
```

## Interview Answer

KNN is a lazy learning algorithm that classifies a new point based on the majority class of its K nearest neighbors.

---

# 5. Naive Bayes

## Easy Definition

Naive Bayes is a probability-based classification algorithm based on Bayes Theorem.

Simple meaning:

```text id="mxl8f2"
It calculates probability of each class
and chooses the class with highest probability.
```

## Bayes Theorem

```text id="b519kg"
P(A|B) = P(B|A) × P(A) / P(B)
```

genui{"probability_combinatorics_learning_block_staging":{"type_id":"BAYES_THEOREM","locale_override":"en-US"}}

## Why “Naive”?

It assumes all features are independent.

Example:

```text id="6imxqe"
In spam detection, it assumes each word is independent of other words.
```

This assumption is not always true, but it works well in many text problems.

## Types of Naive Bayes

| Type | Use |
|---|---|
| GaussianNB | Continuous numerical data |
| MultinomialNB | Text count data |
| BernoulliNB | Binary features |

## Code

```python id="3gbcoo"
from sklearn.naive_bayes import GaussianNB

model = GaussianNB()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
```

## When to Use

```text id="h64zro"
Text classification
Spam detection
Sentiment analysis
Fast baseline model
Small datasets
```

## Interview Answer

Naive Bayes is a probabilistic classification algorithm based on Bayes Theorem. It assumes features are independent and is commonly used in spam detection and text classification.

---

# 6. Decision Tree Classifier

## Easy Definition

Decision Tree classifies data using if-else type rules.

Simple meaning:

```text id="uem3qh"
Decision Tree = flowchart of questions
```

Example:

```text id="7othyk"
Is income > 50000?
Is age > 25?
Is credit score good?
```

Scikit-learn describes decision trees as supervised methods that learn simple decision rules from data features. citeturn582004search7

genui{"inference_regression_ml_learning_block_staging":{"type_id":"DECISION_TREE_CLASSIFICATION_PATH","locale_override":"en-US"}}

## Code

```python id="mybcy4"
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(max_depth=3, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
```

## Important Parameters

| Parameter | Meaning |
|---|---|
| `max_depth` | Maximum depth of tree |
| `min_samples_split` | Minimum samples needed to split |
| `min_samples_leaf` | Minimum samples in leaf |
| `criterion` | Gini or entropy |

## When to Use

```text id="9trpgz"
Need explainable model
Data has non-linear patterns
Feature scaling not required
Rule-based decision making
```

## Limitations

```text id="zjhqnp"
Can overfit easily
Small data changes can change tree
Less accurate than ensemble models
```

## Interview Answer

Decision Tree is a supervised algorithm that predicts classes by splitting data into decision rules. It is easy to understand but can overfit.

---

# 7. Random Forest Classifier

## Easy Definition

Random Forest is a group of many decision trees.

Simple meaning:

```text id="yr7rdx"
Decision Tree = one student
Random Forest = class of students voting
```

Final prediction:

```text id="ltm8ei"
Majority voting of all trees
```

RandomForestClassifier is an ensemble method that fits multiple decision trees and uses averaging/voting to improve predictive accuracy and control overfitting compared with a single tree. citeturn582004search0

## Code

```python id="x5hbvl"
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="erf6th"
Need strong baseline model
Tabular data
Non-linear relationship
Need feature importance
Reduce decision tree overfitting
```

## Limitations

```text id="n1empd"
Less interpretable than decision tree
Can be slower
Large model size
```

## Interview Answer

Random Forest is an ensemble classification algorithm that builds multiple decision trees and predicts the majority class. It reduces overfitting and improves accuracy.

---

# 8. SVM — Support Vector Machine

## Easy Definition

SVM finds the best boundary that separates classes.

Simple meaning:

```text id="fk15hh"
SVM draws the best line or hyperplane between classes.
```

## Key Idea

SVM tries to maximize the margin.

```text id="p0tpd7"
Margin = distance between decision boundary and nearest points
```

Nearest points are called support vectors.

## Kernels

| Kernel | Use |
|---|---|
| Linear | Linearly separable data |
| RBF | Non-linear data |
| Polynomial | Curved boundary |
| Sigmoid | Neural-like boundary |

## Code

```python id="xgrukg"
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

model = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(kernel="rbf", C=1.0, gamma="scale"))
])

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="5fyp99"
Small or medium dataset
High-dimensional data
Clear margin between classes
Non-linear classification with kernel
```

## Limitations

```text id="g7kgoj"
Can be slow on large datasets
Scaling is important
Harder to interpret
Parameter tuning is important
```

## Interview Answer

SVM is a classification algorithm that finds the best separating hyperplane with maximum margin. It can handle non-linear data using kernels.

---

# 9. AdaBoost Classifier

## Easy Definition

AdaBoost is an ensemble boosting algorithm.

Simple meaning:

```text id="dnyy9d"
AdaBoost combines many weak learners to create one strong learner.
```

Weak learner usually means a simple decision tree stump.

## How AdaBoost Works

```text id="uuzyq9"
Train weak model
Find wrongly predicted points
Give more weight to wrong points
Train next model
Repeat
Combine all models
```

## Code

```python id="9wq93y"
from sklearn.ensemble import AdaBoostClassifier

model = AdaBoostClassifier(
    n_estimators=100,
    learning_rate=0.5,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="wdj2fb"
Need better accuracy than simple tree
Binary classification
Moderate-size tabular data
```

## Limitations

```text id="fq4ad5"
Sensitive to noisy data
Sensitive to outliers
Can overfit if too many estimators
```

## Interview Answer

AdaBoost is a boosting algorithm that combines weak learners sequentially. Each new learner focuses more on previously misclassified samples.

---

# 10. Gradient Boosting Classifier

## Easy Definition

Gradient Boosting builds models sequentially, and each new model corrects the previous model’s errors.

Simple meaning:

```text id="am8xhm"
Model 1 makes mistakes
Model 2 fixes mistakes
Model 3 fixes remaining mistakes
```

Scikit-learn’s `GradientBoostingClassifier` builds an additive model in a forward stage-wise manner and fits regression trees on the negative gradient of the loss function. citeturn582004search12

## Code

```python id="ig1zcm"
from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="dbn1r4"
Tabular data
Need high accuracy
Non-linear patterns
Structured datasets
```

## Limitations

```text id="oo32bd"
Slower than Random Forest
Needs tuning
Can overfit
```

## Interview Answer

Gradient Boosting is an ensemble algorithm that builds models sequentially. Each new model corrects the errors of previous models using gradients.

---

# 11. XGBoost Classifier

## Easy Definition

XGBoost is an optimized and powerful version of Gradient Boosting.

Simple meaning:

```text id="fu9aie"
XGBoost = fast + regularized + optimized Gradient Boosting
```

Official XGBoost documentation describes it as an optimized distributed gradient boosting library designed to be efficient, flexible, and portable. citeturn582004search3

## Code

Install:

```bash id="l237c9"
pip install xgboost
```

Code:

```python id="1c3fbq"
from xgboost import XGBClassifier

model = XGBClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    eval_metric="logloss",
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="g72cmn"
High accuracy needed
Tabular data
Kaggle-style ML problems
Complex non-linear patterns
```

## Important Parameters

| Parameter | Meaning |
|---|---|
| `n_estimators` | Number of trees |
| `learning_rate` | Step size |
| `max_depth` | Tree depth |
| `subsample` | Row sampling |
| `colsample_bytree` | Feature sampling |
| `reg_alpha` | L1 regularization |
| `reg_lambda` | L2 regularization |

## Interview Answer

XGBoost is an optimized gradient boosting algorithm that builds trees sequentially and corrects previous errors. It is fast, regularized, and powerful for tabular data.

---

# 12. LightGBM Classifier

## Easy Definition

LightGBM is a fast gradient boosting algorithm.

Simple meaning:

```text id="8wvakl"
LightGBM is like XGBoost but optimized for speed and large datasets.
```

LightGBM is a gradient boosting framework that uses tree-based learning algorithms and is designed to be distributed and efficient. citeturn582004search14

## Code

Install:

```bash id="gl6e4p"
pip install lightgbm
```

Code:

```python id="4xd8l2"
from lightgbm import LGBMClassifier

model = LGBMClassifier(
    n_estimators=100,
    learning_rate=0.1,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="ovthrn"
Large dataset
Fast training needed
Tabular data
High accuracy needed
```

## Limitations

```text id="r9qniz"
Can overfit on small datasets
Needs parameter tuning
```

## Interview Answer

LightGBM is a fast and efficient gradient boosting classifier designed for large tabular datasets.

---

# 13. CatBoost Classifier

## Easy Definition

CatBoost is a gradient boosting algorithm that handles categorical features very well.

Simple meaning:

```text id="lngyt8"
CatBoost is strong when dataset has many categorical columns.
```

CatBoost is an algorithm for gradient boosting on decision trees, and its classifier API supports categorical feature specification through `cat_features`. citeturn582004search10turn582004search5

## Code

Install:

```bash id="uvw7kk"
pip install catboost
```

Code:

```python id="fv4me2"
from catboost import CatBoostClassifier

model = CatBoostClassifier(
    iterations=100,
    learning_rate=0.1,
    depth=4,
    verbose=0,
    random_state=42
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## With Categorical Features

```python id="d54du3"
cat_features = ["City", "Education"]

model.fit(X_train, y_train, cat_features=cat_features)
```

## When to Use

```text id="72gyn4"
Many categorical columns
Tabular data
Less manual encoding needed
High accuracy needed
```

## Interview Answer

CatBoost is a gradient boosting algorithm that performs well on tabular data and handles categorical features efficiently.

---

# 14. Neural Network Classifier

## Easy Definition

A Neural Network is a model inspired by the human brain.

Simple meaning:

```text id="3qfpda"
Input layer → Hidden layers → Output layer
```

It learns complex patterns using neurons, weights, activation functions, and backpropagation.

Scikit-learn’s `MLPClassifier` is a Multi-layer Perceptron classifier that optimizes log-loss using solvers such as LBFGS or stochastic gradient descent. citeturn582004search23

## Basic Structure

```text id="afq1fy"
Input Features → Hidden Layer → Output Class
```

Example:

```text id="5o15vz"
Age, Salary, Experience → Neural Network → Churn / Not Churn
```

## Code Using Scikit-Learn

```python id="n6fj5d"
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

model = Pipeline([
    ("scaler", StandardScaler()),
    ("mlp", MLPClassifier(
        hidden_layer_sizes=(64, 32),
        activation="relu",
        max_iter=1000,
        random_state=42
    ))
])

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
```

## When to Use

```text id="nvxd0r"
Large dataset
Complex non-linear patterns
Image/text/deep learning tasks
Enough computational power
```

## Limitations

```text id="m4fl7s"
Needs more data
Needs scaling
Less interpretable
Needs tuning
Can overfit
```

## Interview Answer

Neural Network is a supervised learning model made of layers of neurons. It learns complex patterns using forward propagation, loss calculation, backpropagation, and weight updates.

---

# 15. Complete Classification Code

This code compares common classifiers.

```python id="stpe2m"
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier

# Optional external libraries
# pip install xgboost lightgbm catboost
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

# Sample dataset
df = pd.DataFrame({
    "Age": [22, 25, 47, 52, 46, 56, 23, 30, 40, 35],
    "Salary": [25000, 30000, 80000, 90000, 75000, 100000, 28000, 40000, 60000, 50000],
    "Experience": [1, 2, 20, 25, 18, 30, 1, 5, 12, 8],
    "Purchased": [0, 0, 1, 1, 1, 1, 0, 0, 1, 0]
})

X = df[["Age", "Salary", "Experience"]]
y = df["Purchased"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

models = {
    "Logistic Regression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LogisticRegression())
    ]),

    "KNN": Pipeline([
        ("scaler", StandardScaler()),
        ("model", KNeighborsClassifier(n_neighbors=3))
    ]),

    "Naive Bayes": GaussianNB(),

    "Decision Tree": DecisionTreeClassifier(max_depth=3, random_state=42),

    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),

    "SVM": Pipeline([
        ("scaler", StandardScaler()),
        ("model", SVC(kernel="rbf", probability=True))
    ]),

    "AdaBoost": AdaBoostClassifier(n_estimators=100, random_state=42),

    "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),

    "XGBoost": XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=3,
        eval_metric="logloss",
        random_state=42
    ),

    "LightGBM": LGBMClassifier(
        n_estimators=100,
        learning_rate=0.1,
        random_state=42
    ),

    "CatBoost": CatBoostClassifier(
        iterations=100,
        learning_rate=0.1,
        depth=4,
        verbose=0,
        random_state=42
    ),

    "Neural Network": Pipeline([
        ("scaler", StandardScaler()),
        ("model", MLPClassifier(
            hidden_layer_sizes=(64, 32),
            max_iter=1000,
            random_state=42
        ))
    ])
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    print("\nModel:", name)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("Precision:", precision_score(y_test, y_pred, zero_division=0))
    print("Recall:", recall_score(y_test, y_pred, zero_division=0))
    print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))
```

---

# 16. Which Classification Model to Use?

| Situation | Best Model |
|---|---|
| Simple binary classification | Logistic Regression |
| Small dataset, non-linear boundary | KNN |
| Text classification | Naive Bayes |
| Explainable rule-based model | Decision Tree |
| Strong tabular baseline | Random Forest |
| High-dimensional data | SVM |
| Improve weak learners | AdaBoost |
| Strong boosting baseline | Gradient Boosting |
| High accuracy tabular data | XGBoost |
| Large dataset, fast training | LightGBM |
| Many categorical columns | CatBoost |
| Complex large data | Neural Network |

---

# 17. Model Scaling Requirement

| Algorithm | Scaling Needed? |
|---|---|
| Logistic Regression | Yes, recommended |
| KNN | Yes, very important |
| Naive Bayes | Usually not always |
| Decision Tree | No |
| Random Forest | No |
| SVM | Yes, very important |
| AdaBoost | Usually no |
| Gradient Boosting | No |
| XGBoost | No |
| LightGBM | No |
| CatBoost | No |
| Neural Network | Yes, very important |

---

# 18. Most Asked Interview Questions

## Q1. What is classification?

Classification is supervised learning where the output is a category or class label.

---

## Q2. Logistic Regression vs Linear Regression?

| Linear Regression | Logistic Regression |
|---|---|
| Regression algorithm | Classification algorithm |
| Predicts continuous value | Predicts probability/class |
| Uses best fit line | Uses sigmoid function |
| Example: salary | Example: spam/not spam |

---

## Q3. KNN advantages and disadvantages?

```text id="wsyg2d"
Advantages:
Simple
No training phase
Works for non-linear data

Disadvantages:
Slow for large data
Needs scaling
Sensitive to K value
```

---

## Q4. Why is Naive Bayes called naive?

Because it assumes all features are independent of each other.

---

## Q5. Decision Tree vs Random Forest?

```text id="gugowj"
Decision Tree = single tree
Random Forest = many trees
```

Random Forest usually reduces overfitting and improves accuracy.

---

## Q6. SVM vs Logistic Regression?

```text id="4df0h5"
Logistic Regression predicts probability using sigmoid.
SVM finds the maximum margin separating hyperplane.
```

---

## Q7. AdaBoost vs Gradient Boosting?

| AdaBoost | Gradient Boosting |
|---|---|
| Focuses on wrong samples | Fits errors/gradients |
| Uses sample weights | Uses gradient of loss |
| Often uses stumps | Uses decision trees |

---

## Q8. Random Forest vs Boosting?

| Random Forest | Boosting |
|---|---|
| Trees trained independently | Trees trained sequentially |
| Reduces variance | Reduces bias and variance |
| Uses bagging | Uses boosting |
| Less tuning | More tuning |

---

## Q9. XGBoost vs LightGBM vs CatBoost?

| XGBoost | LightGBM | CatBoost |
|---|---|---|
| Powerful boosting | Faster on large data | Best with categorical features |
| More tuning | Very efficient | Less encoding needed |
| Great tabular model | Large dataset friendly | Categorical friendly |

---

## Q10. Which model is best for classification?

There is no single best model. Start with Logistic Regression as a baseline, then try Random Forest, XGBoost, LightGBM, or CatBoost for better performance on tabular data.

---

# 19. Final Summary

```text id="e7k9nj"
Classification is used to predict categories like Yes/No, Spam/Not Spam, Disease/No Disease, or Fraud/Not Fraud.

Logistic Regression is a simple and explainable binary classification model.

KNN classifies based on nearest neighbors.

Naive Bayes uses probability and works well for text classification.

Decision Tree uses if-else rules.

Random Forest combines many decision trees and reduces overfitting.

SVM finds the best separating boundary with maximum margin.

AdaBoost combines weak learners and focuses on wrongly classified samples.

Gradient Boosting builds models sequentially to correct previous errors.

XGBoost, LightGBM, and CatBoost are powerful boosting algorithms for tabular data.

Neural Networks learn complex patterns using layers, activation functions, and backpropagation.

For interviews, always explain the model, when to use it, advantages, limitations, and evaluation metrics like accuracy, precision, recall, F1 score, and ROC-AUC.
```
