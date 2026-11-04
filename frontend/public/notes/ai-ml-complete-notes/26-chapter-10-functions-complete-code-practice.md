> **You asked:**
>
> all type code cover all functions and concept use

Absolutely. Below is a **complete Chapter 10 practical code sheet** covering essentially every function concept in your syllabus, from beginner to advanced, with examples you can run directly.

# 🐍 Chapter 10 — Functions: Complete Code Practice

## 🧠 Complete Concept Map

```text
                         FUNCTIONS
                             │
       ┌─────────────────────┼──────────────────────┐
       ↓                     ↓                      ↓
    BASIC                 ARGUMENTS               RETURN
       │                     │                      │
   def/call              positional              return
                         keyword                  multiple
                         default
                         *args
                         **kwargs
       │
       ├──────────── SCOPE ─────────────┐
       │                                │
      local                          global
                                         │
                                      nonlocal
       │
       ├──────────── FUNCTION TYPES ─────────────
       │
       ├── Lambda
       ├── Recursive
       ├── First-class
       ├── Higher-order
       ├── Closure
       └── Decorator
       │
       └──────── FUNCTIONAL PROGRAMMING
               │
               ├── map()
               ├── filter()
               ├── reduce()
               ├── any()
               ├── all()
               └── sorted(key=...)
```

---

# 1. Basic Function

```python
def greet():
    print("Hello Aamir")


greet()
```

Output:

```text
Hello Aamir
```

Flow:

```text
def greet()
     ↓
Function created
     ↓
greet()
     ↓
Function executes
```

---

# 2. Function Without Parameter

```python
def welcome():
    print("Welcome to Python")


welcome()
```

---

# 3. Function With One Parameter

```python
def greet(name):
    print("Hello", name)


greet("Aamir")
greet("Rahul")
```

Output:

```text
Hello Aamir
Hello Rahul
```

---

# 4. Function With Multiple Parameters

```python
def add(a, b):
    print(a + b)


add(10, 20)
```

Output:

```text
30
```

---

# 5. Positional Arguments

```python
def student(name, age, city):
    print(name)
    print(age)
    print(city)


student("Aamir", 22, "Jaipur")
```

Mapping:

```text
name ← Aamir
age  ← 22
city ← Jaipur
```

---

# 6. Keyword Arguments

```python
def student(name, age, city):
    print(name, age, city)


student(
    city="Jaipur",
    name="Aamir",
    age=22
)
```

Output:

```text
Aamir 22 Jaipur
```

Order doesn't matter when parameter names are specified.

---

# 7. Default Arguments

```python
def greet(name, message="Hello"):
    print(message, name)


greet("Aamir")
greet("Aamir", "Good Morning")
```

Output:

```text
Hello Aamir
Good Morning Aamir
```

---

# 8. Multiple Default Arguments

```python
def student(name, age=22, city="Jaipur"):
    print(name, age, city)


student("Aamir")
student("Rahul", 25)
student("Sara", 21, "Delhi")
```

---

# 9. Positional + Keyword Arguments

```python
def employee(name, age, role):
    print(name, age, role)


employee("Aamir", age=22, role="AI Engineer")
```

### Important rule

Positional arguments normally come **before** keyword arguments.

Correct:

```python
employee("Aamir", age=22, role="AI Engineer")
```

Incorrect:

```python
# employee(name="Aamir", 22, "AI Engineer")
```

---

# 10. `*args`

`*args` accepts any number of positional arguments.

```python
def add(*numbers):
    print(numbers)


add(10)
add(10, 20)
add(10, 20, 30, 40)
```

Output:

```text
(10,)
(10, 20)
(10, 20, 30, 40)
```

`args` is a tuple.

---

# 11. `*args` — Sum

```python
def add(*numbers):
    total = 0

    for number in numbers:
        total += number

    return total


print(add(10, 20))
print(add(10, 20, 30))
```

Output:

```text
30
60
```

---

# 12. `*args` — Maximum

