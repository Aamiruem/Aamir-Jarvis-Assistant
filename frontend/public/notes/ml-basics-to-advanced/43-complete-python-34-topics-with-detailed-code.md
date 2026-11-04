> **You asked:**
>
> 1. Installation and syntax
> 2. Variables and data types
> 3. Operators
> 4. Input and output
> 5. Conditional statements
> 6. Loops
> 7. Strings
> 8. Lists
> 9. Tuples
> 10. Sets
> 11. Dictionaries
> 12. Functions
> 13. Scope
> 14. Lambda and comprehensions
> 15. Recursion
> 16. OOP
> 17. Exception handling
> 18. File handling
> 19. Modules and packages
> 20. Virtual environments
> 21. Iterators and generators
> 22. Closures and decorators
> 23. Context managers
> 24. Regular expressions
> 25. Collections
> 26. Dataclasses and type hints
> 27. Testing and logging
> 28. Databases and APIs
> 29. Threading
> 30. Multiprocessing
> 31. Async programming
> 32. Memory management
> 33. Descriptors and metaclasses
> 34. Packaging and clean code only all topic long code to clera concept

I’ll cover all 34 Python topics in order, using longer runnable examples that connect related concepts and show practical output.

# Complete Python: 34 Topics with Detailed Code

---

# 1. Installation and Syntax

## Check Python installation

```bash
python --version
```

On some systems:

```bash
python3 --version
```

Run a Python file:

```bash
python app.py
```

Install a package:

```bash
pip install requests
```

## Basic Python syntax

```python
# This is a single-line comment.

"""
This is a multiline string.
It is commonly used as a docstring.
"""

print("Hello, Python!")

name = "Aamir"
age = 24

# Python uses indentation to define blocks.
if age >= 18:
    print(f"{name} is an adult.")
else:
    print(f"{name} is a minor.")

# Statements can continue inside parentheses.
total = (
    10
    + 20
    + 30
)

print("Total:", total)
```

## Important syntax rules

```python
# Python is case-sensitive.

name = "Aamir"
Name = "Rahul"

print(name)
print(Name)

# Recommended naming styles:

student_name = "Aamir"       # Variable/function: snake_case
MAX_USERS = 100              # Constant: UPPER_CASE


class StudentProfile:        # Class: PascalCase
    pass
```

---

# 2. Variables and Data Types

A variable is a name that refers to an object.

```python
name = "Aamir"
age = 24
height = 5.8
is_employed = False
nothing = None

print(type(name))
print(type(age))
print(type(height))
print(type(is_employed))
print(type(nothing))
```

## Main built-in data types

```python
# Numeric types
integer_value = 100
float_value = 25.75
complex_value = 3 + 4j

# Boolean
is_active = True

# String
language = "Python"

# List
skills = ["Python", "SQL", "ML"]

# Tuple
coordinates = (10, 20)

# Set
unique_numbers = {1, 2, 3}

# Dictionary
student = {
    "name": "Aamir",
    "age": 24
}

# None
result = None

values = [
    integer_value,
    float_value,
    complex_value,
    is_active,
    language,
    skills,
    coordinates,
    unique_numbers,
    student,
    result
]

for value in values:
    print(value, "->", type(value))
```

## Dynamic typing

```python
value = 10
print(value, type(value))

value = "Python"
print(value, type(value))

value = [1, 2, 3]
print(value, type(value))
```

## Type conversion

```python
age_text = "24"
price_text = "99.50"

age = int(age_text)
price = float(price_text)
number_text = str(500)
boolean_value = bool(1)

print(age, type(age))
print(price, type(price))
print(number_text, type(number_text))
print(boolean_value, type(boolean_value))
```

## Mutable and immutable types

```python
# List is mutable.
numbers = [1, 2, 3]
numbers.append(4)

print(numbers)

# String is immutable.
text = "Python"

# text[0] = "J"  # TypeError

new_text = "J" + text[1:]
print(new_text)
```

---

# 3. Operators

## Arithmetic operators

```python
a = 10
b = 3

print("Addition:", a + b)
print("Subtraction:", a - b)
print("Multiplication:", a * b)
print("Division:", a / b)
print("Floor division:", a // b)
print("Remainder:", a % b)
print("Power:", a ** b)
```

## Comparison operators

```python
x = 10
y = 20

print(x == y)
print(x != y)
print(x > y)
print(x < y)
print(x >= y)
print(x <= y)
```

## Logical operators

```python
age = 24
has_id = True
has_permission = False

print(age >= 18 and has_id)
print(has_permission or has_id)
print(not has_permission)
```

## Assignment operators

```python
value = 10

value += 5
print(value)

value -= 2
print(value)

value *= 3
print(value)

value /= 2
print(value)
```

## Membership operators

```python
skills = ["Python", "SQL", "Machine Learning"]

print("Python" in skills)
print("Java" not in skills)
```

## Identity operators

```python
a = [1, 2, 3]
b = a
c = [1, 2, 3]

print(a == c)   # Same values
print(a is c)   # Different objects

print(a is b)   # Same object
```

## Bitwise operators

```python
a = 5   # 0101
b = 3   # 0011

print("AND:", a & b)
print("OR:", a | b)
print("XOR:", a ^ b)
print("Left shift:", a << 1)
print("Right shift:", a >> 1)
```

---

# 4. Input and Output

## Basic input

```python
name = input("Enter your name: ")
print("Hello,", name)
```

`input()` always returns a string.

```python
age_text = input("Enter your age: ")

print(age_text)
print(type(age_text))
```

## Convert numerical input

```python
try:
    first_number = float(input("Enter first number: "))
    second_number = float(input("Enter second number: "))

    total = first_number + second_number

    print("Total:", total)

except ValueError:
    print("Please enter valid numbers.")
```

## Formatted output

```python
name = "Aamir"
age = 24
salary = 52345.6789

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Salary: ₹{salary:.2f}")
print(f"Formatted salary: ₹{salary:,.2f}")
```

## Complete calculator

```python
def calculator():
    print("Simple Calculator")
    print("1. Add")
    print("2. Subtract")
    print("3. Multiply")
    print("4. Divide")

    try:
        choice = int(input("Choose an operation: "))
        number1 = float(input("Enter first number: "))
        number2 = float(input("Enter second number: "))

        if choice == 1:
            result = number1 + number2

        elif choice == 2:
            result = number1 - number2

        elif choice == 3:
            result = number1 * number2

        elif choice == 4:
            if number2 == 0:
                print("Cannot divide by zero.")
                return

            result = number1 / number2

        else:
            print("Invalid option.")
            return

        print(f"Result: {result:.2f}")

    except ValueError:
        print("Invalid input.")


calculator()
```

---

# 5. Conditional Statements

## `if`, `elif`, `else`

```python
marks = 82

if marks >= 90:
    grade = "A+"

elif marks >= 80:
    grade = "A"

elif marks >= 70:
    grade = "B"

elif marks >= 60:
    grade = "C"

else:
    grade = "Fail"

print("Grade:", grade)
```

## Nested conditions

```python
age = 24
has_license = True

if age >= 18:
    if has_license:
        print("You can drive.")
    else:
        print("You need a driving license.")
else:
    print("You are too young to drive.")
```

## Multiple conditions

```python
username = "admin"
password = "python123"

if username == "admin" and password == "python123":
    print("Login successful.")
else:
    print("Invalid credentials.")
```

## Ternary operator

```python
number = 11

result = "Even" if number % 2 == 0 else "Odd"

print(result)
```

## `match-case`

