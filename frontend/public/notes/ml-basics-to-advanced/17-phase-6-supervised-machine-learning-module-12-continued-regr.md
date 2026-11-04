> **You asked:**
>
> Multiple Linear Regression
> Polynomial Regression
> Ridge Regression
> Lasso Regression
> Elastic Net Regression
> Support Vector Regression (SVR)
> Decision Tree Regression
> Random Forest Regression
> XGBoost Regression
> LightGBM Regression
> CatBoost Regression

I’ll continue Module 12 regression family: each algorithm with easy meaning, when to use, key idea, code, pros/cons, and interview answer.

# Phase 6: Supervised Machine Learning  
# Module 12 Continued: Regression Algorithms

Regression algorithms are used when the target/output is a **continuous numerical value**.

Examples:

```text
House Price
Salary
Sales
Marks
Crop Yield
Temperature
Insurance Cost
```

In this module, we will cover:

```text
Multiple Linear Regression
Polynomial Regression
Ridge Regression
Lasso Regression
Elastic Net Regression
Support Vector Regression
Decision Tree Regression
Random Forest Regression
XGBoost Regression
LightGBM Regression
CatBoost Regression
```

---

# 1. Multiple Linear Regression

## Easy Definition

Multiple Linear Regression predicts a continuous value using **more than one input feature**.

Simple Linear Regression:

```text
Salary = b0 + b1 × Experience
```

Multiple Linear Regression:

```text
Salary = b0 + b1 × Experience + b2 × Skill_Score + b3 × Education_Score
```

---

## Formula

```text
y = b0 + b1x1 + b2x2 + b3x3 + ... + bnxn
```

Where:

```text
y  = predicted value
b0 = intercept
b1, b2, b3 = coefficients
x1, x2, x3 = input features
```

---

## Example

Suppose:

```text
Salary = 10000 + 5000 × Experience + 2000 × Skill_Score
```

For:

```text
Experience = 3
Skill_Score = 8
```

Prediction:

```text
Salary = 10000 + 5000 × 3 + 2000 × 8
Salary = 10000 + 15000 + 16000
Salary = 41000
```

---

## Code

```python
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score

df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6, 7, 8],
    "Skill_Score": [5, 6, 7, 8, 8, 9, 9, 10],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000, 85000, 95000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.25,
    random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Intercept:", model.intercept_)
print("Coefficients:", model.coef_)
print("MAE:", mean_absolute_error(y_test, y_pred))
print("R2 Score:", r2_score(y_test, y_pred))
```

---

## When to Use

Use Multiple Linear Regression when:

```text
Target is continuous
Relationship is approximately linear
Features are not highly correlated with each other
You need simple and explainable model
```

## Interview Answer

Multiple Linear Regression is used to predict a continuous target using multiple independent variables. It finds the best linear relationship between input features and output.

---

# 2. Polynomial Regression

## Easy Definition

Polynomial Regression is used when the relationship between input and output is **curved**, not straight.

Simple meaning:

```text
Linear Regression → straight line
Polynomial Regression → curved line
```

---

## Formula

For degree 2:

```text
y = b0 + b1x + b2x²
```

For degree 3:

```text
y = b0 + b1x + b2x² + b3x³
```

---

## Example

If salary grows slowly at first and then faster:

```text
Experience = 1, 2, 3, 4, 5
Salary     = 20k, 25k, 35k, 55k, 90k
```

A straight line may not fit well. Polynomial Regression can capture this curve.

---

## Code

```python
import pandas as pd

from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6],
    "Salary": [20000, 25000, 35000, 55000, 90000, 140000]
})

X = df[["Experience"]]
y = df["Salary"]

model = Pipeline([
    ("poly", PolynomialFeatures(degree=2, include_bias=False)),
    ("linear", LinearRegression())
])

model.fit(X, y)

prediction = model.predict([[7]])
print("Predicted Salary:", prediction[0])
```

---

## Important Point

High degree polynomial can overfit.

```text
Degree 2 or 3 → usually okay
Degree 10 → may overfit
```

## When to Use

Use Polynomial Regression when:

```text
Relationship is non-linear
Dataset is small or medium
You want curve fitting
```

## Interview Answer

