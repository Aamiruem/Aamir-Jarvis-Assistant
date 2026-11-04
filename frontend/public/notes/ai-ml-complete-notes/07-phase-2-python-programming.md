> **You asked:**
>
> **Chapter 5: Operators and Input/Output**
>
> **Operators**
>
> - Arithmetic      operators 
> - Assignment      operators 
> - Comparison      operators 
> - Logical      operators 
> - Identity      operators 
> - Membership      operators 
> - Bitwise      operators 
> - Operator      precedence 
> - Associativity      
>
> **Input and output**
>
> - input()      
> - print()      
> - sep 
> - end 
> - Formatted      strings 
> - f-strings      
> - format()      
>
>   Escape characters       Explain the chapter \<Topicwise> in detail.
>  Break down all concepts step by step in very simple language.
>  Include: 
>
> - Clear definitions of each concept
> - Important formulas with parameter names explained
> - Real-world examples for each concept
> - Visualizations or diagrams to make it intuitive (use graphs and colorful notes)
> - Conceptual code examples (Python preferred) with dry run tables
> - Common mistakes and how to avoid them
> - Interview-style questions with answers for practice
>
>  Make the explanation very conceptual, beginner-friendly, and structured like a study guide.
>  Use graphs, colorful notes, and highlight formulas with parameter names for clarity.
>  Provide complete Python code examples with dry run tables for understanding.
>  colorful notes and diagram and difficult word explain to easy meaning explain all concept through diagram and color full Notes basics to advanced code and write every word very easy mean  mind map

# 🐍 Phase 2 — Python Programming
# Chapter 5: Operators and Input/Output

> 🎯 **Chapter goal:** Learn how Python performs calculations, comparisons, logical decisions, bit-level operations, receives input from users, displays output, and controls the order in which expressions are evaluated.

---

# 🧠 1. Big Picture Mind Map

```text
                         🐍 OPERATORS & I/O
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
         ⚙️ OPERATORS                         🖥️ I/O
              │                                   │
     ┌────────┼────────┐                  ┌───────┼────────┐
     ↓        ↓        ↓                  ↓       ↓        ↓
 Arithmetic Assignment Comparison       input() print() Formatting
     │        │        │                         │
     └────────┼────────┘                         ├── sep
              ↓                                  ├── end
          Logical                               ├── f-string
              │                                  ├── format()
              ↓                                  └── escape chars
          Identity
              │
          Membership
              │
           Bitwise
              │
              ↓
      Precedence & Associativity
```

---

# 🌈 2. What Is an Operator?

An **operator** is a symbol or keyword that tells Python to perform an operation.

Example:

```python
a = 10 + 5
```

Here:

```text
10     +      5
│      │      │
value operator value
       ↓
      15
```

### Easy meaning

> **Operator = a symbol/keyword that tells Python what operation to perform.**

---

# 3. Operators at a Glance

| Category | Examples | Purpose |
|---|---|---|
| Arithmetic | `+ - * / // % **` | Mathematics |
| Assignment | `= += -= *=` | Store/update values |
| Comparison | `== != > < >= <=` | Compare values |
| Logical | `and or not` | Combine conditions |
| Identity | `is`, `is not` | Check object identity |
| Membership | `in`, `not in` | Check whether something exists |
| Bitwise | `& \| ^ ~ << >>` | Work with bits |

---

# 🔢 PART 1 — ARITHMETIC OPERATORS

Arithmetic operators are used for mathematical calculations.

## 4. Addition `+`

Formula:

\[
result = a+b
\]

Example:

```python
a = 10
b = 5

result = a + b

print(result)
```

Output:

```text
15
```

### Real-world example

```python
price = 500
delivery = 50

total = price + delivery
```

```text
₹500 + ₹50 = ₹550
```

---

# 5. Subtraction `-`

Formula:

\[
result = a-b
\]

```python
salary = 50000
expense = 12000

remaining = salary - expense

print(remaining)
```

Output:

```text
38000
```

---

# 6. Multiplication `*`

Formula:

\[
result=a\times b
\]

```python
price = 100
quantity = 5

total = price * quantity

print(total)
```

Output:

```text
500
```

---

# 7. Division `/`

The `/` operator produces a floating-point result.

```python
a = 10
b = 2

print(a / b)
```

Output:

```text
5.0
```

Even though the mathematical answer is 5, Python's `/` gives a `float`.

---

# 8. Floor Division `//`

Floor division returns the quotient rounded **down toward negative infinity**.

Example:

```python
print(10 // 3)
```

Output:

```text
3
```

Because:

\[
10/3=3.333...
\]

Floor:

\[
\lfloor3.333...\rfloor=3
\]

### ⚠️ Important negative example