```python
def get_day_name(day_number):
    match day_number:
        case 1:
            return "Monday"
        case 2:
            return "Tuesday"
        case 3:
            return "Wednesday"
        case 4:
            return "Thursday"
        case 5:
            return "Friday"
        case 6:
            return "Saturday"
        case 7:
            return "Sunday"
        case _:
            return "Invalid day"


print(get_day_name(5))
```

---

# 6. Loops

## `for` loop

```python
for number in range(1, 6):
    print(number)
```

## Range arguments

```python
print(list(range(5)))
print(list(range(1, 6)))
print(list(range(2, 11, 2)))
print(list(range(10, 0, -1)))
```

## Loop through collections

```python
skills = ["Python", "SQL", "Machine Learning"]

for skill in skills:
    print(skill)
```

## `while` loop

```python
count = 1

while count <= 5:
    print(count)
    count += 1
```

## `break`

```python
for number in range(1, 11):
    if number == 6:
        break

    print(number)
```

## `continue`

```python
for number in range(1, 11):
    if number % 2 != 0:
        continue

    print(number)
```

## `pass`

```python
def future_function():
    pass
```

## Loop with `else`

```python
numbers = [10, 20, 30, 40]
search_value = 30

for number in numbers:
    if number == search_value:
        print("Value found.")
        break
else:
    print("Value not found.")
```

## Multiplication table

```python
number = 5

for multiplier in range(1, 11):
    result = number * multiplier

    print(f"{number} × {multiplier} = {result}")
```

## Nested loops

```python
for row in range(1, 4):
    for column in range(1, 4):
        print(f"Row {row}, Column {column}")
```

---

# 7. Strings

## String creation

```python
single_quote = 'Python'
double_quote = "Machine Learning"

multiline = """
Python is used for:
- Data Science
- Machine Learning
- Web Development
"""

print(multiline)
```

## Indexing and slicing

```python
text = "Python Programming"

print(text[0])
print(text[-1])
print(text[0:6])
print(text[:6])
print(text[7:])
print(text[::2])
print(text[::-1])
```

## Important string methods

```python
text = "  python programming language  "

print(text.strip())
print(text.upper())
print(text.lower())
print(text.title())
print(text.capitalize())
print(text.replace("python", "Java"))
print(text.count("g"))
print(text.find("programming"))
print(text.startswith("  python"))
print(text.endswith("  "))
```

## Split and join

```python
sentence = "Python is easy to learn"

words = sentence.split()

print(words)

joined_sentence = "-".join(words)

print(joined_sentence)
```

## String validation

```python
print("12345".isdigit())
print("Python".isalpha())
print("Python123".isalnum())
print("hello world".islower())
print("HELLO".isupper())
print("   ".isspace())
```

## Palindrome program

```python
def is_palindrome(text):
    cleaned_text = "".join(
        character.lower()
        for character in text
        if character.isalnum()
    )

    return cleaned_text == cleaned_text[::-1]


examples = [
    "Madam",
    "A man a plan a canal Panama",
    "Python"
]

for example in examples:
    print(example, "->", is_palindrome(example))
```

## Character frequency

```python
def character_frequency(text):
    frequency = {}

    for character in text.lower():
        if character.isspace():
            continue

        frequency[character] = frequency.get(character, 0) + 1

    return frequency


print(character_frequency("Python Programming"))
```

---

# 8. Lists

A list is ordered, mutable and allows duplicates.

```python
numbers = [10, 20, 30, 40]
mixed = [1, "Python", True, 5.5]

print(numbers)
print(mixed)
```

## Indexing and slicing

```python
numbers = [10, 20, 30, 40, 50]

print(numbers[0])
print(numbers[-1])
print(numbers[1:4])
print(numbers[::-1])
```

## Add items

```python
numbers = [10, 20, 30]

numbers.append(40)
numbers.insert(1, 15)
numbers.extend([50, 60])

print(numbers)
```

## Remove items

```python
numbers.remove(20)

last_item = numbers.pop()
first_item = numbers.pop(0)

print(numbers)
print("Removed last:", last_item)
print("Removed first:", first_item)
```

## Sorting

```python
numbers = [40, 10, 30, 20]

ascending = sorted(numbers)
descending = sorted(numbers, reverse=True)

print("Original:", numbers)
print("Ascending:", ascending)
print("Descending:", descending)

numbers.sort()
print("Changed original:", numbers)
```

## List copy

```python
original = [1, 2, 3]
copied = original.copy()

copied.append(4)

print("Original:", original)
print("Copied:", copied)
```

## Student management example

```python
students = []


def add_student(name, marks):
    student = {
        "name": name,
        "marks": marks
    }

    students.append(student)


def show_students():
    if not students:
        print("No students available.")
        return

    for index, student in enumerate(students, start=1):
        print(
            f"{index}. {student['name']} "
            f"- Marks: {student['marks']}"
        )


def calculate_average_marks():
    if not students:
        return 0

    total_marks = sum(
        student["marks"]
        for student in students
    )

    return total_marks / len(students)


add_student("Aamir", 90)
add_student("Rahul", 82)
add_student("Priya", 95)

show_students()

print(
    "Average Marks:",
    calculate_average_marks()
)
```

---

# 9. Tuples

A tuple is ordered and immutable.

```python
coordinates = (10, 20)
student = ("Aamir", 24, "AI/ML")

print(coordinates)
print(student[0])
```

## One-item tuple

```python
single_value = (10,)

print(type(single_value))
```

## Tuple unpacking

```python
name, age, course = student

print(name)
print(age)
print(course)
```

## Extended unpacking

```python
numbers = (1, 2, 3, 4, 5)

first, *middle, last = numbers

print("First:", first)
print("Middle:", middle)
print("Last:", last)
```

## Return multiple values

```python
def calculate(number1, number2):
    total = number1 + number2
    difference = number1 - number2
    product = number1 * number2

    return total, difference, product


result = calculate(10, 5)

print(result)

total, difference, product = result

print(total)
print(difference)
print(product)
```

## Named tuples

```python
from collections import namedtuple

Employee = namedtuple(
    "Employee",
    ["name", "department", "salary"]
)

employee = Employee(
    name="Aamir",
    department="AI/ML",
    salary=50000
)

print(employee.name)
print(employee.department)
print(employee.salary)
```

---

# 10. Sets

A set stores unique values.

```python
numbers = {10, 20, 30, 20, 10}

print(numbers)
```

## Add and remove

```python
numbers.add(40)
numbers.update([50, 60, 70])

numbers.remove(20)
numbers.discard(100)

print(numbers)
```

## Set operations

```python
python_students = {
    "Aamir",
    "Rahul",
    "Priya"
}

sql_students = {
    "Aamir",
    "Neha",
    "Priya"
}

print(
    "Union:",
    python_students | sql_students
)

print(
    "Intersection:",
    python_students & sql_students
)

print(
    "Only Python:",
    python_students - sql_students
)

print(
    "Only one course:",
    python_students ^ sql_students
)
```

## Subset and superset

```python
a = {1, 2}
b = {1, 2, 3, 4}

print(a.issubset(b))
print(b.issuperset(a))
```

## Remove duplicate values while preserving order

```python
numbers = [1, 2, 1, 3, 2, 4]

unique_numbers = list(dict.fromkeys(numbers))

print(unique_numbers)
```

---

# 11. Dictionaries

A dictionary stores key-value pairs.

```python
student = {
    "name": "Aamir",
    "age": 24,
    "course": "AI/ML"
}

print(student)
```

## Access values

```python
print(student["name"])
print(student.get("age"))
print(student.get("salary", "Not available"))
```

## Add and update

