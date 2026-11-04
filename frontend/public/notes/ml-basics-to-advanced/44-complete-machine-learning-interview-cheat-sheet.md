> **You asked:**
>
> complete and all ml cheat sheet for interview

# Complete Machine Learning Interview Cheat Sheet

Use this as a **final revision sheet before AI/ML, Data Science, or Machine Learning interviews**.

---

# 1. Machine Learning in One Line

**Machine Learning:** algorithms learn patterns from historical data and use those patterns to predict or make decisions on unseen data.

```text
Data → Preprocessing → Model Training → Evaluation → Prediction → Deployment
```

---

# 2. Types of Machine Learning

| Type | Target? | Purpose | Examples |
|---|---|---|---|
| Supervised | Yes | Predict output | Regression, Classification |
| Unsupervised | No | Discover patterns | Clustering, PCA |
| Semi-Supervised | Partially | Learn from few labels | Image classification |
| Self-Supervised | Generated labels | Representation learning | LLM pretraining |
| Reinforcement Learning | Reward | Learn actions | Robotics, games |

### Supervised Learning

**Regression:** continuous output.

Examples:

```text
House Price
Salary
Sales
Temperature
```

**Classification:** categorical output.

Examples:

```text
Spam / Not Spam
Fraud / Genuine
Churn / Stay
Disease / No Disease
```

---

# 3. Important ML Terms

| Term | Meaning |
|---|---|
| Feature | Input variable |
| Target | Output variable |
| Observation | One row |
| Training | Model learns parameters |
| Inference | Model predicts new data |
| Parameter | Learned by model |
| Hyperparameter | Chosen before training |
| Loss | Error during training |
| Epoch | One pass through data |
| Batch | Small training subset |
| Baseline | Simple reference model |

---

# 4. Complete ML Workflow

```text
1. Understand business problem
2. Define target
3. Collect data
4. Perform EDA
5. Clean data
6. Engineer features
7. Split train/test
8. Build preprocessing pipeline
9. Train baseline
10. Train multiple models
11. Cross-validation
12. Hyperparameter tuning
13. Evaluate test performance
14. Error analysis
15. Explain predictions
16. Save pipeline
17. Deploy
18. Monitor drift/performance
19. Retrain
```

---

# 5. Train, Validation and Test Data

### Train set

Used to learn model parameters.

### Validation set

Used for:

```text
Model selection
Hyperparameter tuning
Threshold selection
```

### Test set

Used once for final unbiased evaluation.

Typical split:

```text
70% Train
15% Validation
15% Test
```

or:

```text
80% Train
20% Test + Cross Validation
```

---

# 6. Train-Test Split Code

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

`stratify=y` is useful for classification because it keeps approximately the same class ratio.

---

# 7. Data Leakage

**Data leakage:** information unavailable at prediction time enters model training.

Examples:

```text
Scaling full dataset before splitting
Using future sales to predict past sales
Target-derived features
Imputing using test-set statistics
Selecting features using test data
```

Correct approach:

```text
Split first → Fit preprocessing on training data → Transform validation/test
```

Best solution:

```python
from sklearn.pipeline import Pipeline
```

---

# 8. Missing Values

## Numerical

Common strategies:

```text
Mean
Median
Model-based imputation
```

Median is safer with outliers.

```python
from sklearn.impute import SimpleImputer

imputer = SimpleImputer(strategy="median")
```

## Categorical

```python
SimpleImputer(strategy="most_frequent")
```

or:

```text
"Unknown"
```

---

# 9. Duplicate Data

```python
df.duplicated().sum()

df = df.drop_duplicates()
```

Duplicates may artificially increase model confidence.

---

# 10. Outliers

Common methods:

```text
IQR
Z-score
Isolation Forest
Domain rules
```

## IQR

\[
IQR = Q_3-Q_1
\]

Lower bound:

\[
Q_1-1.5IQR
\]

Upper bound:

\[
Q_3+1.5IQR
\]

Do not automatically remove every outlier.

Fraud cases, high-value customers, or rare failures may be the most important observations.

---

# 11. Categorical Encoding

## One-Hot Encoding

Use for nominal categories:

```text
Delhi
Mumbai
Jaipur
```

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(
    handle_unknown="ignore"
)
```

## Ordinal Encoding

Use when categories have order:

```text
Low < Medium < High
```

Example:

```python
mapping = {
    "Low": 0,
    "Medium": 1,
    "High": 2
}
```

---

# 12. Feature Scaling

## Standardization

\[
z=\frac{x-\mu}{\sigma}
\]

Where:

- \(x\) = original value
- \(\mu\) = mean
- \(\sigma\) = standard deviation
- \(z\) = standardized value

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
```

Important for:

```text
KNN
SVM
Logistic Regression
PCA
Neural Networks
Regularized Linear Models
```

Usually unnecessary for:

```text
Decision Tree
Random Forest
XGBoost
LightGBM
CatBoost
```

---

# 13. Min-Max Scaling

\[
x'=
\frac{x-x_{min}}
{x_{max}-x_{min}}
\]

Usually converts features into:

```text
0 to 1
```

```python
from sklearn.preprocessing import MinMaxScaler
```

---

# 14. StandardScaler vs MinMaxScaler

| StandardScaler | MinMaxScaler |
|---|---|
| Mean 0, SD 1 | Range typically 0–1 |
| Good general default | Useful for bounded inputs |
| Outlier sensitive | Very outlier sensitive |
| Good for SVM/PCA | Often used in neural networks |

---

# 15. Feature Engineering

Feature engineering means creating useful model inputs.

Examples:

```text
Date → Month, Day, Weekday
Total Spend / Orders → Average Order Value
DOB → Age
Purchase History → Days Since Last Purchase
Sales → Lag 1, Lag 7, Rolling Average
Text → TF-IDF
```

Example:

```python
df["avg_order_value"] = (
    df["total_spent"] /
    df["total_orders"].replace(0, 1)
)
```

---

# 16. Feature Selection

Three types:

### Filter Methods

```text
Correlation
Chi-square
ANOVA
Mutual Information
Variance Threshold
```

### Wrapper Methods

```text
Recursive Feature Elimination
Forward Selection
Backward Selection
```

### Embedded Methods

```text
Lasso
Decision Tree
Random Forest
Boosting
```

---

# 17. Bias-Variance Tradeoff

\[
Expected\ Error
=
Bias^2 + Variance + Noise
\]

### High Bias

```text
Model too simple
Underfitting
```

### High Variance

```text
Model too complex
Overfitting
```

Best model:

```text
Low enough bias + controlled variance
```

---

# 18. Underfitting

Symptoms:

```text
Low training score
Low validation/test score
```

Solutions:

```text
Use stronger model
Add useful features
Reduce regularization
Increase training
Add non-linear terms
```

---

# 19. Overfitting

Symptoms:

```text
Very high training score
Much lower validation/test score
```

Solutions:

```text
Cross-validation
Regularization
Reduce model complexity
More training data
Feature selection
Tree pruning
Dropout
Early stopping
Data augmentation
```

---

# 20. Linear Regression

Used for continuous prediction.

\[
\hat{y}
=
\beta_0+
\beta_1x_1+
\beta_2x_2+
\cdots+
\beta_px_p
\]

Where:

- \(\hat y\) = predicted value
- \(\beta_0\) = intercept
- \(\beta_j\) = coefficient
- \(x_j\) = feature

Example:

\[
Salary=20000+8000(Experience)
\]

For 5 years:

\[
Salary=60000
\]

### Loss

\[
MSE=
\frac1n
\sum(y_i-\hat y_i)^2
\]

### Code

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)

predictions = model.predict(X_test)
```

---

# 21. Linear Regression Assumptions

Important assumptions:

```text
Linear relationship
Independent observations
Constant residual variance
Residual normality for inference
No severe multicollinearity
```

Interview point:

**Prediction does not require every assumption to be perfectly satisfied, but statistical interpretation of coefficients relies more strongly on them.**

---

# 22. Ridge Regression

L2 regularization:

\[
Loss=
MSE+
\lambda\sum_j\beta_j^2
\]

Effect:

```text
Shrinks coefficients
Reduces overfitting
Does not normally make coefficients exactly zero
```

```python
from sklearn.linear_model import Ridge

model = Ridge(alpha=1.0)
```

---

# 23. Lasso Regression

L1:

\[
Loss=
MSE+
\lambda\sum_j|\beta_j|
\]

Effect:

```text
Can make coefficients exactly zero
Performs feature selection
```

```python
from sklearn.linear_model import Lasso
```

---

# 24. Elastic Net

Combines L1 and L2.

\[
Loss =
MSE+
\lambda[
\alpha L1+
(1-\alpha)L2
]
\]

Useful when:

```text
Many correlated features
Need both shrinking and feature selection
```

---

# 25. Logistic Regression

Used for classification.

Linear component:

\[
z=
\beta_0+
\beta_1x_1+
\cdots+
\beta_px_p
\]

Sigmoid:

\[
P(y=1)=
\frac1{1+e^{-z}}
\]

Threshold:

```text
p ≥ 0.5 → Class 1
p < 0.5 → Class 0
```

Code:

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(
    max_iter=1000
)

model.fit(X_train, y_train)
```

---

# 26. Logistic Regression Loss

Binary cross entropy:

\[
L=
-\frac1n
\sum
[
y_i\log(p_i)
+
(1-y_i)\log(1-p_i)
]
\]

Confident wrong predictions get heavily penalized.

---

# 27. Odds and Log-Odds

Odds:

\[
Odds=
\frac{p}{1-p}
\]

Log-odds:

\[
\log
\left(
\frac{p}{1-p}
\right)
\]

Logistic regression models:

\[
LogOdds=
\beta_0+\beta_1x_1+\cdots
\]

---

# 28. K-Nearest Neighbors

KNN predicts based on closest examples.

Euclidean distance:

\[
d(x,y)=
\sqrt{
\sum_i(x_i-y_i)^2
}
\]

Classification:

```text
Majority vote among K nearest neighbors
```

Regression:

```text
Average target of K nearest neighbors
```

```python
from sklearn.neighbors import KNeighborsClassifier

model = KNeighborsClassifier(
    n_neighbors=5
)
```

Important:

```text
Scaling required
Small K → noisy/high variance
Large K → smoother/high bias
Prediction can be slow
```

---

# 29. Decision Tree

Decision Tree creates hierarchical if-else rules.

## Gini

\[
Gini=
1-\sum p_i^2
\]

## Entropy

\[
Entropy=
-\sum p_i\log_2p_i
\]

## Information Gain

\[
IG=
Entropy(parent)
-
WeightedEntropy(children)
\]

Code:

```python
from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(
    max_depth=5,
    min_samples_leaf=5,
    random_state=42
)
```

Advantages:

```text
Interpretable
Non-linear relationships
No scaling required
Feature interactions
```

Weakness:

```text
Easily overfits
```

---

# 30. Random Forest

Random Forest combines multiple decision trees.

Classification:

\[
Prediction=
MajorityVote(Trees)
\]

Regression:

\[
Prediction=
Average(Trees)
\]

```python
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=10,
    random_state=42
)
```

Why it reduces overfitting:

```text
Bootstrap sampling
Random feature subsets
Averaging/voting
```

---

# 31. Bagging

Bagging means:

```text
Bootstrap Aggregating
```

Process:

```text
Create multiple bootstrap datasets
Train models independently
Combine predictions
```

Main purpose:

```text
Reduce variance
```

Random Forest is the most common example.

---

# 32. Boosting

Boosting trains models sequentially.

```text
Model 1 → errors
Model 2 focuses on errors
Model 3 corrects remaining errors
...
```

Common algorithms:

```text
AdaBoost
Gradient Boosting
XGBoost
LightGBM
CatBoost
```

Main advantage:

```text
Excellent tabular-data performance
```

---

# 33. AdaBoost

Final prediction:

\[
F(x)=
\sum_m\alpha_mh_m(x)
\]

Weak learners with better performance get more weight.

Misclassified samples receive greater attention.

---

# 34. Gradient Boosting

\[
F_m(x)
=
F_{m-1}(x)
+
\eta h_m(x)
\]

Where:

- \(F_m\) = updated ensemble
- \(h_m\) = new learner
- \(\eta\) = learning rate

```python
from sklearn.ensemble import GradientBoostingClassifier

model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.05,
    max_depth=3,
    random_state=42
)
```

---

# 35. XGBoost

Important parameters:

| Parameter | Meaning |
|---|---|
| `n_estimators` | Number of trees |
| `learning_rate` | Contribution of each tree |
| `max_depth` | Tree complexity |
| `subsample` | Fraction of rows |
| `colsample_bytree` | Fraction of features |
| `reg_alpha` | L1 regularization |
| `reg_lambda` | L2 regularization |

Strengths:

```text
Regularization
Strong tabular performance
Missing value handling
Efficient implementation
```

---

# 36. XGBoost vs Random Forest

| Random Forest | XGBoost |
|---|---|
| Trees independently trained | Sequential boosting |
| Mainly reduces variance | Reduces errors iteratively |
| Less tuning | More tuning |
| Strong baseline | Often stronger accuracy |
| Easy parallelization | More complex |

---

# 37. LightGBM

Key idea:

```text
Leaf-wise tree growth
```

Advantages:

```text
Fast
Memory efficient
Good for large datasets
```

Potential issue:

```text
Can overfit small datasets
```

---

# 38. CatBoost

Best known for:

```text
Handling categorical variables effectively
```

Advantages:

```text
Less preprocessing
Strong defaults
Good tabular accuracy
```

---

# 39. Support Vector Machine

Decision boundary:

\[
w^Tx+b=0
\]

Goal:

```text
Find the maximum-margin separating hyperplane
```

Prediction:

\[
sign(w^Tx+b)
\]

Margin:

\[
\frac{2}{\|w\|}
\]

```python
from sklearn.svm import SVC

model = SVC(
    kernel="rbf",
    C=1.0,
    gamma="scale"
)
```

---

# 40. SVM Hyperparameters

### `C`

Large C:

```text
Stronger penalty for mistakes
Narrower margin
Higher overfitting risk
```

Small C:

```text
More regularization
Wider margin
```

### Gamma

Large gamma:

```text
Each point has narrow influence
Complex boundary
```

Small gamma:

```text
Broader influence
Smoother boundary
```

---

# 41. SVM Kernels

### Linear

\[
K(x,z)=x^Tz
\]

### Polynomial

\[
K(x,z)=
(\gamma x^Tz+r)^d
\]

### RBF

\[
K(x,z)=
e^{-\gamma\|x-z\|^2}
\]

---

# 42. Naive Bayes

Based on Bayes theorem:

\[
P(C|X)=
\frac{
P(X|C)P(C)
}{
P(X)
}
\]

Naive assumption:

```text
Features are conditionally independent given the class.
```

Types:

| Type | Data |
|---|---|
| Gaussian NB | Continuous |
| Multinomial NB | Word counts |
| Bernoulli NB | Binary features |

Very useful for:

```text
Spam detection
Document classification
Sentiment classification
```

---

# 43. K-Means

Unsupervised clustering algorithm.

Objective:

\[
J=
\sum_{k=1}^{K}
\sum_{x_i\in C_k}
\|x_i-\mu_k\|^2
\]

Steps:

```text
Choose K centroids
Assign points
Recalculate centroids
Repeat
```

```python
from sklearn.cluster import KMeans

model = KMeans(
    n_clusters=3,
    n_init=10,
    random_state=42
)
```

---

# 44. Elbow Method

Choose K by plotting:

```text
K vs Inertia
```

Inertia:

```text
Within-cluster sum of squared distances
```

Look for a point where improvement begins slowing sharply.

---

# 45. Silhouette Score

\[
s(i)=
\frac{b(i)-a(i)}
{\max(a(i),b(i))}
\]

Where:

- \(a(i)\) = within-cluster distance
- \(b(i)\) = nearest other-cluster distance

Interpretation:

```text
Near 1 → strong clustering
Near 0 → overlapping clusters
Negative → possibly wrong cluster
```

---

# 46. Hierarchical Clustering

Creates a dendrogram.

Types:

```text
Agglomerative
Divisive
```

Linkage methods:

```text
Single
Complete
Average
Ward
```

---

# 47. DBSCAN

Density-based clustering.

Important parameters:

```text
eps
min_samples
```

Advantages:

```text
No K required
Finds irregular clusters
Detects noise
```

Weakness:

```text
Sensitive to parameter selection
Hard with varying densities
```

---

# 48. PCA

