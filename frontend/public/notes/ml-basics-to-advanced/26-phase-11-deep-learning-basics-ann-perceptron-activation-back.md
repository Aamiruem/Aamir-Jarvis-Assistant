> **You asked:**
>
> Phase 11: Deep Learning Basics
> Artificial Neural Network (ANN)
> Perceptron
> Activation Function
> Backpropagation
> Loss Function
> Optimizer
> TensorFlow
> Keras
> PyTorch Basics   explain all concept for interview with example and code

I’ll cover Phase 11 in interview style: easy definitions, ANN/perceptron flow, activation/loss/optimizer, backpropagation, and practical TensorFlow/Keras/PyTorch code.

# Phase 11: Deep Learning Basics  
# ANN, Perceptron, Activation, Backpropagation, Loss, Optimizer, TensorFlow, Keras, PyTorch

Deep Learning is a part of Machine Learning that uses **neural networks** to learn patterns from data.

Simple meaning:

```text
Machine Learning: manually choose important features many times
Deep Learning: model learns important patterns automatically
```

Deep Learning is commonly used for:

```text
Image classification
Speech recognition
Natural language processing
Chatbots
Recommendation systems
Medical image analysis
Object detection
Fraud detection
```

---

# 1. What is Deep Learning?

## Easy Definition

Deep Learning is a machine learning technique that uses **many layers of neurons** to learn complex patterns.

Example:

```text
Input: Image of dog
Deep Learning model learns:
Edges → Shapes → Face → Dog
Output: Dog
```

## Interview Answer

Deep Learning is a branch of machine learning that uses artificial neural networks with multiple layers to learn complex patterns from large amounts of data.

---

# 2. Artificial Neural Network — ANN

## Easy Definition

ANN is a network of artificial neurons inspired by the human brain.

Simple structure:

```text
Input Layer → Hidden Layer → Output Layer
```

## Example

Suppose we want to predict whether a student will pass or fail.

Input features:

```text
Study Hours
Attendance
Previous Marks
```

Output:

```text
Pass or Fail
```

ANN flow:

```text
Study Hours, Attendance, Previous Marks
        ↓
Hidden Layers
        ↓
Pass / Fail
```

---

## ANN Layers

| Layer | Meaning |
|---|---|
| Input Layer | Takes input features |
| Hidden Layer | Learns patterns |
| Output Layer | Gives final prediction |

---

## ANN Example Diagram

```text
Input Layer          Hidden Layer          Output Layer

Study Hours   ──►        Neuron      ──►     Pass
Attendance    ──►        Neuron      ──►     Fail
Marks         ──►        Neuron
```

---

## Interview Answer

ANN stands for Artificial Neural Network. It contains input layers, hidden layers, and output layers. It learns patterns using weights, biases, activation functions, loss functions, and optimizers.

---

# 3. Perceptron

## Easy Definition

A Perceptron is the simplest type of artificial neuron.

Simple meaning:

```text
Perceptron = one basic neuron
```

It takes input, multiplies by weights, adds bias, and gives output.

---

## Perceptron Formula

```text
z = w1x1 + w2x2 + w3x3 + b
```

Where:

```text
x = input
w = weight
b = bias
z = weighted sum
```

Then activation function is applied:

```text
output = activation(z)
```

---

## Simple Example

Suppose:

```text
x1 = Study Hours = 5
x2 = Attendance = 80

w1 = 0.5
w2 = 0.1
b = 2
```

Calculation:

```text
z = w1x1 + w2x2 + b

z = 0.5 × 5 + 0.1 × 80 + 2

z = 2.5 + 8 + 2

z = 12.5
```

Now activation function decides final output.

---

## Perceptron Code from Scratch

```python
import numpy as np

# Input features
X = np.array([5, 80])  # Study hours, attendance

# Weights and bias
weights = np.array([0.5, 0.1])
bias = 2

# Weighted sum
z = np.dot(X, weights) + bias

# Step activation function
def step_function(z):
    if z >= 10:
        return 1
    else:
        return 0

output = step_function(z)

print("Weighted Sum:", z)
print("Output:", output)

if output == 1:
    print("Prediction: Pass")
else:
    print("Prediction: Fail")
```

