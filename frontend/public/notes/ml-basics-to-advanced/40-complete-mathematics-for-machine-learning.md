> **You asked:**
>
> complete ml mathematics with example and code  and formula with parameter name

I’ll cover the mathematics in the order used by ML: linear algebra, calculus, probability, statistics, optimization, algorithm formulas, evaluation metrics, deep learning, and time series—with symbol meanings and executable Python examples.

# Complete Mathematics for Machine Learning  
## Formulas, Parameter Names, Examples and Python Code

Machine Learning mathematics mainly consists of:

```text
1. Basic Mathematics
2. Linear Algebra
3. Calculus
4. Probability
5. Statistics
6. Optimization
7. Regression Mathematics
8. Classification Mathematics
9. Clustering and PCA Mathematics
10. Evaluation Metrics
11. Deep Learning Mathematics
12. Time-Series Mathematics
```

Install the main libraries:

```bash
pip install numpy pandas scipy scikit-learn matplotlib
```

---

# Part 1: Basic Mathematical Concepts

# 1. Variables and Functions

A variable stores a value.

```text
x = input
y = output
```

A function maps an input to an output:

\[
y=f(x)
\]

Example:

\[
f(x)=2x+3
\]

For \(x=4\):

\[
f(4)=2(4)+3=11
\]

```python
def f(x):
    return 2 * x + 3

print(f(4))
```

Output:

```text
11
```

In ML:

```text
x = input features
f = machine-learning model
y = prediction
```

---

# 2. Summation

The summation symbol is:

\[
\sum
\]

Example:

\[
\sum_{i=1}^{4}x_i=x_1+x_2+x_3+x_4
\]

For:

\[
x=[10,20,30,40]
\]

\[
\sum x_i=100
\]

| Symbol | Name | Meaning |
|---|---|---|
| \(i\) | Index | Position of a value |
| \(x_i\) | Observation | Value at position \(i\) |
| \(n\) | Count | Total observations |
| \(\sum\) | Summation | Add all values |

```python
values = [10, 20, 30, 40]

print(sum(values))
```

---

# 3. Exponent and Logarithm

## Exponent

\[
a^b
\]

means multiplying \(a\), \(b\) times.

\[
2^3=2\times2\times2=8
\]

## Logarithm

\[
\log_b(x)=y
\]

means:

\[
b^y=x
\]

Example:

\[
\log_2(8)=3
\]

because:

\[
2^3=8
\]

## Natural Logarithm

Natural logarithm uses base \(e\):

\[
\ln(x)=\log_e(x)
\]

where:

\[
e\approx2.718
\]

Logs are used in:

```text
Logistic Regression
Cross-Entropy Loss
Entropy
Naive Bayes
Likelihood calculations
```

```python
import numpy as np

print(np.log2(8))
print(np.log(np.e))
```

---

# Part 2: Linear Algebra

Linear algebra is the foundation of datasets, neural networks, PCA, embeddings and regression.

# 4. Scalar

A scalar is one number.

Examples:

```text
5
3.14
-10
```

In ML:

```text
Learning rate = 0.01
Bias = 2
Loss = 0.45
```

---

# 5. Vector

A vector is an ordered collection of numbers.

\[
\mathbf{x}=
\begin{bmatrix}
x_1\\
x_2\\
x_3
\end{bmatrix}
\]

Example:

\[
\mathbf{x}=
\begin{bmatrix}
25\\
50000\\
3
\end{bmatrix}
\]

This may represent:

```text
Age = 25
Salary = 50,000
Experience = 3
```

```python
import numpy as np

x = np.array([25, 50000, 3])

print(x)
print("Shape:", x.shape)
```

---

# 6. Vector Addition

\[
\mathbf{a}+\mathbf{b}
=
\begin{bmatrix}
a_1+b_1\\
a_2+b_2
\end{bmatrix}
\]

Example:

\[
\begin{bmatrix}
1\\2
\end{bmatrix}
+
\begin{bmatrix}
3\\4
\end{bmatrix}
=
\begin{bmatrix}
4\\6
\end{bmatrix}
\]

```python
import numpy as np

a = np.array([1, 2])
b = np.array([3, 4])

print(a + b)
```

---

# 7. Scalar Multiplication

\[
c\mathbf{x}
=
\begin{bmatrix}
cx_1\\
cx_2
\end{bmatrix}
\]

Example:

\[
3
\begin{bmatrix}
2\\4
\end{bmatrix}
=
\begin{bmatrix}
6\\12
\end{bmatrix}
\]

```python
x = np.array([2, 4])

print(3 * x)
```

---

# 8. Dot Product

The dot product multiplies corresponding elements and adds them.

\[
\mathbf{a}\cdot\mathbf{b}
=
\sum_{i=1}^{n}a_ib_i
\]

For:

\[
\mathbf{a}=[1,2,3]
\]

\[
\mathbf{b}=[4,5,6]
\]

\[
\mathbf{a}\cdot\mathbf{b}
=1(4)+2(5)+3(6)
\]

\[
=4+10+18=32
\]

| Symbol | Meaning |
|---|---|
| \(a_i\) | Element \(i\) of vector \(a\) |
| \(b_i\) | Element \(i\) of vector \(b\) |
| \(n\) | Number of dimensions |

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(np.dot(a, b))
```

## ML Use

A linear model calculates:

\[
z=\mathbf{w}\cdot\mathbf{x}+b
\]

where:

| Symbol | Meaning |
|---|---|
| \(\mathbf{x}\) | Input vector |
| \(\mathbf{w}\) | Weight vector |
| \(b\) | Bias |
| \(z\) | Weighted output |

---

# 9. Vector Magnitude or Norm

## L2 Norm

\[
\|\mathbf{x}\|_2
=
\sqrt{x_1^2+x_2^2+\cdots+x_n^2}
\]

Example:

\[
\mathbf{x}=[3,4]
\]

\[
\|\mathbf{x}\|_2=\sqrt{3^2+4^2}=5
\]

```python
x = np.array([3, 4])

print(np.linalg.norm(x))
```

## L1 Norm

\[
\|\mathbf{x}\|_1=\sum_{i=1}^{n}|x_i|
\]

For:

\[
[-2,3,-4]
\]

\[
\|\mathbf{x}\|_1=2+3+4=9
\]

```python
x = np.array([-2, 3, -4])

print(np.linalg.norm(x, ord=1))
```

## ML Use

```text
L1 norm → Lasso regularization
L2 norm → Ridge regularization
```

---

# 10. Euclidean Distance

\[
d(\mathbf{x},\mathbf{y})
=
\sqrt{
\sum_{i=1}^{n}(x_i-y_i)^2
}
\]

Example:

\[
x=[1,2], \quad y=[4,6]
\]

\[
d=\sqrt{(1-4)^2+(2-6)^2}
\]

\[
d=\sqrt{9+16}=5
\]

| Symbol | Meaning |
|---|---|
| \(d\) | Distance |
| \(x_i\) | Feature \(i\) of first point |
| \(y_i\) | Feature \(i\) of second point |

```python
import numpy as np