Polynomial Regression is an extension of Linear Regression where polynomial features like x² and x³ are added to capture non-linear relationships.

---

# 3. Ridge Regression

## Easy Definition

Ridge Regression is Linear Regression with **L2 regularization**.

Simple meaning:

```text
Ridge reduces overfitting by making coefficients smaller.
```

Scikit-learn describes Ridge as a linear least-squares regression model with L2-norm regularization. citeturn453483search8

---

## Formula

Normal Linear Regression cost:

```text
MSE
```

Ridge cost:

```text
MSE + α × Σ(coefficient²)
```

Where:

```text
α = regularization strength
```

---

## Why Ridge is Used?

Suppose coefficients are very large:

```text
Experience coefficient = 100000
Skill coefficient      = 80000
```

Large coefficients can cause overfitting.

Ridge reduces them.

---

## Code

```python
from sklearn.linear_model import Ridge

model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Ridge R2:", r2_score(y_test, y_pred))
print("Coefficients:", model.coef_)
```

---

## When to Use

Use Ridge when:

```text
You have many features
Features are correlated
You want to reduce overfitting
You do not want coefficients to become exactly zero
```

## Interview Answer

Ridge Regression is Linear Regression with L2 regularization. It reduces overfitting by shrinking coefficients but usually does not make them exactly zero.

---

# 4. Lasso Regression

## Easy Definition

Lasso Regression is Linear Regression with **L1 regularization**.

Simple meaning:

```text
Lasso can shrink some coefficients to exactly zero.
```

That means Lasso can also perform feature selection.

Scikit-learn notes that Lasso is equivalent to Elastic Net with `l1_ratio=1.0`, meaning it uses no L2 penalty. citeturn453483search5

---

## Formula

```text
MSE + α × Σ|coefficient|
```

Where:

```text
α = regularization strength
```

---

## Example

Suppose features are:

```text
Experience
Skill_Score
Employee_ID
Phone_Number
Age
```

Lasso may make useless feature coefficients zero:

```text
Employee_ID coefficient = 0
Phone_Number coefficient = 0
```

---

## Code

```python
from sklearn.linear_model import Lasso

model = Lasso(alpha=0.1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Lasso R2:", r2_score(y_test, y_pred))
print("Coefficients:", model.coef_)
```

---

## When to Use

Use Lasso when:

```text
You want feature selection
You have many features
You want a simpler model
Some features may be useless
```

## Interview Answer

Lasso Regression is Linear Regression with L1 regularization. It reduces overfitting and can make some coefficients exactly zero, so it is useful for feature selection.

---

# 5. Elastic Net Regression

## Easy Definition

Elastic Net combines **Ridge + Lasso**.

Simple meaning:

```text
Elastic Net = L1 regularization + L2 regularization
```

Scikit-learn describes ElasticNet as a linear regression model trained with both L1 and L2 regularization, controlled by the `l1_ratio` parameter. citeturn453483search2

---

## Formula

```text
MSE + α × [L1 penalty + L2 penalty]
```

Or:

```text
MSE + α × [l1_ratio × Σ|w| + (1 - l1_ratio) × Σw²]
```

---

## Why Elastic Net?

Ridge is good when many features are correlated.

Lasso is good for feature selection.

Elastic Net combines both benefits.

---

## Code

```python
from sklearn.linear_model import ElasticNet

model = ElasticNet(alpha=0.1, l1_ratio=0.5)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Elastic Net R2:", r2_score(y_test, y_pred))
print("Coefficients:", model.coef_)
```

---

## When to Use

Use Elastic Net when:

```text
You have many features
Features are correlated
You want regularization and feature selection
Lasso alone is unstable
```

## Interview Answer

Elastic Net Regression combines L1 and L2 regularization. It is useful when features are highly correlated and we want both coefficient shrinkage and feature selection.

---

# 6. Support Vector Regression — SVR

## Easy Definition

SVR is the regression version of Support Vector Machine.

Simple meaning:

```text
SVR tries to fit a line or curve within a margin of tolerance.
```

Scikit-learn describes SVR as support vector regression using linear and non-linear kernels, with RBF as the default kernel if none is specified. citeturn453483search0

---

## Important Terms