```python
print(-10 // 3)
```

Output:

```text
-4
```

Because:

\[
-10/3=-3.333...
\]

Floor means go toward negative infinity:

\[
\lfloor-3.333...\rfloor=-4
\]

---

# 9. Modulus `%`

The `%` operator gives the remainder.

```python
10 % 3
```

Output:

```text
1
```

Because:

\[
10 = 3\times3+1
\]

Therefore:

\[
10\%3=1
\]

### Real-world example: even/odd

```python
number = 10

if number % 2 == 0:
    print("Even")
else:
    print("Odd")
```

---

# 10. Power `**`

Used for exponentiation.

\[
a^b
\]

Python:

```python
print(2 ** 3)
```

Output:

```text
8
```

Because:

\[
2^3=2\times2\times2=8
\]

---

# 11. Arithmetic Operator Table

| Operator | Meaning | Example | Result |
|---|---|---:|---:|
| `+` | Add | `10+3` | `13` |
| `-` | Subtract | `10-3` | `7` |
| `*` | Multiply | `10*3` | `30` |
| `/` | Division | `10/3` | `3.333...` |
| `//` | Floor division | `10//3` | `3` |
| `%` | Remainder | `10%3` | `1` |
| `**` | Power | `10**3` | `1000` |

---

# 🧪 12. Arithmetic Dry Run

Code:

```python
a = 17
b = 5

x = a + b
y = a - b
z = a * b
p = a / b
q = a // b
r = a % b
s = a ** 2
```

| Variable | Expression | Result |
|---|---|---:|
| `x` | `17 + 5` | `22` |
| `y` | `17 - 5` | `12` |
| `z` | `17 * 5` | `85` |
| `p` | `17 / 5` | `3.4` |
| `q` | `17 // 5` | `3` |
| `r` | `17 % 5` | `2` |
| `s` | `17 ** 2` | `289` |

---

# ⚠️ 13. Arithmetic Common Mistakes

### Mistake 1

```python
10 / 2
```

Expecting integer `5`.

Actually:

```text
5.0
```

---

### Mistake 2

Confusing `/` and `//`.

```text
/  → normal division
// → floor division
```

---

### Mistake 3

Thinking `%` means percentage.

In Python:

```text
% = remainder/modulo
```

---

# 📝 PART 2 — ASSIGNMENT OPERATORS

Assignment operators store or update values.

---

# 14. Basic Assignment `=`

```python
x = 10
```

Meaning:

```text
x → 10
```

It does **not** mean mathematical equality.

---

# 15. `+=`

```python
x = 10
x += 5
```

Equivalent to:

```python
x = x + 5
```

Result:

```text
15
```

---

# 16. `-=`

```python
x = 10
x -= 3
```

Equivalent:

```python
x = x - 3
```

Result:

```text
7
```

---

# 17. `*=`

```python
x = 10
x *= 3
```

Equivalent:

```python
x = x * 3
```

Result:

```text
30
```

---

# 18. `/=`

```python
x = 10
x /= 2
```

Result:

```text
5.0
```

---

# 19. `//=`

```python
x = 10
x //= 3
```

Result:

```text
3
```

---

# 20. `%=` 

```python
x = 10
x %= 3
```

Result:

```text
1
```

---

# 21. `**=`

```python
x = 2
x **= 3
```

Result:

```text
8
```

---

# 22. Assignment Operator Table

| Operator | Equivalent |
|---|---|
| `=` | assign |
| `+=` | `x = x + y` |
| `-=` | `x = x - y` |
| `*=` | `x = x * y` |
| `/=` | `x = x / y` |
| `//=` | `x = x // y` |
| `%=` | `x = x % y` |
| `**=` | `x = x ** y` |

---

# 🧪 23. Assignment Dry Run

```python
x = 10

x += 5
x *= 2
x -= 4
x //= 2
```

| Step | Operation | `x` |
|---|---|---:|
| Start | `x = 10` | 10 |
| 1 | `x += 5` | 15 |
| 2 | `x *= 2` | 30 |
| 3 | `x -= 4` | 26 |
| 4 | `x //= 2` | 13 |

---

# 🔍 PART 3 — COMPARISON OPERATORS

Comparison operators compare values.

The result is:

```text
True
```

or:

```text
False
```

---

# 24. Equal `==`

```python
10 == 10
```

Result:

```text
True
```

Important:

```text
=  → assignment
== → comparison
```

---

# 25. Not Equal `!=`

```python
10 != 5
```

Result:

```text
True
```

---

# 26. Greater Than `>`

```python
10 > 5
```

Result:

```text
True
```

---

# 27. Less Than `<`

```python
10 < 5
```

Result:

```text
False
```

---

# 28. Greater Than or Equal `>=`

```python
10 >= 10
```

Result:

```text
True
```

---

# 29. Less Than or Equal `<=`

```python
10 <= 10
```

Result:

```text
True
```

---

# 30. Comparison Table

| Operator | Meaning |
|---|---|
| `==` | Equal |
| `!=` | Not equal |
| `>` | Greater than |
| `<` | Less than |
| `>=` | Greater than or equal |
| `<=` | Less than or equal |

---

# 🧠 31. Real-World Example

```python
age = 20

if age >= 18:
    print("Eligible")
```

Diagram:

```text
             age >= 18?
                 │
          ┌──────┴──────┐
          ↓             ↓
        True           False
          │             │
          ↓             ↓
      Eligible       Not eligible
```

---

# 🔗 PART 4 — LOGICAL OPERATORS

Logical operators combine conditions.

There are three:

```text
and
or
not
```

---

# 32. `and`

`and` returns true when **both conditions are true**.

```python
age = 25
has_id = True

print(age >= 18 and has_id)
```

Result:

```text
True
```

Truth table:

| A | B | A `and` B |
|---|---|---|
| False | False | False |
| False | True | False |
| True | False | False |
| True | True | **True** |

### Easy memory

> **AND = everyone must agree.**

---

# 33. Real Example

A person can enter:

```text
age >= 18
AND
has_ticket = True
```

```python
if age >= 18 and has_ticket:
    print("Allowed")
```

---

# 34. `or`

`or` returns true when **at least one condition is true**.

| A | B | A `or` B |
|---|---|---|
| False | False | False |
| False | True | **True** |
| True | False | **True** |
| True | True | **True** |

### Easy memory

> **OR = at least one is enough.**

---

# 35. Real Example

```python
is_admin = False
is_manager = True

if is_admin or is_manager:
    print("Access granted")
```

Output:

```text
Access granted
```

---

# 36. `not`

`not` reverses a Boolean result.

```python
x = True

print(not x)
```

Output:

```text
False
```

Truth table:

| A | `not A` |
|---|---|
| True | False |
| False | True |

---

# 37. Logical Diagram

```text
                 LOGICAL OPERATORS
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
         AND          OR           NOT
          │            │            │
     both true     one true      reverse
       required      enough       result
```

---

# ⚡ 38. Short-Circuit Evaluation

Python does not always evaluate every part of `and`/`or`.

### `and`

```python
False and something
```

Python already knows the final result must be `False`.

### `or`

```python
True or something
```

Python already knows the final result must be `True`.

This is called **short-circuit evaluation**.

---

# 🪪 PART 5 — IDENTITY OPERATORS

Identity operators:

```text
is
is not
```

They check whether two references point to the **same object**.

---

# 39. `is`

```python
a = [1, 2]
b = a

print(a is b)
```

Output:

```text
True
```

Diagram:

```text
a ───────┐
         ↓
     [1, 2]
         ↑
b ───────┘
```

Same object.

---

# 40. `is not`

```python
a = [1, 2]
b = [1, 2]

print(a is not b)
```

Normally:

```text
True
```

because they are separate list objects.

---

# 41. `==` vs `is`

This is a **very important interview question**.

```python
a = [1, 2]
b = [1, 2]
```

```python
a == b
```

→ `True`

Because their contents are equal.

```python
a is b
```

→ `False`

Because they are different objects.

### Remember:

```text
== → "Do they have equal values?"
is → "Are they the same object?"
```

---

# 42. Correct Use of `is`

The most common correct use:

```python
result = None

if result is None:
    print("No result")
```

Prefer:

```python
is None
```

instead of:

```python
== None
```

---

# 📦 PART 6 — MEMBERSHIP OPERATORS

Membership operators:

```text
in
not in
```

They check whether an item exists inside a container/iterable.

---

# 43. `in`

```python
numbers = [10, 20, 30]

print(20 in numbers)
```

Output:

```text
True
```

---

# 44. `not in`

```python
numbers = [10, 20, 30]

print(50 not in numbers)
```

Output:

```text
True
```

---

# 45. Membership with String

```python
text = "Python"

print("Py" in text)
```

Output:

```text
True
```

Example:

```python
print("Java" in "Python")
```

Output:

```text
False
```

---

# 46. Membership with Dictionary ⚠️

For dictionaries, `in` normally checks **keys**.

```python
student = {
    "name": "Aamir",
    "age": 25
}

print("name" in student)
```

→ `True`

But:

```python
print("Aamir" in student)
```

→ `False`

because `"Aamir"` is a value, not a key.

For values:

```python
print("Aamir" in student.values())
```

→ `True`

---

