> **You asked:**
>
> Intermediate
> Customer Churn Prediction
> Loan Approval Prediction
> Heart Disease Prediction
> Employee Attrition Prediction
> Fake News Detection

I’ll continue the same project style, but for intermediate level: problem statement, use case, features, algorithm, preprocessing, complete runnable code, metrics, model saving, and interview explanation.

# Phase 17: Real-World Projects — Intermediate Level

## Projects Covered

| No. | Project | ML Type | Main Algorithm |
|---:|---|---|---|
| 1 | Customer Churn Prediction | Classification | Random Forest |
| 2 | Loan Approval Prediction | Classification | Logistic Regression |
| 3 | Heart Disease Prediction | Classification | Logistic Regression |
| 4 | Employee Attrition Prediction | Classification | Random Forest |
| 5 | Fake News Detection | NLP Classification | TF-IDF + Passive Aggressive Classifier |

Install required libraries:

```bash
pip install pandas numpy scikit-learn joblib
```

Folder structure:

```text
intermediate_ml_projects/
│
├── customer_churn_prediction.py
├── loan_approval_prediction.py
├── heart_disease_prediction.py
├── employee_attrition_prediction.py
├── fake_news_detection.py
│
└── models/
```

---

# Project 1: Customer Churn Prediction

## Use

Customer Churn Prediction is used to predict whether a customer will leave a company.

Example:

```text
Input: Tenure, monthly charges, contract type, support service
Output: Churn / Not Churn
```

Used in:

```text
Telecom companies
Banks
SaaS companies
OTT platforms
Insurance companies
```

## ML Type

```text
Binary Classification
```

Target:

```text
0 = Not Churn
1 = Churn
```

## Complete Code

```python
# customer_churn_prediction.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Sample Dataset
# -----------------------------
df = pd.DataFrame({
    "tenure": [1, 5, 12, 24, 36, 48, 60, 3, 8, 15, 20, 30, 40, 55, 6, 10, 18, 28, 45, 70],
    "monthly_charges": [80, 75, 60, 55, 50, 45, 40, 90, 85, 70, 65, 55, 48, 42, 88, 78, 68, 58, 46, 38],
    "total_charges": [80, 375, 720, 1320, 1800, 2160, 2400, 270, 680, 1050, 1300, 1650, 1920, 2310, 528, 780, 1224, 1624, 2070, 2660],
    "contract": ["Month-to-month", "Month-to-month", "One year", "One year", "Two year",
                 "Two year", "Two year", "Month-to-month", "Month-to-month", "One year",
                 "One year", "Two year", "Two year", "Two year", "Month-to-month",
                 "Month-to-month", "One year", "One year", "Two year", "Two year"],
    "internet_service": ["Fiber", "Fiber", "DSL", "DSL", "DSL", "No", "No", "Fiber", "Fiber", "DSL",
                         "DSL", "DSL", "No", "No", "Fiber", "Fiber", "DSL", "DSL", "No", "No"],
    "tech_support": ["No", "No", "Yes", "Yes", "Yes", "No internet", "No internet", "No", "No",
                     "Yes", "Yes", "Yes", "No internet", "No internet", "No", "No", "Yes",
                     "Yes", "No internet", "No internet"],
    "payment_method": ["Electronic check", "Electronic check", "Bank transfer", "Credit card",
                       "Credit card", "Bank transfer", "Credit card", "Electronic check",
                       "Electronic check", "Bank transfer", "Credit card", "Bank transfer",
                       "Credit card", "Credit card", "Electronic check", "Electronic check",
                       "Bank transfer", "Credit card", "Bank transfer", "Credit card"],
    "churn": [1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
})

print("Dataset:")
print(df.head())

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df.drop("churn", axis=1)
y = df["churn"]

numeric_features = ["tenure", "monthly_charges", "total_charges"]
categorical_features = ["contract", "internet_service", "tech_support", "payment_method"]

# -----------------------------
# 3. Preprocessing
# -----------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------
# 4. Model Pipeline
# -----------------------------
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ))
])

# -----------------------------
# 5. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# -----------------------------
# 6. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluate Model
# -----------------------------
y_pred = model.predict(X_test)

print("\nModel Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/customer_churn_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Customer
# -----------------------------
new_customer = pd.DataFrame([{
    "tenure": 4,
    "monthly_charges": 89,
    "total_charges": 356,
    "contract": "Month-to-month",
    "internet_service": "Fiber",
    "tech_support": "No",
    "payment_method": "Electronic check"
}])

prediction = model.predict(new_customer)[0]
probability = model.predict_proba(new_customer)[0][1]

print("\nNew Customer Prediction:")
print("Prediction:", "Churn" if prediction == 1 else "Not Churn")
print("Churn Probability:", round(probability, 3))
```