| Term | Meaning |
|---|---|
| Kernel | Converts data into higher dimension |
| C | Controls penalty for errors |
| Epsilon | Error margin allowed |
| Gamma | Controls influence of each data point |

---

## Code

SVR is sensitive to feature scale, so scaling is important.

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR

model = Pipeline([
    ("scaler", StandardScaler()),
    ("svr", SVR(kernel="rbf", C=100, epsilon=0.1))
])

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("SVR R2:", r2_score(y_test, y_pred))
```

---

## When to Use

Use SVR when:

```text
Dataset is small or medium
Relationship is non-linear
You need powerful margin-based regression
Features are properly scaled
```

## Limitations

```text
Can be slow on large datasets
Needs feature scaling
Hyperparameter tuning is important
```

## Interview Answer

SVR is a regression algorithm based on Support Vector Machine. It fits a function within an epsilon margin and can handle non-linear patterns using kernels.

---

# 7. Decision Tree Regression

## Easy Definition

Decision Tree Regression predicts values by splitting data into decision rules.

Simple meaning:

```text
If Experience <= 3 → Salary around 45000
If Experience > 3  → Salary around 75000
```

Scikit-learn describes decision trees as non-parametric supervised methods for classification and regression that learn simple decision rules from features. citeturn453483search10

---

## How It Works

Decision Tree asks questions:

```text
Is Experience <= 3?
Is Skill_Score <= 7?
Is Age <= 25?
```

Then it predicts average value in the final leaf node.

---

## Code

```python
from sklearn.tree import DecisionTreeRegressor

