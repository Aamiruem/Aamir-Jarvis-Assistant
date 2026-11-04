> **You asked:**
>
> Phase 3: Data Preprocessing
> Module 9
> Import Dataset
> Data Cleaning
> Missing Values
> Duplicate Values
> Outliers
> Feature Scaling
> Standardization
> Normalization
> Encoding
> Label Encoding
> One-Hot Encoding
> Train-Test Split
> Cross Validation

I’ll explain Module 9 as a full preprocessing pipeline: first concept, then code, then interview answers, with special focus on avoiding data leakage.

# Phase 3: Data Preprocessing  
# Module 9: Data Preprocessing for ML Interview

Data preprocessing means **preparing raw data before giving it to a Machine Learning model**.

Raw data may contain:

```text
Missing values
Duplicate records
Wrong data types
Outliers
Text categories
Different feature scales
Unclean columns
```

Machine Learning models need clean and numerical data.

---

# 1. Import Dataset

## Easy Definition

Import dataset means loading data into Python.

Most common files:

```text
CSV
Excel
JSON
SQL table
```

## Code

```python
import pandas as pd

df = pd.read_csv("data.csv")
print(df.head())
```

## Read Excel

```python
df = pd.read_excel("data.xlsx")
print(df.head())
```

## Read JSON

```python
df = pd.read_json("data.json")
print(df.head())
```

## Check Dataset

```python
print(df.shape)
print(df.columns)
print(df.info())
print(df.describe())
```

| Command | Meaning |
|---|---|
| `head()` | First 5 rows |
| `shape` | Rows and columns |
| `columns` | Column names |
| `info()` | Data type and null values |
| `describe()` | Statistical summary |

## Interview Answer

Importing a dataset means loading data into Python using Pandas, usually with `read_csv()`, `read_excel()`, or `read_json()`.

---

# 2. Sample Dataset for Practice

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara", "Sara"],
    "Age": [23, 25, np.nan, 27, 22, 28, 28],
    "City": ["Delhi", "Mumbai", "Delhi", np.nan, "Patna", "Delhi", "Delhi"],
    "Gender": ["Male", "Male", "Female", "Female", "Male", "Female", "Female"],
    "Education": ["Graduate", "Post Graduate", "Graduate", "Graduate", "PhD", "Post Graduate", "Post Graduate"],
    "Salary": [50000, 60000, 55000, 80000, 300000, 70000, 70000],
    "Purchased": ["Yes", "No", "Yes", "No", "Yes", "No", "No"]
})

print(df)
```

---

# 3. Data Cleaning

## Easy Definition

Data cleaning means fixing wrong, missing, duplicate, or unnecessary data.

Data cleaning includes:

```text
Handle missing values
Remove duplicate rows
Correct data types
Remove unnecessary columns
Handle outliers
Fix inconsistent values
```

## Basic Cleaning Checks

```python
print(df.info())
print(df.isnull().sum())
print(df.duplicated().sum())
print(df.describe())
```

## Example: Rename Columns

```python
df.columns = df.columns.str.lower()
print(df.columns)
```

## Example: Remove Extra Spaces

```python
df["city"] = df["city"].str.strip()
```

## Interview Answer

Data cleaning is the process of fixing missing values, duplicates, wrong formats, outliers, and inconsistent data before model training.

---

# 4. Missing Values

## Easy Definition

Missing values are empty or unknown values in data.

They appear as:

```text
NaN
None
Null
Blank
```

## Check Missing Values

```python
print(df.isnull().sum())
```

Output idea:

```text
Name         0
Age          1
City         1
Gender       0
Education    0
Salary       0
Purchased    0
```

---

## Methods to Handle Missing Values

### Method 1: Drop Missing Rows

```python
df_drop = df.dropna()
```

Use when missing values are very few.

---

### Method 2: Fill Numerical Missing Value with Mean

```python
df["Age"] = df["Age"].fillna(df["Age"].mean())
```

Use mean when data has no major outliers.

---

### Method 3: Fill Numerical Missing Value with Median

```python
df["Age"] = df["Age"].fillna(df["Age"].median())
```

Use median when data has outliers.

---

### Method 4: Fill Categorical Missing Value with Mode

```python
df["City"] = df["City"].fillna(df["City"].mode()[0])
```

Use mode for categorical columns.

---

## Interview Answer

Missing values can be handled by removing rows using `dropna()` or filling values using mean, median, mode, or a custom value. For numerical columns, mean or median is used. For categorical columns, mode is used.

---

# 5. Duplicate Values

## Easy Definition

Duplicate values are repeated records in a dataset.

## Check Duplicates

```python
print(df.duplicated())
```

## Count Duplicates

```python
print(df.duplicated().sum())
```

## Remove Duplicates

```python
df = df.drop_duplicates()
```

## Remove Duplicates Based on Specific Columns

```python
df = df.drop_duplicates(subset=["Name", "Salary"])
```

## Interview Answer

Duplicate values are repeated records. We use `duplicated()` to check duplicates and `drop_duplicates()` to remove them.

---

# 6. Outliers

## Easy Definition

Outliers are extreme values that are very different from other values.

Example:

```text
Salary = [30000, 40000, 50000, 60000, 300000]
```

Here, `300000` is an outlier.

---

## Why Outliers Matter in ML?

Outliers can affect:

```text
Mean
Standard deviation
Linear Regression
KNN
K-Means
Model accuracy
Feature scaling
```

---

## Detect Outliers Using IQR

IQR means Interquartile Range.

```text
IQR = Q3 - Q1
```

Outlier limits:

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

## Code

```python
Q1 = df["Salary"].quantile(0.25)
Q3 = df["Salary"].quantile(0.75)