```python
student["city"] = "Jaipur"
student["age"] = 25

student.update({
    "email": "aamir@example.com",
    "skills": ["Python", "SQL", "ML"]
})

print(student)
```

## Remove values

```python
removed_course = student.pop("course")

print("Removed:", removed_course)

last_item = student.popitem()

print("Last item:", last_item)
```

## Loop through dictionary

```python
for key in student:
    print(key, student[key])

for key, value in student.items():
    print(key, "=", value)
```

## Nested dictionary

```python
company = {
    "employees": {
        101: {
            "name": "Aamir",
            "department": "AI/ML",
            "salary": 50000
        },
        102: {
            "name": "Rahul",
            "department": "Data Analytics",
            "salary": 45000
        }
    }
}

print(
    company["employees"][101]["name"]
)
```

## Frequency-count program

```python
def word_frequency(sentence):
    frequency = {}

    words = sentence.lower().split()

    for word in words:
        clean_word = word.strip(".,!?")

        frequency[clean_word] = (
            frequency.get(clean_word, 0) + 1
        )

    return frequency


sentence = "Python is easy and Python is powerful"

print(word_frequency(sentence))
```

---

# 12. Functions

A function is reusable code.

```python
def greet():
    print("Hello")


greet()
```

## Parameters and return values

```python
def add(number1, number2):
    result = number1 + number2

    return result


total = add(10, 20)

print(total)
```

## Positional and keyword arguments

```python
def introduce(name, age, city):
    return (
        f"My name is {name}, "
        f"I am {age} years old, "
        f"and I live in {city}."
    )


print(
    introduce("Aamir", 24, "Jaipur")
)

print(
    introduce(
        city="Jaipur",
        age=24,
        name="Aamir"
    )
)
```

## Default arguments

```python
def calculate_salary(
    base_salary,
    bonus_percentage=10
):
    bonus = (
        base_salary *
        bonus_percentage /
        100
    )

    return base_salary + bonus


print(calculate_salary(50000))
print(calculate_salary(50000, 20))
```

## `*args`

```python
def calculate_total(*numbers):
    return sum(numbers)


print(calculate_total(10, 20))
print(calculate_total(10, 20, 30, 40))
```

## `**kwargs`

```python
def create_profile(**details):
    for key, value in details.items():
        print(f"{key}: {value}")


create_profile(
    name="Aamir",
    age=24,
    role="AI/ML Engineer"
)
```

## Keyword-only arguments

```python
def register_user(
    username,
    *,
    is_admin=False,
    is_active=True
):
    return {
        "username": username,
        "is_admin": is_admin,
        "is_active": is_active
    }


print(
    register_user(
        "aamir",
        is_admin=True
    )
)
```

## Avoid mutable default arguments

Incorrect:

```python
def add_skill_bad(skill, skills=[]):
    skills.append(skill)
    return skills
```

Correct:

```python
def add_skill(skill, skills=None):
    if skills is None:
        skills = []

    skills.append(skill)

    return skills


print(add_skill("Python"))
print(add_skill("SQL"))
```

---

# 13. Scope

Python follows LEGB:

```text
Local
Enclosing
Global
Built-in
```

## Local and global scope

```python
company_name = "OpenAI"


def show_employee():
    employee_name = "Aamir"

    print("Company:", company_name)
    print("Employee:", employee_name)


show_employee()
```

## `global`

```python
count = 0


def increment():
    global count

    count += 1


increment()
increment()

print(count)
```

## `nonlocal`

```python
def create_counter():
    count = 0

    def increment():
        nonlocal count

        count += 1

        return count

    return increment


counter = create_counter()

print(counter())
print(counter())
print(counter())
```

## LEGB demonstration

```python
value = "Global"


def outer():
    value = "Enclosing"

    def inner():
        value = "Local"

        print(value)

    inner()


outer()
```

---

# 14. Lambda and Comprehensions

## Lambda

```python
square = lambda number: number ** 2

print(square(5))
```

## Lambda with sorting

```python
students = [
    {"name": "Aamir", "marks": 90},
    {"name": "Rahul", "marks": 82},
    {"name": "Priya", "marks": 95}
]

sorted_students = sorted(
    students,
    key=lambda student: student["marks"],
    reverse=True
)

print(sorted_students)
```

## List comprehension

```python
squares = [
    number ** 2
    for number in range(1, 11)
]

print(squares)
```

## Conditional list comprehension

```python
even_squares = [
    number ** 2
    for number in range(1, 11)
    if number % 2 == 0
]

print(even_squares)
```

## If-else comprehension

```python
labels = [
    "Even" if number % 2 == 0 else "Odd"
    for number in range(1, 11)
]

print(labels)
```

## Dictionary comprehension

```python
square_map = {
    number: number ** 2
    for number in range(1, 6)
}

print(square_map)
```

## Set comprehension

```python
unique_lengths = {
    len(word)
    for word in [
        "Python",
        "Java",
        "SQL",
        "Python"
    ]
}

print(unique_lengths)
```

## Generator expression

```python
square_generator = (
    number ** 2
    for number in range(1, 6)
)

for value in square_generator:
    print(value)
```

---

# 15. Recursion

Recursion means a function calls itself.

## Factorial

\[
n! = n(n-1)!
\]

```python
def factorial(number):
    if number < 0:
        raise ValueError(
            "Number must be non-negative"
        )

    if number in (0, 1):
        return 1

    return (
        number *
        factorial(number - 1)
    )


print(factorial(5))
```

## Fibonacci

```python
def fibonacci(number):
    if number < 0:
        raise ValueError(
            "Number must be non-negative"
        )

    if number in (0, 1):
        return number

    return (
        fibonacci(number - 1)
        + fibonacci(number - 2)
    )


for number in range(10):
    print(fibonacci(number), end=" ")
```

The recursive Fibonacci version is slow because it repeats calculations.

## Fibonacci with memoization

```python
from functools import lru_cache


@lru_cache(maxsize=None)
def fibonacci_fast(number):
    if number in (0, 1):
        return number

    return (
        fibonacci_fast(number - 1)
        + fibonacci_fast(number - 2)
    )


print(fibonacci_fast(40))
```

## Recursive sum of list

```python
def recursive_sum(numbers):
    if not numbers:
        return 0

    return (
        numbers[0]
        + recursive_sum(numbers[1:])
    )


print(recursive_sum([10, 20, 30, 40]))
```

## Binary search using recursion

```python
def binary_search(
    numbers,
    target,
    left,
    right
):
    if left > right:
        return -1

    middle = (left + right) // 2

    if numbers[middle] == target:
        return middle

    if numbers[middle] > target:
        return binary_search(
            numbers,
            target,
            left,
            middle - 1
        )

    return binary_search(
        numbers,
        target,
        middle + 1,
        right
    )


numbers = [10, 20, 30, 40, 50, 60]

index = binary_search(
    numbers,
    40,
    0,
    len(numbers) - 1
)

print("Index:", index)
```

---

# 16. Object-Oriented Programming

## Class, object, constructor and methods

