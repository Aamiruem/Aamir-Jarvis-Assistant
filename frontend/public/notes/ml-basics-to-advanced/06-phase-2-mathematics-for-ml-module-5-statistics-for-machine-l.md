> **You asked:**
>
> Phase 2: Mathematics for ML
> Module 5: Statistics
> Mean
> Median
> Mode
> Variance
> Standard Deviation
> Range
> Quartiles
> Percentiles
> Skewness
> Kurtosis

I’ll continue in the same interview-notes format: simple meaning, formula, example, dry run, Python code, ML use, and interview answer for each statistics topic.

# Phase 2: Mathematics for ML  
# Module 5: Statistics for Machine Learning Interview

Statistics helps us understand data before applying Machine Learning.

In ML, statistics is used for:

```text
Data understanding
Outlier detection
Feature analysis
Data distribution checking
Model evaluation
Feature engineering
```

We will use this sample data:

```python
data = [10, 20, 30, 40, 50]
```

---

# 1. Mean

## Easy Definition

Mean means **average value**.

Simple meaning:

```text
Add all values and divide by total number of values.
```

## Formula

For population:

```text
Mean = Σx / N
```

For sample:

```text
x̄ = Σx / n
```

Where:

```text
Σx = sum of all values
N or n = total number of values
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"ARITHMETIC_MEAN","locale_override":"en-US"}}

## Example

```text
Data = [10, 20, 30, 40, 50]

Mean = (10 + 20 + 30 + 40 + 50) / 5
Mean = 150 / 5
Mean = 30
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50]

mean_value = np.mean(data)
print(mean_value)
```

Output:

```text
30.0
```

## ML Use

Mean is used in:

```text
Missing value handling
Feature scaling
Standard deviation
Variance
Data summary
```

Example:

```python
df["Salary"] = df["Salary"].fillna(df["Salary"].mean())
```

## Interview Answer

Mean is the average of all values. It is calculated by dividing the sum of values by the total number of values. Mean is sensitive to outliers.

---

# 2. Median

## Easy Definition

Median is the **middle value** after sorting the data.

## Example 1: Odd Number of Values

```text
Data = [10, 20, 30, 40, 50]

Middle value = 30

Median = 30
```

## Example 2: Even Number of Values

```text
Data = [10, 20, 30, 40]

Middle values = 20 and 30

Median = (20 + 30) / 2
Median = 25
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50]

median_value = np.median(data)
print(median_value)
```

Output:

```text
30.0
```

## Mean vs Median

Example with outlier:

```text
Data = [10, 20, 30, 40, 500]
```

Mean:

```text
Mean = 600 / 5 = 120
```

Median:

```text
Median = 30
```

Here, mean changed a lot because of outlier `500`, but median stayed stable.

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"MEAN_VS_MEDIAN","locale_override":"en-US"}}

## ML Use

Median is used when data has outliers.

Example:

```python
df["Salary"] = df["Salary"].fillna(df["Salary"].median())
```

## Interview Answer

Median is the middle value of sorted data. It is better than mean when data contains outliers.

---

# 3. Mode

## Easy Definition

Mode is the **most repeated value** in data.

## Example

```text
Data = [10, 20, 20, 30, 40]

Mode = 20
```

Because `20` appears most times.

## Python Code

```python
import pandas as pd

data = [10, 20, 20, 30, 40]

mode_value = pd.Series(data).mode()
print(mode_value)
```

Output:

```text
0    20
dtype: int64
```

## ML Use

Mode is mostly used for categorical missing values.

Example:

```python
df["City"] = df["City"].fillna(df["City"].mode()[0])
```

## Interview Answer

Mode is the most frequent value in a dataset. It is useful for categorical data like city, gender, department, or category.

---

# 4. Variance

## Easy Definition

Variance tells how much data is spread from the mean.

Simple meaning:

```text
If variance is high, data is widely spread.
If variance is low, data is close to mean.
```

## Formula

Population variance:

```text
σ² = Σ(x - μ)² / N
```

Sample variance:

```text
s² = Σ(x - x̄)² / (n - 1)
```

Where:

```text
x = each value
μ = population mean
x̄ = sample mean
N = population size
n = sample size
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"VARIANCE","locale_override":"en-US"}}

## Example