## Interview Explanation

```text
I built a Customer Churn Prediction project to predict whether a customer will leave the company.

I used features like tenure, monthly charges, contract type, internet service, tech support, and payment method.

I handled numerical and categorical features using ColumnTransformer. Numerical columns were scaled, and categorical columns were encoded using OneHotEncoder.

I trained a Random Forest Classifier and evaluated it using accuracy, precision, recall, F1 score, and confusion matrix.

This project is useful for companies because they can identify risky customers early and give offers or support to retain them.
```

---

# Project 2: Loan Approval Prediction

## Use

Loan Approval Prediction is used by banks to decide whether a loan application should be approved.

Input:

```text
Income, loan amount, credit history, education, property area
```

Output:

```text
Loan Approved / Not Approved
```

## ML Type

```text
Binary Classification
```

Target:

```text
0 = Not Approved
1 = Approved
```

## Complete Code

```python
# loan_approval_prediction.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
df = pd.DataFrame({
    "gender": ["Male", "Female", "Male", "Male", "Female", "Male", "Female", "Male", "Male", "Female",
               "Male", "Female", "Male", "Male", "Female", "Male", "Female", "Male", "Male", "Female"],
    "married": ["Yes", "No", "Yes", "Yes", "No", "Yes", "No", "Yes", "Yes", "No",
                "Yes", "No", "Yes", "Yes", "No", "Yes", "No", "Yes", "Yes", "No"],
    "education": ["Graduate", "Graduate", "Not Graduate", "Graduate", "Graduate", "Not Graduate",
                  "Graduate", "Graduate", "Not Graduate", "Graduate", "Graduate", "Graduate",
                  "Not Graduate", "Graduate", "Graduate", "Not Graduate", "Graduate", "Graduate",
                  "Graduate", "Not Graduate"],
    "self_employed": ["No", "No", "Yes", "No", "No", "Yes", "No", "No", "Yes", "No",
                      "No", "No", "Yes", "No", "No", "Yes", "No", "No", "No", "Yes"],
    "applicant_income": [5000, 3000, 2500, 6000, 4500, 2000, 7000, 8000, 1500, 3500,
                         9000, 4000, 1800, 6500, 4800, 2200, 7200, 8500, 5500, 1600],
    "coapplicant_income": [0, 1500, 1000, 0, 2000, 500, 0, 2500, 800, 1200,
                           0, 1800, 600, 0, 2200, 700, 0, 2600, 1000, 900],
    "loan_amount": [150, 120, 100, 200, 140, 80, 250, 300, 70, 110,
                    320, 130, 75, 210, 145, 85, 260, 310, 180, 72],
    "credit_history": [1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
                       1, 1, 0, 1, 1, 0, 1, 1, 1, 0],
    "property_area": ["Urban", "Semiurban", "Rural", "Urban", "Semiurban", "Rural",
                      "Urban", "Semiurban", "Rural", "Semiurban", "Urban", "Semiurban",
                      "Rural", "Urban", "Semiurban", "Rural", "Urban", "Semiurban",
                      "Urban", "Rural"],
    "loan_status": [1, 1, 0, 1, 1, 0, 1, 1, 0, 1,
                    1, 1, 0, 1, 1, 0, 1, 1, 1, 0]
})

print("Dataset:")
print(df.head())

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df.drop("loan_status", axis=1)
y = df["loan_status"]

numeric_features = ["applicant_income", "coapplicant_income", "loan_amount", "credit_history"]
categorical_features = ["gender", "married", "education", "self_employed", "property_area"]

# -----------------------------
# 3. Preprocessing
# -----------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------
# 4. Model
# -----------------------------
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(max_iter=1000))
])

# -----------------------------
# 5. Split Data
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# -----------------------------
# 6. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluation
# -----------------------------
y_pred = model.predict(X_test)

print("\nModel Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/loan_approval_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Application
# -----------------------------
new_application = pd.DataFrame([{
    "gender": "Male",
    "married": "Yes",
    "education": "Graduate",
    "self_employed": "No",
    "applicant_income": 6000,
    "coapplicant_income": 1000,
    "loan_amount": 180,
    "credit_history": 1,
    "property_area": "Urban"
}])

prediction = model.predict(new_application)[0]
probability = model.predict_proba(new_application)[0][1]

print("\nNew Loan Application Prediction:")
print("Prediction:", "Approved" if prediction == 1 else "Not Approved")
print("Approval Probability:", round(probability, 3))
```