```python
class BankAccount:
    bank_name = "Python Bank"

    def __init__(
        self,
        account_holder,
        opening_balance=0
    ):
        self.account_holder = account_holder
        self._balance = opening_balance
        self.transactions = []

    @property
    def balance(self):
        return self._balance

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError(
                "Deposit amount must be positive"
            )

        self._balance += amount

        self.transactions.append({
            "type": "deposit",
            "amount": amount,
            "balance": self._balance
        })

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError(
                "Withdrawal amount must be positive"
            )

        if amount > self._balance:
            raise ValueError(
                "Insufficient balance"
            )

        self._balance -= amount

        self.transactions.append({
            "type": "withdrawal",
            "amount": amount,
            "balance": self._balance
        })

    def show_statement(self):
        print(
            f"Account Holder: "
            f"{self.account_holder}"
        )

        for transaction in self.transactions:
            print(transaction)

    def __str__(self):
        return (
            f"BankAccount("
            f"holder={self.account_holder}, "
            f"balance={self._balance}"
            f")"
        )


account = BankAccount(
    "Aamir",
    opening_balance=5000
)

account.deposit(2000)
account.withdraw(1500)

print(account)
print("Balance:", account.balance)

account.show_statement()
```

## Inheritance and overriding

```python
class SavingsAccount(BankAccount):
    def __init__(
        self,
        account_holder,
        opening_balance=0,
        interest_rate=0.04
    ):
        super().__init__(
            account_holder,
            opening_balance
        )

        self.interest_rate = interest_rate

    def add_interest(self):
        interest = (
            self.balance *
            self.interest_rate
        )

        self.deposit(interest)

        return interest


savings = SavingsAccount(
    "Aamir",
    opening_balance=10000,
    interest_rate=0.05
)

interest = savings.add_interest()

print("Interest:", interest)
print(savings)
```

## Abstract class

```python
from abc import ABC, abstractmethod


class Employee(ABC):
    def __init__(self, name):
        self.name = name

    @abstractmethod
    def calculate_salary(self):
        pass


class FullTimeEmployee(Employee):
    def __init__(
        self,
        name,
        monthly_salary
    ):
        super().__init__(name)

        self.monthly_salary = monthly_salary

    def calculate_salary(self):
        return self.monthly_salary


class ContractEmployee(Employee):
    def __init__(
        self,
        name,
        hourly_rate,
        worked_hours
    ):
        super().__init__(name)

        self.hourly_rate = hourly_rate
        self.worked_hours = worked_hours

    def calculate_salary(self):
        return (
            self.hourly_rate *
            self.worked_hours
        )


employees = [
    FullTimeEmployee("Aamir", 50000),
    ContractEmployee("Rahul", 500, 80)
]

for employee in employees:
    print(
        employee.name,
        employee.calculate_salary()
    )
```

## Composition

```python
class Engine:
    def start(self):
        return "Engine started"


class Car:
    def __init__(self, model):
        self.model = model
        self.engine = Engine()

    def start(self):
        return (
            f"{self.model}: "
            f"{self.engine.start()}"
        )


car = Car("Tesla")

print(car.start())
```

---

# 17. Exception Handling

## Basic exception handling

```python
try:
    number = int(
        input("Enter a number: ")
    )

    result = 100 / number

except ValueError:
    print("Input must be an integer.")

except ZeroDivisionError:
    print("Cannot divide by zero.")

else:
    print("Result:", result)

finally:
    print("Execution finished.")
```

## Raise exceptions

```python
def set_age(age):
    if not isinstance(age, int):
        raise TypeError(
            "Age must be an integer"
        )

    if age < 0:
        raise ValueError(
            "Age cannot be negative"
        )

    return age


print(set_age(24))
```

## Custom exception

```python
class InsufficientBalanceError(Exception):
    """Raised when withdrawal exceeds balance."""


class Account:
    def __init__(self, balance):
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientBalanceError(
                "Not enough balance"
            )

        self.balance -= amount

        return self.balance


account = Account(1000)

try:
    account.withdraw(1500)

except InsufficientBalanceError as error:
    print("Transaction failed:", error)
```

## Exception chaining

```python
def convert_to_integer(value):
    try:
        return int(value)

    except ValueError as error:
        raise ValueError(
            f"Cannot convert {value!r} "
            f"to integer"
        ) from error


try:
    convert_to_integer("Python")

except ValueError as error:
    print(error)
```

---

# 18. File Handling

## Write and read text file

```python
file_path = "students.txt"

students = [
    "Aamir,90\n",
    "Rahul,82\n",
    "Priya,95\n"
]

with open(
    file_path,
    "w",
    encoding="utf-8"
) as file:
    file.writelines(students)

with open(
    file_path,
    "r",
    encoding="utf-8"
) as file:
    content = file.read()

print(content)
```

## Read line by line

```python
with open(
    file_path,
    "r",
    encoding="utf-8"
) as file:
    for line_number, line in enumerate(
        file,
        start=1
    ):
        print(
            line_number,
            line.strip()
        )
```

## Append

```python
with open(
    file_path,
    "a",
    encoding="utf-8"
) as file:
    file.write("Neha,88\n")
```

## CSV handling

```python
import csv

csv_file = "employees.csv"

employees = [
    {
        "id": 1,
        "name": "Aamir",
        "department": "AI/ML"
    },
    {
        "id": 2,
        "name": "Rahul",
        "department": "Analytics"
    }
]

with open(
    csv_file,
    "w",
    newline="",
    encoding="utf-8"
) as file:
    fieldnames = [
        "id",
        "name",
        "department"
    ]

    writer = csv.DictWriter(
        file,
        fieldnames=fieldnames
    )

    writer.writeheader()
    writer.writerows(employees)

with open(
    csv_file,
    "r",
    encoding="utf-8"
) as file:
    reader = csv.DictReader(file)

    for row in reader:
        print(row)
```

## JSON handling

```python
import json

profile = {
    "name": "Aamir",
    "age": 24,
    "skills": [
        "Python",
        "SQL",
        "Machine Learning"
    ]
}

with open(
    "profile.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        profile,
        file,
        indent=4
    )

with open(
    "profile.json",
    "r",
    encoding="utf-8"
) as file:
    loaded_profile = json.load(file)

print(loaded_profile)
```

## Path handling

```python
from pathlib import Path

folder = Path("data")
folder.mkdir(exist_ok=True)

file_path = folder / "notes.txt"

file_path.write_text(
    "Python File Handling",
    encoding="utf-8"
)

print(
    file_path.read_text(
        encoding="utf-8"
    )
)

print("Exists:", file_path.exists())
print("Name:", file_path.name)
print("Suffix:", file_path.suffix)
```

---

# 19. Modules and Packages

## Module example

Create `calculator.py`:

```python
PI = 3.14159


def add(a, b):
    return a + b


def subtract(a, b):
    return a - b


def multiply(a, b):
    return a * b


def divide(a, b):
    if b == 0:
        raise ValueError(
            "Cannot divide by zero"
        )

    return a / b
```

Use it in `main.py`:

```python
import calculator

print(calculator.add(10, 20))
print(calculator.PI)
```

Or:

```python
from calculator import add, multiply

print(add(5, 6))
print(multiply(4, 7))
```

## `__name__ == "__main__"`

```python
def main():
    print("Program started")


if __name__ == "__main__":
    main()
```

## Package structure

```text
my_package/
├── __init__.py
├── math_tools.py
└── string_tools.py
```

`math_tools.py`:

```python
def square(number):
    return number ** 2
```

`string_tools.py`:

```python
def capitalize_words(text):
    return text.title()
```

Use package:

```python
from my_package.math_tools import square
from my_package.string_tools import capitalize_words

print(square(5))
print(capitalize_words("python programming"))
```

---

# 20. Virtual Environments

Create virtual environment:

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

Install packages:

```bash
pip install requests pandas
```

Create requirements file:

```bash
pip freeze > requirements.txt
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Deactivate:

```bash
deactivate
```

Example `requirements.txt`:

```text
pandas==2.3.1
requests==2.32.4
```

Project structure:

```text
python_project/
├── venv/
├── app.py
├── requirements.txt
└── README.md
```

---

# 21. Iterators and Generators

## Iterator

```python
numbers = [10, 20, 30]

