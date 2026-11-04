> **You asked:**
>
> Module 7: Linear Algebra
> Vectors
> Matrices
> Matrix Multiplication
> Determinant
> Inverse Matrix
> Eigenvalues
> Eigenvectors

# Phase 2: Mathematics for ML  
# Module 7: Linear Algebra for Machine Learning Interview

Linear Algebra is the mathematics of:

```text
Vectors
Matrices
Matrix operations
Transformations
Eigenvalues and Eigenvectors
```

In Machine Learning, data is mostly stored in the form of **vectors and matrices**.

Example:

```text
One student data:
[Age, Marks, Study_Hours] = [22, 85, 5]

This is a vector.

Multiple students data:
[
 [22, 85, 5],
 [21, 78, 4],
 [23, 90, 6]
]

This is a matrix.
```

---

# 1. Vectors

## Easy Definition

A vector is a **list of numbers**.

Simple meaning:

```text
Vector = one row or one column of numbers
```

Example:

```text
[10, 20, 30]
```

In ML:

```text
One row of data = one vector
```

Example:

```text
House features = [Area, Bedrooms, Age]
House features = [1500, 3, 5]
```

---

## Vector in Python

```python
import numpy as np

v = np.array([1, 2, 3])

print(v)
print("Shape:", v.shape)
```

Output:

```text
[1 2 3]
Shape: (3,)
```

---

## Vector Addition

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

print(a + b)
```

Output:

```text
[5 7 9]
```

Dry run:

```text
1 + 4 = 5
2 + 5 = 7
3 + 6 = 9
```

---

## Vector Subtraction

```python
a = np.array([10, 20, 30])
b = np.array([1, 2, 3])

print(a - b)
```

Output:

```text
[ 9 18 27]
```

---

## Scalar Multiplication

Scalar means a single number.

```python
v = np.array([1, 2, 3])

print(3 * v)
```

Output:

```text
[3 6 9]
```

Dry run:

```text
3 × 1 = 3
3 × 2 = 6
3 × 3 = 9
```

---

## Dot Product

Dot product means multiply corresponding values and add them.

Formula:

```text
a · b = a1b1 + a2b2 + a3b3
```

Example:

```text
a = [1, 2, 3]
b = [4, 5, 6]

a · b = 1×4 + 2×5 + 3×6
a · b = 4 + 10 + 18
a · b = 32
```

Python code:

```python
import numpy as np

a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

dot_product = np.dot(a, b)

print(dot_product)
```

Output:

```text
32
```

---

## Vector Magnitude

Magnitude means length of vector.

Formula:

```text
||v|| = √(x1² + x2² + x3²)
```

Example:

```text
v = [3, 4]

||v|| = √(3² + 4²)
||v|| = √(9 + 16)
||v|| = √25
||v|| = 5
```

Python code:

```python
import numpy as np

v = np.array([3, 4])

magnitude = np.linalg.norm(v)

print(magnitude)
```

Output:

```text
5.0
```

---

## ML Use of Vectors

Vectors are used for:

```text
One data record
Feature values
Model weights
Word embeddings
Image pixels
Neural network input
```

## Interview Answer

A vector is a one-dimensional array of numbers. In Machine Learning, one data record or one feature set can be represented as a vector.

---

# 2. Matrices

## Easy Definition

A matrix is a **2D table of numbers** arranged in rows and columns.

Simple meaning:

```text
Matrix = rows + columns
```

Example:

```text
A = [
 [1, 2, 3],
 [4, 5, 6]
]
```

This matrix has:

```text
Rows = 2
Columns = 3
Shape = 2 × 3
```

---

## Matrix in Python

```python
import numpy as np

A = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

print(A)
print("Shape:", A.shape)
```

Output:

```text
[[1 2 3]
 [4 5 6]]

Shape: (2, 3)
```

---

## Important Matrix Terms

| Term | Meaning |
|---|---|
| Row | Horizontal line |
| Column | Vertical line |
| Shape | Number of rows and columns |
| Square Matrix | Same rows and columns |
| Diagonal Matrix | Values mainly on diagonal |
| Identity Matrix | Diagonal values are 1 |
| Zero Matrix | All values are 0 |
| Transpose | Rows become columns |

---

## Matrix Transpose

Transpose means rows become columns.

Example:

```text
A = [
 [1, 2, 3],
 [4, 5, 6]
]

