> **You asked:**
>
> Phase 6: Supervised Machine Learning
> Module 12: Regression
> Linear Regression
> Theory
> Mathematics
> Assumptions
> Cost Function
> Gradient Descent
> Code
> Interview Questions
> Projects

I’ll explain Linear Regression from theory to project level: formula, assumptions, cost function, gradient descent, code, interview questions, and project ideas.

# Phase 6: Supervised Machine Learning  
# Module 12: Regression — Linear Regression

Linear Regression is a **supervised machine learning algorithm** used to predict a **continuous numerical value**.

Examples:

```text id="zyis0w"
Predict salary
Predict house price
Predict sales
Predict marks
Predict insurance cost
Predict crop production
```

---

# 1. What is Regression?

## Easy Definition

Regression means predicting a **number**.

```text id="s0ckai"
Classification → Predict category
Regression     → Predict number
```

Example:

| Problem | Type |
|---|---|
| Predict spam or not spam | Classification |
| Predict house price | Regression |
| Predict pass or fail | Classification |
| Predict salary | Regression |

## Interview Answer

Regression is a supervised learning technique used to predict continuous numerical values.

---

# 2. What is Linear Regression?

## Easy Definition

Linear Regression finds the **best fit straight line** between input and output.

Simple meaning:

```text id="0a6imx"
Input feature increases/decreases
Target value also changes in a linear pattern
```

Example:

```text id="rw023j"
Experience increases → Salary increases
Study hours increases → Marks increases
Area increases → House price increases
```

genui{"inference_regression_ml_learning_block_staging":{"type_id":"LEAST_SQUARE_REGRESSION","locale_override":"en-US"}}

---

# 3. Linear Regression Theory

## Simple Example

Suppose we have:

| Experience | Salary |
|---:|---:|
| 1 | 30000 |
| 2 | 40000 |
| 3 | 50000 |
| 4 | 60000 |
| 5 | 70000 |

Linear Regression tries to find a line like:

```text id="k2swk8"
Salary = m × Experience + c
```

Where:

```text id="tlaz25"
m = slope / coefficient / weight
c = intercept / bias
```

If the model learns:

```text id="fmp4lz"
Salary = 10000 × Experience + 20000
```

Then for 6 years experience:

```text id="qk8xms"
Salary = 10000 × 6 + 20000
Salary = 80000
```

---

# 4. Types of Linear Regression

## A. Simple Linear Regression

Only one input feature.

Formula:

```text id="y3mtc1"
y = b0 + b1x
```

Where:

```text id="4p5p5c"
y  = predicted output
x  = input feature
b0 = intercept
b1 = coefficient / slope
```

Example:

```text id="soyrpn"
Salary = b0 + b1 × Experience
```

---

## B. Multiple Linear Regression

More than one input feature.

Formula:

```text id="jquzf8"
y = b0 + b1x1 + b2x2 + b3x3 + ... + bnxn
```

Example:

```text id="eaq9np"
House Price = b0 + b1×Area + b2×Bedrooms + b3×Location_Score
```

## Interview Answer

Simple Linear Regression uses one independent variable, while Multiple Linear Regression uses more than one independent variable to predict a continuous target.

---

# 5. Mathematics of Linear Regression

## Formula

```text id="w5gk7c"
ŷ = b0 + b1x
```

Where:

```text id="4d7tyy"
ŷ = predicted value
b0 = intercept
b1 = slope
x = input feature
```

---

## Slope Formula

```text id="p3u0p3"
b1 = Σ(x - x̄)(y - ȳ) / Σ(x - x̄)²
```

## Intercept Formula

```text id="5v4shv"
b0 = ȳ - b1x̄
```

Where:

```text id="g6159e"
x̄ = mean of x
ȳ = mean of y
```

---

# 6. Manual Dry Run

Dataset:

| x | y |
|---:|---:|
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |

Mean:

```text id="s74cw5"
x̄ = (1 + 2 + 3) / 3 = 2
ȳ = (2 + 4 + 6) / 3 = 4
```

Now table:

| x | y | x - x̄ | y - ȳ | Product | Square |
|---:|---:|---:|---:|---:|---:|
| 1 | 2 | -1 | -2 | 2 | 1 |
| 2 | 4 | 0 | 0 | 0 | 0 |
| 3 | 6 | 1 | 2 | 2 | 1 |

```text id="1f6sxd"
Σ(x - x̄)(y - ȳ) = 4
Σ(x - x̄)² = 2
```

Slope:

```text id="fecqbw"
b1 = 4 / 2 = 2
```

Intercept:

```text id="t4ok9u"
b0 = ȳ - b1x̄
b0 = 4 - 2×2
b0 = 0
```

Final equation:

```text id="ur5owq"
y = 0 + 2x
y = 2x
```

For `x = 4`:

```text id="ixsv4b"
y = 2 × 4 = 8
```

---

# 7. Cost Function

## Easy Definition

Cost function tells how wrong the model is.

Simple meaning:

```text id="zlvbl9"
Cost Function = Model Error
```

If prediction is far from actual value, cost is high.

If prediction is close to actual value, cost is low.

---

## Error

```text id="svs1uk"
Error = Actual value - Predicted value
```

Example:

```text id="qnxv73"
Actual Salary = 50000
Predicted Salary = 45000

Error = 50000 - 45000
Error = 5000
```

---

## Mean Squared Error

Most common cost function in Linear Regression:

```text id="2o17ox"
MSE = (1/n) Σ(y_actual - y_predicted)²
```

Why square?

```text id="c09yg9"
To remove negative sign
To punish large errors more
```

---

## Cost Function Used in Gradient Descent

```text id="kuic1i"
J(w, b) = (1/2n) Σ(y_pred - y_actual)²
```

`1/2n` is used because it makes derivative calculation easier.

## Interview Answer

The cost function measures model error. In Linear Regression, Mean Squared Error is commonly used as the cost function.

---

# 8. Gradient Descent

## Easy Definition

Gradient Descent is used to find the best values of weight and bias by reducing the cost function step by step.

Simple meaning:

```text id="65gubk"
Start with random weight
Calculate error
Update weight
Reduce error
Repeat
```

---

## Formula

```text id="6znb43"
w_new = w_old - learning_rate × gradient
b_new = b_old - learning_rate × gradient
```

Where:

```text id="d1thuj"
w = weight / coefficient
b = bias / intercept
learning_rate = step size
gradient = direction of error increase
```

We move opposite to gradient because we want to reduce error.

---

## Gradients for Linear Regression

Prediction:

```text id="0mlkhf"
y_pred = wx + b
```

Gradients:

```text id="i3zj4c"
dw = (2/n) Σ x(y_pred - y_actual)
db = (2/n) Σ (y_pred - y_actual)
```

Update:

```text id="h40snm"
w = w - learning_rate × dw
b = b - learning_rate × db
```

---

## Simple Dry Run

Suppose:

```text id="xk8v3s"
w = 10
learning_rate = 0.1
gradient = 4
```

Then:

```text id="eshopk"
w_new = 10 - 0.1 × 4
w_new = 10 - 0.4
w_new = 9.6
```

The weight is updated from `10` to `9.6`.

## Interview Answer

Gradient Descent is an optimization algorithm used to minimize the cost function by updating model parameters in the opposite direction of the gradient.

---

# 9. Assumptions of Linear Regression

Linear Regression works well when these assumptions are satisfied.

---

## Assumption 1: Linearity

The relationship between input and output should be approximately linear.

Example:

```text id="kbrwia"
Experience increases → Salary increases almost linearly
```

Check using scatter plot:

```python id="fzuaze"
import seaborn as sns
import matplotlib.pyplot as plt

sns.scatterplot(x=X["Experience"], y=y)
plt.title("Experience vs Salary")
plt.show()
```

---

## Assumption 2: No Multicollinearity

Independent features should not be highly correlated with each other.

Example problem:

```text id="9cppzm"
Feature 1 = Area in sq ft
Feature 2 = Area in sq meter
```

Both provide almost same information.