x = np.array([1, 2])
y = np.array([4, 6])

distance = np.linalg.norm(x - y)

print(distance)
```

Used in:

```text
KNN
K-Means
Clustering
Recommendation systems
```

---

# 11. Manhattan Distance

\[
d(\mathbf{x},\mathbf{y})
=
\sum_{i=1}^{n}|x_i-y_i|
\]

For:

\[
x=[1,2], \quad y=[4,6]
\]

\[
d=|1-4|+|2-6|=3+4=7
\]

```python
distance = np.sum(np.abs(x - y))

print(distance)
```

---

# 12. Cosine Similarity

Cosine similarity measures the angle between two vectors.

\[
\cos(\theta)
=
\frac{
\mathbf{a}\cdot\mathbf{b}
}{
\|\mathbf{a}\|\|\mathbf{b}\|
}
\]

| Symbol | Meaning |
|---|---|
| \(\theta\) | Angle between vectors |
| \(\mathbf{a}\cdot\mathbf{b}\) | Dot product |
| \(\|\mathbf{a}\|\) | Magnitude of vector \(a\) |
| \(\|\mathbf{b}\|\) | Magnitude of vector \(b\) |

Range:

\[
-1\leq\cos(\theta)\leq1
\]

```text
1  = Same direction
0  = Unrelated/perpendicular
-1 = Opposite direction
```

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([2, 4, 6])

similarity = np.dot(a, b) / (
    np.linalg.norm(a) * np.linalg.norm(b)
)

print(similarity)
```

Used in:

```text
Recommendation systems
Text similarity
Document search
RAG
Embeddings
```

---

# 13. Matrix

A matrix is a table of numbers.

\[
X=
\begin{bmatrix}
x_{11}&x_{12}\\
x_{21}&x_{22}\\
x_{31}&x_{32}
\end{bmatrix}
\]

In ML:

```text
Rows = observations
Columns = features
```

```python
X = np.array([
    [20, 30000],
    [25, 50000],
    [30, 70000]
])

print(X)
print("Shape:", X.shape)
```

Shape:

```text
3 rows × 2 columns
```

---

# 14. Matrix Multiplication

For:

\[
A_{m\times n}
\]

and:

\[
B_{n\times p}
\]

the output is:

\[
C_{m\times p}=AB
\]

Each output element is:

\[
c_{ij}=
\sum_{k=1}^{n}a_{ik}b_{kj}
\]

Example:

\[
A=
\begin{bmatrix}
1&2\\
3&4
\end{bmatrix}
\]

\[
B=
\begin{bmatrix}
5&6\\
7&8
\end{bmatrix}
\]

\[
AB=
\begin{bmatrix}
19&22\\
43&50
\end{bmatrix}
\]

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

print(A @ B)
```

---

# 15. Matrix Transpose

Transpose changes rows into columns.

\[
A^T
\]

If:

\[
A=
\begin{bmatrix}
1&2&3\\
4&5&6
\end{bmatrix}
\]

Then:

\[
A^T=
\begin{bmatrix}
1&4\\
2&5\\
3&6
\end{bmatrix}
\]

```python
A = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

print(A.T)
```

---

# 16. Identity Matrix

An identity matrix contains 1 on the diagonal and 0 elsewhere.

\[
I=
\begin{bmatrix}
1&0\\
0&1
\end{bmatrix}
\]

Property:

\[
AI=A
\]

```python
I = np.eye(3)

print(I)
```

---

# 17. Determinant

For a \(2\times2\) matrix:

\[
A=
\begin{bmatrix}
a&b\\
c&d
\end{bmatrix}
\]

\[
\det(A)=ad-bc
\]

Example:

\[
A=
\begin{bmatrix}
2&3\\
1&4
\end{bmatrix}
\]

\[
\det(A)=2(4)-3(1)=5
\]

```python
A = np.array([[2, 3], [1, 4]])

print(np.linalg.det(A))
```

If:

\[
\det(A)=0
\]

the matrix has no regular inverse.

---

# 18. Matrix Inverse

The inverse satisfies:

\[
AA^{-1}=I
\]

For a \(2\times2\) matrix:

\[
A^{-1}
=
\frac{1}{ad-bc}
\begin{bmatrix}
d&-b\\
-c&a
\end{bmatrix}
\]

```python
A = np.array([[2, 1], [1, 3]])

A_inverse = np.linalg.inv(A)

print(A_inverse)
print(A @ A_inverse)
```

Used in the theoretical normal equation for linear regression.

---

# 19. Rank of a Matrix

Rank is the number of linearly independent rows or columns.

```python
A = np.array([
    [1, 2],
    [2, 4]
])

print(np.linalg.matrix_rank(A))
```

Output:

```text
1
```

The second row is a multiple of the first.

---

# 20. Eigenvalues and Eigenvectors

An eigenvector keeps its direction after matrix transformation.

\[
A\mathbf{v}=\lambda\mathbf{v}
\]

| Symbol | Meaning |
|---|---|
| \(A\) | Matrix transformation |
| \(\mathbf{v}\) | Eigenvector |
| \(\lambda\) | Eigenvalue |

```python
A = np.array([
    [2, 0],
    [0, 3]
])

eigenvalues, eigenvectors = np.linalg.eig(A)

print("Eigenvalues:", eigenvalues)
print("Eigenvectors:\n", eigenvectors)
```

Used in:

```text
PCA
Spectral clustering
Covariance analysis
```

---

# 21. Singular Value Decomposition

SVD decomposes a matrix as:

\[
A=U\Sigma V^T
\]

| Symbol | Meaning |
|---|---|
| \(A\) | Original matrix |
| \(U\) | Left singular vectors |
| \(\Sigma\) | Singular values |
| \(V^T\) | Transposed right singular vectors |

```python
A = np.array([
    [1, 2],
    [3, 4],
    [5, 6]
])

U, S, VT = np.linalg.svd(A)

print("U:\n", U)
print("Singular values:", S)
print("V transpose:\n", VT)
```

Used in:

```text
Dimensionality reduction
Recommendation systems
Image compression
Latent semantic analysis
```

---

# Part 3: Calculus

Calculus helps ML models learn by changing parameters to reduce error.

# 22. Derivative

A derivative measures the rate of change.

\[
f'(x)=
\lim_{h\to0}
\frac{f(x+h)-f(x)}{h}
\]

If:

\[
f(x)=x^2
\]

Then:

\[
f'(x)=2x
\]

At \(x=3\):

\[
f'(3)=6
\]

```python
def derivative_x_squared(x):
    return 2 * x

