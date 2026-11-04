> **You asked:**
>
> complete ml for interview all concept explain with code formula example with explanation

I’ll turn this into a one-shot ML interview handbook: foundations, preprocessing, mathematics, major algorithms, evaluation, tuning, projects, deep learning, deployment, and interview answers.

# Complete Machine Learning for Interview  
## Concepts, Formulas, Parameters, Examples, Code and Interview Answers

Machine Learning is a branch of AI in which computers learn patterns from data and use those patterns to make predictions or decisions.

```text
Historical data → Learn pattern → Trained model → New prediction
```

Example:

```text
Inputs: House area, rooms, location
Target: House price

The model learns the relationship between house features and price.
It then predicts the price of a new house.
```

---

# 1. Complete Machine Learning Workflow

```text
1. Understand the business problem
2. Collect data
3. Explore the data
4. Clean the data
5. Select features and target
6. Split data
7. Preprocess features
8. Train a baseline model
9. Evaluate the model
10. Tune hyperparameters
11. Perform error analysis
12. Save the model
13. Deploy the model
14. Monitor and retrain it
```

A common interview answer:

> I first understand the business objective and define the target variable. Then I clean and explore the data, create useful features, split the data into training and testing sets, build preprocessing and model pipelines, evaluate the model using suitable metrics, tune it, perform error analysis, and finally deploy and monitor it.

---

# 2. Types of Machine Learning

## 2.1 Supervised Learning

The dataset contains input features and a known target.

```text
Features → Model → Target prediction
```

Examples:

- House price prediction
- Customer churn prediction
- Spam detection
- Medical diagnosis

Supervised learning has two major types.

### Regression

Predicts a continuous numerical value.

```text
Salary = ₹50,000
House price = ₹80 lakh
Sales = 12,500 units
```

### Classification

Predicts a category or class.

```text
Spam / Not Spam
Fraud / Genuine
Disease / No Disease
```

---

## 2.2 Unsupervised Learning

The dataset does not contain a target variable.

The model tries to discover hidden patterns.

Examples:

- Customer segmentation
- Grouping similar products
- Anomaly detection
- Dimensionality reduction

Major types:

```text
Clustering
Dimensionality Reduction
Association Rules
```

---

## 2.3 Reinforcement Learning

An agent learns through rewards and penalties.

```text
State → Action → Reward → New State
```

Examples:

- Robotics
- Game playing
- Dynamic pricing
- Recommendation optimization

---

# 3. Important ML Terminology

| Term | Meaning |
|---|---|
| Feature | Input column used for prediction |
| Target | Output column to predict |
| Observation | One row of data |
| Model | Learned mathematical relationship |
| Training | Learning from data |
| Inference | Predicting on new data |
| Parameter | Value learned by the model |
| Hyperparameter | Setting chosen before training |
| Epoch | One complete pass through training data |
| Batch | Small group of training observations |
| Loss function | Measures prediction error |
| Optimizer | Updates parameters to reduce loss |

Example:

```text
Features: age, salary, experience
Target: employee_attrition
```

---

# 4. Python Libraries for Machine Learning

```bash
pip install numpy pandas matplotlib scikit-learn scipy joblib
```

Optional libraries:

```bash
pip install xgboost lightgbm catboost imbalanced-learn
pip install tensorflow torch
pip install mlflow streamlit fastapi uvicorn
```

Main uses:

| Library | Use |
|---|---|
| NumPy | Numerical and matrix operations |
| Pandas | Data manipulation |
| Matplotlib | Visualization |
| Scikit-learn | ML algorithms |
| SciPy | Statistics and scientific computing |
| TensorFlow/PyTorch | Deep learning |
| Joblib | Save trained models |

---

# 5. NumPy Basics

NumPy provides fast multidimensional arrays.

```python
import numpy as np

arr = np.array([10, 20, 30, 40, 50])

print("Mean:", np.mean(arr))
print("Median:", np.median(arr))
print("Variance:", np.var(arr))
print("Standard deviation:", np.std(arr))
```

## Matrix multiplication

\[
C = AB
\]

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print(A @ B)
```

## Dot product

\[
\mathbf{a}\cdot\mathbf{b}
=
\sum_{i=1}^{n}a_ib_i
\]

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(np.dot(a, b))
```

The dot product is used in linear regression, logistic regression, neural networks, SVM and attention mechanisms.

---

# 6. Pandas Basics

Pandas works with table-like data.

```python
import pandas as pd

df = pd.DataFrame({
    "age": [22, 25, 28, 35],
    "salary": [25000, 35000, 45000, 70000],
    "purchased": [0, 0, 1, 1]
})

print(df.head())
print(df.info())
print(df.describe())
```

## Filtering

```python
high_salary = df[df["salary"] > 40000]
print(high_salary)
```

## Grouping

```python
summary = df.groupby("purchased")["salary"].mean()
print(summary)
```

## Missing values

```python
print(df.isnull().sum())

df["age"] = df["age"].fillna(df["age"].median())
```

---

# 7. Exploratory Data Analysis

EDA means understanding data before training a model.

Check:

```text
Shape
Column names
Data types
Missing values
Duplicates
Outliers
Target balance
Distributions
Feature relationships
Correlation
```

```python
print(df.shape)
print(df.columns)
print(df.dtypes)
print(df.isnull().sum())
print(df.duplicated().sum())
print(df.describe(include="all"))
```

## Histogram

```python
import matplotlib.pyplot as plt

df["salary"].hist()
plt.xlabel("Salary")
plt.ylabel("Frequency")
plt.title("Salary Distribution")
plt.show()
```

## Scatter plot

```python
plt.scatter(df["age"], df["salary"])
plt.xlabel("Age")
plt.ylabel("Salary")
plt.show()
```

## Correlation

\[
r =
\frac{
\sum(x_i-\bar{x})(y_i-\bar{y})
}{
\sqrt{
\sum(x_i-\bar{x})^2
\sum(y_i-\bar{y})^2
}
}
\]

```python
print(df[["age", "salary"]].corr())
```

Correlation ranges from \(-1\) to \(1\).

```text
+1 = strong positive linear relationship
 0 = no linear relationship
-1 = strong negative linear relationship
```

Correlation does not prove causation.

---

# 8. Data Cleaning

## 8.1 Missing Values

### Remove missing rows

```python
df = df.dropna()
```

### Fill numerical values

```python
df["age"] = df["age"].fillna(df["age"].median())
```

### Fill categorical values

