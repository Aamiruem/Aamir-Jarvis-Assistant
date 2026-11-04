> **You asked:**
>
> - **Chapter 6: Conditions and Loops**
>
>
>
>   **Conditional statements**
>
>
>   - if 
>   - if-else      
>   - if-elif-else      
>   - Nested      conditions 
>   - Ternary      operator 
>   - match-case      
>   - Truthy      and falsy values 
>
>
>   **Loops**
>
>
>   - for 
>   - while      
>   - Nested      loops 
>   - range()      
>   - break      
>   - continue      
>   - pass      
>   - Loop      else 
>   - enumerate()      
>   - zip()      
>
>
>   **Pattern problems**
>
>
>   - Number      patterns 
>   - Star      patterns 
>   - Pyramid      patterns 
>   - Searching      
>   - Counting      
>   - Prime-number      problems 
>   - Fibonacci      series 
>   - Factorial        Explain the chapter \<Topicwise> in detail.
>      Break down all concepts step by step in very simple language.
>      Include: 
> -  Clear definitions of each concept 
> -  Important formulas with parameter names explained 
> -  Real-world examples for each concept 
> -  Visualizations or diagrams to make it intuitive (use graphs and colorful notes) 
> -  Conceptual code examples (Python preferred) with dry run tables 
> -  Common mistakes and how to avoid them 
> -  Interview-style questions with answers for practice 
>
> Make the explanation very conceptual, beginner-friendly, and structured like a study guide.
>
> Use graphs, colorful notes, and highlight formulas with parameter names for clarity.
>
> Provide complete Python code examples with dry run tables for understanding.
>
> colorful notes and diagram and difficult word explain to easy meaning explain all concept through diagram and color full Notes basics to advanced code and write every word very easy mean  mind map

# 🐍 Chapter 6 — Conditions and Loops
### Python Programming | Beginner → Advanced | Conceptual Study Guide

This chapter teaches Python how to **make decisions** and **repeat work**.

> 🟢 **Condition = Decision** → “Should I do this?”
>
> 🔵 **Loop = Repetition** → “Do this again and again.”
>
> 🟣 **Pattern = Practice** → “Use loops to build logic.”

---

# 🧠 1. Complete Mind Map

```text
                    🐍 CONDITIONS & LOOPS
                           │
             ┌─────────────┴─────────────┐
             │                           │
        🔵 CONDITIONS                 🟢 LOOPS
             │                           │
     ┌───────┼────────┐          ┌───────┼────────┐
     │       │        │          │       │        │
    if    if-else   elif       for     while    nested
     │       │        │          │       │        │
   nested  ternary match       range   break   continue
            │       │            │       │        │
          truthy  case         pass    loop-else
          falsy                            │
                                     enumerate
                                         zip
                                             │
                                             ▼
                                      🔶 PATTERNS
                                             │
                        ┌────────────────────┼──────────────┐
                        │                    │              │
                     Stars                Numbers        Pyramid
                        │                    │
                        └────────────┬───────┘
                                     │
                         ┌───────────┼────────────┐
                         │           │            │
                      Searching   Counting      Prime
                         │
                  Fibonacci / Factorial
```

---

# PART A — CONDITIONAL STATEMENTS

## 2. What is a Condition?

A **condition** is a question whose answer is usually:

```text
True  ✅
False ❌
```

Example:

```python
age = 20

print(age >= 18)
```

Output:

```text
True
```

Think:

```text
age = 20
   │
   ▼
Is age >= 18?
   │
   ├── YES → True
   │
   └── NO  → False
```

### Real-world example

ATM:

```text
Is PIN correct?
      │
 ┌────┴────┐
YES       NO
 │         │
 ▼         ▼
Allow    Reject
```

---

# 3. `if` Statement

## Definition

`if` means:

> **Run this code only when the condition is True.**

### Syntax

```python
if condition:
    statement
```

Example:

```python
age = 20

if age >= 18:
    print("You can vote")
```

Output:

```text
You can vote
```

### Flow diagram