print(derivative_x_squared(3))
```

---

# 23. Common Derivative Rules

## Power Rule

\[
\frac{d}{dx}x^n=nx^{n-1}
\]

## Constant Rule

\[
\frac{d}{dx}c=0
\]

## Sum Rule

\[
\frac{d}{dx}[f(x)+g(x)]
=
f'(x)+g'(x)
\]

## Product Rule

\[
\frac{d}{dx}[f(x)g(x)]
=
f'(x)g(x)+f(x)g'(x)
\]

## Quotient Rule

\[
\frac{d}{dx}
\frac{f(x)}{g(x)}
=
\frac{
f'(x)g(x)-f(x)g'(x)
}{
[g(x)]^2
}
\]

---

# 24. Partial Derivative

A partial derivative measures change with respect to one variable while keeping others constant.

Suppose:

\[
f(x,y)=x^2+3xy+y^2
\]

With respect to \(x\):

\[
\frac{\partial f}{\partial x}=2x+3y
\]

With respect to \(y\):

\[
\frac{\partial f}{\partial y}=3x+2y
\]

```python
def partial_x(x, y):
    return 2 * x + 3 * y

def partial_y(x, y):
    return 3 * x + 2 * y

print(partial_x(2, 3))
print(partial_y(2, 3))
```

---

# 25. Gradient

A gradient contains all partial derivatives.

\[
\nabla f=
\begin{bmatrix}
\frac{\partial f}{\partial x_1}\\
\frac{\partial f}{\partial x_2}\\
\vdots\\
\frac{\partial f}{\partial x_n}
\end{bmatrix}
\]

For:

\[
f(x,y)=x^2+y^2
\]

\[
\nabla f=
\begin{bmatrix}
2x\\
2y
\end{bmatrix}
\]

At \((3,4)\):

\[
\nabla f=
\begin{bmatrix}
6\\8
\end{bmatrix}
\]

```python
import numpy as np

def gradient(x, y):
    return np.array([2 * x, 2 * y])

print(gradient(3, 4))
```

The gradient points toward the steepest increase. Negative gradient points toward the steepest decrease.

---

# 26. Chain Rule

The chain rule is important for neural-network backpropagation.

If:

\[
y=f(u)
\]

and:

\[
u=g(x)
\]

then:

\[
\frac{dy}{dx}
=
\frac{dy}{du}
\frac{du}{dx}
\]

Example:

\[
y=(3x+2)^2
\]

Let:

\[
u=3x+2
\]

\[
y=u^2
\]

Then:

\[
\frac{dy}{du}=2u
\]

\[
\frac{du}{dx}=3
\]

Therefore:

\[
\frac{dy}{dx}=2(3x+2)(3)
\]

\[
=6(3x+2)
\]

---

# 27. Jacobian Matrix

The Jacobian contains first derivatives of multiple outputs with respect to multiple inputs.

For:

\[
\mathbf{f}(x,y)=
\begin{bmatrix}
f_1(x,y)\\
f_2(x,y)
\end{bmatrix}
\]

\[
J=
\begin{bmatrix}
\frac{\partial f_1}{\partial x}&
\frac{\partial f_1}{\partial y}\\
\frac{\partial f_2}{\partial x}&
\frac{\partial f_2}{\partial y}
\end{bmatrix}
\]

Used in:

```text
Neural networks
Multivariable optimization
Vector-valued functions
```

---

# 28. Hessian Matrix

The Hessian contains second-order partial derivatives.

\[
H=
\begin{bmatrix}
\frac{\partial^2f}{\partial x_1^2}
&
\frac{\partial^2f}{\partial x_1\partial x_2}
\\
\frac{\partial^2f}{\partial x_2\partial x_1}
&
\frac{\partial^2f}{\partial x_2^2}
\end{bmatrix}
\]

Used in:

```text
Newton's optimization method
Checking curvature
Finding minima and maxima
```

---

# Part 4: Probability

# 29. Basic Probability

\[
P(A)=
\frac{
\text{Favourable outcomes}
}{
\text{Total outcomes}
}
\]

Example: probability of rolling 4 on a fair die:

\[
P(4)=\frac16
\]

---

# 30. Complement Rule

\[
P(A^c)=1-P(A)
\]

If:

\[
P(Fraud)=0.02
\]

Then:

\[
P(Not\ Fraud)=1-0.02=0.98
\]

---

# 31. Union of Events

\[
P(A\cup B)
=
P(A)+P(B)-P(A\cap B)
\]

| Symbol | Meaning |
|---|---|
| \(A\cup B\) | A or B occurs |
| \(A\cap B\) | A and B both occur |

---

# 32. Conditional Probability

\[
P(A|B)=
\frac{P(A\cap B)}{P(B)}
\]

| Symbol | Meaning |
|---|---|
| \(P(A|B)\) | Probability of A given B |
| \(P(A\cap B)\) | Probability of A and B |
| \(P(B)\) | Probability of B |

Example:

```text
Probability of churn given monthly contract.
```

---

# 33. Independent Events

For independent events:

\[
P(A\cap B)=P(A)P(B)
\]

Example: getting heads twice:

\[
P(H_1\cap H_2)
=
\frac12\times\frac12
=
\frac14
\]

---

# 34. Bayes Theorem

\[
P(A|B)=
\frac{
P(B|A)P(A)
}{
P(B)
}
\]

| Parameter | Name | Meaning |
|---|---|---|
| \(P(A|B)\) | Posterior | Updated probability |
| \(P(B|A)\) | Likelihood | Probability of evidence when A is true |
| \(P(A)\) | Prior | Initial probability |
| \(P(B)\) | Evidence | Total probability of evidence |

Used in Naive Bayes and medical probability.

---

# 35. Expected Value

For a discrete random variable:

\[
E[X]=
\sum_x xP(X=x)
\]

| Symbol | Meaning |
|---|---|
| \(E[X]\) | Expected value |
| \(x\) | Possible outcome |
| \(P(X=x)\) | Probability of the outcome |

Example for a fair die:

\[
E[X]
=
1\left(\frac16\right)+\cdots+
6\left(\frac16\right)
=3.5
\]

---

# 36. Variance of Random Variable

\[
Var(X)=E[(X-\mu)^2]
\]

Alternative:

\[
Var(X)=E[X^2]-[E(X)]^2
\]

---

# 37. Bernoulli Distribution

One trial with two outcomes:

```text
1 = Success
0 = Failure
```

\[
P(X=x)=p^x(1-p)^{1-x}
\]

where \(x\in\{0,1\}\).

Mean:

\[
E[X]=p
\]

Variance:

\[
Var(X)=p(1-p)
\]

Used in:

```text
Churn prediction
Fraud prediction
Binary classification
```

---

# 38. Binomial Distribution

Counts successes in \(n\) independent Bernoulli trials.

\[
P(X=k)
=
{n\choose k}
p^k(1-p)^{n-k}
\]

\[
{n\choose k}
=
\frac{n!}{k!(n-k)!}
\]

| Symbol | Meaning |
|---|---|
| \(n\) | Number of trials |
| \(k\) | Number of successes |
| \(p\) | Probability of success |
| \(1-p\) | Probability of failure |

```python
from scipy.stats import binom

probability = binom.pmf(k=6, n=10, p=0.6)

