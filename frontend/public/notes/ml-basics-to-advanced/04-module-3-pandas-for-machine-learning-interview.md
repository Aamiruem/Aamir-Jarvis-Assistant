> **You asked:**
>
> Module 3: Pandas
> Series
> DataFrame
> Read CSV
> Read Excel
> Read JSON
> Selecting Rows
> Selecting Columns
> Filtering
> Sorting
> Missing Values
> Duplicates
> Merge
> Join
> Concat
> GroupBy
> Pivot Table
> Crosstab
> Apply
> Map
> Replace

I’ll explain this as interview notes with one small dataset, then show each Pandas operation on that dataset so you can understand the practical use clearly.

# Module 3: Pandas for Machine Learning Interview

Pandas is used for **data cleaning, data analysis, data preprocessing, and tabular data handling**. In ML, we mostly use Pandas before model training to read data, clean missing values, filter rows, group data, and prepare features. Pandas provides two main data structures: **Series** and **DataFrame**. A DataFrame is a 2D labeled structure, similar to an Excel sheet or SQL table. citeturn243481search10turn243481search17

```python
import pandas as pd
```

---

# 1. Sample Dataset for Practice

We will use this dataset in many examples.

```python
import pandas as pd

data = {
    "Emp_ID": [101, 102, 103, 104, 105, 106, 106],
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara", "Sara"],
    "Department": ["IT", "HR", "IT", "Finance", "HR", "IT", "IT"],
    "City": ["Delhi", "Mumbai", "Delhi", "Patna", "Mumbai", None, None],
    "Salary": [50000, 45000, 60000, 55000, None, 70000, 70000],
    "Experience": [2, 3, 4, 5, 1, 6, 6]
}

df = pd.DataFrame(data)
print(df)
```

Output:

```text
   Emp_ID   Name Department    City   Salary  Experience
0     101  Aamir         IT   Delhi  50000.0           2
1     102  Rahul         HR  Mumbai  45000.0           3
2     103  Priya         IT   Delhi  60000.0           4
3     104   Neha    Finance   Patna  55000.0           5
4     105   Aman         HR  Mumbai      NaN           1
5     106   Sara         IT    None  70000.0           6
6     106   Sara         IT    None  70000.0           6
```

---

# 2. Series

## What is Series?

A **Series** is a one-dimensional labeled array.

Simple meaning:

```text
Series = single column of data
```

Example:

```python
s = pd.Series([10, 20, 30, 40])
print(s)
```

Output:

```text
0    10
1    20
2    30
3    40
dtype: int64
```

Here:

```text
0, 1, 2, 3 → index
10, 20, 30, 40 → values
```

## Series with Custom Index

```python
marks = pd.Series([85, 90, 75], index=["Aamir", "Rahul", "Priya"])
print(marks)
```

Output:

```text
Aamir    85
Rahul    90
Priya    75
dtype: int64
```

## Access Series Value

```python
print(marks["Aamir"])
```

Output:

```text
85
```

## Interview Answer

A Series is a one-dimensional labeled data structure in Pandas. It is like a single column in Excel.

---

# 3. DataFrame

## What is DataFrame?

A **DataFrame** is a two-dimensional table with rows and columns.

Simple meaning:

```text
DataFrame = complete table
Series = one column
```

```python
df = pd.DataFrame(data)
print(df)
```

## Check Basic Information

```python
print(df.head())
print(df.tail())
print(df.shape)
print(df.columns)
print(df.info())
print(df.describe())
```

Meaning:

| Command | Meaning |
|---|---|
| `head()` | First 5 rows |
| `tail()` | Last 5 rows |
| `shape` | Rows and columns |
| `columns` | Column names |
| `info()` | Data types and null values |
| `describe()` | Statistical summary |

## Interview Answer

A DataFrame is a 2D labeled data structure with rows and columns. It is similar to an Excel sheet or SQL table.

---

# 4. Read CSV

CSV means comma-separated values.

Pandas I/O functions like `read_csv()` are top-level reader functions that return Pandas objects such as DataFrames. citeturn243481search18

```python
df = pd.read_csv("employees.csv")
print(df.head())
```

## Useful Parameters

```python
df = pd.read_csv("employees.csv", encoding="utf-8")
```

```python
df = pd.read_csv("employees.csv", usecols=["Name", "Salary"])
```

```python
df = pd.read_csv("employees.csv", nrows=5)
```

## Interview Answer

`read_csv()` is used to load CSV files into a Pandas DataFrame.

---

# 5. Read Excel

