> **You asked:**
>
> Module 2: NumPy
> Arrays
> Creating Arrays
> Indexing
> Slicing
> Reshaping
> Broadcasting
> Universal Functions
> Mathematical Operations
> Statistics
> Random Numbers
> Matrix Operations
> Linear Algebra
> Performance Optimization explain all concept for interview like code example  and dry run and formula

# Module 2: NumPy for Machine Learning Interview

## 1. What is NumPy?

NumPy means **Numerical Python**.

It is used for:

```text
Numerical calculation
Arrays
Matrix operation
Statistics
Linear algebra
Machine learning preprocessing
Fast mathematical computation
```

### Interview Answer

NumPy is a Python library used for fast numerical computing. It provides powerful N-dimensional arrays and mathematical functions that are faster than normal Python lists.

---

# 2. Why NumPy is Important in ML?

In Machine Learning, data is usually stored in numbers.

Example:

```text
Age, Salary, Experience, Marks, Pixels, Features
```

NumPy helps to store and process these numbers efficiently.

```python
import numpy as np
```

---

# 3. Python List vs NumPy Array

## Python List

```python
data = [10, 20, 30]
print(data * 2)
```

Output:

```text
[10, 20, 30, 10, 20, 30]
```

## NumPy Array

```python
import numpy as np

arr = np.array([10, 20, 30])
print(arr * 2)
```

Output:

```text
[20 40 60]
```

### Interview Point

Python list multiplication repeats the list, but NumPy array multiplication performs element-wise multiplication.

---

# 4. NumPy Arrays

Array means a collection of values of the same data type.

```python
import numpy as np

arr = np.array([10, 20, 30, 40])
print(arr)
print(type(arr))
```

Output:

```text
[10 20 30 40]
<class 'numpy.ndarray'>
```

---

# 5. Array Dimensions

## 1D Array

```python
arr = np.array([10, 20, 30])
print(arr.ndim)
```

Output:

```text
1
```

Example:

```text
[10, 20, 30]
```

---

## 2D Array

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60]])

print(arr.ndim)
```

Output:

```text
2
```

Example:

```text
Rows and columns
```

---

## 3D Array

```python
arr = np.array([
    [[1, 2], [3, 4]],
    [[5, 6], [7, 8]]
])

print(arr.ndim)
```

Output:

```text
3
```

Used in:

```text
Images
Deep learning
Batch data
```

---

# 6. Important Array Properties

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60]])

print(arr.shape)
print(arr.size)
print(arr.dtype)
print(arr.ndim)
```

Output:

```text
(2, 3)
6
int64
2
```

| Property | Meaning |
|---|---|
| `shape` | Rows and columns |
| `size` | Total elements |
| `dtype` | Data type |
| `ndim` | Number of dimensions |

---

# 7. Creating Arrays

## A. Using `np.array()`

```python
arr = np.array([1, 2, 3])
print(arr)
```

---

## B. Using `np.zeros()`

```python
arr = np.zeros((2, 3))
print(arr)
```

Output:

```text
[[0. 0. 0.]
 [0. 0. 0.]]
```

Used when we need an empty numeric structure.

---

## C. Using `np.ones()`

```python
arr = np.ones((2, 3))
print(arr)
```

Output:

```text
[[1. 1. 1.]
 [1. 1. 1.]]
```

---

## D. Using `np.full()`

```python
arr = np.full((2, 3), 7)
print(arr)
```

Output:

```text
[[7 7 7]
 [7 7 7]]
```

---

## E. Using `np.arange()`

```python
arr = np.arange(1, 10, 2)
print(arr)
```

Output:

```text
[1 3 5 7 9]
```

Formula:

```text
np.arange(start, stop, step)
```

---

## F. Using `np.linspace()`

```python
arr = np.linspace(1, 10, 5)
print(arr)
```

Output:

```text
[ 1.    3.25  5.5   7.75 10.  ]
```

Meaning:

```text
Create 5 equally spaced values between 1 and 10.
```

---

## G. Identity Matrix

```python
arr = np.eye(3)
print(arr)
```

Output:

```text
[[1. 0. 0.]
 [0. 1. 0.]
 [0. 0. 1.]]
```

Used in linear algebra.

---

# 8. Indexing

Indexing means accessing elements using position.

## 1D Indexing

```python
arr = np.array([10, 20, 30, 40])

print(arr[0])
print(arr[2])
print(arr[-1])
```

