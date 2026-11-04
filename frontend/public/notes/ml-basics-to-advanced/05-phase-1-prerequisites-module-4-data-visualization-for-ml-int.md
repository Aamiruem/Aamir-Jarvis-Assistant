> **You asked:**
>
> Module 4: Data Visualization
> Matplotlib
> Line Chart
> Bar Chart
> Histogram
> Scatter Plot
> Pie Chart
> Box Plot
> Subplots
> Customization
> Seaborn
> Heatmap
> Pairplot
> Distplot
> Countplot
> Violin Plot
> Jointplot
> Correlation Plot

# Phase 1: Prerequisites  
# Module 4: Data Visualization for ML Interview

Data visualization means showing data using graphs and charts.

In Machine Learning, visualization is used for:

```text
Understanding data
Finding patterns
Finding outliers
Checking distribution
Checking correlation
Comparing categories
Explaining results
```

Popular Python libraries:

```python
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
```

**Matplotlib** is a core Python visualization library for static, animated, and interactive visualizations. **Seaborn** is built on top of Matplotlib and gives a high-level interface for statistical graphics. citeturn172904search1turn172904search3

---

# 1. Sample Dataset for Practice

```python
import pandas as pd

df = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara"],
    "Department": ["IT", "HR", "IT", "Finance", "HR", "IT"],
    "Age": [23, 25, 24, 27, 22, 28],
    "Salary": [50000, 45000, 60000, 55000, 40000, 70000],
    "Experience": [2, 3, 4, 5, 1, 6],
    "Score": [80, 70, 85, 78, 65, 90]
})

print(df)
```

Output:

```text
    Name Department  Age  Salary  Experience  Score
0  Aamir         IT   23   50000           2     80
1  Rahul         HR   25   45000           3     70
2  Priya         IT   24   60000           4     85
3   Neha    Finance   27   55000           5     78
4   Aman         HR   22   40000           1     65
5   Sara         IT   28   70000           6     90
```

---

# 2. Matplotlib

## Easy Definition

Matplotlib is a Python library used to create charts and graphs.

Simple meaning:

```text
Matplotlib = basic and powerful graph library
```

Common import:

```python
import matplotlib.pyplot as plt
```

## Basic Structure

```python
plt.figure(figsize=(8, 5))
plt.plot(x, y)
plt.title("Chart Title")
plt.xlabel("X Axis")
plt.ylabel("Y Axis")
plt.show()
```

## Interview Answer

Matplotlib is a Python visualization library used to create line charts, bar charts, histograms, scatter plots, pie charts, box plots, and customized graphs.

---

# 3. Line Chart

## Easy Definition

Line chart is used to show trend over time or ordered data.

Used for:

```text
Sales over months
Stock price over time
Accuracy over epochs
Temperature over days
```

## Example

```python
import matplotlib.pyplot as plt

months = ["Jan", "Feb", "Mar", "Apr", "May"]
sales = [10000, 15000, 13000, 18000, 22000]

plt.figure(figsize=(8, 5))
plt.plot(months, sales, marker="o")
plt.title("Monthly Sales Trend")
plt.xlabel("Month")
plt.ylabel("Sales")
plt.grid(True)
plt.show()
```

## Dry Run

```text
Jan → 10000
Feb → 15000
Mar → 13000
Apr → 18000
May → 22000
```

The line connects these points and shows whether sales are increasing or decreasing.

## ML Use

Line chart is used to show:

```text
Model accuracy over epochs
Training loss over iterations
Time-series trends
Sales forecasting trends
```

## Interview Answer

Line chart is used to show trends or changes over time.

---

# 4. Bar Chart

## Easy Definition

Bar chart is used to compare different categories.

Used for:

```text
Department-wise salary
City-wise sales
Product-wise profit
Class count comparison
```

## Example

```python
departments = ["IT", "HR", "Finance"]
avg_salary = [60000, 42500, 55000]

plt.figure(figsize=(8, 5))
plt.bar(departments, avg_salary)
plt.title("Department-wise Average Salary")
plt.xlabel("Department")
plt.ylabel("Average Salary")
plt.show()
```

## Dry Run

```text
IT      → 60000
HR      → 42500
Finance → 55000
```

Each department gets one bar.

## Using Pandas GroupBy

```python
dept_salary = df.groupby("Department")["Salary"].mean()

plt.figure(figsize=(8, 5))
plt.bar(dept_salary.index, dept_salary.values)
plt.title("Average Salary by Department")
plt.xlabel("Department")
plt.ylabel("Average Salary")
plt.show()
```