```python
df = pd.read_excel("employees.xlsx")
print(df.head())
```

Read specific sheet:

```python
df = pd.read_excel("employees.xlsx", sheet_name="Sheet1")
```

Pandas also supports writing DataFrames to Excel using `to_excel()`. citeturn243481search5

## Interview Answer

`read_excel()` is used to read Excel files into a Pandas DataFrame.

---

# 6. Read JSON

JSON means JavaScript Object Notation.

Example JSON:

```json
[
  {"Name": "Aamir", "Salary": 50000},
  {"Name": "Rahul", "Salary": 45000}
]
```

Read JSON:

```python
df = pd.read_json("employees.json")
print(df)
```

## Interview Answer

`read_json()` is used to read JSON data into a Pandas DataFrame.

---

# 7. Selecting Columns

## Select One Column

```python
print(df["Name"])
```

Output:

```text
0    Aamir
1    Rahul
2    Priya
3     Neha
4     Aman
5     Sara
6     Sara
Name: Name, dtype: object
```

This returns a **Series**.

## Select Multiple Columns

```python
print(df[["Name", "Salary"]])
```

This returns a **DataFrame**.

## Dry Run

```python
df[["Name", "Salary"]]
```

Meaning:

```text
Go to DataFrame
Pick only Name column
Pick only Salary column
Return new DataFrame
```

## Interview Answer

Single column selection returns a Series, while multiple column selection returns a DataFrame.

---

# 8. Selecting Rows

There are two common methods:

```text
loc  → label-based selection
iloc → index-position-based selection
```

---

## A. Select Row Using `iloc`

```python
print(df.iloc[0])
```

Output:

```text
Emp_ID             101
Name             Aamir
Department          IT
City             Delhi
Salary         50000.0
Experience           2
```

## Select Multiple Rows

```python
print(df.iloc[0:3])
```

This returns rows from index 0 to 2.

---

## B. Select Row Using `loc`

```python
print(df.loc[0])
```

If index labels are default numbers, `loc[0]` and `iloc[0]` look similar.

But difference:

```text
loc uses labels
iloc uses positions
```

## Select Rows and Columns Together

```python
print(df.loc[0:2, ["Name", "Salary"]])
```

Output:

```text
    Name   Salary
0  Aamir  50000.0
1  Rahul  45000.0
2  Priya  60000.0
```

## Interview Answer

`loc` is label-based, and `iloc` is integer-position-based.

---

# 9. Filtering

Filtering means selecting rows based on conditions.

## Example 1: Employees from IT Department

```python
it_employees = df[df["Department"] == "IT"]
print(it_employees)
```

## Dry Run

Condition:

```python
df["Department"] == "IT"
```

Output internally:

```text
0     True
1    False
2     True
3    False
4    False
5     True
6     True
```

Pandas keeps only `True` rows.

---

## Example 2: Salary Greater Than 50000

```python
high_salary = df[df["Salary"] > 50000]
print(high_salary)
```

---

## Example 3: Multiple Conditions

IT employees with salary greater than 50000:

```python
result = df[(df["Department"] == "IT") & (df["Salary"] > 50000)]
print(result)
```

Use:

```text
& → AND
| → OR
~ → NOT
```

Important:

```python
# Correct
df[(df["Department"] == "IT") & (df["Salary"] > 50000)]

# Wrong
df[df["Department"] == "IT" and df["Salary"] > 50000]
```

## Interview Answer

Filtering is used to extract rows that satisfy a condition. For multiple conditions, we use `&`, `|`, and parentheses.

---

# 10. Sorting

Sorting means arranging data in ascending or descending order.

## Sort by Salary

```python
df_sorted = df.sort_values(by="Salary")
print(df_sorted)
```

## Descending Order

```python
df_sorted = df.sort_values(by="Salary", ascending=False)
print(df_sorted)
```

## Sort by Multiple Columns

```python
df_sorted = df.sort_values(by=["Department", "Salary"], ascending=[True, False])
print(df_sorted)
```

Meaning:

```text
First sort Department A-Z
Inside each Department, sort Salary high to low
```

## Interview Answer

`sort_values()` is used to sort DataFrame rows based on one or more columns.

---

# 11. Missing Values

Missing values are represented as:

```text
NaN
None
Null
```

In ML, missing values must be handled before model training.

## Check Missing Values

```python
print(df.isnull())
```

## Count Missing Values

```python
print(df.isnull().sum())
```

Output:

```text
Emp_ID        0
Name          0
Department    0
City          2
Salary        1
Experience    0
```

---

## Drop Missing Values

