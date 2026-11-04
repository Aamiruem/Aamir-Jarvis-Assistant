> **You asked:**
>
> Chapter 67: LLM Fine-Tuning
> Topics
> Full fine-tuning
> Parameter-efficient fine-tuning
> LoRA
> QLoRA
> Adapters
> Quantisation
> Instruction datasets
> Training-data formatting
> Evaluation
> Overfitting
> Checkpoints         Explain the chapter <chapter name/topic> in detail.Break down all concepts step by step in very simple language.Include:
>
> Clear definitions of each concept
>
> Important formulas with parameter names explained
>
> Real-world examples for each concept
>
> Visualizations or diagrams to make it intuitive
>
> Conceptual code examples (Python preferred) with dry run tables
>
> Common mistakes and how to avoid them
>
> Interview-style questions with answers for practiceMake the explanation very conceptual, beginner-friendly, and structured like a study guide.

# Chapter 67: LLM Fine-Tuning — Complete Study Guide

## 1. What is LLM Fine-Tuning?

**LLM fine-tuning** means taking an already pretrained Large Language Model and training it further on a smaller, more specific dataset so that it performs better for a particular task, domain, style, or behavior.

In simple words:

> **Pretraining teaches the model general language. Fine-tuning teaches it your specific task.**

Example:

```text
Pretrained LLM
    ↓
Knows general language, coding, facts, patterns
    ↓
Fine-tune on customer-support conversations
    ↓
Customer-Support LLM
```

Another example:

```text
General LLM
   +
Medical instruction dataset
   ↓
Fine-tuning
   ↓
Model better adapted to medical terminology
```

Fine-tuning does **not** automatically guarantee correctness, safety, or fresh knowledge. It changes model behavior by updating some or all model parameters.

---

# 2. Why Fine-Tune an LLM?

You may fine-tune when you need the model to become better at:

- a specific writing style
- domain terminology
- classification
- structured responses
- company-specific workflows
- instruction following
- consistent tone
- code generation for a narrow framework
- extracting fields from documents
- responding in a special format

Example:

Suppose a general model gives:

```text
Customer:
My payment failed.

General model:
Try checking your payment method.
```

After fine-tuning on company support examples:

```text
Customer:
My payment failed.

Fine-tuned model:
Please verify whether your card supports online transactions.
If the issue continues, share the transaction reference ID.
```

The behavior becomes more aligned with the desired workflow.

---

# 3. Overall Fine-Tuning Pipeline

```text
Pretrained LLM
      ↓
Prepare instruction dataset
      ↓
Clean and format data
      ↓
Tokenize
      ↓
Choose tuning method
      │
      ├── Full Fine-Tuning
      ├── LoRA
      ├── QLoRA
      └── Adapters
      ↓
Training
      ↓
Validation
      ↓
Checkpoint
      ↓
Evaluation
      ↓
Best model
      ↓
Deployment
```

---

# 4. Pretraining vs Fine-Tuning

| Pretraining | Fine-Tuning |
|---|---|
| Starts from random or initial parameters | Starts from pretrained model |
| Uses huge datasets | Uses smaller task-specific dataset |
| Very expensive | Usually much cheaper |
| Learns general language patterns | Learns specific behavior |
| Takes significant compute | Can sometimes run on modest hardware |
| Produces foundation model | Produces adapted model |

---

# 5. Full Fine-Tuning

## Definition

**Full fine-tuning** means updating **all trainable parameters** of the pretrained model.

Suppose an LLM has:

```text
7 billion parameters
```

During full fine-tuning:

```text
All 7 billion parameters may receive gradient updates.
```

Conceptually:

```text
Pretrained Model
    │
    ├── Layer 1 weights   → updated
    ├── Layer 2 weights   → updated
    ├── Layer 3 weights   → updated
    ├── ...
    └── Output layer      → updated
```

---

# How Full Fine-Tuning Works

```text
Input
  ↓
Model
  ↓
Prediction
  ↓
Compare with desired output
  ↓
Loss
  ↓
Backpropagation
  ↓
Update every trainable parameter
```

---

# Basic Parameter Update Formula

Gradient descent:

\[
\theta_{new}
=
\theta_{old}
-
\eta \nabla_\theta L
\]

Where:

- \(\theta\) = model parameters
- \(\eta\) = learning rate
- \(L\) = loss function
- \(\nabla_\theta L\) = gradient of loss with respect to parameters

Example:

Suppose:

\[
\theta_{old}=2.0
\]

\[
\eta=0.01
\]

\[
\nabla_\theta L=0.5
\]

Then:

\[
\theta_{new}
=
2.0-(0.01)(0.5)
\]

\[
=1.995
\]

---

# Advantages

- maximum flexibility
- can strongly adapt model behavior
- useful with enough data and compute
- may perform best in some domain-specific tasks

---

# Disadvantages

- expensive GPU memory usage
- slower training
- large checkpoints
- risk of catastrophic forgetting
- greater overfitting risk
- harder to maintain many task-specific variants

---

# Real-World Analogy

Imagine a highly trained employee.

Full fine-tuning is like:

> retraining the employee's entire knowledge and working style.

PEFT methods are more like:

> teaching the employee a small new specialized procedure without rewriting everything they know.

---

# 6. Parameter-Efficient Fine-Tuning — PEFT

## Definition

**Parameter-Efficient Fine-Tuning (PEFT)** means updating only a small portion of the model instead of all parameters.

Examples include:

- LoRA
- QLoRA
- Adapters
- Prefix tuning
- Prompt tuning

In this chapter, focus on:

```text
LoRA
QLoRA
Adapters
```

---

# Core Idea

Instead of:

```text
Update 7,000,000,000 parameters
```