iterator = iter(numbers)

print(next(iterator))
print(next(iterator))
print(next(iterator))

# next(iterator) raises StopIteration.
```

## Custom iterator

```python
class NumberRange:
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


for number in NumberRange(1, 5):
    print(number)
```

## Generator function

```python
def generate_numbers(start, end):
    current = start

    while current <= end:
        yield current

        current += 1


generator = generate_numbers(1, 5)

print(next(generator))
print(next(generator))

for number in generator:
    print(number)
```

## Fibonacci generator

```python
def fibonacci_generator(limit):
    first = 0
    second = 1
    count = 0

    while count < limit:
        yield first

        first, second = (
            second,
            first + second
        )

        count += 1


print(
    list(
        fibonacci_generator(10)
    )
)
```

## Generator pipeline

```python
def read_numbers():
    for number in range(1, 11):
        yield number


def filter_even(numbers):
    for number in numbers:
        if number % 2 == 0:
            yield number


def square_numbers(numbers):
    for number in numbers:
        yield number ** 2


pipeline = square_numbers(
    filter_even(
        read_numbers()
    )
)

print(list(pipeline))
```

---

# 22. Closures and Decorators

## Closure

```python
def create_multiplier(factor):
    def multiply(number):
        return number * factor

    return multiply


double = create_multiplier(2)
triple = create_multiplier(3)

print(double(10))
print(triple(10))
```

## Basic decorator

```python
def uppercase_decorator(function):
    def wrapper():
        result = function()

        return result.upper()

    return wrapper


@uppercase_decorator
def greet():
    return "hello aamir"


print(greet())
```

## Decorator with arguments

```python
from functools import wraps
import time


