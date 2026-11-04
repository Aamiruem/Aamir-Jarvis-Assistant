> **You asked:**
>
> Module 8: Calculus (Basic)
> Function
> Derivative
> Partial Derivative
> Gradient
> Chain Rule
> Gradient Descent

# Phase 2: Mathematics for ML  
# Module 8: Calculus Basics for Machine Learning Interview

Calculus helps Machine Learning models **learn and improve**.

In ML, calculus is used in:

```text
Loss function optimization
Gradient descent
Backpropagation
Neural networks
Finding minimum error
Updating model weights
```

Main idea:

```text
Model makes prediction
Prediction has error
Calculus helps reduce error
```

---

# 1. Function

## Easy Definition

A function is a rule that takes input and gives output.

Simple meaning:

```text
Input → Function → Output
```

Example:

```text
f(x) = x²
```

If:

```text
x = 2
```

Then:

```text
f(2) = 2² = 4
```

---

## Real-Life Example

```text
Salary = f(Experience)
```

If experience increases, salary may also increase.

Example:

```text
Salary = 5000 × Experience + 20000
```

If experience = 3:

```text
Salary = 5000 × 3 + 20000
Salary = 35000
```

---

## Python Code

```python
def salary(experience):
    return 5000 * experience + 20000

print(salary(3))
```

Output:

```text
35000
```

---

## ML Use

In ML:

```text
Prediction = function(input features)
```

Example:

```text
y = wx + b
```

Where:

```text
x = input feature
w = weight
b = bias
y = prediction
```

## Interview Answer

A function is a mathematical rule that maps input to output. In Machine Learning, models are functions that take input features and produce predictions.

---

# 2. Derivative

## Easy Definition

Derivative tells **how fast a function changes**.

Simple meaning:

```text
Derivative = rate of change
```

Example:

```text
If salary changes when experience changes,
derivative tells how much salary changes for 1 unit change in experience.
```

---

## Formula

For:

```text
f(x) = x²
```

Derivative:

```text
f'(x) = 2x
```

genui{"calculus_analysis_learning_block_staging":{"type_id":"DERIVATIVE","content":"f(x)=x^2","locale_override":"en-US"}}

---

## Example

```text
f(x) = x²
f'(x) = 2x
```

At `x = 3`:

```text
f'(3) = 2 × 3
f'(3) = 6
```

Meaning:

```text
At x = 3, function is changing with slope 6.
```

---

## Derivative as Slope

Derivative is the slope of tangent line.

```text
Positive derivative  → function increasing
Negative derivative  → function decreasing
Zero derivative      → flat point / minimum / maximum
```

genui{"calculus_analysis_learning_block_staging":{"type_id":"DERIVATIVE_AS_SECANT","locale_override":"en-US"}}

---

## Common Derivative Rules

| Function | Derivative |
|---|---|
| `x` | `1` |
| `x²` | `2x` |
| `x³` | `3x²` |
| `xⁿ` | `nxⁿ⁻¹` |
| constant | `0` |

---

## Python Code

```python
import sympy as sp

x = sp.Symbol("x")

f = x**2
derivative = sp.diff(f, x)

print("Function:", f)
print("Derivative:", derivative)
```

Output:

```text
Function: x**2
Derivative: 2*x
```

---

## ML Use

Derivative is used to know:

```text
How loss changes with weight
How to update model parameters
How to reduce prediction error
```

Example:

```text
If derivative is positive, decrease weight.
If derivative is negative, increase weight.
```

## Interview Answer

Derivative measures the rate of change of a function. In ML, derivatives help us understand how the loss changes with respect to model parameters.

---

# 3. Partial Derivative

## Easy Definition

Partial derivative is used when a function has **more than one variable**.

Simple meaning:

```text
Change one variable
Keep other variables constant
Find derivative
```

---

## Example Function

```text
f(x, y) = x² + y²
```

Partial derivative with respect to `x`:

```text
∂f/∂x = 2x
```

Because `y²` is treated as constant.

Partial derivative with respect to `y`:

```text
∂f/∂y = 2y
```

Because `x²` is treated as constant.

---

## Dry Run

Given:

```text
f(x, y) = x² + y²
```

For `∂f/∂x`:

```text
x² derivative = 2x
y² derivative = 0 because y is constant

∂f/∂x = 2x
```

For `∂f/∂y`:

```text
x² derivative = 0 because x is constant
y² derivative = 2y

∂f/∂y = 2y
```

---

## Python Code

```python
import sympy as sp

x, y = sp.symbols("x y")

f = x**2 + y**2

df_dx = sp.diff(f, x)
df_dy = sp.diff(f, y)

print("∂f/∂x:", df_dx)
print("∂f/∂y:", df_dy)
```

Output:

```text
∂f/∂x: 2*x
∂f/∂y: 2*y
```

---

## ML Use

In ML, loss function depends on many weights:

```text
Loss = f(w1, w2, w3, ..., b)
```

We calculate partial derivative for each weight:

```text
∂Loss/∂w1
∂Loss/∂w2
∂Loss/∂b
```

## Interview Answer

Partial derivative measures how a function changes with respect to one variable while keeping other variables constant. It is used in ML to update each model parameter separately.

---

# 4. Gradient

## Easy Definition

Gradient is a vector of all partial derivatives.

Simple meaning:

```text
Gradient = collection of partial derivatives
```

---

## Formula

If:

```text
f(x, y) = x² + y²
```

Then:

```text
∂f/∂x = 2x
∂f/∂y = 2y
```

Gradient:

```text
∇f = [2x, 2y]
```

---

## Example

At:

```text
x = 3
y = 4
```

Gradient:

```text
∇f = [2x, 2y]
∇f = [2×3, 2×4]
∇f = [6, 8]
```

Meaning:

```text
Function increases fastest in direction [6, 8].
```

---

## Python Code

```python
import sympy as sp

x, y = sp.symbols("x y")

f = x**2 + y**2

gradient = [sp.diff(f, x), sp.diff(f, y)]

print("Gradient:", gradient)

# value at x=3, y=4
gradient_value = [g.subs({x: 3, y: 4}) for g in gradient]

print("Gradient at (3,4):", gradient_value)
```

Output:

```text
Gradient: [2*x, 2*y]
Gradient at (3,4): [6, 8]
```

---

## ML Use

Gradient tells:

```text
Direction of maximum increase in loss
Opposite direction reduces loss
```

In ML, we move opposite to gradient:

```text
New weight = Old weight - learning_rate × gradient
```

## Interview Answer

Gradient is a vector of partial derivatives. It tells the direction in which the function increases the fastest. In ML, we move in the opposite direction of the gradient to reduce loss.

---

# 5. Chain Rule

## Easy Definition

Chain rule is used when one function is inside another function.

Simple meaning:

```text
Outside derivative × Inside derivative
```

---

## Formula

If:

```text
y = f(g(x))
```

Then:

```text
dy/dx = f'(g(x)) × g'(x)
```

---

## Example

```text
y = (3x + 2)²
```

Here:

```text
Outer function = u²
Inner function = 3x + 2
```

Step 1: Differentiate outer function:

```text
Derivative of u² = 2u
```

Step 2: Put inner function back:

```text
2(3x + 2)
```

Step 3: Differentiate inner function:

```text
Derivative of 3x + 2 = 3
```

Final answer:

```text
dy/dx = 2(3x + 2) × 3
dy/dx = 6(3x + 2)
```

---

## Dry Run at x = 2

```text
dy/dx = 6(3x + 2)

dy/dx = 6(3×2 + 2)
dy/dx = 6(6 + 2)
dy/dx = 6 × 8
dy/dx = 48
```

---

## Python Code

```python
import sympy as sp

x = sp.Symbol("x")

y = (3*x + 2)**2

dy_dx = sp.diff(y, x)

print("Derivative:", dy_dx)
```

Output:

```text
Derivative: 6*(3*x + 2)
```

---

## ML Use

Chain rule is very important in:

```text
Backpropagation
Neural networks
Deep learning
Gradient calculation
```

In neural networks:

```text
Input → Hidden Layer → Output → Loss
```

Loss depends on output, output depends on weights, weights affect hidden layers.

So chain rule helps calculate:

```text
How each weight affects final loss
```

## Interview Answer

Chain rule is used to differentiate composite functions. In ML, it is very important for backpropagation in neural networks.

---