Output:

```text
10
30
40
```

---

## 2D Indexing

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60]])

print(arr[0, 0])
print(arr[1, 2])
```

Output:

```text
10
60
```

Dry Run:

```text
arr[1, 2]

Row index 1 → [40, 50, 60]
Column index 2 → 60
```

---

# 9. Slicing

Slicing means extracting part of array.

Formula:

```text
array[start : stop : step]
```

## 1D Slicing

```python
arr = np.array([10, 20, 30, 40, 50])

print(arr[1:4])
print(arr[:3])
print(arr[2:])
print(arr[::-1])
```

Output:

```text
[20 30 40]
[10 20 30]
[30 40 50]
[50 40 30 20 10]
```

---

## 2D Slicing

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60],
                [70, 80, 90]])

print(arr[0:2, 1:3])
```

Output:

```text
[[20 30]
 [50 60]]
```

Dry Run:

```text
Rows 0 to 1:
[10, 20, 30]
[40, 50, 60]

Columns 1 to 2:
[20, 30]
[50, 60]
```

---

# 10. Reshaping

Reshaping means changing shape without changing data.

```python
arr = np.array([1, 2, 3, 4, 5, 6])

new_arr = arr.reshape(2, 3)
print(new_arr)
```

Output:

```text
[[1 2 3]
 [4 5 6]]
```

Important rule:

```text
Total elements must be same.
```

Example:

```text
6 elements → possible shapes:
(2, 3)
(3, 2)
(1, 6)
(6, 1)
```

### Interview Answer

Reshape changes array dimensions, but total number of elements must remain same.

---

## Flatten Array

```python
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

print(arr.flatten())
```

Output:

```text
[1 2 3 4 5 6]
```

---

# 11. Broadcasting

Broadcasting means NumPy automatically adjusts smaller array shape with bigger array shape for operations.

## Example 1

```python
arr = np.array([10, 20, 30])

print(arr + 5)
```

Output:

```text
[15 25 35]
```

Dry Run:

```text
[10, 20, 30] + 5

5 is broadcasted as:
[5, 5, 5]

Result:
[15, 25, 35]
```

---

## Example 2

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60]])

b = np.array([1, 2, 3])

print(arr + b)
```

Output:

```text
[[11 22 33]
 [41 52 63]]
```

Dry Run:

```text
b = [1, 2, 3]

Broadcasted to:
[1, 2, 3]
[1, 2, 3]

Then added row-wise.
```

### Interview Answer

Broadcasting allows NumPy to perform operations on arrays of different shapes by automatically expanding smaller array.

---

# 12. Universal Functions

Universal functions are fast element-wise functions in NumPy.

Examples:

```python
arr = np.array([1, 4, 9, 16])

print(np.sqrt(arr))
print(np.exp(arr))
print(np.log(arr))
print(np.sin(arr))
```

Output:

```text
[1. 2. 3. 4.]
```

Common ufuncs:

| Function | Meaning |
|---|---|
| `np.sqrt()` | Square root |
| `np.exp()` | Exponential |
| `np.log()` | Natural log |
| `np.abs()` | Absolute value |
| `np.round()` | Round value |
| `np.sin()` | Sine |
| `np.cos()` | Cosine |

### Interview Answer

Universal functions perform fast element-wise operations on NumPy arrays.

---

# 13. Mathematical Operations

```python
a = np.array([10, 20, 30])
b = np.array([1, 2, 3])

print(a + b)
print(a - b)
print(a * b)
print(a / b)
print(a ** 2)
```

Output:

```text
[11 22 33]
[ 9 18 27]
[10 40 90]
[10. 10. 10.]
[100 400 900]
```

Dry Run:

```text
a + b:
10 + 1 = 11
20 + 2 = 22
30 + 3 = 33
```

---

# 14. Statistics in NumPy

```python
arr = np.array([10, 20, 30, 40, 50])

print(np.mean(arr))
print(np.median(arr))
print(np.min(arr))
print(np.max(arr))
print(np.sum(arr))
print(np.std(arr))
print(np.var(arr))
```

Output:

```text
30.0
30.0
10
50
150
14.142...
200.0
```

---

## Important Formulas

### Mean

```text
Mean = Sum of values / Total values
```

Example:

```text
[10, 20, 30]

Mean = (10 + 20 + 30) / 3 = 20
```

---

### Variance

```text
Variance = Average of squared difference from mean
```

Example:

```text
Data = [10, 20, 30]
Mean = 20

