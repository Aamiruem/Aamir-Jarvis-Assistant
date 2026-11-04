> **You asked:**
>
> Module 6: Probability
> Sample Space
> Event
> Conditional Probability
> Bayes Theorem
> Random Variable
> Probability Distribution
> Binomial Distribution
> Poisson Distribution
> Normal Distribution

# Phase 2: Mathematics for ML  
# Module 6: Probability for Machine Learning Interview

Probability means **chance of an event happening**.

In ML, probability is used in:

```text
Classification
Naive Bayes
Logistic Regression
Probability distribution
Uncertainty handling
Model confidence
Risk prediction
```

Basic formula:

```text
Probability = Favorable outcomes / Total outcomes
```

Example:

```text
Dice = {1, 2, 3, 4, 5, 6}

Probability of getting 2 = 1 / 6
```

---

# 1. Sample Space

## Easy Definition

Sample space means **all possible outcomes** of an experiment.

Experiment means any activity whose result is uncertain.

## Example 1: Coin Toss

```text
Experiment: Toss a coin

Sample Space = {H, T}
```

Where:

```text
H = Head
T = Tail
```

## Example 2: Dice Roll

```text
Experiment: Roll a dice

Sample Space = {1, 2, 3, 4, 5, 6}
```

## Python Code

```python
sample_space = [1, 2, 3, 4, 5, 6]

print("Sample Space:", sample_space)
print("Total Outcomes:", len(sample_space))
```

Output:

```text
Sample Space: [1, 2, 3, 4, 5, 6]
Total Outcomes: 6
```

## Interview Answer

Sample space is the set of all possible outcomes of a random experiment.

---

# 2. Event

## Easy Definition

Event means **specific outcome or group of outcomes** from sample space.

## Example

Rolling a dice:

```text
Sample Space = {1, 2, 3, 4, 5, 6}
```

Event A: Getting an even number

```text
A = {2, 4, 6}
```

Probability:

```text
P(A) = Number of favorable outcomes / Total outcomes
P(A) = 3 / 6
P(A) = 0.5
```

## Python Code

```python
sample_space = [1, 2, 3, 4, 5, 6]

event_even = [x for x in sample_space if x % 2 == 0]

probability_even = len(event_even) / len(sample_space)

print("Even Numbers:", event_even)
print("Probability of Even Number:", probability_even)
```

Output:

```text
Even Numbers: [2, 4, 6]
Probability of Even Number: 0.5
```

## Interview Answer

An event is a subset of sample space. It represents the outcome we are interested in.

---

# 3. Conditional Probability

## Easy Definition

Conditional probability means probability of one event happening **when another event has already happened**.

Simple meaning:

```text
Probability of A given B
```

Formula:

```text
P(A|B) = P(A ∩ B) / P(B)
```

Where:

```text
P(A|B) = Probability of A given B
P(A ∩ B) = Probability of both A and B
P(B) = Probability of B
```

genui{"probability_combinatorics_learning_block_staging":{"type_id":"CONDITIONAL_PROBABILITY_DEFINITION","locale_override":"en-US"}}

## Example

From numbers 1 to 10:

```text
Sample Space = {1,2,3,4,5,6,7,8,9,10}
```

Event A: Number is even

```text
A = {2,4,6,8,10}
```

Event B: Number is greater than 5

```text
B = {6,7,8,9,10}
```

A ∩ B means number is even and greater than 5:

```text
A ∩ B = {6,8,10}
```

Now:

```text
P(A|B) = P(A ∩ B) / P(B)
P(A|B) = 3/10 ÷ 5/10
P(A|B) = 3/5
P(A|B) = 0.6
```

## Python Code

```python
sample_space = list(range(1, 11))

A = [x for x in sample_space if x % 2 == 0]
B = [x for x in sample_space if x > 5]

A_intersection_B = [x for x in A if x in B]

conditional_probability = len(A_intersection_B) / len(B)

print("A Even:", A)
print("B Greater than 5:", B)
print("A intersection B:", A_intersection_B)
print("P(A|B):", conditional_probability)
```

Output:

```text
A Even: [2, 4, 6, 8, 10]
B Greater than 5: [6, 7, 8, 9, 10]
A intersection B: [6, 8, 10]
P(A|B): 0.6
```

## ML Use

Conditional probability is used in:

```text
Naive Bayes
Recommendation systems
Classification
Probability-based decision making
```

## Interview Answer

Conditional probability is the probability of event A happening given that event B has already happened.

---

# 4. Bayes Theorem

## Easy Definition

Bayes Theorem is used to update probability when new evidence is available.

Simple meaning:

```text
Old probability + new evidence = updated probability
```

Formula:

```text
P(A|B) = P(B|A) × P(A) / P(B)
```

Where:

```text
P(A|B) = Probability of A given B
P(B|A) = Probability of B given A
P(A) = Prior probability
P(B) = Evidence probability
```

genui{"probability_combinatorics_learning_block_staging":{"type_id":"BAYES_THEOREM","locale_override":"en-US"}}

## Example

Suppose:

```text
P(Disease) = 0.01
P(Positive Test | Disease) = 0.99
P(Positive Test) = 0.05
```

Find:

```text
P(Disease | Positive Test)
```

Formula:

```text
P(Disease | Positive Test)
= P(Positive Test | Disease) × P(Disease) / P(Positive Test)

= 0.99 × 0.01 / 0.05
= 0.0099 / 0.05
= 0.198
```

Answer:

```text
Probability = 19.8%
```

## Python Code

```python
p_disease = 0.01
p_positive_given_disease = 0.99
p_positive = 0.05

p_disease_given_positive = (
    p_positive_given_disease * p_disease
) / p_positive

print(p_disease_given_positive)
```

Output:

```text
0.198
```

## ML Use

Bayes theorem is used in:

```text
Naive Bayes classifier
Spam detection
Text classification
Medical prediction
Sentiment analysis
```

## Interview Answer

Bayes theorem is used to calculate the probability of a hypothesis based on prior probability and new evidence. It is the base of the Naive Bayes algorithm.

---

# 5. Random Variable

## Easy Definition

A random variable is a variable whose value depends on the outcome of a random experiment.

Simple meaning:

```text
Random outcome represented using a variable
```

## Example

Toss two coins.

Sample space:

```text
{HH, HT, TH, TT}
```

Let X = number of heads.

| Outcome | X |
|---|---:|
| HH | 2 |
| HT | 1 |
| TH | 1 |
| TT | 0 |

So:

```text
X can be 0, 1, or 2
```

## Types of Random Variables

| Type | Meaning | Example |
|---|---|---|
| Discrete Random Variable | Countable values | Number of heads, number of students |
| Continuous Random Variable | Infinite decimal values | Height, weight, salary, temperature |

## Python Code

```python
outcomes = ["HH", "HT", "TH", "TT"]

for outcome in outcomes:
    X = outcome.count("H")
    print(outcome, "=> Number of Heads:", X)
```

Output:

```text
HH => Number of Heads: 2
HT => Number of Heads: 1
TH => Number of Heads: 1
TT => Number of Heads: 0
```

## ML Use

Random variables are used to represent:

```text
Features
Target variables
Probability distributions
Model uncertainty
Prediction outcomes
```

## Interview Answer

A random variable is a numerical representation of outcomes of a random experiment.

---

# 6. Probability Distribution

## Easy Definition

Probability distribution shows probability of all possible values of a random variable.

Simple meaning:

```text
Which value can come and what is its probability?
```

## Example

Toss two coins.

Let X = number of heads.

| X | Outcomes | Probability |
|---:|---|---:|
| 0 | TT | 1/4 |
| 1 | HT, TH | 2/4 |
| 2 | HH | 1/4 |

So probability distribution is:

```text
P(X = 0) = 0.25
P(X = 1) = 0.50
P(X = 2) = 0.25
```

## Python Code

```python
from collections import Counter

outcomes = ["HH", "HT", "TH", "TT"]

values = [outcome.count("H") for outcome in outcomes]

count = Counter(values)

total = len(outcomes)

for x, c in count.items():
    print(f"P(X={x}) = {c}/{total} = {c/total}")
```

Output:

```text
P(X=2) = 1/4 = 0.25
P(X=1) = 2/4 = 0.5
P(X=0) = 1/4 = 0.25
```

## Types of Probability Distribution

| Distribution | Used For |
|---|---|
| Binomial | Success/failure experiments |
| Poisson | Count of events in fixed time/area |
| Normal | Bell-shaped continuous data |
| Uniform | Equal probability |
| Exponential | Waiting time |

## Interview Answer

Probability distribution describes how probabilities are distributed over values of a random variable.

---

# 7. Binomial Distribution

## Easy Definition

Binomial distribution is used when an experiment has only two outcomes:

```text
Success / Failure
Yes / No
Pass / Fail
Spam / Not Spam
```

## Conditions

Binomial distribution is used when:

```text
1. Fixed number of trials
2. Each trial has only two outcomes
3. Probability of success is same
4. Trials are independent
```

## Formula

```text
P(X = k) = nCk × p^k × (1 - p)^(n-k)
```

Where:

```text
n = total trials
k = number of successes
p = probability of success
1-p = probability of failure
```

genui{"probability_combinatorics_learning_block_staging":{"type_id":"BINOMIAL_DISTRIBUTION","locale_override":"en-US"}}

## Example

Toss a coin 3 times.