model = DecisionTreeRegressor(max_depth=3, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Decision Tree R2:", r2_score(y_test, y_pred))
```

---

## When to Use

Use Decision Tree Regression when:

```text
Relationship is non-linear
You need easy interpretation
You have mixed feature types
You want rule-based prediction
```

## Limitations

```text
Can overfit easily
Small changes in data can change tree
Usually less accurate than ensemble models
```

## Interview Answer

Decision Tree Regression predicts continuous values by splitting data into rules and taking the average target value in leaf nodes.

---

# 8. Random Forest Regression

## Easy Definition

Random Forest Regression is a collection of many decision trees.

Simple meaning:

```text
Decision Tree = one tree
Random Forest = many trees
```

Final prediction:

```text
Average prediction of all trees
```

Scikit-learn describes RandomForestRegressor as a meta-estimator that fits many decision tree regressors on sub-samples and averages their predictions to improve accuracy and control overfitting. citeturn426300search0

---

## Code

```python
from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor(
    n_estimators=100,
    max_depth=5,
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Random Forest R2:", r2_score(y_test, y_pred))
```

---

## When to Use

Use Random Forest Regression when:

```text
You want better accuracy than one decision tree
Data has non-linear patterns
You want less overfitting than decision tree
You need feature importance
```

## Limitations

```text
Less interpretable than one decision tree
Can be slower
May not extrapolate well outside training range
```

## Interview Answer

Random Forest Regression is an ensemble algorithm that builds multiple decision trees and averages their predictions. It reduces overfitting and improves accuracy compared to a single decision tree.

---

# 9. XGBoost Regression

## Easy Definition

XGBoost Regression is an advanced boosting algorithm based on decision trees.

Simple meaning:

```text
XGBoost builds trees one by one.
Each new tree tries to correct previous errors.
```

XGBoost’s official documentation describes it as an optimized distributed gradient boosting library designed to be efficient, flexible, and portable. citeturn426300search13

---

## How It Works

```text
Tree 1 makes prediction
Tree 2 fixes Tree 1 errors
Tree 3 fixes remaining errors
...
Final prediction = combined prediction of all trees
```

---

## Code

Install first:

```bash
pip install xgboost
```

Code:

```python
from xgboost import XGBRegressor

model = XGBRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("XGBoost R2:", r2_score(y_test, y_pred))
```

---

## Important Parameters

| Parameter | Meaning |
|---|---|
| `n_estimators` | Number of trees |
| `learning_rate` | Step size |
| `max_depth` | Depth of each tree |
| `subsample` | Row sampling |
| `colsample_bytree` | Feature sampling |
| `reg_alpha` | L1 regularization |
| `reg_lambda` | L2 regularization |

---

## When to Use

Use XGBoost when:

```text
You need high accuracy
Data is tabular/structured
Relationship is complex
You can tune hyperparameters
```

## Interview Answer

XGBoost Regression is a gradient boosting tree algorithm where each new tree corrects the errors of previous trees. It is powerful for structured/tabular data.

---

# 10. LightGBM Regression

## Easy Definition

LightGBM is a fast gradient boosting algorithm.

Simple meaning:

```text
LightGBM is like XGBoost, but optimized for speed and large datasets.
```

LightGBM’s documentation describes it as a gradient boosting framework using tree-based learning algorithms and designed to be distributed and efficient. citeturn426300search2

---

## Code

Install first:

```bash
pip install lightgbm
```

Code:

```python
from lightgbm import LGBMRegressor

model = LGBMRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=-1,
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("LightGBM R2:", r2_score(y_test, y_pred))
```

---

## Important Parameters

| Parameter | Meaning |
|---|---|
| `n_estimators` | Number of trees |
| `learning_rate` | Step size |
| `num_leaves` | Number of leaves |
| `max_depth` | Tree depth |
| `min_child_samples` | Minimum samples in leaf |
| `subsample` | Row sampling |
| `colsample_bytree` | Feature sampling |

---

## When to Use

Use LightGBM when:

```text
Dataset is large
You need fast training
You need strong performance
You have tabular data
```

## Limitations

```text
Can overfit on small datasets
Parameter tuning is important
```

## Interview Answer

LightGBM Regression is a fast gradient boosting tree algorithm designed for efficient training on large datasets.

---

# 11. CatBoost Regression

## Easy Definition

CatBoost is a gradient boosting algorithm that handles categorical features very well.

Simple meaning:

```text
CatBoost is powerful when dataset has many categorical columns.
```

CatBoost’s official documentation describes CatBoostRegressor as a scikit-learn estimator API implementation for regression that supports training, inference, and feature importance; it also has a `cat_features` parameter for categorical features. citeturn426300search4

---

## Code

Install first:

```bash
pip install catboost
```

Code:

```python
from catboost import CatBoostRegressor

model = CatBoostRegressor(
    iterations=100,
    learning_rate=0.1,
    depth=4,
    verbose=0,
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("CatBoost R2:", r2_score(y_test, y_pred))
```

---

## Code with Categorical Features

```python
from catboost import CatBoostRegressor

cat_features = ["City", "Education"]

model = CatBoostRegressor(
    iterations=100,
    learning_rate=0.1,
    depth=4,
    verbose=0,
    random_state=42
)

model.fit(X_train, y_train, cat_features=cat_features)

y_pred = model.predict(X_test)
```

---

## When to Use

Use CatBoost when:

```text
Dataset has categorical columns
You want strong performance
You want less manual encoding
You have tabular data
```

## Interview Answer

CatBoost Regression is a gradient boosting algorithm that performs well on tabular data and can handle categorical features efficiently.

---

# 12. All Regression Models Code Together

```python
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.svm import SVR
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

# Optional external libraries
# pip install xgboost lightgbm catboost
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

# Dataset
df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Skill_Score": [5, 6, 6, 7, 8, 8, 9, 9, 10, 10],
    "Salary": [30000, 38000, 45000, 52000, 62000, 70000, 80000, 88000, 98000, 105000]
})

X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

models = {
    "Multiple Linear Regression": LinearRegression(),
    "Polynomial Regression": Pipeline([
        ("poly", PolynomialFeatures(degree=2, include_bias=False)),
        ("linear", LinearRegression())
    ]),
    "Ridge Regression": Ridge(alpha=1.0),
    "Lasso Regression": Lasso(alpha=0.1),
    "Elastic Net Regression": ElasticNet(alpha=0.1, l1_ratio=0.5),
    "SVR": Pipeline([
        ("scaler", StandardScaler()),
        ("svr", SVR(kernel="rbf", C=100, epsilon=0.1))
    ]),
    "Decision Tree Regression": DecisionTreeRegressor(max_depth=3, random_state=42),
    "Random Forest Regression": RandomForestRegressor(n_estimators=100, random_state=42),
    "XGBoost Regression": XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42),
    "LightGBM Regression": LGBMRegressor(n_estimators=100, learning_rate=0.1, random_state=42),
    "CatBoost Regression": CatBoostRegressor(iterations=100, learning_rate=0.1, depth=4, verbose=0, random_state=42)
}

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\nModel:", name)
    print("MAE:", mae)
    print("RMSE:", rmse)
    print("R2 Score:", r2)