# 🧠 PART 7 — BITWISE OPERATORS

This is one of the most difficult parts for beginners.

Let's make it very easy.

## 47. What is a Bit?

A computer represents integers using binary digits:

```text
0
1
```

A **bit** is one binary digit.

Example:

```text
Decimal 5

5 → 101
```

Because:

\[
5 = 1(2^2)+0(2^1)+1(2^0)
\]

\[
=4+0+1=5
\]

---

# 48. Binary Representation

```text
Decimal: 5

Binary:
  1  0  1
  │  │  │
  4  2  1
```

\[
1\times4+0\times2+1\times1=5
\]

---

# 49. Bitwise AND `&`

Example:

```python
5 & 3
```

Binary:

```text
5 = 101
3 = 011
```

Compare each bit:

```text
  101
& 011
-----
  001
```

`001` = `1`.

Therefore:

```python
5 & 3
```

→ `1`

### AND rule

```text
1 & 1 = 1
everything else = 0
```

---

# 50. Bitwise OR `|`

```text
  101
| 011
-----
  111
```

`111` = 7.

Therefore:

```python
5 | 3
```

→ `7`

### OR rule

```text
0 | 0 = 0
everything else = 1
```

---

# 51. Bitwise XOR `^`

XOR means:

> Different bits → 1  
> Same bits → 0

```text
  101
^ 011
-----
  110
```

`110` = 6.

Therefore:

```python
5 ^ 3
```

→ `6`

Truth table:

| A | B | A XOR B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

---

# 52. Bitwise NOT `~`

`~x` flips the bits according to Python's signed integer representation.

A useful identity is:

\[
\boxed{\sim x = -(x+1)}
\]

Example:

```python
~5
```

\[
-(5+1)=-6
\]

Therefore:

```text
~5 = -6
```

---

# 53. Left Shift `<<`

Left shift moves binary bits to the left.

```python
5 << 1
```

Binary:

```text
101
↓ shift left
1010
```

`1010` = 10.

Therefore:

```text
5 << 1 = 10
```

For non-negative integers:

\[
x << n = x\times2^n
\]

---

# 54. Right Shift `>>`

Moves bits right.

```python
10 >> 1
```

Binary:

```text
1010
 ↓
0101
```

`0101` = 5.

Therefore:

```text
10 >> 1 = 5
```

For non-negative integers:

\[
x >> n = \left\lfloor\frac{x}{2^n}\right\rfloor
\]

---

# 55. Bitwise Operator Table

| Operator | Meaning |
|---|---|
| `&` | Bitwise AND |
| `\|` | Bitwise OR |
| `^` | Bitwise XOR |
| `~` | Bitwise NOT |
| `<<` | Left shift |
| `>>` | Right shift |

---

# 🧪 56. Bitwise Dry Run

```python
a = 5
b = 3
```

Binary:

```text
a = 101
b = 011
```

| Operation | Binary | Decimal |
|---|---|---:|
| `a & b` | `001` | 1 |
| `a \| b` | `111` | 7 |
| `a ^ b` | `110` | 6 |
| `a << 1` | `1010` | 10 |
| `a >> 1` | `010` | 2 |
| `~a` | — | -6 |

---

# 🧠 57. Where Bitwise Operators Are Used

Common uses:

- permissions
- flags
- masks
- low-level programming
- networking
- compression
- embedded systems
- performance-oriented algorithms

Example permission flags:

```text
Read    = 001
Write   = 010
Execute = 100
```

You can combine them using OR:

```text
001
OR 010
-----
011
```

Now the user has:

```text
Read + Write
```

---

# 🧮 PART 8 — OPERATOR PRECEDENCE

When an expression has multiple operators, Python must decide **which operation happens first**.

Example:

```python
result = 2 + 3 * 4
```

Does Python calculate:

```text
(2 + 3) * 4 = 20
```

or:

```text
2 + (3 * 4) = 14
```

Answer:

```text
14
```

because multiplication has higher precedence than addition.

---

# 58. Precedence Meaning

> **Precedence = priority of an operator.**

Higher precedence → evaluated first.

---

# 59. Common Precedence Order

From higher to lower, a useful simplified order is:

```text
1. Parentheses              ()
2. Exponentiation           **
3. Unary +, -, ~
4. *, /, //, %
5. +, -
6. <<, >>
7. &
8. ^
9. |
10. Comparisons             < > <= >= == !=
11. not
12. and
13. or
```

Assignment expressions/statements occur lower in the overall grammar and should generally be treated separately.

---

# 60. Parentheses Have Power

Use parentheses to make your intention clear.

```python
result = (2 + 3) * 4
```

Output:

```text
20
```

Without parentheses:

```python
result = 2 + 3 * 4
```