---

## Interview Answer

A Perceptron is the simplest neural network unit. It takes inputs, multiplies them by weights, adds bias, applies an activation function, and produces output.

---

# 4. Weights and Bias

## Weight

Weight decides the importance of an input.

Example:

```text
Study Hours may be more important than Roll Number.
```

So Study Hours should get higher weight.

---

## Bias

Bias helps the neuron adjust output.

Simple meaning:

```text
Bias gives extra flexibility to the model.
```

Formula:

```text
z = wx + b
```

Where:

```text
w = weight
b = bias
```

---

## Interview Answer

Weights control the importance of input features, while bias helps shift the activation function and gives flexibility to the model.

---

# 5. Activation Function

## Easy Definition

Activation function decides whether a neuron should be activated or not.

Simple meaning:

```text
Activation Function = Decision maker inside neuron
```

Without activation function, neural network behaves like a simple linear model.

Activation functions can be added directly in a Dense layer or separately through an Activation layer in Keras. Keras documents Dense as applying `activation(dot(input, kernel) + bias)`, which matches the basic neuron formula. citeturn638332search9turn638332search16

---

## Why Activation Function is Needed?

Activation function helps the neural network learn:

```text
Non-linear patterns
Complex relationships
Image patterns
Text patterns
Real-world complex data
```

---

# 6. Common Activation Functions

## A. Sigmoid

Formula:

```text
Sigmoid(z) = 1 / (1 + e^-z)
```

Output range:

```text
0 to 1
```

Use:

```text
Binary classification output layer
```

Example:

```text
0.85 = 85% probability of class 1
```

---

## B. ReLU

Full form:

```text
Rectified Linear Unit
```

Formula:

```text
ReLU(x) = max(0, x)
```

Meaning:

```text
If input is negative → output 0
If input is positive → output same value
```

Example:

| Input | ReLU Output |
|---:|---:|
| -5 | 0 |
| -2 | 0 |
| 0 | 0 |
| 3 | 3 |
| 10 | 10 |

Use:

```text
Hidden layers
```

---

## C. Tanh

Output range:

```text
-1 to +1
```

Use:

```text
Hidden layers
Sometimes used in RNN
```

---

## D. Softmax

Softmax is used for multi-class classification.

Example:

```text
Dog probability = 0.70
Cat probability = 0.20
Horse probability = 0.10
```

Total probability:

```text
0.70 + 0.20 + 0.10 = 1
```

Use:

```text
Output layer for multi-class classification
```

---

## Activation Function Table

| Activation | Range | Common Use |
|---|---:|---|
| Sigmoid | 0 to 1 | Binary classification output |
| ReLU | 0 to infinity | Hidden layers |
| Tanh | -1 to +1 | Hidden layers |
| Softmax | Probabilities sum to 1 | Multi-class output |

---

## Interview Answer

Activation functions introduce non-linearity in neural networks. Common activation functions are ReLU for hidden layers, sigmoid for binary classification, and softmax for multi-class classification.

---

# 7. Forward Propagation

## Easy Definition

Forward propagation means data moves from input layer to output layer.

Simple meaning:

```text
Input → Hidden Layer → Output
```

Steps:

```text
1. Input is passed to neuron.
2. Weighted sum is calculated.
3. Activation function is applied.
4. Output is produced.
```

---

## Example

```text
Input: Study Hours, Attendance
Forward pass:
Input → Weighted Sum → ReLU/Sigmoid → Prediction
```

---

## Interview Answer

Forward propagation is the process where input data passes through the neural network layers to produce a prediction.

---

# 8. Loss Function

## Easy Definition

Loss function tells how wrong the model prediction is.

Simple meaning:

```text
Loss Function = Error calculator
```

Example:

```text
Actual = 1
Predicted = 0.8
Loss = small

Actual = 1
Predicted = 0.1
Loss = large
```

---

## Common Loss Functions

| Problem Type | Loss Function |
|---|---|
| Regression | Mean Squared Error |
| Binary Classification | Binary Crossentropy |
| Multi-class Classification | Categorical Crossentropy |
| Multi-class with integer labels | Sparse Categorical Crossentropy |

---

## A. MSE Loss

Used for regression.

```text
MSE = Average of squared errors
```

Example:

```text
House price prediction
Salary prediction
Sales prediction
```

---

## B. Binary Crossentropy

Used for binary classification.

Example:

```text
Spam / Not Spam
Disease / No Disease
Pass / Fail
```

---

## C. Categorical Crossentropy

Used for multi-class classification with one-hot encoded target.

Example:

```text
Dog, Cat, Horse
```

---

## D. Sparse Categorical Crossentropy

Used for multi-class classification when labels are integers.

Example:

```text
Dog = 0
Cat = 1
Horse = 2
```

---

## Interview Answer

Loss function measures the difference between actual output and predicted output. The model tries to minimize loss during training.

---

# 9. Backpropagation

## Easy Definition

Backpropagation is the process of sending error backward through the network to update weights.

Simple meaning:

```text
Prediction wrong?
Send error backward.
Update weights.
Try again.
```

---

## Backpropagation Steps

```text
1. Forward propagation gives prediction.
2. Loss function calculates error.
3. Backpropagation calculates gradients.
4. Optimizer updates weights and bias.
5. Repeat for many epochs.
```

TensorFlow provides `tf.GradientTape` for automatic differentiation: it records operations and then computes gradients using reverse-mode differentiation, which is the key idea used to update neural-network parameters. citeturn638332search6turn638332search18

---

## Simple Flow

```text
Input → Prediction → Loss
                 ↓
        Backpropagation
                 ↓
        Update weights
```

---

## Interview Answer

Backpropagation is an algorithm used to train neural networks. It calculates gradients of the loss function with respect to weights and updates the weights to reduce error.

---

# 10. Optimizer

## Easy Definition

Optimizer updates weights to reduce loss.

Simple meaning:

```text
Optimizer = Weight updater
```

Formula idea:

```text
new_weight = old_weight - learning_rate × gradient
```

---

## Common Optimizers

| Optimizer | Easy Meaning | Use |
|---|---|---|
| Gradient Descent | Updates using full data | Basic concept |
| SGD | Updates using mini-batches | Faster |
| RMSprop | Adaptive learning rate | Deep learning |
| Adam | Combines momentum + adaptive learning | Most common |

---

## Learning Rate

Learning rate controls step size.

```text
Small learning rate → slow learning
Large learning rate → may miss best solution
```

Example:

```text
learning_rate = 0.001
```

---

## Interview Answer

An optimizer updates model weights to minimize the loss function. Adam is one of the most commonly used optimizers because it adapts learning rates and works well in many deep learning problems.

---

# 11. Epoch, Batch Size, Iteration

## Epoch

One complete pass over the full training dataset.

```text
If model sees all training data once = 1 epoch
```

---

## Batch Size

Number of samples processed at one time.

```text
Batch size = 32
```

Means model processes 32 samples at a time.

---

## Iteration

One weight update step.

Example:

```text
Dataset = 320 samples
Batch size = 32

Iterations per epoch = 320 / 32 = 10
```

---

## Table

| Term | Meaning |
|---|---|
| Epoch | Full dataset seen once |
| Batch Size | Number of samples in one batch |
| Iteration | One update step |

---

# 12. Complete Deep Learning Training Flow

```text
1. Collect data
2. Clean data
3. Scale numerical features
4. Build neural network
5. Choose activation function
6. Choose loss function
7. Choose optimizer
8. Train model
9. Evaluate model
10. Tune hyperparameters
```

---

# 13. TensorFlow

## Easy Definition