```python
def maximum(*numbers):
    if not numbers:
        return None

    largest = numbers[0]

    for number in numbers:
        if number > largest:
            largest = number

    return largest


print(maximum(10, 50, 20, 90, 30))
```

Output:

```text
90
```

---

# 13. `**kwargs`

`**kwargs` accepts any number of keyword arguments.

```python
def details(**data):
    print(data)


details(
    name="Aamir",
    age=22,
    city="Jaipur"
)
```

Output:

```text
{'name': 'Aamir', 'age': 22, 'city': 'Jaipur'}
```

`kwargs` is a dictionary.

---

# 14. `**kwargs` Traversal

```python
def details(**data):
    for key, value in data.items():
        print(key, "=", value)


details(
    name="Aamir",
    role="AI Engineer",
    experience=1
)
```

Output:

```text
name = Aamir
role = AI Engineer
experience = 1
```

---

# 15. Combining Normal Parameters, `*args`, and `**kwargs`

```python
def employee(name, *skills, **details):

    print("Name:", name)
    print("Skills:", skills)
    print("Details:", details)


employee(
    "Aamir",
    "Python",
    "Machine Learning",
    "SQL",
    age=22,
    city="Jaipur"
)
```

Output:

```text
Name: Aamir
Skills: ('Python', 'Machine Learning', 'SQL')
Details: {'age': 22, 'city': 'Jaipur'}
```

---

# 16. Return Value

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

---

# 17. Return Multiple Values

```python
def calculate(a, b):
    addition = a + b
    subtraction = a - b
    multiplication = a * b

    return addition, subtraction, multiplication


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

Technically:

```python
return (15, 5, 50)
```

---

# 18. `return` Immediately Stops Function

```python
def test():
    print("Start")

    return 100

    print("End")


print(test())
```

Output:

```text
Start
100
```

`"End"` never executes.

---

# 19. Function Returning Boolean

```python
def is_even(number):
    return number % 2 == 0


print(is_even(10))
print(is_even(7))
```

Output:

```text
True
False
```

---

# 20. Function Returning Another Function Result

```python
def square(x):
    return x * x


def cube(x):
    return x * x * x


print(square(5))
print(cube(5))
```

---

# 21. Local Scope

```python
def test():
    x = 10
    print(x)


test()
```

`x` exists inside the function.

---

# 22. Global Scope

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

---

# 23. `global`

```python
count = 0


def increase():
    global count
    count += 1


increase()
increase()

print(count)
```

Output:

```text
2
```

---

# 24. `nonlocal`

```python
def outer():

    x = 10

    def inner():
        nonlocal x
        x += 5

    inner()

    return x


print(outer())
```

Output:

```text
15
```

---

# 25. Lambda Function

Normal:

```python
def square(x):
    return x * x
```

Lambda:

```python
square = lambda x: x * x

print(square(5))
```

Output:

```text
25
```

---

# 26. Lambda With Two Parameters

```python
add = lambda a, b: a + b

print(add(10, 20))
```

Output:

```text
30
```

---

# 27. Lambda With Condition

```python
check = lambda x: "Even" if x % 2 == 0 else "Odd"

print(check(10))
print(check(7))
```

Output:

```text
Even
Odd
```

---

# 28. First-Class Function

Functions can be stored in variables.

```python
def greet():
    return "Hello"


message = greet

print(message())
```

Here:

```text
greet
  ↓
message
  ↓
same function
```

---

# 29. Function as List Element

```python
def add(a, b):
    return a + b


def multiply(a, b):
    return a * b


operations = [add, multiply]

print(operations[0](10, 20))
print(operations[1](10, 20))
```

Output:

```text
30
200
```

---

# 30. Function as Dictionary Value

```python
def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


operations = {
    "add": add,
    "subtract": subtract
}


print(operations["add"](10, 5))
print(operations["subtract"](10, 5))
```

Output:

```text
15
5
```

This is very useful for building command systems.

---

# 31. Higher-Order Function

```python
def apply_operation(function, number):
    return function(number)


def square(x):
    return x * x


print(apply_operation(square, 5))
```

Output:

```text
25
```

Diagram:

```text
square()
   ↓