IQR = Q3 - Q1

lower_limit = Q1 - 1.5 * IQR
upper_limit = Q3 + 1.5 * IQR

outliers = df[(df["Salary"] < lower_limit) | (df["Salary"] > upper_limit)]

print("Q1:", Q1)
print("Q3:", Q3)
print("IQR:", IQR)
print("Lower Limit:", lower_limit)
print("Upper Limit:", upper_limit)
print(outliers)
```

---

## Remove Outliers

```python
df = df[(df["Salary"] >= lower_limit) & (df["Salary"] <= upper_limit)]
```

## Cap Outliers

Instead of deleting, we can cap them.

```python
df["Salary"] = np.where(df["Salary"] > upper_limit, upper_limit, df["Salary"])
df["Salary"] = np.where(df["Salary"] < lower_limit, lower_limit, df["Salary"])
```

## Interview Answer

Outliers are extreme values that are very different from normal data. We can detect outliers using boxplot, z-score, or IQR method. Outliers can be removed, capped, or transformed depending on the business problem.

---

# 7. Feature Scaling

## Easy Definition

Feature scaling means bringing numerical columns to a similar scale.

Example:

```text
Age: 20 to 60
Salary: 30000 to 300000
```

Salary has a much bigger scale than age. Some ML models may give more importance to salary because of large numbers.

---

## Why Feature Scaling is Important?

Feature scaling is important for:

```text
KNN
K-Means
SVM
Logistic Regression
Linear Regression with Gradient Descent
Neural Networks
PCA
```

Tree-based models usually do not need scaling:

```text
Decision Tree
Random Forest
XGBoost
LightGBM
CatBoost
```

## Interview Answer

Feature scaling brings numerical features into a similar range so that no feature dominates only because of large values.

---

# 8. Standardization

## Easy Definition

Standardization changes data so that:

```text
Mean = 0
Standard Deviation = 1
```

Formula:

```text
z = (x - mean) / standard deviation
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"STANDARD_SCORE_Z","locale_override":"en-US"}}

## Example

```text
Age = [20, 30, 40]

Mean = 30
Standard Deviation = 10

For x = 40:

z = (40 - 30) / 10
z = 1
```

Meaning:

```text
40 is 1 standard deviation above the mean.
```

## Code

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()

df[["Age", "Salary"]] = scaler.fit_transform(df[["Age", "Salary"]])

print(df)
```

## When to Use Standardization?

Use standardization when:

```text
Data follows normal distribution
Algorithm uses distance or gradient descent
Outliers may exist
```

## Interview Answer

Standardization transforms data to have mean 0 and standard deviation 1. It is useful for algorithms like Logistic Regression, SVM, KNN, K-Means, PCA, and Neural Networks.

---

# 9. Normalization

## Easy Definition

Normalization changes data into a fixed range, mostly between `0` and `1`.

Formula:

```text
x_scaled = (x - min) / (max - min)
```

## Example

```text
Age = [20, 30, 40]

