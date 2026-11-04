> **You asked:**
>
> -
>
>  
>
> ---
>
> **Chapter 10: Functions**
>
> **Topics**
>
> - Defining      and calling functions 
> - Function      parameters and arguments 
> - Positional      arguments 
> - Keyword      arguments 
> - Default      arguments 
> - Variable-length      arguments 
> - \*args      
> - \*\*kwargs      
> - Return      values 
> - Multiple      return values 
> - Local      and global scope 
> - global      
> - nonlocal      
> - Lambda      functions 
> - Recursion      
> - First-class      functions 
> - Higher-order      functions 
> - Closures      
> - Decorators      
>
> **Functional programming**
>
> - map()      
> - filter()      
> - reduce()      
> - any()      
> - all()      
> - sorted()      with key functions     Explain the chapter \<Topicwise> in detail.
>    Break down all concepts step by step in very simple language.
>    Include:
>
> 1. Clear definitions of each concept
> 2. Important formulas with parameter names explained
> 3. Real-world examples for each concept
> 4. Visualizations or diagrams to make it intuitive (use graphs and colorful notes)
> 5. Conceptual code examples (Python preferred) with dry run tables
> 6. Common mistakes and how to avoid them
> 7. Interview-style questions with answers for practice
>
> Make the explanation very conceptual, beginner-friendly, and structured like a study guide.
>
> Use graphs, colorful notes, and highlight formulas with parameter names for clarity.
>
> Provide complete Python code examples with dry run tables for understanding.
>
> colorful notes and diagram and difficult word explain to easy meaning explain all concept through diagram and color full Notes basics to advanced and most conceptual asked code and write every word very easy mean  mind map

# 🐍 Chapter 10 — Python Functions
### Basics → Intermediate → Advanced → Interview Level

Functions are one of the **most important Python concepts**. They help you write code once and reuse it many times.

---

# 🧠 1. What is a Function?

### Easy meaning

A **function** is a named block of code that performs a particular task.

Think of it like a **machine**:

```text
        INPUT
          ↓
   ┌─────────────┐
   │   FUNCTION  │
   │  Processing │
   └─────────────┘
          ↓
        OUTPUT
```

Example:

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

Output:

```text
30
```

### Important words

| Word | Easy meaning |
|---|---|
| `def` | Create a function |
| Function name | Name of the function |
| Parameter | Variable that receives input |
| Argument | Actual value given to function |
| `return` | Send result back |
| Call | Run the function |

---

# 🌳 Function Mind Map

```text
                         FUNCTIONS
                             │
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
     Basics              Arguments             Return
        │                    │                    │
     def/call          positional             single
                         keyword              multiple
                         default
                         *args
                         **kwargs
        │
        ├────────────── Scope ──────────────┐
        │                                   │
      local                               global
                                            │
                                         nonlocal
        │
        ├────────────── Functional Programming
        │
        │       ├── map()
        │       ├── filter()
        │       ├── reduce()
        │       ├── any()
        │       ├── all()
        │       └── sorted(key=...)
        │
        └────────────── Advanced
                │
                ├── Lambda
                ├── Recursion
                ├── First-class functions
                ├── Higher-order functions
                ├── Closures
                └── Decorators
```

---

# 🟢 2. Defining and Calling Functions

## Definition

A function is defined using `def`.

```python
def greet():
    print("Hello")
```

But defining a function does **not** execute it.

You need to call it:

```python
greet()
```

Output:

```text
Hello
```

### Flow

```text
def greet():
      ↓
Function created
      ↓
greet()
      ↓
Function executes
      ↓
Hello
```

---

# 🟢 3. Function Parameters and Arguments

Consider:

```python
def add(a, b):
    return a + b

add(10, 20)
```

Here:

```text
a, b       → parameters
10, 20     → arguments
```

### Easy difference

> **Parameter = placeholder**

> **Argument = actual value**

```python
def square(number):     # number = parameter
    return number ** 2

square(5)               # 5 = argument
```

---

# 🟢 4. Positional Arguments

Values are assigned according to their **position**.

```python
def student(name, age):
    print(name)
    print(age)

student("Aamir", 22)
```

Mapping:

```text
name ← "Aamir"
age  ← 22
```

### Dry Run

| Step | name | age |
|---|---|---:|
| Function called | Aamir | 22 |
| print(name) | Aamir | |
| print(age) | | 22 |

