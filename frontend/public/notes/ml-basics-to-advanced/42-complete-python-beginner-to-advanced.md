> **You asked:**
>
> complete python explain every concept and code

I’ll organize Python from beginner to advanced in a single interview-ready handbook, with simple definitions, runnable examples, common mistakes, and practical use.

# Complete Python: Beginner to Advanced  
## Every Important Concept with Easy Explanation and Code

Python is a high-level programming language used in:

```text
Web development
Data analysis
Machine learning
Artificial intelligence
Automation
APIs
Testing
Desktop applications
Scripting
```

Basic Python program:

```python
print("Hello, Python!")
```

Output:

```text
Hello, Python!
```

---

# 1. Python Installation and Execution

Check Python version:

```bash
python --version
```

or:

```bash
python3 --version
```

Run a Python file:

```bash
python app.py
```

Python files use the `.py` extension:

```text
app.py
main.py
student.py
```

---

# 2. Python Syntax

Python uses indentation instead of curly braces.

Correct:

```python
age = 20

if age >= 18:
    print("Adult")
```

Incorrect:

```python
age = 20

if age >= 18:
print("Adult")
```

Python is case-sensitive:

```python
name = "Aamir"
Name = "Rahul"

print(name)
print(Name)
```

These are two different variables.

---

# 3. Comments

Comments explain code and are ignored by Python.

## Single-line comment

```python
# This is a comment
name = "Aamir"
```

## Multi-line documentation

```python
def add(a, b):
    """
    This function adds two numbers.
    """
    return a + b
```

---

# 4. Variables

A variable stores a value.

```python
name = "Aamir"
age = 24
salary = 50000.50
is_employed = True
```

Python does not require explicit type declaration.

```python
x = 10
x = "Python"

print(x)
```

## Variable naming rules

Valid:

```python
student_name = "Aamir"
age2 = 24
_total = 100
```

Invalid:

```python
# 2age = 24
# student-name = "Aamir"
# class = "Python"
```

Recommended style:

```python
student_name = "Aamir"   # snake_case
```

---

# 5. Constants

Python does not enforce constants, but uppercase names are used by convention.

```python
PI = 3.14159
MAX_USERS = 100
```

---

# 6. Data Types

Important built-in types:

| Type | Example | Meaning |
|---|---|---|
| `int` | `10` | Whole number |
| `float` | `10.5` | Decimal number |
| `complex` | `2+3j` | Complex number |
| `str` | `"Python"` | Text |
| `bool` | `True` | True or False |
| `list` | `[1, 2]` | Ordered mutable collection |
| `tuple` | `(1, 2)` | Ordered immutable collection |
| `set` | `{1, 2}` | Unique values |
| `dict` | `{"name": "Aamir"}` | Key-value pairs |
| `NoneType` | `None` | No value |

Check a data type:

```python
age = 24

print(type(age))
```

Output:

```text
<class 'int'>
```

---

# 7. Integer, Float and Complex Numbers

```python
age = 24
price = 99.99
number = 2 + 3j

print(type(age))
print(type(price))
print(type(number))
```

## Numeric operations

```python
a = 10
b = 3

print(a + b)   # Addition
print(a - b)   # Subtraction
print(a * b)   # Multiplication
print(a / b)   # Division
print(a // b)  # Floor division
print(a % b)   # Remainder
print(a ** b)  # Power
```

---

# 8. Type Conversion

Convert one type to another.

```python
age_text = "24"

age = int(age_text)
price = float("99.5")
number = str(100)
status = bool(1)

print(age)
print(price)
print(number)
print(status)
```

Important:

```python
# int("hello")  # ValueError
```

Safe conversion:

```python
value = "25"

try:
    number = int(value)
    print(number)
except ValueError:
    print("Invalid number")
```

---

# 9. Input and Output

## Output using `print()`

```python
name = "Aamir"
age = 24

print(name)
print("Age:", age)
```

## User input

`input()` always returns a string.

```python
name = input("Enter your name: ")
print("Hello", name)
```

Numerical input:

```python
age = int(input("Enter your age: "))
print("Next year age:", age + 1)
```

---

# 10. Formatted Strings

## f-string

```python
name = "Aamir"
age = 24

print(f"My name is {name} and I am {age} years old.")
```

## Number formatting

```python
price = 1234.56789

print(f"{price:.2f}")
print(f"{price:,.2f}")
```

Output:

```text
1234.57
1,234.57
```

---

# 11. Operators

## Arithmetic operators

```python
a = 10
b = 3

print(a + b)
print(a - b)
print(a * b)
print(a / b)
print(a // b)
print(a % b)
print(a ** b)
```

## Comparison operators

```python
a = 10
b = 20

print(a == b)
print(a != b)
print(a > b)
print(a < b)
print(a >= b)
print(a <= b)
```

## Logical operators

```python
age = 25
has_id = True

print(age >= 18 and has_id)
print(age < 18 or has_id)
print(not has_id)
```

## Assignment operators

```python
x = 10

x += 5
x -= 2
x *= 3
x /= 2

print(x)
```

## Membership operators

```python
fruits = ["apple", "banana", "mango"]

print("apple" in fruits)
print("orange" not in fruits)
```

## Identity operators

```python
a = [1, 2]
b = a
c = [1, 2]

print(a is b)
print(a is c)
print(a == c)
```

Difference:

```text
== checks values
is checks whether both references point to the same object
```

---

# 12. Conditional Statements

## `if`

```python
age = 20

if age >= 18:
    print("Adult")
```

## `if-else`

```python
number = 7

if number % 2 == 0:
    print("Even")
else:
    print("Odd")
```

## `if-elif-else`

```python
marks = 82

if marks >= 90:
    print("Grade A+")
elif marks >= 75:
    print("Grade A")
elif marks >= 60:
    print("Grade B")
else:
    print("Grade C")
```

## Nested condition

```python
age = 25
has_license = True

if age >= 18:
    if has_license:
        print("Can drive")
    else:
        print("License required")
```

## Ternary operator

```python
age = 20

result = "Adult" if age >= 18 else "Minor"

print(result)
```

---

# 13. Match-Case

`match` is similar to switch-case.

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

---

# 14. Loops

Loops repeat code.

## `for` loop

```python
for number in range(1, 6):
    print(number)
```

Output:

```text
1
2
3
4
5
```