print(probability)
```

---

# 39. Normal Distribution

\[
f(x)=
\frac{1}{\sigma\sqrt{2\pi}}
e^{
-\frac{(x-\mu)^2}{2\sigma^2}
}
\]

| Symbol | Meaning |
|---|---|
| \(x\) | Observation |
| \(\mu\) | Mean |
| \(\sigma\) | Standard deviation |
| \(\pi\) | 3.14159 |
| \(e\) | 2.718 |

Properties:

```text
Mean = Median = Mode
Symmetric distribution
Total area = 1
```

Empirical rule:

```text
68% within μ ± 1σ
95% within μ ± 2σ
99.7% within μ ± 3σ
```

---

# Part 5: Statistics

# 40. Mean

Population mean:

\[
\mu=
\frac{1}{N}
\sum_{i=1}^{N}x_i
\]

Sample mean:

\[
\bar{x}=
\frac{1}{n}
\sum_{i=1}^{n}x_i
\]

| Symbol | Meaning |
|---|---|
| \(\mu\) | Population mean |
| \(\bar{x}\) | Sample mean |
| \(x_i\) | Observation |
| \(N\) | Population size |
| \(n\) | Sample size |

```python
import numpy as np

data = [10, 20, 30, 40, 50]

print(np.mean(data))
```

---

# 41. Variance

Population variance:

\[
\sigma^2=
\frac{
\sum_{i=1}^{N}(x_i-\mu)^2
}{N}
\]

Sample variance:

\[
s^2=
\frac{
\sum_{i=1}^{n}(x_i-\bar{x})^2
}{n-1}
\]

| Symbol | Meaning |
|---|---|
| \(\sigma^2\) | Population variance |
| \(s^2\) | Sample variance |
| \(n-1\) | Degrees-of-freedom correction |

```python
data = np.array([10, 20, 30, 40, 50])

print("Population variance:", np.var(data))
print("Sample variance:", np.var(data, ddof=1))
```

---

# 42. Standard Deviation

\[
\sigma=
\sqrt{\sigma^2}
\]

or:

\[
s=\sqrt{s^2}
\]

```python
print("Population SD:", np.std(data))
print("Sample SD:", np.std(data, ddof=1))
```

---

# 43. Covariance

\[
Cov(X,Y)
=
\frac{
\sum_{i=1}^{n}
(x_i-\bar{x})(y_i-\bar{y})
}{
n-1
}
\]

Interpretation:

```text
Positive covariance → move together
Negative covariance → move oppositely
Near zero → weak linear co-movement
```

```python
x = np.array([1, 2, 3, 4, 5])
y = np.array([10, 20, 30, 40, 50])

print(np.cov(x, y))
```

---

# 44. Pearson Correlation

\[
r=
\frac{
\sum(x_i-\bar{x})(y_i-\bar{y})
}{
\sqrt{
\sum(x_i-\bar{x})^2
\sum(y_i-\bar{y})^2
}
}
\]

Range:

\[
-1\leq r\leq1
\]

```python
print(np.corrcoef(x, y)[0, 1])
```

Important:

```text
Correlation does not prove causation.
```

---

# 45. Z-Score

\[
z=
\frac{x-\mu}{\sigma}
\]

| Symbol | Meaning |
|---|---|
| \(z\) | Standardized score |
| \(x\) | Original value |
| \(\mu\) | Mean |
| \(\sigma\) | Standard deviation |

Example:

\[
x=80,\quad \mu=70,\quad \sigma=5
\]

\[
z=\frac{80-70}{5}=2
\]

The value is two standard deviations above the mean.

---

# 46. Standard Error

\[
SE=
\frac{s}{\sqrt{n}}
\]

| Symbol | Meaning |
|---|---|
| \(SE\) | Standard error |
| \(s\) | Sample standard deviation |
| \(n\) | Sample size |

Standard error measures uncertainty in a sample estimate.

---

# 47. Confidence Interval

When population standard deviation is unknown:

\[
CI=
\bar{x}
\pm
t_{\alpha/2,n-1}
\frac{s}{\sqrt{n}}
\]

| Symbol | Meaning |
|---|---|
| \(\bar{x}\) | Sample mean |
| \(t_{\alpha/2,n-1}\) | Critical t-value |
| \(s\) | Sample SD |
| \(n\) | Sample size |
| \(\alpha\) | Significance level |

---

# 48. Hypothesis Testing

Null hypothesis:

\[
H_0
\]

Alternative hypothesis:

\[
H_1
\]

Decision:

```text
p-value < α  → Reject H₀
p-value ≥ α → Fail to reject H₀
```

Common:

\[
\alpha=0.05
\]

---

# 49. T-Test

One-sample t-test:

\[
t=
\frac{
\bar{x}-\mu_0
}{
s/\sqrt{n}
}
\]

| Symbol | Meaning |
|---|---|
| \(t\) | Test statistic |
| \(\bar{x}\) | Sample mean |
| \(\mu_0\) | Hypothesized mean |
| \(s\) | Sample standard deviation |
| \(n\) | Sample size |

```python
from scipy.stats import ttest_1samp

sample = [48, 50, 52, 55, 51, 53]

t_stat, p_value = ttest_1samp(sample, popmean=50)

print("T-statistic:", t_stat)
print("P-value:", p_value)
```

---

# Part 6: Optimization

# 50. Loss Function

A loss function measures prediction error.

General form:

\[
J(\theta)
\]

where:

| Symbol | Meaning |
|---|---|
| \(J\) | Loss or cost function |
| \(\theta\) | All model parameters |

Goal:

\[
\min_{\theta}J(\theta)
\]

---

# 51. Gradient Descent

Gradient descent updates model parameters in the direction that reduces loss.

\[
\theta_{t+1}
=
\theta_t
-
\eta
\nabla_\theta J(\theta_t)
\]

| Symbol | Meaning |
|---|---|
| \(\theta_t\) | Current parameter |
| \(\theta_{t+1}\) | Updated parameter |
| \(\eta\) | Learning rate |
| \(\nabla J\) | Gradient of loss |
| \(t\) | Iteration number |

## Simple Example

Minimize:

\[
J(w)=w^2
\]

Gradient:

\[
\frac{dJ}{dw}=2w
\]

```python
w = 10.0
learning_rate = 0.1

for iteration in range(20):
    gradient = 2 * w
    w = w - learning_rate * gradient

    print(iteration, w)