---

# 🟢 5. Keyword Arguments

You explicitly specify parameter names.

```python
def student(name, age):
    print(name, age)

student(age=22, name="Aamir")
```

Even though the order changed, Python knows where values belong.

```text
age  → 22
name → Aamir
```

### Advantage

Keyword arguments improve readability.

---

# 🟢 6. Default Arguments

A parameter can have a default value.

```python
def greet(name, message="Hello"):
    print(message, name)

greet("Aamir")
```

Output:

```text
Hello Aamir
```

If you provide another value:

```python
greet("Aamir", "Good morning")
```

Output:

```text
Good morning Aamir
```

### Rule

```text
Value supplied?
      │
   ┌──┴──┐
  Yes    No
   ↓      ↓
use it   use default
```

### ⚠️ Important mistake

Avoid mutable default values like:

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

Better:

```python
def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items
```

---

# 🟢 7. Variable-Length Arguments

Sometimes you don't know how many values the function will receive.

Python provides:

```text
*args
**kwargs
```

---

# 🔵 8. `*args`

`*args` collects multiple **positional arguments** into a tuple.

```python
def add(*numbers):
    return sum(numbers)

print(add(10, 20))
print(add(10, 20, 30, 40))
```

Output:

```text
30
100
```

Internally:

```text
add(10,20,30)

numbers
   ↓
(10, 20, 30)
```

### Dry run

| Call | `numbers` | `sum()` |
|---|---|---:|
| `add(10,20)` | `(10,20)` | 30 |
| `add(10,20,30)` | `(10,20,30)` | 60 |

---

# 🔵 9. `**kwargs`

`**kwargs` collects multiple **keyword arguments** into a dictionary.

```python
def student(**details):
    print(details)

student(name="Aamir", age=22, city="Jaipur")
```

Output:

```python
{'name': 'Aamir', 'age': 22, 'city': 'Jaipur'}
```

Concept:

```text
**kwargs
   ↓
Dictionary
   ↓
key → value
```

---

# ⭐ `*args` vs `**kwargs`

| Feature | `*args` | `**kwargs` |
|---|---|---|
| Input | Positional | Keyword |
| Stores as | Tuple | Dictionary |
| Example | `10, 20` | `name="Aamir"` |

---

# 🟢 10. Return Values

`return` sends a result back to the caller.

```python
def square(x):
    return x * x

result = square(5)

print(result)
```

Output:

```text
25
```

### `print()` vs `return`

```text
print()
  ↓
Displays result

return
  ↓
Sends result back
```

Example:

```python
def add(a, b):
    print(a + b)
```

The function displays the result but doesn't return it.

```python
def add(a, b):
    return a + b
```

Now:

```python
x = add(10, 20)
```

`x` contains `30`.

---

# 🟢 11. Multiple Return Values

Python can return multiple values.

```python
def calculate(a, b):
    return a + b, a - b, a * b

x, y, z = calculate(10, 5)

print(x)
print(y)
print(z)
```

Output:

```text
15
5
50
```

Actually Python returns a tuple:

```python
(15, 5, 50)
```

---

# 🟣 12. Scope

**Scope = where a variable can be accessed.**

Think:

```text
Python Program
│
├── Global Area
│     ↓
│   global variables
│
└── Function
      ↓
    local variables
```

---

# 🟢 13. Local Scope

A variable created inside a function is normally local.

```python
def test():
    x = 10
    print(x)

test()
```

This works.

But:

```python
def test():
    x = 10

test()

print(x)
```

causes:

```text
NameError
```

because `x` belongs to the function.

---

# 🟢 14. Global Scope

A variable outside functions is global.

```python
x = 100

def show():
    print(x)

show()
```

Output:

```text
100
```

The function can read the global variable.

---

# 🔴 15. `global`

Use `global` when you want to modify a global variable inside a function.

```python
count = 0

def increase():
    global count
    count += 1

increase()

print(count)
```

Output:

```text
1
```

### ⚠️ Best practice

Avoid excessive use of `global`.

Prefer:

```python
def increase(count):
    return count + 1

count = increase(count)
```

This is easier to understand and test.

---

# 🟣 16. `nonlocal`

`nonlocal` is used inside a nested function to modify a variable from the **outer function**.

```python
def outer():
    x = 10

    def inner():
        nonlocal x
        x += 1

    inner()
    return x

print(outer())
```

