# Lecture 01: Python Foundations for ML

## Why Python matters in ML
Python is the most common language for machine learning because it is simple, readable, and has a strong ecosystem for data science, modeling, and deployment.

Key reasons:
- easy syntax for quickly testing ideas
- libraries like NumPy, Pandas, Scikit-learn, TensorFlow, and PyTorch
- strong support for visualization, data wrangling, and deployment
- large community and open-source examples

## Variables and data types
```python
name = "CampusX"
score = 95
is_active = True
numbers = [1, 2, 3, 4]
```

Common Python data types:
- int: whole numbers
- float: decimal values
- str: text
- bool: True/False
- list: ordered collection
- dict: key-value pairs
- tuple: immutable ordered values

## Control flow
```python
marks = 82
if marks >= 90:
    print("Excellent")
elif marks >= 75:
    print("Good")
else:
    print("Needs effort")
```

## Loops
```python
for i in range(5):
    print(i)

count = 0
while count < 3:
    print(count)
    count += 1
```

## Functions
```python
def add(a, b):
    return a + b

result = add(3, 7)
print(result)
```

## Python for data work
A strong ML workflow depends on:
- reading data
- cleaning data
- exploring patterns
- building features
- training models

### Example
```python
import pandas as pd

df = pd.DataFrame({
    "hours": [1, 2, 3, 4, 5],
    "score": [40, 52, 65, 77, 90]
})

print(df.head())
```

## Summary
Python gives you the language tools to build the full ML pipeline from data cleaning to model deployment. In the next lecture, the focus shifts to core ML concepts and the workflow used by most data science teams.

## Interview note
A common interview question is: “Why is Python preferred for ML?” The answer is a mix of ease of use, library availability, and ecosystem maturity.