# 6. Gradient Descent

## Easy Definition

Gradient Descent is an optimization algorithm used to reduce loss/error.

Simple meaning:

```text
Gradient Descent helps model find the best weights by reducing error step by step.
```

---

## Real-Life Example

Imagine you are standing on a mountain and want to reach the lowest point.

You do:

```text
Look at slope
Move downward
Again check slope
Move downward
Repeat until lowest point
```

In ML:

```text
Mountain height = Loss
Position = Weight
Downward direction = Negative gradient
Lowest point = Minimum loss
```

---

## Gradient Descent Formula

```text
New weight = Old weight - Learning rate × Gradient
```

Or:

```text
w_new = w_old - α × dL/dw
```

Where:

```text
w = weight
α = learning rate
L = loss function
dL/dw = derivative of loss with respect to weight
```

---

## Example

Suppose:

```text
Old weight = 10
Learning rate = 0.1
Gradient = 4
```

Formula:

```text
New weight = Old weight - Learning rate × Gradient
New weight = 10 - 0.1 × 4
New weight = 10 - 0.4
New weight = 9.6
```

---

## Dry Run

| Step | Weight | Gradient | Learning Rate | New Weight |
|---:|---:|---:|---:|---:|
| 1 | 10.0 | 4 | 0.1 | 9.6 |
| 2 | 9.6 | 3 | 0.1 | 9.3 |
| 3 | 9.3 | 2 | 0.1 | 9.1 |
| 4 | 9.1 | 1 | 0.1 | 9.0 |

Meaning:

```text
Weight is slowly moving toward minimum loss.
```

---

# 7. Gradient Descent with Simple Function

Let loss function be:

```text
Loss = w²
```

Derivative:

```text
dLoss/dw = 2w
```

Start:

```text
w = 5
learning_rate = 0.1
```

---

## Step-by-Step Dry Run

### Step 1

```text
w = 5
gradient = 2w = 2 × 5 = 10

new_w = 5 - 0.1 × 10
new_w = 5 - 1
new_w = 4
```

### Step 2

```text
w = 4
gradient = 2w = 8

new_w = 4 - 0.1 × 8
new_w = 4 - 0.8
new_w = 3.2
```

### Step 3

```text
w = 3.2
gradient = 2w = 6.4

new_w = 3.2 - 0.1 × 6.4
new_w = 3.2 - 0.64
new_w = 2.56
```

Weight is moving toward `0`.

For `Loss = w²`, minimum loss occurs at:

```text
w = 0
```

---

## Python Code

```python
w = 5
learning_rate = 0.1

for step in range(10):
    loss = w**2
    gradient = 2 * w
    
    w = w - learning_rate * gradient
    
    print(f"Step: {step+1}, Loss: {loss:.4f}, Weight: {w:.4f}")
```

Output idea:

```text
Step: 1, Loss: 25.0000, Weight: 4.0000
Step: 2, Loss: 16.0000, Weight: 3.2000
Step: 3, Loss: 10.2400, Weight: 2.5600
...
```

---

# 8. Learning Rate

## Easy Definition

Learning rate controls how big steps the model takes during learning.

```text
Small learning rate → slow learning
Large learning rate → may miss minimum
Good learning rate  → stable learning
```

---

## Example

### Very Small Learning Rate

```text
learning_rate = 0.0001
```

Problem:

```text
Training becomes very slow.
```

### Very Large Learning Rate

```text
learning_rate = 10
```

Problem:

```text
Model may jump over minimum and fail to learn.
```

### Good Learning Rate

```text
learning_rate = 0.01 or 0.001
```

Usually used in ML/DL.

---

## Interview Answer

Learning rate controls the step size in gradient descent. If it is too small, training is slow. If it is too large, the model may not converge.

---

# 9. Gradient Descent in Linear Regression

Linear Regression prediction:

```text
y_pred = wx + b
```

Loss function:

```text
MSE = (1/n) Σ(y_actual - y_pred)²
```

Gradient descent updates:

```text
w = w - α × ∂Loss/∂w
b = b - α × ∂Loss/∂b
```

---

## Simple Code Example

