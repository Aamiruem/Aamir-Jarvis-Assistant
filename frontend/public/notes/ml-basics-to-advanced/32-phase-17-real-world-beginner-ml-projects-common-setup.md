> **You asked:**
>
> Phase 17: Real-World Projects
> Beginner
> Student Marks Prediction
> House Price Prediction
> Salary Prediction
> Titanic Survival Prediction
> Iris Flower Classification complete designed project with complete code one by one   make every projects explain all concept and uses

# Phase 17: Real-World Beginner ML Projects  
## Complete Designed Projects with Code — One by One

These are the best beginner ML projects for interviews:

| No. | Project | ML Type | Algorithm |
|---:|---|---|---|
| 1 | Student Marks Prediction | Regression | Linear Regression |
| 2 | House Price Prediction | Regression | Random Forest Regressor |
| 3 | Salary Prediction | Regression | Linear Regression |
| 4 | Titanic Survival Prediction | Classification | Logistic Regression |
| 5 | Iris Flower Classification | Classification | Random Forest Classifier |

---

# Common Setup

Install required libraries:

```bash
pip install pandas numpy scikit-learn matplotlib seaborn joblib
```

Common project folder structure:

```text
ml_beginner_projects/
│
├── student_marks_prediction.py
├── house_price_prediction.py
├── salary_prediction.py
├── titanic_survival_prediction.py
├── iris_flower_classification.py
│
├── models/
│   ├── student_marks_model.joblib
│   ├── house_price_model.joblib
│   ├── salary_model.joblib
│   ├── titanic_model.joblib
│   └── iris_model.joblib
```

---

# Project 1: Student Marks Prediction

## 1. Project Use

This project predicts student marks based on:

```text
Study Hours
Attendance
Previous Score
```

Example:

```text
Input:
Study Hours = 6
Attendance = 85
Previous Score = 70

Output:
Predicted Marks = 78
```

---

## 2. ML Type

```text
Regression
```

Because output is a number.

---

## 3. Algorithm Used

```text
Linear Regression
```

Linear Regression is used because marks usually increase when study hours, attendance, and previous score increase.

---

## 4. Complete Code

```python
# student_marks_prediction.py

import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Create models folder
os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
data = {
    "study_hours": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "attendance": [50, 55, 60, 65, 70, 75, 80, 85, 90, 95],
    "previous_score": [35, 40, 45, 50, 55, 60, 65, 70, 80, 85],
    "marks": [38, 42, 48, 55, 60, 66, 72, 78, 88, 92]
}

df = pd.DataFrame(data)

print("Dataset:")
print(df)

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df[["study_hours", "attendance", "previous_score"]]
y = df["marks"]

# -----------------------------
# 3. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# 4. Build Pipeline
# -----------------------------
model = Pipeline([
    ("scaler", StandardScaler()),
    ("regressor", LinearRegression())
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
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("\nModel Evaluation:")
print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/student_marks_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Student Marks
# -----------------------------
new_student = pd.DataFrame({
    "study_hours": [6],
    "attendance": [85],
    "previous_score": [70]
})

predicted_marks = model.predict(new_student)

print("\nNew Student Data:")
print(new_student)

print("Predicted Marks:", round(predicted_marks[0], 2))

# -----------------------------
# 10. Visualization
# -----------------------------
plt.scatter(df["study_hours"], df["marks"])
plt.xlabel("Study Hours")
plt.ylabel("Marks")
plt.title("Study Hours vs Marks")
plt.show()
```

---

## 5. Interview Explanation

```text
I created a Student Marks Prediction project using Linear Regression.

The input features are study hours, attendance, and previous score. The target variable is marks.

I split the data into training and testing sets, trained a Linear Regression model, and evaluated it using MAE, RMSE, and R2 Score.

This project shows how regression can be used to predict continuous values.
```

---

# Project 2: House Price Prediction

## 1. Project Use

This project predicts house price based on:

```text
MedInc
HouseAge
AveRooms
AveBedrms
Population
AveOccup
Latitude
Longitude
```

---

## 2. ML Type

```text
Regression
```

Because house price is a number.

---

## 3. Algorithm Used

```text
Random Forest Regressor
```

Random Forest is good because house price depends on many non-linear factors.

---

## 4. Complete Code