def execution_time(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()

        result = function(*args, **kwargs)

        end_time = time.perf_counter()

        print(
            f"{function.__name__} took "
            f"{end_time - start_time:.6f} "
            f"seconds"
        )

        return result

    return wrapper


@execution_time
def calculate_sum(limit):
    return sum(range(limit))


print(calculate_sum(1_000_000))
```

## Decorator with configuration

```python
from functools import wraps


def repeat(times):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            result = None

            for _ in range(times):
                result = function(
                    *args,
                    **kwargs
                )

            return result

        return wrapper

    return decorator


@repeat(3)
def greet(name):
    print(f"Hello, {name}")


greet("Aamir")
```

## Authentication decorator

```python
from functools import wraps


def require_admin(function):
    @wraps(function)
    def wrapper(user, *args, **kwargs):
        if not user.get("is_admin"):
            raise PermissionError(
                "Admin access required"
            )

        return function(
            user,
            *args,
            **kwargs
        )

    return wrapper


@require_admin
def delete_user(current_user, user_id):
    return (
        f"User {user_id} deleted by "
        f"{current_user['name']}"
    )


admin = {
    "name": "Aamir",
    "is_admin": True
}

print(delete_user(admin, 101))
```

---

# 23. Context Managers

A context manager performs setup and cleanup.

## File context manager

```python
with open(
    "example.txt",
    "w",
    encoding="utf-8"
) as file:
    file.write("Context manager example")
```

## Custom class context manager

```python
class DatabaseConnection:
    def __init__(self, database_name):
        self.database_name = database_name
        self.connected = False

    def __enter__(self):
        print(
            f"Connecting to "
            f"{self.database_name}"
        )

        self.connected = True

        return self

    def execute(self, query):
        if not self.connected:
            raise RuntimeError(
                "Database not connected"
            )

        print("Executing:", query)

    def __exit__(
        self,
        exception_type,
        exception_value,
        traceback
    ):
        self.connected = False

        print("Connection closed")

        # False means exceptions are not hidden.
        return False


with DatabaseConnection(
    "company.db"
) as connection:
    connection.execute(
        "SELECT * FROM employees"
    )
```

## Context manager with `contextlib`

```python
from contextlib import contextmanager


@contextmanager
def managed_resource(name):
    print(f"Opening resource: {name}")

    resource = {
        "name": name,
        "status": "open"
    }

    try:
        yield resource

    finally:
        resource["status"] = "closed"

        print(
            f"Closing resource: {name}"
        )


with managed_resource(
    "ML Model"
) as resource:
    print(resource)
```

## Suppressing an expected exception

```python
from contextlib import suppress

with suppress(FileNotFoundError):
    with open(
        "missing_file.txt",
        "r",
        encoding="utf-8"
    ) as file:
        print(file.read())

print("Program continued.")
```

---

# 24. Regular Expressions

```python
import re

text = """
Contact Aamir at aamir@example.com.
Phone: 9931879953
Salary: 50000
"""
```

## Search

```python
phone_match = re.search(
    r"\b\d{10}\b",
    text
)

if phone_match:
    print(phone_match.group())
```

## Find all

```python
numbers = re.findall(
    r"\d+",
    text
)

print(numbers)
```

## Email extraction

```python
emails = re.findall(
    r"\b[\w.-]+@[\w.-]+\.[A-Za-z]{2,}\b",
    text
)

print(emails)
```

## Replace

```python
masked_text = re.sub(
    r"\b\d{10}\b",
    "XXXXXXXXXX",
    text
)

print(masked_text)
```

## Split

```python
sentence = "Python,SQL;Machine Learning|AI"

parts = re.split(
    r"[,;|]",
    sentence
)

print(parts)
```

## Validation functions

```python
def validate_email(email):
    pattern = (
        r"^[\w.-]+@"
        r"[\w.-]+\."
        r"[A-Za-z]{2,}$"
    )

    return bool(
        re.fullmatch(
            pattern,
            email
        )
    )


def validate_phone(phone):
    return bool(
        re.fullmatch(
            r"[6-9]\d{9}",
            phone
        )
    )


print(
    validate_email(
        "aamir@example.com"
    )
)

print(
    validate_phone(
        "9931879953"
    )
)
```

## Named groups

```python
log_line = (
    "2026-07-22 "
    "ERROR "
    "Database connection failed"
)

pattern = (
    r"(?P<date>\d{4}-\d{2}-\d{2}) "
    r"(?P<level>\w+) "
    r"(?P<message>.+)"
)

match = re.match(
    pattern,
    log_line
)

if match:
    print(match.groupdict())
```

---

# 25. Collections Module

## `Counter`

```python
from collections import Counter

words = [
    "python",
    "sql",
    "python",
    "ml",
    "python",
    "sql"
]

frequency = Counter(words)

print(frequency)
print(frequency["python"])
print(frequency.most_common(2))
```

## `defaultdict`

```python
from collections import defaultdict

employees_by_department = defaultdict(list)

employees = [
    ("Aamir", "AI/ML"),
    ("Rahul", "Analytics"),
    ("Priya", "AI/ML")
]

for name, department in employees:
    employees_by_department[
        department
    ].append(name)

print(
    dict(employees_by_department)
)
```

## `deque`

```python
from collections import deque

queue = deque()

queue.append("Task 1")
queue.append("Task 2")
queue.append("Task 3")

while queue:
    current_task = queue.popleft()

    print("Processing:", current_task)
```

## Bounded deque

```python
recent_searches = deque(
    maxlen=3
)

recent_searches.append("Python")
recent_searches.append("SQL")
recent_searches.append("ML")
recent_searches.append("Pandas")

print(recent_searches)
```

## `ChainMap`

```python
from collections import ChainMap

default_config = {
    "theme": "light",
    "language": "English"
}

user_config = {
    "theme": "dark"
}

config = ChainMap(
    user_config,
    default_config
)

print(config["theme"])
print(config["language"])
```

---

# 26. Dataclasses and Type Hints

## Basic dataclass

```python
from dataclasses import dataclass, field


@dataclass
class Student:
    name: str
    age: int
    marks: float
    skills: list[str] = field(
        default_factory=list
    )

    def add_skill(
        self,
        skill: str
    ) -> None:
        self.skills.append(skill)

    def is_passed(self) -> bool:
        return self.marks >= 40


student = Student(
    name="Aamir",
    age=24,
    marks=90
)

student.add_skill("Python")
student.add_skill("Machine Learning")

print(student)
print(student.is_passed())
```

## Validation in `__post_init__`

```python
from dataclasses import dataclass


@dataclass
class Product:
    name: str
    price: float
    quantity: int = 0

    def __post_init__(self):
        if self.price < 0:
            raise ValueError(
                "Price cannot be negative"
            )

        if self.quantity < 0:
            raise ValueError(
                "Quantity cannot be negative"
            )

    @property
    def total_value(self) -> float:
        return self.price * self.quantity


product = Product(
    "Laptop",
    50000,
    2
)

print(product.total_value)
```

## Frozen dataclass

```python
@dataclass(frozen=True)
class Point:
    x: int
    y: int


point = Point(10, 20)

print(point)

# point.x = 100  # FrozenInstanceError
```

## Type hints

```python
def calculate_average(
    values: list[float]
) -> float:
    if not values:
        raise ValueError(
            "Values cannot be empty"
        )

    return sum(values) / len(values)


marks: list[float] = [
    90,
    82,
    95
]

print(calculate_average(marks))
```

## Optional and union types

```python
def find_student(
    student_id: int
) -> str | None:
    students = {
        1: "Aamir",
        2: "Rahul"
    }

    return students.get(student_id)


result = find_student(3)

print(result)
```

## Callable

```python
from collections.abc import Callable


def process_values(
    values: list[int],
    operation: Callable[[int], int]
) -> list[int]:
    return [
        operation(value)
        for value in values
    ]


def square(number: int) -> int:
    return number ** 2


print(
    process_values(
        [1, 2, 3],
        square
    )
)
```

---

# 27. Testing and Logging

## `unittest`

```python
import unittest


def divide(a, b):
    if b == 0:
        raise ValueError(
            "Cannot divide by zero"
        )

    return a / b


class TestCalculator(unittest.TestCase):
    def test_divide(self):
        self.assertEqual(
            divide(10, 2),
            5
        )

    def test_decimal_result(self):
        self.assertAlmostEqual(
            divide(10, 3),
            3.333333,
            places=5
        )

    def test_zero_division(self):
        with self.assertRaises(
            ValueError
        ):
            divide(10, 0)


if __name__ == "__main__":
    unittest.main()
```

## Pytest style

```python
import pytest


def add(a, b):
    return a + b


def test_add_positive_numbers():
    assert add(10, 20) == 30


def test_add_negative_numbers():
    assert add(-5, -3) == -8


@pytest.mark.parametrize(
    "a,b,expected",
    [
        (1, 2, 3),
        (10, 20, 30),
        (-1, 1, 0)
    ]
)
def test_add_multiple_cases(
    a,
    b,
    expected
):
    assert add(a, b) == expected
```

Run:

```bash
pytest -v
```

## Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    )
)

logger = logging.getLogger(
    "employee_app"
)


def calculate_salary(
    base_salary,
    bonus_percentage
):
    logger.info(
        "Calculating salary"
    )

    if base_salary < 0:
        logger.error(
            "Negative base salary"
        )

        raise ValueError(
            "Salary cannot be negative"
        )

    bonus = (
        base_salary *
        bonus_percentage /
        100
    )

    final_salary = (
        base_salary + bonus
    )

    logger.info(
        "Salary calculated successfully"
    )

    return final_salary


print(
    calculate_salary(
        50000,
        10
    )
)
```

## File logging

```python
logging.basicConfig(
    filename="application.log",
    filemode="a",
    level=logging.INFO,
    format=(
        "%(asctime)s - "
        "%(levelname)s - "
        "%(message)s"
    )
)
```

---

# 28. Databases and APIs

## SQLite database

```python
import sqlite3

DATABASE_NAME = "company.db"


def create_database():
    with sqlite3.connect(
        DATABASE_NAME
    ) as connection:
        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department TEXT NOT NULL,
                salary REAL NOT NULL
            )
        """)

        connection.commit()


def add_employee(
    name,
    department,
    salary
):
    with sqlite3.connect(
        DATABASE_NAME
    ) as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO employees
            (name, department, salary)
            VALUES (?, ?, ?)
            """,
            (
                name,
                department,
                salary
            )
        )

        connection.commit()


def get_employees():
    with sqlite3.connect(
        DATABASE_NAME
    ) as connection:
        connection.row_factory = (
            sqlite3.Row
        )

        cursor = connection.cursor()

        cursor.execute(
            "SELECT * FROM employees"
        )

        rows = cursor.fetchall()

        return [
            dict(row)
            for row in rows
        ]


create_database()

add_employee(
    "Aamir",
    "AI/ML",
    50000
)

add_employee(
    "Rahul",
    "Analytics",
    45000
)

print(get_employees())
```

## Update and delete

```python
def update_salary(
    employee_id,
    new_salary
):
    with sqlite3.connect(
        DATABASE_NAME
    ) as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE employees
            SET salary = ?
            WHERE id = ?
            """,
            (
                new_salary,
                employee_id
            )
        )

        connection.commit()


def delete_employee(
    employee_id
):
    with sqlite3.connect(
        DATABASE_NAME
    ) as connection:
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM employees
            WHERE id = ?
            """,
            (employee_id,)
        )

        connection.commit()
```

## REST API request

```python
import requests


def get_users():
    url = (
        "https://jsonplaceholder."
        "typicode.com/users"
    )

    try:
        response = requests.get(
            url,
            timeout=10
        )

        response.raise_for_status()

        return response.json()

    except requests.Timeout:
        print("Request timed out.")

    except requests.HTTPError as error:
        print(
            "HTTP error:",
            error
        )

    except requests.RequestException as error:
        print(
            "Request failed:",
            error
        )

    return []


users = get_users()

for user in users[:3]:
    print(
        user["name"],
        user["email"]
    )
```

## POST request

```python
def create_post():
    url = (
        "https://jsonplaceholder."
        "typicode.com/posts"
    )

    payload = {
        "title": "Python",
        "body": "Learning APIs",
        "userId": 1
    }

    response = requests.post(
        url,
        json=payload,
        timeout=10
    )

    response.raise_for_status()

    return response.json()


print(create_post())
```

---

# 29. Threading

Threading is useful for I/O-bound tasks.

```python
import threading
import time


def download_file(
    file_name,
    delay
):
    print(
        f"Starting {file_name}"
    )

    time.sleep(delay)

    print(
        f"Completed {file_name}"
    )


threads = []

tasks = [
    ("file1.csv", 2),
    ("file2.csv", 1),
    ("file3.csv", 3)
]

for file_name, delay in tasks:
    thread = threading.Thread(
        target=download_file,
        args=(
            file_name,
            delay
        )
    )

    threads.append(thread)

    thread.start()

for thread in threads:
    thread.join()

print("All downloads completed.")
```

## Race condition and lock

```python
import threading

counter = 0
lock = threading.Lock()


def increment_counter():
    global counter

    for _ in range(100000):
        with lock:
            counter += 1


threads = [
    threading.Thread(
        target=increment_counter
    )
    for _ in range(4)
]

for thread in threads:
    thread.start()

for thread in threads:
    thread.join()

print("Final counter:", counter)
```

## Thread pool

```python
from concurrent.futures import (
    ThreadPoolExecutor,
    as_completed
)
import time


def process_task(task_id):
    time.sleep(1)

    return (
        f"Task {task_id} completed"
    )


with ThreadPoolExecutor(
    max_workers=3
) as executor:
    futures = [
        executor.submit(
            process_task,
            task_id
        )
        for task_id in range(1, 6)
    ]

    for future in as_completed(futures):
        print(future.result())
```

---

# 30. Multiprocessing

Multiprocessing is useful for CPU-bound work.

```python
from multiprocessing import Process
import os


def calculate_square(number):
    print(
        f"Process {os.getpid()} "
        f"calculated {number ** 2}"
    )


if __name__ == "__main__":
    processes = []

    for number in range(1, 6):
        process = Process(
            target=calculate_square,
            args=(number,)
        )

        processes.append(process)

        process.start()

    for process in processes:
        process.join()

    print("All processes completed.")
```

## Process pool

```python
from concurrent.futures import (
    ProcessPoolExecutor
)


def calculate_factorial(number):
    result = 1

    for value in range(
        1,
        number + 1
    ):
        result *= value

    return number, result


if __name__ == "__main__":
    numbers = [
        10,
        15,
        20,
        25
    ]

    with ProcessPoolExecutor() as executor:
        results = executor.map(
            calculate_factorial,
            numbers
        )

    for number, factorial in results:
        print(
            number,
            factorial
        )
```

## Shared queue

```python
from multiprocessing import (
    Process,
    Queue
)


def producer(queue):
    for number in range(1, 6):
        queue.put(number)

    queue.put(None)


def consumer(queue):
    while True:
        item = queue.get()

        if item is None:
            break

        print(
            "Processed:",
            item ** 2
        )


if __name__ == "__main__":
    queue = Queue()

    producer_process = Process(
        target=producer,
        args=(queue,)
    )

    consumer_process = Process(
        target=consumer,
        args=(queue,)
    )

    producer_process.start()
    consumer_process.start()

    producer_process.join()
    consumer_process.join()
```

---

# 31. Async Programming

Async programming is useful for many concurrent I/O operations.

```python
import asyncio


async def fetch_data(
    task_name,
    delay
):
    print(
        f"{task_name} started"
    )

    await asyncio.sleep(delay)

    print(
        f"{task_name} completed"
    )

    return {
        "task": task_name,
        "status": "success"
    }


async def main():
    results = await asyncio.gather(
        fetch_data("Task 1", 2),
        fetch_data("Task 2", 1),
        fetch_data("Task 3", 3)
    )

    print(results)


asyncio.run(main())
```

## Create tasks manually

```python
import asyncio


async def worker(name, delay):
    await asyncio.sleep(delay)

    return f"{name} finished"


async def main():
    task1 = asyncio.create_task(
        worker("Worker 1", 2)
    )

    task2 = asyncio.create_task(
        worker("Worker 2", 1)
    )

    print(await task1)
    print(await task2)


asyncio.run(main())
```

## Timeout

```python
import asyncio


async def slow_operation():
    await asyncio.sleep(5)

    return "Completed"


async def main():
    try:
        result = await asyncio.wait_for(
            slow_operation(),
            timeout=2
        )

        print(result)

    except asyncio.TimeoutError:
        print("Operation timed out.")


asyncio.run(main())
```

## Async queue

```python
import asyncio


async def producer(queue):
    for number in range(1, 6):
        await queue.put(number)

        print(
            "Produced:",
            number
        )

    await queue.put(None)


async def consumer(queue):
    while True:
        item = await queue.get()

        if item is None:
            break

        print(
            "Consumed:",
            item ** 2
        )


async def main():
    queue = asyncio.Queue()

    await asyncio.gather(
        producer(queue),
        consumer(queue)
    )


asyncio.run(main())
```

---

# 32. Memory Management

Python manages memory using:

```text
Reference counting
Garbage collection
Private heap
Object interning
```

## Object identity

```python
a = [1, 2, 3]
b = a
c = [1, 2, 3]

print(id(a))
print(id(b))
print(id(c))

print(a is b)
print(a is c)
```

## Reference count

```python
import sys

data = []

print(
    sys.getrefcount(data)
)

another_reference = data

print(
    sys.getrefcount(data)
)
```

## Garbage collection

```python
import gc


class Node:
    def __init__(self, value):
        self.value = value
        self.reference = None


node1 = Node(1)
node2 = Node(2)

node1.reference = node2
node2.reference = node1

del node1
del node2

collected = gc.collect()

print(
    "Objects collected:",
    collected
)
```

## Shallow and deep copy

```python
import copy

original = [
    [1, 2],
    [3, 4]
]

shallow_copy = copy.copy(
    original
)

deep_copy = copy.deepcopy(
    original
)

shallow_copy[0].append(100)
deep_copy[1].append(200)

print("Original:", original)
print("Shallow:", shallow_copy)
print("Deep:", deep_copy)
```

## Generator memory advantage

```python
import sys

list_values = [
    number ** 2
    for number in range(100000)
]

generator_values = (
    number ** 2
    for number in range(100000)
)

print(
    "List size:",
    sys.getsizeof(list_values)
)

print(
    "Generator size:",
    sys.getsizeof(generator_values)
)
```

## `__slots__`

```python
class NormalEmployee:
    def __init__(
        self,
        name,
        salary
    ):
        self.name = name
        self.salary = salary


class SlottedEmployee:
    __slots__ = (
        "name",
        "salary"
    )

    def __init__(
        self,
        name,
        salary
    ):
        self.name = name
        self.salary = salary


normal = NormalEmployee(
    "Aamir",
    50000
)

slotted = SlottedEmployee(
    "Aamir",
    50000
)

print(
    "Normal object:",
    sys.getsizeof(normal)
)

print(
    "Slotted object:",
    sys.getsizeof(slotted)
)
```

---

# 33. Descriptors and Metaclasses

## Descriptor

A descriptor controls attribute access.

```python
class PositiveNumber:
    def __set_name__(
        self,
        owner,
        name
    ):
        self.private_name = (
            f"_{name}"
        )

    def __get__(
        self,
        instance,
        owner
    ):
        if instance is None:
            return self

        return getattr(
            instance,
            self.private_name
        )

    def __set__(
        self,
        instance,
        value
    ):
        if not isinstance(
            value,
            (int, float)
        ):
            raise TypeError(
                "Value must be numeric"
            )

        if value < 0:
            raise ValueError(
                "Value cannot be negative"
            )

        setattr(
            instance,
            self.private_name,
            value
        )


class Product:
    price = PositiveNumber()
    quantity = PositiveNumber()

    def __init__(
        self,
        name,
        price,
        quantity
    ):
        self.name = name
        self.price = price
        self.quantity = quantity

    @property
    def total_value(self):
        return (
            self.price *
            self.quantity
        )


product = Product(
    "Laptop",
    50000,
    2
)

print(product.total_value)

product.price = 45000

print(product.total_value)
```

## Method descriptor example

Functions inside classes become bound methods.

```python
class Example:
    def show(self):
        return "Hello"


example = Example()

print(Example.show)
print(example.show)
```

## Metaclass

A metaclass creates classes.

```python
class ModelMeta(type):
    def __new__(
        metaclass,
        class_name,
        bases,
        namespace
    ):
        if class_name != "BaseModel":
            if "predict" not in namespace:
                raise TypeError(
                    f"{class_name} must "
                    f"define predict()"
                )

        namespace[
            "model_type"
        ] = "Machine Learning Model"

        return super().__new__(
            metaclass,
            class_name,
            bases,
            namespace
        )


class BaseModel(
    metaclass=ModelMeta
):
    pass


class LinearModel(BaseModel):
    def predict(self, value):
        return 2 * value + 5


model = LinearModel()

print(model.predict(10))
print(model.model_type)
```

## Class decorator as simpler alternative

```python
def add_description(cls):
    cls.description = (
        "Decorated class"
    )

    return cls


@add_description
class Student:
    pass


print(Student.description)
```

---

# 34. Packaging and Clean Code

## Recommended project structure

```text
employee_management/
├── pyproject.toml
├── README.md
├── requirements.txt
├── .gitignore
├── src/
│   └── employee_management/
│       ├── __init__.py
│       ├── models.py
│       ├── services.py
│       ├── repository.py
│       └── main.py
└── tests/
    ├── test_services.py
    └── test_repository.py
```

## `models.py`

```python
from dataclasses import dataclass


@dataclass
class Employee:
    employee_id: int
    name: str
    department: str
    salary: float

    def __post_init__(self):
        if self.employee_id <= 0:
            raise ValueError(
                "Employee ID must be positive"
            )

        if not self.name.strip():
            raise ValueError(
                "Name cannot be empty"
            )

        if self.salary < 0:
            raise ValueError(
                "Salary cannot be negative"
            )
```

## `repository.py`

```python
from .models import Employee


class EmployeeRepository:
    def __init__(self):
        self._employees: dict[
            int,
            Employee
        ] = {}

    def add(
        self,
        employee: Employee
    ) -> None:
        if (
            employee.employee_id
            in self._employees
        ):
            raise ValueError(
                "Employee already exists"
            )

        self._employees[
            employee.employee_id
        ] = employee

    def get(
        self,
        employee_id: int
    ) -> Employee | None:
        return self._employees.get(
            employee_id
        )

    def get_all(
        self
    ) -> list[Employee]:
        return list(
            self._employees.values()
        )

    def delete(
        self,
        employee_id: int
    ) -> bool:
        if (
            employee_id
            not in self._employees
        ):
            return False

        del self._employees[
            employee_id
        ]

        return True
```

## `services.py`

```python
from .models import Employee
from .repository import EmployeeRepository


class EmployeeService:
    def __init__(
        self,
        repository: EmployeeRepository
    ):
        self.repository = repository

    def register_employee(
        self,
        employee_id: int,
        name: str,
        department: str,
        salary: float
    ) -> Employee:
        employee = Employee(
            employee_id=employee_id,
            name=name,
            department=department,
            salary=salary
        )

        self.repository.add(employee)

        return employee

    def calculate_department_salary(
        self,
        department: str
    ) -> float:
        employees = (
            self.repository.get_all()
        )

        return sum(
            employee.salary
            for employee in employees
            if employee.department
            == department
        )

    def increase_salary(
        self,
        employee_id: int,
        percentage: float
    ) -> Employee:
        if percentage < 0:
            raise ValueError(
                "Percentage cannot be negative"
            )

        employee = self.repository.get(
            employee_id
        )

        if employee is None:
            raise ValueError(
                "Employee not found"
            )

        increase = (
            employee.salary *
            percentage /
            100
        )

        employee.salary += increase

        return employee
```

## `main.py`

```python
from .repository import EmployeeRepository
from .services import EmployeeService


def main():
    repository = EmployeeRepository()
    service = EmployeeService(
        repository
    )

    service.register_employee(
        1,
        "Aamir",
        "AI/ML",
        50000
    )

    service.register_employee(
        2,
        "Rahul",
        "Analytics",
        45000
    )

    service.register_employee(
        3,
        "Priya",
        "AI/ML",
        60000
    )

    total_salary = (
        service.calculate_department_salary(
            "AI/ML"
        )
    )

    print(
        "AI/ML Total Salary:",
        total_salary
    )

    updated_employee = (
        service.increase_salary(
            1,
            10
        )
    )

    print(updated_employee)


if __name__ == "__main__":
    main()
```

## `pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "employee-management"
version = "0.1.0"
description = "Employee management example"
requires-python = ">=3.11"

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]
```

## `.gitignore`

```text
venv/
.venv/
__pycache__/
*.pyc
.env
.idea/
.vscode/
.pytest_cache/
dist/
build/
*.egg-info/
```

## Clean-code principles

### Use meaningful names

Bad:

```python
def c(a, b):
    return a * b