```text
       START
         │
         ▼
   age >= 18 ?
      /     \
    YES      NO
     │        │
     ▼        ▼
 "You can   Nothing
   vote"
     │
     ▼
    END
```

### ⚠️ Important

Python uses **indentation** to understand which statements belong to `if`.

Correct:

```python
if age >= 18:
    print("Adult")
```

Incorrect:

```python
if age >= 18:
print("Adult")
```

---

# 4. `if-else`

Sometimes we need two choices.

```text
Condition?
   │
 ┌─┴──┐
YES   NO
 │     │
 ▼     ▼
 A     B
```

### Syntax

```python
if condition:
    statement1
else:
    statement2
```

Example:

```python
age = 16

if age >= 18:
    print("Adult")
else:
    print("Minor")
```

Output:

```text
Minor
```

### Real-world example

```python
balance = 500

if balance >= 1000:
    print("Purchase allowed")
else:
    print("Insufficient balance")
```

---

# 5. `if-elif-else`

Use this when there are **more than two choices**.

### Example

```python
marks = 75

if marks >= 90:
    grade = "A"
elif marks >= 80:
    grade = "B"
elif marks >= 70:
    grade = "C"
else:
    grade = "D"

print(grade)
```

Output:

```text
C
```

### Flow

```text
marks >= 90?
     │
   NO
     ▼
marks >= 80?
     │
   NO
     ▼
marks >= 70?
     │
   YES
     ▼
   Grade C
```

### Dry run

| Step | Condition | Result |
|---|---|---|
| 1 | 75 >= 90 | False |
| 2 | 75 >= 80 | False |
| 3 | 75 >= 70 | True |
| 4 | `grade = "C"` | C |

### 🟡 Important

Python checks conditions **from top to bottom**.

Once one condition becomes true, the remaining `elif` conditions are skipped.

---

# 6. Nested Conditions

A condition inside another condition is called a **nested condition**.

```python
age = 25
has_id = True

if age >= 18:
    if has_id:
        print("Entry allowed")
    else:
        print("ID required")
else:
    print("Underage")
```

### Diagram

```text
             age >= 18?
              /      \
            YES       NO
             │         │
             ▼         ▼
       has_id=True   Underage
         /     \
       YES      NO
        │        │
        ▼        ▼
      Entry    ID required
```

### Easy meaning

> **Nested = condition inside condition**

---

# 7. Ternary Operator

A ternary expression is a **short form of if-else**.

Normal:

```python
age = 20

if age >= 18:
    result = "Adult"
else:
    result = "Minor"
```

Ternary:

```python
result = "Adult" if age >= 18 else "Minor"
```

### Formula

```text
value_if_true if condition else value_if_false
```

Example:

```python
a = 10
b = 20

maximum = a if a > b else b

print(maximum)
```

Output:

```text
20
```

### 🟢 Use ternary when

The decision is short and simple.

### 🔴 Avoid

Very complicated nested ternary expressions.

---

# 8. `match-case`

`match-case` is useful when comparing one value against multiple possible patterns.

Available in modern Python versions.

Example:

```python
day = 2

match day:
    case 1:
        print("Monday")
    case 2:
        print("Tuesday")
    case 3:
        print("Wednesday")
    case _:
        print("Invalid day")
```

Output:

```text
Tuesday
```

`_` means:

> Anything else / default case.

### Diagram

```text
             day
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
      1       2        3
      │       │        │
   Monday  Tuesday  Wednesday

             ↓
            _
             ↓
          Default
```

---

# 9. Truthy and Falsy Values

Python does not always require an explicit `True` or `False`.

Some values behave like `True`.

These are **truthy**.

Some behave like `False`.

These are **falsy**.

### Common falsy values

```python
False
None
0
0.0
""
[]
()
{}
set()
```

Example:

```python
name = ""

if name:
    print("Name exists")
else:
    print("Name is empty")
```

Output:

```text
Name is empty
```

### Easy memory trick

```text
Empty → Usually False ❌
Non-empty → Usually True ✅
```

Example:

```python
items = [10, 20]

if items:
    print("Items available")
```

Output:

```text
Items available
```

---

# 🔵 PART B — LOOPS

# 10. What is a Loop?

A loop repeats code.

Instead of writing:

```python
print("Hello")
print("Hello")
print("Hello")
print("Hello")
print("Hello")
```

we write:

```python
for i in range(5):
    print("Hello")
```

### Concept

```text
       START
         │
         ▼
     Check condition
         │
      True?
      /   \
    YES    NO
     │      │
     ▼      ▼
   Execute  END
     │
     └──────► Check again
```

---

# 11. `for` Loop

Use `for` when you want to iterate over a sequence or collection.

### Example

```python
for i in range(5):
    print(i)
```

Output:

```text
0
1
2
3
4
```

### Dry run

| Iteration | `i` | Output |
|---:|---:|---:|
| 1 | 0 | 0 |
| 2 | 1 | 1 |
| 3 | 2 | 2 |
| 4 | 3 | 3 |
| 5 | 4 | 4 |

---

# 12. `while` Loop

A `while` loop repeats **while a condition remains true**.

```python
i = 1

while i <= 5:
    print(i)
    i += 1
```

Output:

```text
1
2
3
4
5
```

### Flow

```text
       i = 1
         │
         ▼
     i <= 5?
      /   \
    YES    NO
     │      │
     ▼      ▼
  print(i) END
     │
     ▼
  i = i + 1
     │
     └──────► condition
```

### ⚠️ Infinite loop

This is dangerous:

```python
i = 1

while i <= 5:
    print(i)
```

Why?

`i` never changes.

So the condition stays true forever.

Correct:

```python
i = 1

while i <= 5:
    print(i)
    i += 1
```

---

# 13. `for` vs `while`

| `for` | `while` |
|---|---|
| Usually used when number/sequence of iterations is known | Useful when stopping depends on a condition |
| Works naturally with iterable objects | Works with a Boolean condition |
| Common for lists/ranges | Common for input/condition-based repetition |

Example:

```python
for number in [10, 20, 30]:
    print(number)
```

vs:

```python
password = ""

while password != "1234":
    password = input("Password: ")
```

---

# 14. `range()`

`range()` creates a sequence of numbers.

### Three forms

```python
range(stop)
range(start, stop)
range(start, stop, step)
```

---

## `range(stop)`

```python
range(5)
```

means:

```text
0 1 2 3 4
```

⚠️ `5` is excluded.

---

## `range(start, stop)`

```python
range(2, 6)
```

Output:

```text
2 3 4 5
```

---

## `range(start, stop, step)`

```python
range(2, 10, 2)
```

Output:

```text
2 4 6 8
```

### Formula

Conceptually:

```text
next_value = current_value + step
```

---

# 15. `break`

`break` immediately stops the loop.

```python
for i in range(10):
    if i == 5:
        break
    print(i)
```

Output:

```text
0
1
2
3
4
```

### Diagram

```text
0 → 1 → 2 → 3 → 4 → 5
                      │
                    break
                      │
                      ▼
                     END
```

### Real-world example

Search for a user:

```python
users = ["Ali", "Aamir", "Rahul", "John"]

for user in users:
    if user == "Aamir":
        print("User found")
        break
```

Once found, there is no need to continue searching.

---

# 16. `continue`

`continue` skips the **current iteration** and moves to the next iteration.

```python
for i in range(5):
    if i == 2:
        continue
    print(i)
```

Output:

```text
0
1
3
4
```

### Difference

```text
break
  ↓
STOP ENTIRE LOOP

continue
  ↓
SKIP CURRENT ITERATION
  ↓
CONTINUE LOOP
```

---

# 17. `pass`

`pass` means:

> Do nothing for now.

Example:

```python
for i in range(5):
    if i == 2:
        pass
    print(i)
```

`pass` does **not** stop the loop.

It simply provides a syntactically valid empty block.

Useful while writing unfinished code:

```python
def future_function():
    pass
```

---

# 18. Loop `else`

Python allows an `else` after a loop.