```python
df["city"] = df["city"].fillna(df["city"].mode()[0])
```

### Scikit-learn imputer

```python
from sklearn.impute import SimpleImputer

imputer = SimpleImputer(strategy="median")
```

Common strategies:

```text
mean
median
most_frequent
constant
```

---

## 8.2 Duplicate Records

```python
print(df.duplicated().sum())

df = df.drop_duplicates()
```

---

## 8.3 Wrong Data Types

```python
df["date"] = pd.to_datetime(df["date"])
df["salary"] = pd.to_numeric(df["salary"], errors="coerce")
```

---

## 8.4 Text Standardization

```python
df["city"] = (
    df["city"]
    .str.strip()
    .str.lower()
    .str.replace(r"\s+", " ", regex=True)
)
```

---

## 8.5 Outlier Detection Using IQR

\[
IQR = Q_3-Q_1
\]

\[
Lower = Q_1-1.5(IQR)
\]

\[
Upper = Q_3+1.5(IQR)
\]

```python
Q1 = df["salary"].quantile(0.25)
Q3 = df["salary"].quantile(0.75)
IQR = Q3 - Q1

lower = Q1 - 1.5 * IQR
upper = Q3 + 1.5 * IQR

outliers = df[
    (df["salary"] < lower) |
    (df["salary"] > upper)
]

print(outliers)
```

Do not remove every outlier automatically. An outlier can be a real and important observation.

---

# 9. Feature Encoding

ML algorithms generally require numerical inputs.

## 9.1 Label Encoding

```text
Low    → 0
Medium → 1
High   → 2
```

Use it for ordered categories.

```python
mapping = {
    "low": 0,
    "medium": 1,
    "high": 2
}

df["risk_encoded"] = df["risk"].map(mapping)
```

---

## 9.2 One-Hot Encoding

```text
city_Delhi
city_Mumbai
city_Pune
```

Use it for nominal categories with no natural order.

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(
    handle_unknown="ignore"
)
```

---

# 10. Feature Scaling

## 10.1 Standardization

\[
z =
\frac{x-\mu}{\sigma}
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(x\) | Original value |
| \(\mu\) | Mean |
| \(\sigma\) | Standard deviation |
| \(z\) | Standardized value |

The output usually has mean near 0 and standard deviation near 1.

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

Important for:

```text
KNN
SVM
Logistic Regression
Linear Regression with regularization
PCA
Neural Networks
```

---

## 10.2 Min-Max Scaling

\[
x' =
\frac{x-x_{min}}
{x_{max}-x_{min}}
\]

Usually transforms values into the range 0 to 1.

```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)
```

---

## 10.3 Robust Scaling

Uses median and IQR, so it is more resistant to outliers.

```python
from sklearn.preprocessing import RobustScaler

scaler = RobustScaler()
```

Tree-based algorithms usually do not require scaling.

---

# 11. Train-Test Split

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
```

Parameters:

| Parameter | Meaning |
|---|---|
| `test_size=0.2` | 20% testing data |
| `random_state=42` | Reproducible split |
| `stratify=y` | Maintains class ratio |

For time-series data, do not randomly shuffle past and future observations.

---

# 12. Data Leakage

Data leakage happens when training uses information that would not be available at prediction time.

Examples:

```text
Scaling before train-test split
Using future sales to predict past sales
Including target-derived columns
Using the test set during feature selection
```

Wrong:

```python
X_scaled = scaler.fit_transform(X)
X_train, X_test = train_test_split(X_scaled)
```

Better:

```python
X_train, X_test = train_test_split(X)

scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

Best practice: use a pipeline.

---

# 13. Scikit-Learn Pipeline

A pipeline keeps preprocessing and the model together.

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression())
])

model.fit(X_train, y_train)
```

For mixed numerical and categorical data:

```python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

numeric_features = ["age", "salary"]
categorical_features = ["city", "gender"]

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, numeric_features),
    ("cat", categorical_pipeline, categorical_features)
])
```

---

# 14. Bias-Variance Tradeoff

## Bias

Bias is error caused by an overly simple model.

```text
High bias → Underfitting
```

## Variance

Variance is error caused by excessive sensitivity to training data.

```text
High variance → Overfitting
```

\[
Expected\ Error
=
Bias^2+Variance+Irreducible\ Error
\]

| Problem | Training Score | Test Score |
|---|---:|---:|
| Underfitting | Low | Low |
| Good fit | High | High |
| Overfitting | Very high | Low |

---

# 15. Overfitting and Underfitting

## Underfitting

The model is too simple.

Solutions:

```text
Use a more powerful model
Create better features
Reduce regularization
Train longer
Add non-linear features
```

## Overfitting

The model memorizes training data.

Solutions:

```text
More training data
Cross-validation
Regularization
Reduce model complexity
Feature selection
Pruning
Early stopping
Dropout
Data augmentation
```

---

# 16. Linear Regression

Linear regression predicts a continuous value.

## Formula

\[
\hat{y}
=
\beta_0+\beta_1x_1+\beta_2x_2+\cdots+\beta_px_p
\]

Parameters:

| Symbol | Name | Meaning |
|---|---|---|
| \(\hat{y}\) | Prediction | Predicted target |
| \(\beta_0\) | Intercept | Base prediction |
| \(\beta_j\) | Coefficient | Effect of feature \(j\) |
| \(x_j\) | Feature | Input value |
| \(p\) | Feature count | Number of predictors |

Example:

\[
Salary = 20,000 + 8,000(Experience)
\]

For 5 years:

\[
Salary = 20,000+8,000(5)=60,000
\]

## Cost Function

\[
MSE =
\frac{1}{n}
\sum_{i=1}^{n}
(y_i-\hat{y}_i)^2
\]

The model selects coefficients that minimize MSE.

## Code

```python
import pandas as pd
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

df = pd.DataFrame({
    "experience": [1, 2, 3, 4, 5, 6, 7],
    "salary": [
        30000, 38000, 47000,
        56000, 64000, 73000, 81000
    ]
})

X = df[["experience"]]
y = df["salary"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42
)

model = LinearRegression()
model.fit(X_train, y_train)

y_pred = model.predict(X_test)

print("Intercept:", model.intercept_)
print("Coefficient:", model.coef_[0])
print("MAE:", mean_absolute_error(y_test, y_pred))
print("RMSE:", np.sqrt(mean_squared_error(y_test, y_pred)))
print("R2:", r2_score(y_test, y_pred))
```

## Main assumptions