Check using correlation:

```python id="jh226m"
print(X.corr())
```

---

## Assumption 3: Homoscedasticity

The spread of errors should be almost constant.

Simple meaning:

```text id="u7g4n7"
Errors should not increase or decrease in a pattern.
```

Check residual plot:

```python id="9ney9s"
residuals = y_test - y_pred

sns.scatterplot(x=y_pred, y=residuals)
plt.axhline(0)
plt.title("Residual Plot")
plt.xlabel("Predicted Values")
plt.ylabel("Residuals")
plt.show()
```

---

## Assumption 4: Normality of Residuals

Errors should be approximately normally distributed.

Check using histogram:

```python id="xp6ryj"
sns.histplot(residuals, kde=True)
plt.title("Residual Distribution")
plt.show()
```

---

## Assumption 5: Independence of Errors

Errors should be independent of each other.

Example problem:

```text id="g5ir5y"
In time series data, today's error may depend on yesterday's error.
```

---

## Assumption 6: No Major Outliers

Outliers can strongly affect Linear Regression.

Example:

```text id="ckgmfo"
Normal salary: 30000, 40000, 50000
Outlier salary: 500000
```

Outliers can pull the regression line.

## Interview Answer

Main assumptions of Linear Regression are linearity, no multicollinearity, homoscedasticity, normal residuals, independent errors, and no major outliers.

---

# 10. Evaluation Metrics for Regression

Even though not always asked, interviewers commonly ask regression metrics.

## MAE

```text id="ts1q35"
MAE = Mean Absolute Error
```

Easy meaning:

```text id="m2d3e4"
Average absolute error
```

Formula:

```text id="ki01jv"
MAE = (1/n) Σ |y_actual - y_pred|
```

---

## MSE

```text id="1j42gi"
MSE = Mean Squared Error
```

Formula:

```text id="9efuej"
MSE = (1/n) Σ(y_actual - y_pred)²
```

---

## RMSE

```text id="3p6xhi"
RMSE = √MSE
```

Easy meaning:

```text id="4llonj"
Error in same unit as target
```

---

## R² Score

R² tells how much variance is explained by the model.

```text id="7e1zs8"
R² = 1   → perfect model
R² = 0   → model is not better than average prediction
R² < 0   → very poor model
```

## Interview Answer

For regression, common evaluation metrics are MAE, MSE, RMSE, and R² score.

---

# 11. Linear Regression Code Using Scikit-Learn

```python id="8a42cv"
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Sample dataset
df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6, 7, 8],
    "Skill_Score": [5, 6, 7, 8, 8, 9, 9, 10],
    "Salary": [30000, 40000, 50000, 60000, 65000, 75000, 85000, 95000]
})

# Features and target
X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.25,
    random_state=42
)

# Model
model = LinearRegression()

# Train
model.fit(X_train, y_train)

# Predict
y_pred = model.predict(X_test)

# Evaluation
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("Intercept:", model.intercept_)
print("Coefficients:", model.coef_)

print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)

# Predict new salary
new_data = pd.DataFrame({
    "Experience": [5],
    "Skill_Score": [8]
})

prediction = model.predict(new_data)
print("Predicted Salary:", prediction[0])
```

---

# 12. Output Meaning

```text id="vf6wnv"
Intercept = base value
Coefficient = impact of each feature
Prediction = final predicted value
```

Example:

```text id="l4fer4"
Coefficient of Experience = 9000
```

Meaning:

```text id="rhr360"
If Experience increases by 1 year,
Salary increases by around 9000,
assuming other features remain constant.
```

## Interview Answer

In Linear Regression, coefficients show the effect of input features on the target variable, and intercept is the predicted value when all input features are zero.

---

# 13. Linear Regression from Scratch Using Gradient Descent

This code shows internal working.