Output:

```text
11
```

Scope hierarchy:

```text
Global
  ↓
outer()
  ↓
inner()
```

`nonlocal` means:

> "Use the variable from my nearest outer function."

---

# 🟢 17. Lambda Functions

A lambda is a small anonymous function.

### Normal function

```python
def square(x):
    return x * x
```

### Lambda

```python
square = lambda x: x * x
```

Usage:

```python
print(square(5))
```

Output:

```text
25
```

Syntax:

```text
lambda parameters : expression
```

Example:

```python
lambda x: x + 10
```

---

# 🟢 18. Recursion

**Recursion = a function calling itself.**

Example:

```python
def countdown(n):
    if n == 0:
        return

    print(n)
    countdown(n - 1)

countdown(3)
```

Output:

```text
3
2
1
```

### Diagram

```text
countdown(3)
     ↓
countdown(2)
     ↓
countdown(1)
     ↓
countdown(0)
     ↓
STOP
```

A recursive function needs a:

### Base case

Condition that stops recursion.

Without it:

```python
def test():
    test()
```

the function keeps calling itself until Python raises `RecursionError`.

---

# ⭐ 19. Factorial Using Recursion

Formula:

\[
n! = n \times (n-1)!
\]

Base case:

\[
0! = 1
\]

Code:

```python
def factorial(n):
    if n == 0:
        return 1

    return n * factorial(n - 1)

print(factorial(5))
```

### Dry Run

```text
factorial(5)
= 5 × factorial(4)
= 5 × 4 × factorial(3)
= 5 × 4 × 3 × factorial(2)
= 5 × 4 × 3 × 2 × factorial(1)
= 5 × 4 × 3 × 2 × 1 × factorial(0)
= 120
```

| Call | Calculation | Result |
|---|---|---:|
| `factorial(0)` | 1 | 1 |
| `factorial(1)` | 1 × 1 | 1 |
| `factorial(2)` | 2 × 1 | 2 |
| `factorial(3)` | 3 × 2 | 6 |
| `factorial(4)` | 4 × 6 | 24 |
| `factorial(5)` | 5 × 24 | **120** |

---

# 🟣 20. First-Class Functions

Python treats functions like normal objects.

That means you can:

- store a function in a variable
- pass a function to another function
- return a function from another function
- store functions in lists/dictionaries

Example:

```python
def greet():
    return "Hello"

message = greet

print(message())
```

Output:

```text
Hello
```

Notice:

```python
message = greet
```

not:

```python
message = greet()
```

The first stores the function.

The second executes it.

---

# 🟣 21. Higher-Order Functions

A **higher-order function** is a function that:

1. accepts another function, or
2. returns another function.

Example:

```python
def apply_operation(func, x):
    return func(x)

def square(x):
    return x * x

print(apply_operation(square, 5))
```

Output:

```text
25
```

Flow:

```text
square()
   ↓
apply_operation()
   ↓
square(5)
   ↓
25
```

---

# 🔵 22. Closures

A closure happens when an inner function remembers a variable from its outer function even after the outer function has finished.

Example:

```python
def multiplier(n):

    def multiply(x):
        return x * n

    return multiply

double = multiplier(2)

print(double(5))
```

Output:

```text
10
```

Concept:

```text
multiplier(2)
      ↓
 n = 2
      ↓
 returns multiply()
      ↓
double remembers n = 2
      ↓
double(5)
      ↓
10
```

### Easy meaning

> **Closure = function + remembered outer data**

---

# 🔥 23. Decorators

A decorator is a function that **adds extra behavior to another function without changing its original code**.

Think:

```text
Original Function
       ↓
   Decorator
       ↓
Extra behavior
       ↓
Enhanced Function
```

Example:

```python
def logger(func):

    def wrapper():
        print("Function started")
        func()
        print("Function finished")

    return wrapper


@logger
def greet():
    print("Hello")


greet()
```

Output:

```text
Function started
Hello
Function finished
```

### What does `@logger` mean?

This:

```python
@logger
def greet():
    print("Hello")
```

is approximately:

```python
greet = logger(greet)
```

---

# 🔥 Decorator With Arguments

For real-world functions, use `*args` and `**kwargs`.