## `range()`

```python
print(list(range(5)))
print(list(range(1, 6)))
print(list(range(1, 10, 2)))
```

## Loop through a list

```python
names = ["Aamir", "Rahul", "Priya"]

for name in names:
    print(name)
```

## `while` loop

```python
count = 1

while count <= 5:
    print(count)
    count += 1
```

---

# 15. Loop Control Statements

## `break`

Stops the loop.

```python
for number in range(1, 10):
    if number == 5:
        break

    print(number)
```

## `continue`

Skips the current iteration.

```python
for number in range(1, 6):
    if number == 3:
        continue

    print(number)
```

## `pass`

Does nothing. It is used as a placeholder.

```python
for number in range(5):
    if number == 2:
        pass

    print(number)
```

## Loop `else`

Runs when the loop completes normally.

```python
for number in range(1, 4):
    print(number)
else:
    print("Loop completed")
```

The `else` does not run when the loop stops using `break`.

---

# 16. Strings

A string is a sequence of characters.

```python
name = "Aamir"
message = 'Hello'
description = """This is
a multiline string."""
```

## Indexing

```python
text = "Python"

print(text[0])
print(text[-1])
```

Output:

```text
P
n
```

## Slicing

```python
text = "Python Programming"

print(text[0:6])
print(text[:6])
print(text[7:])
print(text[::2])
print(text[::-1])
```

## String immutability

Strings cannot be changed directly.

```python
text = "Python"

# text[0] = "J"  # TypeError

text = "J" + text[1:]

print(text)
```

---

# 17. Important String Methods

```python
text = "  Python Programming  "

print(text.lower())
print(text.upper())
print(text.title())
print(text.capitalize())
print(text.strip())
print(text.replace("Python", "Java"))
print(text.startswith("  Python"))
print(text.endswith("  "))
```

## Split and join

```python
sentence = "Python is easy"

words = sentence.split()

print(words)
print("-".join(words))
```

## Find and count

```python
text = "banana"

print(text.find("na"))
print(text.count("a"))
```

## Validation methods

```python
print("123".isdigit())
print("Python".isalpha())
print("Python123".isalnum())
print(" ".isspace())
```

---

# 18. Lists

A list is an ordered and mutable collection.

```python
numbers = [10, 20, 30, 40]
names = ["Aamir", "Rahul", "Priya"]
mixed = [1, "Python", True, 10.5]
```

## Access list items

```python
numbers = [10, 20, 30, 40]

print(numbers[0])
print(numbers[-1])
print(numbers[1:3])
```

## Modify list

```python
numbers[0] = 100

print(numbers)
```

---

# 19. Important List Methods

```python
numbers = [10, 20, 30]

numbers.append(40)
numbers.insert(1, 15)
numbers.extend([50, 60])

print(numbers)
```

Remove values:

```python
numbers.remove(20)
last_value = numbers.pop()
numbers.pop(0)

print(numbers)
print(last_value)
```

Other methods:

```python
numbers = [40, 10, 30, 20, 20]

numbers.sort()
print(numbers)

numbers.sort(reverse=True)
print(numbers)

numbers.reverse()
print(numbers)

print(numbers.count(20))
print(numbers.index(30))
```

Clear list:

```python
numbers.clear()
```

---

# 20. List Copy

Incorrect:

```python
a = [1, 2, 3]
b = a

b.append(4)

print(a)
```

Both variables point to the same list.

Correct shallow copy:

```python
a = [1, 2, 3]
b = a.copy()

b.append(4)

print(a)
print(b)
```

---

# 21. List Comprehension

List comprehension creates a list in a shorter way.

Traditional:

```python
squares = []

for number in range(1, 6):
    squares.append(number ** 2)

print(squares)
```

List comprehension:

```python
squares = [number ** 2 for number in range(1, 6)]

print(squares)
```

With condition:

```python
even_numbers = [
    number
    for number in range(1, 11)
    if number % 2 == 0
]

print(even_numbers)
```

With `if-else`:

```python
labels = [
    "Even" if number % 2 == 0 else "Odd"
    for number in range(1, 6)
]

print(labels)
```

---

# 22. Tuples

A tuple is ordered and immutable.

```python
coordinates = (10, 20)
colors = ("red", "green", "blue")
```

Access:

```python
print(coordinates[0])
```

Tuple cannot be modified:

```python
# coordinates[0] = 100  # TypeError
```

## One-item tuple

```python
value = (10,)

print(type(value))
```

## Tuple unpacking

```python
person = ("Aamir", 24, "Bihar")

name, age, state = person

print(name)
print(age)
print(state)
```

## Swapping values

```python
a = 10
b = 20

a, b = b, a

print(a, b)
```

---

# 23. Sets

A set stores unique unordered values.

```python
numbers = {10, 20, 30, 20}

print(numbers)
```

Duplicate `20` is removed.

## Set methods

```python
numbers = {10, 20, 30}

numbers.add(40)
numbers.update([50, 60])
numbers.remove(20)
numbers.discard(100)

print(numbers)
```

Difference:

```text
remove() gives an error if the value is missing
discard() does not give an error
```

---

# 24. Set Operations

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # Union
print(a & b)   # Intersection
print(a - b)   # Difference
print(a ^ b)   # Symmetric difference
```

Methods:

```python
print(a.union(b))
print(a.intersection(b))
print(a.difference(b))
```

---

# 25. Dictionaries

A dictionary stores key-value pairs.

```python
student = {
    "name": "Aamir",
    "age": 24,
    "course": "AI/ML"
}
```

Access:

```python
print(student["name"])
print(student.get("age"))
```

`get()` is safer:

```python
print(student.get("salary", "Not available"))
```

Modify:

```python
student["age"] = 25
student["city"] = "Jaipur"
```

Remove:

```python
student.pop("course")
student.popitem()
```

---

# 26. Dictionary Methods

```python
student = {
    "name": "Aamir",
    "age": 24,
    "city": "Jaipur"
}

print(student.keys())
print(student.values())
print(student.items())
```

Loop:

```python
for key, value in student.items():
    print(key, value)
```

Dictionary comprehension:

```python
squares = {
    number: number ** 2
    for number in range(1, 6)
}