```python
df_drop = df.dropna()
print(df_drop)
```

This removes rows having missing values.

---

## Fill Missing Values

### Fill Salary with Mean

```python
df["Salary"] = df["Salary"].fillna(df["Salary"].mean())
print(df)
```

Formula:

```text
Mean = Sum of values / Total number of values
```

Dry run:

```text
Salary values:
50000, 45000, 60000, 55000, 70000, 70000

Mean = 350000 / 6 = 58333.33
```

So missing salary becomes:

```text
58333.33
```

### Fill City with Mode

```python
df["City"] = df["City"].fillna(df["City"].mode()[0])
```

Mode means most frequent value.

## Interview Answer

Missing values can be handled by removing rows using `dropna()` or filling values using `fillna()`, mean, median, mode, or custom values.

---

# 12. Duplicates

Duplicates means repeated records.

## Check Duplicate Rows

```python
print(df.duplicated())
```

Output:

```text
0    False
1    False
2    False
3    False
4    False
5    False
6     True
dtype: bool
```

## Count Duplicates

```python
print(df.duplicated().sum())
```

## Remove Duplicates

```python
df_no_duplicates = df.drop_duplicates()
print(df_no_duplicates)
```

## Remove Duplicates Based on One Column

```python
df_no_duplicates = df.drop_duplicates(subset=["Emp_ID"])
```

## Interview Answer

Duplicates are repeated records. We use `duplicated()` to check duplicates and `drop_duplicates()` to remove them.

---

# 13. Merge

Merge is used to combine two DataFrames based on a common column.

This is similar to SQL joins. Pandas provides merge, join, and concatenate functionality for combining data. citeturn243481search13

## Example DataFrames

```python
employees = pd.DataFrame({
    "Emp_ID": [101, 102, 103, 104],
    "Name": ["Aamir", "Rahul", "Priya", "Neha"],
    "Dept_ID": [1, 2, 1, 3]
})

departments = pd.DataFrame({
    "Dept_ID": [1, 2, 3, 4],
    "Department": ["IT", "HR", "Finance", "Marketing"]
})
```

## Inner Merge

```python
result = pd.merge(employees, departments, on="Dept_ID", how="inner")
print(result)
```

Output:

```text
   Emp_ID   Name  Dept_ID Department
0     101  Aamir        1         IT
1     102  Rahul        2         HR
2     103  Priya        1         IT
3     104   Neha        3    Finance
```

## Types of Merge

| Merge Type | Meaning |
|---|---|
| `inner` | Matching records only |
| `left` | All records from left table |
| `right` | All records from right table |
| `outer` | All records from both tables |

## Dry Run

Employees table has `Dept_ID`.

Departments table has `Dept_ID`.

Pandas matches:

```text
Dept_ID 1 → IT
Dept_ID 2 → HR
Dept_ID 3 → Finance
```

Then it combines both tables.

## Interview Answer

Merge is used to combine two DataFrames based on a common column, similar to SQL joins.

---

# 14. Join

`join()` is mostly used to combine DataFrames based on index.

## Example

```python
df1 = pd.DataFrame({
    "Name": ["Aamir", "Rahul", "Priya"]
}, index=[101, 102, 103])

df2 = pd.DataFrame({
    "Salary": [50000, 45000, 60000]
}, index=[101, 102, 103])

result = df1.join(df2)
print(result)
```

Output:

```text
      Name  Salary
101  Aamir   50000
102  Rahul   45000
103  Priya   60000
```

## Merge vs Join

| Merge | Join |
|---|---|
| Common column based | Index based |
| Like SQL join | Mostly index join |
| More flexible | Simple index combining |

## Interview Answer

`join()` is used to combine DataFrames using index, while `merge()` is commonly used with common columns.

---

# 15. Concat

Concat means adding DataFrames together.

## Row-wise Concat

```python
df1 = pd.DataFrame({
    "Name": ["Aamir", "Rahul"],
    "Salary": [50000, 45000]
})

df2 = pd.DataFrame({
    "Name": ["Priya", "Neha"],
    "Salary": [60000, 55000]
})

result = pd.concat([df1, df2])
print(result)
```

Output:

```text
    Name  Salary
0  Aamir   50000
1  Rahul   45000
0  Priya   60000
1   Neha   55000
```

Reset index:

```python
result = pd.concat([df1, df2], ignore_index=True)
print(result)
```

Output:

```text
    Name  Salary
0  Aamir   50000
1  Rahul   45000
2  Priya   60000
3   Neha   55000
```

## Column-wise Concat