Principal Component Analysis reduces dimensions.

Steps:

```text
Standardize
Compute covariance matrix
Find eigenvalues/eigenvectors
Sort components
Project data
```

Eigen equation:

\[
Av=\lambda v
\]

Explained variance ratio:

\[
EVR_j=
\frac{\lambda_j}
{\sum_k\lambda_k}
\]

```python
from sklearn.decomposition import PCA

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
```

---

# 49. PCA vs Feature Selection

| PCA | Feature Selection |
|---|---|
| Creates new components | Keeps original features |
| Lower interpretability | Better interpretability |
| Components are combinations | Real original columns |
| Dimensionality reduction | Remove unnecessary features |

---

# 50. Cross Validation

K-Fold:

```text
Split data into K folds
Train on K−1
Validate on remaining fold
Repeat K times
```

\[
MeanCV=
\frac1K\sum_{i=1}^{K}Score_i
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
```

---

# 51. Types of Cross Validation

| Method | Best Use |
|---|---|
| K-Fold | General regression |
| Stratified K-Fold | Classification |
| Leave-One-Out | Very small datasets |
| TimeSeriesSplit | Time series |
| GroupKFold | Group-dependent data |

---

# 52. Hyperparameters vs Parameters

### Parameters

Learned:

```text
Regression coefficients
Tree split thresholds
Neural-network weights
```

### Hyperparameters

Chosen:

```text
K in KNN
max_depth
learning_rate
C in SVM
n_estimators
```

---

# 53. Grid Search

Tests all specified combinations.

```python
from sklearn.model_selection import GridSearchCV

grid = GridSearchCV(
    model,
    param_grid={
        "max_depth": [3, 5, 10],
        "n_estimators": [100, 200]
    },
    cv=5
)
```

Advantage:

```text
Exhaustive
```

Disadvantage:

```text
Expensive
```

---

# 54. Randomized Search

Samples combinations.

```python
from sklearn.model_selection import RandomizedSearchCV
```

Advantage:

```text
Faster for large search spaces
```

---

# 55. Bayesian Optimization

Uses previous experiments to decide which hyperparameters to test next.

Popular tools:

```text
Optuna
Hyperopt
BayesianOptimization
```

---

# 56. Confusion Matrix

| | Predicted Positive | Predicted Negative |
|---|---:|---:|
| Actual Positive | TP | FN |
| Actual Negative | FP | TN |

---

# 57. Accuracy

\[
Accuracy=
\frac{TP+TN}
{TP+TN+FP+FN}
\]

Use when:

```text
Classes reasonably balanced
Error costs similar
```

---

# 58. Precision

\[
Precision=
\frac{TP}{TP+FP}
\]

Question:

```text
Of everything predicted positive, how much was correct?
```

Use when false positives are costly.

Example:

```text
Spam filtering
```

---

# 59. Recall

\[
Recall=
\frac{TP}{TP+FN}
\]

Question:

```text
Of all actual positives, how many did we detect?
```

Use when false negatives are costly.

Examples:

```text
Disease detection
Fraud detection
```

---

# 60. Specificity

\[
Specificity=
\frac{TN}{TN+FP}
\]

Measures true negative detection.

---

# 61. F1 Score

\[
F1=
2
\frac{Precision\times Recall}
{Precision+Recall}
\]

Good when:

```text
Classes are imbalanced
Precision and recall both matter
```

---

# 62. ROC-AUC

ROC plots:

\[
TPR
\]

against:

\[
FPR=
\frac{FP}{FP+TN}
\]

AUC measures ranking performance.

```text
1.0 → excellent
0.5 → random-like
```

---

# 63. Precision-Recall AUC

Often more informative than ROC-AUC when:

```text
Positive class is very rare
```

Example:

```text
Fraud detection
```

---

# 64. Regression Metrics

## MAE

\[
MAE=
\frac1n
\sum|y_i-\hat y_i|
\]

Easy to interpret.

## MSE

\[
MSE=
\frac1n
\sum(y_i-\hat y_i)^2
\]

Strongly penalizes large errors.

## RMSE

\[
RMSE=
\sqrt{MSE}
\]

Same unit as target.

## R²

\[
R^2=
1-
\frac{
\sum(y_i-\hat y_i)^2
}{
\sum(y_i-\bar y)^2
}
\]

---

# 65. MAE vs RMSE

| MAE | RMSE |
|---|---|
| Linear penalty | Squared penalty |
| Robust to large errors | Punishes large errors |
| Easy interpretation | Same target unit |
| Median-optimal | Mean-sensitive |

---

# 66. Adjusted R²

\[
AdjustedR^2=
1-
(1-R^2)
\frac{n-1}{n-p-1}
\]

Where:

- \(n\) = observations
- \(p\) = predictor count

Useful when comparing models with different numbers of features.

---

# 67. Imbalanced Data

Example:

```text
99.5% Genuine
0.5% Fraud
```

Accuracy can be misleading.

Solutions:

```text
Class weights
Random oversampling
Random undersampling
SMOTE
ADASYN
Threshold tuning
Better metrics
Anomaly detection
```

---

# 68. SMOTE

Creates synthetic minority samples.

Correct usage:

```text
Only on training folds/data
Never before train-test split
```

```python
from imblearn.over_sampling import SMOTE

smote = SMOTE(random_state=42)

X_resampled, y_resampled = (
    smote.fit_resample(
        X_train,
        y_train
    )
)
```

---

# 69. Threshold Tuning

Default threshold:

```text
0.5
```

Lower threshold:

```text
Recall ↑
False positives ↑
```

Higher threshold:

```text
Precision ↑
False negatives ↑
```

Example:

```python
probabilities = model.predict_proba(X_test)[:, 1]

predictions = (
    probabilities >= 0.30
).astype(int)
```

---

# 70. Multicollinearity

Occurs when predictors are strongly correlated.

Effects:

```text
Unstable coefficients
Hard coefficient interpretation
Large standard errors
```

VIF:

\[
VIF_j=
\frac1{1-R_j^2}
\]

High VIF may indicate multicollinearity.

---

# 71. Covariance

\[
Cov(X,Y)=
\frac{
\sum(x_i-\bar x)(y_i-\bar y)
}{
n-1
}
\]

Positive:

```text
Move together
```

Negative:

```text
Move oppositely
```

---

# 72. Pearson Correlation

\[
r=
\frac{Cov(X,Y)}
{\sigma_X\sigma_Y}
\]

Range:

```text
-1 to +1
```

Measures linear relationship.

---

# 73. Pearson vs Spearman

| Pearson | Spearman |
|---|---|
| Linear relationship | Monotonic relationship |
| Raw values | Ranks |
| Sensitive to outliers | More robust |
| Continuous variables | Ordinal/non-normal data |

---

# 74. Mean, Median and Mode

### Mean

\[
\bar x=
\frac{\sum x_i}{n}
\]

Sensitive to outliers.

### Median

Middle ordered value.

Robust to outliers.

### Mode

Most frequent value.

Useful for categorical variables.

---

# 75. Variance

\[
s^2=
\frac{
\sum(x_i-\bar x)^2
}{
n-1
}
\]

Measures spread.

---

# 76. Standard Deviation

\[
s=\sqrt{s^2}
\]

Same unit as data.

---

# 77. Z-Score

\[
z=
\frac{x-\mu}{\sigma}
\]

Interpretation:

```text
z = 2 → 2 SD above mean
z = -1 → 1 SD below mean
```

---

# 78. Normal Distribution

Properties:

```text
Bell shaped
Symmetric
Mean = Median = Mode
```

Empirical rule:

```text
68% within 1 SD
95% within 2 SD
99.7% within 3 SD
```

---

# 79. Central Limit Theorem

As sample size becomes sufficiently large, the distribution of sample means approaches normality under broad conditions.

Standard error:

\[
SE=
\frac{\sigma}{\sqrt n}
\]

Important for:

```text
Confidence intervals
Hypothesis tests
A/B testing
```

---

# 80. Hypothesis Testing

Null hypothesis:

```text
H0 = No effect/difference
```

Alternative:

```text
H1 = Effect/difference exists
```

Decision:

```text
p < α → Reject H0
p ≥ α → Fail to reject H0
```

Common:

\[
\alpha=0.05
\]

---

# 81. Type I and Type II Errors

### Type I

Reject true \(H_0\).

```text
False positive
```

Probability:

\[
\alpha
\]

### Type II

Fail to reject false \(H_0\).

```text
False negative
```

Probability:

\[
\beta
\]

Statistical power:

\[
1-\beta
\]

---

# 82. Common Statistical Tests

| Test | Use |
|---|---|
| One-sample t-test | Sample mean vs known value |
| Independent t-test | Two independent means |
| Paired t-test | Before vs after |
| ANOVA | 3+ group means |
| Chi-square | Categorical association |
| Mann-Whitney | Non-parametric two-group |
| Wilcoxon | Non-parametric paired |
| Kruskal-Wallis | Non-parametric 3+ group |

---

# 83. A/B Testing

Example:

```text
A = Old checkout
B = New checkout
```

Steps:

```text
Define hypothesis
Choose primary metric
Randomize users
Calculate sample size
Run experiment
Check data quality
Calculate effect
Test significance
Check confidence interval
Evaluate business importance
Decide
```

Do not use p-value alone.

Also evaluate:

```text
Effect size
Confidence interval
Business impact
Guardrail metrics
```

---

# 84. Time Series

Components:

```text
Trend
Seasonality
Cycles
Noise
```

Important rule:

```text
Never randomly shuffle time order blindly.
```

Train:

```text
Past
```

Test:

```text
Future
```

---

# 85. Lag Features

\[
Lag_1(t)=y_{t-1}
\]

```python
df["lag_1"] = df["sales"].shift(1)
df["lag_7"] = df["sales"].shift(7)
```

---

# 86. Moving Average

\[
MA_t=
\frac1k
\sum_{i=0}^{k-1}y_{t-i}
\]

```python
df["ma_7"] = (
    df["sales"]
    .shift(1)
    .rolling(7)
    .mean()
)
```

Use `shift(1)` to avoid target leakage when predicting the current/future value.

---

# 87. ARIMA

\[
ARIMA(p,d,q)
\]

Where:

- \(p\) = autoregressive lags
- \(d\) = differencing
- \(q\) = moving-average error terms

Use for suitable univariate time series.

---

# 88. Deep Learning

Deep learning uses multi-layer neural networks.

Neuron:

\[
z=
\sum_iw_ix_i+b
\]

Activation:

\[
a=f(z)
\]

---

# 89. Activation Functions

## ReLU

\[
ReLU(z)=\max(0,z)
\]

Common hidden-layer activation.

## Sigmoid

\[
\sigma(z)=
\frac1{1+e^{-z}}
\]

Binary output.

## Softmax

\[
P(y=j)=
\frac{e^{z_j}}
{\sum_ke^{z_k}}
\]

Multiclass output.

---

# 90. Forward Propagation

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

Data moves from input to output.

---

# 91. Backpropagation

Calculates gradients of loss using the chain rule.

Weight update:

\[
W_{new}
=
W_{old}
-
\eta
\frac{\partial L}{\partial W}
\]

Where:

- \(L\) = loss
- \(\eta\) = learning rate

---

# 92. Gradient Descent

\[
\theta_{t+1}
=
\theta_t
-
\eta\nabla J(\theta_t)
\]

Types:

```text
Batch GD
Stochastic GD
Mini-Batch GD
```

---

# 93. Learning Rate

Too high:

```text
Overshoot/diverge
```

Too low:

```text
Very slow convergence
```

Common optimizers:

```text
SGD
Momentum
RMSprop
Adam
AdamW
```

---

# 94. CNN

Convolutional Neural Networks are mainly used for images.

Main layers:

```text
Convolution
Activation
Pooling
Flatten/Global Pooling
Dense
```

Applications:

```text
Image classification
Object detection
Medical imaging
Face analysis
```

---

# 95. RNN

Used for sequential data.

\[
h_t=
\tanh(
W_xx_t+
W_hh_{t-1}+b
)
\]

Problem:

```text
Vanishing/exploding gradients
```

---

# 96. LSTM

LSTM adds gates:

```text
Forget gate
Input gate
Cell state
Output gate
```

Designed to preserve longer dependencies.

---

# 97. Transformers

Core idea:

```text
Self-Attention
```

Scaled dot-product attention:

\[
Attention(Q,K,V)
=
softmax
\left(
\frac{QK^T}{\sqrt{d_k}}
\right)V
\]

Where:

- Q = Query
- K = Key
- V = Value

Used in:

```text
BERT
GPT-style models
LLMs
Vision Transformers
```

---

# 98. NLP

Typical pipeline:

```text
Text cleaning
Tokenization
Vectorization
Model
Evaluation
```

Traditional representations:

```text
Bag of Words
TF-IDF
```

Modern:

```text
Embeddings
Transformers
LLMs
```

---

# 99. TF-IDF

\[
TFIDF(t,d)
=
TF(t,d)\times IDF(t)
\]

\[
IDF(t)
=
\log
\left(
\frac{N}{DF(t)}
\right)
\]

Important for:

```text
Spam classification
Document search
Text similarity
```

---

# 100. Embeddings

Embeddings convert objects into dense vectors.

Examples:

```text
Words
Sentences
Images
Products
Users
```

Similar objects have similar vectors.

Cosine similarity:

\[
Similarity=
\frac{
A\cdot B
}{
\|A\|\|B\|
}
\]

---

# 101. Recommendation Systems

Types:

```text
Popularity Based
Content Based
Collaborative Filtering
Hybrid
```

Metrics:

```text
Precision@K
Recall@K
MAP@K
NDCG
Hit Rate
```

---

# 102. RAG

Retrieval-Augmented Generation:

```text
Documents
↓
Chunks
↓
Embeddings
↓
Vector Database
↓
Retrieve relevant chunks
↓
LLM
↓
Grounded answer
```

Important concepts:

```text
Chunking
Embedding
Vector search
Top-K retrieval
Reranking
Context generation
Grounding
Evaluation
```

---

# 103. Explainable AI

Used to understand model behavior.

Methods:

```text
Coefficients
Feature Importance
Permutation Importance
PDP
SHAP
LIME
```

---

# 104. SHAP

SHAP estimates contribution of each feature.

Interpretation:

```text
Positive SHAP → pushes prediction upward
Negative SHAP → pushes downward
```

Useful for:

```text
Global explanation
Local explanation
Feature contribution
```

---

# 105. LIME

LIME explains one prediction using a simple local surrogate model.

Difference:

```text
SHAP → stronger theoretical foundation
LIME → local approximation
```

---

# 106. Feature Importance

Tree model:

```python
model.feature_importances_
```

But impurity-based importance may be biased toward high-cardinality features.

Permutation importance is often a stronger model-agnostic check.

---

# 107. Error Analysis

After metrics, inspect incorrect predictions.

Ask:

```text
Which segments fail?
Which classes fail?
Are labels wrong?
Are important features missing?
Is threshold wrong?
Is data distribution different?
```

Error types:

```text
False Positive
False Negative
Large regression residual
Low-confidence prediction
```

---

# 108. Model Selection

Do not select a model only because it has the highest score.

Consider:

```text
Validation performance
Business objective
Interpretability
Latency
Memory
Training time
Prediction cost
Fairness
Robustness
Deployment complexity
```

---

# 109. Baseline Model

Always create a baseline.

Classification examples:

```text
Majority class
Logistic Regression
```

Regression:

```text
Predict mean
Linear Regression
```

Your complex model should beat the baseline meaningfully.

---

# 110. ML Pipeline Code Template

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import (
    StandardScaler,
    OneHotEncoder
)
from sklearn.linear_model import LogisticRegression

numeric_features = [
    "age",
    "income"
]

categorical_features = [
    "city",
    "contract"
]

numeric_pipeline = Pipeline([
    (
        "imputer",
        SimpleImputer(
            strategy="median"
        )
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

model = Pipeline([
    (
        "preprocessor",
        preprocessor
    ),
    (
        "classifier",
        LogisticRegression(
            max_iter=1000
        )
    )
])

model.fit(
    X_train,
    y_train
)

predictions = model.predict(
    X_test
)
```

---

# 111. Complete Classification Evaluation

```python
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
    roc_auc_score,
    average_precision_score
)

predictions = model.predict(
    X_test
)

probabilities = model.predict_proba(
    X_test
)[:, 1]

print(
    "Accuracy:",
    accuracy_score(
        y_test,
        predictions
    )
)

print(
    "Precision:",
    precision_score(
        y_test,
        predictions,
        zero_division=0
    )
)

print(
    "Recall:",
    recall_score(
        y_test,
        predictions,
        zero_division=0
    )
)

print(
    "F1:",
    f1_score(
        y_test,
        predictions,
        zero_division=0
    )
)

print(
    "ROC-AUC:",
    roc_auc_score(
        y_test,
        probabilities
    )
)

print(
    "PR-AUC:",
    average_precision_score(
        y_test,
        probabilities
    )
)

print(
    confusion_matrix(
        y_test,
        predictions
    )
)

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)
```

---

# 112. Regression Evaluation Code

```python
import numpy as np

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

predictions = model.predict(
    X_test
)

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = np.sqrt(
    mean_squared_error(
        y_test,
        predictions
    )
)

r2 = r2_score(
    y_test,
    predictions
)

print("MAE:", mae)
print("RMSE:", rmse)
print("R2:", r2)
```

---

# 113. Save and Load Model

Save complete pipeline:

```python
import joblib

joblib.dump(
    model,
    "model.joblib"
)
```

Load:

```python
model = joblib.load(
    "model.joblib"
)
```

Saving the whole pipeline prevents preprocessing mismatch.

---

# 114. Deployment Workflow

```text
Train model
↓
Save model
↓
Create API
↓
Validate request
↓
Load pipeline
↓
Predict
↓
Return result
↓
Monitor
```

Common tools:

```text
FastAPI
Flask
Streamlit
Docker
AWS
Azure
GCP
```

---

# 115. FastAPI Example

```python
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib

app = FastAPI()

model = joblib.load(
    "model.joblib"
)


class InputData(BaseModel):
    age: float
    income: float
    city: str
    contract: str


@app.post("/predict")
def predict(data: InputData):
    input_df = pd.DataFrame([
        data.model_dump()
    ])

    prediction = int(
        model.predict(
            input_df
        )[0]
    )

    probability = float(
        model.predict_proba(
            input_df
        )[0][1]
    )

    return {
        "prediction": prediction,
        "probability": probability
    }
```

---

# 116. Model Monitoring

Monitor:

```text
Model accuracy
Precision/Recall
Business KPI
Prediction distribution
Input distribution
Missing values
API latency
Failure rate
Data drift
Concept drift
```

---

# 117. Data Drift vs Concept Drift

### Data Drift

Input distribution changes.

\[
P_{train}(X)
\neq
P_{production}(X)
\]

### Concept Drift

Relationship between features and target changes.

\[
P_{train}(Y|X)
\neq
P_{production}(Y|X)
\]

---

# 118. MLOps Basics

Important tools/concepts:

```text
Git
GitHub
Docker
MLflow
DVC
CI/CD
Cloud
Monitoring
Model Registry
Feature Store
Kubernetes
```

---

# 119. MLflow

Used for:

```text
Experiment tracking
Parameters
Metrics
Artifacts
Models
Model registry
```

---

# 120. Docker

Purpose:

```text
Package application + dependencies into reproducible container
```

Benefits:

```text
Same environment locally and production
Easy deployment
Dependency isolation
```

---

# 121. Fairness in ML

Check whether model performance differs unfairly across groups.

Monitor:

```text
Selection rate
False positive rate
False negative rate
Recall by group
Precision by group
Calibration
```

High-risk decisions need human oversight.

---

# 122. Privacy and Ethics

Important concepts:

```text
Data minimization
Consent
Secure storage
Access control
Bias testing
Transparency
Human review
Explainability
Monitoring
```

---

# 123. Algorithm Selection Cheat Sheet

| Problem | Good Starting Model |
|---|---|
| Continuous prediction | Linear Regression |
| Binary classification | Logistic Regression |
| Strong tabular baseline | Random Forest |
| High-performance tabular | Gradient Boosting / XGBoost |
| Small distance-based data | KNN |
| High-dimensional classification | SVM |
| Text classification | Logistic / Naive Bayes |
| Customer segmentation | K-Means |
| Irregular clusters | DBSCAN |
| Dimensionality reduction | PCA |
| Image classification | CNN / Transfer Learning |
| Sequence/time series | ARIMA / GBM / LSTM |
| Document QA | RAG |
| Recommendations | Collaborative/Hybrid |

---

# 124. Algorithm Scaling Cheat Sheet

| Algorithm | Scaling? |
|---|---|
| Linear Regression | Often useful |
| Logistic Regression | Yes |
| KNN | Yes |
| SVM | Yes |
| PCA | Yes |
| Neural Network | Yes |
| Naive Bayes | Depends |
| Decision Tree | No |
| Random Forest | No |
| Gradient Boosting | Usually no |
| XGBoost | Usually no |
| K-Means | Yes |
| DBSCAN | Usually yes |

---

# 125. Algorithm Interpretability

| Algorithm | Interpretability |
|---|---|
| Linear Regression | High |
| Logistic Regression | High |
| Decision Tree | High |
| KNN | Medium-low |
| Random Forest | Medium |
| Boosting | Medium-low |
| SVM | Low-medium |
| Neural Network | Low |
| K-Means | Medium |
| PCA | Low |

---

# 126. Metric Selection Cheat Sheet

| Problem | Preferred Metrics |
|---|---|
| Balanced classification | Accuracy, F1 |
| Imbalanced classification | Precision, Recall, F1, PR-AUC |
| Fraud detection | Recall, Precision, PR-AUC |
| Medical screening | Recall/Sensitivity |
| Spam filtering | Precision + Recall |
| Churn | Recall, F1, ROC-AUC |
| Regression | MAE, RMSE, R² |
| Forecasting | MAE, RMSE, MAPE |
| Clustering | Silhouette, inertia |
| Recommendations | Precision@K, Recall@K, NDCG |

---

# 127. Common Interview Traps

### Accuracy is always best?

No.

Imbalanced data can make accuracy misleading.

### Higher R² always means better model?

No.

Check:

```text
Test performance
Residuals
Overfitting
Adjusted R²
Business usefulness
```

### Correlation means causation?

No.

### Trees need scaling?

Generally no.

### PCA is feature selection?

No. PCA creates new components.

### SMOTE before split?

No. This causes leakage.

### Test set used for hyperparameter tuning?

No.

### Can you remove all outliers?

No.

### Random split for time series?

Usually no.

---

# 128. Top Interview Questions: One-Line Answers

**What is ML?**  
Learning patterns from data to make predictions on unseen data.

**What is supervised learning?**  
Learning from labeled input-target pairs.

**What is unsupervised learning?**  
Finding patterns without a target variable.

**Overfitting?**  
Model memorizes training data and generalizes poorly.

**Underfitting?**  
Model is too simple to learn the underlying pattern.

**Bias?**  
Error from overly simple assumptions.

**Variance?**  
Sensitivity to training-data changes.

**Regularization?**  
Penalty that controls model complexity.

**Cross-validation?**  
Repeated train-validation evaluation across multiple folds.

**Pipeline?**  
A chain of preprocessing and modeling steps executed consistently.

**Data leakage?**  
Training uses information unavailable at real inference time.

**Feature engineering?**  
Creating useful predictors from raw data.

**Feature selection?**  
Choosing the most useful original features.

**PCA?**  
Creating lower-dimensional components that retain maximum variance.

**Bagging?**  
Independent models trained on resampled data and combined.

**Boosting?**  
Sequential models that correct earlier errors.

**Random Forest?**  
Bagged decision trees with random feature selection.

**XGBoost?**  
Regularized gradient-boosted decision trees.

**Precision?**  
Correct positives among predicted positives.

**Recall?**  
Detected positives among actual positives.

**F1?**  
Harmonic mean of precision and recall.

**ROC-AUC?**  
Ability to rank positives above negatives across thresholds.

**Gradient descent?**  
Iterative parameter updates in the negative gradient direction.

**Learning rate?**  
Step size used during parameter updates.

---

# 129. How to Explain Any Algorithm

Use this six-part structure:

```text
1. Definition
2. Working process
3. Formula / main mathematics
4. Important parameters
5. Advantages and disadvantages
6. Best use case
```

Example for Random Forest:

> Random Forest is an ensemble algorithm made of many decision trees. Each tree is trained using a bootstrap sample and random subset of features. For classification, trees vote; for regression, predictions are averaged. Important parameters include number of trees, maximum depth, minimum leaf size, and number of features considered at each split. It reduces variance compared with a single tree but is less interpretable.

---

# 130. How to Explain Any ML Project

Use:

```text
Problem
↓
Business value
↓
Dataset
↓
Features + Target
↓
EDA
↓
Cleaning
↓
Feature Engineering
↓
Models Compared
↓
Metric Selection
↓
Cross Validation
↓
Tuning
↓
Final Result
↓
Error Analysis
↓
Deployment
↓
Limitations
↓
Future Improvement
```

---

# 131. Best Project Interview Answer Pattern

> The goal of my project was to solve **[business problem]**. I used **[dataset]**, where the target was **[target]** and important features included **[features]**. I handled missing values, duplicates, categorical encoding and feature engineering through a preprocessing pipeline. I compared **[models]** using **[cross-validation]**. Because the problem was **[balanced/imbalanced/regression]**, I evaluated the models using **[metrics]** instead of relying only on accuracy. The final model was **[model]** because it provided the best balance of validation performance, interpretability and business requirements. I saved the complete pipeline and deployed it using **FastAPI/Streamlit**.

---

# 132. Final 30-Minute Revision Order

Revise in this exact order:

1. Supervised vs unsupervised  
2. Regression vs classification  
3. Train/validation/test  
4. Data leakage  
5. Missing values + encoding + scaling  
6. Bias vs variance  
7. Overfitting vs underfitting  
8. Linear Regression  
9. Logistic Regression  
10. KNN  
11. Decision Tree  
12. Random Forest  
13. SVM  
14. Naive Bayes  
15. K-Means  
16. PCA  
17. Bagging vs boosting  
18. XGBoost  
19. Cross-validation  
20. Hyperparameter tuning  
21. Confusion matrix  
22. Precision vs recall  
23. F1 and ROC-AUC  
24. Regression metrics  
25. Imbalanced data  
26. Feature engineering  
27. Deep-learning basics  
28. Deployment  
29. Project explanation  
30. Error analysis and limitations  

---

# Final One-Minute ML Interview Answer

> I understand the complete machine-learning lifecycle from business problem definition, data collection, EDA and preprocessing to feature engineering, model training, evaluation, tuning, deployment and monitoring. I am comfortable with regression, classification, clustering and dimensionality-reduction algorithms including Linear Regression, Logistic Regression, KNN, Decision Tree, Random Forest, SVM, Naive Bayes, K-Means, PCA and boosting algorithms such as Gradient Boosting and XGBoost. I use pipelines and cross-validation to prevent leakage, select metrics according to business cost, handle class imbalance with techniques such as class weighting or threshold tuning, and perform error analysis before deployment. I also understand deep-learning basics, NLP, RAG, explainable AI, model monitoring and deployment using FastAPI, Streamlit and Docker.