## Interview Explanation

```text
I built a Loan Approval Prediction project using Logistic Regression.

The model predicts whether a loan should be approved based on applicant income, co-applicant income, loan amount, credit history, education, employment status, and property area.

I used SimpleImputer for missing values, StandardScaler for numerical columns, and OneHotEncoder for categorical columns.

This project is useful for banks because it helps automate loan approval decisions and reduce manual screening time.
```

---

# Project 3: Heart Disease Prediction

## Use

Heart Disease Prediction is used to predict whether a person has risk of heart disease.

Input:

```text
Age, cholesterol, blood pressure, heart rate, chest pain type
```

Output:

```text
Heart Disease / No Heart Disease
```

## ML Type

```text
Binary Classification
```

## Complete Code

```python
# heart_disease_prediction.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
df = pd.DataFrame({
    "age": [29, 35, 40, 45, 50, 55, 60, 65, 30, 38, 43, 48, 53, 58, 63, 68, 34, 41, 52, 61],
    "sex": ["Male", "Female", "Male", "Male", "Female", "Male", "Female", "Male",
            "Female", "Male", "Female", "Male", "Female", "Male", "Female", "Male",
            "Female", "Male", "Female", "Male"],
    "chest_pain": ["typical", "non-anginal", "asymptomatic", "asymptomatic", "non-anginal",
                   "asymptomatic", "typical", "asymptomatic", "non-anginal", "typical",
                   "non-anginal", "asymptomatic", "typical", "asymptomatic", "non-anginal",
                   "asymptomatic", "typical", "non-anginal", "asymptomatic", "asymptomatic"],
    "resting_bp": [120, 118, 130, 140, 125, 145, 135, 150, 115, 122, 126, 142, 128, 146, 132, 155, 119, 124, 138, 148],
    "cholesterol": [180, 190, 220, 250, 210, 270, 230, 290, 185, 200, 215, 255, 225, 275, 235, 300, 195, 205, 245, 285],
    "fasting_bs": [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1],
    "max_hr": [180, 175, 160, 145, 165, 140, 155, 130, 178, 170, 162, 142, 158, 138, 150, 125, 172, 166, 148, 132],
    "exercise_angina": ["No", "No", "Yes", "Yes", "No", "Yes", "No", "Yes",
                        "No", "No", "No", "Yes", "No", "Yes", "No", "Yes",
                        "No", "No", "Yes", "Yes"],
    "heart_disease": [0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]
})

print("Dataset:")
print(df.head())

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df.drop("heart_disease", axis=1)
y = df["heart_disease"]

numeric_features = ["age", "resting_bp", "cholesterol", "fasting_bs", "max_hr"]
categorical_features = ["sex", "chest_pain", "exercise_angina"]

# -----------------------------
# 3. Preprocessing
# -----------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------
# 4. Model Pipeline
# -----------------------------
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(max_iter=1000))
])

# -----------------------------
# 5. Split Data
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# -----------------------------
# 6. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluate
# -----------------------------
y_pred = model.predict(X_test)

print("\nModel Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/heart_disease_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Patient
# -----------------------------
new_patient = pd.DataFrame([{
    "age": 52,
    "sex": "Male",
    "chest_pain": "asymptomatic",
    "resting_bp": 140,
    "cholesterol": 260,
    "fasting_bs": 1,
    "max_hr": 135,
    "exercise_angina": "Yes"
}])

prediction = model.predict(new_patient)[0]
probability = model.predict_proba(new_patient)[0][1]

print("\nNew Patient Prediction:")
print("Prediction:", "Heart Disease Risk" if prediction == 1 else "No Heart Disease Risk")
print("Risk Probability:", round(probability, 3))
```

