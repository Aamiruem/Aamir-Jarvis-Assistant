# Variables, Data Types, Operators and Control Flow

## Variables and Data Types

A variable is a container used to store information. In Python, variables are created simply by assigning a value.

```python
name = "Aamir"
age = 25
is_student = True
```

Common data types include:
- int: whole numbers such as 3, 12, 100
- float: decimal numbers such as 3.14, 2.5
- str: text values such as "hello"
- bool: True or False
- list: ordered collection of values
- tuple: immutable ordered values
- dict: key-value pairs

## Operators

Operators let us work with values.

### Arithmetic operators
- `+` addition
- `-` subtraction
- `*` multiplication
- `/` division
- `%` modulus
- `**` exponent

```python
x = 10
y = 5
print(x + y)
print(x % y)
```

### Comparison operators
- `==` equal to
- `!=` not equal to
- `>` greater than
- `<` less than
- `>=` greater than or equal to
- `<=` less than or equal to

### Logical operators
- `and`
- `or`
- `not`

## Conditional Statements

Conditions decide whether code runs.

```python
marks = 85
if marks >= 90:
    print("A Grade")
elif marks >= 75:
    print("B Grade")
else:
    print("Needs improvement")
```

This is the foundation of decision-making in programs and AI pipelines.

## Loops

Loop structures help repeat a step multiple times.

### For loop
```python
for i in range(5):
    print(i)
```

### While loop
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

Loops are used whenever you need to process many rows, features, or model iterations.

## Functions

A function is a reusable block of code that performs a task.

```python
def add(a, b):
    return a + b

result = add(3, 4)
print(result)
```

Functions make programs modular, easier to test, and easier to maintain. In AI work, functions are used to format data, train models, and evaluate performance.

# Key Takeaway

Mastering variables, data types, operators, conditions, loops, and functions is the first major step toward AIML. Every advanced concept builds on this foundation.