you might train only:

```text
5,000,000 parameters
```

while freezing the base model.

```text
Base LLM
   │
   ├── Frozen weights
   ├── Frozen weights
   ├── Trainable LoRA weights
   ├── Frozen weights
   └── Trainable LoRA weights
```

---

# Percentage of Trainable Parameters

\[
Trainable\% =
\frac{Trainable\ Parameters}
{Total\ Parameters}
\times 100
\]

Example:

\[
Total=7,000,000,000
\]

\[
Trainable=7,000,000
\]

Then:

\[
Trainable\%
=
\frac{7,000,000}{7,000,000,000}\times100
\]

\[
=0.1\%
\]

So only about 0.1% of parameters are trained.

---

# Why PEFT Matters

PEFT can reduce:

- VRAM usage
- training time
- storage
- deployment complexity

while retaining much of the model's original knowledge.

---

# 7. LoRA — Low-Rank Adaptation

## Full Form

**LoRA = Low-Rank Adaptation**

## Definition

LoRA freezes the original large weight matrix and learns a small low-rank update.

Instead of modifying:

\[
W
\]

directly, LoRA learns:

\[
\Delta W
\]

such that:

\[
W' = W + \Delta W
\]

But rather than storing a full-sized \(\Delta W\), LoRA represents it using two smaller matrices:

\[
\Delta W = BA
\]

Therefore:

\[
W' = W + BA
\]

---

# Dimensions

Suppose original weight matrix:

\[
W \in \mathbb{R}^{d_{out}\times d_{in}}
\]

LoRA uses:

\[
A \in \mathbb{R}^{r\times d_{in}}
\]

and:

\[
B \in \mathbb{R}^{d_{out}\times r}
\]

where:

- \(d_{in}\) = input dimension
- \(d_{out}\) = output dimension
- \(r\) = LoRA rank
- usually \(r\ll d_{in},d_{out}\)

---

# Why Is It Called Low-Rank?

Because:

```text
Original matrix:
4096 × 4096

LoRA:
4096 × 8
+
8 × 4096
```

Instead of learning:

\[
4096\times4096
=
16,777,216
\]

parameters, LoRA learns roughly:

\[
4096\times8 + 8\times4096
\]

\[
=65,536
\]

parameters.

Huge reduction.

---

# LoRA Scaling Formula

A common formulation is:

\[
y = Wx + \frac{\alpha}{r}BAx
\]

Where:

- \(W\) = frozen original weights
- \(x\) = input vector
- \(A,B\) = trainable LoRA matrices
- \(r\) = rank
- \(\alpha\) = LoRA scaling parameter

The factor:

\[
\frac{\alpha}{r}
\]

controls the strength of the LoRA update.

---

# LoRA Diagram

```text
Input x
   │
   ├──────────────► Frozen W ──────┐
   │                               │
   └► A ─► B ─► scale ─────────────┤
                                   ▼
                                Add
                                   │
                                   ▼
                                Output
```

---

# Example

Suppose:

```text
Base LLM
   ↓
LoRA fine-tuning on SQL examples
   ↓
Model becomes better at SQL generation
```

Only small LoRA matrices are saved.

---

# Important LoRA Parameters

## 1. Rank `r`

Controls size/capacity of LoRA matrices.

Example:

```python
r = 8
```

Higher `r`:

- more trainable parameters
- more expressive capacity
- more memory

Lower `r`:

- fewer parameters
- cheaper
- may be insufficient for complex adaptation

---

## 2. Alpha `lora_alpha`

Scaling factor.

Example:

```python
lora_alpha = 16
```

Scaling:

\[
scale = \frac{\alpha}{r}
\]

If:

\[
\alpha=16,\quad r=8
\]

then:

\[
scale=2
\]

---

## 3. Dropout

```python
lora_dropout = 0.05
```

Randomly drops part of LoRA activations during training to help regularization.

---

## 4. Target Modules

Defines which layers receive LoRA.

Examples:

```text
q_proj
k_proj
v_proj
o_proj
```

Often attention projection layers are targeted.

---

# Conceptual LoRA Code

```python
from peft import LoraConfig

config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"]
)
```

Meaning:

```text
r=8
→ low-rank dimension is 8

alpha=16
→ scales the update

dropout=0.05
→ regularization

target_modules
→ LoRA is inserted into selected layers
```

---

# Dry Run

| Parameter | Value | Meaning |
|---|---:|---|
| `r` | 8 | low-rank size |
| `alpha` | 16 | scaling factor |
| `alpha/r` | 2 | effective scale |
| dropout | 0.05 | 5% dropout |
| target | q/v projections | layers adapted |

---

# 8. QLoRA

## Full Form

**QLoRA = Quantized Low-Rank Adaptation**

## Definition

QLoRA combines:

```text
Quantized base model
+
LoRA adapters
```

The base model is loaded in a low-bit representation, often 4-bit, while LoRA parameters are trained with higher precision.

---

# Concept

Standard LoRA:

```text
16-bit Base Model
      +
Trainable LoRA
```

QLoRA:

```text
4-bit Quantized Base Model
      +
Trainable LoRA
```

This dramatically reduces GPU memory requirements.

---

# QLoRA Architecture

```text
Original LLM
    ↓
Quantise weights
    ↓
4-bit frozen base model
    ↓
Attach LoRA layers
    ↓
Train only LoRA
    ↓
Save LoRA adapter
```

---

# Why QLoRA Is Useful

Suppose a model requires too much VRAM for full precision.

QLoRA can make fine-tuning possible on smaller GPUs because base model weights consume much less memory.

---

# Quantized Value Concept

Suppose values are:

```text
0.12
0.34
0.56
0.78
```