print(squares)
```

---

# 27. Mutable vs Immutable

## Mutable objects

Can be changed after creation:

```text
list
dictionary
set
bytearray
```

## Immutable objects

Cannot be changed after creation:

```text
int
float
bool
string
tuple
frozenset
bytes
```

Example:

```python
numbers = [1, 2, 3]
numbers.append(4)
```

The list changes.

```python
text = "Python"
text = text + " Programming"
```

A new string object is created.

---

# 28. Functions

A function is reusable code.

```python
def greet():
    print("Hello")

greet()
```

## Function with parameters

```python
def greet(name):
    print(f"Hello, {name}")

greet("Aamir")
```

## Return value

```python
def add(a, b):
    return a + b

result = add(10, 20)

print(result)
```

---

# 29. Types of Function Arguments

## Positional arguments

```python
def introduce(name, age):
    print(name, age)

introduce("Aamir", 24)
```

## Keyword arguments

```python
introduce(age=24, name="Aamir")
```

## Default arguments

```python
def greet(name, message="Welcome"):
    print(f"{message}, {name}")

greet("Aamir")
greet("Aamir", "Good morning")
```

Do not use a mutable object as a default value.

Incorrect:

```python
def add_item(item, items=[]):
    items.append(item)
    return items
```

Correct:

```python
def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items
```

---

# 30. `*args`

`*args` accepts multiple positional arguments.

```python
def total(*numbers):
    return sum(numbers)

print(total(10, 20, 30, 40))
```

Inside the function, `numbers` is a tuple.

---

# 31. `**kwargs`

`**kwargs` accepts multiple keyword arguments.

```python
def show_profile(**details):
    for key, value in details.items():
        print(key, value)

show_profile(
    name="Aamir",
    age=24,
    city="Jaipur"
)
```

Inside the function, `details` is a dictionary.

---

# 32. Parameter Order

Correct parameter order:

```python
def example(
    normal,
    default=10,
    *args,
    keyword_only=True,
    **kwargs
):
    pass
```

---

# 33. Scope

Scope defines where a variable can be accessed.

## Local scope

```python
def show():
    message = "Local variable"
    print(message)

show()
```

`message` cannot normally be accessed outside the function.

## Global scope

```python
name = "Aamir"

def show():
    print(name)

show()
```

## `global`

```python
count = 0

def increment():
    global count
    count += 1

increment()

print(count)
```

## `nonlocal`

```python
def outer():
    count = 0

    def inner():
        nonlocal count
        count += 1
        return count

    return inner

counter = outer()

print(counter())
print(counter())
```

---

# 34. LEGB Rule

Python searches variables in this order:

```text
L → Local
E → Enclosing
G → Global
B → Built-in
```

Example:

```python
name = "Global"

def outer():
    name = "Enclosing"

    def inner():
        name = "Local"
        print(name)

    inner()

outer()
```

Output:

```text
Local
```

---

# 35. Lambda Functions

A lambda is a small anonymous function.

```python
square = lambda number: number ** 2

print(square(5))
```

Normal function:

```python
def square(number):
    return number ** 2
```

Lambda with two arguments:

```python
add = lambda a, b: a + b

print(add(10, 20))
```

Use lambda for short operations, not complex logic.

---

# 36. `map()`

`map()` applies a function to every item.

```python
numbers = [1, 2, 3, 4]

squares = list(
    map(lambda number: number ** 2, numbers)
)

print(squares)
```

List comprehension is often easier:

```python
squares = [number ** 2 for number in numbers]
```

---

# 37. `filter()`

`filter()` keeps items that satisfy a condition.

```python
numbers = [1, 2, 3, 4, 5, 6]

even_numbers = list(
    filter(lambda number: number % 2 == 0, numbers)
)

print(even_numbers)
```

---

# 38. `reduce()`

`reduce()` combines all values into one result.

```python
from functools import reduce

numbers = [1, 2, 3, 4]

product = reduce(
    lambda a, b: a * b,
    numbers
)

print(product)
```

---

# 39. Recursion

Recursion means a function calls itself.

## Factorial

\[
n! = n \times (n-1)!
\]

```python
def factorial(number):
    if number < 0:
        raise ValueError("Number must be non-negative")

    if number in (0, 1):
        return 1

    return number * factorial(number - 1)

print(factorial(5))
```

Flow:

```text
factorial(5)
5 × factorial(4)
5 × 4 × factorial(3)
5 × 4 × 3 × factorial(2)
5 × 4 × 3 × 2 × factorial(1)
120
```

Every recursion needs a base condition.

---

# 40. Built-in Functions

Important built-ins:

```python
numbers = [10, 20, 30, 40]

print(len(numbers))
print(sum(numbers))
print(min(numbers))
print(max(numbers))
print(sorted(numbers, reverse=True))
print(any([False, True, False]))
print(all([True, True, False]))
```

Other useful functions:

```python
print(abs(-10))
print(round(10.567, 2))
print(pow(2, 3))
print(divmod(10, 3))
```

---

# 41. `enumerate()`

`enumerate()` gives index and value.

```python
names = ["Aamir", "Rahul", "Priya"]

for index, name in enumerate(names, start=1):
    print(index, name)
```

---

# 42. `zip()`

`zip()` combines multiple iterables.

```python
names = ["Aamir", "Rahul", "Priya"]
marks = [90, 85, 88]

for name, mark in zip(names, marks):
    print(name, mark)
```

Create dictionary:

```python
students = dict(zip(names, marks))

print(students)
```

`zip()` stops when the shortest iterable ends.

---

# 43. Sorting

## `sorted()`

Returns a new sorted collection.

```python
numbers = [30, 10, 20]

result = sorted(numbers)

print(numbers)
print(result)
```

## `list.sort()`

Changes the original list.

```python
numbers.sort()
```

## Sort by key

```python
students = [
    {"name": "Aamir", "marks": 90},
    {"name": "Rahul", "marks": 80},
    {"name": "Priya", "marks": 95}
]

students.sort(
    key=lambda student: student["marks"],
    reverse=True
)

print(students)
```

---

# 44. Object-Oriented Programming

OOP organizes code using classes and objects.

Main concepts:

```text
Class
Object
Attributes
Methods
Constructor
Encapsulation
Inheritance
Polymorphism
Abstraction
```

---

# 45. Class and Object

A class is a blueprint.

An object is an instance of a class.

```python
class Student:
    pass

student1 = Student()
student2 = Student()