min = 20
max = 40

For x = 30:

x_scaled = (30 - 20) / (40 - 20)
x_scaled = 10 / 20
x_scaled = 0.5
```

## Code

```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()

df[["Age", "Salary"]] = scaler.fit_transform(df[["Age", "Salary"]])

print(df)
```

## When to Use Normalization?

Use normalization when:

```text
You want values between 0 and 1
Data does not follow normal distribution
Using distance-based algorithms
Using neural networks
```

## Standardization vs Normalization

| Standardization | Normalization |
|---|---|
| Mean 0, standard deviation 1 | Range 0 to 1 |
| Formula: `(x - mean) / std` | Formula: `(x - min) / (max - min)` |
| Good for normal-like data | Good for bounded range |
| Less affected by min/max | More affected by outliers |

## Interview Answer

Normalization scales values between 0 and 1 using min and max values. It is useful when features have different ranges.

---

# 10. Encoding

## Easy Definition

Encoding means converting categorical text data into numbers.

ML models do not understand text directly.

Example:

```text
Gender = Male/Female
City = Delhi/Mumbai/Patna
Purchased = Yes/No
```

We must convert them into numbers.

---

# 11. Label Encoding

## Easy Definition

Label Encoding converts categories into numbers.

Example:

```text
Male   → 1
Female → 0
```

## Code

```python
from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()

df["Gender"] = le.fit_transform(df["Gender"])

print(df["Gender"])
```

Example output:

```text
Female → 0
Male   → 1
```

---

## Label Encoding for Target Column

```python
df["Purchased"] = le.fit_transform(df["Purchased"])
```

Example:

```text
No  → 0
Yes → 1
```

## When to Use Label Encoding?

Use label encoding for:

```text
Target column
Ordinal categories
Binary categories
```

Ordinal means order exists.

Example:

```text
Low < Medium < High
Beginner < Intermediate < Advanced
```

## Problem with Label Encoding

For unordered categories:

```text
Delhi  → 0
Mumbai → 1
Patna  → 2
```

Model may think:

```text
Patna > Mumbai > Delhi
```

But this order is not meaningful.

So for nominal categories, use One-Hot Encoding.

## Interview Answer

Label Encoding converts categories into numeric labels. It is useful for target columns, binary categories, and ordinal categories. For unordered categories, One-Hot Encoding is better.

---

# 12. One-Hot Encoding

## Easy Definition

One-Hot Encoding creates separate columns for each category.

Example:

```text
City = Delhi, Mumbai, Patna
```

After One-Hot Encoding:

| City | City_Delhi | City_Mumbai | City_Patna |
|---|---:|---:|---:|
| Delhi | 1 | 0 | 0 |
| Mumbai | 0 | 1 | 0 |
| Patna | 0 | 0 | 1 |

## Code Using Pandas

```python
df = pd.get_dummies(df, columns=["City"], drop_first=True)

print(df)
```

`drop_first=True` avoids dummy variable trap.

---

## Code Using Scikit-Learn

```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(drop="first", sparse_output=False)

encoded = encoder.fit_transform(df[["City"]])

encoded_df = pd.DataFrame(
    encoded,
    columns=encoder.get_feature_names_out(["City"])
)

df = pd.concat([df.drop("City", axis=1), encoded_df], axis=1)

print(df)
```

## When to Use One-Hot Encoding?

Use one-hot encoding for nominal categories.

Nominal means no order exists.

Example:

```text
City
Country
Department
Color
Product category
```

## Label Encoding vs One-Hot Encoding

| Label Encoding | One-Hot Encoding |
|---|---|
| Converts category to number | Creates separate binary columns |
| Good for target/ordinal data | Good for nominal data |
| May create false order | Does not create false order |
| Example: Male=1, Female=0 | City_Delhi, City_Mumbai |

## Interview Answer

One-Hot Encoding converts categorical values into separate binary columns. It is useful for nominal categories where no natural order exists.

---

# 13. Train-Test Split

## Easy Definition

Train-test split means dividing data into two parts:

```text
Training data → used to train model
Testing data  → used to check model performance
```

Common split:

```text
80% training, 20% testing
70% training, 30% testing
```

## Code

```python
from sklearn.model_selection import train_test_split