apply_operation()
   ↓
5
   ↓
25
```

---

# 32. Higher-Order Function Returning Function

```python
def operation(operator):

    if operator == "add":
        return lambda a, b: a + b

    elif operator == "multiply":
        return lambda a, b: a * b


add = operation("add")
multiply = operation("multiply")

print(add(10, 20))
print(multiply(10, 20))
```

Output:

```text
30
200
```

---

# 33. Recursion

```python
def countdown(n):

    if n == 0:
        return

    print(n)

    countdown(n - 1)


countdown(5)
```

Output:

```text
5
4
3
2
1
```

---

# 34. Recursive Factorial

```python
def factorial(n):

    if n == 0:
        return 1

    return n * factorial(n - 1)


print(factorial(5))
```

Dry run:

```text
factorial(5)
 ↓
5 × factorial(4)
 ↓
5 × 4 × factorial(3)
 ↓
5 × 4 × 3 × factorial(2)
 ↓
5 × 4 × 3 × 2 × factorial(1)
 ↓
5 × 4 × 3 × 2 × 1 × factorial(0)
 ↓
120
```

---

# 35. Recursive Fibonacci

```python
def fibonacci(n):

    if n <= 1:
        return n

    return fibonacci(n - 1) + fibonacci(n - 2)


for i in range(7):
    print(fibonacci(i), end=" ")
```

Output:

```text
0 1 1 2 3 5 8
```

⚠️ Recursive Fibonacci is simple for learning but inefficient for larger `n`.

---

# 36. Closure

```python
def multiplier(n):

    def multiply(x):
        return x * n

    return multiply


double = multiplier(2)
triple = multiplier(3)

print(double(5))
print(triple(5))
```

Output:

```text
10
15
```

The inner function remembers `n`.

```text
multiplier(2)
      ↓
     n=2
      ↓
 multiply remembers n
      ↓
 double(5)
      ↓
     10
```

---

# 37. Closure Counter

```python
def counter():

    count = 0

    def increase():
        nonlocal count
        count += 1
        return count

    return increase


counter1 = counter()

print(counter1())
print(counter1())
print(counter1())
```

Output:

```text
1
2
3
```

This is an excellent interview example combining:

```text
closure + nonlocal
```

---

# 38. Basic Decorator

```python
def decorator(function):

    def wrapper():
        print("Before function")

        function()

        print("After function")

    return wrapper


@decorator
def greet():
    print("Hello")


greet()
```

Output:

```text
Before function
Hello
After function
```

---

# 39. Decorator Internally

This:

```python
@decorator
def greet():
    print("Hello")
```

is approximately:

```python
def greet():
    print("Hello")


greet = decorator(greet)
```

---

# 40. Decorator With Arguments

```python
def decorator(function):

    def wrapper(*args, **kwargs):

        print("Function started")

        result = function(*args, **kwargs)

        print("Function completed")

        return result

    return wrapper


@decorator
def add(a, b):
    return a + b


print(add(10, 20))
```

Output:

```text
Function started
Function completed
30
```

---

# 41. Timing Decorator

A realistic example:

```python
import time


def timer(function):

    def wrapper(*args, **kwargs):

        start = time.perf_counter()

        result = function(*args, **kwargs)

        end = time.perf_counter()

        print("Time:",
              end - start,
              "seconds")

        return result

    return wrapper


@timer
def calculate():
    total = 0

    for i in range(1_000_000):
        total += i

    return total


print(calculate())
```

This is a common practical use of decorators.

---

# 42. `map()`

```python
numbers = [1, 2, 3, 4, 5]

result = map(lambda x: x * 2, numbers)

print(list(result))
```

Output:

```text
[2, 4, 6, 8, 10]
```

---

# 43. `map()` With Normal Function

```python
def square(x):
    return x * x


numbers = [1, 2, 3, 4, 5]

result = map(square, numbers)

print(list(result))
```

Output:

```text
[1, 4, 9, 16, 25]
```

---

# 44. `map()` With Two Lists

```python
a = [1, 2, 3]
b = [10, 20, 30]