## ML Use

Bar chart is useful for:

```text
Class distribution
Feature comparison
Category-wise target analysis
```

## Interview Answer

Bar chart is used to compare numerical values across categories.

---

# 5. Histogram

## Easy Definition

Histogram shows the distribution of numerical data.

Simple meaning:

```text
Histogram tells how frequently values appear in ranges.
```

Used for:

```text
Age distribution
Salary distribution
Marks distribution
Feature distribution
```

## Example

```python
plt.figure(figsize=(8, 5))
plt.hist(df["Salary"], bins=5)
plt.title("Salary Distribution")
plt.xlabel("Salary")
plt.ylabel("Frequency")
plt.show()
```

## Dry Run

Salary values:

```text
40000, 45000, 50000, 55000, 60000, 70000
```

Histogram groups these values into ranges, then counts how many values fall in each range.

## ML Use

Histogram is used to check:

```text
Normal distribution
Skewness
Outliers
Feature spread
```

## Interview Answer

Histogram is used to show the frequency distribution of continuous numerical data.

---

# 6. Scatter Plot

## Easy Definition

Scatter plot shows relationship between two numerical variables.

Used for:

```text
Experience vs Salary
Study hours vs Marks
Age vs Income
Area vs House Price
```

## Example

```python
plt.figure(figsize=(8, 5))
plt.scatter(df["Experience"], df["Salary"])
plt.title("Experience vs Salary")
plt.xlabel("Experience")
plt.ylabel("Salary")
plt.show()
```

## Dry Run

```text
Experience 2 → Salary 50000
Experience 3 → Salary 45000
Experience 4 → Salary 60000
Experience 5 → Salary 55000
Experience 1 → Salary 40000
Experience 6 → Salary 70000
```

Each row becomes one point on the graph.

## ML Use

Scatter plot is useful for:

```text
Finding relationship between features
Checking linear relationship
Finding outliers
Understanding regression problems
```

## Interview Answer

Scatter plot is used to show the relationship between two numerical variables.

---

# 7. Pie Chart

## Easy Definition

Pie chart shows part-to-whole relationship.

Used for:

```text
Market share
Department percentage
Category percentage
Class ratio
```

## Example

```python
dept_count = df["Department"].value_counts()

plt.figure(figsize=(7, 7))
plt.pie(dept_count.values, labels=dept_count.index, autopct="%1.1f%%")
plt.title("Department Distribution")
plt.show()
```

## Dry Run

```text
IT      → 3 employees
HR      → 2 employees
Finance → 1 employee
```

Pie chart converts counts into percentages.

## ML Use

Pie chart can show class balance, but for ML, bar chart is usually better for class distribution.

## Interview Answer

Pie chart is used to show percentage contribution of categories in the whole data.

---

# 8. Box Plot

## Easy Definition

Box plot shows distribution, median, quartiles, and outliers.

It shows:

```text
Minimum
Q1
Median
Q3
Maximum
Outliers
```

## Example

```python
plt.figure(figsize=(8, 5))
plt.boxplot(df["Salary"])
plt.title("Salary Box Plot")
plt.ylabel("Salary")
plt.show()
```

## Box Plot Concept

```text
Q1 = 25th percentile
Q2 = Median = 50th percentile
Q3 = 75th percentile
IQR = Q3 - Q1
```

Outlier formula:

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

## ML Use

Box plot is very important for:

```text
Outlier detection
Feature distribution
Comparing groups
Data cleaning
```

## Interview Answer

Box plot is used to visualize data spread, quartiles, median, and outliers.

---

# 9. Subplots

## Easy Definition

Subplots allow multiple charts in one figure.

Simple meaning:

```text
Subplots = multiple graphs in one window
```

## Example

```python
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.hist(df["Salary"], bins=5)
plt.title("Salary Distribution")

plt.subplot(1, 2, 2)
plt.scatter(df["Experience"], df["Salary"])
plt.title("Experience vs Salary")
plt.xlabel("Experience")
plt.ylabel("Salary")

plt.tight_layout()
plt.show()
```

## Dry Run

```text
plt.subplot(1, 2, 1)
```

Means:

```text
1 row
2 columns
1st chart
```

```text
plt.subplot(1, 2, 2)
```

Means:

```text
1 row
2 columns
2nd chart
```

## Better Object-Oriented Style

```python
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

axes[0].hist(df["Salary"], bins=5)
axes[0].set_title("Salary Distribution")

axes[1].scatter(df["Experience"], df["Salary"])
axes[1].set_title("Experience vs Salary")
axes[1].set_xlabel("Experience")
axes[1].set_ylabel("Salary")

plt.tight_layout()
plt.show()
```

