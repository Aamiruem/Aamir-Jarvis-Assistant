> **You asked:**
>
> all statics of ml explain with example with formula and explain formula parameter with name

I’ll organize the complete statistics syllabus for ML from basics to hypothesis testing, with every formula, symbol meaning, simple example, and Python code.

# Complete Statistics for Machine Learning  
## Concepts, Formulas, Formula Parameters, Examples and Python Code

Statistics helps us:

```text
Understand data
Find patterns
Measure variation
Test assumptions
Select features
Compare models
Make business decisions
```

---

# 1. Important Statistical Symbols

| Symbol | Name | Meaning |
|---|---|---|
| \(x_i\) | Individual observation | One value from data |
| \(N\) | Population size | Total observations in population |
| \(n\) | Sample size | Total observations in sample |
| \(\mu\) | Population mean | Average of population |
| \(\bar{x}\) | Sample mean | Average of sample |
| \(\sigma^2\) | Population variance | Population spread |
| \(s^2\) | Sample variance | Sample spread |
| \(\sigma\) | Population standard deviation | Population spread in original unit |
| \(s\) | Sample standard deviation | Sample spread in original unit |
| \(P(A)\) | Probability of A | Chance that event A happens |
| \(\alpha\) | Significance level | Probability limit for Type I error |
| \(\beta\) | Type II error probability | Probability of missing a real effect |
| \(H_0\) | Null hypothesis | No effect or no difference |
| \(H_1\) | Alternative hypothesis | Effect or difference exists |
| \(\rho\) | Population correlation | Population relationship |
| \(r\) | Sample correlation | Sample relationship |
| \(\hat{y}\) | Predicted value | Model prediction |
| \(y\) | Actual value | Real target value |

---

# Part 1: Types of Data

# 2. Population and Sample

## Population

Population means the complete group we want to study.

Example:

```text
All customers of a bank
All students in a university
All transactions in a company
```

## Sample

A sample is a smaller part selected from the population.

Example:

```text
1,000 customers selected from 1 million customers
```

## Why use a sample?

Studying the full population may be:

```text
Expensive
Slow
Difficult
Sometimes impossible
```

---

# 3. Types of Variables

## A. Numerical Data

Numerical values represent quantities.

### Discrete Data

Countable values.

```text
Number of customers
Number of products
Number of complaints
```

### Continuous Data

Can have decimal values.

```text
Salary
Height
Weight
Temperature
```

## B. Categorical Data

Categorical values represent groups.

### Nominal Data

Categories have no order.

```text
Gender
City
Department
Product category
```

### Ordinal Data

Categories have an order.

```text
Low, Medium, High
Poor, Average, Good, Excellent
```

---

# Part 2: Measures of Central Tendency

# 4. Arithmetic Mean

## Definition

Mean is the average of all values.

## Population Mean Formula

\[
\mu = \frac{\sum_{i=1}^{N}x_i}{N}
\]

### Formula Parameters

| Parameter | Name | Meaning |
|---|---|---|
| \(\mu\) | Population mean | Average of population |
| \(x_i\) | Observation | Each value |
| \(\sum\) | Summation | Add all values |
| \(N\) | Population size | Total values |

## Sample Mean Formula

\[
\bar{x} = \frac{\sum_{i=1}^{n}x_i}{n}
\]

| Parameter | Meaning |
|---|---|
| \(\bar{x}\) | Sample mean |
| \(x_i\) | Each sample value |
| \(n\) | Sample size |

## Example

Data:

```text
10, 20, 20, 30, 40
```

\[
\bar{x} = \frac{10+20+20+30+40}{5}
\]

\[
\bar{x} = \frac{120}{5}=24
\]

## Python

```python
import numpy as np

data = [10, 20, 20, 30, 40]

mean_value = np.mean(data)

print("Mean:", mean_value)
```

Output:

```text
Mean: 24.0
```

## Limitation

Mean is sensitive to outliers.

Example:

```text
Salary: 20,000, 25,000, 30,000, 35,000, 10,00,000
```

The large salary will pull the mean upward.

---

# 5. Median

## Definition

Median is the middle value after sorting the data.

## Odd Number of Values

Data:

```text
10, 20, 30, 40, 50
```

Middle value:

```text
30
```

## Even Number of Values

Data:

```text
10, 20, 30, 40
```

\[
Median = \frac{20+30}{2}=25
\]

## Position Formula

For odd-sized ordered data:

\[
Median\ Position = \frac{n+1}{2}
\]

| Parameter | Meaning |
|---|---|
| \(n\) | Number of observations |

## Python

```python
import numpy as np

data = [10, 20, 30, 40]

print("Median:", np.median(data))
```

## When Median is Better

Use median when data has:

```text
Outliers
Skewness
Extreme values
```

Example:

```text
Income data
House prices
Property prices
```

---

# 6. Mode

## Definition

Mode is the value that appears most frequently.

Example:

```text
10, 20, 20, 30, 40
```

Mode:

```text
20
```

## Python

```python
from statistics import mode

data = [10, 20, 20, 30, 40]

print("Mode:", mode(data))
```

## Use

Mode is useful for categorical data.

Example:

```text
Most common city
Most common product category
Most common payment method
```

---

# 7. Weighted Mean

## Definition

Weighted mean gives different importance to different values.

## Formula

\[
\bar{x}_w =
\frac{\sum_{i=1}^{n}w_ix_i}
{\sum_{i=1}^{n}w_i}
\]

### Formula Parameters

| Symbol | Name | Meaning |
|---|---|---|
| \(\bar{x}_w\) | Weighted mean | Weighted average |
| \(x_i\) | Value | Individual observation |
| \(w_i\) | Weight | Importance of observation |
| \(n\) | Number of observations | Total values |

## Example

| Exam | Marks | Weight |
|---|---:|---:|
| Test 1 | 80 | 20% |
| Test 2 | 90 | 30% |
| Final | 70 | 50% |

\[
Weighted\ Mean =
80(0.2)+90(0.3)+70(0.5)
\]

\[
=16+27+35=78
\]

## Python

```python
import numpy as np

marks = np.array([80, 90, 70])
weights = np.array([0.2, 0.3, 0.5])

weighted_mean = np.average(marks, weights=weights)

print(weighted_mean)
```

---

# 8. Geometric Mean

## Definition

Geometric mean is useful for growth rates, ratios and percentages.

## Formula