Aᵀ = [
 [1, 4],
 [2, 5],
 [3, 6]
]
```

Python code:

```python
import numpy as np

A = np.array([
    [1, 2, 3],
    [4, 5, 6]
])

print(A.T)
```

Output:

```text
[[1 4]
 [2 5]
 [3 6]]
```

---

## Identity Matrix

Identity matrix is like `1` in matrix multiplication.

```text
I = [
 [1, 0],
 [0, 1]
]
```

Python code:

```python
import numpy as np

I = np.eye(3)

print(I)
```

Output:

```text
[[1. 0. 0.]
 [0. 1. 0.]
 [0. 0. 1.]]
```

---

## ML Use of Matrices

Matrices are used for:

```text
Complete dataset
Image pixels
Neural network weights
Feature matrix
Linear regression
PCA
Deep learning
```

Example:

```text
Rows = records
Columns = features
```

```text
Dataset Matrix:

[
 [Age, Salary, Experience],
 [25, 40000, 2],
 [30, 60000, 5],
 [35, 80000, 8]
]
```

## Interview Answer

A matrix is a two-dimensional array of numbers arranged in rows and columns. In Machine Learning, datasets are commonly represented as matrices.

---

# 3. Matrix Multiplication

## Easy Definition

Matrix multiplication means multiplying rows of the first matrix with columns of the second matrix.

Important rule:

```text
A shape = m × n
B shape = n × p

A × B result shape = m × p
```

The inside dimensions must match.

Example:

```text
(2 × 3) × (3 × 2) = possible
Result shape = 2 × 2
```

```text
(2 × 3) × (2 × 3) = not possible
Because 3 ≠ 2
```

genui{"linear_algebra_optimization_learning_block_staging":{"type_id":"MATRIX_MULTIPLICATION_ROW_COLUMN_RULE","locale_override":"en-US"}}

---

## Example

```text
A = [
 [1, 2],
 [3, 4]
]

B = [
 [5, 6],
 [7, 8]
]
```

Now:

```text
A × B = [
 [1×5 + 2×7,   1×6 + 2×8],
 [3×5 + 4×7,   3×6 + 4×8]
]
```

Dry run:

```text
First row × first column:
1×5 + 2×7 = 5 + 14 = 19

First row × second column:
1×6 + 2×8 = 6 + 16 = 22

Second row × first column:
3×5 + 4×7 = 15 + 28 = 43

Second row × second column:
3×6 + 4×8 = 18 + 32 = 50
```

Final answer:

```text
[
 [19, 22],
 [43, 50]
]
```

---

## Python Code

```python
import numpy as np

A = np.array([
    [1, 2],
    [3, 4]
])

B = np.array([
    [5, 6],
    [7, 8]
])

result = A @ B

print(result)
```

Output:

```text
[[19 22]
 [43 50]]
```

Alternative:

```python
result = np.dot(A, B)
```

---

## Important: `*` vs `@`

### Element-wise Multiplication

```python
print(A * B)
```

Output:

```text
[[ 5 12]
 [21 32]]
```

### Matrix Multiplication

```python
print(A @ B)
```

Output:

```text
[[19 22]
 [43 50]]
```

| Operator | Meaning |
|---|---|
| `*` | Element-wise multiplication |
| `@` | Matrix multiplication |
| `np.dot()` | Dot product / matrix multiplication |

---

## ML Use

Matrix multiplication is used in:

```text
Linear Regression
Logistic Regression
Neural Networks
PCA
Deep Learning
Image processing
```

Example:

```text
Prediction = Input × Weights + Bias
```

## Interview Answer

Matrix multiplication is done by taking the dot product of rows of the first matrix with columns of the second matrix. The number of columns in the first matrix must equal the number of rows in the second matrix.

---

# 4. Determinant

## Easy Definition

Determinant is a special number calculated from a square matrix.

Simple meaning:

```text
Determinant tells whether a matrix has inverse or not.
```

Important:

```text
If determinant = 0  → inverse does not exist
If determinant ≠ 0 → inverse exists
```

---

## Determinant of 2×2 Matrix

For:

```text
A = [
 [a, b],
 [c, d]
]
```

Formula:

```text
det(A) = ad - bc
```

---

## Example

```text
A = [
 [1, 2],
 [3, 4]
]
```

Dry run:

```text
det(A) = 1×4 - 2×3
det(A) = 4 - 6
det(A) = -2
```

---

## Python Code

```python
import numpy as np

