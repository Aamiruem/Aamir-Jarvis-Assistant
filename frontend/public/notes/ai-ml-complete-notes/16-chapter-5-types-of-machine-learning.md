> **You asked:**
>
> ## Chapter 5: Types of Machine Learning
>
> -  Supervised learning 
> -  Unsupervised learning 
> -  Semi-supervised learning 
> -  Self-supervised learning 
> -  Reinforcement learning 
> -  Online learning 
> -  Batch learning 
> -  Active learning 
> -  Transfer learning 
> -  Federated learning 
> -  Multi-task learning     Explain the chapter <chapter name/topic> in detail. 
>   Break down all concepts step by step in very simple language. 
>   Include:
>   - Clear definitions of each concept
>   - Important formulas with parameter names explained
>   - Real-world examples for each concept
>   - Visualizations or diagrams to make it intuitive (use graphs and colorful notes)
>   - Conceptual code examples (Python preferred) with dry run tables
>   - Common mistakes and how to avoid them
>   - Interview-style questions with answers for practice
>
>   Make the explanation very conceptual, beginner-friendly, and structured like a study guide. 
>   Use graphs, colorful notes, and highlight formulas with parameter names for clarity. 
>   Provide complete Python code examples with dry run tables for understanding.
>   colorful notes and digram and difficult word explain to easy meaning

# Chapter 5: Types of Machine Learning

This chapter explains the **main ways a machine can learn**.

The easiest way to understand the whole chapter is:

```text
                    MACHINE LEARNING
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   By Labels          By Feedback        By Training Style
        │                  │                  │
   Supervised         Reinforcement       Batch
   Unsupervised                           Online
   Semi-supervised
   Self-supervised
        │
        └─────────────── Other Important Styles
                         │
                  Active Learning
                  Transfer Learning
                  Federated Learning
                  Multi-task Learning
```

🟦 **Easy idea:** Different types of Machine Learning mainly differ in **what data is available, what feedback the model gets, and how the model is trained**.

---

# 1. Difficult Words First

Before studying the types, understand these words.

| Word | Easy Meaning |
|---|---|
| Label | Correct answer attached to data |
| Labeled data | Input + correct output |
| Unlabeled data | Input only, no correct answer |
| Reward | Score showing whether an action was good/bad |
| Agent | Decision-making system |
| Environment | World in which agent acts |
| Batch | Group of data |
| Online | Learning continuously from new data |
| Annotation | Human-created label |
| Pretraining | Training before final task |
| Fine-tuning | Further training for specific task |
| Client | Device/user participating in federated learning |
| Shared representation | Common internal knowledge used by many tasks |
| Pseudo-label | Label generated automatically rather than manually |

---

# 2. Big Picture: Which Learning Type Should I Use?

```text
Do I have correct labels?
        │
   ┌────┴────┐
   │         │
  YES        NO
   │         │
Supervised   Can hidden patterns be discovered?
             │
         ┌───┴────┐
         │        │
        YES      Need labels but only a few?
         │        │
Unsupervised   Semi-supervised
                  │
                  ▼
        Can data create its own labels?
                  │
                  ▼
          Self-supervised
```

If a system learns by trial and error:

```text
State → Action → Reward
```

that is:

> **Reinforcement Learning**

---

# PART 1 — SUPERVISED LEARNING

# 3. Supervised Learning

## Definition

**Supervised Learning** is a type of Machine Learning where the model learns from **labeled data**.

Labeled means:

```text
Input + Correct Output
```

Example:

| Area | Bedrooms | Price |
|---:|---:|---:|
| 1000 | 2 | ₹40 lakh |
| 1500 | 3 | ₹60 lakh |
| 2000 | 4 | ₹80 lakh |

Features:

```text
Area
Bedrooms
```

Label/target:

```text
Price
```

---

# Simple Meaning

> In supervised learning, we teach the model using questions **with answers already provided**.

School analogy:

```text
Teacher gives:
Question + Answer
      ↓
Student learns pattern
      ↓
New Question
      ↓
Student predicts answer
```

---

# Supervised Learning Flow

```text
Labeled Dataset
     │
     ├── Features X
     └── Target y
            │
            ▼
      Learning Algorithm
            │
            ▼
       Trained Model
            │
            ▼
         New X
            │
            ▼
      Prediction ŷ
```

---

# 4. Types of Supervised Learning

There are mainly two.

```text
Supervised Learning
       │
   ┌───┴────┐
   │        │
Regression Classification
```

---

## Regression

Predicts a continuous numerical value.

Examples:

```text
House Price → ₹75 lakh
Salary → ₹55,000
Temperature → 31.5°C
Crop Yield → 4.8 tons
```

---

## Classification

Predicts a category/class.

Examples:

```text
Spam / Not Spam
Fraud / Genuine
Disease / No Disease
Cat / Dog
```

---

# 5. Mathematical Form of Supervised Learning

Training data:

\[
D=
\{(x_i,y_i)\}_{i=1}^{n}
\]

Where:

- \(D\) = dataset
- \(x_i\) = features for sample \(i\)
- \(y_i\) = correct target
- \(n\) = number of samples

Model:

\[
\hat y_i=f_\theta(x_i)
\]

Where:

- \(f_\theta\) = model with parameters \(\theta\)
- \(\hat y_i\) = predicted output

Training objective:

\[
\theta^*
=
\arg\min_\theta
\frac{1}{n}
\sum_{i=1}^{n}
L(y_i,\hat y_i)
\]

Where:

- \(L\) = loss function
- \(\theta^*\) = best learned parameters

---

# 6. Supervised Learning Example in Python

```python
import numpy as np
from sklearn.linear_model import LinearRegression

# Features: hours studied
X = np.array([
    [1],
    [2],
    [3],
    [4],
    [5]
])

# Target: exam score
y = np.array([
    40,
    50,
    60,
    70,
    80
])

model = LinearRegression()

model.fit(X, y)

new_student = np.array([[6]])

prediction = model.predict(new_student)

print("Prediction:", prediction[0])
```