```python
# house_price_prediction.py

import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Load Dataset
# -----------------------------
housing = fetch_california_housing()

df = pd.DataFrame(housing.data, columns=housing.feature_names)
df["price"] = housing.target

print("Dataset Head:")
print(df.head())

print("\nDataset Shape:", df.shape)

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df.drop("price", axis=1)
y = df["price"]

# -----------------------------
# 3. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# 4. Build Model Pipeline
# -----------------------------
model = Pipeline([
    ("scaler", StandardScaler()),
    ("regressor", RandomForestRegressor(
        n_estimators=100,
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
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("\nModel Evaluation:")
print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/house_price_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New House Price
# -----------------------------
new_house = pd.DataFrame([{
    "MedInc": 8.3252,
    "HouseAge": 41.0,
    "AveRooms": 6.984,
    "AveBedrms": 1.024,
    "Population": 322.0,
    "AveOccup": 2.555,
    "Latitude": 37.88,
    "Longitude": -122.23
}])

predicted_price = model.predict(new_house)

print("\nNew House Data:")
print(new_house)

print("Predicted House Price:", round(predicted_price[0], 2))

# -----------------------------
# 10. Visualization
# -----------------------------
plt.scatter(y_test, y_pred)
plt.xlabel("Actual Price")
plt.ylabel("Predicted Price")
plt.title("Actual vs Predicted House Price")
plt.show()
```

---

## 5. Interview Explanation

```text
I built a House Price Prediction project using Random Forest Regressor.

The dataset contains features like income, house age, average rooms, population, latitude, and longitude. The target variable is house price.

I used train-test split, trained the model, and evaluated it using MAE, RMSE, and R2 Score.

Random Forest was useful because house price relationships are not always linear.
```

---

# Project 3: Salary Prediction

## 1. Project Use

This project predicts salary based on:

```text
Experience
Skill Score
Interview Score
```

Example:

```text
Input:
Experience = 3 years
Skill Score = 8
Interview Score = 75

Output:
Predicted Salary = 52000
```

---

## 2. ML Type

```text
Regression
```

Because salary is a number.

---

## 3. Algorithm Used

```text
Linear Regression
```

---

## 4. Complete Code

```python
# salary_prediction.py

import os
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Create Dataset
# -----------------------------
df = pd.DataFrame({
    "experience": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "skill_score": [3, 4, 5, 6, 6, 7, 8, 8, 9, 9, 10],
    "interview_score": [40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90],
    "salary": [25000, 30000, 35000, 42000, 48000, 55000, 62000, 70000, 78000, 85000, 95000]
})

print("Dataset:")
print(df)

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df[["experience", "skill_score", "interview_score"]]
y = df["salary"]

# -----------------------------
# 3. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# -----------------------------
# 4. Build Pipeline
# -----------------------------
model = Pipeline([
    ("scaler", StandardScaler()),
    ("regressor", LinearRegression())
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
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)

print("\nModel Evaluation:")
print("MAE:", mae)
print("MSE:", mse)
print("RMSE:", rmse)
print("R2 Score:", r2)

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/salary_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Salary
# -----------------------------
new_candidate = pd.DataFrame({
    "experience": [3],
    "skill_score": [8],
    "interview_score": [75]
})

predicted_salary = model.predict(new_candidate)

print("\nNew Candidate Data:")
print(new_candidate)

print("Predicted Salary:", round(predicted_salary[0], 2))

# -----------------------------
# 10. Visualization
# -----------------------------
plt.scatter(df["experience"], df["salary"])
plt.xlabel("Experience")
plt.ylabel("Salary")
plt.title("Experience vs Salary")
plt.show()
```

---

## 5. Interview Explanation

```text
I created a Salary Prediction project using Linear Regression.

The input features are experience, skill score, and interview score. The target variable is salary.

I trained the model using train-test split and evaluated it with MAE, RMSE, and R2 Score.

This project is useful for understanding regression and how multiple input features affect salary prediction.
```

---

# Project 4: Titanic Survival Prediction

## 1. Project Use

This project predicts whether a passenger survived or not.

Target:

```text
0 = Did not survive
1 = Survived
```

Features:

```text
Pclass
Sex
Age
SibSp
Parch
Fare
Embarked
```

---

## 2. ML Type

```text
Classification
```

Because output is a class:

```text
Survived / Not Survived
```

---

## 3. Algorithm Used

```text
Logistic Regression
```

Logistic Regression is good for binary classification.

---

## 4. Dataset

Download Titanic dataset from Kaggle or use a CSV file named:

```text
titanic.csv
```

Expected columns:

```text
Survived, Pclass, Sex, Age, SibSp, Parch, Fare, Embarked
```

---

## 5. Complete Code