```text
Data = [10, 20, 30, 40, 50]
Mean = 30
```

Dry run:

| x | x - mean | Square |
|---:|---:|---:|
| 10 | -20 | 400 |
| 20 | -10 | 100 |
| 30 | 0 | 0 |
| 40 | 10 | 100 |
| 50 | 20 | 400 |

```text
Sum of squared difference = 400 + 100 + 0 + 100 + 400
Sum = 1000

Population Variance = 1000 / 5 = 200
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50]

population_variance = np.var(data)
sample_variance = np.var(data, ddof=1)

print("Population Variance:", population_variance)
print("Sample Variance:", sample_variance)
```

Output:

```text
Population Variance: 200.0
Sample Variance: 250.0
```

## Important Interview Point

```text
Population variance divides by N.
Sample variance divides by n - 1.
```

## ML Use

Variance is used in:

```text
Feature selection
PCA
Data spread analysis
Detecting low-variance columns
```

## Interview Answer

Variance measures how far data points are spread from the mean. Higher variance means more spread, and lower variance means values are close to the mean.

---

# 5. Standard Deviation

## Easy Definition

Standard deviation also tells spread of data, but it is easier to understand than variance because it is in the same unit as original data.

## Formula

Population standard deviation:

```text
σ = √Variance
```

Sample standard deviation:

```text
s = √Sample Variance
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"STANDARD_DEVIATION","locale_override":"en-US"}}

## Example

From previous example:

```text
Variance = 200

Standard Deviation = √200
Standard Deviation = 14.14
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50]

population_std = np.std(data)
sample_std = np.std(data, ddof=1)

print("Population STD:", population_std)
print("Sample STD:", sample_std)
```

Output:

```text
Population STD: 14.142135623730951
Sample STD: 15.811388300841896
```

## ML Use

Standard deviation is used in:

```text
Standardization
Z-score
Outlier detection
Data distribution analysis
```

Standardization formula:

```text
z = (x - mean) / standard deviation
```

## Interview Answer

Standard deviation measures how much values are spread around the mean. It is the square root of variance.

---

# 6. Range

## Easy Definition

Range is the difference between maximum and minimum value.

## Formula

```text
Range = Maximum value - Minimum value
```

## Example

```text
Data = [10, 20, 30, 40, 50]

Range = 50 - 10
Range = 40
```

## Python Code

```python
data = [10, 20, 30, 40, 50]

range_value = max(data) - min(data)
print(range_value)
```

Output:

```text
40
```

## ML Use

Range is used to quickly understand the spread of data.

But range is sensitive to outliers.

Example:

```text
[10, 20, 30, 40, 500]

Range = 500 - 10 = 490
```

## Interview Answer

Range is the difference between the highest and lowest value in the dataset. It gives a quick idea of spread but is affected by outliers.

---

# 7. Quartiles

## Easy Definition

Quartiles divide sorted data into 4 equal parts.

```text
Q1 = 25% value
Q2 = 50% value = Median
Q3 = 75% value
```

## Example

```text
Data = [10, 20, 30, 40, 50, 60, 70, 80]
```

Quartiles:

```text
Q1 = 25th percentile
Q2 = 50th percentile
Q3 = 75th percentile
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50, 60, 70, 80]

q1 = np.percentile(data, 25)
q2 = np.percentile(data, 50)
q3 = np.percentile(data, 75)

print("Q1:", q1)
print("Q2:", q2)
print("Q3:", q3)
```

Output:

```text
Q1: 27.5
Q2: 45.0
Q3: 62.5
```

## IQR Formula

```text
IQR = Q3 - Q1
```

Example:

```text
IQR = 62.5 - 27.5
IQR = 35
```

## Outlier Detection Formula

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

## Python Code for IQR

```python
import numpy as np

data = [10, 20, 30, 40, 50, 60, 70, 80, 200]

q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)

iqr = q3 - q1

lower_limit = q1 - 1.5 * iqr
upper_limit = q3 + 1.5 * iqr

print("Q1:", q1)
print("Q3:", q3)
print("IQR:", iqr)
print("Lower Limit:", lower_limit)
print("Upper Limit:", upper_limit)