\[
GM = \left(\prod_{i=1}^{n}x_i\right)^{1/n}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(GM\) | Geometric mean |
| \(x_i\) | Each positive value |
| \(\prod\) | Multiply all values |
| \(n\) | Number of values |

## Example

Growth factors:

```text
1.10 and 1.20
```

\[
GM = \sqrt{1.10 \times 1.20}
\]

\[
GM = \sqrt{1.32}=1.1489
\]

Average growth:

```text
14.89%
```

## Python

```python
from scipy.stats import gmean

values = [1.10, 1.20]

print("Geometric Mean:", gmean(values))
```

---

# 9. Harmonic Mean

## Definition

Harmonic mean is useful for rates, speeds and ratios.

## Formula

\[
HM = \frac{n}{\sum_{i=1}^{n}\frac{1}{x_i}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(HM\) | Harmonic mean |
| \(n\) | Number of values |
| \(x_i\) | Each value |

## Example

A car travels equal distances at:

```text
60 km/h and 40 km/h
```

\[
HM = \frac{2}{\frac{1}{60}+\frac{1}{40}}
\]

\[
HM=48\ km/h
\]

## Python

```python
from scipy.stats import hmean

speeds = [60, 40]

print("Average Speed:", hmean(speeds))
```

---

# Part 3: Measures of Dispersion

# 10. Range

## Definition

Range measures the difference between maximum and minimum values.

## Formula

\[
Range = Maximum - Minimum
\]

## Example

```text
10, 20, 30, 40, 50
```

\[
Range=50-10=40
\]

## Python

```python
data = [10, 20, 30, 40, 50]

data_range = max(data) - min(data)

print(data_range)
```

## Limitation

Range uses only two values, so it is strongly affected by outliers.

---

# 11. Variance

Variance measures how far values are spread from the mean.

## Population Variance

\[
\sigma^2 =
\frac{\sum_{i=1}^{N}(x_i-\mu)^2}{N}
\]

### Parameters

| Symbol | Name | Meaning |
|---|---|---|
| \(\sigma^2\) | Population variance | Population spread |
| \(x_i\) | Observation | Each value |
| \(\mu\) | Population mean | Population average |
| \(N\) | Population size | Number of population values |

## Sample Variance

\[
s^2 =
\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(s^2\) | Sample variance |
| \(x_i\) | Each sample value |
| \(\bar{x}\) | Sample mean |
| \(n\) | Sample size |
| \(n-1\) | Degrees of freedom |

## Why \(n-1\)?

Using \(n-1\) corrects the tendency of a sample to underestimate population variance.

This is called:

```text
Bessel's correction
```

## Example

Data:

```text
2, 4, 6
```

Mean:

\[
\mu = 4
\]

Squared deviations:

\[
(2-4)^2=4
\]

\[
(4-4)^2=0
\]

\[
(6-4)^2=4
\]

Population variance:

\[
\sigma^2=\frac{4+0+4}{3}=2.67
\]

Sample variance:

\[
s^2=\frac{4+0+4}{2}=4
\]

## Python

```python
import numpy as np

data = [2, 4, 6]

population_variance = np.var(data)
sample_variance = np.var(data, ddof=1)

print("Population Variance:", population_variance)
print("Sample Variance:", sample_variance)
```

---

# 12. Standard Deviation

## Definition

Standard deviation is the square root of variance.

It measures spread in the original unit.

## Population Standard Deviation

\[
\sigma =
\sqrt{\frac{\sum_{i=1}^{N}(x_i-\mu)^2}{N}}
\]

## Sample Standard Deviation

\[
s =
\sqrt{\frac{\sum_{i=1}^{n}(x_i-\bar{x})^2}{n-1}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\sigma\) | Population standard deviation |
| \(s\) | Sample standard deviation |
| \(x_i\) | Individual value |
| \(\mu\) | Population mean |
| \(\bar{x}\) | Sample mean |
| \(N\) | Population size |
| \(n\) | Sample size |

## Interpretation

```text
Small standard deviation → Values are close to mean
Large standard deviation → Values are widely spread
```

## Python

```python
import numpy as np

data = [2, 4, 6]

print("Population SD:", np.std(data))
print("Sample SD:", np.std(data, ddof=1))
```

---

# 13. Mean Absolute Deviation

## Definition

Mean absolute deviation is the average absolute distance from the mean.

## Formula

\[
MAD =
\frac{1}{n}
\sum_{i=1}^{n}|x_i-\bar{x}|
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(MAD\) | Mean absolute deviation |
| \(x_i\) | Individual value |
| \(\bar{x}\) | Sample mean |
| \(n\) | Number of observations |
| \(|\ |\) | Absolute value |

## Python

```python
import numpy as np

data = np.array([2, 4, 6])
mean = np.mean(data)

mad = np.mean(np.abs(data - mean))

print(mad)
```

---

# 14. Quartiles and Interquartile Range

Quartiles divide ordered data into four parts.

| Quartile | Meaning |
|---|---|
| Q1 | 25th percentile |
| Q2 | 50th percentile or median |
| Q3 | 75th percentile |

## IQR Formula

\[
IQR = Q_3-Q_1
\]

## Outlier Boundaries

\[
Lower\ Bound=Q_1-1.5(IQR)
\]

\[
Upper\ Bound=Q_3+1.5(IQR)
\]

## Parameters

| Symbol | Meaning |
|---|---|
| \(Q_1\) | First quartile |
| \(Q_3\) | Third quartile |
| \(IQR\) | Interquartile range |

## Python

```python
import numpy as np

data = np.array([10, 12, 13, 15, 18, 20, 21, 22, 100])

q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)

iqr = q3 - q1

lower = q1 - 1.5 * iqr
upper = q3 + 1.5 * iqr

outliers = data[(data < lower) | (data > upper)]

print("Q1:", q1)
print("Q3:", q3)
print("IQR:", iqr)
print("Outliers:", outliers)
```

---

# 15. Coefficient of Variation

## Definition

Coefficient of variation compares the spread of datasets with different units or means.

## Formula

\[
CV = \frac{s}{\bar{x}}\times100
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(CV\) | Coefficient of variation |
| \(s\) | Standard deviation |
| \(\bar{x}\) | Mean |

## Example

Dataset A:

```text
Mean = 100
SD = 10
```

\[
CV_A=\frac{10}{100}\times100=10\%
\]

Dataset B:

```text
Mean = 20
SD = 5
```

\[
CV_B=\frac{5}{20}\times100=25\%
\]

Dataset B has more relative variation.

---

# Part 4: Position and Shape of Data

# 16. Percentile

## Definition

A percentile tells the percentage of observations below a value.

Example:

```text
A student at the 90th percentile scored better than approximately 90% of students.
```

## Approximate Position Formula

\[
Position=\frac{k}{100}(n+1)
\]

| Symbol | Meaning |
|---|---|
| \(k\) | Required percentile |
| \(n\) | Number of observations |

Different software may use slightly different interpolation methods.

## Python

```python
import numpy as np

data = [10, 20, 30, 40, 50]

print("90th percentile:", np.percentile(data, 90))
```

---

# 17. Z-Score

## Definition

Z-score tells how many standard deviations a value is from the mean.

## Formula

\[
z=\frac{x-\mu}{\sigma}
\]

### Parameters

| Symbol | Name | Meaning |
|---|---|---|
| \(z\) | Z-score | Standardized value |
| \(x\) | Observation | Original value |
| \(\mu\) | Mean | Population average |
| \(\sigma\) | Standard deviation | Population spread |

## Example

Suppose:

```text
Marks = 80
Mean = 70
Standard deviation = 5
```

\[
z=\frac{80-70}{5}=2
\]

Meaning:

```text
The score is 2 standard deviations above the mean.
```

## Python

```python
x = 80
mean = 70
std = 5

z_score = (x - mean) / std

print(z_score)
```

## ML Use

Z-score is used in:

```text
Standardization
Outlier detection
Normal distribution analysis
```

---

# 18. Skewness

## Definition

Skewness measures asymmetry in data distribution.

## Formula

\[
\gamma_1 =
E\left[
\left(\frac{X-\mu}{\sigma}\right)^3
\right]
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\gamma_1\) | Skewness coefficient |
| \(X\) | Random variable |
| \(\mu\) | Mean |
| \(\sigma\) | Standard deviation |
| \(E\) | Expected value |

## Interpretation

| Skewness | Meaning |
|---:|---|
| 0 | Symmetric distribution |
| Greater than 0 | Right-skewed |
| Less than 0 | Left-skewed |

## Right Skew

```text
Long tail on right
Mean > Median > Mode
```

Example:

```text
Income data
House prices
```

## Left Skew

```text
Long tail on left
Mean < Median < Mode
```

## Python

```python
import pandas as pd

data = pd.Series([10, 12, 14, 15, 17, 20, 100])

print("Skewness:", data.skew())
```

---

# 19. Kurtosis

## Definition

Kurtosis measures the heaviness of distribution tails.

## Formula

\[
\gamma_2 =
E\left[
\left(\frac{X-\mu}{\sigma}\right)^4
\right]
\]

## Excess Kurtosis

\[
Excess\ Kurtosis=\gamma_2-3
\]

The normal distribution has:

```text
Kurtosis = 3
Excess kurtosis = 0
```

## Interpretation

| Excess Kurtosis | Meaning |
|---:|---|
| 0 | Normal-like tails |
| Greater than 0 | Heavy tails, more extreme values |
| Less than 0 | Light tails, fewer extreme values |

## Python

```python
import pandas as pd

data = pd.Series([10, 12, 14, 15, 17, 20, 100])

print("Excess Kurtosis:", data.kurt())
```

---

# Part 5: Probability

# 20. Basic Probability

## Formula

\[
P(A)=
\frac{\text{Number of favourable outcomes}}
{\text{Total number of outcomes}}
\]

## Parameters

| Symbol | Meaning |
|---|---|
| \(P(A)\) | Probability of event A |
| \(A\) | Event |

## Example

Probability of rolling a 4 on a fair die:

\[
P(4)=\frac{1}{6}
\]

---

# 21. Complement Rule

\[
P(A^c)=1-P(A)
\]

| Symbol | Meaning |
|---|---|
| \(A^c\) | Event A does not happen |

Example:

\[
P(Not\ raining)=1-P(Raining)
\]

---

# 22. Addition Rule

## General Formula

\[
P(A\cup B)=P(A)+P(B)-P(A\cap B)
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(A\cup B\) | A or B occurs |
| \(A\cap B\) | A and B both occur |

## Mutually Exclusive Events

If A and B cannot happen together:

\[
P(A\cup B)=P(A)+P(B)
\]

---

# 23. Conditional Probability

Conditional probability means the probability of A when B has already happened.

## Formula

\[
P(A|B)=\frac{P(A\cap B)}{P(B)}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(P(A|B)\) | Probability of A given B |
| \(P(A\cap B)\) | Probability that A and B both occur |
| \(P(B)\) | Probability of B |

Example:

```text
Probability of loan default given that credit history is poor.
```

---

# 24. Independent Events

A and B are independent when one event does not affect the other.

## Formula

\[
P(A\cap B)=P(A)P(B)
\]

Example:

```text
Two independent coin flips
```

---

# 25. Bayes Theorem

Bayes theorem updates probability using new evidence.

genui{"probability_combinatorics_learning_block_staging":{"type_id":"BAYES_THEOREM"}}

## Formula

\[
P(A|B)=
\frac{P(B|A)P(A)}{P(B)}
\]

### Formula Parameters

| Symbol | Name | Meaning |
|---|---|---|
| \(P(A|B)\) | Posterior probability | Probability of A after seeing B |
| \(P(B|A)\) | Likelihood | Probability of B when A is true |
| \(P(A)\) | Prior probability | Initial probability of A |
| \(P(B)\) | Evidence | Total probability of B |

## Example

Suppose:

```text
Disease prevalence = 1%
Test sensitivity = 99%
False positive rate = 5%
```

We need:

```text
Probability of disease when test is positive
```

\[
P(Disease|Positive)
=
\frac{0.99\times0.01}
{(0.99\times0.01)+(0.05\times0.99)}
\]

\[
=
\frac{0.0099}{0.0594}
\approx0.1667
\]

Result:

```text
Approximately 16.67%
```

This example shows why base rates are important.

## ML Use

Bayes theorem is used in:

```text
Naive Bayes
Spam detection
Medical risk estimation
Probabilistic models
```

---

# Part 6: Random Variables

# 26. Random Variable

A random variable assigns a numerical value to the outcome of a random process.

## Discrete Random Variable

Has countable values.

Example:

```text
Number of purchases
Number of defects
```

## Continuous Random Variable

Can take any value in a range.

Example:

```text
Height
Weight
Temperature
```

---

# 27. PMF, PDF and CDF

## Probability Mass Function

Used for discrete variables.

\[
P(X=x)
\]

It gives the probability that \(X\) equals a specific value.

## Probability Density Function

Used for continuous variables.

\[
f(x)
\]

For continuous variables:

```text
Probability at one exact point is normally zero.
Probability is measured over an interval.
```

## Cumulative Distribution Function

\[
F(x)=P(X\leq x)
\]

It gives the probability that \(X\) is less than or equal to \(x\).

---

# 28. Expected Value

Expected value is the long-run average of a random variable.

## Discrete Formula

\[
E[X]=\sum_x xP(X=x)
\]

## Continuous Formula

\[
E[X]=\int_{-\infty}^{\infty}xf(x)\,dx
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(E[X]\) | Expected value |
| \(x\) | Possible value |
| \(P(X=x)\) | Probability of value |
| \(f(x)\) | Probability density |

## Example

Fair die:

\[
E[X]=
1\left(\frac16\right)+
2\left(\frac16\right)+\cdots+
6\left(\frac16\right)
\]

\[
E[X]=3.5
\]

---

# 29. Variance of Random Variable

## Formula

\[
Var(X)=E[(X-\mu)^2]
\]

Alternative formula:

\[
Var(X)=E[X^2]-[E(X)]^2
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(Var(X)\) | Variance of X |
| \(E[X]\) | Expected value |
| \(\mu\) | Mean of X |

---

# Part 7: Probability Distributions

# 30. Bernoulli Distribution

Bernoulli distribution represents one trial with two outcomes.

Examples:

```text
Success / Failure
Churn / Not churn
Fraud / Genuine
```

Parameter:

\[
p=P(X=1)
\]

\[
1-p=P(X=0)
\]

## Probability Formula

\[
P(X=x)=p^x(1-p)^{1-x}
\]

where:

```text
x can be 0 or 1
```

## Mean

\[
E[X]=p
\]

## Variance

\[
Var(X)=p(1-p)
\]

---

# 31. Binomial Distribution

Binomial distribution counts successes in \(n\) independent Bernoulli trials.

## Formula

\[
P(X=k)=
{n\choose k}
p^k(1-p)^{n-k}
\]

## Combination Formula

\[
{n\choose k}=
\frac{n!}{k!(n-k)!}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(n\) | Number of trials |
| \(k\) | Number of successes |
| \(p\) | Success probability |
| \(1-p\) | Failure probability |
| \(n!\) | Factorial of n |

## Mean

\[
E[X]=np
\]

## Variance

\[
Var(X)=np(1-p)
\]

## Example

10 customers each have a 60% probability of purchasing.

Probability exactly 6 purchase:

\[
P(X=6)=
{10\choose6}
(0.6)^6(0.4)^4
\]

Approximately:

```text
0.2508
```

## Python

```python
from scipy.stats import binom

probability = binom.pmf(k=6, n=10, p=0.6)

print(probability)
```

---

# 32. Poisson Distribution

Poisson distribution models the number of events in a fixed interval.

Examples:

```text
Customer calls per hour
Website errors per day
Transactions per minute
```

## Formula

\[
P(X=k)=
\frac{e^{-\lambda}\lambda^k}{k!}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(k\) | Number of events |
| \(\lambda\) | Average number of events |
| \(e\) | Euler's number, approximately 2.718 |
| \(k!\) | Factorial of k |

## Mean and Variance

\[
E[X]=\lambda
\]

\[
Var(X)=\lambda
\]

## Example

Average calls per hour:

```text
λ = 3
```

Probability of exactly 2 calls:

\[
P(X=2)=
\frac{e^{-3}3^2}{2!}
\]

Approximately:

```text
0.224
```

## Python

```python
from scipy.stats import poisson

print(poisson.pmf(k=2, mu=3))
```

---

# 33. Uniform Distribution

All values in an interval have equal density.

## Continuous Uniform PDF

\[
f(x)=\frac{1}{b-a}
\]

for:

\[
a\leq x\leq b
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(a\) | Minimum value |
| \(b\) | Maximum value |

## Mean

\[
E[X]=\frac{a+b}{2}
\]

## Variance

\[
Var(X)=\frac{(b-a)^2}{12}
\]

---

# 34. Normal Distribution

Normal distribution is a symmetric bell-shaped distribution.

## PDF Formula

\[
f(x)=
\frac{1}{\sigma\sqrt{2\pi}}
e^{-\frac{(x-\mu)^2}{2\sigma^2}}
\]

### Formula Parameters

| Symbol | Meaning |
|---|---|
| \(x\) | Observation |
| \(\mu\) | Mean |
| \(\sigma\) | Standard deviation |
| \(\pi\) | Approximately 3.14159 |
| \(e\) | Approximately 2.718 |

## Properties

```text
Mean = Median = Mode
Symmetric around mean
Total area under curve = 1
```

## Empirical Rule

| Interval | Approximate Data |
|---|---:|
| \(\mu \pm 1\sigma\) | 68% |
| \(\mu \pm 2\sigma\) | 95% |
| \(\mu \pm 3\sigma\) | 99.7% |

## ML Use

Normal distribution is useful in:

```text
Regression assumptions
Confidence intervals
Hypothesis testing
Z-score outlier detection
Gaussian Naive Bayes
```

---

# 35. Exponential Distribution

Exponential distribution models waiting time between Poisson events.

Examples:

```text
Time between customer calls
Time between website failures
Time between transactions
```

## Formula

\[
f(x)=\lambda e^{-\lambda x}
\]

for:

\[
x\geq0
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(x\) | Waiting time |
| \(\lambda\) | Event rate |

## Mean

\[
E[X]=\frac{1}{\lambda}
\]

## Variance

\[
Var(X)=\frac{1}{\lambda^2}
\]

---

# Part 8: Sampling and Estimation

# 36. Sampling Methods

| Sampling Method | Meaning |
|---|---|
| Simple Random Sampling | Every observation has equal chance |
| Stratified Sampling | Sample from every important group |
| Systematic Sampling | Select every kth observation |
| Cluster Sampling | Select complete groups |
| Convenience Sampling | Select easily available observations |

## Best for ML

Stratified sampling is useful when class distribution must be maintained.

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

---

# 37. Central Limit Theorem

## Definition

The Central Limit Theorem says that the distribution of sample means becomes approximately normal as sample size increases, even if the original population is not normal.

Conditions commonly considered:

```text
Samples should be independent
Sample size should be sufficiently large
No single observation should dominate
```

## Mean of Sampling Distribution

\[
E[\bar{X}]=\mu
\]

## Standard Error

\[
SE_{\bar{X}}=\frac{\sigma}{\sqrt{n}}
\]

If population standard deviation is unknown:

\[
SE_{\bar{X}}=\frac{s}{\sqrt{n}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(SE_{\bar{X}}\) | Standard error of mean |
| \(\sigma\) | Population standard deviation |
| \(s\) | Sample standard deviation |
| \(n\) | Sample size |

## Interpretation

As \(n\) increases:

```text
Standard error decreases
Sample mean becomes more stable
```

---

# 38. Standard Error of Proportion

## Formula

\[
SE_{\hat{p}}=
\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\hat{p}\) | Sample proportion |
| \(n\) | Sample size |

Example:

```text
100 purchases out of 1,000 users
```

\[
\hat{p}=\frac{100}{1000}=0.10
\]

\[
SE=
\sqrt{\frac{0.10(0.90)}{1000}}
\]

---

# Part 9: Confidence Intervals

# 39. Confidence Interval for Mean

A confidence interval gives a likely range for an unknown population parameter.

## Population SD Known

\[
CI=
\bar{x}\pm
z_{\alpha/2}
\frac{\sigma}{\sqrt{n}}
\]

## Population SD Unknown

\[
CI=
\bar{x}\pm
t_{\alpha/2,n-1}
\frac{s}{\sqrt{n}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\bar{x}\) | Sample mean |
| \(z_{\alpha/2}\) | Critical Z-value |
| \(t_{\alpha/2,n-1}\) | Critical t-value |
| \(\sigma\) | Population standard deviation |
| \(s\) | Sample standard deviation |
| \(n\) | Sample size |
| \(\alpha\) | Significance level |

## Common Critical Z-Values

| Confidence Level | Z-value |
|---:|---:|
| 90% | 1.645 |
| 95% | 1.96 |
| 99% | 2.576 |

## Example

Suppose:

```text
Sample mean = 50
Standard deviation = 10
Sample size = 100
95% confidence
```

\[
CI=
50\pm1.96\frac{10}{\sqrt{100}}
\]

\[
CI=50\pm1.96
\]

\[
CI=(48.04,\ 51.96)
\]

---

# 40. Confidence Interval for Proportion

## Formula

\[
CI=
\hat{p}
\pm
z_{\alpha/2}
\sqrt{
\frac{\hat{p}(1-\hat{p})}{n}
}
\]

Example:

```text
100 purchases from 1,000 visitors
p̂ = 0.10
```

This can estimate the likely population conversion rate.

---

# Part 10: Hypothesis Testing

# 41. Hypothesis Testing Basics

Hypothesis testing checks whether an observed effect is likely real or due to random chance.

## Null Hypothesis

\[
H_0
\]

Usually means:

```text
No effect
No difference
No relationship
```

## Alternative Hypothesis

\[
H_1
\]

Usually means:

```text
Effect exists
Difference exists
Relationship exists
```

## Example

```text
H0: New website design does not increase conversion.
H1: New website design increases conversion.
```

---

# 42. Significance Level

The significance level is written as:

\[
\alpha
\]

Common value:

\[
\alpha=0.05
\]

Meaning:

```text
We accept a 5% risk of rejecting H0 when H0 is actually true.
```

---

# 43. P-Value

The p-value measures how unusual the observed result would be if \(H_0\) were true.

Decision:

```text
If p-value < alpha → Reject H0
If p-value >= alpha → Fail to reject H0
```

Important:

```text
Failing to reject H0 does not prove H0 is true.
```

---

# 44. Type I and Type II Errors

| Reality / Decision | Reject H0 | Do not reject H0 |
|---|---|---|
| H0 is true | Type I error | Correct |
| H0 is false | Correct | Type II error |

## Type I Error

\[
P(Type\ I\ Error)=\alpha
\]

Example:

```text
Model says a genuine transaction is fraud.
```

## Type II Error

\[
P(Type\ II\ Error)=\beta
\]

Example:

```text
Model fails to detect an actual fraud.
```

## Statistical Power

\[
Power=1-\beta
\]

Power is the probability of detecting a real effect.

---

# 45. One-Tailed vs Two-Tailed Test

## One-Tailed

Tests a specific direction.

```text
New model accuracy is greater than old model accuracy.
```

## Two-Tailed

Tests any difference.

```text
New model accuracy is different from old model accuracy.
```

---

# Part 11: Z-Test and T-Test

# 46. One-Sample Z-Test

Used when:

```text
Population standard deviation is known
Sample size is large
```

## Formula

\[
z=
\frac{\bar{x}-\mu_0}
{\sigma/\sqrt{n}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(z\) | Z-test statistic |
| \(\bar{x}\) | Sample mean |
| \(\mu_0\) | Hypothesized population mean |
| \(\sigma\) | Population standard deviation |
| \(n\) | Sample size |

---

# 47. One-Sample T-Test

Used when population standard deviation is unknown.

## Formula

\[
t=
\frac{\bar{x}-\mu_0}
{s/\sqrt{n}}
\]

## Degrees of Freedom

\[
df=n-1
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(t\) | T-statistic |
| \(\bar{x}\) | Sample mean |
| \(\mu_0\) | Hypothesized mean |
| \(s\) | Sample standard deviation |
| \(n\) | Sample size |

## Example

Suppose:

```text
Sample mean = 53
Expected mean = 50
Sample SD = 4
Sample size = 16
```

\[
t=
\frac{53-50}{4/\sqrt{16}}
\]

\[
t=\frac{3}{1}=3
\]

Degrees of freedom:

\[
df=15
\]

## Python

```python
from scipy.stats import ttest_1samp

data = [50, 52, 55, 54, 53, 56, 51, 52]

t_statistic, p_value = ttest_1samp(data, popmean=50)

print("T-statistic:", t_statistic)
print("P-value:", p_value)
```

---

# 48. Independent Two-Sample T-Test

Used to compare means of two independent groups.

Example:

```text
Average purchase value of male and female customers
Average marks of two different classes
```

## Welch T-Test Formula

\[
t=
\frac{\bar{x}_1-\bar{x}_2}
{\sqrt{\frac{s_1^2}{n_1}+\frac{s_2^2}{n_2}}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\bar{x}_1,\bar{x}_2\) | Group means |
| \(s_1^2,s_2^2\) | Group variances |
| \(n_1,n_2\) | Group sizes |

## Python

```python
from scipy.stats import ttest_ind

group_a = [50, 52, 55, 57, 58]
group_b = [45, 47, 48, 50, 51]

t_stat, p_value = ttest_ind(
    group_a,
    group_b,
    equal_var=False
)

print(t_stat, p_value)
```

---

# 49. Paired T-Test

Used when observations are related.

Examples:

```text
Marks before and after training
Blood pressure before and after treatment
Conversion before and after a website change
```

## Difference

\[
d_i=Before_i-After_i
\]

## Formula

\[
t=
\frac{\bar{d}}
{s_d/\sqrt{n}}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\bar{d}\) | Mean difference |
| \(s_d\) | Standard deviation of differences |
| \(n\) | Number of pairs |

## Python

```python
from scipy.stats import ttest_rel

before = [60, 65, 70, 72, 68]
after = [65, 70, 75, 74, 73]

t_stat, p_value = ttest_rel(before, after)

print(t_stat, p_value)
```

---

# Part 12: Chi-Square Tests

# 50. Chi-Square Test of Independence

Used to check whether two categorical variables are related.

Example:

```text
Gender and product choice
City and churn
Payment mode and payment failure
```

## Formula

\[
\chi^2=
\sum
\frac{(O-E)^2}{E}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\chi^2\) | Chi-square statistic |
| \(O\) | Observed frequency |
| \(E\) | Expected frequency |

## Expected Frequency

\[
E=
\frac{
Row\ Total\times Column\ Total
}{
Grand\ Total
}
\]

## Degrees of Freedom

\[
df=(r-1)(c-1)
\]

| Symbol | Meaning |
|---|---|
| \(r\) | Number of rows |
| \(c\) | Number of columns |

## Python

```python
import pandas as pd
from scipy.stats import chi2_contingency

table = pd.DataFrame({
    "Churn": [30, 20],
    "Not_Churn": [70, 80]
}, index=["Male", "Female"])

chi2, p_value, dof, expected = chi2_contingency(table)

print("Chi-square:", chi2)
print("P-value:", p_value)
print("Degrees of freedom:", dof)
print("Expected frequencies:\n", expected)
```

---

# 51. Chi-Square Goodness-of-Fit Test

Checks whether observed category frequencies follow an expected distribution.

Example:

```text
Do customers choose four payment methods equally?
```

The same chi-square formula is used:

\[
\chi^2=
\sum\frac{(O-E)^2}{E}
\]

---

# Part 13: ANOVA

# 52. One-Way ANOVA

ANOVA compares means of three or more independent groups.

Example:

```text
Compare average salary across IT, HR and Finance
Compare sales across three marketing campaigns
```

## Hypotheses

```text
H0: All group means are equal.
H1: At least one group mean is different.
```

## F-Statistic

\[
F=
\frac{MS_{between}}{MS_{within}}
\]

## Between-Group Mean Square

\[
MS_{between}=
\frac{SS_{between}}{k-1}
\]

## Within-Group Mean Square

\[
MS_{within}=
\frac{SS_{within}}{N-k}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(F\) | ANOVA test statistic |
| \(SS_{between}\) | Variation between group means |
| \(SS_{within}\) | Variation inside groups |
| \(MS_{between}\) | Mean square between groups |
| \(MS_{within}\) | Mean square within groups |
| \(k\) | Number of groups |
| \(N\) | Total observations |

## Python

```python
from scipy.stats import f_oneway

it_salary = [50, 55, 60, 62, 65]
hr_salary = [42, 45, 47, 48, 50]
finance_salary = [55, 58, 60, 64, 68]

f_stat, p_value = f_oneway(
    it_salary,
    hr_salary,
    finance_salary
)

print("F-statistic:", f_stat)
print("P-value:", p_value)
```

## Important

ANOVA tells us that at least one group is different.

It does not directly tell us which groups are different.

For that, use:

```text
Tukey HSD post-hoc test
```

---

# Part 14: Covariance and Correlation

# 53. Covariance

Covariance shows whether two variables move together.

## Population Covariance

\[
Cov(X,Y)=
\frac{
\sum_{i=1}^{N}(x_i-\mu_X)(y_i-\mu_Y)
}{N}
\]

## Sample Covariance

\[
s_{XY}=
\frac{
\sum_{i=1}^{n}(x_i-\bar{x})(y_i-\bar{y})
}{n-1}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(x_i,y_i\) | Paired observations |
| \(\mu_X,\mu_Y\) | Population means |
| \(\bar{x},\bar{y}\) | Sample means |
| \(N\) | Population size |
| \(n\) | Sample size |

## Interpretation

| Covariance | Meaning |
|---:|---|
| Positive | Variables move in same direction |
| Negative | Variables move in opposite directions |
| Near zero | Weak linear movement |

## Limitation

Covariance depends on units, so its magnitude is difficult to compare.

---

# 54. Pearson Correlation

Pearson correlation measures linear relationship.

## Formula

\[
r=
\frac{
\sum (x_i-\bar{x})(y_i-\bar{y})
}{
\sqrt{
\sum(x_i-\bar{x})^2
\sum(y_i-\bar{y})^2
}
}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(r\) | Pearson correlation coefficient |
| \(x_i,y_i\) | Paired values |
| \(\bar{x},\bar{y}\) | Means |

## Range

\[
-1\leq r\leq1
\]

| Correlation | Meaning |
|---:|---|
| +1 | Perfect positive linear relationship |
| 0 | No linear relationship |
| -1 | Perfect negative linear relationship |

## Python

```python
from scipy.stats import pearsonr

hours = [1, 2, 3, 4, 5]
marks = [35, 45, 55, 65, 75]

correlation, p_value = pearsonr(hours, marks)

print("Correlation:", correlation)
print("P-value:", p_value)
```

## Important

Correlation does not prove causation.

---

# 55. Spearman Rank Correlation

Spearman correlation measures monotonic relationships using ranks.

## Formula Without Ties

\[
\rho=
1-
\frac{
6\sum d_i^2
}{
n(n^2-1)
}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\rho\) | Spearman rank correlation |
| \(d_i\) | Difference between ranks |
| \(n\) | Number of paired observations |

## When to Use

Use Spearman when:

```text
Data is ordinal
Relationship is monotonic but not linear
Outliers are present
Normality assumption is not satisfied
```

## Python

```python
from scipy.stats import spearmanr

x = [1, 2, 3, 4, 5]
y = [10, 20, 25, 50, 100]

rho, p_value = spearmanr(x, y)

print(rho, p_value)
```

---

# Part 15: Statistical Concepts in Regression

# 56. Simple Linear Regression

## Formula

\[
\hat{y}=\beta_0+\beta_1x
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(\hat{y}\) | Predicted target |
| \(\beta_0\) | Intercept |
| \(\beta_1\) | Slope coefficient |
| \(x\) | Input feature |

## Slope Formula

\[
\beta_1=
\frac{
\sum(x_i-\bar{x})(y_i-\bar{y})
}{
\sum(x_i-\bar{x})^2
}
\]

## Intercept Formula

\[
\beta_0=
\bar{y}-\beta_1\bar{x}
\]

## Interpretation

Suppose:

\[
Salary=20,000+8,000(Experience)
\]

Then:

```text
Intercept = ₹20,000
Slope = Salary increases by ₹8,000 for each extra year of experience.
```

---

# 57. Residual

## Formula

\[
e_i=y_i-\hat{y}_i
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(e_i\) | Residual |
| \(y_i\) | Actual value |
| \(\hat{y}_i\) | Predicted value |

Residual means prediction error for one observation.

---

# 58. SSE, MSE and RMSE

## Sum of Squared Errors

\[
SSE=
\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
\]

## Mean Squared Error

\[
MSE=
\frac{1}{n}
\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
\]

## Root Mean Squared Error

\[
RMSE=
\sqrt{
\frac{1}{n}
\sum_{i=1}^{n}(y_i-\hat{y}_i)^2
}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(y_i\) | Actual value |
| \(\hat{y}_i\) | Predicted value |
| \(n\) | Number of observations |

---

# 59. R-Squared

R-squared measures the proportion of target variation explained by the model.

## Formula

\[
R^2=
1-
\frac{SSE}{SST}
\]

Where:

\[
SST=
\sum(y_i-\bar{y})^2
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(R^2\) | Coefficient of determination |
| \(SSE\) | Unexplained variation |
| \(SST\) | Total variation |

## Interpretation

```text
R² = 0.80
```

Means:

```text
The model explains 80% of the variation in the target.
```

R² can be negative on test data when a model performs worse than simply predicting the mean.

---

# 60. Adjusted R-Squared

Adjusted R² penalizes adding unnecessary features.

## Formula

\[
Adjusted\ R^2=
1-
(1-R^2)
\frac{n-1}{n-p-1}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(R^2\) | Regular R-squared |
| \(n\) | Number of observations |
| \(p\) | Number of predictor features |

Use adjusted R² when comparing regression models with different numbers of features.

---

# 61. Logistic Regression Statistics

## Probability Formula

\[
p=
\frac{1}{1+e^{-z}}
\]

where:

\[
z=\beta_0+\beta_1x_1+\cdots+\beta_px_p
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(p\) | Predicted probability |
| \(e\) | Euler's number |
| \(z\) | Linear combination |
| \(\beta_0\) | Intercept |
| \(\beta_i\) | Feature coefficient |
| \(x_i\) | Feature value |

## Odds

\[
Odds=\frac{p}{1-p}
\]

If:

\[
p=0.8
\]

Then:

\[
Odds=\frac{0.8}{0.2}=4
\]

Meaning:

```text
The event is four times as likely to happen as not happen.
```

## Logit

\[
logit(p)=
\ln\left(\frac{p}{1-p}\right)
\]

Logistic regression models log-odds as a linear function of features.

---

# Part 16: Information Theory for ML

# 62. Entropy

Entropy measures impurity or uncertainty.

## Formula

\[
H(X)=
-\sum_{i=1}^{k}p_i\log_2(p_i)
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(H(X)\) | Entropy |
| \(p_i\) | Probability of class i |
| \(k\) | Number of classes |

## Example

Balanced classes:

```text
50% Yes, 50% No
```

\[
H=
-[0.5\log_2(0.5)+0.5\log_2(0.5)]
\]

\[
H=1
\]

This is high uncertainty.

Pure node:

```text
100% Yes
```

\[
H=0
\]

---

# 63. Information Gain

Information gain measures how much a split reduces entropy.

## Formula

\[
IG=
H(Parent)
-
\sum_j
\frac{N_j}{N}
H(Child_j)
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(IG\) | Information gain |
| \(H(Parent)\) | Parent entropy |
| \(H(Child_j)\) | Entropy of child j |
| \(N_j\) | Observations in child j |
| \(N\) | Total observations |

Used in decision trees.

---

# 64. Gini Impurity

## Formula

\[
Gini=
1-\sum_{i=1}^{k}p_i^2
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(p_i\) | Proportion of class i |
| \(k\) | Number of classes |

## Example

For 50%-50% classes:

\[
Gini=1-(0.5^2+0.5^2)
\]

\[
Gini=0.5
\]

For a pure node:

\[
Gini=0
\]

---

# 65. Cross-Entropy Loss

Used in classification.

## Binary Cross-Entropy

\[
L=
-\frac{1}{n}
\sum_{i=1}^{n}
[
y_i\log(p_i)
+
(1-y_i)\log(1-p_i)
]
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(L\) | Average loss |
| \(y_i\) | Actual class, 0 or 1 |
| \(p_i\) | Predicted probability of class 1 |
| \(n\) | Number of observations |

A confident wrong prediction receives a large penalty.

---

# 66. Kullback-Leibler Divergence

KL divergence measures the difference between two probability distributions.

## Formula

\[
D_{KL}(P\parallel Q)
=
\sum_x
P(x)
\log
\frac{P(x)}{Q(x)}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(P\) | True/reference distribution |
| \(Q\) | Estimated distribution |
| \(D_{KL}\) | Divergence from Q to P |

Important:

```text
KL divergence is not symmetric.
D_KL(P || Q) is generally not equal to D_KL(Q || P).
```

Used in:

```text
Variational autoencoders
Distribution comparison
Knowledge distillation
```

---

# Part 17: Multicollinearity

# 67. Variance Inflation Factor

VIF measures how strongly a feature is explained by other features.

## Formula

\[
VIF_j=
\frac{1}{1-R_j^2}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(VIF_j\) | VIF for feature j |
| \(R_j^2\) | R² when feature j is predicted using other features |

## Interpretation

| VIF | General Interpretation |
|---:|---|
| 1 | No multicollinearity |
| 1–5 | Moderate |
| Greater than 5 | Possible concern |
| Greater than 10 | Often considered serious |

These are practical guidelines, not absolute rules.

## Python

```python
import pandas as pd
from statsmodels.stats.outliers_influence import variance_inflation_factor

X = pd.DataFrame({
    "experience": [1, 2, 3, 4, 5],
    "age": [22, 24, 26, 28, 30],
    "score": [60, 65, 70, 75, 80]
})

vif = pd.DataFrame({
    "feature": X.columns,
    "VIF": [
        variance_inflation_factor(X.values, i)
        for i in range(X.shape[1])
    ]
})

print(vif)
```

---

# Part 18: A/B Testing

# 68. Conversion Rate

## Formula

\[
Conversion\ Rate=
\frac{Conversions}{Total\ Users}
\]

Example:

Group A:

\[
p_A=\frac{100}{1000}=0.10
\]

Group B:

\[
p_B=\frac{130}{1000}=0.13
\]

Difference:

\[
p_B-p_A=0.03
\]

This is:

```text
3 percentage points
```

Relative lift:

\[
Relative\ Lift=
\frac{p_B-p_A}{p_A}\times100
\]

\[
Relative\ Lift=
\frac{0.13-0.10}{0.10}\times100
=30\%
\]

---

# 69. Two-Proportion Z-Test

## Pooled Proportion

\[
\hat{p}=
\frac{x_A+x_B}{n_A+n_B}
\]

## Standard Error

\[
SE=
\sqrt{
\hat{p}(1-\hat{p})
\left(
\frac{1}{n_A}+\frac{1}{n_B}
\right)
}
\]

## Z-Statistic

\[
z=
\frac{\hat{p}_A-\hat{p}_B}{SE}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(x_A,x_B\) | Conversions in groups A and B |
| \(n_A,n_B\) | Users in groups A and B |
| \(\hat{p}_A,\hat{p}_B\) | Conversion rates |
| \(\hat{p}\) | Pooled conversion rate |
| \(SE\) | Standard error |

## Python

```python
from statsmodels.stats.proportion import proportions_ztest

conversions = [100, 130]
users = [1000, 1000]

z_stat, p_value = proportions_ztest(
    conversions,
    users
)

print("Z-statistic:", z_stat)
print("P-value:", p_value)
```

---

# Part 19: Effect Size

# 70. Cohen's d

Cohen's d measures the size of the difference between two means.

## Formula

\[
d=
\frac{\bar{x}_1-\bar{x}_2}{s_p}
\]

## Pooled Standard Deviation

\[
s_p=
\sqrt{
\frac{
(n_1-1)s_1^2+(n_2-1)s_2^2
}{
n_1+n_2-2
}
}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(d\) | Cohen's effect size |
| \(\bar{x}_1,\bar{x}_2\) | Group means |
| \(s_p\) | Pooled standard deviation |
| \(s_1,s_2\) | Group standard deviations |
| \(n_1,n_2\) | Group sizes |

## Common Interpretation

| Cohen's d | General Effect |
|---:|---|
| 0.2 | Small |
| 0.5 | Medium |
| 0.8 | Large |

A statistically significant effect may still be too small to matter in business. Effect size helps measure practical importance.

---

# Part 20: Resampling Methods

# 71. Bootstrap

Bootstrap estimates uncertainty by repeatedly sampling with replacement.

## Process

```text
1. Take a sample from original data with replacement.
2. Calculate the required statistic.
3. Repeat many times.
4. Study the distribution of the statistic.
```

## Python

```python
import numpy as np

data = np.array([10, 12, 15, 18, 20])

bootstrap_means = []

for _ in range(1000):
    sample = np.random.choice(
        data,
        size=len(data),
        replace=True
    )

    bootstrap_means.append(sample.mean())

lower = np.percentile(bootstrap_means, 2.5)
upper = np.percentile(bootstrap_means, 97.5)

print("Bootstrap 95% CI:", lower, upper)
```

---

# 72. Cross-Validation Statistics

K-fold cross-validation evaluates a model on multiple validation splits.

## Mean Cross-Validation Score

\[
\bar{s}=
\frac{1}{k}
\sum_{i=1}^{k}s_i
\]

## Standard Deviation of Scores

\[
SD_{CV}=
\sqrt{
\frac{
\sum_{i=1}^{k}(s_i-\bar{s})^2
}{k}
}
\]

### Parameters

| Symbol | Meaning |
|---|---|
| \(k\) | Number of folds |
| \(s_i\) | Score of fold i |
| \(\bar{s}\) | Average CV score |

## Python

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

X, y = load_iris(return_X_y=True)

model = RandomForestClassifier(random_state=42)

scores = cross_val_score(
    model,
    X,
    y,
    cv=5,
    scoring="accuracy"
)

print("Scores:", scores)
print("Mean:", scores.mean())
print("Standard Deviation:", scores.std())
```

---

# Part 21: Non-Parametric Tests

Non-parametric tests are useful when normality assumptions are not satisfied or data is ordinal.

# 73. Mann-Whitney U Test

Alternative to independent two-sample t-test.

```python
from scipy.stats import mannwhitneyu

group_a = [10, 12, 14, 16, 18]
group_b = [20, 22, 24, 26, 28]

statistic, p_value = mannwhitneyu(
    group_a,
    group_b,
    alternative="two-sided"
)

print(statistic, p_value)
```

---

# 74. Wilcoxon Signed-Rank Test

Alternative to paired t-test.

```python
from scipy.stats import wilcoxon

before = [60, 65, 70, 72, 68]
after = [65, 70, 75, 74, 73]

statistic, p_value = wilcoxon(before, after)

print(statistic, p_value)
```

---

# 75. Kruskal-Wallis Test

Alternative to one-way ANOVA.

```python
from scipy.stats import kruskal

group_1 = [10, 12, 14]
group_2 = [20, 22, 24]
group_3 = [30, 32, 34]

statistic, p_value = kruskal(
    group_1,
    group_2,
    group_3
)

print(statistic, p_value)
```

---

# Part 22: Statistics Used by ML Algorithms

| ML Algorithm | Important Statistics |
|---|---|
| Linear Regression | Mean, variance, covariance, residuals, R² |
| Logistic Regression | Probability, odds, log-odds, cross-entropy |
| KNN | Distance, normalization |
| Decision Tree | Entropy, information gain, Gini |
| Random Forest | Sampling, variance reduction |
| Naive Bayes | Conditional probability, Bayes theorem |
| SVM | Mean, variance, distance, margin |
| K-Means | Mean, Euclidean distance, within-cluster variance |
| PCA | Variance, covariance matrix, eigenvalues |
| Time Series | Mean, variance, autocorrelation, stationarity |
| Neural Networks | Probability, cross-entropy, distributions |
| A/B Testing | Proportion, hypothesis testing, confidence intervals |

---

# Complete Python Statistics Practice

```python
import numpy as np
import pandas as pd

from scipy import stats

data = np.array([10, 20, 20, 30, 40])

# Central tendency
print("Mean:", np.mean(data))
print("Median:", np.median(data))
print("Mode:", stats.mode(data, keepdims=True).mode[0])

# Dispersion
print("Population Variance:", np.var(data))
print("Sample Variance:", np.var(data, ddof=1))
print("Population SD:", np.std(data))
print("Sample SD:", np.std(data, ddof=1))
print("Range:", np.max(data) - np.min(data))

# Quartiles
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1

print("Q1:", q1)
print("Q3:", q3)
print("IQR:", iqr)

# Shape
series = pd.Series(data)

print("Skewness:", series.skew())
print("Kurtosis:", series.kurt())

# Z-scores
z_scores = stats.zscore(data)
print("Z-scores:", z_scores)

# One-sample t-test
t_stat, p_value = stats.ttest_1samp(data, popmean=20)

print("T-statistic:", t_stat)
print("P-value:", p_value)

# Confidence interval
confidence = 0.95
n = len(data)
mean = np.mean(data)
standard_error = stats.sem(data)

ci = stats.t.interval(
    confidence,
    df=n - 1,
    loc=mean,
    scale=standard_error
)

print("95% Confidence Interval:", ci)
```

---

# Most Asked Statistics Interview Questions

## 1. Mean vs Median

```text
Mean is the arithmetic average and is sensitive to outliers.
Median is the middle value and is more robust to outliers.
```

## 2. Variance vs Standard Deviation

```text
Variance is the average squared deviation from the mean.
Standard deviation is the square root of variance and is expressed in the original unit.
```

## 3. Population vs Sample

```text
Population contains the entire group.
A sample is a smaller part selected from that population.
```

## 4. Why use n−1 in sample variance?

```text
Using n−1 corrects the tendency of a sample to underestimate population variance. It is called Bessel's correction.
```

## 5. What is a p-value?

```text
A p-value measures how unusual the observed result would be if the null hypothesis were true.
```

## 6. What is confidence interval?

```text
A confidence interval provides a range of plausible values for an unknown population parameter.
```

## 7. Correlation vs Causation

```text
Correlation means variables move together. It does not prove that one variable causes the other.
```

## 8. Covariance vs Correlation

```text
Covariance shows direction of joint movement but depends on units. Correlation is standardized between −1 and +1.
```

## 9. Type I vs Type II Error

```text
Type I error rejects a true null hypothesis.
Type II error fails to reject a false null hypothesis.
```

## 10. When should median be used?

```text
Use median when data is skewed or contains extreme outliers.
```

---

# Final Interview Summary

```text
Statistics is the mathematical foundation of Machine Learning.

Measures of central tendency such as mean, median and mode describe the center of data. Measures like variance, standard deviation, range and IQR describe data spread.

Probability and distributions help model uncertainty. Bayes theorem is used to update probability based on new evidence and is the foundation of Naive Bayes.

Sampling, the Central Limit Theorem and standard error help estimate population parameters from samples.

Confidence intervals provide a range for unknown parameters, while hypothesis tests use p-values and significance levels to check whether an observed effect is statistically meaningful.

Correlation and covariance measure relationships between variables. Regression uses statistical concepts like coefficients, residuals, MSE, R² and adjusted R².

Decision trees use entropy, information gain and Gini impurity. Logistic regression uses probability, odds and log-odds.

For Machine Learning interviews, the most important topics are mean, median, variance, standard deviation, probability, normal distribution, sampling, CLT, confidence interval, hypothesis testing, p-value, t-test, chi-square test, ANOVA, correlation, regression statistics and A/B testing.
```