## Interview Explanation

```text
I built a Heart Disease Prediction project using Logistic Regression.

The model predicts heart disease risk based on age, sex, chest pain type, resting blood pressure, cholesterol, fasting blood sugar, maximum heart rate, and exercise-induced angina.

This is a healthcare classification problem where recall is very important because missing a high-risk patient can be dangerous.

I evaluated the model using accuracy, precision, recall, F1 score, confusion matrix, and classification report.
```

---

# Project 4: Employee Attrition Prediction

## Use

Employee Attrition Prediction is used to predict whether an employee may leave the company.

Used in:

```text
HR analytics
Employee retention
Workforce planning
```

Output:

```text
Attrition / No Attrition
```

## ML Type

```text
Binary Classification
```

## Complete Code

```python
# employee_attrition_prediction.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
df = pd.DataFrame({
    "age": [22, 25, 28, 32, 35, 40, 45, 50, 24, 29, 33, 38, 42, 47, 52, 27, 31, 36, 44, 49],
    "department": ["Sales", "HR", "IT", "IT", "Sales", "Finance", "IT", "Finance",
                   "Sales", "HR", "IT", "Sales", "Finance", "IT", "Finance",
                   "Sales", "HR", "IT", "Sales", "Finance"],
    "job_role": ["Executive", "Recruiter", "Developer", "Developer", "Manager",
                 "Analyst", "Manager", "Manager", "Executive", "Recruiter",
                 "Developer", "Manager", "Analyst", "Manager", "Manager",
                 "Executive", "Recruiter", "Developer", "Manager", "Analyst"],
    "monthly_income": [25000, 30000, 45000, 55000, 70000, 65000, 90000, 100000,
                       26000, 32000, 50000, 72000, 68000, 95000, 110000,
                       28000, 35000, 60000, 75000, 85000],
    "years_at_company": [1, 2, 3, 5, 8, 10, 15, 20, 1, 2, 4, 7, 11, 16, 22, 1, 3, 6, 9, 13],
    "job_satisfaction": [2, 3, 4, 4, 5, 4, 5, 5, 1, 2, 4, 5, 4, 5, 5, 1, 3, 4, 4, 5],
    "work_life_balance": [2, 3, 4, 4, 5, 4, 5, 5, 1, 2, 4, 5, 4, 5, 5, 1, 3, 4, 4, 5],
    "overtime": ["Yes", "Yes", "No", "No", "No", "No", "No", "No",
                 "Yes", "Yes", "No", "No", "No", "No", "No",
                 "Yes", "Yes", "No", "No", "No"],
    "attrition": [1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0]
})

print("Dataset:")
print(df.head())

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df.drop("attrition", axis=1)
y = df["attrition"]

numeric_features = [
    "age",
    "monthly_income",
    "years_at_company",
    "job_satisfaction",
    "work_life_balance"
]

categorical_features = [
    "department",
    "job_role",
    "overtime"
]

# -----------------------------
# 3. Preprocessing
# -----------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------
# 4. Model Pipeline
# -----------------------------
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ))
])

# -----------------------------
# 5. Split Data
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# -----------------------------
# 6. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 7. Evaluate
# -----------------------------
y_pred = model.predict(X_test)

print("\nModel Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/employee_attrition_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Employee
# -----------------------------
new_employee = pd.DataFrame([{
    "age": 26,
    "department": "Sales",
    "job_role": "Executive",
    "monthly_income": 28000,
    "years_at_company": 1,
    "job_satisfaction": 2,
    "work_life_balance": 1,
    "overtime": "Yes"
}])

prediction = model.predict(new_employee)[0]
probability = model.predict_proba(new_employee)[0][1]

print("\nNew Employee Prediction:")
print("Prediction:", "May Leave" if prediction == 1 else "May Stay")
print("Attrition Probability:", round(probability, 3))
```