print(type(student1))
```

---

# 46. Constructor and `self`

`__init__()` initializes an object.

`self` represents the current object.

```python
class Student:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def introduce(self):
        return f"My name is {self.name}."

student = Student("Aamir", 24)

print(student.name)
print(student.introduce())
```

---

# 47. Instance and Class Variables

## Instance variable

Different for every object.

```python
class Student:
    def __init__(self, name):
        self.name = name
```

## Class variable

Shared by all objects.

```python
class Student:
    school = "UEM Jaipur"

    def __init__(self, name):
        self.name = name

student1 = Student("Aamir")
student2 = Student("Rahul")

print(student1.school)
print(student2.school)
```

---

# 48. Instance, Class and Static Methods

## Instance method

Uses `self`.

```python
class Employee:
    company = "ABC"

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def show(self):
        return f"{self.name}: {self.salary}"
```

## Class method

Uses `cls`.

```python
class Employee:
    company = "ABC"

    @classmethod
    def change_company(cls, company):
        cls.company = company
```

## Static method

Does not use `self` or `cls`.

```python
class Calculator:
    @staticmethod
    def add(a, b):
        return a + b

print(Calculator.add(10, 20))
```

---

# 49. Encapsulation

Encapsulation protects object data.

## Public attribute

```python
class Account:
    def __init__(self, balance):
        self.balance = balance
```

## Protected convention

```python
self._balance = balance
```

A single underscore means: “internal use.”

## Private name mangling

```python
class Account:
    def __init__(self, balance):
        self.__balance = balance

    def get_balance(self):
        return self.__balance

account = Account(5000)

print(account.get_balance())
```

Python private attributes are not completely inaccessible; Python uses name mangling.

---

# 50. Property

`property` controls attribute access.

```python
class Employee:
    def __init__(self, salary):
        self._salary = salary

    @property
    def salary(self):
        return self._salary

    @salary.setter
    def salary(self, value):
        if value < 0:
            raise ValueError("Salary cannot be negative")

        self._salary = value

employee = Employee(50000)

employee.salary = 60000

print(employee.salary)
```

---

# 51. Inheritance

Inheritance allows a child class to reuse parent code.

```python
class Person:
    def __init__(self, name):
        self.name = name

    def introduce(self):
        return f"I am {self.name}"

class Student(Person):
    def study(self):
        return "I am studying"

student = Student("Aamir")

print(student.introduce())
print(student.study())
```

---

# 52. Types of Inheritance

## Single inheritance

```text
Parent → Child
```

## Multilevel inheritance

```text
Grandparent → Parent → Child
```

## Multiple inheritance

```text
Parent1 + Parent2 → Child
```

## Hierarchical inheritance

```text
One parent → Multiple children
```

## Hybrid inheritance

Combination of inheritance types.

---

# 53. `super()`

`super()` accesses parent class functionality.

```python
class Person:
    def __init__(self, name):
        self.name = name

class Student(Person):
    def __init__(self, name, course):
        super().__init__(name)
        self.course = course

student = Student("Aamir", "AI/ML")

print(student.name)
print(student.course)
```

---

# 54. Method Overriding

A child class changes a parent method.

```python
class Animal:
    def sound(self):
        return "Animal sound"

class Dog(Animal):
    def sound(self):
        return "Bark"

dog = Dog()

print(dog.sound())
```

---

# 55. Polymorphism

Polymorphism means one interface can have different behaviors.

```python
class Dog:
    def sound(self):
        return "Bark"

class Cat:
    def sound(self):
        return "Meow"

animals = [Dog(), Cat()]

for animal in animals:
    print(animal.sound())
```

This is also an example of duck typing.

---

# 56. Operator Overloading

Customize operators for objects.

```python
class Number:
    def __init__(self, value):
        self.value = value

    def __add__(self, other):
        return Number(self.value + other.value)

    def __repr__(self):
        return f"Number({self.value})"

a = Number(10)
b = Number(20)

print(a + b)
```

---

# 57. Abstraction

Abstraction hides implementation details and defines required behavior.

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

rectangle = Rectangle(10, 5)

print(rectangle.area())
```

A class with an unimplemented abstract method cannot normally be instantiated.

---

# 58. Composition

Composition means a class strongly contains another object.

```python
class Engine:
    def start(self):
        return "Engine started"

class Car:
    def __init__(self):
        self.engine = Engine()

    def start(self):
        return self.engine.start()

car = Car()

print(car.start())
```

A car “has an” engine.

---

# 59. Aggregation

Aggregation is a weaker “has-a” relationship.

```python
class Teacher:
    def __init__(self, name):
        self.name = name

class Department:
    def __init__(self, teacher):
        self.teacher = teacher

teacher = Teacher("Rahul")
department = Department(teacher)

print(department.teacher.name)
```

The teacher can exist independently of the department.

---

# 60. Magic or Dunder Methods

Dunder means double underscore.

Important methods:

| Method | Use |
|---|---|
| `__init__` | Constructor |
| `__str__` | User-friendly text |
| `__repr__` | Developer representation |
| `__len__` | Length |
| `__eq__` | Equality |
| `__add__` | Addition |
| `__iter__` | Iteration |
| `__enter__` | Context manager entry |
| `__exit__` | Context manager exit |

Example:

```python
class Student:
    def __init__(self, name, marks):
        self.name = name
        self.marks = marks

    def __str__(self):
        return f"{self.name}: {self.marks}"

    def __len__(self):
        return len(self.name)

student = Student("Aamir", 90)

print(student)
print(len(student))
```

---

# 61. MRO

MRO means Method Resolution Order.

It determines where Python searches for a method in multiple inheritance.

```python
class A:
    pass

class B(A):
    pass

class C(A):
    pass

class D(B, C):
    pass

print(D.mro())
```

---

# 62. Exception Handling

Exceptions are runtime errors.

```python
try:
    number = int(input("Enter a number: "))
    result = 10 / number
    print(result)

except ValueError:
    print("Please enter a valid integer")

except ZeroDivisionError:
    print("Number cannot be zero")

else:
    print("No exception occurred")

finally:
    print("Program finished")
```

---

# 63. `raise`

Use `raise` to create an error intentionally.

```python
def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError("Amount must be positive")

    if amount > balance:
        raise ValueError("Insufficient balance")

    return balance - amount

print(withdraw(5000, 1000))
```

---