result = map(lambda x, y: x + y, a, b)

print(list(result))
```

Output:

```text
[11, 22, 33]
```

Diagram:

```text
1 + 10 → 11
2 + 20 → 22
3 + 30 → 33
```

---

# 45. `filter()`

```python
numbers = [1, 2, 3, 4, 5, 6]

result = filter(lambda x: x % 2 == 0, numbers)

print(list(result))
```

Output:

```text
[2, 4, 6]
```

---

# 46. `filter()` With Function

```python
def is_even(x):
    return x % 2 == 0


numbers = [1, 2, 3, 4, 5, 6]

print(list(filter(is_even, numbers)))
```

---

# 47. `reduce()`

Import:

```python
from functools import reduce
```

Example:

```python
numbers = [1, 2, 3, 4, 5]

result = reduce(
    lambda a, b: a + b,
    numbers
)

print(result)
```

Output:

```text
15
```

Dry run:

```text
1 + 2 = 3
3 + 3 = 6
6 + 4 = 10
10 + 5 = 15
```

---

# 48. `reduce()` — Product

```python
from functools import reduce


numbers = [1, 2, 3, 4, 5]

product = reduce(
    lambda a, b: a * b,
    numbers
)

print(product)
```

Output:

```text
120
```

---

# 49. `any()`

```python
numbers = [1, 3, 5, 8]

result = any(x % 2 == 0 for x in numbers)

print(result)
```

Output:

```text
True
```

Because at least one number is even.

---

# 50. `all()`

```python
numbers = [2, 4, 6, 8]

result = all(x % 2 == 0 for x in numbers)

print(result)
```

Output:

```text
True
```

---

# 51. `any()` vs `all()`

```python
numbers = [2, 4, 5, 8]

print(any(x % 2 == 0 for x in numbers))
print(all(x % 2 == 0 for x in numbers))
```

Output:

```text
True
False
```

Because:

```text
any → one or more
all → every one
```

---

# 52. `sorted()` With Function

```python
numbers = [5, 2, 9, 1, 7]

result = sorted(numbers)

print(result)
```

Output:

```text
[1, 2, 5, 7, 9]
```

---

# 53. `sorted()` With `key`

Sort strings by length:

```python
words = [
    "python",
    "AI",
    "machine",
    "ML"
]

result = sorted(words, key=len)

print(result)
```

Output:

```text
['AI', 'ML', 'python', 'machine']
```

---

# 54. `sorted()` With Lambda

```python
students = [
    ("Aamir", 85),
    ("Rahul", 72),
    ("Sara", 92),
    ("John", 65)
]

result = sorted(
    students,
    key=lambda student: student[1]
)

print(result)
```

Output:

```text
[
    ('John', 65),
    ('Rahul', 72),
    ('Aamir', 85),
    ('Sara', 92)
]
```

---

# 55. Descending Order

```python
students = [
    ("Aamir", 85),
    ("Rahul", 72),
    ("Sara", 92)
]

result = sorted(
    students,
    key=lambda student: student[1],
    reverse=True
)

print(result)
```

Output:

```text
[
    ('Sara', 92),
    ('Aamir', 85),
    ('Rahul', 72)
]
```

---

# 56. Function With List

```python
def calculate_total(numbers):
    return sum(numbers)


marks = [80, 75, 90, 85]

print(calculate_total(marks))
```

---

# 57. Function Modifying a List

```python
def add_number(numbers):
    numbers.append(100)


values = [1, 2, 3]

add_number(values)

print(values)
```

Output:

```text
[1, 2, 3, 100]
```

Lists are mutable.

---

# 58. Function With Dictionary

```python
def print_student(student):

    print("Name:", student["name"])
    print("Age:", student["age"])


student = {
    "name": "Aamir",
    "age": 22
}

print_student(student)
```

---

# 59. Function Returning Dictionary

```python
def create_student(name, age, skill):

    return {
        "name": name,
        "age": age,
        "skill": skill
    }


student = create_student(
    "Aamir",
    22,
    "Machine Learning"
)