## Interview Answer

Subplots are used to show multiple charts in a single figure for comparison.

---

# 10. Matplotlib Customization

## Common Customizations

```python
plt.figure(figsize=(8, 5))
plt.plot(
    df["Experience"],
    df["Salary"],
    marker="o",
    linestyle="--",
    linewidth=2,
    label="Salary"
)

plt.title("Experience vs Salary")
plt.xlabel("Experience")
plt.ylabel("Salary")
plt.legend()
plt.grid(True)
plt.show()
```

## Common Properties

| Property | Use |
|---|---|
| `figsize` | Chart size |
| `title()` | Chart title |
| `xlabel()` | X-axis name |
| `ylabel()` | Y-axis name |
| `legend()` | Show label |
| `grid()` | Show grid lines |
| `marker` | Point style |
| `linestyle` | Line style |
| `linewidth` | Line thickness |
| `xlim()` | Set x-axis range |
| `ylim()` | Set y-axis range |

## Example with Axis Limit

```python
plt.scatter(df["Experience"], df["Salary"])
plt.xlim(0, 10)
plt.ylim(30000, 80000)
plt.title("Experience vs Salary")
plt.xlabel("Experience")
plt.ylabel("Salary")
plt.show()
```

## Interview Answer

Customization means improving chart readability using title, labels, legend, grid, marker, line style, size, and axis limits.

---

# 11. Seaborn

## Easy Definition

Seaborn is a Python library built on Matplotlib for statistical visualization.

Simple meaning:

```text
Seaborn = easier and more attractive statistical charts
```

Import:

```python
import seaborn as sns
import matplotlib.pyplot as plt
```

## Set Theme

```python
sns.set_theme()
```

## Interview Answer

Seaborn is a statistical data visualization library based on Matplotlib. It works well with Pandas DataFrames and is useful for heatmaps, pairplots, countplots, violin plots, and correlation analysis. citeturn172904search3turn172904search22

---

# 12. Heatmap

## Easy Definition

Heatmap shows values using colors.

Used for:

```text
Correlation matrix
Confusion matrix
Missing value pattern
Pivot table visualization
```

Seaborn `heatmap()` plots rectangular data as a color-encoded matrix. If a Pandas DataFrame is used, its index and column information labels the rows and columns. citeturn172904search4

## Example: Correlation Heatmap

```python
numeric_df = df[["Age", "Salary", "Experience", "Score"]]

corr = numeric_df.corr()

plt.figure(figsize=(8, 5))
sns.heatmap(corr, annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap")
plt.show()
```

## Dry Run

Correlation tells relationship between columns:

```text
Experience and Salary → positive relation
Score and Salary      → possible positive relation
Age and Salary        → possible relation
```

## ML Use

Heatmap is used for:

```text
Feature correlation checking
Multicollinearity detection
Confusion matrix visualization
Feature selection
```

## Interview Answer

Heatmap uses colors to represent numerical values. In ML, it is commonly used to visualize correlation between features.

---

# 13. Pairplot

## Easy Definition

Pairplot shows pairwise relationships between numerical columns.

Simple meaning:

```text
Pairplot creates scatter plots between every pair of numerical features.
```

Seaborn `pairplot()` creates a grid of plots to show pairwise relationships in a dataset. citeturn172904search6

## Example

```python
sns.pairplot(df[["Age", "Salary", "Experience", "Score"]])
plt.show()
```

## With Category Color

```python
sns.pairplot(df, vars=["Age", "Salary", "Experience", "Score"], hue="Department")
plt.show()
```

## ML Use

Pairplot is useful for:

```text
EDA
Feature relationship
Class separation
Outlier detection
Regression pattern checking
```

## Interview Answer

Pairplot is used to visualize pairwise relationships between numerical features.

---

# 14. Distplot / Distribution Plot

## Easy Definition

Distribution plot shows how a numerical feature is distributed.

Important current point: `seaborn.distplot()` is deprecated and has been replaced by `histplot()` and `displot()` in Seaborn’s modern API. citeturn172904search2

## Modern Replacement: Histplot

```python
sns.histplot(df["Salary"], kde=True)
plt.title("Salary Distribution")
plt.xlabel("Salary")
plt.show()
```

## Old Distplot Syntax

```python
sns.distplot(df["Salary"])
plt.show()
```

Use this only if the interviewer asks old Seaborn syntax.

## ML Use

Distribution plots are used to check:

```text
Normal distribution
Skewness
Outliers
Feature transformation need
```

