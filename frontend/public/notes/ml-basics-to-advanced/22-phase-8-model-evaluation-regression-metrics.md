> **You asked:**
>
> Phase 8: Model Evaluation
> Regression Metrics
> MAE
> MSE
> RMSE
> R² Score
> Adjusted R²

# Phase 8: Model Evaluation  
# Regression Metrics

Regression metrics are used to check **how good a regression model is**.

Regression means predicting a number:

```text
House Price
Salary
Sales
Marks
Crop Yield
Temperature
Insurance Cost
```

Model evaluation answers this question:

```text
Actual value and predicted value are how close?
```

Example:

```text
Actual Salary    = 50,000
Predicted Salary = 48,000

Error = 2,000
```

---

# 1. Regression Metrics

## Easy Definition

Regression metrics measure the difference between:

```text
Actual value
Predicted value
```

If difference is small:

```text
Model is good
```

If difference is large:

```text
Model is poor
```

---

# 2. Error / Residual

## Easy Definition

Error means difference between actual and predicted value.

Formula:

```text
Error = Actual Value - Predicted Value
```

Example:

```text
Actual = 100
Predicted = 90

Error = 100 - 90
Error = 10
```

In regression, error is also called **residual**.

genui{"inference_regression_ml_learning_block_staging":{"type_id":"LEAST_SQUARE_REGRESSION","locale_override":"en-US"}}

---

# 3. Sample Data for Metrics

We will use this data:

| Data Point | Actual Value | Predicted Value |
|---:|---:|---:|
| 1 | 100 | 90 |
| 2 | 200 | 210 |
| 3 | 300 | 290 |
| 4 | 400 | 420 |

Errors:

| Actual | Predicted | Error |
|---:|---:|---:|
| 100 | 90 | 10 |
| 200 | 210 | -10 |
| 300 | 290 | 10 |
| 400 | 420 | -20 |

---

# 4. MAE — Mean Absolute Error

## Easy Definition

MAE tells the **average absolute error**.

Simple meaning:

```text
On average, how much wrong is the model?
```

Formula:

```text
MAE = (1/n) Σ |Actual - Predicted|
```

---

## Dry Run

| Actual | Predicted | Error | Absolute Error |
|---:|---:|---:|---:|
| 100 | 90 | 10 | 10 |
| 200 | 210 | -10 | 10 |
| 300 | 290 | 10 | 10 |
| 400 | 420 | -20 | 20 |

```text
MAE = (10 + 10 + 10 + 20) / 4
MAE = 50 / 4
MAE = 12.5
```

Meaning:

```text
Model is wrong by 12.5 units on average.
```

---

## Python Code

```python
from sklearn.metrics import mean_absolute_error

actual = [100, 200, 300, 400]
predicted = [90, 210, 290, 420]

mae = mean_absolute_error(actual, predicted)

print("MAE:", mae)
```

Output:

```text
MAE: 12.5
```

---

## Advantages of MAE

```text
Easy to understand
Same unit as target
Less affected by large errors than MSE
```

## Limitation of MAE

```text
Does not punish large errors strongly
```

## Interview Answer

MAE stands for Mean Absolute Error. It measures the average absolute difference between actual and predicted values. Lower MAE means better model performance.

---

# 5. MSE — Mean Squared Error

## Easy Definition

MSE tells the **average squared error**.

Simple meaning:

```text
First square every error, then take average.
```

Formula:

```text
MSE = (1/n) Σ(Actual - Predicted)²
```

---

## Dry Run

| Actual | Predicted | Error | Squared Error |
|---:|---:|---:|---:|
| 100 | 90 | 10 | 100 |
| 200 | 210 | -10 | 100 |
| 300 | 290 | 10 | 100 |
| 400 | 420 | -20 | 400 |

```text
MSE = (100 + 100 + 100 + 400) / 4
MSE = 700 / 4
MSE = 175
```

---

## Python Code

```python
from sklearn.metrics import mean_squared_error

actual = [100, 200, 300, 400]
predicted = [90, 210, 290, 420]

mse = mean_squared_error(actual, predicted)

print("MSE:", mse)
```

Output:

```text
MSE: 175.0
```

---

## Why Squared Error?

We square error because:

```text
Negative error becomes positive
Large errors get bigger penalty
Useful for optimization
```

Example:

```text
Error = 2  → Squared Error = 4
Error = 10 → Squared Error = 100
```

So MSE punishes large mistakes strongly.

---

## Advantages of MSE

```text
Good for mathematical optimization
Punishes large errors strongly
Used as cost function in many regression models
```

## Limitation of MSE

```text
Unit becomes squared
Harder to explain to business people
Very sensitive to outliers
```

## Interview Answer

MSE stands for Mean Squared Error. It calculates the average of squared differences between actual and predicted values. It penalizes large errors more than MAE.

---

# 6. RMSE — Root Mean Squared Error

## Easy Definition

RMSE is the square root of MSE.