```python
# titanic_survival_prediction.py

import os
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Load Dataset
# -----------------------------
df = pd.read_csv("titanic.csv")

print("Dataset Head:")
print(df.head())

print("\nMissing Values:")
print(df.isnull().sum())

# -----------------------------
# 2. Select Features and Target
# -----------------------------
features = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]
target = "Survived"

X = df[features]
y = df[target]

# -----------------------------
# 3. Separate Numeric and Categorical Columns
# -----------------------------
numeric_features = ["Age", "SibSp", "Parch", "Fare"]
categorical_features = ["Pclass", "Sex", "Embarked"]

# -----------------------------
# 4. Numeric Preprocessing
# -----------------------------
numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

# -----------------------------
# 5. Categorical Preprocessing
# -----------------------------
categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

# -----------------------------
# 6. Combine Preprocessing
# -----------------------------
preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# -----------------------------
# 7. Build Final Pipeline
# -----------------------------
model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(max_iter=1000))
])

# -----------------------------
# 8. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# 9. Train Model
# -----------------------------
model.fit(X_train, y_train)

# -----------------------------
# 10. Prediction
# -----------------------------
y_pred = model.predict(X_test)

# -----------------------------
# 11. Evaluation
# -----------------------------
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print("\nModel Evaluation:")
print("Accuracy:", accuracy)
print("Precision:", precision)
print("Recall:", recall)
print("F1 Score:", f1)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# -----------------------------
# 12. Save Model
# -----------------------------
joblib.dump(model, "models/titanic_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 13. Predict New Passenger
# -----------------------------
new_passenger = pd.DataFrame([{
    "Pclass": 3,
    "Sex": "male",
    "Age": 25,
    "SibSp": 0,
    "Parch": 0,
    "Fare": 7.25,
    "Embarked": "S"
}])

prediction = model.predict(new_passenger)
prediction_probability = model.predict_proba(new_passenger)

print("\nNew Passenger:")
print(new_passenger)

print("Prediction:", prediction[0])
print("Survival Probability:", prediction_probability[0][1])

if prediction[0] == 1:
    print("Result: Passenger Survived")
else:
    print("Result: Passenger Did Not Survive")
```

---

## 6. If You Do Not Have Titanic CSV, Use This Mini Dataset

Save this as `titanic.csv`:

```csv
Survived,Pclass,Sex,Age,SibSp,Parch,Fare,Embarked
0,3,male,22,1,0,7.25,S
1,1,female,38,1,0,71.28,C
1,3,female,26,0,0,7.92,S
1,1,female,35,1,0,53.10,S
0,3,male,35,0,0,8.05,S
0,3,male,28,0,0,8.45,Q
0,1,male,54,0,0,51.86,S
0,3,male,2,3,1,21.07,S
1,3,female,27,0,2,11.13,S
1,2,female,14,1,0,30.07,C
```

---

## 7. Interview Explanation

```text
I built a Titanic Survival Prediction project using Logistic Regression.

The target variable is Survived, where 1 means survived and 0 means not survived.

I handled missing values using SimpleImputer. I scaled numerical columns and encoded categorical columns using OneHotEncoder.

I used a complete scikit-learn Pipeline so preprocessing and model training happen together.

I evaluated the model using accuracy, precision, recall, F1 score, confusion matrix, and classification report.
```

---

# Project 5: Iris Flower Classification

## 1. Project Use

This project classifies iris flowers into three species:

```text
Setosa
Versicolor
Virginica
```

Based on:

```text
Sepal Length
Sepal Width
Petal Length
Petal Width
```

---

## 2. ML Type

```text
Multi-class Classification
```

Because there are 3 classes.

---

## 3. Algorithm Used

```text
Random Forest Classifier
```

Random Forest is good for classification and gives strong accuracy.

---

## 4. Complete Code