```

The value of \(w\) moves toward zero.

---

# 52. Batch, Stochastic and Mini-Batch Gradient Descent

| Method | Data Used per Update |
|---|---|
| Batch GD | Entire dataset |
| Stochastic GD | One observation |
| Mini-Batch GD | Small group of observations |

---

# 53. Momentum

Momentum remembers part of the previous update.

\[
v_t=
\beta v_{t-1}
+
(1-\beta)\nabla J(\theta_t)
\]

\[
\theta_{t+1}
=
\theta_t-\eta v_t
\]

| Symbol | Meaning |
|---|---|
| \(v_t\) | Momentum value |
| \(\beta\) | Momentum coefficient |
| \(\eta\) | Learning rate |

---

# 54. Adam Optimizer

Adam uses moving averages of gradients and squared gradients.

\[
m_t=
\beta_1m_{t-1}
+
(1-\beta_1)g_t
\]

\[
v_t=
\beta_2v_{t-1}
+
(1-\beta_2)g_t^2
\]

\[
\theta_{t+1}
=
\theta_t
-
\eta
\frac{\hat{m}_t}
{\sqrt{\hat{v}_t}+\epsilon}
\]

| Symbol | Meaning |
|---|---|
| \(g_t\) | Current gradient |
| \(m_t\) | First-moment estimate |
| \(v_t\) | Second-moment estimate |
| \(\beta_1,\beta_2\) | Decay rates |
| \(\epsilon\) | Small stability number |
| \(\eta\) | Learning rate |

---

# 55. L1 Regularization

\[
J_{L1}
=
J
+
\lambda
\sum_{j=1}^{p}|w_j|
\]

| Symbol | Meaning |
|---|---|
| \(J\) | Original loss |
| \(\lambda\) | Regularization strength |
| \(w_j\) | Model coefficient |
| \(p\) | Number of coefficients |

Effect:

```text
Can make some coefficients exactly zero
Performs feature selection
```

---

# 56. L2 Regularization

\[
J_{L2}
=
J
+
\lambda
\sum_{j=1}^{p}w_j^2
\]

Effect:

```text
Shrinks coefficients
Reduces overfitting
Usually keeps all features
```

---

# Part 7: Regression Mathematics

# 57. Simple Linear Regression

\[
\hat{y}
=
\beta_0+\beta_1x
\]

| Symbol | Meaning |
|---|---|
| \(\hat{y}\) | Predicted output |
| \(x\) | Input feature |
| \(\beta_0\) | Intercept |
| \(\beta_1\) | Slope |

Slope:

\[
\beta_1=
\frac{
\sum(x_i-\bar{x})(y_i-\bar{y})
}{
\sum(x_i-\bar{x})^2
}
\]

Intercept:

\[
\beta_0=
\bar{y}-\beta_1\bar{x}
\]

---

# 58. Linear Regression from Scratch

```python
import numpy as np

X = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([30000, 40000, 50000, 60000, 70000], dtype=float)

x_mean = np.mean(X)
y_mean = np.mean(y)

numerator = np.sum((X - x_mean) * (y - y_mean))
denominator = np.sum((X - x_mean) ** 2)

beta_1 = numerator / denominator
beta_0 = y_mean - beta_1 * x_mean

prediction = beta_0 + beta_1 * 6

print("Slope:", beta_1)
print("Intercept:", beta_0)
print("Prediction for 6 years:", prediction)
```

---

# 59. Multiple Linear Regression

\[
\hat{y}
=
\beta_0+
\beta_1x_1+
\beta_2x_2+
\cdots+
\beta_px_p
\]

Matrix form:

\[
\hat{\mathbf{y}}
=
X\boldsymbol{\beta}
\]

Normal equation:

\[
\hat{\boldsymbol{\beta}}
=
(X^TX)^{-1}X^T\mathbf{y}
\]

In practice, numerical solvers and pseudo-inverses are safer than directly calculating an inverse.

```python
import numpy as np

X = np.array([
    [1, 5],
    [2, 6],
    [3, 7],
    [4, 8],
    [5, 9]
], dtype=float)

y = np.array([30000, 40000, 50000, 60000, 70000], dtype=float)

# Add intercept column
X_bias = np.column_stack([np.ones(len(X)), X])

beta = np.linalg.pinv(X_bias) @ y

print("Coefficients:", beta)
```

---

# 60. Mean Squared Error

\[
MSE=
\frac1n
\sum_{i=1}^{n}
(y_i-\hat{y}_i)^2
\]

| Symbol | Meaning |
|---|---|
| \(y_i\) | Actual value |
| \(\hat{y}_i\) | Predicted value |
| \(n\) | Number of observations |

---

# 61. Mean Absolute Error

\[
MAE=
\frac1n
\sum_{i=1}^{n}
|y_i-\hat{y}_i|
\]

MAE is less sensitive to large errors than MSE.

---

# 62. Root Mean Squared Error

\[
RMSE=
\sqrt{
\frac1n
\sum_{i=1}^{n}
(y_i-\hat{y}_i)^2
}
\]

RMSE is in the same unit as the target.

---

# 63. R-Squared

\[
R^2=
1-
\frac{
\sum(y_i-\hat{y}_i)^2
}{
\sum(y_i-\bar{y})^2
}
\]

| Symbol | Meaning |
|---|---|
| Numerator | Unexplained variation |
| Denominator | Total variation |

---

# 64. Bias-Variance Decomposition

Expected squared prediction error can be described as:

\[
Expected\ Error
=
Bias^2+
Variance+
Irreducible\ Noise
\]

```text
High bias → Underfitting
High variance → Overfitting
```

---

# Part 8: Classification Mathematics

# 65. Logistic Regression

Linear score:

\[
z=
\beta_0+
\beta_1x_1+
\cdots+
\beta_px_p
\]

Sigmoid function:

\[
\sigma(z)=
\frac1{1+e^{-z}}
\]

Output:

\[
0<\sigma(z)<1
\]

Decision rule:

\[
\hat{y}=
\begin{cases}
1,&p\geq threshold\\
0,&p<threshold
\end{cases}
\]

---

# 66. Logistic Regression from Scratch

```python
import numpy as np

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

X = np.array([
    [1, 2],
    [2, 1],
    [3, 4],
    [4, 3]
], dtype=float)

y = np.array([0, 0, 1, 1], dtype=float)

weights = np.zeros(X.shape[1])
bias = 0.0
learning_rate = 0.1

for _ in range(2000):
    z = X @ weights + bias
    probabilities = sigmoid(z)

    error = probabilities - y

    dw = (X.T @ error) / len(y)
    db = np.mean(error)

    weights -= learning_rate * dw
    bias -= learning_rate * db

print("Weights:", weights)
print("Bias:", bias)

new_point = np.array([3.5, 3.0])
probability = sigmoid(new_point @ weights + bias)

print("Probability:", probability)
print("Class:", int(probability >= 0.5))
```

---

# 67. Binary Cross-Entropy

\[
L=
-\frac1n
\sum_{i=1}^{n}
[
y_i\log(p_i)
+
(1-y_i)\log(1-p_i)
]
\]

| Symbol | Meaning |
|---|---|
| \(y_i\) | Actual class |
| \(p_i\) | Predicted probability |
| \(n\) | Number of observations |

```python
import numpy as np

y_true = np.array([1, 0, 1])
y_prob = np.array([0.9, 0.2, 0.7])

epsilon = 1e-15
y_prob = np.clip(y_prob, epsilon, 1 - epsilon)

loss = -np.mean(
    y_true * np.log(y_prob)
    + (1 - y_true) * np.log(1 - y_prob)
)