```python id="a8dy59"
import numpy as np

# Data
X = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 6, 8, 10])

# Initialize weight and bias
w = 0
b = 0

learning_rate = 0.01
epochs = 1000
n = len(X)

for epoch in range(epochs):
    # Prediction
    y_pred = w * X + b
    
    # Cost / loss
    loss = np.mean((y_pred - y) ** 2)
    
    # Gradients
    dw = (2/n) * np.sum(X * (y_pred - y))
    db = (2/n) * np.sum(y_pred - y)
    
    # Update
    w = w - learning_rate * dw
    b = b - learning_rate * db

print("Final Weight:", w)
print("Final Bias:", b)
print("Final Loss:", loss)

# Prediction
x_new = 6
y_new = w * x_new + b

print("Prediction for x=6:", y_new)
```

Expected result:

```text id="h5f6h0"
Final Weight close to 2
Final Bias close to 0
Prediction for x=6 close to 12
```

Because the actual pattern is:

```text id="z9ak55"
y = 2x
```

---

# 14. Complete Project: Salary Prediction

## Project Name

```text id="grqhsn"
Employee Salary Prediction using Linear Regression
```

## Problem Statement

Predict employee salary based on experience and skill score.

## Dataset Columns

| Column | Meaning |
|---|---|
| Experience | Years of experience |
| Skill_Score | Skill rating |
| Salary | Target variable |

---

## Project Code

```python id="u5ifyt"
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# 1. Load dataset
df = pd.DataFrame({
    "Experience": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "Skill_Score": [5, 6, 6, 7, 8, 8, 9, 9, 10, 10],
    "Salary": [30000, 38000, 45000, 52000, 62000, 70000, 80000, 88000, 98000, 105000]
})

# 2. Basic EDA
print(df.head())
print(df.info())
print(df.describe())
print(df.isnull().sum())

# 3. Visualization
sns.scatterplot(data=df, x="Experience", y="Salary")
plt.title("Experience vs Salary")
plt.show()

sns.heatmap(df.corr(), annot=True)
plt.title("Correlation Heatmap")
plt.show()

# 4. Features and target
X = df[["Experience", "Skill_Score"]]
y = df["Salary"]

# 5. Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# 6. Model training
model = LinearRegression()
model.fit(X_train, y_train)

# 7. Prediction
y_pred = model.predict(X_test)

# 8. Evaluation
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("MAE:", mae)
print("RMSE:", rmse)
print("R2 Score:", r2)

# 9. Cross validation
scores = cross_val_score(model, X, y, cv=5)
print("Cross Validation Scores:", scores)
print("Average CV Score:", scores.mean())

# 10. New prediction
new_employee = pd.DataFrame({
    "Experience": [6],
    "Skill_Score": [8]
})

predicted_salary = model.predict(new_employee)

print("Predicted Salary:", predicted_salary[0])
```

---

# 15. How to Explain This Project in Interview

```text id="14z7ja"
I built an Employee Salary Prediction project using Linear Regression.

The goal was to predict salary based on experience and skill score.

First, I loaded the dataset and performed EDA using describe, scatter plot, and correlation heatmap.

Then I separated features and target, split the data into training and testing sets, trained a Linear Regression model, and evaluated it using MAE, RMSE, and R² score.

Finally, I used the trained model to predict salary for a new employee.
```

---

# 16. Other Linear Regression Project Ideas

## Project 1: House Price Prediction

Features:

```text id="6g1g9f"
Area
Bedrooms
Bathrooms
Location score
Age of house
```

Target:

```text id="ahxtnd"
House Price
```

---

## Project 2: Student Marks Prediction

Features:

```text id="1v3j01"
Study hours
Attendance
Previous marks
Assignment score
```

Target:

```text id="5fnpch"
Final marks
```

---

## Project 3: Sales Prediction

Features:

```text id="5lu61r"
Advertising budget
Discount
Store visitors
Product price
```

Target:

```text id="9z1gm9"
Sales
```

---

## Project 4: Medical Insurance Cost Prediction

Features:

```text id="3yu3ku"
Age
BMI
Children
Smoker status
Region
```

Target:

```text id="anzz6l"
Insurance charges
```

---

## Project 5: Crop Production Prediction

Features:

```text id="9bse7j"
Rainfall
Temperature
Soil quality
Fertilizer usage
Area
```