A = np.array([
    [1, 2],
    [3, 4]
])

det_A = np.linalg.det(A)

print(det_A)
```

Output:

```text
-2.0000000000000004
```

Mathematically, answer is:

```text
-2
```

The extra decimal comes because computers store floating-point numbers approximately.

---

## Determinant and Linear Independence

If determinant is zero, rows or columns are linearly dependent.

If determinant is non-zero, rows or columns are linearly independent.

genui{"linear_algebra_optimization_learning_block_staging":{"type_id":"LINEAR_INDEPENDENCE_DISCRIMINANT","locale_override":"en-US"}}

Example:

```text
A = [
 [1, 2],
 [2, 4]
]
```

Here second row is 2 times the first row.

```text
det(A) = 1×4 - 2×2
det(A) = 4 - 4
det(A) = 0
```

So inverse does not exist.

---

## ML Use

Determinant is used in:

```text
Checking invertibility
Solving linear systems
PCA
Matrix transformation
Feature dependency understanding
```

## Interview Answer

Determinant is a scalar value of a square matrix. If determinant is zero, the matrix is singular and inverse does not exist. If determinant is non-zero, inverse exists.

---

# 5. Inverse Matrix

## Easy Definition

Inverse matrix is like reciprocal of a number.

For a number:

```text
5 inverse = 1/5

5 × 1/5 = 1
```

For a matrix:

```text
A × A⁻¹ = I
```

Where:

```text
A⁻¹ = inverse of A
I = identity matrix
```

---

## Conditions for Inverse

A matrix has inverse only when:

```text
1. Matrix is square
2. Determinant is not zero
```

---

## Inverse Formula for 2×2 Matrix

For:

```text
A = [
 [a, b],
 [c, d]
]
```

Formula:

```text
A⁻¹ = 1 / (ad - bc) × [
 [d, -b],
 [-c, a]
]
```

---

## Example

```text
A = [
 [1, 2],
 [3, 4]
]
```

Step 1: Find determinant

```text
det(A) = 1×4 - 2×3
det(A) = 4 - 6
det(A) = -2
```

Step 2: Apply inverse formula

```text
A⁻¹ = 1 / -2 × [
 [4, -2],
 [-3, 1]
]
```

Step 3: Multiply every value by `-1/2`

```text
A⁻¹ = [
 [-2, 1],
 [1.5, -0.5]
]
```

---

## Python Code

```python
import numpy as np

A = np.array([
    [1, 2],
    [3, 4]
])

inverse_A = np.linalg.inv(A)

print(inverse_A)
```

Output:

```text
[[-2.   1. ]
 [ 1.5 -0.5]]
```

---

## Verify Inverse

```python
I = A @ inverse_A

print(I)
```

Output:

```text
[[1.00000000e+00 1.11022302e-16]
 [0.00000000e+00 1.00000000e+00]]