Instead of storing each as a 32-bit floating number, quantization maps them to a smaller set of values.

Conceptually:

```text
0.12 → 0
0.34 → 1
0.56 → 2
0.78 → 3
```

with associated scale information used to approximate the original numbers.

---

# Conceptual QLoRA Code

```python
from transformers import BitsAndBytesConfig

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype="float16"
)
```

Conceptually:

```text
load_in_4bit=True
→ store base weights in 4-bit form

nf4
→ specialized 4-bit format

compute dtype
→ arithmetic can still use higher precision
```

Actual supported settings depend on the library and hardware.

---

# LoRA vs QLoRA

| LoRA | QLoRA |
|---|---|
| Base model may remain 16/32-bit | Base model quantized |
| Higher memory use | Lower memory use |
| Trains LoRA parameters | Trains LoRA parameters |
| Good when GPU memory is sufficient | Excellent for limited VRAM |

---

# 9. Adapters

## Definition

**Adapters** are small trainable neural network modules inserted inside a pretrained model while the original model weights remain mostly frozen.

Conceptually:

```text
Transformer Layer
      ↓
Adapter
      ↓
Transformer Layer
      ↓
Adapter
```

---

# Adapter Structure

A simple adapter often works like:

```text
Input
 ↓
Down-project
 ↓
Small hidden dimension
 ↓
Activation
 ↓
Up-project
 ↓
Add residual
```

Mathematically:

\[
h' = h + W_{up}\sigma(W_{down}h)
\]

Where:

- \(h\) = original hidden representation
- \(W_{down}\) = projection to smaller dimension
- \(\sigma\) = activation function
- \(W_{up}\) = projection back
- \(h'\) = adapted representation

---

# Example

Suppose hidden size:

```text
4096
```

Adapter bottleneck:

```text
64
```

Then:

```text
4096 → 64 → 4096
```

Only these smaller adapter weights are trained.

---

# LoRA vs Adapters

| LoRA | Adapters |
|---|---|
| Modifies weight computation through low-rank update | Inserts small neural modules |
| Very popular for LLM tuning | Also widely used in transfer learning |
| Often applied to attention projections | Added between/inside layers |
| Lightweight checkpoints | Lightweight checkpoints |

---

# 10. Quantisation

## Definition

**Quantisation** reduces the numerical precision used to store or compute model weights.

Example:

```text
FP32 → FP16 → INT8 → INT4
```

Lower precision means:

- lower memory
- often faster inference
- possible quality loss

---

# Bits Per Parameter

If a model contains:

\[
N
\]

parameters and each parameter uses:

\[
b
\]

bits, raw storage is approximately:

\[
Storage_{bits}=N\times b
\]

Convert to bytes:

\[
Storage_{bytes}=\frac{N\times b}{8}
\]

---

# Example

Model:

\[
N=7\ billion
\]

Using FP16:

\[
b=16
\]

Approximate storage:

\[
7\times10^9\times16/8
\]

\[
=14\times10^9\ bytes
\]

roughly 14 GB of raw parameter storage.

Using 4-bit:

\[
7\times10^9\times4/8
\]

\[
=3.5\times10^9\ bytes
\]

roughly 3.5 GB raw parameter storage.

Actual runtime memory is usually higher because of:

- metadata
- activations
- optimizer states
- temporary tensors
- quantization scales

---

# Types of Precision

## FP32

32-bit floating point.

High precision, high memory.

## FP16

16-bit floating point.

Lower memory, commonly used for deep learning.

## BF16

16-bit format with a larger exponent range than FP16.

Common in modern accelerators.

## INT8

8-bit integer representation.

Often used for inference quantization.

## INT4 / 4-bit

Very compact representation.

Common in QLoRA and memory-efficient inference.

---

# Quantisation Diagram

```text
Original weights

0.12581
0.44123
0.78301
0.90341

      ↓ Quantize

Low-bit levels

0
2
5
7
```

The system stores scale/offset information to approximately reconstruct values during computation.

---

# Quantisation Error

Conceptually:

\[
Error = |x-\hat{x}|
\]

Where:

- \(x\) = original value
- \(\hat{x}\) = quantized approximation

Example:

\[
x=0.78
\]

\[
\hat{x}=0.75
\]

Then:

\[
Error=|0.78-0.75|=0.03
\]

---

# 11. Instruction Datasets

## Definition

An **instruction dataset** contains examples showing:

```text
Instruction
+
Input/context
+
Desired response
```

Example:

```json
{
  "instruction": "Classify the sentiment.",
  "input": "The product is excellent.",
  "output": "Positive"
}
```

---

# Common Dataset Structures

## Format 1: Instruction + Input + Output

```json
{
  "instruction": "Translate to Hindi",
  "input": "Good morning",
  "output": "सुप्रभात"
}
```

---

## Format 2: Question + Answer

```json
{
  "question": "What is overfitting?",
  "answer": "Overfitting occurs when..."
}
```

---

## Format 3: Chat Format

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a Python tutor."
    },
    {
      "role": "user",
      "content": "Explain list comprehension."
    },
    {
      "role": "assistant",
      "content": "A list comprehension is..."
    }
  ]
}
```

---

# Good Instruction Dataset Properties

A strong dataset should be:

- accurate
- clean
- diverse
- task-relevant
- consistently formatted
- representative of real users
- free of duplicated or contradictory examples

---

# Quality vs Quantity

More data is not always better.

```text
100,000 noisy examples
```

can be worse than:

```text
10,000 carefully curated examples
```

For supervised fine-tuning:

> **Data quality is extremely important.**

---

# 12. Training-Data Formatting

## Definition

Training-data formatting means converting raw examples into the exact text or message representation expected by the tokenizer/model.

Example source:

```json
{
  "instruction": "Explain Python lists",
  "response": "A list is..."
}
```

Could be formatted as:

```text
### Instruction:
Explain Python lists