```python
result = pd.concat([df1, df2], axis=1)
print(result)
```

## Interview Answer

`concat()` is used to combine DataFrames either row-wise or column-wise.

---

# 16. GroupBy

GroupBy is used to group data and apply aggregation.

Simple meaning:

```text
Group similar rows and calculate summary
```

Example:

```python
grouped = df.groupby("Department")["Salary"].mean()
print(grouped)
```

Output:

```text
Department
Finance    55000.000000
HR         51666.666667
IT         62500.000000
Name: Salary, dtype: float64
```

Pandas DataFrame aggregation can apply one or more operations like sum, mean, min, and max over an axis or grouped object. citeturn243481search14

## GroupBy Dry Run

Data:

```text
IT salaries: 50000, 60000, 70000, 70000
HR salaries: 45000, 58333.33
Finance salaries: 55000
```

Formula:

```text
Mean = Sum / Count
```

IT:

```text
Mean = (50000 + 60000 + 70000 + 70000) / 4
Mean = 250000 / 4
Mean = 62500
```

## Multiple Aggregations

```python
result = df.groupby("Department")["Salary"].agg(["sum", "mean", "min", "max", "count"])
print(result)
```

## GroupBy Multiple Columns

```python
result = df.groupby(["Department", "City"])["Salary"].mean()
print(result)
```

## Interview Answer

GroupBy follows the split-apply-combine process: split data into groups, apply aggregation, and combine the result.

---

# 17. Pivot Table

Pivot table summarizes data in table format.

Example:

```python
pivot = pd.pivot_table(
    df,
    values="Salary",
    index="Department",
    columns="City",
    aggfunc="mean"
)

print(pivot)
```

Output idea:

```text
City          Delhi        Mumbai       Patna
Department
Finance        NaN           NaN      55000
HR             NaN       51666.67       NaN
IT         55000.00          NaN        NaN
```

## With Fill Value

```python
pivot = pd.pivot_table(
    df,
    values="Salary",
    index="Department",
    columns="City",
    aggfunc="mean",
    fill_value=0
)

print(pivot)
```

Pandas `pivot_table()` returns a DataFrame and is used to create spreadsheet-style summary tables. citeturn243481search3

## Interview Answer

Pivot table is used to summarize data using rows, columns, values, and aggregation functions.

---

# 18. Crosstab

Crosstab is used to count frequency between two categorical columns.

Example:

```python
result = pd.crosstab(df["Department"], df["City"])
print(result)
```

Output idea:

```text
City        Delhi  Mumbai  Patna
Department
Finance        0       0      1
HR             0       2      0
IT             2       0      0
```

## Crosstab with Margins

```python
result = pd.crosstab(df["Department"], df["City"], margins=True)
print(result)
```

## Interview Answer

Crosstab is used to create a frequency table between two categorical variables.

---

# 19. Apply

`apply()` is used to apply a function on rows or columns.

## Apply on Column

```python
def bonus(salary):
    return salary * 0.10

df["Bonus"] = df["Salary"].apply(bonus)
print(df[["Name", "Salary", "Bonus"]])
```

## Using Lambda

```python
df["Bonus"] = df["Salary"].apply(lambda x: x * 0.10)
```

## Apply on Row

```python
df["Salary_Level"] = df["Salary"].apply(
    lambda x: "High" if x > 55000 else "Low"
)

print(df[["Name", "Salary", "Salary_Level"]])
```

## Dry Run

For salary:

```text
Aamir = 50000
Bonus = 50000 * 0.10 = 5000

Priya = 60000
Bonus = 60000 * 0.10 = 6000
```

## Interview Answer

`apply()` is used to apply custom functions on a Series or DataFrame.

---

# 20. Map

`map()` is mostly used on a Series to replace or transform values.

## Example: Convert Department to Code

```python
dept_code = {
    "IT": 1,
    "HR": 2,
    "Finance": 3
}

df["Dept_Code"] = df["Department"].map(dept_code)
print(df[["Department", "Dept_Code"]])
```

Output:

```text
  Department  Dept_Code
0         IT          1
1         HR          2
2         IT          1
3    Finance          3
4         HR          2
5         IT          1
6         IT          1
```

## Dry Run

```text
IT → 1
HR → 2
Finance → 3
```

## Interview Answer

`map()` is used to transform values in a Series using a dictionary, function, or another Series.

---

# 21. Replace

`replace()` is used to replace old values with new values.

## Replace Single Value

```python
df["City"] = df["City"].replace("Delhi", "New Delhi")
print(df["City"])
```

## Replace Multiple Values