Output:

```text
14
```

### 🟨 Best practice

> If an expression is difficult to read, use parentheses instead of relying on memory.

---

# 61. Operator Precedence Dry Run

Expression:

```python
10 + 5 * 2
```

Step 1:

```text
5 * 2 = 10
```

Step 2:

```text
10 + 10 = 20
```

Answer:

```text
20
```

---

# 62. Another Example

```python
10 - 2 ** 2
```

First:

```text
2 ** 2 = 4
```

Then:

```text
10 - 4 = 6
```

Answer:

```text
6
```

---

# 🔄 PART 9 — ASSOCIATIVITY

## What does associativity mean?

When operators have the **same precedence**, associativity tells Python which direction to evaluate them.

Usually:

```text
left → right
```

for many operators.

---

# 63. Example: Left-to-Right

```python
20 / 5 * 2
```

`/` and `*` have the same precedence.

Evaluate left to right:

```text
20 / 5 = 4

4 * 2 = 8
```

Answer:

```text
8.0
```

---

# 64. Subtraction Example

```python
20 - 5 - 3
```

Left-to-right:

```text
20 - 5 = 15
15 - 3 = 12
```

Answer:

```text
12
```

Not:

```text
20 - (5 - 3)
```

which would be 18.

---

# 65. Exponentiation Exception

Exponentiation is right-associative.

```python
2 ** 3 ** 2
```

Python interprets this as:

```python
2 ** (3 ** 2)
```

First:

```text
3 ** 2 = 9
```

Then:

```text
2 ** 9 = 512
```

Answer:

```text
512
```

---

# 🧠 Precedence vs Associativity

This is frequently asked in interviews.

### Precedence

Answers:

> **Which operator has priority?**

### Associativity

Answers:

> **If operators have the same priority, which direction is used?**

Diagram:

```text
Expression
    │
    ↓
Precedence
    │
    ↓
Which operator first?
    │
    ↓
Associativity
    │
    ↓
Which direction?
```

---

# 🖥️ PART 10 — INPUT AND OUTPUT

Now we move from operators to communicating with the user.

```text
User
 │
 │ input
 ↓
Python program
 │
 │ output
 ↓
Screen
```

---

# 66. `input()`

`input()` reads text from the user.

Example:

```python
name = input("Enter your name: ")

print(name)
```

Suppose user enters:

```text
Aamir
```

Then:

```text
name → "Aamir"
```

---

# 67. Important `input()` Rule ⚠️

`input()` returns a **string**.

```python
age = input("Enter age: ")

print(type(age))
```

If the user enters `25`:

```text
<class 'str'>
```

---

# 68. Converting Input

For integer:

```python
age = int(input("Enter age: "))
```

For float:

```python
salary = float(input("Enter salary: "))
```

For Boolean, don't simply do:

```python
bool(input())
```

because:

```python
bool("False")
```

is actually:

```text
True
```

because the string `"False"` is non-empty.

Instead parse explicitly when needed.

---

# 69. Multiple Inputs

You can do:

```python
name, city = input("Enter name and city: ").split()
```

Input:

```text
Aamir Delhi
```

Result:

```text
name → "Aamir"
city → "Delhi"
```

---

# 70. Numeric Multiple Input

```python
a, b = map(int, input().split())
```

Input:

```text
10 20
```

Conceptually:

```text
"10 20"
   ↓ split()
["10", "20"]
   ↓ map(int)
[10, 20]
   ↓
a=10, b=20
```

---

# 71. `print()`

`print()` displays output.

```python
print("Hello")
```

Output:

```text
Hello
```

Multiple values:

```python
name = "Aamir"
age = 25

print(name, age)
```

Output:

```text
Aamir 25
```

By default, `print()` separates multiple arguments with a space.

---

# 72. `sep`

`sep` means **separator**.

Default:

```python
sep=" "
```

Example:

```python
print("A", "B", "C")
```

Output:

```text
A B C
```

Custom separator:

```python
print("A", "B", "C", sep="-")
```

Output:

```text
A-B-C
```

---

# 73. Real-World `sep`

Date:

```python
day = 25
month = 8
year = 2026

print(day, month, year, sep="/")
```

Output:

```text
25/8/2026
```

---

# 74. `end`

By default, `print()` ends with a newline:

```python
print("Hello")
print("World")
```

Output:

```text
Hello
World
```

Because:

```text
end="\n"
```

---

# 75. Custom `end`

```python
print("Hello", end=" ")
print("World")
```

Output:

```text
Hello World
```

Another example:

```python
print("Loading", end="...")
print("Done")
```

Output:

```text
Loading...Done
```

---

# 76. `sep` + `end`