Find probability of exactly 2 heads.

```text
n = 3
k = 2
p = 0.5
```

Formula:

```text
P(X = 2) = 3C2 × (0.5)^2 × (0.5)^1
P(X = 2) = 3 × 0.25 × 0.5
P(X = 2) = 0.375
```

Answer:

```text
Probability = 37.5%
```

## Manual Python Code

```python
import math

n = 3
k = 2
p = 0.5

probability = math.comb(n, k) * (p ** k) * ((1 - p) ** (n - k))

print(probability)
```

Output:

```text
0.375
```

## Using SciPy

```python
from scipy.stats import binom

n = 3
p = 0.5

print(binom.pmf(2, n, p))
```

## ML Use

Binomial distribution is used in:

```text
Binary classification
Success/failure prediction
A/B testing
Click/no click prediction
Spam/not spam prediction
```

## Interview Answer

Binomial distribution gives the probability of getting exactly k successes in n independent trials where each trial has only two outcomes.

---

# 8. Poisson Distribution

## Easy Definition

Poisson distribution is used to count how many times an event happens in a fixed time, area, or interval.

Examples:

```text
Number of calls per hour
Number of customers per day
Number of accidents per month
Number of website visits per minute
```

## Formula

```text
P(X = k) = (e^-λ × λ^k) / k!
```

Where:

```text
λ = average number of events
k = actual number of events
e = 2.718
```

## Example

A website gets an average of 3 visits per minute.

Find probability of exactly 5 visits in one minute.

```text
λ = 3
k = 5
```

Formula:

```text
P(X = 5) = (e^-3 × 3^5) / 5!
```

Dry run:

```text
e^-3 = 0.0498
3^5 = 243
5! = 120

P(X = 5) = (0.0498 × 243) / 120
P(X = 5) = 12.1014 / 120
P(X = 5) = 0.1008
```

Answer:

```text
Probability ≈ 10.08%
```

## Manual Python Code

```python
import math

lam = 3
k = 5

probability = (math.exp(-lam) * (lam ** k)) / math.factorial(k)

print(probability)
```

Output:

```text
0.10081881344492448
```

## Using SciPy

```python
from scipy.stats import poisson

lam = 3

print(poisson.pmf(5, lam))
```

## ML Use

Poisson distribution is used in:

```text
Event count prediction
Traffic prediction
Customer arrival prediction
Call center forecasting
Risk modeling
```

## Interview Answer

Poisson distribution gives the probability of a certain number of events happening in a fixed interval when the average rate is known.

---

# 9. Normal Distribution

## Easy Definition

Normal distribution is a bell-shaped distribution.

Most values are near the mean, and fewer values are far from the mean.

Examples:

```text
Height
Weight
Exam marks
Measurement errors
Salary in some cases
```

## Shape

```text
Bell curve
Symmetric
Mean = Median = Mode
```

## Formula

```text
f(x) = 1 / (σ√2π) × e^(-(x-μ)² / 2σ²)
```

Where:

```text
μ = mean
σ = standard deviation
x = value
```

genui{"descriptive_statistics_sampling_learning_block_staging":{"type_id":"COMMON_NORMAL_INTERVALS","locale_override":"en-US"}}

## Empirical Rule

For normal distribution:

```text
About 68% data lies within mean ± 1 standard deviation
About 95% data lies within mean ± 2 standard deviations
About 99.7% data lies within mean ± 3 standard deviations
```

## Example

Suppose exam marks are normally distributed:

```text
Mean = 70
Standard Deviation = 10
```

Then:

```text
68% students have marks between 60 and 80
95% students have marks between 50 and 90
99.7% students have marks between 40 and 100
```

## Z-Score Formula

```text
z = (x - μ) / σ
```

Example:

```text
x = 80
mean = 70
std = 10

z = (80 - 70) / 10
z = 1
```

Meaning:

```text
80 is 1 standard deviation above mean.
```

## Python Code

```python
import numpy as np

data = [50, 60, 65, 70, 75, 80, 90]

mean = np.mean(data)
std = np.std(data)

x = 80
z_score = (x - mean) / std

print("Mean:", mean)
print("Standard Deviation:", std)
print("Z-score:", z_score)
```

## Using SciPy

```python
from scipy.stats import norm

mean = 70
std = 10

# Probability that marks are less than 80
probability = norm.cdf(80, mean, std)

print(probability)
```

## ML Use

Normal distribution is used in:

```text
Data distribution checking
Feature scaling
Z-score outlier detection
Gaussian Naive Bayes
Linear regression assumptions
Hypothesis testing
```

## Interview Answer

Normal distribution is a symmetric bell-shaped distribution where most values lie near the mean. In a normal distribution, mean, median, and mode are equal.

---