### Response:
A list is...
```

---

# Chat Template Example

Conceptually:

```text
<system>
You are a tutor.

<user>
Explain overfitting.

<assistant>
Overfitting occurs when...
```

Real models can use specific special tokens, so formatting should match the model's expected chat template.

---

# Why Formatting Matters

If a model was instruction-tuned using:

```text
User:
...

Assistant:
...
```

but you train it with inconsistent random formats, performance may suffer.

---

# Python Formatting Example

```python
def format_example(example):
    return f"""
### Instruction:
{example['instruction']}

### Input:
{example['input']}

### Response:
{example['output']}
""".strip()


sample = {
    "instruction": "Classify sentiment",
    "input": "This laptop is excellent.",
    "output": "Positive"
}

print(format_example(sample))
```

Output:

```text
### Instruction:
Classify sentiment

### Input:
This laptop is excellent.

### Response:
Positive
```

---

# Dry Run

| Step | Value |
|---|---|
| instruction | Classify sentiment |
| input | laptop is excellent |
| output | Positive |
| template | combines all fields |
| final result | training string |

---

# 13. Tokenization for Fine-Tuning

Formatted text must be converted into tokens.

```text
Training text
    ↓
Tokenizer
    ↓
Token IDs
    ↓
Model
```

Conceptually:

```python
tokenized = tokenizer(
    text,
    truncation=True,
    max_length=1024
)
```

---

# Important Parameters

## `max_length`

Maximum sequence length.

## `truncation`

Cuts sequences that exceed maximum length.

## `padding`

Adds padding so sequences in a batch can have compatible lengths.

---

# Example

```text
Original:
[12, 45, 67]

Padded:
[12, 45, 67, 0, 0]
```

where:

```text
0 = padding token
```

depending on tokenizer.

---

# 14. Labels and Loss Masking

For instruction fine-tuning, you may want the model to learn mainly from the assistant response rather than from prompt tokens.

Suppose:

```text
User:
What is AI?

Assistant:
AI is Artificial Intelligence.
```

Token sequence:

```text
[User tokens][Assistant tokens]
```

Labels may conceptually be:

```text
[-100, -100, -100, 501, 207, 844, ...]
```

`-100` is commonly used in PyTorch losses to mean:

> ignore this token when computing loss.

---

# Diagram

```text
Prompt tokens     Response tokens
████████████      █████████████

Ignore loss       Compute loss
```

This prevents the model from being penalized for prompt text it is not supposed to predict as output.

---

# 15. Fine-Tuning Loss

For causal language modeling, the model predicts the next token.

Cross-entropy loss:

\[
L
=
-\sum_{t=1}^{T}
\log P(y_t|y_{<t},x)
\]

Where:

- \(L\) = total loss
- \(T\) = number of target tokens
- \(y_t\) = correct token at position \(t\)
- \(y_{<t}\) = previous target tokens
- \(x\) = prompt/input context
- \(P\) = model probability

Often average loss is used:

\[
L_{avg}
=
-\frac{1}{T}
\sum_{t=1}^{T}\log P(y_t|\cdots)
\]

Lower validation loss usually indicates better fit, though task-specific evaluation is also important.

---

# 16. Perplexity

Perplexity is a common language-model metric.

\[
Perplexity = e^{L}
\]

Where:

- \(L\) = average cross-entropy loss

Example:

If:

\[
L=2
\]

then:

\[
Perplexity=e^2\approx7.39
\]

Lower perplexity generally means the model is less surprised by the evaluation text.

But:

> low perplexity does not automatically mean the model is useful, factual, safe, or aligned.

---

# 17. Evaluation

## Definition

**Evaluation** checks whether the fine-tuned model actually improved.

Never judge a fine-tuned model using only training loss.

You should evaluate on **unseen validation/test data**.

---

# Data Split

```text
Dataset
   ↓
Train Set
Validation Set
Test Set
```

Example:

```text
80% training
10% validation
10% testing
```

Exact ratios depend on dataset size.

---

# Training Set

Used to update model parameters.

---

# Validation Set

Used during development to:

- monitor overfitting
- choose hyperparameters
- select best checkpoint

---

# Test Set

Used at the end for final unbiased evaluation.

---

# Evaluation Metrics

Metrics depend on task.

## Classification

Use:

- accuracy
- precision
- recall
- F1-score

## Summarization

Possible metrics:

- ROUGE
- BERTScore
- human evaluation

## Translation

Possible metrics:

- BLEU
- COMET
- human evaluation

## QA / Generation

Evaluate:

- exact match
- groundedness
- factual correctness
- relevance
- instruction following

## Structured Output

Measure:

- JSON validity
- schema compliance
- field accuracy

---

# Human Evaluation

For generative systems, human evaluation is often very important.

Humans can rate:

```text
Correctness: 1–5
Helpfulness: 1–5
Relevance: 1–5
Style: 1–5
Safety: pass/fail
```

---

# Example Combined Score

A company might define:

\[
Score
=
0.4C + 0.3R + 0.2F + 0.1S
\]

Where:

- \(C\) = correctness
- \(R\) = relevance
- \(F\) = format compliance
- \(S\) = style

This is an application-specific scoring formula, not a universal LLM formula.

---

# 18. Overfitting

## Definition

**Overfitting** happens when the model learns the training examples too closely and performs poorly on unseen data.

In simple words:

> The model memorizes instead of generalizing.

---

# Example

Training examples:

```text
Question:
What is Python?