```python
# iris_flower_classification.py

import os
import joblib
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

os.makedirs("models", exist_ok=True)

# -----------------------------
# 1. Load Dataset
# -----------------------------
iris = load_iris()

df = pd.DataFrame(iris.data, columns=iris.feature_names)
df["target"] = iris.target
df["species"] = df["target"].map({
    0: "setosa",
    1: "versicolor",
    2: "virginica"
})

print("Dataset Head:")
print(df.head())

print("\nTarget Names:")
print(iris.target_names)

# -----------------------------
# 2. Features and Target
# -----------------------------
X = df[iris.feature_names]
y = df["target"]

# -----------------------------
# 3. Train-Test Split
# -----------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# -----------------------------
# 4. Build Model
# -----------------------------
model = RandomForestClassifier(
    n_estimators=100,
    max_depth=5,
    random_state=42
)

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
accuracy = accuracy_score(y_test, y_pred)

precision = precision_score(
    y_test,
    y_pred,
    average="weighted"
)

recall = recall_score(
    y_test,
    y_pred,
    average="weighted"
)

f1 = f1_score(
    y_test,
    y_pred,
    average="weighted"
)

print("\nModel Evaluation:")
print("Accuracy:", accuracy)
print("Precision:", precision)
print("Recall:", recall)
print("F1 Score:", f1)

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# -----------------------------
# 8. Save Model
# -----------------------------
joblib.dump(model, "models/iris_model.joblib")
print("\nModel saved successfully.")

# -----------------------------
# 9. Predict New Flower
# -----------------------------
new_flower = pd.DataFrame([{
    "sepal length (cm)": 5.1,
    "sepal width (cm)": 3.5,
    "petal length (cm)": 1.4,
    "petal width (cm)": 0.2
}])

prediction = model.predict(new_flower)
prediction_proba = model.predict_proba(new_flower)

predicted_species = iris.target_names[prediction[0]]

print("\nNew Flower Data:")
print(new_flower)

print("Predicted Class:", prediction[0])
print("Predicted Species:", predicted_species)
print("Prediction Probability:", prediction_proba)

# -----------------------------
# 10. Visualization
# -----------------------------
sns.scatterplot(
    data=df,
    x="petal length (cm)",
    y="petal width (cm)",
    hue="species"
)

plt.title("Iris Flower Classification")
plt.show()
```

---

## 5. Interview Explanation

```text
I built an Iris Flower Classification project using Random Forest Classifier.

The dataset contains four features: sepal length, sepal width, petal length, and petal width.

The target has three flower species: Setosa, Versicolor, and Virginica.

I trained a Random Forest model and evaluated it using accuracy, precision, recall, F1 score, confusion matrix, and classification report.

This project is useful for understanding multi-class classification.
```

---

# Final Comparison Table

| Project | Input | Output | Type | Algorithm |
|---|---|---|---|---|
| Student Marks Prediction | Study hours, attendance, previous score | Marks | Regression | Linear Regression |
| House Price Prediction | House features | Price | Regression | Random Forest Regressor |
| Salary Prediction | Experience, skill, interview score | Salary | Regression | Linear Regression |
| Titanic Survival Prediction | Passenger details | Survived / Not survived | Classification | Logistic Regression |
| Iris Flower Classification | Flower measurements | Flower species | Classification | Random Forest |

---

# Which Metrics to Use?

## Regression Projects

Use these metrics:

| Metric | Meaning |
|---|---|
| MAE | Average absolute error |
| MSE | Average squared error |
| RMSE | Error in original unit |
| R² Score | Model fit score |

Used in:

```text
Student Marks Prediction
House Price Prediction
Salary Prediction
```

---

## Classification Projects

Use these metrics:

| Metric | Meaning |
|---|---|
| Accuracy | Overall correct predictions |
| Precision | Correct positive predictions |
| Recall | Finds actual positives |
| F1 Score | Balance of precision and recall |
| Confusion Matrix | TP, TN, FP, FN table |

Used in:

```text
Titanic Survival Prediction
Iris Flower Classification
```

---

# Final Interview Summary

```text
I completed five beginner machine learning projects.

First, I built Student Marks Prediction using Linear Regression to predict marks based on study hours, attendance, and previous score.

Second, I built House Price Prediction using Random Forest Regressor to predict house prices based on housing features.

Third, I built Salary Prediction using Linear Regression to predict salary based on experience, skill score, and interview score.

Fourth, I built Titanic Survival Prediction using Logistic Regression. I handled missing values, encoded categorical data, scaled numerical data, and evaluated the model using classification metrics.

Fifth, I built Iris Flower Classification using Random Forest Classifier to classify flowers into Setosa, Versicolor, and Virginica.

These projects helped me understand regression, classification, preprocessing, train-test split, model training, model evaluation, prediction, and model saving using Joblib.
```

# Best Project Explanation for Interview

```text
In my beginner machine learning projects, I followed the complete ML workflow.

First, I understood the problem statement and identified whether it was regression or classification.

Then I loaded the dataset, checked missing values, selected features and target, split the data into training and testing sets, trained the model, evaluated it using proper metrics, and saved the model using Joblib.

For regression projects, I used MAE, RMSE, and R² Score. For classification projects, I used accuracy, precision, recall, F1 score, confusion matrix, and classification report.

These projects gave me practical understanding of end-to-end machine learning.
```