Target:

```text id="y72nhe"
Crop production
```

This project matches your AI/ML background very well.

---

# 17. Most Asked Interview Questions

## Q1. What is Linear Regression?

Linear Regression is a supervised machine learning algorithm used to predict continuous numerical values by finding the best fit line between input and output.

---

## Q2. What is the formula of Simple Linear Regression?

```text id="ygk4yj"
y = b0 + b1x
```

Where `b0` is intercept and `b1` is slope.

---

## Q3. What is the formula of Multiple Linear Regression?

```text id="r6qwz8"
y = b0 + b1x1 + b2x2 + b3x3 + ... + bnxn
```

---

## Q4. What is slope?

Slope tells how much the target changes when the input feature increases by one unit.

---

## Q5. What is intercept?

Intercept is the predicted value when all input features are zero.

---

## Q6. What is cost function in Linear Regression?

The cost function measures error between actual and predicted values. MSE is commonly used.

```text id="07vrm0"
MSE = (1/n) Σ(y_actual - y_predicted)²
```

---

## Q7. Why do we use squared error?

We use squared error because it removes negative errors and gives higher penalty to large errors.

---

## Q8. What is Gradient Descent?

Gradient Descent is an optimization algorithm that updates weights step by step to minimize the cost function.

---

## Q9. What is learning rate?

Learning rate controls the step size during Gradient Descent.

```text id="pj5wo9"
Small learning rate → slow training
Large learning rate → may overshoot minimum
```

---

## Q10. What are assumptions of Linear Regression?

```text id="2q8cmo"
Linearity
No multicollinearity
Homoscedasticity
Normal residuals
Independent errors
No major outliers
```

---

## Q11. What is multicollinearity?

Multicollinearity happens when independent features are highly correlated with each other.

Example:

```text id="9wcg5b"
Area in square feet
Area in square meters
```

Both contain similar information.

---

## Q12. How do you evaluate Linear Regression?

Using:

```text id="xrkula"
MAE
MSE
RMSE
R² Score
```

---

## Q13. What is R² Score?

R² score tells how well the model explains variation in the target variable.

```text id="3gyklt"
R² = 1 means perfect model
R² = 0 means model is not better than average prediction
```

---

## Q14. Linear Regression vs Logistic Regression?

| Linear Regression | Logistic Regression |
|---|---|
| Regression algorithm | Classification algorithm |
| Predicts continuous value | Predicts probability/class |
| Example: salary prediction | Example: spam detection |
| Output can be any number | Output is between 0 and 1 |

---

## Q15. Is Linear Regression affected by outliers?

Yes. Linear Regression is sensitive to outliers because it tries to minimize squared errors, and squared errors give high penalty to large errors.

---

# 18. Final Summary of All Concepts

| Concept | Meaning |
|---|---|
| Linear Regression | Predicts continuous numerical value |
| Best Fit Line | Line that minimizes error |
| Slope | Change in target for 1 unit change in feature |
| Intercept | Prediction when feature value is zero |
| Cost Function | Measures prediction error |
| MSE | Average squared error |
| Gradient Descent | Updates weights to reduce cost |
| Assumptions | Conditions for good Linear Regression |
| MAE | Average absolute error |
| RMSE | Root mean squared error |
| R² Score | How well model explains target variation |

---

# Final Interview Summary

```text id="0a9jwe"
Linear Regression is a supervised machine learning algorithm used to predict continuous numerical values.

It finds the best fit line between input features and target output. The equation is y = b0 + b1x for simple Linear Regression and y = b0 + b1x1 + b2x2 + ... + bnxn for multiple Linear Regression.

The model learns coefficients and intercept by minimizing the cost function, usually Mean Squared Error. Gradient Descent can be used to update weights step by step.

Important assumptions include linearity, no multicollinearity, homoscedasticity, normal residuals, independent errors, and no major outliers.

Linear Regression is commonly evaluated using MAE, MSE, RMSE, and R² score. It can be used in projects like salary prediction, house price prediction, sales prediction, insurance cost prediction, and crop production prediction.
```