```python
def logger(func):

    def wrapper(*args, **kwargs):
        print("Function started")

        result = func(*args, **kwargs)

        print("Function finished")

        return result

    return wrapper


@logger
def add(a, b):
    return a + b


print(add(10, 20))
```

Output:

```text
Function started
Function finished
30
```

This pattern is extremely important for interviews.

---

# 🟢 24. `map()`

`map()` applies a function to every item.

Example:

```python
numbers = [1, 2, 3, 4]

result = map(lambda x: x * 2, numbers)

print(list(result))
```

Output:

```text
[2, 4, 6, 8]
```

Flow:

```text
1 → ×2 → 2
2 → ×2 → 4
3 → ×2 → 6
4 → ×2 → 8
```

### Dry Run

| Input | Function | Output |
|---:|---|---:|
| 1 | `1*2` | 2 |
| 2 | `2*2` | 4 |
| 3 | `3*2` | 6 |
| 4 | `4*2` | 8 |

---

# 🟢 25. `filter()`

`filter()` keeps only items that satisfy a condition.

```python
numbers = [1, 2, 3, 4, 5, 6]

result = filter(lambda x: x % 2 == 0, numbers)

print(list(result))
```

Output:

```text
[2, 4, 6]
```

Flow:

```text
1 → even? ❌
2 → even? ✅
3 → even? ❌
4 → even? ✅
5 → even? ❌
6 → even? ✅
```

---

# 🟢 26. `reduce()`

`reduce()` repeatedly combines values into one final result.

You import it:

```python
from functools import reduce
```

Example:

```python
numbers = [1, 2, 3, 4]

result = reduce(lambda a, b: a + b, numbers)

print(result)
```

Output:

```text
10
```

Dry run:

```text
1 + 2 = 3
3 + 3 = 6
6 + 4 = 10
```

### Diagram

```text
[1, 2, 3, 4]
     ↓
   1 + 2
     ↓
     3
   3 + 3
     ↓
     6
   6 + 4
     ↓
    10
```

---

# ⭐ `map()` vs `filter()` vs `reduce()`

| Function | Purpose | Result |
|---|---|---|
| `map()` | Transform every item | Many items |
| `filter()` | Select items | Some items |
| `reduce()` | Combine items | Usually one value |

Easy memory trick:

```text
MAP    → CHANGE
FILTER → SELECT
REDUCE → COMBINE
```

---

# 🟢 27. `any()`

Returns `True` if **at least one** item is true.

```python
numbers = [1, 3, 5, 8]

print(any(x % 2 == 0 for x in numbers))
```

Output:

```text
True
```

Because `8` is even.

Think:

```text
False
False
False
True
  ↓
ANY = True
```

---

# 🟢 28. `all()`

Returns `True` only if **every** item is true.

```python
numbers = [2, 4, 6, 8]

print(all(x % 2 == 0 for x in numbers))
```

Output:

```text
True
```

If:

```python
numbers = [2, 4, 5, 8]
```

then:

```text
False
```

because `5` is odd.

### Easy memory

```text
any() → at least ONE
all() → EVERY ONE
```

---

# 🟢 29. `sorted()` With `key`

`key` tells Python **what property to use for sorting**.

Example:

```python
students = [
    ("Aamir", 85),
    ("Rahul", 72),
    ("Sara", 92)
]

result = sorted(students, key=lambda student: student[1])

print(result)
```

Output:

```python
[('Rahul', 72), ('Aamir', 85), ('Sara', 92)]
```

Why?

```text
Aamir → 85
Rahul → 72
Sara  → 92
```

Python sorts using the second value.

---

# 🔥 Reverse Sorting

```python
result = sorted(
    students,
    key=lambda student: student[1],
    reverse=True
)

print(result)
```

Output:

```python
[('Sara', 92), ('Aamir', 85), ('Rahul', 72)]
```

---

# 🧠 Complete Functional Programming Flow

```text
                  DATA
                   │
       ┌───────────┼───────────┐
       ↓           ↓           ↓
      map        filter      reduce
       │           │           │
    CHANGE       SELECT      COMBINE
       │           │           │
       └───────────┼───────────┘
                   ↓
                 RESULT
```

---

# 💻 Complete Conceptual Python Example