```python
print("Python", "AI", "ML", sep=" | ", end="!")
```

Output:

```text
Python | AI | ML!
```

---

# 77. `print()` Mental Model

Conceptually:

```text
print(value1, value2, value3,
      sep=" ",
      end="\n")
```

```text
value1
   ↓
separator
   ↓
value2
   ↓
separator
   ↓
value3
   ↓
end
```

---

# 🎨 PART 11 — FORMATTED STRINGS

Suppose:

```python
name = "Aamir"
age = 25
```

We want:

```text
My name is Aamir and I am 25 years old.
```

Python gives several ways to format strings.

---

# 78. f-Strings ⭐

The recommended modern approach for most normal formatting.

```python
name = "Aamir"
age = 25

print(f"My name is {name} and I am {age} years old.")
```

Output:

```text
My name is Aamir and I am 25 years old.
```

---

# 79. f-String Diagram

```text
f"My name is {name}"
                 ↑
                 │
           Python evaluates
           the expression
```

The `f` tells Python:

> "Evaluate expressions inside `{}`."

---

# 80. Expressions Inside f-Strings

```python
a = 10
b = 20

print(f"Sum = {a + b}")
```

Output:

```text
Sum = 30
```

You can put expressions inside `{}`.

---

# 81. Formatting Decimal Numbers

```python
price = 99.5678

print(f"Price: {price:.2f}")
```

Output:

```text
Price: 99.57
```

### `.2f`

Means:

```text
.2 → two digits after decimal
f  → fixed-point format
```

---

# 82. Percentage Formatting

```python
score = 0.8567

print(f"Score: {score:.2%}")
```

Output:

```text
Score: 85.67%
```

---

# 83. Width and Alignment

```python
name = "Aamir"

print(f"{name:>10}")
```

`>` means right-align within the given width.

Other alignment:

```text
< → left
> → right
^ → center
```

Example:

```python
print(f"{'Python':^20}")
```

---

# 84. Thousands Separator

```python
salary = 5000000

print(f"{salary:,}")
```

Output:

```text
5,000,000
```

---

# 85. Format Method

Another formatting method is:

```python
name = "Aamir"
age = 25

text = "My name is {} and I am {} years old.".format(name, age)

print(text)
```

Output:

```text
My name is Aamir and I am 25 years old.
```

---

# 86. Positional `format()`

```python
print("Name: {}, Age: {}".format("Aamir", 25))
```

Output:

```text
Name: Aamir, Age: 25
```

---

# 87. Indexed `format()`

```python
print("{0} is {1} years old.".format("Aamir", 25))
```

Output:

```text
Aamir is 25 years old.
```

---

# 88. Named `format()`

```python
print(
    "Name: {name}, Age: {age}".format(
        name="Aamir",
        age=25
    )
)
```

Output:

```text
Name: Aamir, Age: 25
```

---

# 89. f-String vs `format()`

| f-string | `format()` |
|---|---|
| Modern | Older but still useful |
| Very readable | Flexible |
| `f"{name}"` | `"{}".format(name)` |
| Excellent for normal formatting | Useful in some reusable formatting situations |

### 🟢 Recommendation

For modern Python code, learn **f-strings first**.

---

# 🔤 PART 12 — ESCAPE CHARACTERS

Escape sequences allow you to represent special characters inside strings.

They usually start with:

```text
\
```

---

# 90. Newline `\n`

```python
print("Hello\nWorld")
```

Output:

```text
Hello
World
```

Diagram:

```text
Hello
  ↓
newline
  ↓
World
```

---

# 91. Tab `\t`

```python
print("Name\tAge")
```

Output resembles:

```text
Name    Age
```

---

# 92. Backslash `\\`

If you need a literal backslash:

```python
print("C:\\Users\\Aamir")
```

Output:

```text
C:\Users\Aamir
```

---

# 93. Double Quote `\"`

```python
print("He said \"Hello\"")
```

Output:

```text
He said "Hello"
```

---

# 94. Single Quote `\'`

```python
print('It\'s Python')
```

Output:

```text
It's Python
```

Often easier:

```python
print("It's Python")
```

---

# 95. Carriage Return `\r`

`\r` moves the cursor to the beginning of the current line in many terminal contexts.

Example:

```python
print("Hello\rHi")
```

Terminal behavior can vary, but conceptually `\r` returns to the beginning of the line.

---

# 96. Backspace `\b`

```python
print("ABC\bD")
```

The exact displayed behavior can depend on the output environment.

Conceptually:

```text
\b → move one position backward
```

Don't rely on terminal control characters for robust UI formatting.

---

# 97. Common Escape Sequences