Answer:
Python is a programming language.
```

If the model only responds well to exact wording:

```text
What is Python?
```

but fails on:

```text
Can you explain Python?
```

it may have overfit.

---

# Diagram

```text
Training performance
       ↑
       │        Excellent
       │       /
       │      /
       │     /
       │____/____________

Validation performance
       ↑
       │      /\
       │     /  \
       │    /    \
       │___/      \_____
                ↑
           Overfitting begins
```

---

# Training vs Validation Loss

Healthy:

```text
Training loss ↓
Validation loss ↓
```

Overfitting:

```text
Training loss ↓
Validation loss ↑
```

---

# Causes of Overfitting

- dataset too small
- too many epochs
- learning rate too high
- duplicated examples
- model too large for data
- poor data diversity
- overly aggressive fine-tuning
- no regularization

---

# Ways to Reduce Overfitting

Use:

- more diverse data
- fewer epochs
- lower learning rate
- dropout
- weight decay
- early stopping
- PEFT
- better validation
- data deduplication

---

# Early Stopping

Stop training when validation performance stops improving.

Example:

| Epoch | Train Loss | Val Loss |
|---:|---:|---:|
| 1 | 1.20 | 1.25 |
| 2 | 0.90 | 0.98 |
| 3 | 0.70 | 0.82 |
| 4 | 0.55 | 0.87 |
| 5 | 0.42 | 0.95 |

Best checkpoint:

```text
Epoch 3
```

because validation loss was lowest there.

---

# 19. Catastrophic Forgetting

A related problem is **catastrophic forgetting**.

## Definition

The model may lose some useful general abilities after being heavily fine-tuned on a narrow dataset.

Example:

Before fine-tuning:

```text
Good at:
Python
Math
General QA
Writing
```

After overly narrow tuning:

```text
Excellent at legal formatting
but weaker at general tasks
```

PEFT and careful tuning can help reduce this risk.

---

# 20. Checkpoints

## Definition

A **checkpoint** is a saved snapshot of the model's training state.

It may contain:

- model weights
- adapter weights
- optimizer state
- scheduler state
- training step
- random state
- metadata

---

# Why Checkpoints Matter

If training crashes at step 10,000:

Without checkpoint:

```text
Restart from step 0
```

With checkpoint:

```text
Resume from step 10,000
```

---

# Checkpoint Flow

```text
Training
  ↓
Step 1000
  ↓
Save checkpoint
  ↓
Step 2000
  ↓
Save checkpoint
  ↓
Step 3000
  ↓
Save checkpoint
```

---

# Best Checkpoint vs Last Checkpoint

These are not always the same.

```text
Checkpoint 1000
Val Loss = 0.92

Checkpoint 2000
Val Loss = 0.71  ← best

Checkpoint 3000
Val Loss = 0.79
```

Best model:

```text
Checkpoint 2000
```

Last model:

```text
Checkpoint 3000
```

So always track validation metrics.

---

# Full Fine-Tuning Checkpoint

Can contain billions of model weights.

Large storage requirement.

---

# LoRA Checkpoint

Often only contains:

```text
LoRA A matrices
LoRA B matrices
configuration
```

Much smaller.

---

# 21. Important Training Hyperparameters

## Learning Rate

Controls parameter update size.

\[
\theta_{new}
=
\theta_{old}
-
\eta\nabla L
\]

where:

\[
\eta = learning\ rate
\]

Too high:

```text
Training unstable
```

Too low:

```text
Training very slow
```

---

# Batch Size

Number of examples processed before an optimizer step.

```python
batch_size = 4
```

Larger batch:

- more memory
- smoother gradients

Smaller batch:

- less memory
- noisier gradients

---

# Epochs

One epoch means one full pass over the training dataset.

```text
1000 examples
batch size = 10
```

One epoch:

```text
100 batches
```

---

# Steps Per Epoch

\[
Steps =
\left\lceil
\frac{N}{B}
\right\rceil
\]

Where:

- \(N\) = number of training examples
- \(B\) = batch size

Example:

\[
N=1000
\]

\[
B=8
\]

Then:

\[
Steps=\lceil125\rceil=125
\]

---

# Gradient Accumulation

Useful when GPU memory is limited.

Suppose:

```text
Physical batch size = 2
Gradient accumulation steps = 8
```

Effective batch size:

\[
2\times8=16
\]

Formula:

\[
Effective\ Batch
=
Device\ Batch
\times
Accumulation\ Steps
\times
Number\ of\ Devices
\]

Example:

\[
2\times8\times1=16
\]

---

# Weight Decay

Regularization used to discourage overly large weights.

Conceptually:

\[
L_{total}
=
L_{task}+\lambda ||\theta||^2
\]

Where:

- \(L_{task}\) = normal training loss
- \(\lambda\) = regularization strength
- \(\theta\) = parameters

---

# Warmup

Gradually increases learning rate at the beginning.

```text
Very small LR
   ↓
Increase slowly
   ↓
Target LR
```

This can stabilize early training.

---

# 22. Conceptual LoRA Fine-Tuning Code

Below is a simplified example using the Hugging Face ecosystem.

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model

model_name = "some-causal-language-model"

tokenizer = AutoTokenizer.from_pretrained(model_name)

model = AutoModelForCausalLM.from_pretrained(model_name)

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],
    task_type="CAUSAL_LM"
)

model = get_peft_model(
    model,
    lora_config
)

model.print_trainable_parameters()
```

Conceptually:

```text
Load tokenizer
      ↓
Load pretrained model
      ↓
Create LoRA configuration
      ↓
Attach LoRA layers
      ↓
Freeze most base weights
      ↓
Train LoRA parameters
```

The exact module names depend on model architecture.

---

