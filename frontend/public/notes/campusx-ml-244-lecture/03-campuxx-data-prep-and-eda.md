# Lecture 03: Data Preparation and EDA

## Why EDA matters
Before training a model, data needs to be understood. EDA (Exploratory Data Analysis) helps reveal missing values, patterns, outliers, and relationships.

## Missing values
```python
import pandas as pd

df = pd.DataFrame({
    "age": [20, 25, None, 30],
    "salary": [50000, 60000, 55000, None]
})

print(df.isnull().sum())
df = df.fillna(df.mean(numeric_only=True))
```

## Outliers
Outliers are values that are very different from the rest of the data. They can affect model performance.

Common methods:
- box plot analysis
- IQR method
- z-score thresholding

## Correlation
```python
corr = df.corr()
print(corr)
```

## Feature engineering
This means creating useful input variables for the model.

Examples:
- date to month/day features
- text to word counts
- bins for age groups

## Visualization
Useful plots:
- histograms
- scatter plots
- box plots
- heatmaps

```python
import matplotlib.pyplot as plt

plt.hist(df['age'])
plt.title('Age Distribution')
plt.show()
```

## Data cleaning checklist
- remove duplicate rows
- handle missing values
- correct inconsistent labels
- normalize numeric ranges when needed
- validate target distribution

## Summary
Good data preparation often matters more than model complexity. Cleaning, exploring, and checking data quality is a key step before model training.

## Interview note
A strong answer is: “EDA helps detect data quality issues before training so we build a model on reliable data.”