print(student)
```

---

# 60. Function Composition

One function's output becomes another function's input.

```python
def square(x):
    return x * x


def add_ten(x):
    return x + 10


result = add_ten(square(5))

print(result)
```

Flow:

```text
5
↓
square()
↓
25
↓
add_ten()
↓
35
```

---

# 61. Function Factory

A function can create another function.

```python
def create_multiplier(number):

    def multiply(x):
        return x * number

    return multiply


double = create_multiplier(2)
triple = create_multiplier(3)
ten_times = create_multiplier(10)

print(double(5))
print(triple(5))
print(ten_times(5))
```

Output:

```text
10
15
50
```

This combines:

```text
higher-order function
+
closure
```

---

# 62. Practical Mini Project — Calculator

This combines several function concepts.

```python
def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):

    if b == 0:
        return "Cannot divide by zero"

    return a / b


def calculator():

    print("1. Add")
    print("2. Subtract")
    print("3. Multiply")
    print("4. Divide")

    choice = input("Enter choice: ")

    a = float(input("Enter first number: "))
    b = float(input("Enter second number: "))

    if choice == "1":
        return add(a, b)

    elif choice == "2":
        return subtract(a, b)

    elif choice == "3":
        return multiply(a, b)

    elif choice == "4":
        return divide(a, b)

    else:
        return "Invalid choice"


print(calculator())
```

---

# 🔥 63. Practical Mini Project — Student Result

```python
def calculate_total(marks):
    return sum(marks)


def calculate_percentage(marks):
    return sum(marks) / len(marks)


def calculate_grade(percentage):

    if percentage >= 90:
        return "A"

    elif percentage >= 80:
        return "B"

    elif percentage >= 70:
        return "C"

    elif percentage >= 60:
        return "D"

    else:
        return "F"


def student_result(name, marks):

    total = calculate_total(marks)
    percentage = calculate_percentage(marks)
    grade = calculate_grade(percentage)

    return {
        "name": name,
        "total": total,
        "percentage": percentage,
        "grade": grade
    }


result = student_result(
    "Aamir",
    [85, 90, 78, 88, 92]
)

print(result)
```

---

# 🚀 64. Advanced — Decorator for Authentication

A simple conceptual example:

```python
def login_required(function):

    def wrapper(is_logged_in, *args, **kwargs):

        if not is_logged_in:
            return "Please login first"

        return function(*args, **kwargs)

    return wrapper


@login_required
def dashboard():
    return "Welcome to dashboard"


print(dashboard(False))
print(dashboard(True))
```

Output:

```text
Please login first
Welcome to dashboard
```

This is similar to the idea behind authentication middleware in web applications.

---

# 🧠 65. Advanced — `*args` + `**kwargs` Decorator

This is the pattern you should remember for interviews:

```python
def logger(function):

    def wrapper(*args, **kwargs):

        print("Calling:", function.__name__)

        result = function(*args, **kwargs)

        print("Result:", result)

        return result

    return wrapper


@logger
def multiply(a, b):
    return a * b


multiply(5, 10)
```

Output:

```text
Calling: multiply
Result: 50
```

---

# 🧩 66. Complete Functional Pipeline

```python
from functools import reduce


numbers = [1, 2, 3, 4, 5, 6]


# 1. map → square
squared = list(
    map(lambda x: x ** 2, numbers)
)


# 2. filter → values greater than 10
filtered = list(
    filter(lambda x: x > 10, squared)
)


# 3. reduce → total
total = reduce(
    lambda a, b: a + b,
    filtered,
    0
)


print("Original:", numbers)
print("Squared:", squared)
print("Filtered:", filtered)
print("Total:", total)
```

Output:

```text
Original: [1, 2, 3, 4, 5, 6]
Squared: [1, 4, 9, 16, 25, 36]
Filtered: [16, 25, 36]
Total: 77
```

### Complete flow

```text
[1,2,3,4,5,6]
       ↓
      map
       ↓
[1,4,9,16,25,36]
       ↓
    filter >10
       ↓