```python
df["Department"] = df["Department"].replace({
    "IT": "Information Technology",
    "HR": "Human Resources"
})
```

## Replace Missing Type Values

```python
df["City"] = df["City"].replace({None: "Unknown"})
```

## Map vs Replace

| `map()` | `replace()` |
|---|---|
| Used for value mapping | Used for replacing values |
| Unmapped values become NaN | Unmatched values stay same |
| Mostly Series transformation | Works for Series/DataFrame |

Example:

```python
s = pd.Series(["IT", "HR", "Finance"])

print(s.map({"IT": 1, "HR": 2}))
```

Output:

```text
0    1.0
1    2.0
2    NaN
dtype: float64
```

Because Finance was not mapped.

```python
print(s.replace({"IT": 1, "HR": 2}))
```

Output:

```text
0          1
1          2
2    Finance
dtype: object
```

Finance remains same.

## Interview Answer

`replace()` changes existing values, while `map()` transforms values based on mapping and may return NaN for unmapped values.

---

# 22. Complete Pandas Data Cleaning Example

```python
import pandas as pd

df = pd.DataFrame({
    "Emp_ID": [101, 102, 103, 104, 105, 106, 106],
    "Name": ["Aamir", "Rahul", "Priya", "Neha", "Aman", "Sara", "Sara"],
    "Department": ["IT", "HR", "IT", "Finance", "HR", "IT", "IT"],
    "City": ["Delhi", "Mumbai", "Delhi", "Patna", "Mumbai", None, None],
    "Salary": [50000, 45000, 60000, 55000, None, 70000, 70000],
    "Experience": [2, 3, 4, 5, 1, 6, 6]
})

# 1. Check missing values
print(df.isnull().sum())

# 2. Fill missing salary with mean
df["Salary"] = df["Salary"].fillna(df["Salary"].mean())

# 3. Fill missing city with mode
df["City"] = df["City"].fillna(df["City"].mode()[0])

# 4. Remove duplicate rows
df = df.drop_duplicates()

# 5. Create bonus column
df["Bonus"] = df["Salary"] * 0.10

# 6. Filter IT employees
it_df = df[df["Department"] == "IT"]

# 7. Group by department
summary = df.groupby("Department")["Salary"].mean()

print(df)
print(it_df)
print(summary)
```

---

# 23. Most Asked Pandas Interview Questions

## Q1. What is Pandas?

Pandas is a Python library used for data analysis, data cleaning, and data manipulation.

---

## Q2. What is Series?

A Series is a one-dimensional labeled data structure, like a single column.

---

## Q3. What is DataFrame?

A DataFrame is a two-dimensional table with rows and columns.

---

## Q4. Difference between Series and DataFrame?

| Series | DataFrame |
|---|---|
| 1D | 2D |
| Single column | Multiple rows and columns |
| Like list with index | Like Excel table |

---

## Q5. Difference between `loc` and `iloc`?

```text
loc  → label-based selection
iloc → position-based selection
```

---

## Q6. How do you handle missing values?

Using:

```python
df.isnull().sum()
df.dropna()
df.fillna()
```

---

## Q7. How do you remove duplicates?

```python
df.drop_duplicates()
```

---

## Q8. Difference between merge, join, and concat?

| Function | Use |
|---|---|
| `merge()` | Combine using common columns |
| `join()` | Combine using index |
| `concat()` | Stack DataFrames row-wise or column-wise |

---

## Q9. What is GroupBy?

GroupBy is used to group similar data and apply aggregation like sum, mean, count, min, and max.

---

## Q10. What is Pivot Table?

Pivot table summarizes data using rows, columns, values, and aggregation.

---

## Q11. What is Crosstab?

Crosstab creates a frequency table between categorical columns.

---

## Q12. Difference between apply, map, and replace?

| Function | Meaning |
|---|---|
| `apply()` | Apply custom function |
| `map()` | Map values using dictionary/function |
| `replace()` | Replace old values with new values |

---

# 24. Final Interview Summary

```text
Pandas is one of the most important libraries for Machine Learning preprocessing. I use Pandas to read CSV, Excel, and JSON files, create Series and DataFrames, select rows and columns, filter data, sort data, handle missing values, remove duplicates, merge datasets, join tables, concatenate data, perform GroupBy operations, create pivot tables and crosstabs, and transform values using apply, map, and replace.
```

This is a strong interview-ready answer:

```text
I am comfortable with Pandas because I can load datasets, clean missing values, remove duplicates, filter rows, select columns, group data, merge tables, and prepare data for Machine Learning models.
```