## Interview Explanation

```text
I built an Employee Attrition Prediction project using Random Forest Classifier.

The model predicts whether an employee may leave the company based on age, department, job role, monthly income, years at company, job satisfaction, work-life balance, and overtime.

This project is useful for HR teams because they can identify employees at risk and take retention actions.

I used preprocessing pipelines for numeric and categorical features and evaluated the model using classification metrics.
```

---

# Project 5: Fake News Detection

## Use

Fake News Detection is an NLP project that predicts whether a news article is real or fake.

Input:

```text
News title or article text
```

Output:

```text
Fake News / Real News
```

Used in:

```text
Social media monitoring
News verification
Misinformation detection
Content moderation
```

## ML Type

```text
Text Classification
```

## Algorithm Used

```text
TF-IDF + Passive Aggressive Classifier
```

Why?

```text
TF-IDF converts text into numbers.
Passive Aggressive Classifier is fast and works well for text classification.
```

## Complete Code

```python
# fake_news_detection.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import PassiveAggressiveClassifier

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
df = pd.DataFrame({
    "text": [
        "Government announces new education policy for students",
        "Scientists discover new method to improve solar energy",
        "Prime minister launches new health insurance scheme",
        "NASA releases new images from space telescope",
        "Reserve bank updates digital payment guidelines",
        "University researchers publish study on climate change",
        "Election commission announces voting schedule",
        "Doctors recommend regular exercise for heart health",
        "New technology startup raises funding for AI product",
        "Court gives important judgement on public safety",

        "Breaking news celebrity found living on moon",
        "Aliens secretly control world government says viral post",
        "Drink this magic water and become rich overnight",
        "Fake cure claims to remove all diseases in one day",
        "Shocking secret formula makes students topper without study",
        "Government giving free luxury cars to every citizen",
        "This hidden fruit can make you immortal instantly",
        "Scientists confirm humans can fly without machines",
        "Bank doubles your money in one hour guaranteed",
        "Viral message claims sun will disappear tomorrow"
    ],
    "label": [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1
    ]
})

# label: 0 = Real, 1 = Fake

print("Dataset:")
print(df.head())

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df["text"]
y = df["label"]

# -----------------------------
# 3. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)

# -----------------------------
# 4. Build NLP Pipeline
# -----------------------------
model = Pipeline([
    ("tfidf", TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        ngram_range=(1, 2),
        max_features=5000
    )),
    ("classifier", PassiveAggressiveClassifier(
        max_iter=1000,
        random_state=42
    ))
])

# -----------------------------
# 5. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 6. Prediction
# -----------------------------
y_pred = model.predict(X_test)

# -----------------------------
# 7. Evaluation
# -----------------------------
print("\nModel Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Precision:", precision_score(y_test, y_pred, zero_division=0))
print("Recall:", recall_score(y_test, y_pred, zero_division=0))
print("F1 Score:", f1_score(y_test, y_pred, zero_division=0))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/fake_news_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New News
# -----------------------------
new_news = [
    "Government announces new job scheme for fresh graduates"
]

prediction = model.predict(new_news)[0]

print("\nNew News:")
print(new_news[0])

print("Prediction:", "Fake News" if prediction == 1 else "Real News")
```