outliers = [x for x in data if x < lower_limit or x > upper_limit]
print("Outliers:", outliers)
```

## ML Use

Quartiles and IQR are used for:

```text
Outlier detection
Boxplot analysis
Data distribution checking
Feature cleaning
```

## Interview Answer

Quartiles divide data into four equal parts. Q1 is 25%, Q2 is median, and Q3 is 75%. IQR is used to detect outliers.

---

# 8. Percentiles

## Easy Definition

Percentile tells below which percentage of data a value lies.

Example:

```text
90th percentile means 90% data is below that value.
```

## Formula Concept

```text
p-th percentile = value below which p% data lies
```

## Example

```text
If your score is at 90th percentile,
it means you scored better than 90% students.
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

p90 = np.percentile(data, 90)
p50 = np.percentile(data, 50)

print("90th Percentile:", p90)
print("50th Percentile:", p50)
```

Output:

```text
90th Percentile: 91.0
50th Percentile: 55.0
```

## Percentile vs Percentage

| Percentile | Percentage |
|---|---|
| Position-based | Score-based |
| Tells relative rank | Tells marks or value |
| Example: 90th percentile | Example: 90% marks |

## ML Use

Percentiles are used in:

```text
Outlier detection
Feature scaling
Data distribution understanding
Salary/score analysis
```

## Interview Answer

Percentile tells the position of a value in the dataset. For example, 90th percentile means 90% of values are below that value.

---

# 9. Skewness

## Easy Definition

Skewness tells whether data is symmetric or tilted to one side.

```text
Skewness = shape direction of distribution
```

## Types of Skewness

### A. Zero Skewness / Symmetric Data

```text
Mean = Median = Mode
```

Example:

```text
[10, 20, 30, 40, 50]
```

Shape:

```text
Balanced distribution
```

---

### B. Positive Skewness / Right Skewed

Tail is longer on the right side.

```text
Mean > Median > Mode
```

Example:

```text
[10, 20, 30, 40, 500]
```

Because `500` pulls mean to the right.

---

### C. Negative Skewness / Left Skewed

Tail is longer on the left side.

```text
Mean < Median < Mode
```

Example:

```text
[5, 100, 110, 120, 130]
```

Small value `5` pulls mean to the left.

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"SKEWNESS_DIRECTION","locale_override":"en-US"}}

## Python Code

```python
import pandas as pd

data = [10, 20, 30, 40, 500]

skewness = pd.Series(data).skew()
print(skewness)
```

## Interpretation

```text
Skewness = 0      → Symmetric
Skewness > 0      → Positive skew / Right skew
Skewness < 0      → Negative skew / Left skew
```

## ML Use

Skewness is important because many ML models perform better when data is normally distributed.

To reduce skewness, we can use:

```text
Log transformation
Square root transformation
Box-Cox transformation
```

Example:

```python
import numpy as np

df["Salary_log"] = np.log1p(df["Salary"])
```

## Interview Answer

Skewness measures the asymmetry of data distribution. Positive skew means the right tail is longer, and negative skew means the left tail is longer.

---

# 10. Kurtosis

## Easy Definition

Kurtosis tells how sharp or flat the distribution is.

Simple meaning:

```text
Kurtosis shows the tail heaviness and peak of distribution.
```

## Types of Kurtosis

### A. Mesokurtic

Normal-like distribution.

```text
Medium peak
Normal tail
```

Example:

```text
Normal distribution
```

---

### B. Leptokurtic

Sharp peak and heavy tails.

```text
More outliers
High peak
```

Meaning:

```text
Data has more extreme values.
```

---

### C. Platykurtic

Flat peak and light tails.

```text
Less extreme values
Flat distribution
```

## Python Code

```python
import pandas as pd

data = [10, 20, 30, 40, 500]

kurtosis = pd.Series(data).kurt()
print(kurtosis)
```

Important:

```text
In Pandas, kurt() gives excess kurtosis.
Normal distribution has kurtosis near 0.
```

## Interpretation

```text
Kurtosis > 0 → Leptokurtic, heavy tails, more outliers
Kurtosis = 0 → Mesokurtic, normal-like
Kurtosis < 0 → Platykurtic, flat distribution
```

## ML Use

Kurtosis is used to understand:

```text
Outliers
Extreme values
Distribution shape
Risk in data
```

## Interview Answer

Kurtosis measures the peakness and tail heaviness of a distribution. High kurtosis means more extreme values or outliers.

---

# Complete Python Code for All Statistics

```python
import numpy as np
import pandas as pd