print(loss)
```

---

# 68. KNN Mathematics

Euclidean distance:

\[
d(\mathbf{x},\mathbf{x}_i)
=
\sqrt{
\sum_{j=1}^{p}
(x_j-x_{ij})^2
}
\]

Classification:

\[
\hat{y}
=
\operatorname{mode}
\{y_i:i\in N_k(x)\}
\]

Regression:

\[
\hat{y}
=
\frac1k
\sum_{i\in N_k(x)}y_i
\]

| Symbol | Meaning |
|---|---|
| \(k\) | Number of neighbours |
| \(N_k(x)\) | Set of k closest points |
| \(p\) | Number of features |

---

# 69. Decision Tree Entropy

\[
Entropy=
-\sum_{c=1}^{C}p_c\log_2(p_c)
\]

| Symbol | Meaning |
|---|---|
| \(C\) | Number of classes |
| \(p_c\) | Proportion of class \(c\) |

For 50%-50% classes:

\[
Entropy=1
\]

For a pure node:

\[
Entropy=0
\]

---

# 70. Information Gain

\[
IG=
Entropy(Parent)
-
\sum_{j=1}^{m}
\frac{N_j}{N}
Entropy(Child_j)
\]

| Symbol | Meaning |
|---|---|
| \(N_j\) | Samples in child \(j\) |
| \(N\) | Total samples |
| \(m\) | Number of child nodes |

---

# 71. Gini Impurity

\[
Gini=
1-\sum_{c=1}^{C}p_c^2
\]

For 50%-50% classes:

\[
Gini=1-(0.5^2+0.5^2)=0.5
\]

---

# 72. Random Forest Mathematics

A random forest trains many decision trees using bootstrap samples and random feature subsets.

Classification:

\[
\hat{y}
=
\operatorname{mode}
\{
h_1(x),h_2(x),\ldots,h_B(x)
\}
\]

Regression:

\[
\hat{y}
=
\frac1B
\sum_{b=1}^{B}h_b(x)
\]

| Symbol | Meaning |
|---|---|
| \(B\) | Number of trees |
| \(h_b(x)\) | Prediction of tree \(b\) |

---

# 73. Naive Bayes

\[
P(C|X)
=
\frac{
P(X|C)P(C)
}{
P(X)
}
\]

With conditional independence:

\[
P(X|C)
=
\prod_{j=1}^{p}
P(x_j|C)
\]

Prediction:

\[
\hat{C}
=
\arg\max_C
P(C)
\prod_{j=1}^{p}P(x_j|C)
\]

| Symbol | Meaning |
|---|---|
| \(C\) | Class |
| \(X\) | Feature vector |
| \(P(C)\) | Class prior |
| \(P(x_j|C)\) | Feature likelihood |

---

# 74. Gaussian Naive Bayes

For continuous features:

\[
P(x|C)
=
\frac{
1
}{
\sqrt{2\pi\sigma_C^2}
}
\exp
\left(
-\frac{
(x-\mu_C)^2
}{
2\sigma_C^2
}
\right)
\]

Each class has its own mean and variance.

---

# 75. Support Vector Machine

Decision boundary:

\[
\mathbf{w}^T\mathbf{x}+b=0
\]

Prediction:

\[
\hat{y}
=
sign(
\mathbf{w}^T\mathbf{x}+b
)
\]

Margin:

\[
Margin=
\frac{2}{\|\mathbf{w}\|}
\]

Soft-margin objective:

\[
\min_{\mathbf{w},b,\xi}
\frac12\|\mathbf{w}\|^2
+
C\sum_{i=1}^{n}\xi_i
\]

subject to:

\[
y_i(
\mathbf{w}^T\mathbf{x}_i+b
)
\geq1-\xi_i
\]

| Symbol | Meaning |
|---|---|
| \(C\) | Penalty for classification errors |
| \(\xi_i\) | Slack variable |
| \(\mathbf{w}\) | Hyperplane weights |
| \(b\) | Bias |

---

# 76. Kernel Function

The kernel computes similarity in a transformed feature space.

## Linear Kernel

\[
K(x,z)=x^Tz
\]

## Polynomial Kernel

\[
K(x,z)
=
(\gamma x^Tz+r)^d
\]

## RBF Kernel

\[
K(x,z)
=
\exp(
-\gamma\|x-z\|^2
)
\]

| Parameter | Meaning |
|---|---|
| \(\gamma\) | Influence of each training point |
| \(d\) | Polynomial degree |
| \(r\) | Constant term |

---

# Part 9: Clustering and Dimensionality Reduction

# 77. K-Means Objective

K-Means minimizes within-cluster squared distance.

\[
J=
\sum_{k=1}^{K}
\sum_{x_i\in C_k}
\|x_i-\mu_k\|^2
\]

| Symbol | Meaning |
|---|---|
| \(K\) | Number of clusters |
| \(C_k\) | Cluster \(k\) |
| \(\mu_k\) | Centroid of cluster \(k\) |
| \(x_i\) | Data point |

Centroid:

\[
\mu_k=
\frac1{|C_k|}
\sum_{x_i\in C_k}x_i
\]

```python
import numpy as np
from sklearn.cluster import KMeans

X = np.array([
    [1, 2],
    [1, 3],
    [8, 8],
    [9, 8]
])

model = KMeans(
    n_clusters=2,
    random_state=42,
    n_init=10
)

labels = model.fit_predict(X)

print("Labels:", labels)
print("Centroids:\n", model.cluster_centers_)
```

---

# 78. Silhouette Score

For observation \(i\):

\[
s(i)
=
\frac{
b(i)-a(i)
}{
\max\{a(i),b(i)\}
}
\]

| Symbol | Meaning |
|---|---|
| \(a(i)\) | Average distance within own cluster |
| \(b(i)\) | Lowest average distance to another cluster |

Range:

\[
-1\leq s(i)\leq1
\]

```text
Near 1 → Good clustering
Near 0 → Overlapping clusters
Below 0 → Possible wrong assignment
```

---

# 79. PCA Mathematics

## Step 1: Standardize Data

\[
z_{ij}
=
\frac{
x_{ij}-\mu_j
}{
\sigma_j
}
\]

## Step 2: Covariance Matrix

\[
\Sigma=
\frac1{n-1}X^TX
\]

when \(X\) is centered.

## Step 3: Eigen Decomposition

\[
\Sigma v_j=\lambda_jv_j
\]

## Step 4: Projection

\[
Z=XW
\]

| Symbol | Meaning |
|---|---|
| \(\Sigma\) | Covariance matrix |
| \(\lambda_j\) | Eigenvalue |
| \(v_j\) | Principal direction |
| \(W\) | Selected eigenvectors |
| \(Z\) | Reduced data |

Explained variance ratio:

\[
EVR_j=
\frac{
\lambda_j
}{
\sum_k\lambda_k
}
\]

```python
from sklearn.datasets import load_iris
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

X, _ = load_iris(return_X_y=True)

X_scaled = StandardScaler().fit_transform(X)

pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X_scaled)