TensorFlow is an open-source deep learning framework used to build and train machine learning and neural network models. TensorFlow’s official site describes it as a platform for creating ML models that can run in many environments. citeturn638332search1

---

## TensorFlow Basic Tensor Code

```python
import tensorflow as tf

# Create tensors
a = tf.constant([1, 2, 3])
b = tf.constant([4, 5, 6])

# Add tensors
c = a + b

print(c)
```

Output idea:

```text
[5, 7, 9]
```

---

## TensorFlow Gradient Example

```python
import tensorflow as tf

x = tf.Variable(3.0)

with tf.GradientTape() as tape:
    y = x ** 2

dy_dx = tape.gradient(y, x)

print(dy_dx)
```

Output:

```text
6.0
```

Because:

```text
y = x²
dy/dx = 2x
dy/dx = 2 × 3 = 6
```

---

# 14. Keras

## Easy Definition

Keras is a high-level deep learning API used to build neural networks easily.

Keras says it focuses on code simplicity, readability, maintainability, and fast debugging. TensorFlow/Keras also documents the `Sequential` model as useful for a plain stack of layers where each layer has one input tensor and one output tensor. citeturn638332search3turn638332search0

---

## Keras ANN Code — Binary Classification

Problem:

```text
Predict whether a customer will purchase or not.
```

```python
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Sample data
# Features: Age, Salary
X = np.array([
    [22, 25000],
    [25, 30000],
    [47, 80000],
    [52, 90000],
    [46, 75000],
    [56, 100000],
    [23, 28000],
    [30, 40000],
    [40, 60000],
    [35, 50000]
])

# Target: Purchased or not
y = np.array([0, 0, 1, 1, 1, 1, 0, 0, 1, 0])

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Feature scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Build ANN model
model = Sequential()

# Hidden layer 1
model.add(Dense(units=8, activation="relu", input_shape=(2,)))

# Hidden layer 2
model.add(Dense(units=4, activation="relu"))

# Output layer
model.add(Dense(units=1, activation="sigmoid"))

# Compile model
model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)

# Train model
model.fit(
    X_train,
    y_train,
    epochs=50,
    batch_size=4,
    verbose=1
)

# Evaluate model
loss, accuracy = model.evaluate(X_test, y_test)

print("Test Loss:", loss)
print("Test Accuracy:", accuracy)

# Prediction
new_customer = np.array([[32, 45000]])
new_customer_scaled = scaler.transform(new_customer)

prediction = model.predict(new_customer_scaled)

print("Purchase Probability:", prediction[0][0])

if prediction[0][0] >= 0.5:
    print("Prediction: Purchased")
else:
    print("Prediction: Not Purchased")
```

---

## Code Explanation

| Code | Meaning |
|---|---|
| `Sequential()` | Creates layer-by-layer model |
| `Dense()` | Fully connected layer |
| `activation="relu"` | Activation for hidden layers |
| `activation="sigmoid"` | Output probability for binary class |
| `optimizer="adam"` | Updates weights |
| `loss="binary_crossentropy"` | Binary classification loss |
| `epochs=50` | Train 50 times on full data |
| `batch_size=4` | 4 samples at a time |

---

# 15. Keras ANN Code — Multi-class Classification

Example:

```text
Classify flower into 3 classes.
```

```python
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense

from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Load dataset
iris = load_iris()
X = iris.data
y = iris.target   # 0, 1, 2

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Build model
model = Sequential([
    Dense(16, activation="relu", input_shape=(4,)),
    Dense(8, activation="relu"),
    Dense(3, activation="softmax")
])

# Compile
model.compile(
    optimizer="adam",
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"]
)

# Train
model.fit(
    X_train,
    y_train,
    epochs=50,
    batch_size=8,
    verbose=1
)

# Evaluate
loss, accuracy = model.evaluate(X_test, y_test)

print("Test Loss:", loss)
print("Test Accuracy:", accuracy)
```

---

## Why Softmax?

Because there are 3 classes:

```text
Class 0
Class 1
Class 2
```

Softmax gives probability for each class.

Example:

```text
[0.10, 0.80, 0.10]
```

Prediction:

```text
Class 1
```

---

# 16. PyTorch Basics

## Easy Definition

PyTorch is a deep learning framework used to build and train neural networks.

PyTorch’s official quickstart explains that a neural network is usually defined by creating a class that inherits from `nn.Module`, defining layers in `__init__`, and describing data flow in the `forward` function. citeturn638332search5

---

## PyTorch Tensor Example

```python
import torch

a = torch.tensor([1, 2, 3])
b = torch.tensor([4, 5, 6])

c = a + b

print(c)
```

Output:

```text
tensor([5, 7, 9])
```

---

## PyTorch Autograd Example

```python
import torch

x = torch.tensor(3.0, requires_grad=True)

y = x ** 2

y.backward()

print(x.grad)
```

Output:

```text
tensor(6.)
```

Because:

```text
y = x²
dy/dx = 2x
dy/dx = 6
```

PyTorch’s own project description highlights tensor computation with GPU acceleration and neural networks built on an autograd system. citeturn638332search10

---

# 17. PyTorch ANN Code — Binary Classification

```python
import torch
import torch.nn as nn
import torch.optim as optim

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import numpy as np

# Sample data
X = np.array([
    [22, 25000],
    [25, 30000],
    [47, 80000],
    [52, 90000],
    [46, 75000],
    [56, 100000],
    [23, 28000],
    [30, 40000],
    [40, 60000],
    [35, 50000]
], dtype=np.float32)

y = np.array([
    [0],
    [0],
    [1],
    [1],
    [1],
    [1],
    [0],
    [0],
    [1],
    [0]
], dtype=np.float32)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Scaling
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Convert to tensors
X_train = torch.tensor(X_train, dtype=torch.float32)
X_test = torch.tensor(X_test, dtype=torch.float32)
y_train = torch.tensor(y_train, dtype=torch.float32)
y_test = torch.tensor(y_test, dtype=torch.float32)

# Define ANN model
class ANNModel(nn.Module):
    def __init__(self):
        super(ANNModel, self).__init__()

        self.layer1 = nn.Linear(2, 8)
        self.layer2 = nn.Linear(8, 4)
        self.output = nn.Linear(4, 1)

        self.relu = nn.ReLU()
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.relu(self.layer2(x))
        x = self.sigmoid(self.output(x))
        return x

# Create model
model = ANNModel()

# Loss function
criterion = nn.BCELoss()

# Optimizer
optimizer = optim.Adam(model.parameters(), lr=0.01)

# Training loop
epochs = 100

for epoch in range(epochs):
    # Forward pass
    y_pred = model(X_train)

    # Loss
    loss = criterion(y_pred, y_train)

    # Clear old gradients
    optimizer.zero_grad()

    # Backpropagation
    loss.backward()

    # Update weights
    optimizer.step()

    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}")

# Evaluation
with torch.no_grad():
    test_pred = model(X_test)
    test_pred_class = (test_pred >= 0.5).float()

    accuracy = (test_pred_class == y_test).float().mean()

print("Test Predictions:", test_pred_class)
print("Test Accuracy:", accuracy.item())
```

---

## PyTorch Code Explanation

| Code | Meaning |
|---|---|
| `nn.Module` | Base class for neural network |
| `nn.Linear()` | Fully connected layer |
| `forward()` | Defines how input moves through model |
| `BCELoss()` | Binary classification loss |
| `Adam()` | Optimizer |
| `zero_grad()` | Clears old gradients |
| `loss.backward()` | Backpropagation |
| `optimizer.step()` | Updates weights |

---

# 18. TensorFlow/Keras vs PyTorch

| TensorFlow / Keras | PyTorch |
|---|---|
| High-level and production-friendly | Pythonic and flexible |
| Keras is beginner-friendly | PyTorch gives more control |
| Easy model building with `Sequential` | Model class using `nn.Module` |
| Good for deployment ecosystem | Popular in research and experimentation |
| Uses `model.fit()` style | Uses manual training loop |