Variance = ((10-20)² + (20-20)² + (30-20)²) / 3
Variance = (100 + 0 + 100) / 3
Variance = 66.67
```

---

### Standard Deviation

```text
Standard Deviation = √Variance
```

Example:

```text
SD = √66.67 = 8.16
```

---

# 15. Axis Concept

Axis is very important for interview.

```python
arr = np.array([[10, 20, 30],
                [40, 50, 60]])

print(np.sum(arr))
print(np.sum(arr, axis=0))
print(np.sum(arr, axis=1))
```

Output:

```text
210
[50 70 90]
[ 60 150]
```

Dry Run:

```text
axis=0 means column-wise operation.

Column 1: 10 + 40 = 50
Column 2: 20 + 50 = 70
Column 3: 30 + 60 = 90

axis=1 means row-wise operation.

Row 1: 10 + 20 + 30 = 60
Row 2: 40 + 50 + 60 = 150
```

Interview Trick:

```text
axis=0 → down the rows / column result
axis=1 → across columns / row result
```

---

# 16. Random Numbers

Random numbers are used in ML for:

```text
Train-test split
Weight initialization
Data sampling
Simulation
```

## Random Float

```python
print(np.random.rand(3))
```

Output:

```text
3 random values between 0 and 1
```

---

## Random Integer

```python
print(np.random.randint(1, 10, size=5))
```

Output:

```text
5 random integers between 1 and 9
```

---

## Random Matrix

```python
print(np.random.rand(2, 3))
```

---

## Random Seed

```python
np.random.seed(42)
print(np.random.randint(1, 10, 5))
```

### Interview Answer

Random seed is used to get the same random output every time. It makes results reproducible.

---

# 17. Matrix Operations

Matrix is a 2D array.

```python
A = np.array([[1, 2],
              [3, 4]])

B = np.array([[5, 6],
              [7, 8]])
```

---

## Element-wise Multiplication

```python
print(A * B)
```

Output:

```text
[[ 5 12]
 [21 32]]
```

Dry Run:

```text
1*5 = 5
2*6 = 12
3*7 = 21
4*8 = 32
```

---

## Matrix Multiplication

```python
print(A @ B)
```

or

```python
print(np.dot(A, B))
```

Output:

```text
[[19 22]
 [43 50]]
```

Formula:

```text
First row × first column:
1*5 + 2*7 = 19

First row × second column:
1*6 + 2*8 = 22

Second row × first column:
3*5 + 4*7 = 43

Second row × second column:
3*6 + 4*8 = 50
```

---

## Transpose

```python
print(A.T)
```

Output:

```text
[[1 3]
 [2 4]]
```

Meaning:

```text
Rows become columns.
Columns become rows.
```

---

# 18. Linear Algebra

Linear algebra is very important in ML.

Used in:

```text
Linear Regression
Neural Networks
PCA
Deep Learning
Recommendation Systems
```

---

## A. Determinant

```python
det = np.linalg.det(A)
print(det)
```

For:

```text
A = [[1, 2],
     [3, 4]]
```

Formula:

```text
det(A) = ad - bc
det(A) = 1*4 - 2*3 = 4 - 6 = -2
```

---

## B. Inverse Matrix

```python
inv = np.linalg.inv(A)
print(inv)
```

Formula for 2x2 matrix:

```text
A = [[a, b],
     [c, d]]

A⁻¹ = 1/(ad-bc) * [[d, -b],
                   [-c, a]]
```

Important:

```text
Inverse exists only if determinant is not zero.
```

---

## C. Eigenvalues and Eigenvectors

```python
values, vectors = np.linalg.eig(A)

print(values)
print(vectors)
```

Used in:

```text
PCA
Dimensionality reduction
Linear transformations
```

Interview Answer:

```text
Eigenvectors show direction and eigenvalues show magnitude of transformation.
```

---

## D. Solving Linear Equations

Example:

```text
2x + y = 8
x + 3y = 13
```

Code:

```python
A = np.array([[2, 1],
              [1, 3]])

B = np.array([8, 13])

solution = np.linalg.solve(A, B)
print(solution)
```

Output:

```text
[2.2 3.6]
```

---

# 19. Boolean Indexing

Used for filtering data.

```python
arr = np.array([10, 20, 30, 40, 50])