```python
from functools import reduce


def process_numbers(numbers):
    # map → double every number
    doubled = list(map(lambda x: x * 2, numbers))

    # filter → keep numbers greater than 5
    filtered = list(filter(lambda x: x > 5, doubled))

    # reduce → calculate total
    total = reduce(lambda a, b: a + b, filtered, 0)

    return doubled, filtered, total


numbers = [1, 2, 3, 4]

doubled, filtered, total = process_numbers(numbers)

print("Original:", numbers)
print("Doubled:", doubled)
print("Filtered:", filtered)
print("Total:", total)
```

Output:

```text
Original: [1, 2, 3, 4]
Doubled: [2, 4, 6, 8]
Filtered: [6, 8]
Total: 14
```

### Dry Run

| Stage | Data |
|---|---|
| Original | `[1,2,3,4]` |
| `map()` | `[2,4,6,8]` |
| `filter()` | `[6,8]` |
| `reduce()` | `14` |

---

# 🧩 30. Function Execution Memory Concept

When a function runs, Python creates a **local execution frame**.

Example:

```python
def add(a, b):
    result = a + b
    return result

x = add(10, 20)
```

Conceptually:

```text
Global Frame
────────────────
x
│
└── 30

        ↓ call

Function Frame
────────────────
a = 10
b = 20
result = 30
        ↓
      return
        ↓
Global x = 30
```

After the function returns, its local variables normally become inaccessible.

---

# 🧠 Function Parameter Order

A useful advanced rule is:

```python
def function(
    positional,
    /,
    normal,
    *,
    keyword_only
):
    pass
```

The `/` and `*` can control how arguments are supplied.

Example:

```python
def add(a, b, /, c=0):
    return a + b + c

print(add(1, 2, 3))
```

`a` and `b` are positional-only.

Another example:

```python
def greet(name, *, message="Hello"):
    print(message, name)

greet("Aamir", message="Hi")
```

Here `message` must be supplied as a keyword.

---

# 📌 Important Formula Section

Functions themselves don't have one universal mathematical formula, but common function-related formulas include:

### Average

\[
Average = \frac{\sum_{i=1}^{n}x_i}{n}
\]

Where:

- \(x_i\) = each value
- \(n\) = number of values

Python:

```python
def average(numbers):
    return sum(numbers) / len(numbers)
```

---

### Factorial

\[
n! = n \times (n-1) \times \cdots \times 1
\]

Recursive form:

\[
n! = n(n-1)!
\]

Base:

\[
0! = 1
\]

---

### Power

\[
x^n = x \times x \times \cdots \times x
\]

Python:

```python
def power(x, n):
    return x ** n
```

---

# ⚠️ Common Mistakes

## Mistake 1 — Forgetting parentheses while calling

Wrong:

```python
greet
```

Correct:

```python
greet()
```

---

## Mistake 2 — Confusing `print` and `return`

```python
def add(a, b):
    print(a + b)
```

This does not return a usable value.

Better:

```python
def add(a, b):
    return a + b
```

---

## Mistake 3 — Mutable default arguments

Avoid:

```python
def test(items=[]):
    ...
```

Use:

```python
def test(items=None):
    if items is None:
        items = []
```

---

## Mistake 4 — Infinite recursion

Wrong:

```python
def factorial(n):
    return n * factorial(n - 1)
```

There is no stopping condition.

Correct:

```python
def factorial(n):
    if n == 0:
        return 1

    return n * factorial(n - 1)
```

---

## Mistake 5 — Using `global` everywhere

Too much global state makes programs difficult to understand and test.

Prefer parameters and return values.

---

## Mistake 6 — Confusing `*args` and `**kwargs`

Remember:

```text
*args
  ↓
tuple
  ↓
positional values

**kwargs
  ↓
dictionary
  ↓
keyword values
```

---

# 🎯 Interview Questions

### Q1. What is a function?

**Answer:**  
A function is a reusable block of code designed to perform a particular task.

---

### Q2. Parameter vs argument?

**Answer:**

```python
def add(a, b):
```

`a` and `b` are parameters.

```python
add(10, 20)
```

`10` and `20` are arguments.

---

### Q3. What is `*args`?

**Answer:**  
`*args` collects multiple positional arguments into a tuple.

---

### Q4. What is `**kwargs`?

**Answer:**  
`**kwargs` collects multiple keyword arguments into a dictionary.

---

### Q5. What is the difference between `print()` and `return`?

**Answer:**  
`print()` displays a value, while `return` sends a value back to the caller.

---

### Q6. What is recursion?