[16,25,36]
       ↓
     reduce
       ↓
      77
```

---

# 🎯 67. Most Important Function Interview Coding Problems

## Reverse a number

```python
def reverse_number(n):
    return int(str(n)[::-1])


print(reverse_number(12345))
```

---

## Prime number

```python
def is_prime(n):

    if n < 2:
        return False

    for i in range(2, int(n ** 0.5) + 1):

        if n % i == 0:
            return False

    return True


print(is_prime(17))
print(is_prime(20))
```

---

## Palindrome

```python
def palindrome(text):
    return text == text[::-1]


print(palindrome("madam"))
```

---

## Factorial

```python
def factorial(n):

    result = 1

    for i in range(1, n + 1):
        result *= i

    return result


print(factorial(5))
```

---

## Fibonacci

```python
def fibonacci(n):

    a, b = 0, 1
    result = []

    for _ in range(n):
        result.append(a)
        a, b = b, a + b

    return result


print(fibonacci(10))
```

---

## Count characters

```python
def frequency(text):

    result = {}

    for char in text:

        result[char] = result.get(char, 0) + 1

    return result


print(frequency("banana"))
```

Output:

```text
{'b': 1, 'a': 3, 'n': 2}
```

---

# 📊 Function Concepts — Quick Revision

| Concept | Easy meaning | Example |
|---|---|---|
| Function | Reusable code | `def add()` |
| Parameter | Input placeholder | `a` |
| Argument | Actual input | `10` |
| Positional | Position decides | `add(10,20)` |
| Keyword | Name decides | `add(a=10,b=20)` |
| Default | Backup value | `x=10` |
| `*args` | Many positional values | tuple |
| `**kwargs` | Many keyword values | dictionary |
| `return` | Send result back | `return x` |
| Local | Function variable | `x` inside function |
| Global | Program-level variable | `x` outside |
| `global` | Modify global | `global x` |
| `nonlocal` | Modify outer variable | `nonlocal x` |
| Lambda | Short function | `lambda x:x*2` |
| Recursion | Function calls itself | factorial |
| First-class | Function treated as object | `f = add` |
| Higher-order | Function accepts/returns function | `apply(f)` |
| Closure | Remembers outer variable | `multiplier()` |
| Decorator | Adds behavior | `@logger` |
| `map()` | Transform | double numbers |
| `filter()` | Select | even numbers |
| `reduce()` | Combine | sum |
| `any()` | At least one true | condition |
| `all()` | Every one true | condition |
| `sorted(key=)` | Custom sorting | sort by marks |

---

# 🧠 The Most Important Mental Model

Remember functions in this order:

```text
                    FUNCTION
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
           INPUT               OUTPUT
             │                   │
       parameters             return
             │
     ┌───────┼────────┐
     ↓       ↓        ↓
 positional keyword default
     │
   *args
   **kwargs
     │
     ↓
    SCOPE
     │
 ┌───┼────────┐
 ↓   ↓        ↓
local global nonlocal
     │
     ↓
 ADVANCED FUNCTIONS
     │
 ┌───┼────┬──────┬────────┐
 ↓   ↓    ↓      ↓        ↓
lambda recursion closure decorator
     │
     ↓
HIGHER-ORDER FUNCTIONS
     │
 ┌───┼────┬────┬────┬─────┐
 ↓   ↓    ↓    ↓    ↓
map filter reduce any all
              │
              ↓
         sorted(key=...)
```

## 🔥 Interview Priority

If you're preparing for **Python + AI/ML interviews**, master these especially well:

**1.** Parameters vs arguments  
**2.** Positional/keyword/default arguments  
**3.** `*args` and `**kwargs`  
**4.** `return` vs `print()`  
**5.** Local/global/nonlocal scope  
**6.** Lambda  
**7.** Recursion  
**8.** First-class functions  
**9.** Higher-order functions  
**10.** Closures  
**11.** Decorators  
**12.** `map()` / `filter()` / `reduce()`  
**13.** `any()` / `all()`  
**14.** `sorted(key=...)`  
**15.** Combining all of these in practical programs.