## Interview Answer

A distribution plot shows the spread and shape of numerical data. In modern Seaborn, we use `histplot()` or `displot()` because `distplot()` is deprecated.

---

# 15. Countplot

## Easy Definition

Countplot shows count of each category.

Used for:

```text
Department count
Gender count
Class distribution
Target class balance
```

## Example

```python
sns.countplot(data=df, x="Department")
plt.title("Department Count")
plt.xlabel("Department")
plt.ylabel("Count")
plt.show()
```

## Dry Run

```text
IT      → 3
HR      → 2
Finance → 1
```

## ML Use

Countplot is very useful for:

```text
Checking class imbalance
Categorical feature analysis
Target distribution
```

## Interview Answer

Countplot is used to show the frequency of categorical values.

---

# 16. Violin Plot

## Easy Definition

Violin plot shows distribution and density of numerical data for categories.

Simple meaning:

```text
Violin plot = box plot + distribution shape
```

## Example

```python
sns.violinplot(data=df, x="Department", y="Salary")
plt.title("Salary Distribution by Department")
plt.xlabel("Department")
plt.ylabel("Salary")
plt.show()
```

## ML Use

Violin plot is used for:

```text
Comparing distribution across categories
Finding spread
Finding skewness
Finding outliers
```

## Interview Answer

Violin plot shows the distribution and density of numerical data across categories.

---

# 17. Jointplot

## Easy Definition

Jointplot shows relationship between two variables plus their individual distributions.

Simple meaning:

```text
Scatter plot + histograms
```

## Example

```python
sns.jointplot(data=df, x="Experience", y="Salary", kind="scatter")
plt.show()
```

## With Regression Line

```python
sns.jointplot(data=df, x="Experience", y="Salary", kind="reg")
plt.show()
```

## ML Use

Jointplot is useful for:

```text
Regression analysis
Relationship checking
Distribution checking
Outlier detection
```

## Interview Answer

Jointplot shows the relationship between two numerical variables along with their individual distributions.

---

# 18. Correlation Plot

## Easy Definition

Correlation plot shows how strongly two numerical variables are related.

Correlation value range:

```text
+1 → Strong positive relationship
 0 → No linear relationship
-1 → Strong negative relationship
```

genui{"inference_regression_ml_learning_block_staging":{"type_id":"CORRELATION","locale_override":"en-US"}}

## Example

```python
corr = df[["Age", "Salary", "Experience", "Score"]].corr()

sns.heatmap(corr, annot=True, cmap="coolwarm")
plt.title("Correlation Plot")
plt.show()
```

## Dry Run

If correlation between Experience and Salary is high positive:

```text
Experience increases → Salary also increases
```

If correlation is near zero:

```text
No strong linear relationship
```

If correlation is negative:

```text
One variable increases → Other decreases
```

## ML Use

Correlation plot is used for:

```text
Feature selection
Removing highly correlated features
Detecting multicollinearity
Understanding feature-target relationship
```

## Interview Answer

Correlation plot shows the relationship strength between numerical variables. It helps in feature selection and detecting multicollinearity.

---

# 19. Complete Matplotlib Practice Code

```python
import pandas as pd
import matplotlib.pyplot as plt

df = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara"],
    "Department": ["IT", "HR", "IT", "Finance", "HR", "IT"],
    "Age": [23, 25, 24, 27, 22, 28],
    "Salary": [50000, 45000, 60000, 55000, 40000, 70000],
    "Experience": [2, 3, 4, 5, 1, 6],
    "Score": [80, 70, 85, 78, 65, 90]
})

# 1. Line Chart
plt.figure(figsize=(8, 5))
plt.plot(df["Name"], df["Salary"], marker="o")
plt.title("Employee Salary")
plt.xlabel("Name")
plt.ylabel("Salary")
plt.show()

# 2. Bar Chart
dept_salary = df.groupby("Department")["Salary"].mean()

plt.figure(figsize=(8, 5))
plt.bar(dept_salary.index, dept_salary.values)
plt.title("Average Salary by Department")
plt.xlabel("Department")
plt.ylabel("Average Salary")
plt.show()

# 3. Histogram
plt.figure(figsize=(8, 5))
plt.hist(df["Salary"], bins=5)
plt.title("Salary Distribution")
plt.xlabel("Salary")
plt.ylabel("Frequency")
plt.show()

# 4. Scatter Plot
plt.figure(figsize=(8, 5))
plt.scatter(df["Experience"], df["Salary"])
plt.title("Experience vs Salary")
plt.xlabel("Experience")
plt.ylabel("Salary")
plt.show()

# 5. Pie Chart
dept_count = df["Department"].value_counts()

plt.figure(figsize=(7, 7))
plt.pie(dept_count.values, labels=dept_count.index, autopct="%1.1f%%")
plt.title("Department Distribution")
plt.show()

# 6. Box Plot
plt.figure(figsize=(8, 5))
plt.boxplot(df["Salary"])
plt.title("Salary Box Plot")
plt.ylabel("Salary")
plt.show()
```