The `else` runs when the loop finishes **normally**, without `break`.

Example:

```python
for i in range(5):
    print(i)
else:
    print("Loop completed")
```

Output:

```text
0
1
2
3
4
Loop completed
```

But:

```python
for i in range(5):
    if i == 2:
        break
else:
    print("Loop completed")
```

The `else` does not execute.

### Very useful example: Search

```python
numbers = [10, 20, 30]

target = 50

for number in numbers:
    if number == target:
        print("Found")
        break
else:
    print("Not found")
```

Output:

```text
Not found
```

### Easy rule

```text
Loop ends normally → else runs ✅
Loop ends using break → else skipped ❌
```

---

# 19. Nested Loops

A loop inside another loop.

```python
for i in range(3):
    for j in range(3):
        print(i, j)
```

### Visualization

```text
Outer i = 0
   │
   ├── j = 0
   ├── j = 1
   └── j = 2

Outer i = 1
   │
   ├── j = 0
   ├── j = 1
   └── j = 2

Outer i = 2
   │
   ├── j = 0
   ├── j = 1
   └── j = 2
```

### Important concept

If outer loop runs `n` times and inner loop runs `m` times:

**Time complexity:**

\[
O(n \times m)
\]

If both run `n` times:

\[
O(n^2)
\]

---

# 20. `enumerate()`

`enumerate()` gives both:

```text
index + value
```

Instead of:

```python
names = ["Aamir", "Rahul", "John"]

for i in range(len(names)):
    print(i, names[i])
```

Use:

```python
for index, name in enumerate(names):
    print(index, name)
```

Output:

```text
0 Aamir
1 Rahul
2 John
```

### Start from another number

```python
for index, name in enumerate(names, start=1):
    print(index, name)
```

Output:

```text
1 Aamir
2 Rahul
3 John
```

---

# 21. `zip()`

`zip()` combines multiple iterables element by element.

```python
names = ["Aamir", "Rahul", "John"]
marks = [90, 80, 70]

for name, mark in zip(names, marks):
    print(name, mark)
```

Output:

```text
Aamir 90
Rahul 80
John 70
```

### Visualization

```text
names          marks
   │              │
   ▼              ▼
 Aamir     +      90
 Rahul     +      80
 John      +      70
   │              │
   └──────┬───────┘
          ▼
    (name, mark)
```

---

# ⭐ PART C — PATTERN PROBLEMS

Pattern problems are extremely useful for learning nested loops.

---

# 22. Star Pattern

Expected:

```text
*
**
***
****
*****
```

Code:

```python
n = 5

for i in range(1, n + 1):
    for j in range(i):
        print("*", end="")
    print()
```

### Dry run

| `i` | Number of stars |
|---:|---:|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 4 |
| 5 | 5 |

### Logic

```text
row 1 → 1 star
row 2 → 2 stars
row 3 → 3 stars
...
row n → n stars
```

---

# 23. Reverse Star Pattern

```text
*****
****
***
**
*
```

Code:

```python
n = 5

for i in range(n, 0, -1):
    print("*" * i)
```

Output:

```text
*****
****
***
**
*
```

---

# 24. Number Pattern

```text
1
12
123
1234
12345
```

Code:

```python
n = 5

for i in range(1, n + 1):
    for j in range(1, i + 1):
        print(j, end="")
    print()
```

### Dry run

| Row `i` | `j` values | Output |
|---:|---|---|
| 1 | 1 | `1` |
| 2 | 1,2 | `12` |
| 3 | 1,2,3 | `123` |
| 4 | 1,2,3,4 | `1234` |
| 5 | 1,2,3,4,5 | `12345` |

---

# 25. Pyramid Pattern

Expected:

```text
    *
   ***
  *****
 *******
*********
```

We need:

1. spaces
2. stars

### Formula

For row `i`:

\[
spaces = n-i
\]

\[
stars = 2i-1
\]

Where:

- `n` = total number of rows
- `i` = current row

### Code