# 64. Custom Exception

```python
class InsufficientBalanceError(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientBalanceError(
            "Not enough balance"
        )

    return balance - amount
```

---

# 65. File Handling

## Open and read a file

```python
file = open("notes.txt", "r", encoding="utf-8")

content = file.read()

print(content)

file.close()
```

Better approach:

```python
with open(
    "notes.txt",
    "r",
    encoding="utf-8"
) as file:
    content = file.read()

print(content)
```

The file is closed automatically.

---

# 66. File Modes

| Mode | Meaning |
|---|---|
| `r` | Read |
| `w` | Write and replace |
| `a` | Append |
| `x` | Create new file |
| `b` | Binary mode |
| `t` | Text mode |
| `+` | Read and write |

---

# 67. Write to File

```python
with open(
    "output.txt",
    "w",
    encoding="utf-8"
) as file:
    file.write("Hello Python\n")
    file.write("File handling")
```

Append:

```python
with open(
    "output.txt",
    "a",
    encoding="utf-8"
) as file:
    file.write("\nNew line")
```

---

# 68. Read File Line by Line

```python
with open(
    "output.txt",
    "r",
    encoding="utf-8"
) as file:
    for line in file:
        print(line.strip())
```

Other methods:

```python
file.read()
file.readline()
file.readlines()
```

---

# 69. CSV Files

```python
import csv

with open(
    "students.csv",
    "w",
    newline="",
    encoding="utf-8"
) as file:
    writer = csv.writer(file)

    writer.writerow(["Name", "Marks"])
    writer.writerow(["Aamir", 90])
    writer.writerow(["Rahul", 85])
```

Read CSV:

```python
with open(
    "students.csv",
    "r",
    encoding="utf-8"
) as file:
    reader = csv.DictReader(file)

    for row in reader:
        print(row)
```

---

# 70. JSON Handling

```python
import json

student = {
    "name": "Aamir",
    "age": 24,
    "skills": ["Python", "SQL", "ML"]
}

json_text = json.dumps(
    student,
    indent=4
)

print(json_text)
```

Save JSON:

```python
with open(
    "student.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(student, file, indent=4)
```

Read JSON:

```python
with open(
    "student.json",
    "r",
    encoding="utf-8"
) as file:
    data = json.load(file)

print(data)
```

---

# 71. Modules

A module is a Python file containing reusable code.

`calculator.py`:

```python
def add(a, b):
    return a + b

PI = 3.14159
```

`main.py`:

```python
import calculator

print(calculator.add(10, 20))
print(calculator.PI)
```

Other import styles:

```python
from calculator import add
from calculator import add as addition
```

Avoid:

```python
from calculator import *
```

It can create name conflicts.

---

# 72. `__name__ == "__main__"`

```python
def main():
    print("Application running")

if __name__ == "__main__":
    main()
```

When the file runs directly:

```text
__name__ becomes "__main__"
```

When imported:

```text
__name__ becomes the module name
```

---

# 73. Packages

A package is a folder containing Python modules.

```text
my_package/
├── __init__.py
├── calculator.py
└── formatter.py
```

Import:

```python
from my_package.calculator import add
```

---

# 74. `pip`

Install package:

```bash
pip install pandas
```

Uninstall:

```bash
pip uninstall pandas
```

Show installed packages:

```bash
pip list
```

Show package information:

```bash
pip show pandas
```

Create requirements file:

```bash
pip freeze > requirements.txt
```

Install from it:

```bash
pip install -r requirements.txt
```

---

# 75. Virtual Environment

A virtual environment isolates project dependencies.

Create:

```bash
python -m venv venv
```

Activate on Windows:

```bash
venv\Scripts\activate
```

Activate on macOS/Linux:

```bash
source venv/bin/activate
```

Deactivate:

```bash
deactivate
```

---

# 76. Iterables and Iterators

An iterable can be looped over.

Examples:

```text
list
tuple
string
set
dictionary
```

An iterator returns one item at a time.

```python
numbers = [10, 20, 30]

iterator = iter(numbers)

print(next(iterator))
print(next(iterator))
print(next(iterator))
```

After all items, `StopIteration` is raised.

---

# 77. Custom Iterator

```python
class Counter:
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current > self.end:
            raise StopIteration

        value = self.current
        self.current += 1

        return value

for number in Counter(1, 5):
    print(number)
```

---

# 78. Generators

A generator produces values one at a time using `yield`.

```python
def count_up_to(limit):
    number = 1

    while number <= limit:
        yield number
        number += 1

for number in count_up_to(5):
    print(number)
```

Generators save memory because they do not store every result at once.

---

# 79. Generator Expression

```python
squares = (
    number ** 2
    for number in range(1, 6)
)

print(next(squares))
print(next(squares))
```

List comprehension creates all values immediately:

```python
squares = [
    number ** 2
    for number in range(1, 6)
]
```

Generator expression creates values lazily.

---

# 80. Closures

A closure remembers values from its enclosing function.

```python
def multiplier(factor):
    def multiply(number):
        return number * factor

    return multiply

double = multiplier(2)
triple = multiplier(3)

print(double(10))
print(triple(10))
```

`factor` remains available even after `multiplier()` finishes.

---

# 81. Decorators

A decorator adds behavior to a function without modifying the function itself.

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

---

# 82. Decorator with Arguments

```python
from functools import wraps

def logger(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        print(
            f"Calling {function.__name__}"
        )

        result = function(*args, **kwargs)

        print("Function completed")

        return result

    return wrapper

@logger
def add(a, b):
    return a + b

print(add(10, 20))
```

`@wraps` preserves the original function name and metadata.

---

# 83. Decorator with Parameters

```python
from functools import wraps

def repeat(times):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            result = None

            for _ in range(times):
                result = function(*args, **kwargs)

            return result

        return wrapper

    return decorator

@repeat(3)
def greet():
    print("Hello")

greet()
```

---

# 84. Context Managers

A context manager manages setup and cleanup.

The `with` statement is commonly used for files.

Custom context manager:

```python
class DatabaseConnection:
    def __enter__(self):
        print("Connection opened")
        return self

    def __exit__(
        self,
        exception_type,
        exception_value,
        traceback
    ):
        print("Connection closed")

with DatabaseConnection():
    print("Using database")
```

---

# 85. `contextlib`

