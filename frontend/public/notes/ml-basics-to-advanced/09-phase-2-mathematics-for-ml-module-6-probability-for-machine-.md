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

In Machine Learning, probability is used in:

```text
Classification
Naive Bayes
Logistic Regression
Model confidence
Risk prediction
Uncertainty handling
Probability distributions
```

Basic formula:

```text
Probability = Favorable Outcomes / Total Outcomes
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

Experiment means an activity whose result is uncertain.

## Example 1: Coin Toss

```text
Experiment: Toss a coin

Sample Space = {Head, Tail}
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

## ML Use

Sample space helps us understand all possible prediction outcomes.

Example:

```text
Spam Detection Sample Space = {Spam, Not Spam}
Disease Prediction Sample Space = {Disease, No Disease}
Loan Prediction Sample Space = {Approved, Rejected}
```

## Interview Answer

Sample space is the set of all possible outcomes of a random experiment.

---

# 2. Event

## Easy Definition

An event is a **specific outcome or group of outcomes** from the sample space.

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
P(A) = Favorable Outcomes / Total Outcomes

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

An event is a subset of the sample space. It represents the outcome we are interested in.

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
P(A ∩ B) = Probability of both A and B happening
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

P(A|B) = 3 / 5

P(A|B) = 0.6
```

## Dry Run

```text
Condition is B: number is greater than 5

So possible values are:
{6, 7, 8, 9, 10}

Among these, even numbers are:
{6, 8, 10}

So probability = 3 / 5 = 0.6
```

## Python Code

```python
sample_space = list(range(1, 11))

A = [x for x in sample_space if x % 2 == 0]
B = [x for x in sample_space if x > 5]

A_intersection_B = [x for x in A if x in B]

p_A_given_B = len(A_intersection_B) / len(B)

print("A Even:", A)
print("B Greater than 5:", B)
print("A intersection B:", A_intersection_B)
print("P(A|B):", p_A_given_B)
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
Fraud detection
Medical prediction
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

print("P(Disease | Positive Test):", p_disease_given_positive)
```

Output:

```text
P(Disease | Positive Test): 0.198
```

## ML Use

Bayes Theorem is used in:

```text
Naive Bayes Classifier
Spam detection
Text classification
Sentiment analysis
Medical diagnosis
```

## Interview Answer

Bayes Theorem calculates updated probability using prior probability and new evidence. It is the base of the Naive Bayes algorithm.

---

# 5. Random Variable

## Easy Definition

A random variable is a variable whose value depends on the outcome of a random experiment.

Simple meaning:

```text
Random outcome represented as a number
```

## Example

Toss two coins.

Sample space:

```text
{HH, HT, TH, TT}
```

Let:

```text
X = number of heads
```

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
| Discrete Random Variable | Countable values | Number of heads, number of calls |
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
Target variable
Prediction outcome
Probability distribution
Model uncertainty
```

Example:

```text
X = Study Hours
Y = Marks
```

## Interview Answer

A random variable is a numerical representation of the outcomes of a random experiment.

---

# 6. Probability Distribution

## Easy Definition

Probability distribution shows the probability of each possible value of a random variable.

Simple meaning:

```text
Which value can occur and what is its probability?
```

## Example

Toss two coins.

Let:

```text
X = number of heads
```

| X | Outcomes | Probability |
|---:|---|---:|
| 0 | TT | 1/4 |
| 1 | HT, TH | 2/4 |
| 2 | HH | 1/4 |

So:

```text
P(X = 0) = 0.25
P(X = 1) = 0.50
P(X = 2) = 0.25
```

## Python Code

```python
from collections import Counter

outcomes = ["HH", "HT", "TH", "TT"]

X = [outcome.count("H") for outcome in outcomes]

count = Counter(X)
total = len(outcomes)

for value, freq in count.items():
    print(f"P(X={value}) = {freq}/{total} = {freq/total}")
```

Output:

```text
P(X=2) = 1/4 = 0.25
P(X=1) = 2/4 = 0.5
P(X=0) = 1/4 = 0.25
```

## Expected Value

Expected value means average long-term value of a random variable.

Formula:

```text
E(X) = Σ xP(x)
```

genui{"probability_combinatorics_learning_block_staging":{"type_id":"EXPECTED_VALUE_WEIGHTED_AVERAGE","locale_override":"en-US"}}

For two coin tosses:

```text
E(X) = 0×0.25 + 1×0.50 + 2×0.25
E(X) = 0 + 0.50 + 0.50
E(X) = 1
```

Meaning:

```text
On average, we expect 1 head when tossing 2 coins.
```

## Types of Probability Distribution

| Distribution | Used For |
|---|---|
| Binomial Distribution | Success/failure trials |
| Poisson Distribution | Count of events in fixed interval |
| Normal Distribution | Bell-shaped continuous data |
| Uniform Distribution | Equal probability values |
| Exponential Distribution | Waiting time |

## Interview Answer

Probability distribution describes how probabilities are assigned to different values of a random variable.

---

# 7. Binomial Distribution

## Easy Definition