```python
import numpy as np

# Data
X = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 6, 8, 10])

# Initial parameters
w = 0
b = 0

learning_rate = 0.01
epochs = 1000
n = len(X)

for epoch in range(epochs):
    # Prediction
    y_pred = w * X + b
    
    # Loss
    loss = np.mean((y - y_pred) ** 2)
    
    # Gradients
    dw = (-2/n) * np.sum(X * (y - y_pred))
    db = (-2/n) * np.sum(y - y_pred)
    
    # Update parameters
    w = w - learning_rate * dw
    b = b - learning_rate * db

print("Final weight:", w)
print("Final bias:", b)
print("Final loss:", loss)
```

Expected result:

```text
Final weight close to 2
Final bias close to 0
```

Because actual relation is:

```text
y = 2x
```

---

# 10. Complete Calculus Practice Code

```python
import sympy as sp

# -----------------------------
# 1. Function and Derivative
# -----------------------------
x = sp.Symbol("x")

f = x**2 + 3*x + 2

df_dx = sp.diff(f, x)

print("Function:", f)
print("Derivative:", df_dx)

# -----------------------------
# 2. Partial Derivative
# -----------------------------
x, y = sp.symbols("x y")

f = x**2 + y**2 + 3*x*y

df_dx = sp.diff(f, x)
df_dy = sp.diff(f, y)

print("Partial derivative wrt x:", df_dx)
print("Partial derivative wrt y:", df_dy)

# -----------------------------
# 3. Gradient
# -----------------------------
gradient = [df_dx, df_dy]

print("Gradient:", gradient)

# -----------------------------
# 4. Chain Rule
# -----------------------------
x = sp.Symbol("x")

y = (3*x + 2)**2

dy_dx = sp.diff(y, x)

print("Chain rule derivative:", dy_dx)

# -----------------------------
# 5. Gradient Descent
# -----------------------------
w = 5
learning_rate = 0.1

for step in range(5):
    loss = w**2
    gradient = 2 * w
    w = w - learning_rate * gradient
    
    print(f"Step {step+1}: Loss={loss:.4f}, Weight={w:.4f}")
```

---

# 11. Quick Revision Table

| Topic | Easy Meaning | ML Use |
|---|---|---|
| Function | Input-output rule | Model prediction |
| Derivative | Rate of change | Loss change |
| Partial Derivative | Change one variable, keep others constant | Update each weight |
| Gradient | Vector of partial derivatives | Direction of loss increase |
| Chain Rule | Derivative of nested functions | Backpropagation |
| Gradient Descent | Reduce loss step by step | Model training |

---

# 12. Most Asked Interview Questions

## Q1. What is a function?

A function is a rule that takes input and gives output.

Example:

```text
f(x) = x²
```

---

## Q2. What is derivative?

Derivative measures the rate of change of a function.

In ML:

```text
Derivative tells how loss changes when weight changes.
```

---

## Q3. What is partial derivative?

Partial derivative measures change with respect to one variable while keeping other variables constant.

---

## Q4. What is gradient?

Gradient is a vector of partial derivatives.

```text
∇f = [∂f/∂x, ∂f/∂y]
```

---

## Q5. What is chain rule?

Chain rule is used to differentiate composite functions.

Simple formula:

```text
Outside derivative × inside derivative
```

---

## Q6. Why is chain rule important in ML?

Chain rule is important in neural networks because backpropagation uses it to calculate gradients layer by layer.

---

## Q7. What is gradient descent?

Gradient Descent is an optimization algorithm used to minimize loss by updating weights in the opposite direction of the gradient.

---

## Q8. What is learning rate?

Learning rate controls step size during gradient descent.

```text
Too small → slow training
Too large → unstable training
```

---

## Q9. Why do we move opposite to gradient?

Gradient points toward maximum increase of loss. To reduce loss, we move in the opposite direction.

---

## Q10. Formula of gradient descent?

```text
w_new = w_old - learning_rate × gradient
```

---

# Final Interview Summary

```text
Calculus is important in Machine Learning because it helps models reduce error.

A function maps input to output. A derivative tells the rate of change. A partial derivative tells how loss changes with respect to one parameter. A gradient is a vector of partial derivatives. Chain rule is used in backpropagation. Gradient descent uses gradients to update weights and minimize loss.

In ML, calculus is mainly used for optimization and training models.
```