```text
Linear relationship
Independent observations
Constant error variance
Residuals approximately normal for statistical inference
Limited multicollinearity
```

---

# 17. Polynomial Regression

Polynomial regression captures curved relationships.

\[
\hat{y}
=
\beta_0+
\beta_1x+
\beta_2x^2+
\cdots+
\beta_dx^d
\]

Here \(d\) is the polynomial degree.

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression

model = Pipeline([
    ("poly", PolynomialFeatures(
        degree=2,
        include_bias=False
    )),
    ("regressor", LinearRegression())
])

model.fit(X_train, y_train)
```

A very high degree can overfit.

---

# 18. Ridge Regression

Ridge adds L2 regularization.

\[
J =
MSE+
\lambda
\sum_{j=1}^{p}\beta_j^2
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(J\) | Total objective |
| \(\lambda\) | Regularization strength |
| \(\beta_j\) | Model coefficient |
| \(p\) | Number of features |

Ridge reduces large coefficients but generally does not make them exactly zero.

```python
from sklearn.linear_model import Ridge

model = Ridge(alpha=1.0)
model.fit(X_train, y_train)
```

In scikit-learn, `alpha` represents the regularization strength.

---

# 19. Lasso Regression

Lasso uses L1 regularization.

\[
J =
MSE+
\lambda
\sum_{j=1}^{p}|\beta_j|
\]

Lasso can make unimportant coefficients exactly zero.

```python
from sklearn.linear_model import Lasso

model = Lasso(alpha=0.1)
model.fit(X_train, y_train)
```

Use Lasso when feature selection is useful.

---

# 20. Elastic Net

Elastic Net combines L1 and L2 penalties.

\[
J =
MSE+
\lambda
\left[
\alpha\sum|\beta_j|
+
(1-\alpha)\sum\beta_j^2
\right]
\]

```python
from sklearn.linear_model import ElasticNet

model = ElasticNet(
    alpha=0.1,
    l1_ratio=0.5
)

model.fit(X_train, y_train)
```

`l1_ratio` controls the balance between L1 and L2.

---

# 21. Logistic Regression

Logistic regression predicts class probability.

## Linear score

\[
z =
\beta_0+
\beta_1x_1+
\cdots+
\beta_px_p
\]

## Sigmoid

\[
p =
\frac{1}{1+e^{-z}}
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(p\) | Probability of class 1 |
| \(z\) | Linear score |
| \(e\) | Euler’s number |
| \(\beta_j\) | Model coefficient |
| \(x_j\) | Input feature |

Decision:

\[
\hat{y}=
\begin{cases}
1,&p\geq0.5\\
0,&p<0.5
\end{cases}
\]

## Binary Cross-Entropy

\[
L =
-\frac{1}{n}
\sum_{i=1}^{n}
[
y_i\log(p_i)
+
(1-y_i)\log(1-p_i)
]
\]

## Code

```python
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

model = Pipeline([
    ("scaler", StandardScaler()),
    ("classifier", LogisticRegression(
        max_iter=1000
    ))
])

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_probability = model.predict_proba(X_test)[:, 1]

print(classification_report(y_test, y_pred))
```

## Odds and log-odds

\[
Odds =
\frac{p}{1-p}
\]

\[
LogOdds =
\ln
\left(
\frac{p}{1-p}
\right)
\]

Logistic regression models log-odds as a linear function of features.

---

# 22. K-Nearest Neighbors

KNN predicts based on nearby observations.

## Euclidean Distance

\[
d(\mathbf{x},\mathbf{y})
=
\sqrt{
\sum_{j=1}^{p}
(x_j-y_j)^2
}
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(d\) | Distance |
| \(p\) | Number of features |
| \(x_j,y_j\) | Feature values |

Classification:

\[
\hat{y}
=
Mode(
k\ nearest\ labels
)
\]

Regression:

\[
\hat{y}
=
\frac{1}{k}
\sum_{i=1}^{k}y_i
\]

```python
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

model = Pipeline([
    ("scaler", StandardScaler()),
    ("knn", KNeighborsClassifier(
        n_neighbors=5
    ))
])

model.fit(X_train, y_train)
```

Important:

```text
Small K → sensitive to noise
Large K → smoother but may underfit
Scaling is important
Prediction can be slow on large datasets
```

---

# 23. Decision Tree

A decision tree creates if-else rules.

## Entropy

\[
Entropy =
-\sum_{c=1}^{C}
p_c\log_2(p_c)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(C\) | Number of classes |
| \(p_c\) | Proportion of class \(c\) |

## Gini Impurity

\[
Gini =
1-
\sum_{c=1}^{C}p_c^2
\]

## Information Gain

\[
IG =
Impurity(parent)
-
\sum_j
\frac{N_j}{N}
Impurity(child_j)
\]

The tree selects splits that reduce impurity.

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(
    criterion="gini",
    max_depth=5,
    min_samples_split=10,
    random_state=42
)

model.fit(X_train, y_train)
```

Important hyperparameters:

| Parameter | Meaning |
|---|---|
| `max_depth` | Maximum tree depth |
| `min_samples_split` | Minimum observations to split |
| `min_samples_leaf` | Minimum observations in a leaf |
| `criterion` | Split-quality measure |

Advantages:

```text
Easy to understand
Works with non-linear relationships
No scaling required
Handles interactions automatically
```

Disadvantage: easily overfits.

---

# 24. Random Forest

Random Forest trains many decision trees.

Classification:

\[
\hat{y}
=
Mode
\{
h_1(x),h_2(x),\ldots,h_B(x)
\}
\]

Regression:

\[
\hat{y}
=
\frac{1}{B}
\sum_{b=1}^{B}h_b(x)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(B\) | Number of trees |
| \(h_b(x)\) | Prediction from tree \(b\) |

```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    min_samples_leaf=2,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)
```

Why it works:

```text
Bootstrap samples create different trees
Random feature subsets reduce correlation
Voting or averaging reduces variance
```

---

# 25. Support Vector Machine

SVM finds a decision boundary with maximum margin.

## Hyperplane

\[
\mathbf{w}^T\mathbf{x}+b=0
\]

## Prediction

\[
\hat{y}
=
sign(
\mathbf{w}^T\mathbf{x}+b
)
\]

## Margin

\[
Margin =
\frac{2}{\|\mathbf{w}\|}
\]

## Soft-margin objective

\[
\min
\frac{1}{2}\|\mathbf{w}\|^2
+
C\sum_{i=1}^{n}\xi_i
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(\mathbf{w}\) | Hyperplane weights |
| \(b\) | Bias |
| \(C\) | Error penalty |
| \(\xi_i\) | Slack variable |

```python
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

model = Pipeline([
    ("scaler", StandardScaler()),
    ("svm", SVC(
        kernel="rbf",
        C=1.0,
        gamma="scale",
        probability=True
    ))
])

model.fit(X_train, y_train)
```

## RBF Kernel

\[
K(x,z)
=
\exp
(
-\gamma\|x-z\|^2
)
\]

```text
Large C → fewer training errors, higher overfitting risk
Small C → wider margin, more regularization
Large gamma → narrow influence
Small gamma → smoother boundary
```

---

# 26. Naive Bayes

Naive Bayes uses Bayes’ theorem.

\[
P(C|X)
=
\frac{
P(X|C)P(C)
}{
P(X)
}
\]

Parameters:

| Symbol | Name | Meaning |
|---|---|---|
| \(P(C|X)\) | Posterior | Class probability after features |
| \(P(X|C)\) | Likelihood | Feature probability for class |
| \(P(C)\) | Prior | Initial class probability |
| \(P(X)\) | Evidence | Total feature probability |

Naive Bayes assumes features are conditionally independent.

## Gaussian Naive Bayes

Used for continuous numerical features.

```python
from sklearn.naive_bayes import GaussianNB

model = GaussianNB()
model.fit(X_train, y_train)
```

## Multinomial Naive Bayes

Used for word counts and text data.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB())
])
```

---

# 27. Bagging vs Boosting

| Bagging | Boosting |
|---|---|
| Models train independently | Models train sequentially |
| Reduces variance | Mainly reduces bias |
| Random Forest | AdaBoost, Gradient Boosting |
| Parallelizable | Less parallel by nature |

---

# 28. AdaBoost

AdaBoost gives more weight to previously misclassified observations.

Final prediction:

\[
F(x)=
\sum_{m=1}^{M}
\alpha_mh_m(x)
\]

Learner weight:

\[
\alpha_m =
\frac{1}{2}
\ln
\left(
\frac{1-\epsilon_m}{\epsilon_m}
\right)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(M\) | Number of weak learners |
| \(h_m\) | Weak learner |
| \(\epsilon_m\) | Weighted error |
| \(\alpha_m\) | Learner importance |

```python
from sklearn.ensemble import AdaBoostClassifier

model = AdaBoostClassifier(
    n_estimators=100,
    learning_rate=0.1,
    random_state=42
)

model.fit(X_train, y_train)
```

---

# 29. Gradient Boosting

Gradient Boosting trains each new model to correct earlier errors.

\[
F_m(x)
=
F_{m-1}(x)+\eta h_m(x)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(F_m\) | Updated ensemble |
| \(F_{m-1}\) | Previous ensemble |
| \(h_m\) | New weak learner |
| \(\eta\) | Learning rate |

```python
from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.05,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)
```

---

# 30. XGBoost, LightGBM and CatBoost

## XGBoost

Strengths:

```text
Strong tabular performance
Regularization
Missing-value handling
Parallel computation
```

## LightGBM

Strengths:

```text
Fast on large datasets
Memory efficient
Leaf-wise growth
```

## CatBoost

Strengths:

```text
Strong categorical feature handling
Less manual encoding
Good default performance
```

Example using XGBoost:

```python
from xgboost import XGBClassifier

model = XGBClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    random_state=42
)

model.fit(X_train, y_train)
```

---

# 31. K-Means Clustering

K-Means groups similar observations.

## Objective

\[
J =
\sum_{k=1}^{K}
\sum_{x_i\in C_k}
\|x_i-\mu_k\|^2
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(K\) | Number of clusters |
| \(C_k\) | Cluster \(k\) |
| \(\mu_k\) | Cluster centroid |
| \(x_i\) | Observation |

## Steps

```text
1. Select K centroids
2. Assign each point to the nearest centroid
3. Recalculate centroids
4. Repeat until assignments stabilize
```

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = KMeans(
    n_clusters=3,
    n_init=10,
    random_state=42
)

clusters = model.fit_predict(X_scaled)
```

## Elbow Method

Plot inertia for different values of \(K\).

```python
inertias = []

for k in range(1, 10):
    model = KMeans(
        n_clusters=k,
        n_init=10,
        random_state=42
    )
    model.fit(X_scaled)
    inertias.append(model.inertia_)
```

---

# 32. Silhouette Score