```

---

# 13. Which Regression Model to Use?

| Situation | Best Model |
|---|---|
| Simple linear relation | Linear Regression |
| Multiple input features | Multiple Linear Regression |
| Curved relation | Polynomial Regression |
| Overfitting with many features | Ridge |
| Need feature selection | Lasso |
| Correlated features + feature selection | Elastic Net |
| Small/medium non-linear data | SVR |
| Explainable rule-based model | Decision Tree |
| Better tree performance | Random Forest |
| High accuracy tabular data | XGBoost |
| Large dataset and fast training | LightGBM |
| Many categorical columns | CatBoost |

---

# 14. Linear Models vs Tree Models

| Linear Models | Tree-Based Models |
|---|---|
| Linear Regression, Ridge, Lasso | Decision Tree, Random Forest, XGBoost |
| Need linear relationship | Can handle non-linear relationship |
| Easy to interpret | More powerful |
| Sensitive to outliers | Less sensitive |
| Scaling often helpful | Scaling usually not needed |
| Good baseline model | Good for tabular data |

---

# 15. Most Asked Interview Questions

## Q1. Multiple Linear Regression vs Simple Linear Regression?

```text
Simple Linear Regression uses one input feature.
Multiple Linear Regression uses multiple input features.
```

---

## Q2. What is Polynomial Regression?

Polynomial Regression adds power features like `x²` and `x³` to capture non-linear relationships.

---

## Q3. Ridge vs Lasso?

| Ridge | Lasso |
|---|---|
| L2 regularization | L1 regularization |
| Shrinks coefficients | Can make coefficients zero |
| Good for correlated features | Good for feature selection |
| Does not remove features | Can remove features |

---

## Q4. What is Elastic Net?

Elastic Net combines Ridge and Lasso, meaning it uses both L1 and L2 regularization.

---

## Q5. What is SVR?

SVR is Support Vector Regression. It predicts continuous values using margin-based regression and kernels.

---

## Q6. Decision Tree Regression vs Random Forest Regression?

```text
Decision Tree = single tree
Random Forest = many trees
```

Random Forest usually gives better accuracy and less overfitting.

---

## Q7. Random Forest vs XGBoost?

| Random Forest | XGBoost |
|---|---|
| Bagging method | Boosting method |
| Trees are independent | Trees learn sequentially |
| Reduces variance | Reduces bias and variance |
| Less tuning needed | More tuning needed |
| Good baseline | Often higher accuracy |

---

## Q8. XGBoost vs LightGBM?

```text
Both are gradient boosting algorithms.
XGBoost is powerful and widely used.
LightGBM is usually faster on large datasets.
```

---

## Q9. When should you use CatBoost?

Use CatBoost when your dataset has many categorical features and you want strong performance with less manual encoding.

---

## Q10. Which regression model should I try first?

Start with:

```text
Linear Regression as baseline
Random Forest for non-linear data
XGBoost/LightGBM/CatBoost for high-performance tabular data
```

---

# 16. Final Summary

```text
Multiple Linear Regression predicts a continuous value using multiple features.

Polynomial Regression adds x² and x³ features to capture curved patterns.

Ridge Regression uses L2 regularization to reduce overfitting.

Lasso Regression uses L1 regularization and can perform feature selection.

Elastic Net combines Ridge and Lasso.

SVR uses margin-based regression and kernels for non-linear patterns.

Decision Tree Regression predicts using decision rules.

Random Forest Regression combines many decision trees and averages their predictions.

XGBoost, LightGBM, and CatBoost are powerful gradient boosting algorithms for tabular data.

For interviews, always explain:
1. What the model does
2. When to use it
3. Main advantage
4. Main limitation
5. Evaluation metrics like MAE, RMSE, and R²
```