```python
n = 5

for i in range(1, n + 1):
    spaces = n - i
    stars = 2 * i - 1

    print(" " * spaces + "*" * stars)
```

### Dry run

| Row | Spaces | Stars |
|---:|---:|---:|
| 1 | 4 | 1 |
| 2 | 3 | 3 |
| 3 | 2 | 5 |
| 4 | 1 | 7 |
| 5 | 0 | 9 |

---

# 26. Searching

Searching means:

> Find whether a particular value exists.

### Linear search

```python
numbers = [10, 20, 30, 40, 50]
target = 30

for number in numbers:
    if number == target:
        print("Found")
        break
else:
    print("Not found")
```

### Dry run

| Step | Number | `number == 30` |
|---:|---:|---|
| 1 | 10 | False |
| 2 | 20 | False |
| 3 | 30 | True → Found |

### Complexity

For `n` elements:

- Best case: **O(1)**
- Worst case: **O(n)**

---

# 27. Counting

Suppose we want to count even numbers.

```python
numbers = [10, 15, 20, 25, 30]

count = 0

for number in numbers:
    if number % 2 == 0:
        count += 1

print(count)
```

Output:

```text
3
```

### Dry run

| Number | Even? | Count |
|---:|---|---:|
| 10 | Yes | 1 |
| 15 | No | 1 |
| 20 | Yes | 2 |
| 25 | No | 2 |
| 30 | Yes | 3 |

### General counting pattern

```python
count = 0

for item in data:
    if condition:
        count += 1
```

This is a very important DSA pattern.

---

# 28. Prime Number

A prime number:

> A number greater than 1 that has exactly two factors: `1` and itself.

Examples:

```text
2, 3, 5, 7, 11, 13
```

Not prime:

```text
1, 4, 6, 8, 9
```

---

## Simple approach

```python
n = 17

if n < 2:
    print("Not prime")
else:
    is_prime = True

    for i in range(2, n):
        if n % i == 0:
            is_prime = False
            break

    if is_prime:
        print("Prime")
    else:
        print("Not prime")
```

### Better approach

We only need to check up to:

\[
\sqrt{n}
\]

```python
import math

n = 17

if n < 2:
    print("Not prime")
else:
    is_prime = True

    for i in range(2, math.isqrt(n) + 1):
        if n % i == 0:
            is_prime = False
            break

    print("Prime" if is_prime else "Not prime")
```

### Why √n?

If:

\[
n = a \times b
\]

and both `a` and `b` were greater than √n, their product would be greater than `n`.

Therefore, if a factor exists, at least one factor must be ≤ √n.

---

# 29. Fibonacci Series

Fibonacci:

```text
0 1 1 2 3 5 8 13 21 ...
```

### Rule

\[
F_n = F_{n-1} + F_{n-2}
\]

with:

\[
F_0=0
\]

\[
F_1=1
\]

### Code

```python
n = 8

a = 0
b = 1

for _ in range(n):
    print(a, end=" ")

    a, b = b, a + b
```

Output:

```text
0 1 1 2 3 5 8 13
```

### Dry run

| Step | `a` | `b` | Output | New `(a,b)` |
|---:|---:|---:|---:|---|
| 1 | 0 | 1 | 0 | `(1,1)` |
| 2 | 1 | 1 | 1 | `(1,2)` |
| 3 | 1 | 2 | 1 | `(2,3)` |
| 4 | 2 | 3 | 2 | `(3,5)` |
| 5 | 3 | 5 | 3 | `(5,8)` |

### Important Python concept

```python
a, b = b, a + b
```

is simultaneous assignment.

---

# 30. Factorial

Factorial means multiplying all positive integers from `1` to `n`.

\[
n! = n \times (n-1) \times (n-2) \times ... \times 1
\]

Example:

\[
5! = 5 \times4\times3\times2\times1
\]

\[
5! = 120
\]

### Code

```python
n = 5

factorial = 1

for i in range(1, n + 1):
    factorial *= i

print(factorial)
```

### Dry run

| `i` | `factorial` |
|---:|---:|
| Start | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 6 |
| 4 | 24 |
| 5 | 120 |