```python
from contextlib import contextmanager

@contextmanager
def managed_resource():
    print("Resource started")

    try:
        yield "Resource"
    finally:
        print("Resource cleaned")

with managed_resource() as resource:
    print(resource)
```

---

# 86. Regular Expressions

Regular expressions search and validate text.

```python
import re

text = "My number is 9931879953"

match = re.search(r"\d{10}", text)

if match:
    print(match.group())
```

## Important patterns

| Pattern | Meaning |
|---|---|
| `\d` | Digit |
| `\w` | Word character |
| `\s` | Whitespace |
| `.` | Any character |
| `+` | One or more |
| `*` | Zero or more |
| `?` | Zero or one |
| `^` | Start |
| `$` | End |
| `{n}` | Exactly n |
| `[abc]` | a, b or c |
| `[^abc]` | Not a, b or c |

---

# 87. Regex Functions

```python
import re

text = "Python 3.12 and Java 21"

print(re.findall(r"\d+", text))
print(re.sub(r"\d+", "NUMBER", text))
print(re.split(r"\s+", text))
```

Email validation:

```python
pattern = r"^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$"

email = "aamir@example.com"

if re.fullmatch(pattern, email):
    print("Valid email")
else:
    print("Invalid email")
```

---

# 88. Collections Module

## `Counter`

```python
from collections import Counter

words = ["python", "java", "python", "sql"]

frequency = Counter(words)

print(frequency)
print(frequency.most_common(2))
```

## `defaultdict`

```python
from collections import defaultdict

groups = defaultdict(list)

groups["IT"].append("Aamir")
groups["IT"].append("Rahul")

print(groups)
```

## `deque`

```python
from collections import deque

queue = deque([1, 2, 3])

queue.append(4)
queue.appendleft(0)
queue.popleft()

print(queue)
```

## `namedtuple`

```python
from collections import namedtuple

Student = namedtuple(
    "Student",
    ["name", "marks"]
)

student = Student("Aamir", 90)

print(student.name)
```

---

# 89. Dataclasses

Dataclasses reduce repeated class code.

```python
from dataclasses import dataclass

@dataclass
class Student:
    name: str
    age: int
    marks: float = 0.0

student = Student(
    name="Aamir",
    age=24,
    marks=90
)

print(student)
```

Frozen dataclass:

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int
```

A frozen dataclass is immutable.

---

# 90. Type Hints

Type hints improve readability and tooling.

```python
def add(a: int, b: int) -> int:
    return a + b

name: str = "Aamir"
marks: list[int] = [80, 90, 95]
```

Optional value:

```python
def find_user(
    user_id: int
) -> str | None:
    if user_id == 1:
        return "Aamir"

    return None
```

Type hints are not automatically enforced at runtime.

---

# 91. `typing`

```python
from typing import Any, Callable

def process(
    values: list[int],
    operation: Callable[[int], int]
) -> list[int]:
    return [operation(value) for value in values]

def square(value: int) -> int:
    return value ** 2

print(process([1, 2, 3], square))
```

---

# 92. Shallow Copy and Deep Copy

## Shallow copy

Copies the outer object but nested objects are shared.

```python
import copy

original = [[1, 2], [3, 4]]
shallow = copy.copy(original)

shallow[0].append(100)

print(original)
print(shallow)
```

## Deep copy

Copies nested objects too.

```python
original = [[1, 2], [3, 4]]
deep = copy.deepcopy(original)

deep[0].append(100)

print(original)
print(deep)
```

---

# 93. Memory Management

Python mainly uses:

```text
Reference counting
Garbage collection
Private heap memory
```

Check object identity:

```python
a = [1, 2, 3]
b = a

print(id(a))
print(id(b))
```

Reference example:

```python
import sys

data = []

print(sys.getrefcount(data))
```

Garbage collector:

```python
import gc

gc.collect()
```

---

# 94. `__slots__`

`__slots__` can reduce memory for many objects.

```python
class Employee:
    __slots__ = ("name", "salary")

    def __init__(self, name, salary):
        self.name = name
        self.salary = salary
```

It also prevents adding undeclared attributes.

---

# 95. Descriptors

Descriptors control attribute access using:

```text
__get__
__set__
__delete__
```

```python
class PositiveNumber:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, instance, owner):
        if instance is None:
            return self

        return instance.__dict__[self.name]

    def __set__(self, instance, value):
        if value < 0:
            raise ValueError(
                f"{self.name} must be positive"
            )

        instance.__dict__[self.name] = value

class Product:
    price = PositiveNumber()

    def __init__(self, price):
        self.price = price

product = Product(500)

print(product.price)
```

Properties, class methods and functions use the descriptor protocol internally.

---

# 96. Metaclasses

A metaclass creates classes.

Normal relationship:

```text
Class creates objects
Metaclass creates classes
```

```python
class Meta(type):
    def __new__(
        cls,
        name,
        bases,
        namespace
    ):
        namespace["category"] = "Created by Meta"

        return super().__new__(
            cls,
            name,
            bases,
            namespace
        )

class Product(metaclass=Meta):
    pass

print(Product.category)
```

Metaclasses are advanced and should be used only when class creation needs to be customized.

---

# 97. Logging

Logging is better than `print()` for production applications.

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s - "
        "%(levelname)s - "
        "%(message)s"
    )
)

logging.info("Application started")
logging.warning("Low memory")
logging.error("Operation failed")
```

Log to file:

```python
logging.basicConfig(
    filename="app.log",
    level=logging.INFO
)
```

Levels:

```text
DEBUG
INFO
WARNING
ERROR
CRITICAL
```

---

# 98. Assertions

Assertions check assumptions during development.

```python
def calculate_average(numbers):
    assert len(numbers) > 0, "List cannot be empty"

    return sum(numbers) / len(numbers)

print(calculate_average([10, 20, 30]))
```

Do not use assertions for user input validation because assertions can be disabled.

---

# 99. Unit Testing

Using `unittest`:

```python
import unittest

def add(a, b):
    return a + b

class TestCalculator(unittest.TestCase):
    def test_add(self):
        self.assertEqual(
            add(10, 20),
            30
        )

    def test_negative(self):
        self.assertEqual(
            add(-1, -2),
            -3
        )

if __name__ == "__main__":
    unittest.main()
```

Run:

```bash
python -m unittest
```

---

# 100. Pytest