# 23. Conceptual QLoRA Code

```python
import torch

from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig
)

from peft import (
    LoraConfig,
    prepare_model_for_kbit_training,
    get_peft_model
)


model_name = "some-causal-language-model"

quant_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)

tokenizer = AutoTokenizer.from_pretrained(model_name)

model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=quant_config,
    device_map="auto"
)

model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],
    task_type="CAUSAL_LM"
)

model = get_peft_model(
    model,
    lora_config
)
```

---

# Dry Run

| Step | What happens |
|---|---|
| 1 | load tokenizer |
| 2 | load model in 4-bit |
| 3 | prepare quantized model |
| 4 | define LoRA layers |
| 5 | attach LoRA |
| 6 | freeze base parameters |
| 7 | train only adapter parameters |

---

# 24. Simple Training Dataset Example

```python
dataset = [
    {
        "instruction": "Explain overfitting",
        "input": "",
        "output": (
            "Overfitting happens when a model learns "
            "training data too closely."
        )
    },
    {
        "instruction": "Explain underfitting",
        "input": "",
        "output": (
            "Underfitting happens when a model is too simple "
            "to learn the data."
        )
    }
]
```

Formatting:

```python
def format_record(row):
    return f"""
### Instruction:
{row["instruction"]}

### Input:
{row["input"]}

### Response:
{row["output"]}
""".strip()


for row in dataset:
    print(format_record(row))
    print()
```

---

# 25. Data Cleaning Before Fine-Tuning

Before training, check for:

## Duplicates

```python
seen = set()
cleaned = []

for item in dataset:
    key = item["instruction"] + item["output"]

    if key not in seen:
        cleaned.append(item)
        seen.add(key)
```

---

## Missing Outputs

Bad:

```json
{
  "instruction": "Explain SVM",
  "output": ""
}
```

Remove or repair such examples.

---

## Contradictions

Bad:

```text
Example 1:
2 + 2 = 4

Example 2:
2 + 2 = 5
```

Contradictory examples confuse training.

---

# 26. Dataset Split Example

```python
from sklearn.model_selection import train_test_split

data = list(range(100))

train_data, temp_data = train_test_split(
    data,
    test_size=0.2,
    random_state=42
)

val_data, test_data = train_test_split(
    temp_data,
    test_size=0.5,
    random_state=42
)

print(len(train_data))
print(len(val_data))
print(len(test_data))
```

Output:

```text
80
10
10
```

---

# Dry Run

| Split | Percentage |
|---|---:|
| Training | 80% |
| Validation | 10% |
| Testing | 10% |

---

# 27. Complete Conceptual Fine-Tuning Workflow

```text
1. Define task
      ↓
2. Select pretrained model
      ↓
3. Collect instruction data
      ↓
4. Clean / deduplicate
      ↓
5. Format examples
      ↓
6. Split train/validation/test
      ↓
7. Tokenize
      ↓
8. Select method
      ├── Full tuning
      ├── LoRA
      ├── QLoRA
      └── Adapter
      ↓
9. Configure hyperparameters
      ↓
10. Train
      ↓
11. Save checkpoints
      ↓
12. Monitor train/val loss
      ↓
13. Evaluate
      ↓
14. Select best checkpoint
      ↓
15. Test on unseen prompts
      ↓
16. Deploy
      ↓
17. Monitor production behavior
```

---

# 28. Full Fine-Tuning vs LoRA vs QLoRA vs Adapters

| Feature | Full FT | LoRA | QLoRA | Adapters |
|---|---|---|---|---|
| Updates base weights | Yes | No | No | Usually no |
| Trainable params | Very high | Low | Low | Low |
| VRAM use | Highest | Lower | Lowest among these commonly | Lower |
| Storage | Large | Small | Small | Small |
| Quantized base | Optional | Optional | Yes | Optional |
| Easy multi-task adapters | Harder | Yes | Yes | Yes |
| Training cost | High | Lower | Very low relative to full FT | Lower |

---

# 29. Fine-Tuning vs Prompt Engineering vs RAG

This is very important for interviews.

## Prompt Engineering

Changes:

```text
Instructions
```

Does not change model parameters.

Use when:

- behavior can be controlled with prompting
- task is simple
- rapid iteration matters

---

## RAG

Changes:

```text
Context supplied to model
```

Does not usually change base parameters.

Use when:

- knowledge changes frequently
- company documents are needed
- citations are important

---

## Fine-Tuning

Changes:

```text
Model parameters / adapter parameters
```

Use when:

- style must be consistent
- task behavior must be learned
- output format is specialized
- large numbers of examples demonstrate desired behavior

---

# Example Decision

Need current company policies?

```text
RAG
```

Need model to always answer in company support style?

```text
Fine-tuning may help
```

Need response in JSON?

```text
Prompting / structured output may already be enough
```

Need both company knowledge and special behavior?

```text
Fine-Tuned Model + RAG
```

---

# 30. Common Fine-Tuning Mistakes

## Mistake 1: Fine-tuning when prompting would be enough

Do not fine-tune just to change:

```text
"Use bullet points"
```

Prompt engineering can handle this.

---

## Mistake 2: Using low-quality data

Bad data produces bad model behavior.

```text
Garbage in
   ↓
Fine-tuning
   ↓
Garbage out
```

---

## Mistake 3: Training on too little data for too many epochs

This causes overfitting.

---

## Mistake 4: Not having a validation set

Without validation data, you cannot reliably detect overfitting.

---

## Mistake 5: Evaluating on training examples

This gives an unrealistically optimistic score.

---

## Mistake 6: Using incorrect chat formatting

Always match the model's tokenizer/chat-template requirements.

---