**Answer:**  
Recursion is a technique where a function calls itself. It must have a base case to stop.

---

### Q7. What is a lambda function?

**Answer:**  
A lambda is a small anonymous function usually containing a single expression.

```python
square = lambda x: x * x
```

---

### Q8. What is a higher-order function?

**Answer:**  
A function that accepts another function as an argument or returns a function.

---

### Q9. What is a closure?

**Answer:**  
A closure is an inner function that remembers variables from its enclosing function even after the enclosing function has finished executing.

---

### Q10. What is a decorator?

**Answer:**  
A decorator is a function that modifies or extends the behavior of another function without directly changing its source code.

---

### Q11. Difference between `map()`, `filter()` and `reduce()`?

**Answer:**

```text
map()    → transform
filter() → select
reduce() → combine
```

---

### Q12. What does `any()` do?

**Answer:**  
Returns `True` if at least one element is truthy.

---

### Q13. What does `all()` do?

**Answer:**  
Returns `True` only if every element is truthy.

---

### Q14. What is the purpose of `key` in `sorted()`?

**Answer:**  
It specifies the function/property Python should use when deciding the sorting order.

---

# 🔥 Most Asked Coding Problems

## 1. Even numbers

```python
def even_numbers(numbers):
    return [x for x in numbers if x % 2 == 0]

print(even_numbers([1, 2, 3, 4, 5, 6]))
```

Output:

```text
[2, 4, 6]
```

---

## 2. Maximum without `max()`

```python
def find_max(numbers):
    largest = numbers[0]

    for number in numbers:
        if number > largest:
            largest = number

    return largest


print(find_max([10, 4, 25, 7]))
```

Output:

```text
25
```

---

## 3. Count vowels

```python
def count_vowels(text):
    count = 0

    for char in text.lower():
        if char in "aeiou":
            count += 1

    return count


print(count_vowels("Aamir"))
```

Output:

```text
3
```

---

## 4. Fibonacci

```python
def fibonacci(n):
    a, b = 0, 1

    for _ in range(n):
        print(a, end=" ")
        a, b = b, a + b


fibonacci(7)
```

Output:

```text
0 1 1 2 3 5 8
```

---

## 5. Palindrome

```python
def is_palindrome(text):
    return text == text[::-1]


print(is_palindrome("madam"))
print(is_palindrome("hello"))
```

Output:

```text
True
False
```

---

# 🗺️ Final Chapter Mind Map

```text
                         🐍 FUNCTIONS
                              │
       ┌──────────────────────┼──────────────────────┐
       ↓                      ↓                      ↓
    BASIC                  ARGUMENTS               RETURN
       │                      │                      │
   def / call             positional              value
                         keyword                  multiple
                         default
                         *args
                         **kwargs
       │
       ├────────────────── SCOPE
       │                     │
       │             ┌───────┼───────┐
       │             ↓       ↓       ↓
       │           local  global  nonlocal
       │
       ├────────────────── FUNCTION TYPES
       │                     │
       │              ┌──────┼──────┐
       │              ↓      ↓      ↓
       │           lambda recursion normal
       │
       ├────────────────── ADVANCED
       │                     │
       │              ┌──────┼──────────┐
       │              ↓      ↓          ↓
       │       first-class higher-order closure
       │
       ├────────────────── DECORATORS
       │
       └────────────────── FUNCTIONAL
                              │
                  ┌───────────┼────────────┐
                  ↓           ↓            ↓
                map()      filter()     reduce()
                  │
                  ├── any()
                  ├── all()
                  └── sorted(key=...)
```

# 🎨 One-Line Revision Notes

```text
Function       → reusable block of code
Parameter      → input placeholder
Argument       → actual input
return         → sends result back
*args          → many positional values → tuple
**kwargs       → many keyword values → dictionary
local          → inside function
global         → outside function
nonlocal       → outer-function variable
lambda         → short anonymous function
recursion      → function calls itself
closure        → function remembers outer data
decorator      → adds behavior to function
map            → transform
filter         → select
reduce         → combine
any            → at least one True
all            → every one True
sorted(key=)   → sort according to a property
```

> 🟨 **Interview Rule:** If you master **parameters/arguments → `*args/**kwargs` → scope → lambda → recursion → first-class functions → higher-order functions → closures → decorators → map/filter/reduce**, you have covered the most important conceptual function topics for Python/AIML interviews.