---

# 20. Complete Seaborn Practice Code

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

sns.set_theme()

df = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara"],
    "Department": ["IT", "HR", "IT", "Finance", "HR", "IT"],
    "Age": [23, 25, 24, 27, 22, 28],
    "Salary": [50000, 45000, 60000, 55000, 40000, 70000],
    "Experience": [2, 3, 4, 5, 1, 6],
    "Score": [80, 70, 85, 78, 65, 90]
})

# 1. Heatmap
corr = df[["Age", "Salary", "Experience", "Score"]].corr()

sns.heatmap(corr, annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap")
plt.show()

# 2. Pairplot
sns.pairplot(df, vars=["Age", "Salary", "Experience", "Score"], hue="Department")
plt.show()

# 3. Distribution Plot using histplot
sns.histplot(df["Salary"], kde=True)
plt.title("Salary Distribution")
plt.show()

# 4. Countplot
sns.countplot(data=df, x="Department")
plt.title("Department Count")
plt.show()

# 5. Violin Plot
sns.violinplot(data=df, x="Department", y="Salary")
plt.title("Salary Distribution by Department")
plt.show()

# 6. Jointplot
sns.jointplot(data=df, x="Experience", y="Salary", kind="reg")
plt.show()
```

---

# 21. Which Chart to Use?

| Problem | Best Chart |
|---|---|
| Trend over time | Line chart |
| Category comparison | Bar chart |
| Distribution of numerical data | Histogram / Distplot |
| Relationship between 2 variables | Scatter plot |
| Percentage share | Pie chart |
| Outlier detection | Box plot |
| Multiple graphs together | Subplots |
| Correlation between features | Heatmap |
| Pairwise feature relation | Pairplot |
| Category count | Countplot |
| Distribution by category | Violin plot |
| Two-variable relation + distribution | Jointplot |

---

# 22. Most Asked Interview Questions

## Q1. What is data visualization?

Data visualization means representing data using charts and graphs to understand patterns, trends, outliers, and relationships.

---

## Q2. Why is visualization important in ML?

Visualization helps in EDA, outlier detection, distribution checking, correlation analysis, feature selection, and model result explanation.

---

## Q3. Matplotlib vs Seaborn?

| Matplotlib | Seaborn |
|---|---|
| Low-level library | High-level library |
| More control | Easier syntax |
| Basic charts | Statistical charts |
| More customization | Better default style |
| Used for all graph types | Built on Matplotlib |

---

## Q4. Histogram vs Bar Chart?

| Histogram | Bar Chart |
|---|---|
| Numerical continuous data | Categorical data |
| Shows distribution | Shows comparison |
| Bars touch each other | Bars usually separated |

---

## Q5. Scatter Plot vs Line Chart?

| Scatter Plot | Line Chart |
|---|---|
| Shows relationship | Shows trend |
| Points are separate | Points are connected |
| Used for correlation | Used for time/order data |

---

## Q6. Box Plot vs Violin Plot?

| Box Plot | Violin Plot |
|---|---|
| Shows quartiles and outliers | Shows distribution density |
| Simple and compact | More detailed |
| Good for outlier detection | Good for comparing distributions |

---

## Q7. What is heatmap?

Heatmap represents numeric values using colors. In ML, it is mostly used for correlation matrix and confusion matrix.

---

## Q8. What is pairplot?

Pairplot shows pairwise relationships between numerical features in a dataset.

---

## Q9. What is countplot?

Countplot shows frequency/count of categorical values.

---

## Q10. What is correlation plot?

Correlation plot shows the strength and direction of relationships between numerical features.

---

# Final Interview Summary

```text
Data visualization is very important in Machine Learning because it helps us understand data before model building.

I use Matplotlib for basic charts like line chart, bar chart, histogram, scatter plot, pie chart, box plot, and subplots. I use Seaborn for statistical charts like heatmap, pairplot, histplot, countplot, violin plot, jointplot, and correlation plot.

Visualization helps me perform EDA, detect outliers, check distributions, analyze relationships, find correlations, and select useful features for ML models.
```
