> **You asked:**
>
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

I’ll cover this as ML interview notes with formulas, simple examples, dry runs, Python code, use cases, and short interview answers.

# Phase 2: Mathematics for ML  
# Module 5: Statistics for Machine Learning Interview

Statistics helps us understand data before applying ML models.

In ML, statistics is used for:

```text
Data understanding
Outlier detection
Feature distribution
Missing value handling
Feature scaling
Data preprocessing
Model evaluation
```

We will use this sample data:

```python
data = [10, 20, 30, 40, 50]
```

---

# 1. Mean

## Easy Definition

Mean means **average value**.

```text
Mean = Sum of all values / Total number of values
```

Formula:

```text
Mean = Σx / n
```

Example:

```text
Data = [10, 20, 30, 40, 50]

Mean = (10 + 20 + 30 + 40 + 50) / 5
Mean = 150 / 5
Mean = 30
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"ARITHMETIC_MEAN","locale_override":"en-US"}}

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50]

mean_value = np.mean(data)
print("Mean:", mean_value)
```

Output:

```text
Mean: 30.0
```

## ML Use

Mean is used for:

```text
Filling missing numerical values
Standardization
Data summary
Feature analysis
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

## Case 1: Odd Number of Values

```text
Data = [10, 20, 30, 40, 50]

Middle value = 30

Median = 30
```

## Case 2: Even Number of Values

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
print("Median:", median_value)
```

Output:

```text
Median: 30.0
```

## Mean vs Median with Outlier

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

Here, `500` increases the mean a lot, but median remains stable.

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"MEAN_VS_MEDIAN","locale_override":"en-US"}}

## ML Use

Median is useful when data contains outliers.

Example:

```python
df["Salary"] = df["Salary"].fillna(df["Salary"].median())
```

## Interview Answer

Median is the middle value of sorted data. It is better than mean when data has outliers.

---

# 3. Mode

## Easy Definition

Mode is the **most repeated value** in data.

Example:

```text
Data = [10, 20, 20, 30, 40]

Mode = 20
```

Because `20` appears most frequently.

## Python Code

```python
import pandas as pd

data = [10, 20, 20, 30, 40]

mode_value = pd.Series(data).mode()
print("Mode:", mode_value[0])
```

Output:

```text
Mode: 20
```

## ML Use

Mode is mainly used for categorical missing values.

Example:

```python
df["City"] = df["City"].fillna(df["City"].mode()[0])
```

## Interview Answer

Mode is the most frequent value in a dataset. It is useful for categorical columns like city, gender, department, and category.

---

# 4. Variance

## Easy Definition

Variance tells how much data is spread from the mean.

```text
Low variance  → values are close to mean
High variance → values are far from mean
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

Population Variance = 1000 / 5
Population Variance = 200
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
Feature spread checking
PCA
Feature selection
Low variance feature removal
```

## Interview Answer

Variance measures how far data points are spread from the mean. Higher variance means more spread, and lower variance means values are close to the mean.

---

# 5. Standard Deviation

## Easy Definition

Standard deviation tells how much values are spread from the mean.

It is the square root of variance.

## Formula

```text
Standard Deviation = √Variance
```

Population standard deviation:

```text
σ = √(Σ(x - μ)² / N)
```

Sample standard deviation:

```text
s = √(Σ(x - x̄)² / (n - 1))
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
Feature scaling
Normal distribution analysis
```

Standardization formula:

```text
z = (x - mean) / standard deviation
```

## Interview Answer

Standard deviation is the square root of variance. It measures how much data is spread around the mean.

---

# 6. Range

## Easy Definition

Range is the difference between the maximum and minimum value.

Formula:

```text
Range = Maximum value - Minimum value
```

Example:

```text
Data = [10, 20, 30, 40, 50]

Range = 50 - 10
Range = 40
```

## Python Code

```python
data = [10, 20, 30, 40, 50]

range_value = max(data) - min(data)

print("Range:", range_value)
```

Output:

```text
Range: 40
```

## Outlier Effect

```text
Data = [10, 20, 30, 40, 500]

Range = 500 - 10
Range = 490
```