Simple meaning:

```text
RMSE = MSE converted back to original unit
```

Formula:

```text
RMSE = √MSE
```

---

## Dry Run

We already calculated:

```text
MSE = 175
```

So:

```text
RMSE = √175
RMSE ≈ 13.23
```

Meaning:

```text
Model is wrong by around 13.23 units.
```

---

## Python Code

```python
import numpy as np
from sklearn.metrics import mean_squared_error

actual = [100, 200, 300, 400]
predicted = [90, 210, 290, 420]

mse = mean_squared_error(actual, predicted)
rmse = np.sqrt(mse)

print("RMSE:", rmse)
```

Output:

```text
RMSE: 13.228756555322953
```

---

## Advantages of RMSE

```text
Same unit as target
Punishes large errors
Easy to compare with actual target values
```

## Limitation of RMSE

```text
Sensitive to outliers
```

## Interview Answer

RMSE stands for Root Mean Squared Error. It is the square root of MSE and gives error in the same unit as the target variable.

---

# 7. R² Score

## Easy Definition

R² Score tells how much variation in the target is explained by the model.

Simple meaning:

```text
R² tells how well model fits the data.
```

Range:

```text
R² = 1   → Perfect model
R² = 0   → Model is not better than average prediction
R² < 0   → Model is very poor
```

---

## Formula

```text
R² = 1 - (SS_res / SS_total)
```

Where:

```text
SS_res   = Sum of squared errors of model
SS_total = Sum of squared errors from mean value
```

---

## Simple Meaning

Suppose we predict house price.

If R² = 0.85:

```text
Model explains 85% variation in house price.
```

If R² = 0.40:

```text
Model explains only 40% variation.
```

---

## Python Code

```python
from sklearn.metrics import r2_score

actual = [100, 200, 300, 400]
predicted = [90, 210, 290, 420]

r2 = r2_score(actual, predicted)

print("R2 Score:", r2)
```

---

## R² Interpretation

| R² Score | Meaning |
|---:|---|
| 1.0 | Perfect prediction |
| 0.9 | Very good |
| 0.7 | Good |
| 0.5 | Average |
| 0.0 | Same as predicting mean |
| Negative | Very poor model |

---

## Important Point

High R² is good, but do not depend only on R².

Why?

```text
R² can increase when we add more features,
even if features are useless.
```

That is why we use **Adjusted R²**.

## Interview Answer

R² Score measures how much variance in the target variable is explained by the model. Higher R² means better model fit.

---

# 8. Adjusted R²

## Easy Definition

Adjusted R² is an improved version of R².

It checks whether adding new features actually improves the model or not.

Simple meaning:

```text
R² always increases or stays same when we add features.
Adjusted R² increases only when useful features are added.
```

---

## Why Adjusted R² is Needed?

Suppose we predict salary using:

```text
Experience
Skill Score
Education
```

Now we add useless columns:

```text
Employee ID
Phone Number
Random Number
```

R² may still increase slightly.

But Adjusted R² will punish useless features.

---

## Formula

```text
Adjusted R² = 1 - [(1 - R²)(n - 1) / (n - p - 1)]
```

Where:

```text
n = number of data points
p = number of independent features
R² = R squared score
```

---

## Example

Suppose:

```text
R² = 0.90
n = 100
p = 5
```

Formula:

```text
Adjusted R² = 1 - [(1 - 0.90)(100 - 1) / (100 - 5 - 1)]

Adjusted R² = 1 - [(0.10 × 99) / 94]

Adjusted R² = 1 - [9.9 / 94]

Adjusted R² = 1 - 0.1053

Adjusted R² = 0.8947
```

---

## Python Code

```python
from sklearn.metrics import r2_score

actual = [100, 200, 300, 400, 500]
predicted = [90, 210, 290, 420, 480]

r2 = r2_score(actual, predicted)

n = len(actual)   # number of rows
p = 2             # number of features

adjusted_r2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1))

print("R2 Score:", r2)
print("Adjusted R2:", adjusted_r2)
```

---

## R² vs Adjusted R²

| R² Score | Adjusted R² |
|---|---|
| Measures model fit | Measures model fit with feature penalty |
| Increases when features are added | Increases only if feature is useful |
| Good for simple regression | Better for multiple regression |
| Does not punish useless features | Punishes useless features |

## Interview Answer

Adjusted R² is a modified version of R² that penalizes unnecessary features. It is more useful than R² when comparing multiple regression models with different numbers of features.

---

# 9. MAE vs MSE vs RMSE vs R² vs Adjusted R²

| Metric | Full Form | Meaning | Best Use |
|---|---|---|---|
| MAE | Mean Absolute Error | Average absolute error | Easy business explanation |
| MSE | Mean Squared Error | Average squared error | Model optimization |
| RMSE | Root Mean Squared Error | Error in original unit | Penalizing large errors |
| R² | R-squared | Variance explained by model | Model fit |
| Adjusted R² | Adjusted R-squared | R² with feature penalty | Comparing multiple regression models |