Binomial distribution is used when an experiment has only two outcomes.

Examples:

```text
Success / Failure
Yes / No
Pass / Fail
Spam / Not Spam
Clicked / Not Clicked
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

## Dry Run

All possible outcomes of 3 coin tosses:

```text
HHH, HHT, HTH, THH, HTT, THT, TTH, TTT
```

Exactly 2 heads:

```text
HHT, HTH, THH
```

So:

```text
Probability = 3 / 8 = 0.375
```

## Python Code

```python
import math

n = 3
k = 2
p = 0.5

probability = math.comb(n, k) * (p ** k) * ((1 - p) ** (n - k))

print("Binomial Probability:", probability)
```

Output:

```text
Binomial Probability: 0.375
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
A/B testing
Click prediction
Spam classification
Pass/fail prediction
```

## Interview Answer

Binomial distribution gives the probability of getting exactly k successes in n independent trials where each trial has two possible outcomes.

---

# 8. Poisson Distribution

## Easy Definition

Poisson distribution is used to count how many times an event happens in a fixed interval.

Examples:

```text
Number of calls per hour
Number of customers per day
Number of accidents per month
Number of website visits per minute
Number of defects per product batch
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

Find the probability of exactly 5 visits in one minute.

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
e^-3 ≈ 0.0498
3^5 = 243
5! = 120

P(X = 5) = (0.0498 × 243) / 120

P(X = 5) = 12.1014 / 120

P(X = 5) ≈ 0.1008
```

Answer:

```text
Probability ≈ 10.08%
```

## Python Code

```python
import math

lam = 3
k = 5

probability = (math.exp(-lam) * (lam ** k)) / math.factorial(k)

print("Poisson Probability:", probability)
```

Output:

```text
Poisson Probability: 0.10081881344492448
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
Demand forecasting
```

## Interview Answer

Poisson distribution gives the probability of a certain number of events occurring in a fixed interval when the average rate is known.

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
Some salary distributions
```

## Properties

```text
Bell-shaped curve
Symmetric distribution
Mean = Median = Mode
Total area under curve = 1
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
68% data lies within mean ± 1 standard deviation
95% data lies within mean ± 2 standard deviations
99.7% data lies within mean ± 3 standard deviations
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

## Z-Score

Z-score tells how far a value is from the mean in terms of standard deviation.

Formula:

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
80 is 1 standard deviation above the mean.
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
Feature distribution checking
Z-score outlier detection
Gaussian Naive Bayes
Linear regression assumptions
Hypothesis testing
Feature scaling
```

## Interview Answer

Normal distribution is a symmetric bell-shaped distribution where most values lie near the mean. In a normal distribution, mean, median, and mode are equal.

---

# Complete Probability Practice Code

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

# Expected Value
expected_value = sum(value * (freq / total) for value, freq in count.items())
print("Expected Value:", expected_value)

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

# Quick Revision Table

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

# Most Asked Interview Questions

## Q1. What is probability?

Probability is the chance of an event happening.

```text
Probability = Favorable Outcomes / Total Outcomes
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

An event is a subset of the sample space.

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

Bayes Theorem calculates updated probability using prior probability and new evidence.

```text
P(A|B) = P(B|A) × P(A) / P(B)
```

---

## Q6. What is a random variable?

A random variable is a numerical value assigned to the outcomes of a random experiment.

---

## Q7. Discrete vs Continuous Random Variable?

| Discrete | Continuous |
|---|---|
| Countable values | Infinite decimal values |
| Number of students | Height |
| Number of calls | Weight |
| Number of defects | Temperature |

---

## Q8. What is probability distribution?

Probability distribution shows the probability of each possible value of a random variable.

---

## Q9. What is Binomial Distribution?

Binomial distribution gives the probability of getting exactly `k` successes in `n` independent trials.

Example:

```text
Coin toss
Pass/fail
Spam/not spam
Click/not click
```

---

## Q10. What is Poisson Distribution?

Poisson distribution gives the probability of a number of events happening in a fixed interval.

Example:

```text
Calls per hour
Customers per day
Accidents per month
```

---

## Q11. Binomial vs Poisson Distribution?

| Binomial Distribution | Poisson Distribution |
|---|---|
| Fixed number of trials | Fixed time/area interval |
| Success/failure outcome | Count of events |
| Example: 10 coin tosses | Example: 10 calls per hour |
| Has parameters `n` and `p` | Has parameter `λ` |

---

## Q12. What is Normal Distribution?

Normal distribution is a bell-shaped symmetric distribution where mean, median, and mode are equal.

---

# Final Interview Summary

```text
Probability is very important in Machine Learning because it helps us handle uncertainty and prediction confidence.

I understand sample space, events, conditional probability, Bayes Theorem, random variables, and probability distributions.

I also understand important distributions like Binomial Distribution for success/failure problems, Poisson Distribution for event count problems, and Normal Distribution for bell-shaped continuous data.

These concepts are used in Naive Bayes, Logistic Regression, Gaussian models, hypothesis testing, and classification problems.
```