So range is highly affected by outliers.

## ML Use

Range is used for:

```text
Quick spread checking
Min-max scaling
Outlier understanding
```

## Interview Answer

Range is the difference between the highest and lowest value. It gives a quick idea of data spread but is sensitive to outliers.

---

# 7. Quartiles

## Easy Definition

Quartiles divide sorted data into 4 equal parts.

```text
Q1 = 25th percentile
Q2 = 50th percentile = Median
Q3 = 75th percentile
```

Example:

```text
Data = [10, 20, 30, 40, 50, 60, 70, 80]
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

## IQR

IQR means Interquartile Range.

Formula:

```text
IQR = Q3 - Q1
```

Example:

```text
IQR = 62.5 - 27.5
IQR = 35
```

## Outlier Detection Using IQR

Formula:

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

Values outside this range are outliers.

## Python Code for Outlier Detection

```python
import numpy as np

data = [10, 20, 30, 40, 50, 60, 70, 80, 200]

q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)

iqr = q3 - q1

lower_limit = q1 - 1.5 * iqr
upper_limit = q3 + 1.5 * iqr

outliers = [x for x in data if x < lower_limit or x > upper_limit]

print("Q1:", q1)
print("Q3:", q3)
print("IQR:", iqr)
print("Lower Limit:", lower_limit)
print("Upper Limit:", upper_limit)
print("Outliers:", outliers)
```

## ML Use

Quartiles are used for:

```text
Box plot
Outlier detection
Data distribution analysis
Feature cleaning
```

## Interview Answer

Quartiles divide data into four equal parts. Q1 is 25%, Q2 is median, and Q3 is 75%. IQR is used to detect outliers.

---

# 8. Percentiles

## Easy Definition

Percentile tells the position of a value in the dataset.

```text
90th percentile means 90% of values are below that value.
```

Example:

```text
If your score is at 90th percentile,
you performed better than 90% students.
```

## Python Code

```python
import numpy as np

data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

p25 = np.percentile(data, 25)
p50 = np.percentile(data, 50)
p90 = np.percentile(data, 90)

print("25th Percentile:", p25)
print("50th Percentile:", p50)
print("90th Percentile:", p90)
```

Output:

```text
25th Percentile: 32.5
50th Percentile: 55.0
90th Percentile: 91.0
```

## Percentile vs Percentage

| Percentile | Percentage |
|---|---|
| Position/rank based | Score/value based |
| 90th percentile means better than 90% | 90% means 90 marks out of 100 |
| Used for ranking | Used for marks/accuracy |

## ML Use

Percentiles are used for:

```text
Outlier detection
Data binning
Feature scaling
Salary/score/rank analysis
```

## Interview Answer

Percentile shows the relative position of a value in data. For example, 90th percentile means 90% of data values are below that value.

---

# 9. Skewness

## Easy Definition

Skewness tells whether data is symmetric or tilted to one side.

```text
Skewness = shape direction of data distribution
```

## Types of Skewness

### A. Zero Skewness / Symmetric

```text
Mean = Median = Mode
```

Example:

```text
[10, 20, 30, 40, 50]
```

---

### B. Positive Skewness / Right Skewed

Right tail is longer.

```text
Mean > Median > Mode
```

Example:

```text
[10, 20, 30, 40, 500]
```

Here, `500` pulls the mean to the right.

---

### C. Negative Skewness / Left Skewed

Left tail is longer.

```text
Mean < Median < Mode
```

Example:

```text
[5, 100, 110, 120, 130]
```

Here, `5` pulls the mean to the left.

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"SKEWNESS_DIRECTION","locale_override":"en-US"}}

## Python Code

```python
import pandas as pd

data = [10, 20, 30, 40, 500]

skewness = pd.Series(data).skew()

print("Skewness:", skewness)
```

## Interpretation

```text
Skewness = 0  → Symmetric
Skewness > 0  → Positive skew / Right skew
Skewness < 0  → Negative skew / Left skew
```

## ML Use

Skewness is used for:

```text
Checking feature distribution
Detecting abnormal data shape
Applying log transformation
Improving ML model performance
```

Example transformation:

```python
import numpy as np