print("Reduced shape:", X_reduced.shape)
print("Explained variance:", pca.explained_variance_ratio_)
```

---

# Part 10: Boosting Mathematics

# 80. AdaBoost

AdaBoost combines weak learners:

\[
F(x)=
\sum_{m=1}^{M}
\alpha_mh_m(x)
\]

Learner weight:

\[
\alpha_m=
\frac12
\ln
\left(
\frac{1-\epsilon_m}{\epsilon_m}
\right)
\]

| Symbol | Meaning |
|---|---|
| \(M\) | Number of weak learners |
| \(h_m(x)\) | Weak learner |
| \(\epsilon_m\) | Weighted error |
| \(\alpha_m\) | Learner importance |

Sample weight update:

\[
w_i
\leftarrow
w_i
\exp(
-\alpha_my_ih_m(x_i)
)
\]

Misclassified observations receive more weight.

---

# 81. Gradient Boosting

Gradient boosting adds models sequentially:

\[
F_m(x)
=
F_{m-1}(x)
+
\eta h_m(x)
\]

Each learner fits negative gradients:

\[
r_{im}
=
-
\left[
\frac{
\partial L(y_i,F(x_i))
}{
\partial F(x_i)
}
\right]_{F=F_{m-1}}
\]

| Symbol | Meaning |
|---|---|
| \(F_m\) | Model after iteration \(m\) |
| \(h_m\) | New weak learner |
| \(\eta\) | Learning rate |
| \(r_{im}\) | Pseudo-residual |

---

# Part 11: Evaluation Metrics

# 82. Confusion Matrix

|  | Predicted Positive | Predicted Negative |
|---|---:|---:|
| Actual Positive | TP | FN |
| Actual Negative | FP | TN |

---

# 83. Accuracy

\[
Accuracy=
\frac{
TP+TN
}{
TP+TN+FP+FN
}
\]

Use when classes are reasonably balanced.

---

# 84. Precision

\[
Precision=
\frac{
TP
}{
TP+FP
}
\]

Meaning:

```text
Out of predicted positives, how many were actually positive?
```

Important when false positives are costly.

---

# 85. Recall

\[
Recall=
\frac{
TP
}{
TP+FN
}
\]

Meaning:

```text
Out of actual positives, how many did the model find?
```

Important in:

```text
Medical diagnosis
Fraud detection
Safety systems
```

---

# 86. Specificity

\[
Specificity=
\frac{
TN
}{
TN+FP
}
\]

Measures how well negative cases are identified.

---

# 87. F1 Score

\[
F1=
2
\frac{
Precision\times Recall
}{
Precision+Recall
}
\]

F1 is the harmonic mean of precision and recall.

---

# 88. ROC Curve

ROC plots:

\[
TPR=
\frac{TP}{TP+FN}
\]

against:

\[
FPR=
\frac{FP}{FP+TN}
\]

AUC measures overall ranking quality.

---

# 89. Log Loss

\[
LogLoss=
-\frac1n
\sum_{i=1}^{n}
[
y_i\log(p_i)
+
(1-y_i)\log(1-p_i)
]
\]

It evaluates probability quality, not only final labels.

---

# 90. MAPE

\[
MAPE=
\frac{100}{n}
\sum_{i=1}^{n}
\left|
\frac{
y_i-\hat{y}_i
}{
y_i
}
\right|
\]

MAPE is problematic when actual values are zero or very close to zero.

---

# Part 12: Deep Learning Mathematics

# 91. Artificial Neuron

\[
z=
\sum_{j=1}^{p}w_jx_j+b
\]

\[
a=f(z)
\]

| Symbol | Meaning |
|---|---|
| \(x_j\) | Input |
| \(w_j\) | Weight |
| \(b\) | Bias |
| \(z\) | Linear output |
| \(f\) | Activation function |
| \(a\) | Activated output |

---

# 92. ReLU Activation

\[
ReLU(z)=\max(0,z)
\]

Derivative:

\[
ReLU'(z)=
\begin{cases}
1,&z>0\\
0,&z<0
\end{cases}
\]

```python
def relu(z):
    return np.maximum(0, z)
```

---

# 93. Sigmoid Activation

\[
\sigma(z)=
\frac1{1+e^{-z}}
\]

Derivative:

\[
\sigma'(z)
=
\sigma(z)[1-\sigma(z)]
\]

Used in binary output layers.

---

# 94. Tanh Activation

\[
\tanh(z)
=
\frac{
e^z-e^{-z}
}{
e^z+e^{-z}
}
\]

Range:

\[
-1<\tanh(z)<1
\]

Derivative:

\[
\frac{d}{dz}\tanh(z)
=
1-\tanh^2(z)
\]

---

# 95. Softmax

For class \(j\):

\[
P(y=j)
=
\frac{
e^{z_j}
}{
\sum_{k=1}^{K}e^{z_k}
}
\]

| Symbol | Meaning |
|---|---|
| \(z_j\) | Score for class \(j\) |
| \(K\) | Number of classes |

```python
def softmax(z):
    shifted = z - np.max(z)
    exp_values = np.exp(shifted)
    return exp_values / np.sum(exp_values)

print(softmax(np.array([2.0, 1.0, 0.1])))
```

---

# 96. Multiclass Cross-Entropy

\[
L=
-\frac1n
\sum_{i=1}^{n}
\sum_{k=1}^{K}
y_{ik}\log(p_{ik})
\]

| Symbol | Meaning |
|---|---|
| \(y_{ik}\) | One-hot actual label |
| \(p_{ik}\) | Predicted probability |
| \(K\) | Number of classes |

---

# 97. Forward Propagation

For layer \(l\):

\[
z^{(l)}
=
W^{(l)}a^{(l-1)}
+
b^{(l)}
\]

\[
a^{(l)}
=
f^{(l)}(z^{(l)})
\]

| Symbol | Meaning |
|---|---|
| \(W^{(l)}\) | Weight matrix of layer \(l\) |
| \(b^{(l)}\) | Bias vector |
| \(a^{(l-1)}\) | Previous-layer activation |
| \(a^{(l)}\) | Current-layer activation |

---

# 98. Backpropagation

For output loss \(L\), backpropagation calculates gradients using the chain rule.

\[
\delta^{(l)}
=
\frac{\partial L}{\partial z^{(l)}}
\]

Weight gradient:

\[
\frac{\partial L}{\partial W^{(l)}}
=
\delta^{(l)}
(a^{(l-1)})^T
\]

Bias gradient:

\[
\frac{\partial L}{\partial b^{(l)}}
=
\delta^{(l)}
\]

Previous-layer error:

\[
\delta^{(l-1)}
=
(W^{(l)})^T
\delta^{(l)}
\odot
f'(z^{(l-1)})
\]

where \(\odot\) means element-wise multiplication.

---

# 99. CNN Convolution

For image \(X\) and kernel \(K\):

\[
Y(i,j)
=
\sum_m\sum_n
X(i+m,j+n)K(m,n)
\]

## Output Size

\[
Output=
\left\lfloor
\frac{
N+2P-F
}{
S
}
\right\rfloor+1
\]

| Symbol | Meaning |
|---|---|
| \(N\) | Input size |
| \(F\) | Filter size |
| \(P\) | Padding |
| \(S\) | Stride |

Example:

```text
Input = 32
Filter = 3
Padding = 1
Stride = 1
```

\[
Output=
\frac{32+2(1)-3}{1}+1=32
\]

---

# 100. RNN Mathematics

Hidden state:

\[
h_t=
\tanh(
W_{xh}x_t+
W_{hh}h_{t-1}+
b_h
)
\]

Output:

\[
y_t=
W_{hy}h_t+b_y
\]

| Symbol | Meaning |
|---|---|
| \(x_t\) | Input at time \(t\) |
| \(h_t\) | Current hidden state |
| \(h_{t-1}\) | Previous hidden state |
| \(W\) | Weight matrices |

---

# 101. LSTM Mathematics

Forget gate:

\[
f_t=
\sigma(
W_f[h_{t-1},x_t]+b_f
)
\]

Input gate:

\[
i_t=
\sigma(
W_i[h_{t-1},x_t]+b_i
)
\]

Candidate memory:

\[
\tilde{C}_t=
\tanh(
W_C[h_{t-1},x_t]+b_C
)
\]

Cell state:

\[
C_t=
f_t\odot C_{t-1}
+
i_t\odot\tilde{C}_t
\]

Output gate:

\[
o_t=
\sigma(
W_o[h_{t-1},x_t]+b_o
)
\]

Hidden state:

\[
h_t=
o_t\odot\tanh(C_t)
\]

---

# 102. Attention Mechanism

Scaled dot-product attention:

\[
Attention(Q,K,V)
=
softmax
\left(
\frac{
QK^T
}{
\sqrt{d_k}
}
\right)V
\]

| Symbol | Name | Meaning |
|---|---|---|
| \(Q\) | Query | What we are searching for |
| \(K\) | Key | What each token contains |
| \(V\) | Value | Information to combine |
| \(d_k\) | Key dimension | Scaling factor |

Used in transformers and LLMs.

---

# Part 13: Time-Series Mathematics

# 103. Moving Average

A \(k\)-period moving average is:

\[
MA_t=
\frac1k
\sum_{i=0}^{k-1}y_{t-i}
\]

| Symbol | Meaning |
|---|---|
| \(MA_t\) | Moving average at time \(t\) |
| \(k\) | Window size |
| \(y_{t-i}\) | Past observations |

```python
import pandas as pd