### Special case

\[
0! = 1
\]

---

# 🧩 31. Complete Example — Student Grade System

Let's combine conditions, loops, lists and functions.

```python
students = [
    ("Aamir", 85),
    ("Rahul", 72),
    ("John", 91),
    ("Sara", 58)
]

for name, marks in students:

    if marks >= 90:
        grade = "A"
    elif marks >= 80:
        grade = "B"
    elif marks >= 70:
        grade = "C"
    elif marks >= 60:
        grade = "D"
    else:
        grade = "F"

    print(name, marks, grade)
```

Output:

```text
Aamir 85 B
Rahul 72 C
John 91 A
Sara 58 F
```

### Flow

```text
Student
   │
   ▼
Read marks
   │
   ▼
marks >= 90?
 ├─YES → A
 └─NO
     │
     ▼
 marks >= 80?
 ├─YES → B
 └─NO
     │
     ▼
 Continue...
```

---

# 🧠 32. Important Loop Patterns

These patterns appear constantly in programming and DSA.

## Pattern 1 — Sum

```python
total = 0

for x in numbers:
    total += x
```

Formula:

\[
total = \sum_{i=1}^{n} x_i
\]

---

## Pattern 2 — Count

```python
count = 0

for x in numbers:
    if condition:
        count += 1
```

---

## Pattern 3 — Maximum

```python
maximum = numbers[0]

for x in numbers:
    if x > maximum:
        maximum = x
```

---

## Pattern 4 — Minimum

```python
minimum = numbers[0]

for x in numbers:
    if x < minimum:
        minimum = x
```

---

## Pattern 5 — Search

```python
found = False

for x in numbers:
    if x == target:
        found = True
        break
```

---

# 🎨 33. `break` vs `continue` vs `pass`

| Keyword | Meaning | Loop |
|---|---|---|
| `break` | Stop loop completely | ❌ stops |
| `continue` | Skip current iteration | ✅ continues |
| `pass` | Do nothing | ✅ continues |

### Easy memory

```text
BREAK    → 🚪 Exit
CONTINUE → ⏭️ Skip
PASS     → 💤 Do nothing
```

---

# ⚠️ 34. Common Mistakes

## Mistake 1 — Forgetting `:`

Wrong:

```python
if age >= 18
```

Correct:

```python
if age >= 18:
```

---

## Mistake 2 — Incorrect indentation

Wrong:

```python
if age >= 18:
print("Adult")
```

Correct:

```python
if age >= 18:
    print("Adult")
```

---

## Mistake 3 — Infinite `while` loop

Wrong:

```python
i = 1

while i <= 5:
    print(i)
```

Correct:

```python
i = 1

while i <= 5:
    print(i)
    i += 1
```

---

## Mistake 4 — Confusing `=` and `==`

```python
x = 10
```

means:

> Assign 10 to x.

```python
x == 10
```

means:

> Is x equal to 10?

---

## Mistake 5 — `range()` excludes the end

```python
range(1, 5)
```

produces:

```text
1 2 3 4
```

not `5`.

---

## Mistake 6 — Using `break` when you need `continue`

If you want to skip one item:

```python
continue
```

If you want to stop everything:

```python
break
```

---

# 🧪 35. Practice Problems

### Beginner

1. Print numbers from 1 to 100.
2. Print all even numbers from 1 to 50.
3. Print all odd numbers from 1 to 50.
4. Find the sum from 1 to `n`.
5. Find factorial.
6. Check whether a number is positive, negative or zero.
7. Check whether a number is even or odd.
8. Find the largest of three numbers.
9. Print multiplication table.
10. Count digits in a number.

### Intermediate

11. Reverse a number.
12. Check palindrome number.
13. Check prime number.
14. Print primes from 1 to 100.
15. Generate Fibonacci series.
16. Find GCD.
17. Find LCM.
18. Count vowels in a string.
19. Count words in a sentence.
20. Find duplicate values.

### Pattern practice

21.

```text
*
**
***
****
*****
```