\[
s(i)
=
\frac{
b(i)-a(i)
}{
\max(a(i),b(i))
}
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(a(i)\) | Average distance within own cluster |
| \(b(i)\) | Nearest other-cluster distance |

Range:

```text
Near 1 → good clustering
Near 0 → overlapping clusters
Below 0 → likely wrong assignment
```

```python
from sklearn.metrics import silhouette_score

score = silhouette_score(
    X_scaled,
    clusters
)

print(score)
```

---

# 33. Hierarchical Clustering

Hierarchical clustering builds a tree of clusters called a dendrogram.

Types:

```text
Agglomerative: starts with individual points and merges
Divisive: starts with one cluster and splits
```

Common linkage methods:

```text
Single
Complete
Average
Ward
```

```python
from sklearn.cluster import AgglomerativeClustering

model = AgglomerativeClustering(
    n_clusters=3,
    linkage="ward"
)

clusters = model.fit_predict(X_scaled)
```

---

# 34. DBSCAN

DBSCAN forms clusters based on dense regions.

Important parameters:

| Parameter | Meaning |
|---|---|
| `eps` | Maximum neighborhood distance |
| `min_samples` | Minimum points required for a dense region |

```python
from sklearn.cluster import DBSCAN

model = DBSCAN(
    eps=0.5,
    min_samples=5
)

clusters = model.fit_predict(X_scaled)
```

Advantages:

```text
Finds irregularly shaped clusters
Does not require number of clusters
Detects noise
```

Disadvantages:

```text
Sensitive to eps
Difficult with different cluster densities
Scaling is important
```

---

# 35. Gaussian Mixture Model

GMM assumes data is generated from multiple Gaussian distributions.

\[
P(x)=
\sum_{k=1}^{K}
\pi_k
\mathcal{N}(x|\mu_k,\Sigma_k)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(K\) | Number of Gaussian components |
| \(\pi_k\) | Component weight |
| \(\mu_k\) | Mean |
| \(\Sigma_k\) | Covariance matrix |

Unlike K-Means, GMM provides probability-based soft assignments.

```python
from sklearn.mixture import GaussianMixture

model = GaussianMixture(
    n_components=3,
    random_state=42
)

clusters = model.fit_predict(X_scaled)
probabilities = model.predict_proba(X_scaled)
```

---

# 36. PCA

PCA reduces feature dimensions while preserving maximum variance.

## Standardization

\[
z_{ij}
=
\frac{x_{ij}-\mu_j}{\sigma_j}
\]

## Covariance Matrix

\[
\Sigma =
\frac{1}{n-1}X^TX
\]

## Eigen decomposition

\[
\Sigma v_j=\lambda_jv_j
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(\Sigma\) | Covariance matrix |
| \(v_j\) | Principal direction |
| \(\lambda_j\) | Variance captured |
| \(X\) | Centered data |

## Explained Variance Ratio

\[
EVR_j =
\frac{\lambda_j}
{\sum_k\lambda_k}
\]

```python
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

X_scaled = StandardScaler().fit_transform(X)

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X_scaled)

print(pca.explained_variance_ratio_)
```

PCA components are combinations of original features and may be difficult to interpret.

---

# 37. Feature Engineering

Feature engineering creates useful inputs from raw data.

Examples:

```python
df["order_date"] = pd.to_datetime(df["order_date"])

df["order_month"] = df["order_date"].dt.month
df["order_day"] = df["order_date"].dt.day
df["order_weekday"] = df["order_date"].dt.dayofweek

df["avg_order_value"] = (
    df["total_spent"] /
    df["total_orders"].replace(0, 1)
)
```

Other examples:

```text
Polynomial features
Interaction features
Log transformation
Binning
Lag features
Rolling averages
Text vectors
Image embeddings
```

## Log Transformation

\[
x'=\log(1+x)
\]

Useful for strongly right-skewed positive features.

```python
import numpy as np

df["log_income"] = np.log1p(df["income"])
```

---

# 38. Feature Selection

## Filter Methods

Independent of a model.

```text
Correlation
Chi-square
ANOVA
Mutual information
Variance threshold
```

## Wrapper Methods

Evaluate feature subsets using model performance.

```text
Recursive Feature Elimination
Forward Selection
Backward Elimination
```

## Embedded Methods

Feature selection happens during model training.

```text
Lasso
Decision Tree
Random Forest
Boosting
```

Example:

```python
from sklearn.feature_selection import SelectKBest
from sklearn.feature_selection import mutual_info_classif

selector = SelectKBest(
    score_func=mutual_info_classif,
    k=5
)

X_selected = selector.fit_transform(X, y)
```

---

# 39. Cross-Validation

Cross-validation provides a more reliable estimate of performance.

## K-Fold CV

```text
Split data into K folds.
Train on K−1 folds.
Validate on the remaining fold.
Repeat K times.
```

Mean score:

\[
\bar{s}=
\frac{1}{K}
\sum_{i=1}^{K}s_i
\]

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(
    model,
    X,
    y,
    cv=5,
    scoring="accuracy"
)

print("Scores:", scores)
print("Mean:", scores.mean())
print("Std:", scores.std())
```

Use `StratifiedKFold` for classification.

Use `TimeSeriesSplit` for time-series problems.

---

# 40. Hyperparameter Tuning

## Grid Search

Tries every specified combination.

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    random_state=42
)

parameters = {
    "n_estimators": [100, 200],
    "max_depth": [5, 10, None],
    "min_samples_leaf": [1, 2, 5]
}

grid = GridSearchCV(
    estimator=model,
    param_grid=parameters,
    cv=5,
    scoring="f1",
    n_jobs=-1
)

grid.fit(X_train, y_train)

print(grid.best_params_)
print(grid.best_score_)
```

## Randomized Search

Tries random combinations and is faster for large search spaces.

```python
from sklearn.model_selection import RandomizedSearchCV

search = RandomizedSearchCV(
    estimator=model,
    param_distributions=parameters,
    n_iter=10,
    cv=5,
    scoring="f1",
    random_state=42,
    n_jobs=-1
)
```

Always perform tuning using training data, not the final test set.

---

# 41. Regression Metrics

## Mean Absolute Error

\[
MAE =
\frac{1}{n}
\sum_{i=1}^{n}|y_i-\hat{y}_i|
\]

Easy to interpret and less sensitive to extreme errors.

## Mean Squared Error

\[
MSE =
\frac{1}{n}
\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
\]

Penalizes large errors strongly.

## Root Mean Squared Error

\[
RMSE =
\sqrt{
\frac{1}{n}
\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
}
\]

Same unit as the target.

## R-Squared

\[
R^2 =
1-
\frac{
\sum(y_i-\hat{y}_i)^2
}{
\sum(y_i-\bar{y})^2
}
\]

An \(R^2\) of 0.80 means the model explains approximately 80% of target variance.

## Adjusted R-Squared

\[
Adjusted\ R^2 =
1-
(1-R^2)
\frac{n-1}{n-p-1}
\]

It penalizes unnecessary features.

---

# 42. Classification Metrics

## Confusion Matrix

|  | Predicted Positive | Predicted Negative |
|---|---:|---:|
| Actual Positive | TP | FN |
| Actual Negative | FP | TN |

## Accuracy

\[
Accuracy =
\frac{TP+TN}
{TP+TN+FP+FN}
\]

Best when classes are balanced and errors have similar costs.

## Precision

\[
Precision =
\frac{TP}{TP+FP}
\]

Out of predicted positives, how many were correct?

Useful when false positives are expensive.

## Recall

\[
Recall =
\frac{TP}{TP+FN}
\]

Out of actual positives, how many were found?

Useful for medical diagnosis and fraud detection.

## Specificity

\[
Specificity =
\frac{TN}{TN+FP}
\]

## F1 Score

\[
F1 =
2
\frac{
Precision\times Recall
}{
Precision+Recall
}
\]

Useful for imbalanced classification.

## Code

```python
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score
)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred))
print("Recall:", recall_score(y_test, y_pred))
print("F1:", f1_score(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))
print(classification_report(y_test, y_pred))
```

---

# 43. ROC-AUC and Precision-Recall

## True Positive Rate

\[
TPR =
\frac{TP}{TP+FN}
\]

## False Positive Rate

\[
FPR =
\frac{FP}{FP+TN}
\]

ROC-AUC measures how well the model ranks positives above negatives.

For highly imbalanced data, the Precision-Recall curve is often more informative.

---

# 44. Class Imbalance

Example:

```text
99% genuine transactions
1% fraudulent transactions
```

A model predicting every transaction as genuine gets 99% accuracy but detects no fraud.

Solutions:

```text
Use precision, recall, F1, PR-AUC
Class weights
Undersampling
Oversampling
SMOTE
Threshold tuning
Anomaly detection
```

## Class weights

```python
model = LogisticRegression(
    class_weight="balanced",
    max_iter=1000
)
```

## SMOTE

Apply SMOTE only to training data.

```python
from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)

X_train_resampled, y_train_resampled = (
    smote.fit_resample(X_train, y_train)
)
```

---

# 45. Threshold Tuning

The default classification threshold is often 0.5, but it can be changed.

```python
probabilities = model.predict_proba(X_test)[:, 1]

threshold = 0.3
predictions = (
    probabilities >= threshold
).astype(int)
```

Lower threshold:

```text
Higher recall
More false positives
```

Higher threshold:

```text
Higher precision
More false negatives
```

Select the threshold based on business cost.

---

# 46. Time-Series Basics

Time-series data is ordered by time.

Components:

```text
Trend
Seasonality
Cyclic variation
Noise
```

## Lag Feature

\[
Lag_1(t)=y_{t-1}
\]

```python
df["lag_1"] = df["sales"].shift(1)
df["lag_7"] = df["sales"].shift(7)
```

## Moving Average

\[
MA_t =
\frac{1}{k}
\sum_{i=0}^{k-1}y_{t-i}
\]

```python
df["moving_avg_7"] = (
    df["sales"]
    .shift(1)
    .rolling(7)
    .mean()
)
```

## Differencing

\[
\Delta y_t=y_t-y_{t-1}
\]

```python
df["difference"] = df["sales"].diff()
```

For time series:

```text
Train on past
Test on future
Never use random split blindly
```

---

# 47. ARIMA

\[
ARIMA(p,d,q)
\]

Parameters:

| Parameter | Meaning |
|---|---|
| \(p\) | Number of autoregressive lags |
| \(d\) | Differencing order |
| \(q\) | Number of past error terms |

AR model:

\[
y_t =
c+
\phi_1y_{t-1}
+\cdots+
\phi_py_{t-p}
+\epsilon_t
\]

ARIMA works best for suitable univariate time-series patterns and often expects stationarity after differencing.

---

# 48. Deep Learning Basics

Deep learning uses neural networks with multiple layers.

```text
Input layer → Hidden layers → Output layer
```

## Artificial Neuron

\[
z =
\sum_{j=1}^{p}w_jx_j+b
\]

\[
a=f(z)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(x_j\) | Input |
| \(w_j\) | Weight |
| \(b\) | Bias |
| \(f\) | Activation |
| \(a\) | Output |

---

# 49. Activation Functions

## ReLU

\[
ReLU(z)=\max(0,z)
\]

Used in hidden layers.

## Sigmoid

\[
\sigma(z)=\frac{1}{1+e^{-z}}
\]

Used for binary classification output.

## Softmax

\[
P(y=j)=
\frac{e^{z_j}}
{\sum_{k=1}^{K}e^{z_k}}
\]

Used for multiclass output.

---

# 50. Forward Propagation

For layer \(l\):

\[
z^{(l)}
=
W^{(l)}a^{(l-1)}
+b^{(l)}
\]

\[
a^{(l)}
=
f(z^{(l)})
\]

The network transforms inputs layer by layer.

---

# 51. Backpropagation

Backpropagation calculates gradients using the chain rule.

\[
\frac{\partial L}
{\partial W^{(l)}}
\]

The optimizer then updates weights:

\[
W_{new}
=
W_{old}
-
\eta
\frac{\partial L}{\partial W}
\]

Here \(\eta\) is the learning rate.

---

# 52. Gradient Descent

\[
\theta_{t+1}
=
\theta_t
-
\eta\nabla J(\theta_t)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(\theta_t\) | Current parameter |
| \(\eta\) | Learning rate |
| \(\nabla J\) | Gradient |
| \(J\) | Loss function |

```python
w = 10.0
learning_rate = 0.1

for _ in range(20):
    gradient = 2 * w
    w = w - learning_rate * gradient

print(w)
```

---

# 53. ANN Code

```python
import tensorflow as tf

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X, y = load_iris(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

scaler = StandardScaler()

X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(4,)),
    tf.keras.layers.Dense(
        32,
        activation="relu"
    ),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(
        16,
        activation="relu"
    ),
    tf.keras.layers.Dense(
        3,
        activation="softmax"
    )
])

model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

model.fit(
    X_train,
    y_train,
    epochs=50,
    batch_size=16,
    validation_split=0.2,
    verbose=0
)

loss, accuracy = model.evaluate(
    X_test,
    y_test,
    verbose=0
)

print("Accuracy:", accuracy)
```

---

# 54. CNN Basics

CNNs are used for images.

Main layers:

```text
Convolution
Activation
Pooling
Flattening
Dense layer
```

## Convolution

\[
Y(i,j)
=
\sum_m\sum_n
X(i+m,j+n)K(m,n)
\]

Output size:

\[
Output =
\left\lfloor
\frac{N+2P-F}{S}
\right\rfloor+1
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(N\) | Input size |
| \(P\) | Padding |
| \(F\) | Filter size |
| \(S\) | Stride |

---

# 55. RNN and LSTM

RNN is used for sequential data.

\[
h_t =
\tanh(
W_{xh}x_t+
W_{hh}h_{t-1}+b
)
\]

Problem: vanishing gradients.

LSTM solves this using gates:

```text
Forget gate
Input gate
Cell state
Output gate
```

Applications:

```text
Text
Speech
Time series
Sequential sensor data
```

Transformers are now commonly preferred for many NLP tasks because they process tokens using attention and allow better parallelization.

---

# 56. NLP Basics

Typical NLP pipeline:

```text
Text cleaning
Tokenization
Stop-word handling
Stemming/Lemmatization
Vectorization
Model training
Evaluation
```

## Bag of Words

Represents text using word counts.

## TF-IDF

\[
TFIDF(t,d)
=
TF(t,d)\times IDF(t)
\]

\[
IDF(t)=
\log
\left(
\frac{N}{DF(t)}
\right)
\]

Parameters:

| Symbol | Meaning |
|---|---|
| \(t\) | Term |
| \(d\) | Document |
| \(N\) | Number of documents |
| \(DF(t)\) | Documents containing term |

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

text_model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )),
    ("classifier", LogisticRegression(
        max_iter=1000
    ))
])
```

---

# 57. Embeddings

Embeddings convert items into dense vectors.

Examples:

```text
Word embeddings
Sentence embeddings
Product embeddings
User embeddings
Image embeddings
```

Similar items usually have vectors close to each other.

Cosine similarity:

\[
Similarity =
\frac{
a\cdot b
}{
\|a\|\|b\|
}
\]

Used in:

```text
Search
Recommendations
RAG
Semantic similarity
Clustering
```

---

# 58. Recommendation Systems

Types:

```text
Popularity-based
Content-based
Collaborative filtering
Hybrid
```

## Content-based filtering

Recommends items similar to items the user liked.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

vectorizer = TfidfVectorizer(
    stop_words="english"
)

item_vectors = vectorizer.fit_transform(
    item_descriptions
)

similarity_matrix = cosine_similarity(
    item_vectors
)
```

## Collaborative filtering

Uses user-item interactions.

Matrix factorization approximates:

\[
R \approx UV^T
\]

where:

| Symbol | Meaning |
|---|---|
| \(R\) | User-item rating matrix |
| \(U\) | User latent factors |
| \(V\) | Item latent factors |

---

# 59. Explainable AI

Explainable AI helps answer:

```text
Why did the model make this prediction?
Which features were important?
Can the decision be trusted?
```

## Feature Importance

```python
importance = model.feature_importances_
```

## SHAP

SHAP assigns each feature a contribution value based on Shapley values.

Interpretation:

```text
Positive SHAP value → pushes prediction upward
Negative SHAP value → pushes prediction downward
```

## LIME

LIME builds a simple local model near one prediction.

Difference:

| SHAP | LIME |
|---|---|
| Strong theoretical foundation | Local surrogate explanation |
| Local and global use | Mainly local |
| Can be slower | Often simple and fast |

---

# 60. Error Analysis

Do not stop after viewing one metric.

Create an error table:

```python
results = X_test.copy()

results["actual"] = y_test.values
results["predicted"] = y_pred

errors = results[
    results["actual"] !=
    results["predicted"]
]

print(errors.head())
```

Check errors by:

```text
Class
Age group
Region
Product type
Time period
Missing-value pattern
Confidence score
```

Questions:

```text
Is one group performing poorly?
Are labels incorrect?
Are important features missing?
Is the decision threshold unsuitable?
Is class imbalance causing errors?
```

---

# 61. Model Selection

Model selection is not only choosing the highest score.

Consider:

```text
Validation performance
Business metric
Interpretability
Inference speed
Training cost
Data size
Feature type
Robustness
Fairness
Maintenance complexity
```

Recommended approach:

```text
1. Create a simple baseline
2. Try multiple algorithms
3. Use cross-validation
4. Tune promising models
5. Evaluate once on the final test set
6. Select based on technical and business requirements
```

---

# 62. Model Deployment

Deployment makes a trained model available to users.

```text
Train model
Save model
Create API or app
Containerize
Deploy
Monitor
Retrain
```

## Save Pipeline

```python
import joblib

joblib.dump(
    model,
    "customer_churn_model.joblib"
)
```

Load it:

```python
model = joblib.load(
    "customer_churn_model.joblib"
)
```

---

# 63. FastAPI Deployment

```python
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

app = FastAPI()

model = joblib.load(
    "customer_churn_model.joblib"
)

class CustomerInput(BaseModel):
    tenure: float
    monthly_charges: float
    contract: str

@app.get("/")
def home():
    return {
        "message": "ML API is running"
    }

@app.post("/predict")
def predict(data: CustomerInput):
    input_df = pd.DataFrame([{
        "tenure": data.tenure,
        "monthly_charges": data.monthly_charges,
        "contract": data.contract
    }])

    prediction = int(
        model.predict(input_df)[0]
    )

    probability = float(
        model.predict_proba(input_df)[0][1]
    )

    return {
        "prediction": prediction,
        "probability": probability
    }
```

Run:

```bash
uvicorn main:app --reload
```

---

# 64. Streamlit Deployment

```python
import streamlit as st
import pandas as pd
import joblib

model = joblib.load(
    "customer_churn_model.joblib"
)

st.title("Customer Churn Prediction")

tenure = st.number_input(
    "Tenure",
    min_value=0.0
)

monthly_charges = st.number_input(
    "Monthly Charges",
    min_value=0.0
)

contract = st.selectbox(
    "Contract",
    [
        "Month-to-month",
        "One year",
        "Two year"
    ]
)

if st.button("Predict"):
    input_df = pd.DataFrame([{
        "tenure": tenure,
        "monthly_charges": monthly_charges,
        "contract": contract
    }])

    prediction = model.predict(input_df)[0]

    if prediction == 1:
        st.error("Customer may churn")
    else:
        st.success("Customer may stay")
```

Run:

```bash
streamlit run app.py
```

---

# 65. Model Monitoring

After deployment, monitor:

```text
API latency
Error rate
Input distributions
Missing-value rate
Prediction distribution
Data drift
Concept drift
Model performance
Business impact
```

## Data Drift

Input data distribution changes.

Example:

```text
Training customers were mostly 20–35 years old.
Production customers are mostly 50–70 years old.
```

## Concept Drift

The relationship between features and target changes.

Example:

```text
Old fraud patterns no longer represent current fraud methods.
```

---

# 66. Major ML Project Structure

```text
ml_project/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── notebooks/
│   └── exploration.ipynb
│
├── src/
│   ├── preprocess.py
│   ├── train.py
│   ├── evaluate.py
│   └── predict.py
│
├── models/
│   └── model.joblib
│
├── app/
│   └── main.py
│
├── tests/
│   └── test_model.py
│
├── requirements.txt
├── Dockerfile
├── README.md
└── .gitignore
```

---

# 67. Complete End-to-End Classification Example

```python
import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    StandardScaler,
    OneHotEncoder
)
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score
)

os.makedirs("models", exist_ok=True)

# 1. Load data
df = pd.read_csv("customer_churn.csv")

# 2. Remove exact duplicates
df = df.drop_duplicates()

# 3. Features and target
target = "churn"

X = df.drop(columns=[target])
y = df[target]

# 4. Column groups
numeric_features = [
    "tenure",
    "monthly_charges",
    "total_charges"
]

categorical_features = [
    "contract",
    "internet_service",
    "payment_method"
]

# 5. Pipelines
numeric_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(strategy="median")
    ),
    (
        "scaler",
        StandardScaler()
    )
])

categorical_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(
            strategy="most_frequent"
        )
    ),
    (
        "encoder",
        OneHotEncoder(
            handle_unknown="ignore"
        )
    )
])

preprocessor = ColumnTransformer([
    (
        "numeric",
        numeric_pipeline,
        numeric_features
    ),
    (
        "categorical",
        categorical_pipeline,
        categorical_features
    )
])

# 6. Final model pipeline
model = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "classifier",
        RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42
        )
    )
])

# 7. Split
X_train, X_test, y_train, y_test = (
    train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
)

# 8. Train
model.fit(X_train, y_train)

# 9. Predict
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# 10. Evaluate
print(
    "Accuracy:",
    accuracy_score(y_test, y_pred)
)

print(
    "Precision:",
    precision_score(
        y_test,
        y_pred,
        zero_division=0
    )
)

print(
    "Recall:",
    recall_score(
        y_test,
        y_pred,
        zero_division=0
    )
)

print(
    "F1:",
    f1_score(
        y_test,
        y_pred,
        zero_division=0
    )
)

print(
    "ROC-AUC:",
    roc_auc_score(y_test, y_prob)
)

print(
    "Confusion Matrix:\n",
    confusion_matrix(y_test, y_pred)
)

print(
    "Classification Report:\n",
    classification_report(
        y_test,
        y_pred,
        zero_division=0
    )
)

# 11. Save complete pipeline
joblib.dump(
    model,
    "models/churn_pipeline.joblib"
)
```

---

# 68. Most Asked ML Interview Questions

## What is Machine Learning?

Machine Learning is a branch of AI where algorithms learn patterns from data and use them to make predictions or decisions on new data.

## Supervised vs Unsupervised Learning?

Supervised learning uses labeled data with a target. Unsupervised learning has no target and discovers hidden patterns.

## Regression vs Classification?

Regression predicts continuous numbers. Classification predicts classes or categories.

## Parameter vs Hyperparameter?

Parameters are learned during training, such as coefficients. Hyperparameters are chosen before training, such as tree depth or learning rate.

## What is overfitting?

Overfitting happens when a model learns training data too closely and performs poorly on unseen data.

## What is underfitting?

Underfitting happens when a model is too simple and performs poorly on training and testing data.

## What is regularization?

Regularization adds a penalty to control model complexity and reduce overfitting.

## What is cross-validation?

Cross-validation evaluates a model on multiple train-validation splits to obtain a more reliable performance estimate.

## Why is feature scaling required?

Distance-based and gradient-based algorithms can be dominated by features with larger numerical ranges. Scaling brings features to comparable scales.

## Why do trees not require scaling?

Trees split values using thresholds. They do not depend on Euclidean distance or gradient magnitude.

## What is data leakage?

Data leakage happens when the model receives information during training that would not be available at real prediction time.

## Precision vs Recall?

Precision measures correctness among predicted positives. Recall measures how many actual positives were found.

## When is recall important?

Recall is important when missing a positive case is costly, such as disease or fraud detection.

## When is precision important?

Precision is important when false alarms are costly, such as marking important emails as spam.

## What is F1 score?

F1 is the harmonic mean of precision and recall. It is useful when both metrics matter.

## Bagging vs Boosting?

Bagging trains models independently and reduces variance. Boosting trains models sequentially and corrects earlier errors.

## Random Forest vs XGBoost?

Random Forest uses independent trees and averaging. XGBoost builds trees sequentially to correct errors and often provides stronger tabular performance but requires more tuning.

## What is PCA?

PCA is an unsupervised dimensionality-reduction method that creates components capturing maximum variance.

## What is a baseline model?

A baseline is a simple reference model used to determine whether more complex models provide meaningful improvement.

## Why use a pipeline?

A pipeline applies preprocessing consistently, prevents leakage and simplifies training, validation and deployment.

---

# 69. How to Explain an ML Project in an Interview

Use this order:

```text
1. Problem statement
2. Business value
3. Dataset and source
4. Features and target
5. Data cleaning
6. EDA findings
7. Feature engineering
8. Algorithms tried
9. Evaluation metric
10. Final result
11. Deployment
12. Limitations
13. Future improvements
```

Example:

> I developed a customer churn prediction system to identify customers likely to leave a telecom service. I cleaned missing values, encoded categorical variables and created customer-behavior features such as tenure, monthly charges and contract type. I compared Logistic Regression, Random Forest and Gradient Boosting using stratified cross-validation. Because churn was imbalanced, I focused on recall and F1 score rather than accuracy alone. Random Forest gave the best validation performance. I saved the full preprocessing-model pipeline with Joblib and created a FastAPI endpoint for predictions.

---

# 70. Final ML Revision Table

| Area | Must-Know Topics |
|---|---|
| Python | Lists, dictionaries, functions, OOP |
| NumPy | Arrays, broadcasting, matrix operations |
| Pandas | Cleaning, filtering, grouping, merging |
| Statistics | Mean, variance, probability, correlation |
| Preprocessing | Missing values, encoding, scaling |
| Regression | Linear, Ridge, Lasso, trees, boosting |
| Classification | Logistic, KNN, SVM, NB, forests |
| Clustering | K-Means, Hierarchical, DBSCAN, GMM |
| Dimensionality | PCA |
| Evaluation | MAE, RMSE, Accuracy, Precision, Recall, F1 |
| Validation | Cross-validation, leakage prevention |
| Tuning | Grid Search, Random Search |
| Deep Learning | ANN, CNN, RNN, LSTM |
| NLP | TF-IDF, embeddings, classifiers |
| Deployment | Joblib, FastAPI, Streamlit |
| MLOps | Versioning, monitoring, retraining |

# Final Interview Answer

> I understand the complete machine-learning lifecycle, starting from problem definition, data collection, EDA, cleaning, feature engineering and preprocessing. I can build regression, classification, clustering and dimensionality-reduction models using algorithms such as Linear Regression, Logistic Regression, KNN, Decision Tree, Random Forest, SVM, Naive Bayes, K-Means, PCA and boosting methods. I evaluate models using suitable metrics, prevent leakage using pipelines, perform cross-validation and hyperparameter tuning, handle imbalanced data and conduct error analysis. I also understand deep-learning basics, NLP, time series, model explainability, deployment using FastAPI or Streamlit, and production monitoring.