| Escape | Meaning |
|---|---|
| `\n` | New line |
| `\t` | Tab |
| `\\` | Backslash |
| `\'` | Single quote |
| `\"` | Double quote |
| `\r` | Carriage return |
| `\b` | Backspace |

---

# 98. Raw Strings

Sometimes you don't want backslashes to behave as escape characters.

Use a raw string:

```python
path = r"C:\Users\Aamir\Documents"
```

The `r` means:

> Treat backslashes mostly literally.

Very useful for Windows paths and regular expressions.

---

# 🧪 99. Complete Input/Output Program

```python
name = input("Enter your name: ")
age = int(input("Enter your age: "))
salary = float(input("Enter your salary: "))

print("\n========== PROFILE ==========")
print("Name:", name)
print("Age:", age)
print("Salary:", salary)

print("\n--- Formatted ---")
print(f"Name: {name}")
print(f"Age: {age}")
print(f"Salary: ₹{salary:,.2f}")

print("\n--- Custom Output ---")
print(name, age, salary, sep=" | ")
```

---

# 🧪 100. Dry Run

Input:

```text
Aamir
25
50000
```

| Step | Variable | Value | Type |
|---|---|---|---|
| 1 | `name` | `"Aamir"` | `str` |
| 2 | `age` | `25` | `int` |
| 3 | `salary` | `50000.0` | `float` |

Output:

```text
========== PROFILE ==========
Name: Aamir
Age: 25
Salary: 50000.0

--- Formatted ---
Name: Aamir
Age: 25
Salary: ₹50,000.00

--- Custom Output ---
Aamir | 25 | 50000.0
```

---

# 🧠 101. One Complete Operator Example

```python
age = 25
salary = 50000

eligible = age >= 18 and salary >= 30000

print(f"Age: {age}")
print(f"Salary: ₹{salary:,}")
print(f"Eligible: {eligible}")
```

Dry run:

| Expression | Result |
|---|---|
| `age >= 18` | `True` |
| `salary >= 30000` | `True` |
| `True and True` | `True` |
| `eligible` | `True` |

---

# 🌈 102. Operator Cheat Sheet

```text
                    ⚙️ PYTHON OPERATORS
                           │
 ┌───────────────┬─────────┼──────────┬───────────────┐
 ↓               ↓         ↓          ↓               ↓
Arithmetic    Assignment Comparison  Logical       Identity
 ↓               ↓         ↓          ↓               ↓
+ - * /       = += -=     == !=       and            is
// % **       *= /=       > <         or             is not
              //= %=      >= <=       not
              **=
                           │
                           ↓
                     Membership
                           │
                       in / not in
                           │
                           ↓
                       Bitwise
                           │
                    & | ^ ~ << >>
```

---

# 🧠 103. Operator Precedence Mind Map

```text
               HIGHEST PRIORITY
                      │
                      ↓
                ( parentheses )
                      ↓
                    **
                      ↓
                 +  -  ~
                      ↓
              * / // %
                      ↓
                   +  -
                      ↓
                  << >>
                      ↓
                    &
                      ↓
                    ^
                      ↓
                    |
                      ↓
             comparisons
                      ↓
                    not
                      ↓
                    and
                      ↓
                     or
                      ↓
               LOWEST PRIORITY
```

When unsure:

> **Use parentheses.**

---

# 🎨 104. Input/Output Mind Map

```text
                     🖥️ INPUT / OUTPUT
                            │
             ┌──────────────┴──────────────┐
             ↓                             ↓
          INPUT                          OUTPUT
             │                             │
          input()                        print()
             │                             │
       ┌─────┴─────┐             ┌────────┼────────┐
       ↓           ↓             ↓        ↓        ↓
     string      convert        sep      end    format
                   │
             ┌─────┼─────┐
             ↓     ↓     ↓
            int   float  bool*
```

\*Boolean input usually needs explicit parsing rather than simply `bool(input())`.

---

# 🚨 105. Most Common Mistakes

### 1. `=` vs `==`

```python
x = 10       # assignment
x == 10      # comparison
```

---

### 2. `is` vs `==`

```text
== → equality
is → identity
```

---

### 3. `input()` is string

```python
age = input()
```

does not automatically create an integer.

Use:

```python
age = int(input())
```

---

### 4. `bool("False")`

```python
bool("False")
```

returns:

```text
True
```

because the string is non-empty.

---

### 5. `/` vs `//`

```text
/  → true division
// → floor division
```

---

### 6. Forgetting operator precedence

```python
2 + 3 * 4
```

is:

```text
14
```

not 20.

Use:

```python
(2 + 3) * 4
```

if you want 20.

---

# 🎯 106. Interview Questions

### Q1. What is an operator?

An operator is a symbol or keyword used to perform an operation on values or objects.