data = [10, 20, 30, 40, 50]

series = pd.Series(data)

print("Data:", data)

print("Mean:", np.mean(data))
print("Median:", np.median(data))
print("Mode:", series.mode()[0])

print("Population Variance:", np.var(data))
print("Sample Variance:", np.var(data, ddof=1))

print("Population Standard Deviation:", np.std(data))
print("Sample Standard Deviation:", np.std(data, ddof=1))

print("Range:", max(data) - min(data))

print("Q1:", np.percentile(data, 25))
print("Q2:", np.percentile(data, 50))
print("Q3:", np.percentile(data, 75))

print("90th Percentile:", np.percentile(data, 90))

print("Skewness:", series.skew())
print("Kurtosis:", series.kurt())
```

---

# Complete Pandas Example for ML Dataset

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "Student": ["Aamir", "Rahul", "Priya", "Neha", "Aman"],
    "Marks": [50, 60, 70, 80, 100],
    "Study_Hours": [2, 3, 4, 5, 10]
})

print(df)

# Basic statistics
print("Mean Marks:", df["Marks"].mean())
print("Median Marks:", df["Marks"].median())
print("Mode Marks:", df["Marks"].mode()[0])

print("Variance:", df["Marks"].var())
print("Standard Deviation:", df["Marks"].std())
print("Range:", df["Marks"].max() - df["Marks"].min())

print("Q1:", df["Marks"].quantile(0.25))
print("Q2:", df["Marks"].quantile(0.50))
print("Q3:", df["Marks"].quantile(0.75))

print("90th Percentile:", df["Marks"].quantile(0.90))

print("Skewness:", df["Marks"].skew())
print("Kurtosis:", df["Marks"].kurt())
```

---

# Quick Revision Table

| Topic | Meaning | ML Use |
|---|---|---|
| Mean | Average | Missing value, scaling |
| Median | Middle value | Outlier-safe missing value |
| Mode | Most frequent value | Categorical missing value |
| Variance | Spread from mean | Feature spread |
| Standard Deviation | Average spread | Scaling, outlier detection |
| Range | Max - Min | Quick spread check |
| Quartiles | Divide data into 4 parts | Boxplot, IQR |
| Percentiles | Relative position | Outlier, ranking |
| Skewness | Data tilt | Distribution check |
| Kurtosis | Tail heaviness | Outlier/extreme value check |

---

# Most Asked Statistics Interview Questions

## Q1. Mean vs Median?

```text
Mean is average.
Median is middle value.

Mean is affected by outliers.
Median is not much affected by outliers.
```

Example:

```text
Data = [10, 20, 30, 40, 500]

Mean = 120
Median = 30
```

---

## Q2. Variance vs Standard Deviation?

```text
Variance is average squared distance from mean.
Standard deviation is square root of variance.
```

Standard deviation is easier to understand because it has the same unit as original data.

---

## Q3. Population Variance vs Sample Variance?

```text
Population variance divides by N.
Sample variance divides by n - 1.
```

Sample variance uses `n - 1` because sample data is only an estimate of population.

---

## Q4. What is IQR?

```text
IQR = Q3 - Q1
```

IQR shows the spread of middle 50% data and is used to detect outliers.

---

## Q5. How do you detect outliers using IQR?

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

Values outside this range are treated as outliers.

---

## Q6. What is skewness?

Skewness tells whether data is symmetric, right-skewed, or left-skewed.

```text
Skewness > 0 → Right skew
Skewness < 0 → Left skew
Skewness = 0 → Symmetric
```

---

## Q7. What is kurtosis?

Kurtosis tells whether data has heavy tails and extreme values.

```text
High kurtosis → more outliers
Low kurtosis → fewer outliers
```

---

# Final Interview Summary

```text
Statistics is very important in Machine Learning because it helps us understand data distribution, central tendency, spread, outliers, and feature behavior.

I use mean, median, and mode to understand central values. I use variance, standard deviation, and range to understand spread. I use quartiles, percentiles, and IQR for outlier detection. I use skewness and kurtosis to understand the shape of data distribution.
```