sales = pd.Series([100, 120, 130, 125, 150])

print(sales.rolling(window=3).mean())
```

---

# 104. Exponential Moving Average

\[
EMA_t=
\alpha y_t+
(1-\alpha)EMA_{t-1}
\]

where:

\[
0<\alpha\leq1
\]

Larger \(\alpha\) gives more importance to recent data.

---

# 105. Autoregressive Model

AR(\(p\)):

\[
y_t=
c+
\phi_1y_{t-1}
+
\phi_2y_{t-2}
+
\cdots+
\phi_py_{t-p}
+
\epsilon_t
\]

| Symbol | Meaning |
|---|---|
| \(p\) | Number of lagged values |
| \(\phi_i\) | Autoregressive coefficient |
| \(c\) | Constant |
| \(\epsilon_t\) | Random error |

---

# 106. Moving-Average Time-Series Model

MA(\(q\)):

\[
y_t=
\mu+
\epsilon_t+
\theta_1\epsilon_{t-1}
+\cdots+
\theta_q\epsilon_{t-q}
\]

| Symbol | Meaning |
|---|---|
| \(q\) | Number of past errors |
| \(\theta_i\) | Error coefficient |
| \(\epsilon_t\) | Current random error |

---

# 107. ARIMA

\[
ARIMA(p,d,q)
\]

| Parameter | Meaning |
|---|---|
| \(p\) | Autoregressive order |
| \(d\) | Number of differencing operations |
| \(q\) | Moving-average order |

First difference:

\[
\Delta y_t=y_t-y_{t-1}
\]

---

# Complete Practice Code

```python
import numpy as np
import pandas as pd

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

# ---------------------------------
# Regression mathematics
# ---------------------------------
X_reg = np.array([[1], [2], [3], [4], [5]])
y_reg = np.array([30000, 40000, 50000, 60000, 70000])

reg_model = LinearRegression()
reg_model.fit(X_reg, y_reg)

reg_predictions = reg_model.predict(X_reg)

print("Regression coefficient:", reg_model.coef_[0])
print("Regression intercept:", reg_model.intercept_)
print("MAE:", mean_absolute_error(y_reg, reg_predictions))
print("MSE:", mean_squared_error(y_reg, reg_predictions))
print("RMSE:", np.sqrt(mean_squared_error(y_reg, reg_predictions)))
print("R2:", r2_score(y_reg, reg_predictions))

# ---------------------------------
# Classification mathematics
# ---------------------------------
iris = load_iris()

X = iris.data
y = (iris.target == 0).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]

print("Accuracy:", accuracy_score(y_test, predictions))
print("Precision:", precision_score(y_test, predictions))
print("Recall:", recall_score(y_test, predictions))
print("F1:", f1_score(y_test, predictions))
print("Confusion matrix:\n", confusion_matrix(y_test, predictions))

# Manual binary cross-entropy
epsilon = 1e-15
probabilities = np.clip(
    probabilities,
    epsilon,
    1 - epsilon
)

log_loss = -np.mean(
    y_test * np.log(probabilities)
    + (1 - y_test) * np.log(1 - probabilities)
)

print("Manual log loss:", log_loss)
```

---

# Most Important Mathematics by Algorithm

| Algorithm | Main Mathematics |
|---|---|
| Linear Regression | Matrix multiplication, derivatives, MSE |
| Logistic Regression | Sigmoid, probability, log loss |
| KNN | Euclidean distance |
| Decision Tree | Entropy, Gini, information gain |
| Random Forest | Sampling, averaging, voting |
| SVM | Vectors, dot product, margin, optimization |
| Naive Bayes | Conditional probability, Bayes theorem |
| K-Means | Mean, Euclidean distance, optimization |
| PCA | Covariance, eigenvalues, eigenvectors |
| Boosting | Gradients, weighted errors |
| Neural Networks | Matrix multiplication, chain rule, gradient descent |
| CNN | Convolution, matrix operations |
| RNN/LSTM | Sequences, matrix multiplication, chain rule |
| Transformers | Dot product, softmax, attention |
| Time Series | Lag, moving average, differencing |

---

# Final Interview Summary

```text
The mathematics of Machine Learning is mainly based on linear algebra, calculus, probability, statistics and optimization.

Linear algebra represents datasets and model parameters using vectors and matrices. Concepts such as dot product, matrix multiplication, eigenvectors and SVD are used in regression, PCA, neural networks and recommendation systems.

Calculus is used to calculate derivatives and gradients. Gradient descent updates model parameters in the direction that reduces the loss function.

Probability handles uncertainty and is used in classification, Naive Bayes, logistic regression and probabilistic models.

Statistics helps understand data using mean, variance, standard deviation, covariance, correlation, sampling, confidence intervals and hypothesis testing.

Linear Regression minimizes squared errors. Logistic Regression converts a linear score into probability using the sigmoid function. Decision Trees use entropy, information gain or Gini impurity. SVM maximizes the classification margin. K-Means minimizes within-cluster squared distances. PCA uses eigenvalues and eigenvectors to reduce dimensions.

Deep Learning combines matrix multiplication, activation functions, loss functions, chain rule and gradient-based optimization. CNNs use convolution, RNNs process sequential hidden states, LSTMs use gates, and transformers use scaled dot-product attention.
```