```

Better:

```python
def calculate_total_price(
    unit_price,
    quantity
):
    return unit_price * quantity
```

### Single responsibility

Bad:

```python
def process_employee(employee):
    # Validate employee
    # Save employee
    # Send email
    # Generate report
    pass
```

Better:

```python
def validate_employee(employee):
    pass


def save_employee(employee):
    pass


def send_welcome_email(employee):
    pass


def generate_employee_report(employee):
    pass
```

### Avoid duplicated code

```python
def calculate_percentage(
    value,
    percentage
):
    return (
        value *
        percentage /
        100
    )


salary_bonus = calculate_percentage(
    50000,
    10
)

discount = calculate_percentage(
    2000,
    15
)
```

### Use early returns

```python
def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError(
            "Amount must be positive"
        )

    if amount > balance:
        raise ValueError(
            "Insufficient balance"
        )

    return balance - amount
```

### Document public functions

```python
def calculate_average(
    values: list[float]
) -> float:
    """
    Calculate the arithmetic mean.

    Args:
        values:
            Non-empty list of numbers.

    Returns:
        Arithmetic mean.

    Raises:
        ValueError:
            If values is empty.
    """

    if not values:
        raise ValueError(
            "Values cannot be empty"
        )

    return sum(values) / len(values)
```

### Separate configuration

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class AppConfig:
    database_name: str
    debug: bool = False
    max_connections: int = 10


config = AppConfig(
    database_name="company.db",
    debug=True
)
```