## Interview Explanation

```text
I built a Fake News Detection project using NLP.

First, I collected news text and labels where 0 means real news and 1 means fake news.

I used TF-IDF Vectorizer to convert text into numerical features. Then I trained a Passive Aggressive Classifier to classify news as fake or real.

This project is useful for detecting misinformation and filtering fake content on social media or news platforms.

I evaluated the model using accuracy, precision, recall, F1 score, confusion matrix, and classification report.
```

---

# Final Comparison Table

| Project | Input | Output | Type | Algorithm |
|---|---|---|---|---|
| Customer Churn Prediction | Customer details | Churn / Not Churn | Classification | Random Forest |
| Loan Approval Prediction | Applicant details | Approved / Not Approved | Classification | Logistic Regression |
| Heart Disease Prediction | Patient health data | Risk / No Risk | Classification | Logistic Regression |
| Employee Attrition Prediction | Employee details | Leave / Stay | Classification | Random Forest |
| Fake News Detection | News text | Fake / Real | NLP Classification | TF-IDF + Passive Aggressive |

---

# Best Metrics for These Projects

| Project | Important Metrics | Reason |
|---|---|---|
| Customer Churn | Recall, F1 | Catch customers likely to leave |
| Loan Approval | Precision, Recall | Avoid risky approvals and missed good applicants |
| Heart Disease | Recall | Do not miss high-risk patients |
| Employee Attrition | Recall, F1 | Identify employees likely to leave |
| Fake News Detection | Precision, Recall, F1 | Balance fake detection and false alarms |

---

# Common Intermediate Project Workflow

```text
1. Understand problem statement
2. Identify ML type: classification or regression
3. Create/load dataset
4. Separate features and target
5. Identify numerical and categorical columns
6. Handle missing values
7. Encode categorical columns
8. Scale numerical columns
9. Train model
10. Evaluate model
11. Save model using Joblib
12. Predict new input
13. Explain project in interview
```

---

# Final Interview Summary

```text
I completed five intermediate machine learning projects.

In Customer Churn Prediction, I predicted whether a customer may leave the company using customer behavior and service details.

In Loan Approval Prediction, I predicted whether a bank should approve a loan based on income, loan amount, credit history, and applicant details.

In Heart Disease Prediction, I predicted heart disease risk using medical features like age, cholesterol, blood pressure, and chest pain type.

In Employee Attrition Prediction, I predicted whether an employee may leave the company using HR-related features.

In Fake News Detection, I used NLP with TF-IDF and Passive Aggressive Classifier to classify news as fake or real.

Across all projects, I followed a complete ML pipeline: preprocessing, train-test split, model training, evaluation, model saving, and prediction on new data.
```

# Best One-Minute Interview Answer

```text
I have worked on intermediate ML projects like Customer Churn Prediction, Loan Approval Prediction, Heart Disease Prediction, Employee Attrition Prediction, and Fake News Detection.

For structured data projects, I used preprocessing techniques like missing value handling, scaling, and one-hot encoding. I trained models like Logistic Regression and Random Forest.

For the NLP project, I converted text into numerical features using TF-IDF and trained a Passive Aggressive Classifier.

I evaluated classification models using accuracy, precision, recall, F1 score, confusion matrix, and classification report.

These projects helped me understand real-world classification problems, business use cases, data preprocessing, model evaluation, and model saving using Joblib.
```