X = df.drop("Purchased", axis=1)
y = df["Purchased"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

print(X_train.shape)
print(X_test.shape)
```

## Meaning of Parameters

| Parameter | Meaning |
|---|---|
| `X` | Features |
| `y` | Target |
| `test_size=0.2` | 20% test data |
| `random_state=42` | Same split every time |
| `stratify=y` | Maintains class ratio |

## For Classification

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)
```

Use `stratify=y` when classification target is imbalanced.

## Interview Answer

Train-test split divides data into training and testing sets. Training data is used to train the model, and testing data is used to evaluate model performance on unseen data.

---

# 14. Cross Validation

## Easy Definition

Cross validation means training and testing the model multiple times on different parts of the data.

Simple meaning:

```text
Instead of one train-test split, we test model multiple times.
```

---

## K-Fold Cross Validation

Suppose `k = 5`.

Data is divided into 5 parts:

```text
Fold 1
Fold 2
Fold 3
Fold 4
Fold 5
```

Model training/testing:

```text
Round 1: Fold 1 test, remaining folds train
Round 2: Fold 2 test, remaining folds train
Round 3: Fold 3 test, remaining folds train
Round 4: Fold 4 test, remaining folds train
Round 5: Fold 5 test, remaining folds train
```

Final score:

```text
Average of all 5 scores
```

## Code

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression

X = df.drop("Purchased", axis=1)
y = df["Purchased"]

model = LogisticRegression()

scores = cross_val_score(model, X, y, cv=5)

print("Scores:", scores)
print("Average Score:", scores.mean())
```

## Why Cross Validation?

Cross validation helps to:

```text
Reduce dependency on one split
Check model stability
Detect overfitting
Get better performance estimate
```

## Interview Answer

Cross validation is a technique where the dataset is divided into multiple folds. The model is trained and tested multiple times, and the average score gives a more reliable performance estimate.

---

# 15. Very Important: Avoid Data Leakage

## Easy Definition

Data leakage happens when test data information is used during training.

This gives fake high accuracy.

Wrong way:

```python
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)
```

Why wrong?

```text
Scaler learned mean and standard deviation from the full dataset,
including test data.
```

Correct way:

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

Important:

```text
fit_transform on training data
transform on testing data
```

## Interview Answer

Data leakage happens when information from test data is used during training. To avoid it, preprocessing like scaling and encoding should be fitted only on training data, then applied to test data.

---

# 16. Complete Preprocessing Pipeline Code

```python
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression

# Sample data
df = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara", "Sara"],
    "Age": [23, 25, np.nan, 27, 22, 28, 28],
    "City": ["Delhi", "Mumbai", "Delhi", np.nan, "Patna", "Delhi", "Delhi"],
    "Gender": ["Male", "Male", "Female", "Female", "Male", "Female", "Female"],
    "Education": ["Graduate", "Post Graduate", "Graduate", "Graduate", "PhD", "Post Graduate", "Post Graduate"],
    "Salary": [50000, 60000, 55000, 80000, 300000, 70000, 70000],
    "Purchased": ["Yes", "No", "Yes", "No", "Yes", "No", "No"]
})

# 1. Drop duplicate rows
df = df.drop_duplicates()

# 2. Handle missing values
df["Age"] = df["Age"].fillna(df["Age"].median())
df["City"] = df["City"].fillna(df["City"].mode()[0])

# 3. Handle outliers using IQR
Q1 = df["Salary"].quantile(0.25)
Q3 = df["Salary"].quantile(0.75)
IQR = Q3 - Q1

lower_limit = Q1 - 1.5 * IQR
upper_limit = Q3 + 1.5 * IQR

df["Salary"] = np.where(df["Salary"] > upper_limit, upper_limit, df["Salary"])
df["Salary"] = np.where(df["Salary"] < lower_limit, lower_limit, df["Salary"])

# 4. Separate features and target
X = df.drop(["Purchased", "Name"], axis=1)
y = df["Purchased"]

# 5. Encode target
label_encoder = LabelEncoder()
y = label_encoder.fit_transform(y)

# 6. Train-test split before scaling
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# 7. Select columns
numeric_features = ["Age", "Salary"]
categorical_features = ["City", "Gender", "Education"]