```

This is approximately:

```text
[
 [1, 0],
 [0, 1]
]
```

`1.11022302e-16` is almost zero.

---

## ML Use

Inverse matrix is used in:

```text
Solving equations
Linear Regression normal equation
Optimization
Matrix transformations
```

Linear Regression normal equation:

```text
θ = (XᵀX)⁻¹Xᵀy
```

## Interview Answer

Inverse matrix is a matrix that gives identity matrix when multiplied with the original matrix. A matrix has inverse only when it is square and determinant is not zero.

---

# 6. Eigenvalues and Eigenvectors

## Easy Definition

Eigenvectors are special vectors that do not change direction after matrix transformation.

Eigenvalues tell how much the eigenvector is stretched or compressed.

Formula:

```text
A v = λ v
```

Where:

```text
A = matrix
v = eigenvector
λ = eigenvalue
```

genui{"linear_algebra_optimization_learning_block_staging":{"type_id":"EIGENDIRECTIONS","locale_override":"en-US"}}

---

## Simple Meaning

Normally, when a matrix transforms a vector, the vector can rotate and stretch.

But for eigenvector:

```text
Direction remains same.
Only length changes.
```

Example:

```text
If λ = 3, vector becomes 3 times longer.
If λ = 0.5, vector becomes shorter.
If λ = -1, vector reverses direction.
```

---

## Example

```text
A = [
 [2, 0],
 [0, 3]
]
```

This matrix scales:

```text
x-direction by 2
y-direction by 3
```

Eigenvalues:

```text
λ1 = 2
λ2 = 3
```

Eigenvectors:

```text
For λ1 = 2 → [1, 0]
For λ2 = 3 → [0, 1]
```

---

## Python Code

```python
import numpy as np

A = np.array([
    [2, 0],
    [0, 3]
])

eigenvalues, eigenvectors = np.linalg.eig(A)

print("Eigenvalues:")
print(eigenvalues)

print("Eigenvectors:")
print(eigenvectors)
```

Output:

```text
Eigenvalues:
[2. 3.]

Eigenvectors:
[[1. 0.]
 [0. 1.]]
```

---

## Dry Run

For eigenvalue `2` and eigenvector `[1, 0]`:

```text
A × v = [
 [2, 0],
 [0, 3]
] × [1, 0]
```

Calculation:

```text
First value  = 2×1 + 0×0 = 2
Second value = 0×1 + 3×0 = 0
```

So:

```text
A × v = [2, 0]
```

Now:

```text
λ × v = 2 × [1, 0] = [2, 0]
```

So:

```text
A v = λ v
```

Therefore:

```text
[1, 0] is an eigenvector
2 is its eigenvalue
```

---

## ML Use

Eigenvalues and eigenvectors are used in:

```text
PCA
Dimensionality reduction
Feature extraction
Image compression
Recommendation systems
Spectral clustering
```

In PCA:

```text
Eigenvectors = principal directions
Eigenvalues = importance / variance of each direction
```

## Interview Answer

Eigenvectors are special vectors that do not change direction after matrix transformation. Eigenvalues tell how much those eigenvectors are scaled. They are very important in PCA and dimensionality reduction.

---

# 7. Complete Linear Algebra Python Practice Code

```python
import numpy as np

# -----------------------------
# 1. Vectors
# -----------------------------
v1 = np.array([1, 2, 3])
v2 = np.array([4, 5, 6])

print("Vector Addition:", v1 + v2)
print("Vector Subtraction:", v1 - v2)
print("Scalar Multiplication:", 3 * v1)
print("Dot Product:", np.dot(v1, v2))
print("Magnitude of v1:", np.linalg.norm(v1))

# -----------------------------
# 2. Matrices
# -----------------------------
A = np.array([
    [1, 2],
    [3, 4]
])

B = np.array([
    [5, 6],
    [7, 8]
])

print("\nMatrix A:")
print(A)

print("\nMatrix B:")
print(B)

print("\nTranspose of A:")
print(A.T)

print("\nIdentity Matrix:")
print(np.eye(2))

# -----------------------------
# 3. Matrix Multiplication
# -----------------------------
print("\nElement-wise Multiplication:")
print(A * B)

print("\nMatrix Multiplication:")
print(A @ B)

# -----------------------------
# 4. Determinant
# -----------------------------
print("\nDeterminant of A:")
print(np.linalg.det(A))

# -----------------------------
# 5. Inverse Matrix
# -----------------------------
print("\nInverse of A:")
print(np.linalg.inv(A))

print("\nA multiplied by inverse of A:")
print(A @ np.linalg.inv(A))

# -----------------------------
# 6. Eigenvalues and Eigenvectors
# -----------------------------
eigenvalues, eigenvectors = np.linalg.eig(A)

print("\nEigenvalues:")
print(eigenvalues)