## Mistake 7: Forgetting to mask prompt tokens

If your training objective should focus on assistant outputs, compute loss appropriately.

---

## Mistake 8: Learning rate too high

May destroy useful pretrained behavior.

---

## Mistake 9: Rank too high in LoRA

Higher rank does not automatically mean better performance.

It increases:

- memory
- trainable parameters
- overfitting possibility

---

## Mistake 10: Assuming quantization has no accuracy cost

Quantization introduces approximation.

There can be quality tradeoffs.

---

## Mistake 11: Saving only last checkpoint

The last checkpoint may not be the best.

---

## Mistake 12: No baseline comparison

Always compare:

```text
Base model
vs
Prompted model
vs
Fine-tuned model
```

Otherwise you may not know whether tuning helped.

---

# 31. Interview Questions and Answers

## Q1. What is LLM fine-tuning?

Fine-tuning is additional training of a pretrained language model on task-specific or domain-specific data to adapt its behavior.

---

## Q2. Why not train an LLM from scratch?

Training from scratch requires huge amounts of:

- data
- GPUs
- money
- engineering effort

Fine-tuning reuses pretrained knowledge.

---

## Q3. What is full fine-tuning?

It updates all trainable parameters of the base model.

---

## Q4. What is PEFT?

Parameter-Efficient Fine-Tuning updates only a small subset of additional or selected parameters while keeping most base weights frozen.

---

## Q5. Why is PEFT useful?

It reduces:

- GPU memory
- training time
- checkpoint size
- storage cost

---

## Q6. What is LoRA?

LoRA adds trainable low-rank matrices to selected layers while keeping original model weights frozen.

---

## Q7. What is the LoRA equation?

\[
W'=W+BA
\]

or commonly:

\[
y=Wx+\frac{\alpha}{r}BAx
\]

---

## Q8. What does rank `r` mean in LoRA?

It controls the size of the low-dimensional adaptation matrices.

Higher rank means more trainable capacity.

---

## Q9. What is `lora_alpha`?

It scales the LoRA update.

A common scaling factor is:

\[
\frac{\alpha}{r}
\]

---

## Q10. What is QLoRA?

QLoRA loads the frozen base model in a quantized form, often 4-bit, and trains LoRA adapters on top.

---

## Q11. LoRA vs QLoRA?

LoRA does not inherently require quantizing the base model.

QLoRA combines LoRA with low-bit base-model quantization.

---

## Q12. What are adapters?

Adapters are small trainable neural network modules inserted into a frozen pretrained network.

---

## Q13. What is quantization?

Quantization reduces numerical precision of model weights, for example from FP16 to INT8 or 4-bit.

---

## Q14. Why quantize models?

To reduce:

- memory
- storage
- inference cost

and sometimes increase speed.

---

## Q15. What is an instruction dataset?

A dataset containing instructions, inputs/context, and desired responses used to teach instruction-following behavior.

---

## Q16. Why is data formatting important?

LLMs learn patterns from token sequences, so inconsistent or incorrect formatting can reduce fine-tuning quality.

---

## Q17. What is a chat template?

A standardized way of representing:

- system messages
- user messages
- assistant responses

for a particular model/tokenizer.

---

## Q18. What is overfitting?

Overfitting happens when a model performs very well on training data but poorly on unseen data.

---

## Q19. How do you detect overfitting?

Typically:

```text
Training loss decreases
Validation loss starts increasing
```

---

## Q20. How do you reduce overfitting?

Use:

- early stopping
- fewer epochs
- more diverse data
- smaller learning rate
- dropout
- PEFT
- regularization

---

## Q21. What is a checkpoint?

A saved training state that allows evaluation, restoration, deployment, or resuming training.

---

## Q22. Best checkpoint vs last checkpoint?

The best checkpoint has the strongest validation metric.

The last checkpoint is simply the most recently saved one.

---

## Q23. What is validation loss?

Loss measured on unseen validation data during development.

It helps detect whether the model generalizes.

---

## Q24. What is perplexity?

\[
Perplexity=e^{Loss}
\]

It indicates how uncertain the language model is about its evaluation text.

Lower is usually better for language modeling.

---

## Q25. What is gradient accumulation?

It simulates a larger batch by collecting gradients over multiple smaller batches before updating parameters.

---

## Q26. What is the effective batch-size formula?

\[
EffectiveBatch
=
PerDeviceBatch
\times
GradientAccumulation
\times
NumberOfDevices
\]

---

## Q27. What is catastrophic forgetting?

It is the loss of useful pretrained capabilities after excessive or narrow fine-tuning.

---

## Q28. Fine-tuning vs RAG?

Fine-tuning modifies model behavior/parameters.

RAG provides external knowledge at inference time.

---

## Q29. When should you choose RAG instead of fine-tuning?

Use RAG when knowledge:

- changes often
- must come from specific documents
- requires citations
- should be updated without retraining

---

## Q30. When should you fine-tune?

Fine-tuning is useful when you need consistent changes to:

- style
- behavior
- task performance
- domain response patterns
- structured transformations

and have suitable training data.

---

# 32. Scenario Interview Question

### Interviewer:

You have a 7B model and only one 16 GB GPU. How would you fine-tune it?

A strong answer:

> I would first consider whether prompt engineering or RAG can solve the problem. If parameter training is really needed, I would likely use QLoRA because it can load the base model in low-bit precision and train only small LoRA adapters. I would use a small per-device batch size with gradient accumulation, mixed precision where supported, careful sequence length, and checkpointing. I would monitor validation loss and evaluate the final model against the untuned baseline.

---

# 33. Scenario: Company Support Chatbot

Goal:

```text
Fine-tune LLM for company customer support.
```

Pipeline:

```text
Historical support chats
       ↓
Remove personal/private data
       ↓
Remove incorrect responses
       ↓
Convert to instruction/chat format
       ↓
Train/validation/test split
       ↓
LoRA or QLoRA
       ↓
Training
       ↓
Evaluate:
- correctness
- tone
- escalation behavior
- hallucination
       ↓
Select checkpoint
       ↓
Combine with RAG
       ↓
Deploy
```

Why combine with RAG?

Because:

```text
Fine-tuning
→ teaches support behavior

RAG
→ supplies current policies/products
```

---

# 34. Mini Parameter Count Example for LoRA

Suppose a linear layer:

\[
W \in \mathbb{R}^{1024\times1024}
\]

Full matrix parameters:

\[
1024\times1024
=
1,048,576
\]

LoRA with:

\[
r=8
\]

uses:

\[
A: 8\times1024
\]

\[
B:1024\times8
\]

Trainable parameters:

\[
8192+8192=16384
\]

Percentage:

\[
\frac{16384}{1048576}\times100
\]

\[
\approx1.56\%
\]

So this example trains only around 1.56% as many parameters for that matrix.

---

# 35. Fine-Tuning Monitoring Table

Imagine training:

| Epoch | Train Loss | Validation Loss | Action |
|---:|---:|---:|---|
| 1 | 1.42 | 1.48 | continue |
| 2 | 1.10 | 1.17 | continue |
| 3 | 0.85 | 0.92 | best so far |
| 4 | 0.66 | 0.97 | possible overfit |
| 5 | 0.52 | 1.10 | stop |

Best checkpoint:

```text
Epoch 3
```

---

# 36. Simple Checkpoint Logic in Python

```python
best_val_loss = float("inf")
best_epoch = None

validation_losses = [
    1.48,
    1.17,
    0.92,
    0.97,
    1.10
]

for epoch, val_loss in enumerate(
    validation_losses,
    start=1
):
    if val_loss < best_val_loss:
        best_val_loss = val_loss
        best_epoch = epoch

print("Best epoch:", best_epoch)
print("Best validation loss:", best_val_loss)
```

Output:

```text
Best epoch: 3
Best validation loss: 0.92
```

---

# Dry Run

| Epoch | Val Loss | Best? |
|---:|---:|---|
| 1 | 1.48 | yes |
| 2 | 1.17 | yes |
| 3 | 0.92 | yes |
| 4 | 0.97 | no |
| 5 | 1.10 | no |

Final:

```text
Best epoch = 3
```

---

# 37. Fine-Tuning Architecture Diagram

```text
                 TRAINING DATA
                      │
                      ▼
                  Formatter
                      │
                      ▼
                  Tokenizer
                      │
                      ▼
               Pretrained LLM
                      │
            ┌─────────┴─────────┐
            │                   │
      Full Fine-Tuning         PEFT
            │              ┌────┼─────┐
            │             LoRA QLoRA Adapter
            │              │    │      │
            └──────────────┴────┴──────┘
                           │
                           ▼
                        Training
                           │
                           ▼
                    Validation Loss
                           │
                           ▼
                     Checkpoints
                           │
                           ▼
                       Evaluation
                           │
                           ▼
                    Best Fine-Tuned
                         Model
```

---

# 38. Final Quick Revision

| Concept | Easy Meaning |
|---|---|
| Full fine-tuning | Update all model weights |
| PEFT | Update only a small set of parameters |
| LoRA | Learn low-rank weight updates |
| QLoRA | Quantized base model + LoRA |
| Adapters | Small trainable modules inside frozen model |
| Quantisation | Store weights with fewer bits |
| Instruction dataset | Instruction + desired response examples |
| Formatting | Convert data to model's expected structure |
| Evaluation | Test model on unseen data |
| Overfitting | Model memorizes training data |
| Checkpoint | Saved training state |

---

# 39. Most Important Formulas to Remember

### Gradient update

\[
\theta_{new}
=
\theta_{old}-\eta\nabla L
\]

### LoRA update

\[
W'=W+BA
\]

### LoRA scaling

\[
y=Wx+\frac{\alpha}{r}BAx
\]

### Trainable parameter percentage

\[
Trainable\%=
\frac{Trainable}{Total}\times100
\]

### Storage

\[
Storage=
\frac{Parameters\times Bits}{8}
\]

### Cross-entropy

\[
L=
-\frac{1}{T}
\sum_{t=1}^{T}\log P(y_t|\cdots)
\]

### Perplexity

\[
PPL=e^L
\]

### Effective batch size

\[
B_{effective}
=
B_{device}
\times
GradientAccumulation
\times
Devices
\]

---

# 40. Best Interview Answer: “Explain LLM Fine-Tuning”

> **LLM fine-tuning is the process of adapting a pretrained language model using task-specific training data. In full fine-tuning, all model parameters are updated, which offers high flexibility but requires significant compute and storage. Parameter-efficient methods such as LoRA and adapters keep most base parameters frozen and train only small additional parameter sets. LoRA represents the model update using low-rank matrices, while QLoRA further reduces memory by quantizing the frozen base model, commonly to 4-bit, and training LoRA adapters on top. A complete fine-tuning pipeline includes high-quality instruction data, correct training formatting, tokenization, train-validation-test splits, checkpointing, monitoring for overfitting, and task-specific evaluation before deployment.**

## One final decision rule

```text
Need better instructions only?
→ Prompt Engineering

Need current/private knowledge?
→ RAG

Need learned behavior/style/task adaptation?
→ Fine-Tuning

Limited GPU memory?
→ LoRA / QLoRA

Need maximum parameter flexibility and have strong compute/data?
→ Full Fine-Tuning
```