# 8. Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        ("num", StandardScaler(), numeric_features),
        ("cat", OneHotEncoder(drop="first", handle_unknown="ignore"), categorical_features)
    ]
)

# 9. Model pipeline
model = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression())
])

# 10. Train model
model.fit(X_train, y_train)

# 11. Test score
print("Test Score:", model.score(X_test, y_test))
```

---

# 17. Cross Validation with Pipeline

Best practice:

```python
scores = cross_val_score(model, X, y, cv=5)

print("Cross Validation Scores:", scores)
print("Average Score:", scores.mean())
```

Why pipeline is best?

```text
It prevents data leakage.
It keeps preprocessing and model together.
It is clean and interview-friendly.
```

---

# 18. Full Preprocessing Flow

```text
1. Import dataset
2. Understand dataset
3. Check missing values
4. Handle missing values
5. Check duplicate values
6. Remove duplicates
7. Detect outliers
8. Handle outliers
9. Separate features and target
10. Encode categorical columns
11. Split train and test data
12. Apply scaling on training data
13. Transform test data
14. Train model
15. Evaluate model
16. Use cross validation
```

---

# 19. Quick Revision Table

| Topic | Meaning | Common Method |
|---|---|---|
| Import Dataset | Load data | `pd.read_csv()` |
| Data Cleaning | Fix data issues | Pandas |
| Missing Values | Empty values | Mean, median, mode |
| Duplicate Values | Repeated rows | `drop_duplicates()` |
| Outliers | Extreme values | IQR, Z-score |
| Feature Scaling | Bring same scale | StandardScaler, MinMaxScaler |
| Standardization | Mean 0, std 1 | `StandardScaler()` |
| Normalization | Range 0 to 1 | `MinMaxScaler()` |
| Encoding | Text to number | Label, One-Hot |
| Label Encoding | Category to number | `LabelEncoder()` |
| One-Hot Encoding | Binary columns | `OneHotEncoder()` |
| Train-Test Split | Train and test division | `train_test_split()` |
| Cross Validation | Multiple train-test rounds | `cross_val_score()` |

---

# 20. Most Asked Interview Questions

## Q1. What is data preprocessing?

Data preprocessing is the process of cleaning and transforming raw data before giving it to a Machine Learning model.

---

## Q2. Why is data preprocessing important?

Because raw data may contain missing values, duplicates, outliers, text categories, and different scales. ML models perform better on clean and properly formatted data.

---

## Q3. How do you handle missing values?

```text
Numerical columns → mean or median
Categorical columns → mode
Many missing rows → drop rows
```

---

## Q4. Mean vs Median for missing values?

```text
Mean → use when no outliers
Median → use when outliers are present
```

---

## Q5. How do you remove duplicates?

```python
df.drop_duplicates()
```

---

## Q6. How do you detect outliers?

Using:

```text
Boxplot
IQR method
Z-score method
```

---

## Q7. Standardization vs Normalization?

| Standardization | Normalization |
|---|---|
| Mean 0, std 1 | Range 0 to 1 |
| Uses mean and std | Uses min and max |
| Good for normal-like data | Good for bounded data |
| `StandardScaler` | `MinMaxScaler` |

---

## Q8. Label Encoding vs One-Hot Encoding?

| Label Encoding | One-Hot Encoding |
|---|---|
| Converts category into number | Creates binary columns |
| Good for target/ordinal data | Good for nominal data |
| May create false order | Avoids false order |

---

## Q9. What is train-test split?

Train-test split divides data into training data and testing data. Training data trains the model, and testing data checks performance on unseen data.

---

## Q10. What is cross validation?

Cross validation divides data into multiple folds and trains/tests the model multiple times. The average score gives a more reliable performance estimate.

---

## Q11. What is data leakage?

Data leakage happens when test data information is used during training, causing fake high accuracy.

Correct rule:

```text
Fit preprocessing only on training data.
Transform test data using the same fitted object.
```

---

# Final Interview Summary

```text
Data preprocessing is one of the most important steps in Machine Learning.

I import the dataset, understand the data, clean missing values, remove duplicates, handle outliers, encode categorical variables, scale numerical features, split data into train and test sets, and use cross validation for reliable model evaluation.

I also make sure to avoid data leakage by fitting preprocessing steps only on training data.
```