df["Salary_log"] = np.log1p(df["Salary"])
```

## Interview Answer

Skewness measures the asymmetry of data distribution. Positive skew means the right tail is longer, and negative skew means the left tail is longer.

---

# 10. Kurtosis

## Easy Definition

Kurtosis tells how sharp or flat the distribution is and how heavy the tails are.

Simple meaning:

```text
Kurtosis shows extreme values or outlier tendency.
```

## Types of Kurtosis

### A. Mesokurtic

Normal-like distribution.

```text
Medium peak
Normal tails
```

---

### B. Leptokurtic

Sharp peak and heavy tails.

```text
More extreme values
More outliers
High kurtosis
```

---

### C. Platykurtic

Flat peak and light tails.

```text
Fewer extreme values
Less outlier tendency
Low kurtosis
```

## Python Code

```python
import pandas as pd

data = [10, 20, 30, 40, 500]

kurtosis = pd.Series(data).kurt()

print("Kurtosis:", kurtosis)
```

## Important Point

In Pandas:

```text
kurt() gives excess kurtosis.
Normal distribution has kurtosis close to 0.
```

## Interpretation

```text
Kurtosis > 0 → Leptokurtic, heavy tails, more outliers
Kurtosis = 0 → Mesokurtic, normal-like
Kurtosis < 0 → Platykurtic, flat distribution
```

## ML Use

Kurtosis is used for:

```text
Outlier detection
Extreme value analysis
Distribution shape checking
Risk analysis
```

## Interview Answer

Kurtosis measures the peakness and tail heaviness of a distribution. High kurtosis means more extreme values or outliers.

---

# Complete Statistics Code for Practice

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
print("Q2 / Median:", np.percentile(data, 50))
print("Q3:", np.percentile(data, 75))

print("90th Percentile:", np.percentile(data, 90))

print("Skewness:", series.skew())
print("Kurtosis:", series.kurt())
```

---

# Pandas Dataset Example for ML

```python
import pandas as pd
import numpy as np

df = pd.DataFrame({
    "Student": ["Aamir", "Rahul", "Priya", "Neha", "Aman"],
    "Marks": [50, 60, 70, 80, 100],
    "Study_Hours": [2, 3, 4, 5, 10]
})

print(df)

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

| Topic | Easy Meaning | ML Use |
|---|---|---|
| Mean | Average value | Missing value, scaling |
| Median | Middle value | Outlier-safe missing value |
| Mode | Most frequent value | Categorical missing value |
| Variance | Spread from mean | Feature spread |
| Standard Deviation | Average spread | Scaling, outlier detection |
| Range | Max - Min | Quick spread check |
| Quartiles | Divide data into 4 parts | Boxplot, IQR |
| Percentiles | Relative position | Ranking, outliers |
| Skewness | Data tilt | Distribution check |
| Kurtosis | Tail heaviness | Extreme value check |

---

# Most Asked Interview Questions

## Q1. Mean vs Median?

```text
Mean is average.
Median is middle value.

Mean is affected by outliers.
Median is less affected by outliers.
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
Variance = average squared distance from mean.
Standard deviation = square root of variance.
```

Standard deviation is easier to understand because it is in the same unit as the original data.

---

## Q3. Population Variance vs Sample Variance?

```text
Population variance divides by N.
Sample variance divides by n - 1.
```

Sample variance uses `n - 1` because sample data estimates the population.

---

## Q4. What is IQR?

```text
IQR = Q3 - Q1
```

IQR shows the spread of the middle 50% of data.

---

## Q5. How do you detect outliers using IQR?

```text
Lower Limit = Q1 - 1.5 × IQR
Upper Limit = Q3 + 1.5 × IQR
```

Values outside this range are outliers.

---

## Q6. What is skewness?

Skewness tells whether data is symmetric or tilted.

```text
Skewness > 0 → Right skew
Skewness < 0 → Left skew
Skewness = 0 → Symmetric
```

---

## Q7. What is kurtosis?

Kurtosis tells how heavy the tails are and whether data contains extreme values.

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