---

# 10. Which Metric Should You Use?

## Use MAE When

```text
You want easy explanation
Outliers should not dominate too much
Business wants average error
```

Example:

```text
Our salary prediction is wrong by ₹5,000 on average.
```

---

## Use MSE When

```text
You want to punish large errors strongly
You are training/optimizing model
```

---

## Use RMSE When

```text
You want error in the same unit as target
Large errors are important
```

Example:

```text
Our house price model has RMSE of ₹2,50,000.
```

---

## Use R² When

```text
You want to know how well model explains target variation
You want model fit score
```

---

## Use Adjusted R² When

```text
You compare models with different number of features
You are using multiple regression
You want to avoid useless features
```

---

# 11. Complete Python Code

```python
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Actual and predicted values
actual = np.array([100, 200, 300, 400, 500])
predicted = np.array([90, 210, 290, 420, 480])

# Metrics
mae = mean_absolute_error(actual, predicted)
mse = mean_squared_error(actual, predicted)
rmse = np.sqrt(mse)
r2 = r2_score(actual, predicted)

# Adjusted R2
n = len(actual)   # number of observations
p = 2             # number of input features

adjusted_r2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1))

print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)
print("Adjusted R2:", adjusted_r2)
```

---

# 12. Complete Regression Model Evaluation Example

```python
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Dataset
df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Skill_Score": [5, 6, 6, 7, 8, 8, 9, 9, 10, 10],
    "Salary": [30000, 38000, 45000, 52000, 62000, 70000, 80000, 88000, 98000, 105000]
})

# Features and target
X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Prediction
y_pred = model.predict(X_test)

# Metrics
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

# Adjusted R2
n = X_test.shape[0]
p = X_test.shape[1]

adjusted_r2 = 1 - ((1 - r2) * (n - 1) / (n - p - 1))

print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)
print("Adjusted R2:", adjusted_r2)
```

Important note:

```text
Adjusted R² needs enough test samples.
If n is very small and p is close to n, adjusted R² may not be reliable.
```

---

# 13. Manual Dry Run Summary

Using:

```text
Actual    = [100, 200, 300, 400]
Predicted = [90, 210, 290, 420]
```

| Metric | Value | Meaning |
|---|---:|---|
| MAE | 12.5 | Average error is 12.5 |
| MSE | 175 | Average squared error is 175 |
| RMSE | 13.23 | Average error in original unit is around 13.23 |
| R² | High value if model fits well | Measures variance explained |
| Adjusted R² | R² with feature penalty | Better for multiple regression |

---

# 14. Most Asked Interview Questions

## Q1. What are regression metrics?

Regression metrics are used to evaluate how close predicted values are to actual values.

---

## Q2. What is MAE?

MAE is Mean Absolute Error. It measures the average absolute difference between actual and predicted values.

---

## Q3. What is MSE?

MSE is Mean Squared Error. It measures the average squared difference between actual and predicted values.

---

## Q4. What is RMSE?

RMSE is Root Mean Squared Error. It is the square root of MSE and gives error in the same unit as the target.

---

## Q5. MAE vs MSE?

| MAE | MSE |
|---|---|
| Average absolute error | Average squared error |
| Less sensitive to outliers | More sensitive to outliers |
| Easier to explain | Useful for optimization |
| Same unit as target | Squared unit |

---

## Q6. RMSE vs MAE?

```text
RMSE penalizes large errors more than MAE.
MAE is easier to interpret.
```

---

## Q7. What is R² Score?

R² Score tells how much variance in the target variable is explained by the model.

---

## Q8. What is Adjusted R²?

Adjusted R² is a modified R² that penalizes unnecessary features.

---

## Q9. Why Adjusted R² is better than R²?

Because R² may increase when we add more features, even if they are useless. Adjusted R² increases only when the added feature improves the model.

---

## Q10. Which metric is best for regression?

There is no single best metric.

```text
MAE → easy business interpretation
RMSE → large errors are important
R² → model fit
Adjusted R² → compare multiple regression models
```

---

# 15. Final Summary

```text
Regression metrics are used to measure the performance of regression models.

MAE tells the average absolute error.

MSE tells the average squared error and penalizes large errors strongly.

RMSE is the square root of MSE and gives error in the same unit as the target.

R² Score tells how much variance in the target is explained by the model.

Adjusted R² is an improved R² that penalizes unnecessary features.

For interviews, explain each metric with formula, meaning, and when to use it.
```

## Final Interview Summary

```text
Regression metrics help evaluate how close predicted values are to actual values.

I use MAE when I want simple average error, MSE when I want to penalize large errors, RMSE when I want error in the original unit, R² when I want to measure model fit, and Adjusted R² when I compare models with different numbers of features.

Lower MAE, MSE, and RMSE are better. Higher R² and Adjusted R² are better.
```