---

# 19. ANN Complete Flow with Example

Problem:

```text
Predict customer purchase.
```

Features:

```text
Age
Salary
```

Target:

```text
Purchased: 0 or 1
```

ANN process:

```text
1. Input Age and Salary
2. Hidden layer learns patterns
3. ReLU activation adds non-linearity
4. Output layer uses sigmoid
5. Binary crossentropy calculates error
6. Adam optimizer updates weights
7. Model improves after many epochs
```

---

# 20. Deep Learning Important Interview Questions

## Q1. What is Deep Learning?

Deep Learning is a branch of machine learning that uses neural networks with multiple layers to learn complex patterns from data.

---

## Q2. What is ANN?

ANN stands for Artificial Neural Network. It is made of input layer, hidden layers, and output layer.

---

## Q3. What is a Perceptron?

A Perceptron is the simplest artificial neuron that takes inputs, multiplies them by weights, adds bias, applies activation, and produces output.

---

## Q4. What is an Activation Function?

Activation function introduces non-linearity into the neural network and helps it learn complex patterns.

---

## Q5. Why ReLU is commonly used?

ReLU is simple, fast, and helps reduce the vanishing gradient problem compared to sigmoid or tanh in hidden layers.

---

## Q6. Sigmoid vs Softmax?

| Sigmoid | Softmax |
|---|---|
| Binary classification | Multi-class classification |
| Output between 0 and 1 | Outputs probabilities for all classes |
| One output neuron | Multiple output neurons |

---

## Q7. What is Loss Function?

Loss function measures how wrong the model prediction is.

---

## Q8. What is Optimizer?

Optimizer updates model weights to minimize the loss function.

---

## Q9. What is Backpropagation?

Backpropagation calculates gradients of loss with respect to weights and updates weights to reduce error.

---

## Q10. What is Epoch?

One epoch means the model has seen the full training dataset once.

---

## Q11. What is Batch Size?

Batch size is the number of samples processed before updating model weights.

---

## Q12. TensorFlow vs PyTorch?

TensorFlow/Keras is beginner-friendly and production-friendly, while PyTorch is flexible and popular for research and custom training loops.

---

# 21. Final Summary Table

| Concept | Easy Meaning | Example |
|---|---|---|
| Deep Learning | ML using neural networks | Image classification |
| ANN | Network of artificial neurons | Customer purchase prediction |
| Perceptron | Single neuron | Weighted sum + activation |
| Weight | Importance of input | Study hours weight |
| Bias | Extra adjustable value | Shifts output |
| Activation Function | Adds non-linearity | ReLU, Sigmoid |
| Forward Propagation | Input to output flow | Prediction |
| Loss Function | Error calculator | Binary crossentropy |
| Backpropagation | Error goes backward | Gradient calculation |
| Optimizer | Updates weights | Adam |
| Epoch | Full data pass | 50 epochs |
| Batch Size | Samples per update | 32 |
| TensorFlow | Deep learning framework | `tf.keras` |
| Keras | High-level API | `Sequential` model |
| PyTorch | Flexible DL framework | `nn.Module` |

---

# Final Interview Summary

```text
Deep Learning is a branch of Machine Learning that uses neural networks to learn complex patterns from data.

An ANN contains input, hidden, and output layers. A perceptron is the simplest neuron that calculates weighted sum, adds bias, applies an activation function, and produces output.

Activation functions like ReLU, sigmoid, and softmax help neural networks learn non-linear patterns.

The loss function measures prediction error. Backpropagation calculates gradients, and the optimizer updates weights to reduce loss.

For binary classification, I use sigmoid with binary crossentropy. For multi-class classification, I use softmax with categorical or sparse categorical crossentropy.

TensorFlow and Keras are used for easy and production-friendly deep learning model building. PyTorch is flexible and commonly used for research and custom training loops.
```