---

### Q2. Difference between `/` and `//`?

`/` performs true division and returns a floating-point result.

`//` performs floor division.

```python
10 / 3   # 3.333...
10 // 3  # 3
```

---

### Q3. What does `%` do?

It returns the remainder of a division.

```python
10 % 3
```

→ `1`.

---

### Q4. Difference between `=` and `==`?

```text
=  → assignment
== → equality comparison
```

---

### Q5. Difference between `==` and `is`?

```text
== → compare equality
is → compare object identity
```

---

### Q6. What are logical operators?

```text
and
or
not
```

They are used to combine or reverse Boolean conditions.

---

### Q7. What is short-circuit evaluation?

Python can stop evaluating a logical expression as soon as the final result is known.

Example:

```python
False and expensive_operation()
```

The second side does not need to execute.

---

### Q8. What are membership operators?

```text
in
not in
```

They check membership in an iterable/container.

---

### Q9. What are identity operators?

```text
is
is not
```

They test whether two references refer to the same object.

---

### Q10. What is operator precedence?

The priority that determines which operators are evaluated first.

---

### Q11. What is associativity?

The direction used when operators of equal precedence occur together.

---

### Q12. What does `input()` return?

Normally a `str`.

---

### Q13. What is `sep`?

`sep` specifies the separator between arguments passed to `print()`.

```python
print("A", "B", sep="-")
```

→

```text
A-B
```

---

### Q14. What is `end`?

`end` specifies what `print()` writes after its arguments. Its default is a newline.

---

### Q15. What are f-strings?

f-strings are formatted string literals that allow expressions inside `{}`.

```python
name = "Aamir"
print(f"Hello {name}")
```

---

# 🔥 107. Advanced Interview Questions

### Q16. Why is `2 ** 3 ** 2` equal to 512?

Because exponentiation is right-associative:

```python
2 ** (3 ** 2)
```

```text
3 ** 2 = 9
2 ** 9 = 512
```

---

### Q17. What is the result of:

```python
print(10 > 5 and 20 < 30)
```

Dry run:

```text
10 > 5   → True
20 < 30  → True

True and True
      ↓
    True
```

---

### Q18. What is:

```python
5 & 3
```

Binary:

```text
5 = 101
3 = 011

101
011
---
001
```

Answer:

```text
1
```

---

### Q19. What is:

```python
5 ^ 3
```

```text
101
011
---
110
```

Answer:

```text
6
```

---

### Q20. What is:

```python
~5
```

Use:

\[
\sim x=-(x+1)
\]

Therefore:

\[
\sim5=-6
\]

---

# 🏆 108. Final Revision Sheet

```text
ARITHMETIC
+  add
-  subtract
*  multiply
/  divide
// floor divide
%  remainder
** power

ASSIGNMENT
=   assign
+=  add
-=  subtract
*=  multiply
/=  divide
//= floor divide
%=  remainder
**= power

COMPARISON
== equal
!= not equal
>  greater
<  smaller
>= greater/equal
<= smaller/equal

LOGICAL
and → both
or  → at least one
not → reverse

IDENTITY
is
is not

MEMBERSHIP
in
not in

BITWISE
&   AND
|   OR
^   XOR
~   NOT
<<  left shift
>>  right shift

INPUT
input() → string

OUTPUT
print()
sep → separator
end → ending

FORMATTING
f"{variable}"
"{}".format(variable)

ESCAPE
\n → newline
\t → tab
\\ → backslash
\" → double quote
\' → single quote
```

# 🧠 109. Ultimate Chapter Mind Map

```text
                         🐍 CHAPTER 5
                   OPERATORS + INPUT/OUTPUT
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
    ⚙️ OPERATORS                                  🖥️ I/O
        │                                            │
 ┌──────┼───────┬────────┬────────┐          ┌──────┴──────┐
 ↓      ↓       ↓        ↓        ↓          ↓             ↓
Math   Assign Compare  Logical Identity   input()        print()
 │      │       │        │        │           │             │
+      =       ==      and       is          str          sep
-      +=      !=      or        is not       │            end
*      -=      >       not                    ↓             │
/      *=      <                           int/float        ↓
 //    /=      >=                                      Formatting
 %     //=     <=                                         │
 **    %=                                                ├── f-string
       **=                                               ├── format()
                                                        └── escape
                                                            chars

                       │
                       ↓
                PRECEDENCE
                       │
                       ↓
                 ASSOCIATIVITY
                       │
                       ↓
               CORRECT EXPRESSION
```

## ⭐ The most important mental model

> **Operators perform actions. Input brings data into your program. Output sends information from your program to the user. Precedence and associativity tell Python how to understand complicated expressions.**