Expected output:

```text
Prediction: 90.0
```

---

# Dry Run

| Hours | Score |
|---:|---:|
| 1 | 40 |
| 2 | 50 |
| 3 | 60 |
| 4 | 70 |
| 5 | 80 |

Pattern:

\[
Score=30+10(Hours)
\]

For 6 hours:

\[
30+10(6)=90
\]

---

# Common Algorithms

Regression:

- Linear Regression
- Decision Tree Regressor
- Random Forest Regressor
- SVR
- Gradient Boosting

Classification:

- Logistic Regression
- KNN
- Naive Bayes
- Decision Tree
- Random Forest
- SVM
- Neural Networks

---

# Real-World Uses

- loan approval
- customer churn
- crop yield prediction
- fraud detection
- medical diagnosis
- demand forecasting

---

# PART 2 — UNSUPERVISED LEARNING

# 7. Unsupervised Learning

## Definition

**Unsupervised Learning** learns patterns from data where **no target labels are given**.

We only have:

\[
X
\]

not:

\[
(X,y)
\]

---

# Easy Meaning

> The model receives data but nobody tells it the correct answer. It tries to discover hidden structure by itself.

---

# Example

Customer data:

| Customer | Income | Spending |
|---|---:|---:|
| A | 20k | 10k |
| B | 25k | 12k |
| C | 90k | 70k |
| D | 95k | 75k |

There is no:

```text
Customer Type
```

column.

The algorithm may discover:

```text
Low income + low spending
→ Group 1

High income + high spending
→ Group 2
```

---

# Visualization

```text
Spending
   ↑
80 |                     ● ●
70 |                    ●
60 |
50 |
40 |
30 |
20 |     ●
10 |   ● ●
   +--------------------------------→ Income

       Cluster 1          Cluster 2
```

---

# Main Unsupervised Tasks

```text
Unsupervised Learning
      │
 ┌────┼────────────┐
 │    │            │
Clustering     Dimensionality
              Reduction
      │
      └──── Anomaly Detection
```

---

# Clustering

Group similar data points.

Examples:

- K-Means
- Hierarchical Clustering
- DBSCAN

---

# Dimensionality Reduction

Reduce number of features while preserving useful information.

Examples:

- PCA
- t-SNE
- UMAP

---

# Anomaly Detection

Find unusual observations.

Example:

```text
Normal transactions
Normal transactions
Normal transactions
₹9,00,000 unusual purchase
        ↑
     anomaly
```

---

# 8. K-Means Formula

K-Means tries to minimize within-cluster distance.

\[
J=
\sum_{j=1}^{K}
\sum_{x_i\in C_j}
||x_i-\mu_j||^2
\]

Where:

- \(K\) = number of clusters
- \(C_j\) = cluster \(j\)
- \(x_i\) = data point
- \(\mu_j\) = centroid of cluster \(j\)
- \(J\) = total cluster error

Easy meaning:

> Put similar points together so each point stays close to its cluster center.

---

# 9. Unsupervised Python Example

```python
import numpy as np
from sklearn.cluster import KMeans

X = np.array([
    [20, 10],
    [25, 12],
    [22, 15],
    [90, 70],
    [95, 75],
    [88, 68]
])

model = KMeans(
    n_clusters=2,
    random_state=42,
    n_init=10
)

labels = model.fit_predict(X)

print("Cluster labels:", labels)
print("Centers:")
print(model.cluster_centers_)
```

---

# Dry Run Concept

Data:

```text
[20,10]
[25,12]
[22,15]
```

are close.

And:

```text
[90,70]
[95,75]
[88,68]
```

are close.

Likely result:

```text
Group A → first 3 customers
Group B → last 3 customers
```

Cluster numbers `0` and `1` have no inherent semantic meaning.

---

# Supervised vs Unsupervised

| Supervised | Unsupervised |
|---|---|
| Has target labels | No target labels |
| Predict answer | Discover structure |
| Regression/classification | Clustering/PCA |
| Needs labeled data | Uses unlabeled data |
| Evaluation easier | Evaluation often harder |

---

# PART 3 — SEMI-SUPERVISED LEARNING

# 10. Semi-Supervised Learning

## Definition

**Semi-supervised learning** uses:

```text
Small amount of labeled data
+
Large amount of unlabeled data
```

---

# Easy Meaning

> We know answers for only a few examples, but we have many examples without answers.

---

# Example

Suppose:

```text
10,000 medical images
```

but doctors labeled only:

```text
500 images
```

Then:

```text
500 labeled
+
9,500 unlabeled
       ↓
Semi-Supervised Learning
```

---

# Diagram

```text
         Dataset
            │
     ┌──────┴──────┐
     │             │
 Labeled         Unlabeled
  10%              90%
     │             │
     └──────┬──────┘
            ▼
   Semi-Supervised Model
            ▼
       Better Model
```

---

# Why Use It?

Labels can be expensive.

Example:

```text
Image collection
→ easy

Expert doctor annotation
→ expensive
```

So unlabeled data can still be useful.

---

# 11. Pseudo-Labeling

One common semi-supervised idea:

```text
Train on labeled data
      ↓
Predict labels for unlabeled data
      ↓
Keep confident predictions
      ↓
Treat as pseudo-labels
      ↓
Retrain model
```

---

# Mathematical Idea

Given labeled data:

\[
D_L=\{(x_i,y_i)\}
\]

and unlabeled data:

\[
D_U=\{x_j\}
\]

Model creates:

\[
\hat y_j=f_\theta(x_j)
\]

If confidence:

\[
P(\hat y_j|x_j)>\tau
\]

then keep pseudo-label.

Where:

- \(\tau\) = confidence threshold

Example:

```text
Prediction:
Cat = 0.98

Threshold:
0.95

0.98 > 0.95
→ use "Cat" as pseudo-label
```

---

# 12. Conceptual Python Example

```python
import numpy as np

unlabeled_predictions = np.array([
    [0.98, 0.02],
    [0.55, 0.45],
    [0.03, 0.97]
])

threshold = 0.95

for probs in unlabeled_predictions:
    confidence = probs.max()
    pseudo_label = probs.argmax()

    if confidence >= threshold:
        print(
            "Use sample:",
            "label =", pseudo_label,
            "confidence =", confidence
        )
    else:
        print("Skip low-confidence sample")
```

---

# Dry Run

| Probabilities | Confidence | Keep? |
|---|---:|---|
| [0.98, 0.02] | 0.98 | Yes |
| [0.55, 0.45] | 0.55 | No |
| [0.03, 0.97] | 0.97 | Yes |

---

# Common Uses

- medical imaging
- speech recognition
- web-page classification
- document classification

---

# PART 4 — SELF-SUPERVISED LEARNING

# 13. Self-Supervised Learning

## Definition

**Self-supervised learning** creates learning targets automatically from the data itself.

No human labels are needed.

---

# Easy Meaning

> The data creates its own questions and answers.

This is extremely important in modern AI.

---

# Example: Language

Sentence:

```text
Machine learning is very useful.
```

Hide a word:

```text
Machine learning is very ____.
```

Target automatically becomes:

```text
useful
```

No human had to manually label it.

---

# Another Example: Next Token Prediction

Input:

```text
Machine learning is
```

Target:

```text
powerful
```

From raw text:

```text
Machine learning is powerful
```

the training pair is created automatically.

---

# Diagram

```text
Raw Data
   ↓
Automatically create task
   ↓
Input           Target
"The sky is"   "blue"
   ↓              ↓
        Model
          ↓
Learn representations
```

---

# 14. Self-Supervised Objective

For next-token modeling:

\[
L=
-\sum_{t=1}^{T}
\log P(x_t|x_{<t})
\]

Where:

- \(x_t\) = correct token
- \(x_{<t}\) = previous tokens
- \(T\) = number of tokens

The model learns to predict a piece of the input from other pieces.

---

# 15. Conceptual Python Example

```python
sentence = "machine learning is powerful"

words = sentence.split()

training_pairs = []

for i in range(1, len(words)):
    input_text = " ".join(words[:i])
    target_word = words[i]

    training_pairs.append(
        (input_text, target_word)
    )

for pair in training_pairs:
    print(pair)
```

Output:

```text
('machine', 'learning')
('machine learning', 'is')
('machine learning is', 'powerful')
```

---

# Dry Run

| Input | Automatically created target |
|---|---|
| machine | learning |
| machine learning | is |
| machine learning is | powerful |

---

# Self-Supervised vs Semi-Supervised

Very common interview confusion.

| Semi-Supervised | Self-Supervised |
|---|---|
| Some human labels | No manual labels needed |
| Uses labeled + unlabeled data | Creates labels from raw data |
| Classification-focused often | Representation/pretraining common |
| Pseudo-labeling possible | Masking/next-token prediction |

---

# Real-World Importance

Self-supervised learning powers many modern systems in:

- language models
- computer vision
- audio representation learning
- multimodal AI

---

# PART 5 — REINFORCEMENT LEARNING

# 16. Reinforcement Learning

## Definition

**Reinforcement Learning (RL)** is a learning method where an agent learns by interacting with an environment and receiving rewards or penalties.

---

# Easy Meaning

> Learn by trial and error.

---

# Core RL Loop

```text
          ┌──────────────────┐
          │                  ▼
        Agent ──Action──► Environment
          ▲                  │
          │                  │
          └── State + Reward─┘
```

---

# Main Components

| Term | Meaning |
|---|---|
| Agent | Learner/decision maker |
| Environment | World |
| State | Current situation |
| Action | Choice |
| Reward | Feedback |
| Policy | Rule for selecting actions |

---

# Example: Robot

```text
State:
Robot at position A

Action:
Move right

Reward:
+5

Next state:
Position B
```

If it hits wall:

```text
Reward = -10
```

Eventually it learns better actions.

---

# 17. RL Return Formula

\[
G_t=
r_{t+1}
+\gamma r_{t+2}
+\gamma^2r_{t+3}
+\dots
\]

Where:

- \(G_t\) = future return
- \(r_t\) = reward
- \(\gamma\) = discount factor
- \(0\le \gamma\le1\)

---

# Example

Rewards:

```text
10, 5, 2
```

\[
\gamma=0.9
\]

Then:

\[
G=10+0.9(5)+0.9^2(2)
\]

\[
=16.12
\]

---

# Python

```python
rewards = [10, 5, 2]

gamma = 0.9

total_return = 0

for step, reward in enumerate(rewards):
    total_return += (
        gamma ** step
    ) * reward

print(total_return)
```

Output:

```text
16.12
```

---

# Dry Run

| Step | Reward | Discount | Contribution |
|---:|---:|---:|---:|
| 0 | 10 | 1 | 10 |
| 1 | 5 | 0.9 | 4.5 |
| 2 | 2 | 0.81 | 1.62 |

---

# 18. Q-Learning Formula

A classic RL update:

\[
Q(s,a)
\leftarrow
Q(s,a)
+
\alpha
[
r+\gamma\max_{a'}Q(s',a')
-
Q(s,a)
]
\]

Where:

- \(Q(s,a)\) = estimated value of action \(a\) in state \(s\)
- \(\alpha\) = learning rate
- \(r\) = immediate reward
- \(\gamma\) = discount factor
- \(s'\) = next state
- \(a'\) = next possible actions

---

# Easy Meaning

```text
New Q
=
Old Q
+
Learning rate
×
(New information - Old estimate)
```

---

# RL Applications

- game playing
- robot control
- recommendation optimization
- resource allocation
- traffic control
- autonomous systems

---

# PART 6 — ONLINE LEARNING

# 19. Online Learning

## Definition

**Online learning** updates a model continuously as new data arrives.

---

# Easy Meaning

> Learn little by little while data keeps coming.

---

# Flow

```text
Initial Model
    ↓
New Sample 1
    ↓
Update
    ↓
New Sample 2
    ↓
Update
    ↓
New Sample 3
    ↓
Update
```

---

# Real-World Example

Fraud detection:

```text
New transactions arrive every second.
```

Fraud patterns change.

Online learning can update the model continuously.

---

# Mathematical Update

A general gradient update:

\[
\theta_{t+1}
=
\theta_t
-
\eta\nabla_\theta L_t
\]

Where:

- \(\theta_t\) = parameters before sample/batch \(t\)
- \(L_t\) = current loss
- \(\eta\) = learning rate
- \(\theta_{t+1}\) = updated parameters

---

# Python Example

```python
import numpy as np
from sklearn.linear_model import SGDRegressor

model = SGDRegressor(
    random_state=42,
    max_iter=1,
    tol=None
)

X_batches = [
    np.array([[1], [2]]),
    np.array([[3], [4]]),
    np.array([[5], [6]])
]

y_batches = [
    np.array([10, 20]),
    np.array([30, 40]),
    np.array([50, 60])
]

for X_batch, y_batch in zip(
    X_batches,
    y_batches
):
    model.partial_fit(
        X_batch,
        y_batch
    )

    print(
        "Current weight:",
        model.coef_[0]
    )
```

`partial_fit()` means:

> Update an existing model using a new batch.

---

# Online Learning Benefits

- handles streaming data
- adapts quickly
- useful for changing environments
- does not require full retraining every time

---

# Problems

- sensitive to bad incoming data
- catastrophic updates possible
- monitoring is crucial

---

# PART 7 — BATCH LEARNING

# 20. Batch Learning

## Definition

**Batch learning** trains a model using a fixed dataset all at once or in a planned offline training process.

---

# Easy Meaning

> Collect data first, then train model.

---

# Flow

```text
Collect Data
     ↓
Complete Dataset
     ↓
Train Model
     ↓
Deploy
     ↓
Use model
```

When more data arrives:

```text
Collect new dataset
      ↓
Retrain later
```

---

# Example

A company retrains its churn model:

```text
Every Sunday at midnight
```

using all available data.

That is batch learning.

---

# Batch vs Online

| Batch Learning | Online Learning |
|---|---|
| Train periodically | Update continuously |
| Fixed dataset | Streaming data |
| Easier to control | More adaptive |
| Higher retraining cost | Frequent small updates |
| Stable | Can react quickly |

---

# Common Uses

Batch:

- yearly risk models
- monthly sales prediction
- offline image classifier

Online:

- ads recommendation
- fraud detection
- real-time personalization

---

# PART 8 — ACTIVE LEARNING

# 21. Active Learning

## Definition

**Active Learning** is a method where the model chooses the most useful unlabeled examples and asks a human/expert to label them.

---

# Easy Meaning

> Instead of labeling everything, label only the examples the model is most confused about.

---

# Example

You have:

```text
1,000,000 medical images
```

Labeling all is expensive.

Model says:

```text
Image 145:
50% disease
50% no disease
```

This is uncertain.

So ask doctor:

```text
"Please label Image 145."
```

---

# Flow

```text
Unlabeled Pool
     ↓
Model predicts
     ↓
Find uncertain examples
     ↓
Human labels them
     ↓
Add to training set
     ↓
Retrain
     ↓
Repeat
```

---

# 22. Uncertainty Sampling

For classification:

\[
Uncertainty(x)
=
1-\max_c P(y=c|x)
\]

Where:

- \(x\) = sample
- \(c\) = class
- \(P(y=c|x)\) = predicted probability

Example:

Sample A:

```text
Cat = 0.99
Dog = 0.01
```

Uncertainty:

\[
1-0.99=0.01
\]

Very certain.

Sample B:

```text
Cat = 0.51
Dog = 0.49
```

Uncertainty:

\[
1-0.51=0.49
\]

Much more uncertain.

Choose Sample B for labeling.

---

# Python

```python
import numpy as np

probabilities = np.array([
    [0.99, 0.01],
    [0.51, 0.49],
    [0.70, 0.30]
])

uncertainty = (
    1 - probabilities.max(axis=1)
)

most_uncertain = np.argmax(
    uncertainty
)

print("Uncertainty:", uncertainty)
print(
    "Ask human to label sample:",
    most_uncertain
)
```

---

# Dry Run

| Sample | Max probability | Uncertainty |
|---:|---:|---:|
| 0 | 0.99 | 0.01 |
| 1 | 0.51 | 0.49 |
| 2 | 0.70 | 0.30 |

Choose:

```text
Sample 1
```

---

# Active Learning Uses

- medical labeling
- legal documents
- rare-event classification
- image annotation
- industrial quality inspection

---

# PART 9 — TRANSFER LEARNING

# 23. Transfer Learning

## Definition

**Transfer learning** means taking knowledge learned for one task and reusing it for another related task.

---

# Easy Meaning

> Don't learn everything from zero. Start from already learned knowledge.

---

# Human Analogy

If you know:

```text
how to ride a bicycle
```

learning:

```text
motorcycle
```

may become easier.

---

# Machine Learning Example

Model trained on millions of general images learns:

- edges
- shapes
- textures
- objects

Then use it for:

```text
Plant Disease Classification
```

---

# Diagram

```text
Large General Dataset
        ↓
    Pretraining
        ↓
  Pretrained Model
        ↓
Replace / Adapt Head
        ↓
Small Domain Dataset
        ↓
    Fine-Tuning
        ↓
Task-Specific Model
```

---

# 24. Feature Extraction vs Fine-Tuning

## Feature Extraction

Freeze pretrained layers.

```text
Pretrained layers
→ frozen

New output layer
→ trained
```

---

## Fine-Tuning

Allow some pretrained layers to update.

```text
Pretrained model
    ↓
Train selected/all layers
    ↓
Adapt to new task
```

---

# Transfer Learning Benefits

- less data required
- faster training
- often better performance
- useful when labels are limited

---

# Conceptual Keras Example

```python
import tensorflow as tf

base_model = tf.keras.applications.MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

# Freeze pretrained layers
base_model.trainable = False

model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(
        1,
        activation="sigmoid"
    )
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["accuracy"]
)
```

---

# Easy Dry Run

```text
MobileNetV2 already knows:
edges
textures
shapes
object patterns

Your dataset:
healthy leaf
diseased leaf

Only final classifier learns:
healthy vs diseased
```

---

# PART 10 — FEDERATED LEARNING

# 25. Federated Learning

## Definition

**Federated Learning** trains a shared model across many devices or organizations while keeping raw data local.

---

# Easy Meaning

> Bring the model to the data instead of bringing all data to one server.

---

# Traditional Centralized Learning

```text
Phone 1 data ─┐
Phone 2 data ─┼──► Central Server
Phone 3 data ─┘
                    ↓
                  Train
```

Privacy concern:

```text
Raw data leaves devices.
```

---

# Federated Learning

```text
        Global Model
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   Phone 1 Phone 2 Phone 3
      │      │      │
 Local    Local   Local
 Train    Train   Train
      │      │      │
      └──────┼──────┘
             ▼
      Model Updates
             ↓
          Server
             ↓
     Aggregate Updates
             ↓
       New Global Model
```

Raw data remains on devices.

---

# 26. Federated Averaging Formula

A common idea:

\[
w_{global}
=
\sum_{k=1}^{K}
\frac{n_k}{N}
w_k
\]

Where:

- \(K\) = number of clients
- \(w_k\) = model parameters from client \(k\)
- \(n_k\) = number of samples on client \(k\)
- \(N=\sum_k n_k\) = total samples
- \(w_{global}\) = aggregated model

---

# Example

Client 1:

```text
100 samples
weight = 2
```

Client 2:

```text
300 samples
weight = 4
```

Then:

\[
N=400
\]

\[
w_{global}
=
\frac{100}{400}(2)
+
\frac{300}{400}(4)
\]

\[
=0.5+3
=3.5
\]

---

# Python Example

```python
client_weights = [
    2.0,
    4.0
]

client_sizes = [
    100,
    300
]

total_samples = sum(
    client_sizes
)

global_weight = 0

for weight, size in zip(
    client_weights,
    client_sizes
):
    global_weight += (
        size / total_samples
    ) * weight

print(global_weight)
```

Output:

```text
3.5
```

---

# Benefits

- better privacy than centralized raw-data collection
- useful for mobile devices
- useful across hospitals/organizations
- data stays local

---

# Important Limitation

Federated learning does **not automatically guarantee privacy**.

Model updates may still leak information unless extra protections are used, such as:

- secure aggregation
- differential privacy
- encryption

---

# PART 11 — MULTI-TASK LEARNING

# 27. Multi-Task Learning

## Definition

**Multi-task learning** trains one model to perform several related tasks at the same time.

---

# Easy Meaning

> One model learns multiple jobs together and shares knowledge between them.

---

# Example

One face model predicts:

```text
Age
Gender category
Emotion
Face landmarks
```

using shared features.

---

# Architecture

```text
                    Input
                      │
                      ▼
               Shared Layers
                      │
          ┌───────────┼────────────┐
          │           │            │
          ▼           ▼            ▼
      Task 1 Head  Task 2 Head  Task 3 Head
         Age        Emotion       Pose
```

---

# Why It Helps

Related tasks can teach useful shared patterns.

Example:

```text
Road Image
  ↓
Shared Vision Model
  ├── Detect cars
  ├── Detect lanes
  └── Detect pedestrians
```

---

# 28. Multi-Task Loss Formula

\[
L_{total}
=
\lambda_1L_1
+
\lambda_2L_2
+\dots+
\lambda_mL_m
\]

Where:

- \(L_j\) = loss for task \(j\)
- \(\lambda_j\) = importance weight
- \(m\) = number of tasks
- \(L_{total}\) = combined training loss

---

# Example

Suppose:

\[
L_{age}=0.4
\]

\[
L_{emotion}=0.8
\]

with:

\[
\lambda_{age}=0.6
\]

\[
\lambda_{emotion}=0.4
\]

Then:

\[
L_{total}
=
0.6(0.4)+0.4(0.8)
\]

\[
=0.24+0.32
=0.56
\]

---

# Python

```python
age_loss = 0.4
emotion_loss = 0.8

age_weight = 0.6
emotion_weight = 0.4

total_loss = (
    age_weight * age_loss
    +
    emotion_weight * emotion_loss
)

print(total_loss)
```

Output:

```text
0.56
```

---

# 29. Multi-Task vs Transfer Learning

| Multi-Task Learning | Transfer Learning |
|---|---|
| Learn several tasks together | Learn one task, reuse knowledge later |
| Simultaneous | Sequential |
| Shared backbone | Pretrained model |
| Multiple outputs | Usually one target task |

---

# 30. Complete Comparison of All Types

| Type | Labels? | Main Idea | Example |
|---|---|---|---|
| Supervised | Yes | Learn input → output | House price |
| Unsupervised | No | Find hidden structure | Customer clusters |
| Semi-supervised | Few labels | Mix labeled + unlabeled | Medical images |
| Self-supervised | Auto-created labels | Data supervises itself | LLM pretraining |
| Reinforcement | Rewards | Trial and error | Game agent |
| Online | Streaming | Update continuously | Fraud detection |
| Batch | Fixed dataset | Train periodically | Monthly forecast |
| Active | Human labels selected points | Ask for useful labels | Medical annotation |
| Transfer | Reuse knowledge | Pretrain → fine-tune | Image classifier |
| Federated | Local data | Train collaboratively | Smartphone models |
| Multi-task | Multiple targets | Share representation | Age + emotion |

---

# 31. One Dataset, Many Learning Styles

Suppose we have customer data.

## Supervised

```text
Inputs:
income, age, spending

Target:
churn yes/no
```

Predict churn.

---

## Unsupervised

No churn labels.

Group customers by behavior.

---

## Semi-supervised

Only 10% churn labels.

Use remaining unlabeled users too.

---

## Self-supervised

Create a task such as:

```text
Predict masked customer activity
from surrounding activity.
```

---

## Reinforcement

Choose an offer.

Reward:

```text
Customer accepts → +10
Ignores → 0
Unsubscribes → -20
```

---

## Online

Update churn model each day.

---

## Batch

Retrain churn model every month.

---

## Active

Ask analysts to label only uncertain customers.

---

## Transfer

Start from a model trained on another related customer dataset.

---

## Federated

Different banks train collaboratively without sharing raw customer records.

---

## Multi-task

Predict simultaneously:

```text
Churn
Lifetime value
Purchase category
```

---

# 32. Complete Graph

```text
                         MACHINE LEARNING
                                │
       ┌────────────────────────┼─────────────────────────┐
       │                        │                         │
   DATA LABELS             FEEDBACK STYLE            UPDATE STYLE
       │                        │                         │
 ┌─────┼────────┐               │                  ┌──────┴──────┐
 │     │        │               │                  │             │
Super  Unsuper  Semi       Reinforcement          Batch        Online
 │              │
 │              └── Labeled + Unlabeled
 │
 └── Labeled

Self-Supervised
│
└── Labels generated from data itself


SPECIAL LEARNING STRATEGIES
        │
 ┌──────┼──────────┬──────────────┐
 │      │          │              │
Active Transfer Federated     Multi-task
```

---

# 33. Colorful Notes for Fast Revision

🟦 **Supervised Learning**

> Teacher gives both questions and answers.

🟨 **Unsupervised Learning**

> No answers. Find hidden groups or patterns.

🟩 **Semi-Supervised Learning**

> A few answers + lots of unanswered data.

🟪 **Self-Supervised Learning**

> Data automatically creates its own targets.

🟥 **Reinforcement Learning**

> Learn from rewards and penalties.

🟧 **Online Learning**

> Keep learning as new data arrives.

🟫 **Batch Learning**

> Train on collected data at fixed times.

⬜ **Active Learning**

> Ask humans to label only the most useful samples.

🟦 **Transfer Learning**

> Reuse knowledge from another task.

🟩 **Federated Learning**

> Keep raw data local and share model updates.

🟪 **Multi-Task Learning**

> One model learns several related tasks together.

---

# 34. Common Mistakes

## Mistake 1: Supervised means human watches the model while it trains

Wrong.

Supervised means:

```text
Training examples contain labels.
```

---

## Mistake 2: Unsupervised means no training

Wrong.

The model still learns from data; there simply are no target labels.

---

## Mistake 3: Clustering is supervised

No.

Clustering normally has no predefined target.

---

## Mistake 4: Semi-supervised and self-supervised are the same

No.

```text
Semi-supervised:
Some manual labels + unlabeled data

Self-supervised:
Targets created automatically from data
```

---

## Mistake 5: Reinforcement Learning requires labeled datasets

Not in the standard supervised sense.

It learns from:

```text
rewards
```

---

## Mistake 6: Online learning means model is hosted online

No.

"Online" means the model updates incrementally as new data arrives.

---

## Mistake 7: Batch size and batch learning are the same concept

No.

`batch_size=32` is a training hyperparameter.

**Batch learning** refers to offline/fixed-dataset training strategy.

---

## Mistake 8: Transfer learning means copying another model blindly

No.

The source model should provide useful transferable representations.

---

## Mistake 9: Fine-tuning and transfer learning are identical

Fine-tuning is one common way to perform transfer learning.

Transfer learning is the broader concept.

---

## Mistake 10: Federated learning means data is perfectly private

No.

Raw data staying local improves privacy, but updates can still leak information.

---

## Mistake 11: Active learning means the model learns continuously

Not exactly.

Active learning is about choosing **which examples should be labeled**.

---

## Mistake 12: Multi-task learning always improves every task

No.

Unrelated tasks can interfere with each other.

This is called:

> **negative transfer**

---

# 35. Advantages and Disadvantages

## Supervised Learning

Advantages:

- clear objective
- easy evaluation
- strong predictive performance

Disadvantages:

- requires labels
- labeling may be costly

---

## Unsupervised Learning

Advantages:

- no labels required
- discovers hidden structure

Disadvantages:

- difficult to evaluate
- clusters may not have real business meaning

---

## Semi-Supervised

Advantages:

- reduces labeling requirement

Disadvantages:

- incorrect pseudo-labels may reinforce mistakes

---

## Self-Supervised

Advantages:

- uses huge unlabeled datasets
- strong representation learning

Disadvantages:

- often computationally expensive

---

## Reinforcement

Advantages:

- learns sequential decisions
- useful where actions affect future states

Disadvantages:

- reward design is difficult
- exploration can be expensive

---

## Online

Advantages:

- adapts quickly

Disadvantages:

- dangerous data can corrupt model
- monitoring essential

---

## Batch

Advantages:

- stable
- easy to reproduce

Disadvantages:

- cannot immediately adapt

---

## Active

Advantages:

- reduces labeling costs

Disadvantages:

- still needs experts
- selected samples may be biased

---

## Transfer

Advantages:

- less data
- faster training

Disadvantages:

- source model may not match target domain

---

## Federated

Advantages:

- keeps raw data local

Disadvantages:

- communication complexity
- heterogeneous clients
- privacy still needs protection

---

## Multi-Task

Advantages:

- shared knowledge
- one model can solve many related tasks

Disadvantages:

- tasks can conflict
- loss balancing is difficult

---

# 36. Interview Questions and Answers

## Q1. What are the major types of Machine Learning?

The classical major types are:

- supervised
- unsupervised
- semi-supervised
- reinforcement learning

Modern ML also includes self-supervised, online, active, transfer, federated and multi-task learning.

---

## Q2. What is supervised learning?

Supervised learning trains on labeled examples containing inputs and correct outputs.

---

## Q3. Give examples of supervised learning.

- house-price prediction
- spam detection
- disease classification
- churn prediction

---

## Q4. What are the two main supervised tasks?

Regression and classification.

---

## Q5. Regression vs classification?

Regression predicts continuous numerical values.

Classification predicts categories.

---

## Q6. What is unsupervised learning?

Learning patterns from data without predefined target labels.

---

## Q7. Main unsupervised tasks?

- clustering
- dimensionality reduction
- anomaly detection

---

## Q8. What is clustering?

Grouping similar observations together.

---

## Q9. What is semi-supervised learning?

Training using a small labeled dataset plus a larger unlabeled dataset.

---

## Q10. When is semi-supervised learning useful?

When unlabeled data is abundant but human labeling is expensive.

---

## Q11. What is self-supervised learning?

A method where training targets are generated automatically from the raw data itself.

---

## Q12. Give an example of self-supervised learning.

Predicting the next token in a text sequence.

---

## Q13. Self-supervised vs unsupervised?

Both may use unlabeled data, but self-supervised learning creates a supervised-style prediction task from the data itself.

---

## Q14. Semi-supervised vs self-supervised?

Semi-supervised uses some human labels.

Self-supervised does not require human labels for its pretraining objective.

---

## Q15. What is reinforcement learning?

An agent learns actions by interacting with an environment and maximizing accumulated reward.

---

## Q16. Main RL components?

- agent
- environment
- state
- action
- reward
- policy

---

## Q17. What is reward?

Numerical feedback measuring the immediate value of an action.

---

## Q18. What is the discount factor?

\[
\gamma
\]

It determines how strongly future rewards influence present decisions.

---

## Q19. What is online learning?

A model is incrementally updated as new data arrives.

---

## Q20. What is batch learning?

The model is trained offline using a fixed dataset and updated periodically.

---

# 37. Advanced Interview Questions

## Q21. Online vs batch learning?

Online:

```text
Continuous/incremental updates
```

Batch:

```text
Periodic full training
```

---

## Q22. What is active learning?

The model selects informative unlabeled samples and requests labels from an oracle, usually a human expert.

---

## Q23. What is uncertainty sampling?

Choosing samples where the model has the least prediction confidence.

---

## Q24. What is transfer learning?

Reusing knowledge learned from one task or dataset for another related task.

---

## Q25. Why is transfer learning useful?

Because it can reduce:

- training time
- required labeled data
- computational cost

---

## Q26. What is fine-tuning?

Further training a pretrained model on task-specific data.

---

## Q27. Feature extraction vs fine-tuning?

Feature extraction freezes pretrained layers.

Fine-tuning updates some or all pretrained weights.

---

## Q28. What is federated learning?

Multiple clients jointly train a model while keeping raw data local.

---

## Q29. Why use federated learning?

For scenarios involving distributed sensitive data, such as phones, hospitals or banks.

---

## Q30. Does federated learning guarantee privacy?

No. Additional protections may still be required.

---

## Q31. What is multi-task learning?

One model learns multiple related tasks simultaneously using shared representations.

---

## Q32. What is negative transfer?

When knowledge sharing between tasks harms performance because the tasks are not sufficiently related.

---

# 38. Scenario-Based Interview Questions

## Scenario 1

You have:

```text
10,000 houses
with area, rooms and actual price.
```

Which learning type?

> **Supervised learning**, specifically regression.

---

## Scenario 2

You have customer data but no customer categories.

You want to discover groups.

> **Unsupervised learning**, probably clustering.

---

## Scenario 3

You have 100,000 images but only 2,000 are labeled.

> **Semi-supervised learning** may help.

---

## Scenario 4

You have billions of text sentences without human labels and want to pretrain a language model.

> **Self-supervised learning**.

---

## Scenario 5

A robot learns to walk using reward for moving forward and penalty for falling.

> **Reinforcement learning**.

---

## Scenario 6

A fraud model updates every hour as new transactions arrive.

> **Online learning**.

---

## Scenario 7

A company retrains its sales forecasting model once every month.

> **Batch learning**.

---

## Scenario 8

A doctor can label only 100 X-rays. The model chooses which X-rays are most uncertain.

> **Active learning**.

---

## Scenario 9

You take a pretrained image network and adapt it to crop disease detection.

> **Transfer learning**.

---

## Scenario 10

Five hospitals collaboratively train a model but cannot share patient data.

> **Federated learning**.

---

## Scenario 11

One neural network predicts age, emotion and facial landmarks together.

> **Multi-task learning**.

---

# 39. Complete Practical Mini Project

Let's combine supervised, unsupervised and online learning concepts.

```python
import numpy as np

from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.linear_model import SGDRegressor


# ==================================================
# PART 1: SUPERVISED LEARNING
# ==================================================

X_supervised = np.array([
    [1],
    [2],
    [3],
    [4],
    [5]
])

y_supervised = np.array([
    10,
    20,
    30,
    40,
    50
])

supervised_model = LinearRegression()

supervised_model.fit(
    X_supervised,
    y_supervised
)

prediction = supervised_model.predict(
    [[6]]
)

print(
    "Supervised prediction:",
    prediction[0]
)


# ==================================================
# PART 2: UNSUPERVISED LEARNING
# ==================================================

customers = np.array([
    [20, 10],
    [25, 15],
    [22, 11],
    [90, 70],
    [95, 75],
    [88, 68]
])

cluster_model = KMeans(
    n_clusters=2,
    random_state=42,
    n_init=10
)

clusters = cluster_model.fit_predict(
    customers
)

print(
    "Unsupervised clusters:",
    clusters
)


# ==================================================
# PART 3: ONLINE LEARNING
# ==================================================

online_model = SGDRegressor(
    random_state=42,
    max_iter=1,
    tol=None
)

online_batches_X = [
    np.array([[1], [2]]),
    np.array([[3], [4]]),
    np.array([[5], [6]])
]

online_batches_y = [
    np.array([10, 20]),
    np.array([30, 40]),
    np.array([50, 60])
]

for batch_number, (
    X_batch,
    y_batch
) in enumerate(
    zip(
        online_batches_X,
        online_batches_y
    ),
    start=1
):
    online_model.partial_fit(
        X_batch,
        y_batch
    )

    print(
        f"After batch {batch_number}:",
        online_model.coef_[0]
    )
```

---

# 40. Mini Project Dry Run

## Supervised

```text
X = hours
y = score
```

Model sees:

```text
1 → 10
2 → 20
...
```

Predict:

```text
6 → 60
```

---

## Unsupervised

Customers naturally form:

```text
Group 1:
low income/spending

Group 2:
high income/spending
```

No customer-category labels were supplied.

---

## Online

```text
Batch 1 arrives
→ update model

Batch 2 arrives
→ update same model

Batch 3 arrives
→ update again
```

No full retraining from scratch is required.

---

# 41. Formula Revision Sheet

## Supervised objective

\[
\boxed{
\theta^*
=
\arg\min_\theta
\frac1n
\sum_{i=1}^{n}
L(y_i,f_\theta(x_i))
}
\]

---

## K-Means

\[
\boxed{
J=
\sum_{j=1}^{K}
\sum_{x_i\in C_j}
||x_i-\mu_j||^2
}
\]

---

## Pseudo-label confidence

\[
\boxed{
P(\hat y|x)\ge\tau
}
\]

---

## Self-supervised next-token loss

\[
\boxed{
L=
-\sum_t
\log P(x_t|x_{<t})
}
\]

---

## Reinforcement return

\[
\boxed{
G_t=
\sum_{k=0}^{\infty}
\gamma^k r_{t+k+1}
}
\]

---

## Q-Learning

\[
\boxed{
Q(s,a)
\leftarrow
Q(s,a)
+
\alpha
[
r+\gamma\max_{a'}Q(s',a')
-Q(s,a)
]
}
\]

---

## Online update

\[
\boxed{
\theta_{t+1}
=
\theta_t-\eta\nabla L_t
}
\]

---

## Active-learning uncertainty

\[
\boxed{
U(x)=1-\max_cP(c|x)
}
\]

---

## Federated averaging

\[
\boxed{
w=
\sum_{k=1}^{K}
\frac{n_k}{N}w_k
}
\]

---

## Multi-task loss

\[
\boxed{
L_{total}
=
\sum_{j=1}^{m}
\lambda_jL_j
}
\]

---

# 42. Final Memory Table

| Type | Easy Sentence |
|---|---|
| Supervised | Learn with answers |
| Unsupervised | Learn without answers |
| Semi-supervised | Few answers + lots of no-answer data |
| Self-supervised | Data creates its own answers |
| Reinforcement | Learn through reward |
| Online | Learn continuously |
| Batch | Learn periodically |
| Active | Ask for the most useful labels |
| Transfer | Reuse previous knowledge |
| Federated | Learn together without centralizing raw data |
| Multi-task | Learn many related jobs together |

---

# 43. Best Memory Diagram

```text
                    TYPES OF MACHINE LEARNING

                         DATA LABELS
                             │
              ┌──────────────┼──────────────┐
              │              │              │
           Labeled       Unlabeled       Mixed
              │              │              │
              ▼              ▼              ▼
         Supervised     Unsupervised   Semi-Supervised

Raw unlabeled data
      │
Create targets automatically
      ▼
Self-Supervised


Decision + Feedback
      │
State → Action → Reward
      ▼
Reinforcement


TRAINING UPDATE STYLE
      │
  ┌───┴────┐
  ▼        ▼
Batch    Online


SPECIAL STRATEGIES
      │
 ┌────┼──────────┬────────────┐
 ▼    ▼          ▼            ▼
Active Transfer Federated Multi-task
```

# Best Interview Answer: “Explain the Types of Machine Learning”

> **Machine Learning can be divided into several learning paradigms. Supervised learning trains on labeled input-output pairs and is mainly used for regression and classification. Unsupervised learning uses unlabeled data to discover hidden structures such as clusters or lower-dimensional representations. Semi-supervised learning combines a small labeled dataset with a larger unlabeled dataset, while self-supervised learning automatically creates training targets from raw data and is widely used for modern pretraining. Reinforcement learning allows an agent to learn through actions, rewards and interaction with an environment. Batch learning trains periodically on collected datasets, whereas online learning updates models incrementally as data arrives. Active learning asks humans to label only informative examples, transfer learning reuses knowledge from pretrained models, federated learning trains across distributed clients without centralizing raw data, and multi-task learning trains related tasks jointly using shared representations.**

## Final 11 lines to memorize

```text
Supervised      = labeled data
Unsupervised    = unlabeled data
Semi-supervised = few labels + many unlabeled
Self-supervised = labels generated from data
Reinforcement   = rewards
Online          = continuous updates
Batch           = periodic training
Active          = model chooses what humans label
Transfer        = reuse knowledge
Federated       = data stays local
Multi-task      = one model, several tasks
```