print(arr[arr > 25])
```

Output:

```text
[30 40 50]
```

Dry Run:

```text
arr > 25 gives:
[False, False, True, True, True]

Only True values are selected.
```

---

# 20. Performance Optimization

NumPy is faster than normal Python lists because:

```text
1. Uses C internally
2. Stores same type data together
3. Avoids slow Python loops
4. Uses vectorization
```

---

## Python Loop

```python
numbers = list(range(1000000))

result = []
for x in numbers:
    result.append(x * 2)
```

---

## NumPy Vectorization

```python
arr = np.arange(1000000)
result = arr * 2
```

### Interview Answer

Vectorization means applying operations on complete array at once instead of using loops. It makes NumPy faster.

---

# 21. Complete NumPy ML Example

```python
import numpy as np

# Dataset: Experience and Salary
X = np.array([1, 2, 3, 4, 5])
y = np.array([30000, 35000, 40000, 45000, 50000])

# Mean
x_mean = np.mean(X)
y_mean = np.mean(y)

# Linear Regression formula
# slope = Σ((x - x_mean)(y - y_mean)) / Σ((x - x_mean)^2)
m = np.sum((X - x_mean) * (y - y_mean)) / np.sum((X - x_mean) ** 2)

# intercept = y_mean - m*x_mean
c = y_mean - m * x_mean

print("Slope:", m)
print("Intercept:", c)

# Prediction
experience = 6
salary_pred = m * experience + c

print("Predicted Salary:", salary_pred)
```

Output:

```text
Slope: 5000.0
Intercept: 25000.0
Predicted Salary: 55000.0
```

---

# 22. Dry Run of Linear Regression Formula

Data:

```text
X = [1, 2, 3, 4, 5]
y = [30000, 35000, 40000, 45000, 50000]
```

Mean:

```text
x_mean = 3
y_mean = 40000
```

Formula:

```text
m = Σ((x - x_mean)(y - y_mean)) / Σ((x - x_mean)²)
```

Table:

| X | y | X - mean | y - mean | Product | Square |
|---:|---:|---:|---:|---:|---:|
| 1 | 30000 | -2 | -10000 | 20000 | 4 |
| 2 | 35000 | -1 | -5000 | 5000 | 1 |
| 3 | 40000 | 0 | 0 | 0 | 0 |
| 4 | 45000 | 1 | 5000 | 5000 | 1 |
| 5 | 50000 | 2 | 10000 | 20000 | 4 |

```text
Sum Product = 50000
Sum Square = 10

m = 50000 / 10 = 5000
```

Intercept:

```text
c = y_mean - m*x_mean
c = 40000 - 5000*3
c = 25000
```

Final equation:

```text
Salary = 5000 * Experience + 25000
```

For 6 years:

```text
Salary = 5000*6 + 25000 = 55000
```

---

# 23. Most Asked NumPy Interview Questions

## Q1. What is NumPy?

NumPy is a Python library used for fast numerical computation and multidimensional arrays.

---

## Q2. Why NumPy is faster than list?

Because NumPy uses C internally, stores same type data continuously, and supports vectorized operations.

---

## Q3. What is ndarray?

`ndarray` is NumPy’s main array object used to store N-dimensional data.

---

## Q4. What is broadcasting?

Broadcasting allows NumPy to perform operations on arrays of different shapes.

---

## Q5. What is vectorization?

Vectorization means applying operation on whole array without writing Python loops.

---

## Q6. Difference between `np.array()` and Python list?

NumPy array supports fast mathematical operations, while Python list is general-purpose and slower for numeric computation.

---

## Q7. What is axis in NumPy?

Axis defines the direction of operation.

```text
axis=0 → column-wise
axis=1 → row-wise
```

---

## Q8. Difference between `reshape()` and `flatten()`?

```text
reshape() → changes shape
flatten() → converts multidimensional array into 1D array
```

---

## Q9. Difference between `*` and `dot()`?

```text
* → element-wise multiplication
dot() / @ → matrix multiplication
```

---

## Q10. What is random seed?

Random seed fixes random output and makes results reproducible.

---

# 24. Final Interview Summary

```text
NumPy is very important for Machine Learning because it provides fast numerical computation using arrays, vectorization, broadcasting, mathematical operations, statistics, random number generation, matrix operations, and linear algebra.

I use NumPy for data preprocessing, numerical calculations, feature representation, matrix multiplication, and implementing ML formulas efficiently.
```