Install:

```bash
pip install pytest
```

Test:

```python
def add(a, b):
    return a + b

def test_add():
    assert add(10, 20) == 30
```

Run:

```bash
pytest
```

Test exception:

```python
import pytest

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")

    return a / b

def test_zero_division():
    with pytest.raises(ValueError):
        divide(10, 0)
```

---

# 101. SQLite Database

SQLite is included with Python.

```python
import sqlite3

connection = sqlite3.connect("students.db")
cursor = connection.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    marks REAL
)
""")

cursor.execute(
    """
    INSERT INTO students (name, marks)
    VALUES (?, ?)
    """,
    ("Aamir", 90)
)

connection.commit()

cursor.execute(
    "SELECT * FROM students"
)

rows = cursor.fetchall()

for row in rows:
    print(row)

connection.close()
```

Use parameterized queries to prevent SQL injection.

---

# 102. HTTP APIs

Install Requests:

```bash
pip install requests
```

GET request:

```python
import requests

response = requests.get(
    "https://jsonplaceholder.typicode.com/users",
    timeout=10
)

response.raise_for_status()

users = response.json()

for user in users[:3]:
    print(user["name"])
```

POST request:

```python
payload = {
    "title": "Python",
    "body": "Learning Python",
    "userId": 1
}

response = requests.post(
    "https://jsonplaceholder.typicode.com/posts",
    json=payload,
    timeout=10
)

print(response.json())
```

---

# 103. Environment Variables

Do not hard-code secrets.

```python
import os

database_url = os.getenv(
    "DATABASE_URL",
    "sqlite:///default.db"
)

print(database_url)
```

Using `.env`:

```bash
pip install python-dotenv
```

`.env`:

```text
API_KEY=secret-value
```

Python:

```python
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("API_KEY")
```

Do not commit `.env` to Git.

---

# 104. Command-Line Arguments

Using `argparse`:

```python
import argparse

parser = argparse.ArgumentParser()

parser.add_argument(
    "--name",
    required=True
)

parser.add_argument(
    "--age",
    type=int,
    default=18
)

arguments = parser.parse_args()

print(arguments.name)
print(arguments.age)
```

Run:

```bash
python app.py --name Aamir --age 24
```

---

# 105. Date and Time

```python
from datetime import datetime, date, timedelta

now = datetime.now()
today = date.today()

print(now)
print(today)
print(now.strftime("%d-%m-%Y %H:%M:%S"))
```

Parse text:

```python
date_text = "2026-07-22"

parsed_date = datetime.strptime(
    date_text,
    "%Y-%m-%d"
)

print(parsed_date)
```

Add days:

```python
future_date = today + timedelta(days=7)

print(future_date)
```

---

# 106. Random Numbers

```python
import random

print(random.randint(1, 10))
print(random.random())

items = ["Python", "Java", "SQL"]

print(random.choice(items))

random.shuffle(items)

print(items)
```

For reproducible results:

```python
random.seed(42)
```

For numerical work, NumPy random generators are often preferred.

---

# 107. Threading

Threading is useful for I/O-bound work.

Examples:

```text
Downloading files
Calling APIs
Reading network data
```

```python
import threading
import time

def task(name):
    print(f"{name} started")
    time.sleep(2)
    print(f"{name} completed")

threads = [
    threading.Thread(
        target=task,
        args=(f"Task {number}",)
    )
    for number in range(3)
]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()

print("All tasks completed")
```

---

# 108. Race Condition and Lock

A race condition occurs when threads modify shared data unsafely.

```python
import threading

counter = 0
lock = threading.Lock()

def increment():
    global counter

    for _ in range(100000):
        with lock:
            counter += 1

threads = [
    threading.Thread(target=increment)
    for _ in range(2)
]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()

print(counter)
```

---

# 109. Multiprocessing

Multiprocessing is useful for CPU-bound work.

Examples:

```text
Large calculations
Image processing
Data transformation
```

```python
from multiprocessing import Process

def task(number):
    print(
        f"Square of {number} is {number ** 2}"
    )

if __name__ == "__main__":
    processes = [
        Process(
            target=task,
            args=(number,)
        )
        for number in range(1, 4)
    ]

    for process in processes:
        process.start()

    for process in processes:
        process.join()
```

---

# 110. Process Pool

```python
from concurrent.futures import ProcessPoolExecutor

def square(number):
    return number ** 2

if __name__ == "__main__":
    with ProcessPoolExecutor() as executor:
        results = executor.map(
            square,
            [1, 2, 3, 4]
        )

    print(list(results))
```

---

# 111. Thread Pool

```python
from concurrent.futures import ThreadPoolExecutor

def fetch_data(number):
    return f"Data {number}"

with ThreadPoolExecutor(
    max_workers=3
) as executor:
    results = executor.map(
        fetch_data,
        [1, 2, 3]
    )

print(list(results))
```

---

# 112. Async Programming

Async programming handles many I/O tasks efficiently.

```python
import asyncio

async def task(name, delay):
    print(f"{name} started")

    await asyncio.sleep(delay)

    print(f"{name} completed")

async def main():
    await asyncio.gather(
        task("Task 1", 2),
        task("Task 2", 1),
        task("Task 3", 3)
    )

asyncio.run(main())
```

Important keywords:

```text
async
await
asyncio.run()
asyncio.gather()
```

---

# 113. Threading vs Multiprocessing vs Async

| Technique | Best for |
|---|---|
| Threading | I/O-bound tasks |
| Multiprocessing | CPU-bound tasks |
| Asyncio | Many concurrent I/O tasks |

Python’s GIL limits CPU-bound Python threads, but it does not prevent useful concurrency for I/O operations.

---

# 114. Functional Programming Concepts

Important ideas:

```text
Pure functions
Immutability
Higher-order functions
First-class functions
map, filter, reduce
```

Functions are first-class objects:

```python
def greet(name):
    return f"Hello, {name}"

function = greet

print(function("Aamir"))
```

Function as argument:

```python
def execute(function, value):
    return function(value)

print(execute(str.upper, "python"))
```

---

# 115. Walrus Operator

The walrus operator `:=` assigns and returns a value.

```python
numbers = [10, 20, 30, 40]

if (count := len(numbers)) > 3:
    print(f"List has {count} items")
```

Use it only when it makes code clearer.

---

# 116. Unpacking