22.

```text
*****
****
***
**
*
```

23.

```text
1
12
123
1234
12345
```

24.

```text
12345
1234
123
12
1
```

25.

```text
    *
   ***
  *****
 *******
*********
```

---

# 🎯 36. Interview Questions

### Q1. What is the difference between `if` and `while`?

**Answer:**

`if` checks a condition once.

`while` repeatedly checks a condition and executes code while it is true.

---

### Q2. What is the difference between `for` and `while`?

**Answer:**

`for` is commonly used to iterate over a sequence or known range.

`while` is commonly used when repetition depends on a condition.

---

### Q3. What does `break` do?

**Answer:**

`break` immediately terminates the nearest enclosing loop.

---

### Q4. What does `continue` do?

**Answer:**

`continue` skips the remaining statements of the current iteration and starts the next iteration.

---

### Q5. What is `pass`?

**Answer:**

`pass` is a null statement. It performs no operation and is useful when a syntactically required block has not been implemented yet.

---

### Q6. What is a nested loop?

**Answer:**

A loop inside another loop.

Example:

```python
for i in range(3):
    for j in range(3):
        print(i, j)
```

---

### Q7. What is `range(5)`?

**Answer:**

It represents:

```text
0, 1, 2, 3, 4
```

The stop value `5` is excluded.

---

### Q8. When does loop `else` execute?

**Answer:**

The `else` executes when the loop completes normally without encountering `break`.

---

### Q9. What are truthy and falsy values?

**Answer:**

Truthy values behave like `True` in a Boolean context; falsy values behave like `False`.

Examples of falsy values include:

```python
False
None
0
""
[]
{}
```

---

### Q10. What is the time complexity of two nested loops?

If each loop runs `n` times:

\[
O(n^2)
\]

---

### Q11. Why is Fibonacci important?

It teaches:

- iteration
- state updates
- recurrence
- multiple-variable assignment
- algorithmic thinking

---

### Q12. Why do we check prime numbers only up to √n?

Because if a number has a factor larger than √n, its corresponding paired factor must be smaller than √n. Therefore, finding a divisor up to √n is sufficient.

---

# 🧠 37. One-Page Revision Map

```text
                 🐍 CONDITIONS & LOOPS
                         │
          ┌──────────────┴──────────────┐
          │                             │
      CONDITIONS                      LOOPS
          │                             │
   ┌──────┼────────┐             ┌──────┼──────┐
   │      │        │             │      │      │
   if   if-else  elif           for   while nested
   │      │        │             │      │
   │    ternary   match          │    range
   │      │        │             │
   └──────┴────────┘             ├── break
          │                      ├── continue
       Truthy                     ├── pass
       Falsy                      ├── else
                                  ├── enumerate
                                  └── zip
                                      │
                                      ▼
                              PATTERN PROBLEMS
                                      │
                      ┌───────────────┼───────────────┐
                      │               │               │
                    Stars           Numbers         Pyramid
                      │
                      ├── Searching
                      ├── Counting
                      ├── Prime
                      ├── Fibonacci
                      └── Factorial
```

# ⭐ Final Mental Model

Remember these **7 ideas** and most of this chapter becomes easy:

```text
1️⃣ if       → Make a decision
2️⃣ elif     → Check another condition
3️⃣ else     → Otherwise
4️⃣ for      → Repeat over items
5️⃣ while    → Repeat while condition is true
6️⃣ break    → Stop the loop
7️⃣ continue → Skip this round
```

And for programming/DSA:

```text
CONDITION
   ↓
DECISION
   ↓
LOOP
   ↓
REPEAT
   ↓
COUNT / SUM / SEARCH / COMPARE
   ↓
ALGORITHM
```

**Most important concepts to master before moving forward:** `if-elif-else`, truthy/falsy, `for`, `while`, `range()`, nested loops, `break/continue`, `enumerate()`, `zip()`, and the **count/search/sum/max/min patterns**. These become the foundation for strings, lists, functions, DSA, machine learning preprocessing, and algorithmic problem solving.