print("\nEigenvectors:")
print(eigenvectors)
```

---

# 8. Complete ML Example Using Linear Algebra

## Linear Regression Prediction

Formula:

```text
Prediction = XW + b
```

Where:

```text
X = input features
W = weights
b = bias
```

Example:

```text
Experience = 2
Skill Score = 8

Weights:
Experience weight = 5000
Skill weight = 2000

Bias = 10000
```

Prediction:

```text
Salary = 2×5000 + 8×2000 + 10000
Salary = 10000 + 16000 + 10000
Salary = 36000
```

Python code:

```python
import numpy as np

X = np.array([2, 8])          # features
W = np.array([5000, 2000])    # weights
b = 10000                    # bias

prediction = np.dot(X, W) + b

print("Predicted Salary:", prediction)
```

Output:

```text
Predicted Salary: 36000
```

---

## Multiple Records Prediction

```python
import numpy as np

# Rows = employees
# Columns = features: Experience, Skill Score
X = np.array([
    [2, 8],
    [3, 7],
    [5, 9]
])

W = np.array([5000, 2000])
b = 10000

predictions = X @ W + b

print(predictions)
```

Output:

```text
[36000 39000 53000]
```

Dry run:

```text
Row 1: 2×5000 + 8×2000 + 10000 = 36000
Row 2: 3×5000 + 7×2000 + 10000 = 39000
Row 3: 5×5000 + 9×2000 + 10000 = 53000
```

This is why matrix multiplication is very important in ML.

---

# 9. Quick Revision Table

| Topic | Easy Meaning | ML Use |
|---|---|---|
| Vector | 1D list of numbers | One data record |
| Matrix | 2D table of numbers | Complete dataset |
| Matrix Multiplication | Row-column dot product | Prediction, neural networks |
| Determinant | Special value of square matrix | Inverse checking |
| Inverse Matrix | Matrix reciprocal | Linear equations, regression |
| Eigenvalue | Scaling factor | PCA importance |
| Eigenvector | Special direction | PCA direction |

---

# 10. Most Asked Interview Questions

## Q1. What is a vector?

A vector is a one-dimensional array of numbers. In ML, one data point can be represented as a vector.

---

## Q2. What is a matrix?

A matrix is a two-dimensional array of numbers arranged in rows and columns. In ML, a dataset is usually represented as a matrix.

---

## Q3. What is matrix multiplication?

Matrix multiplication is the dot product of rows of the first matrix with columns of the second matrix.

---

## Q4. What condition is needed for matrix multiplication?

If matrix A has shape `m × n` and matrix B has shape `n × p`, multiplication is possible.

```text
Columns of A = Rows of B
```

---

## Q5. Difference between `A * B` and `A @ B` in NumPy?

```text
A * B → element-wise multiplication
A @ B → matrix multiplication
```

---

## Q6. What is determinant?

Determinant is a scalar value of a square matrix. It tells whether the matrix is invertible or not.

```text
det(A) = 0  → inverse does not exist
det(A) ≠ 0 → inverse exists
```

---

## Q7. What is inverse matrix?

Inverse matrix is a matrix that gives identity matrix when multiplied with the original matrix.

```text
A × A⁻¹ = I
```

---

## Q8. When does inverse not exist?

Inverse does not exist when:

```text
Matrix is not square
Determinant is zero
```

---

## Q9. What are eigenvalues and eigenvectors?

Eigenvectors are special vectors that do not change direction after matrix transformation. Eigenvalues tell how much eigenvectors are scaled.

---

## Q10. Why are eigenvalues and eigenvectors important in ML?

They are important in:

```text
PCA
Dimensionality reduction
Feature extraction
Image compression
Recommendation systems
```

---

# Final Interview Summary

```text
Linear Algebra is very important in Machine Learning because data is represented using vectors and matrices.

A vector represents one data record, and a matrix represents the complete dataset.

Matrix multiplication is used in predictions, neural networks, and transformations.

Determinant tells whether a matrix has an inverse.

Inverse matrix is used in solving linear equations and Linear Regression.

Eigenvalues and eigenvectors are used in PCA and dimensionality reduction.

I am comfortable with vectors, matrices, matrix multiplication, determinant, inverse matrix, eigenvalues, and eigenvectors using NumPy.
```