---

# Final Revision Table

| Topic | Main Concept |
|---|---|
| Installation | Run Python and install packages |
| Variables | Store object references |
| Operators | Perform calculations and comparisons |
| Input/output | Read and display information |
| Conditions | Make decisions |
| Loops | Repeat operations |
| Strings | Work with text |
| Lists | Mutable ordered collection |
| Tuples | Immutable ordered collection |
| Sets | Unique values |
| Dictionaries | Key-value data |
| Functions | Reusable logic |
| Scope | Variable visibility |
| Lambda | Small anonymous functions |
| Recursion | Function calls itself |
| OOP | Classes and objects |
| Exceptions | Handle runtime errors |
| Files | Read and write data |
| Modules | Reusable Python files |
| Virtual environments | Isolate dependencies |
| Iterators | Produce one item at a time |
| Generators | Lazy iteration with `yield` |
| Closures | Remember enclosing values |
| Decorators | Add function behavior |
| Context managers | Setup and cleanup |
| Regex | Search and validate patterns |
| Collections | Specialized containers |
| Dataclasses | Data-focused classes |
| Testing | Verify code correctness |
| Logging | Record application events |
| Databases | Store structured data |
| APIs | Communicate between systems |
| Threading | Concurrent I/O work |
| Multiprocessing | Parallel CPU work |
| Async | Concurrent non-blocking I/O |
| Memory | References and garbage collection |
| Descriptors | Control attributes |
| Metaclasses | Control class creation |
| Packaging | Build reusable projects |
| Clean code | Maintainable, readable design |