# 10. Complete Probability Python Practice Code

```python
import math
import numpy as np
from collections import Counter

# 1. Sample Space and Event
sample_space = [1, 2, 3, 4, 5, 6]
event_even = [x for x in sample_space if x % 2 == 0]

p_even = len(event_even) / len(sample_space)

print("P(Even):", p_even)

# 2. Conditional Probability
numbers = list(range(1, 11))

A = [x for x in numbers if x % 2 == 0]
B = [x for x in numbers if x > 5]

A_intersection_B = [x for x in A if x in B]

p_A_given_B = len(A_intersection_B) / len(B)

print("P(A|B):", p_A_given_B)

# 3. Bayes Theorem
p_disease = 0.01
p_positive_given_disease = 0.99
p_positive = 0.05

p_disease_given_positive = (
    p_positive_given_disease * p_disease
) / p_positive

print("P(Disease|Positive):", p_disease_given_positive)

# 4. Random Variable and Probability Distribution
outcomes = ["HH", "HT", "TH", "TT"]
X = [outcome.count("H") for outcome in outcomes]

count = Counter(X)
total = len(outcomes)

print("Probability Distribution:")
for value, freq in count.items():
    print(f"P(X={value}) = {freq / total}")

# 5. Binomial Distribution
n = 3
k = 2
p = 0.5

binomial_probability = math.comb(n, k) * (p ** k) * ((1 - p) ** (n - k))

print("Binomial Probability:", binomial_probability)

# 6. Poisson Distribution
lam = 3
k = 5

poisson_probability = (math.exp(-lam) * (lam ** k)) / math.factorial(k)

print("Poisson Probability:", poisson_probability)

# 7. Normal Distribution Z-score
x = 80
mean = 70
std = 10

z = (x - mean) / std

print("Z-score:", z)
```

---

# 11. Quick Revision Table

| Topic | Easy Meaning | Example |
|---|---|---|
| Sample Space | All possible outcomes | Dice: `{1,2,3,4,5,6}` |
| Event | Required outcome | Even number: `{2,4,6}` |
| Conditional Probability | Probability after condition | `P(A|B)` |
| Bayes Theorem | Updated probability with evidence | Naive Bayes |
| Random Variable | Numerical value of outcome | Number of heads |
| Probability Distribution | Probability of all values | `P(X=0), P(X=1)` |
| Binomial Distribution | Success/failure trials | Coin toss |
| Poisson Distribution | Count events in interval | Calls per hour |
| Normal Distribution | Bell-shaped data | Height, marks |

---

# 12. Most Asked Interview Questions

## Q1. What is probability?

Probability is the chance of an event happening.

```text
Probability = Favorable outcomes / Total outcomes
```

---

## Q2. What is sample space?

Sample space is the set of all possible outcomes of an experiment.

Example:

```text
Dice sample space = {1,2,3,4,5,6}
```

---

## Q3. What is an event?

An event is a subset of sample space.

Example:

```text
Getting even number on dice = {2,4,6}
```

---

## Q4. What is conditional probability?

Conditional probability is the probability of event A happening given that event B has already happened.

```text
P(A|B) = P(A ∩ B) / P(B)
```

---

## Q5. What is Bayes Theorem?

Bayes Theorem is used to calculate updated probability using prior probability and new evidence.

```text
P(A|B) = P(B|A) × P(A) / P(B)
```

---

## Q6. What is a random variable?

A random variable is a numerical value assigned to outcomes of a random experiment.

---

## Q7. Discrete vs Continuous Random Variable?

| Discrete | Continuous |
|---|---|
| Countable values | Infinite decimal values |
| Number of students | Height, weight |
| Number of calls | Temperature |

---

## Q8. What is probability distribution?

Probability distribution shows the probability of each possible value of a random variable.

---

## Q9. What is Binomial Distribution?

Binomial distribution gives the probability of getting exactly `k` successes in `n` independent trials.

Example:

```text
Coin toss, pass/fail, yes/no
```

---

## Q10. What is Poisson Distribution?

Poisson distribution gives the probability of a number of events happening in a fixed time or interval.

Example:

```text
Calls per hour, customers per day
```

---

## Q11. What is Normal Distribution?

Normal distribution is a bell-shaped symmetric distribution where mean, median, and mode are equal.

---

# Final Interview Summary

```text
Probability is very important in Machine Learning because it helps us handle uncertainty and prediction confidence.

I understand sample space, events, conditional probability, Bayes theorem, random variables, and probability distributions.

I also understand important distributions like Binomial Distribution for success/failure problems, Poisson Distribution for event count problems, and Normal Distribution for bell-shaped continuous data.

These concepts are used in Naive Bayes, Logistic Regression, Gaussian models, hypothesis testing, and classification problems.
```