## Sequence unpacking

```python
a, b, c = [10, 20, 30]
```

## Star unpacking

```python
first, *middle, last = [1, 2, 3, 4, 5]

print(first)
print(middle)
print(last)
```

## Function call unpacking

```python
def add(a, b):
    return a + b

numbers = [10, 20]

print(add(*numbers))
```

Dictionary unpacking:

```python
details = {
    "name": "Aamir",
    "age": 24
}

def show(name, age):
    print(name, age)

show(**details)
```

---

# 117. Dictionary Merge

```python
a = {"name": "Aamir"}
b = {"age": 24}

combined = a | b

print(combined)
```

Alternative:

```python
combined = {**a, **b}
```

---

# 118. Structural Pattern Matching

```python
def process(command):
    match command:
        case ["add", first, second]:
            return int(first) + int(second)

        case ["show", name]:
            return f"Showing {name}"

        case _:
            return "Unknown command"

print(process(["add", "10", "20"]))
```

---

# 119. Packaging a Python Project

Typical structure:

```text
my_project/
├── pyproject.toml
├── README.md
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── calculator.py
└── tests/
    └── test_calculator.py
```

Basic `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "my-python-package"
version = "0.1.0"
description = "Example Python package"
requires-python = ">=3.11"
```

Install project locally:

```bash
pip install -e .
```

---

# 120. Clean Code Practices

## Use meaningful names

Bad:

```python
x = 50000
```

Better:

```python
monthly_salary = 50000
```

## Keep functions small

```python
def calculate_tax(salary, tax_rate):
    return salary * tax_rate
```

## Avoid repeated code

Create reusable functions.

## Handle errors

```python
def divide(a, b):
    if b == 0:
        raise ValueError("b cannot be zero")

    return a / b
```

## Follow PEP 8

Common conventions:

```text
Variables and functions → snake_case
Classes → PascalCase
Constants → UPPER_CASE
Four spaces for indentation
```

---

# 121. Common Python Errors

## `SyntaxError`

```python
# if age > 18
#     print("Adult")
```

## `NameError`

```python
# print(undefined_variable)
```

## `TypeError`

```python
# "10" + 5
```

## `ValueError`

```python
# int("Python")
```

## `IndexError`

```python
numbers = [1, 2, 3]

# print(numbers[10])
```

## `KeyError`

```python
student = {"name": "Aamir"}

# print(student["age"])
```

## `AttributeError`

```python
number = 10

# number.append(20)
```

## `ModuleNotFoundError`

```text
The required package is not installed or the import path is wrong.
```

---

# 122. Common Interview Differences

## List vs Tuple

| List | Tuple |
|---|---|
| Mutable | Immutable |
| Uses `[]` | Uses `()` |
| More methods | Fewer methods |
| Good for changing data | Good for fixed data |

## Set vs List

| Set | List |
|---|---|
| Unique values | Duplicates allowed |
| Unordered | Ordered |
| Fast membership check | Slower membership check |
| No indexing | Supports indexing |

## `==` vs `is`

| `==` | `is` |
|---|---|
| Compares values | Compares object identity |

## Shallow vs Deep Copy

| Shallow Copy | Deep Copy |
|---|---|
| Nested objects shared | Nested objects copied |
| `copy.copy()` | `copy.deepcopy()` |

## Iterator vs Generator

| Iterator | Generator |
|---|---|
| Implements `__iter__` and `__next__` | Uses `yield` |
| More code | Less code |
| Manual state management | Automatic state management |

## Thread vs Process

| Thread | Process |
|---|---|
| Shared memory | Separate memory |
| Lightweight | Heavier |
| Best for I/O | Best for CPU work |

---

# 123. Most Asked Python Coding Questions

## Reverse a string

```python
text = "Python"

print(text[::-1])
```

## Check palindrome

```python
def is_palindrome(text):
    cleaned = text.lower().replace(" ", "")
    return cleaned == cleaned[::-1]

print(is_palindrome("Madam"))
```

## Count character frequency

```python
from collections import Counter

text = "programming"

print(Counter(text))
```

## Find second largest number

```python
numbers = [10, 20, 30, 30, 40]

unique_numbers = sorted(
    set(numbers),
    reverse=True
)

second_largest = (
    unique_numbers[1]
    if len(unique_numbers) >= 2
    else None
)

print(second_largest)
```

## Remove duplicates while preserving order

```python
numbers = [1, 2, 1, 3, 2, 4]

unique = list(dict.fromkeys(numbers))

print(unique)
```

## Two Sum

```python
def two_sum(numbers, target):
    seen = {}

    for index, number in enumerate(numbers):
        required = target - number

        if required in seen:
            return [seen[required], index]

        seen[number] = index

    return []

print(two_sum([2, 7, 11, 15], 9))
```

Time complexity:

```text
O(n)
```

## FizzBuzz

```python
for number in range(1, 16):
    if number % 15 == 0:
        print("FizzBuzz")
    elif number % 3 == 0:
        print("Fizz")
    elif number % 5 == 0:
        print("Buzz")
    else:
        print(number)
```

---

# 124. Recommended Python Learning Order

```text
1. Installation and syntax
2. Variables and data types
3. Operators
4. Input and output
5. Conditional statements
6. Loops
7. Strings
8. Lists
9. Tuples
10. Sets
11. Dictionaries
12. Functions
13. Scope
14. Lambda and comprehensions
15. Recursion
16. OOP
17. Exception handling
18. File handling
19. Modules and packages
20. Virtual environments
21. Iterators and generators
22. Closures and decorators
23. Context managers
24. Regular expressions
25. Collections
26. Dataclasses and type hints
27. Testing and logging
28. Databases and APIs
29. Threading
30. Multiprocessing
31. Async programming
32. Memory management
33. Descriptors and metaclasses
34. Packaging and clean code
```

# Final Interview Summary

> Python is a high-level, interpreted and dynamically typed programming language. It supports procedural, object-oriented and functional programming. I understand Python data types, control statements, collections, functions, scope, lambda expressions, comprehensions, recursion, OOP, exception handling, file handling, modules, packages and virtual environments. I also understand advanced concepts such as iterators, generators, closures, decorators, context managers, regular expressions, dataclasses, type hints, testing, logging, APIs, databases, threading, multiprocessing, asynchronous programming, memory management, descriptors and packaging.
