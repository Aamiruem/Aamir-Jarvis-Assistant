> **You asked:**
>
> - **Chapter 7: Strings**
>
>
>
>   **Topics**
>
>
>   - String      creation 
>   - Indexing      
>   - Positive      and negative indexing 
>   - Slicing      
>   - String      immutability 
>   - Traversing      strings 
>   - String      comparison 
>   - Concatenation      and repetition 
>   - Membership      testing 
>   - Unicode      
>
>
>   **Important methods**
>
>
>   - upper()      and lower() 
>   - title()      and capitalize() 
>   - strip(),      lstrip(), rstrip() 
>   - split()      and join() 
>   - find()      and index() 
>   - replace()      
>   - count()      
>   - startswith()      and endswith() 
>   - isalpha(),      isdigit(), isalnum() 
>   - partition()      
>
>
>   **Interview problems**
>
>
>   - Reverse      a string 
>   - Palindrome      
>   - Anagram      
>   - Character      frequency 
>   - First      non-repeating character 
>   - Longest      substring 
>   - Remove      duplicate characters 
>   - String      compression  Explain the chapter \<Topicwise> in detail.
>      Break down all concepts step by step in very simple language.
>      Include:
> - Clear definitions of each concept
> - Important formulas with parameter names explained
> - Real-world examples for each concept
> - Visualizations or diagrams to make it intuitive (use graphs and colorful notes)
> - Conceptual code examples (Python preferred) with dry run tables
> - Common mistakes and how to avoid them
> - Interview-style questions with answers for practice
>
> Make the explanation very conceptual, beginner-friendly, and structured like a study guide.
>
> Use graphs, colorful notes, and highlight formulas with parameter names for clarity.
>
> Provide complete Python code examples with dry run tables for understanding.
>
> colorful notes and diagram and difficult word explain to easy meaning explain all concept through diagram and color full Notes basics to advanced code and write every word very easy mean  mind map

# 🐍 Chapter 7: Strings — Complete Python Study Guide
### Basics → Intermediate → DSA/Interview Level

> 🟢 **String = text**
>
> A string is a sequence of characters such as `"Aamir"`, `"Python"`, `"Hello World"`, or `"12345"`.

---

# 🧠 1. Complete String Mind Map

```text
                         🐍 PYTHON STRINGS
                                │
        ┌───────────────────────┴────────────────────────┐
        │                                                │
   📘 FUNDAMENTALS                                  🛠 METHODS
        │                                                │
 ┌──────┼──────────────┐                    ┌────────────┼───────────┐
 │      │              │                    │            │           │
Create Indexing       Slicing            Case         Search      Validation
 │      │              │                    │            │           │
 │   + / - index      [start:stop:step]   upper()     find()      isalpha()
 │                                       lower()     index()     isdigit()
 │                                       title()                 isalnum()
 │                                       capitalize()
 │
 ├── Traversing
 ├── Comparison
 ├── Concatenation
 ├── Repetition
 ├── Membership
 ├── Unicode
 └── Immutability
                                │
                                ▼
                         🧠 INTERVIEW DSA
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
          Reverse            Palindrome          Anagram
             │                  │                  │
       Frequency          First non-repeat   Longest substring
             │                  │                  │
      Remove duplicates      Compression
```

---

# 2. What Is a String?

A **string** is an ordered collection of characters.

```python
name = "Aamir"
```

Here:

```text
A  a  m  i  r
↑  ↑  ↑  ↑  ↑
0  1  2  3  4
```

Each character has a position called an **index**.

### Difficult word → easy meaning

| Word | Easy meaning |
|---|---|
| String | Text |
| Character | One symbol/letter |
| Index | Position number |
| Sequence | Ordered collection |
| Immutable | Cannot change directly |
| Traverse | Visit one by one |
| Substring | Smaller part of a string |
| Unicode | Standard way of representing characters |

---

# 3. String Creation

You can create strings using:

### Single quotes

```python
name = 'Aamir'
```

### Double quotes

```python
name = "Aamir"
```

### Triple quotes

Useful for multiline text:

```python
message = """Hello
Welcome to Python
Let's learn strings."""
```

---

## 🔵 Strings can contain numbers

```python
x = "123"
```

This is a **string**, not an integer.

```python
print(type(x))
```

Output:

```text
<class 'str'>
```

Compare:

```python
x = "123"   # string
y = 123     # integer
```

---

# 4. Indexing

**Indexing = accessing one character using its position.**

Consider:

```python
text = "PYTHON"
```

Visualize it:

```text
Character:   P   Y   T   H   O   N
             ↓   ↓   ↓   ↓   ↓   ↓
Positive:    0   1   2   3   4   5
Negative:   -6  -5  -4  -3  -2  -1
```

---

## Positive indexing

```python
text = "PYTHON"

print(text[0])
print(text[3])
```

Output:

```text
P
H
```

### Dry run

| Expression | Index | Character |
|---|---:|---|
| `text[0]` | 0 | P |
| `text[3]` | 3 | H |

---

# 5. Negative Indexing

Negative indexing starts from the **right side**.

```text
P   Y   T   H   O   N
↓   ↓   ↓   ↓   ↓   ↓
-6 -5  -4  -3  -2  -1
```

Example:

```python
text = "PYTHON"

print(text[-1])
print(text[-2])
```

Output:

```text
N
O
```

### 🟡 Easy rule

```text
Positive → Left → Right
Negative → Right → Left
```

---

# 6. Slicing

**Slicing = taking a part of a string.**

Syntax:

```python
string[start:stop:step]
```

Important:

> `stop` is **not included**.

Example:

```python
text = "PYTHON"

print(text[1:4])
```

Output:

```text
YTH
```

Because:

```text
P Y T H O N
0 1 2 3 4 5
  └──────┘
  1  2  3
```

---

## Common slicing

```python
text = "PYTHON"

text[:3]      # PYT
text[2:]      # THON
text[:]       # PYTHON
text[::2]     # PTO
text[::-1]    # NOHTYP
```

---

# 7. The `start:stop:step` Formula

```text
text[start : stop : step]
```

| Part | Meaning |
|---|---|
| `start` | Where to begin |
| `stop` | Where to stop, excluded |
| `step` | How many positions to jump |

Example:

```python
text = "ABCDEFGHIJ"

print(text[1:8:2])
```

Indexes:

```text
A B C D E F G H I J
0 1 2 3 4 5 6 7 8 9
  ↑   ↑   ↑   ↑
  B   D   F   H
```

Output:

```text
BDFH
```

---

# 8. String Immutability ⭐

This is a very important Python interview concept.

**Immutable = cannot directly change an existing object.**

Example:

```python
name = "Aamir"

name[0] = "X"
```

This produces:

```text
TypeError
```

Why?

Because strings are immutable.

### ❌ Wrong idea

```text
"Aamir"
   ↓
change A → X
```

### ✅ Correct idea

Create a new string:

```python
name = "Aamir"

name = "X" + name[1:]

print(name)
```

Output:

```text
Xamir
```

### Visualization

```text
Original object
"Aamir"
   │
   │ cannot modify directly
   ❌
   │
   ▼
Create new string
"Xamir"
```

---

# 9. Traversing a String

**Traversing = visiting each character one by one.**

```python
text = "PYTHON"

for char in text:
    print(char)
```

Output:

```text
P
Y
T
H
O
N
```

### Flow

```text
"PYTHON"
   │
   ▼
   P
   ↓
   Y
   ↓
   T
   ↓
   H
   ↓
   O
   ↓
   N
```

---

## Traversing with index

```python
text = "PYTHON"

for i in range(len(text)):
    print(i, text[i])
```

Output:

```text
0 P
1 Y
2 T
3 H
4 O
5 N
```

---

# 10. String Comparison

Python compares strings lexicographically.

Simple meaning:

> It compares characters according to their Unicode values.

```python
print("apple" == "apple")
```

Output:

```text
True
```

```python
print("apple" == "Apple")
```

Output:

```text
False
```

Python strings are **case-sensitive**.

```text
"A" ≠ "a"
```

---

## Comparison operators

```python
==
!=
<
>
<=
>=
```

Example:

```python
print("apple" < "banana")
```

Output:

```text
True
```

---

# 11. Concatenation

**Concatenation = joining strings.**

Use `+`.

```python
first = "Aamir"
last = "Azad"

full = first + " " + last

print(full)
```

Output:

```text
Aamir Azad
```

### Diagram

```text
"Aamir" + " " + "Azad"
    │       │       │
    └───────┴───────┘
            ↓
      "Aamir Azad"
```

---

# 12. Repetition

Use `*`.

```python
print("Hi " * 3)
```

Output:

```text
Hi Hi Hi
```

Example:

```python
print("*" * 5)
```

Output:

```text
*****
```

This is very useful for pattern problems.

---

# 13. Membership Testing

Use:

```python
in
not in
```

Example:

```python
text = "python"

print("py" in text)
print("java" in text)
```

Output:

```text
True
False
```

### Real-world example

```python
email = "aamir@gmail.com"

if "@" in email:
    print("Looks like an email")
```

---

# 14. Unicode

Unicode is a worldwide standard for representing characters.

It supports:

```text
English → A
Hindi   → अ
Arabic  → ع
Chinese → 中
Emoji   → 😊
```

Python strings support Unicode naturally.

```python
name = "आमिर"

print(name)
```

You can inspect the code point:

```python
print(ord("A"))
```

Output:

```text
65
```

Convert a Unicode number back to a character:

```python
print(chr(65))
```

Output:

```text
A
```

### Important functions

```text
ord(character) → Unicode number
chr(number)    → character
```

---

# 🛠 PART B — IMPORTANT STRING METHODS

# 15. `upper()`

Converts letters to uppercase.

```python
text = "hello"

print(text.upper())
```

Output:

```text
HELLO
```

---

# 16. `lower()`

```python
text = "HELLO"

print(text.lower())
```

Output:

```text
hello
```

### Real-world use

Case-insensitive comparison:

```python
answer = input("Enter yes/no: ")

if answer.lower() == "yes":
    print("Accepted")
```

---

# 17. `title()`

Makes the first letter of each word uppercase.

```python
text = "hello world"

print(text.title())
```

Output:

```text
Hello World
```

---

# 18. `capitalize()`

Only the first character of the entire string becomes uppercase.

```python
text = "hello world"

print(text.capitalize())
```

Output:

```text
Hello world
```

### Difference

```text
title()       → Hello World
capitalize()  → Hello world
```

---

# 19. `strip()`

Removes whitespace from both ends.

```python
text = "   hello   "

print(text.strip())
```

Output:

```text
hello
```

It does **not** remove spaces inside the string.

```text
"  hello world  "
      ↓
"hello world"
```

---

# 20. `lstrip()` and `rstrip()`

### `lstrip()`

Removes whitespace from the left.

```python
"   hello   ".lstrip()
```

Result:

```text
"hello   "
```

### `rstrip()`

Removes whitespace from the right.

```python
"   hello   ".rstrip()
```

Result:

```text
"   hello"
```

---

# 21. `split()`

`split()` converts one string into a list.

```python
sentence = "I love Python"

words = sentence.split()

print(words)
```

Output:

```text
['I', 'love', 'Python']
```

### Diagram

```text
"I love Python"
       │
     split()
       ↓
["I", "love", "Python"]
```

---

## Split using delimiter

```python
data = "apple,banana,mango"

print(data.split(","))
```

Output:

```text
['apple', 'banana', 'mango']
```

---

# 22. `join()`

`join()` does almost the reverse of `split()`.

```python
words = ["I", "love", "Python"]

sentence = " ".join(words)

print(sentence)
```

Output:

```text
I love Python
```

### Diagram

```text
["I", "love", "Python"]
          │
       " ".join()
          ↓
"I love Python"
```

### Important

The object before `.join()` is the separator.

```python
"-".join(["2026", "08", "27"])
```

Output:

```text
2026-08-27
```

---

# 23. `find()`

Finds the first occurrence of a substring.

```python
text = "hello world"

print(text.find("world"))
```

Output:

```text
6
```

If not found:

```python
print(text.find("python"))
```

Output:

```text
-1
```

### 🟢 Remember

```text
find() → -1 if not found
```

---

# 24. `index()`

Similar to `find()`.

```python
text = "hello world"

print(text.index("world"))
```

Output:

```text
6
```

But if not found:

```python
text.index("python")
```

raises:

```text
ValueError
```

### Difference

| `find()` | `index()` |
|---|---|
| Returns position | Returns position |
| Not found → `-1` | Not found → `ValueError` |

---

# 25. `replace()`

Replaces one piece of text with another.

```python
text = "I love Java"

new_text = text.replace("Java", "Python")

print(new_text)
```

Output:

```text
I love Python
```

### Important

Because strings are immutable, `replace()` creates a **new string**.

---

# 26. `count()`

Counts occurrences.

```python
text = "banana"

print(text.count("a"))
```

Output:

```text
3
```

Example:

```python
text = "hello world"

print(text.count("l"))
```

Output:

```text
3
```

---

# 27. `startswith()`

Checks whether a string starts with something.

```python
url = "https://example.com"

print(url.startswith("https"))
```

Output:

```text
True
```

---

# 28. `endswith()`

```python
filename = "report.pdf"

print(filename.endswith(".pdf"))
```

Output:

```text
True
```

Real-world use:

```python
if filename.endswith(".csv"):
    print("CSV file")
```

---

# 29. `isalpha()`

Checks whether all characters are alphabetic.

```python
print("Python".isalpha())
```

Output:

```text
True
```

But:

```python
print("Python123".isalpha())
```

Output:

```text
False
```

---

# 30. `isdigit()`

Checks whether all characters are digits.

```python
print("12345".isdigit())
```

Output:

```text
True
```

```python
print("123a".isdigit())
```

Output:

```text
False
```

---

# 31. `isalnum()`

Means:

> Alphabet + number.

```python
print("Python123".isalnum())
```

Output:

```text
True
```

But:

```python
print("Python 123".isalnum())
```

Output:

```text
False
```

because the space is not alphanumeric.

---

# 32. `partition()`

`partition()` splits a string into **three parts**:

```text
before separator
separator
after separator
```

Example:

```python
email = "aamir@gmail.com"

print(email.partition("@"))
```

Output:

```text
('aamir', '@', 'gmail.com')
```

### Diagram

```text
aamir@gmail.com
     ↑
     @
     │
 ┌───┼───────────┐
 ↓   ↓           ↓
aamir @      gmail.com
```

---

# 📊 33. Important String Methods — Revision Table

| Method | Meaning | Example |
|---|---|---|
| `upper()` | uppercase | `"hi".upper()` |
| `lower()` | lowercase | `"HI".lower()` |
| `title()` | First letter of each word | `"hello world".title()` |
| `capitalize()` | First letter of string | `"hello".capitalize()` |
| `strip()` | Remove both-side spaces | `" hi ".strip()` |
| `lstrip()` | Remove left spaces | `" hi".lstrip()` |
| `rstrip()` | Remove right spaces | `"hi ".rstrip()` |
| `split()` | String → list | `"a b".split()` |
| `join()` | List → string | `" ".join(...)` |
| `find()` | Find position | `"abc".find("b")` |
| `index()` | Find position | `"abc".index("b")` |
| `replace()` | Replace text | `"cat".replace(...)` |
| `count()` | Count occurrence | `"banana".count("a")` |
| `startswith()` | Check beginning | `"hello".startswith("he")` |
| `endswith()` | Check ending | `"hello".endswith("lo")` |
| `isalpha()` | Only letters | `"abc".isalpha()` |
| `isdigit()` | Only digits | `"123".isdigit()` |
| `isalnum()` | Letters/numbers | `"abc123".isalnum()` |
| `partition()` | Split around separator | `"a-b".partition("-")` |

---

# 🧠 PART C — INTERVIEW PROBLEMS

# 34. Reverse a String

### Method 1 — Slicing

```python
text = "Python"

reverse = text[::-1]

print(reverse)
```

Output:

```text
nohtyP
```

### Visualization

```text
Python
  ↓
P y t h o n
            ↓
n o h t y P
```

---

## Method 2 — Loop

```python
text = "Python"
reverse = ""

for char in text:
    reverse = char + reverse

print(reverse)
```

Dry run:

| Character | `reverse` |
|---|---|
| P | P |
| y | yP |
| t | tyP |
| h | htyP |
| o | ohtyP |
| n | nohtyP |

### Complexity

\[
O(n)
\]

where `n` = length of the string.

---

# 35. Palindrome

A palindrome reads the same forward and backward.

Examples:

```text
madam
level
radar
```

### Diagram

```text
m a d a m
↓ ↓ ↓ ↓ ↓
m a d a m
```

### Code

```python
text = "madam"

if text == text[::-1]:
    print("Palindrome")
else:
    print("Not palindrome")
```

Output:

```text
Palindrome
```

### Complexity

\[
O(n)
\]

---

# 36. Anagram

Two strings are anagrams if they contain the **same characters with the same frequencies**, but possibly in a different order.

Example:

```text
listen
silent
```

Both contain:

```text
l, i, s, t, e, n
```

### Simple solution

```python
s1 = "listen"
s2 = "silent"

if sorted(s1) == sorted(s2):
    print("Anagram")
else:
    print("Not anagram")
```

Output:

```text
Anagram
```

### Diagram

```text
LISTEN
 ↓↓↓↓↓↓
EILNST

SILENT
 ↓↓↓↓↓↓
EILNST

       ↓
    SAME
       ↓
   ANAGRAM
```

### Complexity

Sorting gives approximately:

\[
O(n\log n)
\]

---

# 37. Better Anagram — Frequency Counting

We can count characters.

```python
from collections import Counter

s1 = "listen"
s2 = "silent"

if Counter(s1) == Counter(s2):
    print("Anagram")
else:
    print("Not anagram")
```

Conceptually:

```text
listen
 ↓
l:1
i:1
s:1
t:1
e:1
n:1
```

Same frequency map → anagram.

Average complexity:

\[
O(n)
\]

---

# 38. Character Frequency

Problem:

```text
Input: banana
Output:
b → 1
a → 3
n → 2
```

### Code

```python
text = "banana"

frequency = {}

for char in text:
    if char in frequency:
        frequency[char] += 1
    else:
        frequency[char] = 1

print(frequency)
```

Output:

```text
{'b': 1, 'a': 3, 'n': 2}
```

### Dry run

| Character | Dictionary |
|---|---|
| b | `{'b': 1}` |
| a | `{'b': 1, 'a': 1}` |
| n | `{'b': 1, 'a': 1, 'n': 1}` |
| a | `{'b': 1, 'a': 2, 'n': 1}` |
| n | `{'b': 1, 'a': 2, 'n': 2}` |
| a | `{'b': 1, 'a': 3, 'n': 2}` |

---

## Shorter solution

```python
from collections import Counter

text = "banana"

print(Counter(text))
```

---

# 39. First Non-Repeating Character

Example:

```text
aabbcde
```

Frequencies:

```text
a → 2
b → 2
c → 1
d → 1
e → 1
```

First character occurring once:

```text
c
```

### Code

```python
from collections import Counter

text = "aabbcde"

frequency = Counter(text)

for char in text:
    if frequency[char] == 1:
        print(char)
        break
```

Output:

```text
c
```

### Important idea

Two steps:

```text
Step 1 → Count characters
Step 2 → Traverse original string
```

This preserves the original order.

---

# 40. Remove Duplicate Characters

Input:

```text
banana
```

Expected:

```text
ban
```

### Code

```python
text = "banana"

result = ""

for char in text:
    if char not in result:
        result += char

print(result)
```

Output:

```text
ban
```

### Dry run

| Character | Result |
|---|---|
| b | b |
| a | ba |
| n | ban |
| a | ban |
| n | ban |
| a | ban |

### Better approach

```python
text = "banana"

seen = set()
result = []

for char in text:
    if char not in seen:
        seen.add(char)
        result.append(char)

print("".join(result))
```

This is generally more efficient for membership checking.

---

# 41. String Compression

Example:

```text
aaabbcccc
```

becomes:

```text
a3b2c4
```

### Code

```python
text = "aaabbcccc"

result = ""
count = 1

for i in range(1, len(text)):
    if text[i] == text[i - 1]:
        count += 1
    else:
        result += text[i - 1] + str(count)
        count = 1

result += text[-1] + str(count)

print(result)
```

Output:

```text
a3b2c4
```

### Dry run

| Current character | Count |
|---|---:|
| a | 1 |
| a | 2 |
| a | 3 |
| b | 1 → save `a3` |
| b | 2 |
| c | 1 → save `b2` |
| c | 2 |
| c | 3 |
| c | 4 |
| End | save `c4` |

---

# 42. Longest Substring ⭐

This is a common DSA interview problem.

### Problem

Find the longest substring without repeating characters.

Example:

```text
abcabcbb
```

Answer:

```text
abc
```

Length:

```text
3
```

---

## Concept: Sliding Window

Think of a window moving through the string.

```text
a b c a b c b b
└─────┘
 abc
```

When a duplicate appears, move the left side forward.

### Code

```python
def longest_unique_substring(text):
    seen = set()
    left = 0
    max_length = 0

    for right in range(len(text)):
        while text[right] in seen:
            seen.remove(text[left])
            left += 1

        seen.add(text[right])

        max_length = max(
            max_length,
            right - left + 1
        )

    return max_length


print(longest_unique_substring("abcabcbb"))
```

Output:

```text
3
```

---

## Dry run

For:

```text
abcabcbb
```

| Right | Character | Window | Max |
|---:|---|---|---:|
| 0 | a | `a` | 1 |
| 1 | b | `ab` | 2 |
| 2 | c | `abc` | 3 |
| 3 | a | `bca` | 3 |
| 4 | b | `cab` | 3 |
| 5 | c | `abc` | 3 |
| 6 | b | `cb` | 3 |
| 7 | b | `b` | 3 |

### Formula

Window length:

\[
length = right - left + 1
\]

where:

- `right` = right boundary
- `left` = left boundary

### Complexity

\[
O(n)
\]

Average set operations are approximately constant time.

---

# 🎨 43. String Problem Patterns

Most string interview questions can be recognized using these patterns:

```text
                 STRING PROBLEMS
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   Frequency        Two Pointers    Sliding Window
       │               │                │
   Anagram          Palindrome      Longest substring
   Counting         Reverse         Minimum window
   First unique
       │
    Hash Map
```

### 🟢 Frequency pattern

Use:

```python
dict
Counter
```

For:

- Anagram
- Frequency
- First unique
- Duplicate detection

---

### 🔵 Two-pointer pattern

Use two positions:

```text
left →             ← right
```

Useful for:

- Palindrome
- Reverse
- Comparing from both ends

---

### 🟣 Sliding window

Use:

```text
left → [ window ] ← right
```

Useful for:

- Longest substring
- Smallest substring
- Character frequency within a window

---

# ⚠️ 44. Common String Mistakes

## Mistake 1 — Trying to modify a string

❌

```python
text = "hello"
text[0] = "H"
```

✅

```python
text = "H" + text[1:]
```

---

## Mistake 2 — Forgetting that slicing excludes stop

```python
text = "Python"

print(text[0:3])
```

Output:

```text
Pyt
```

Not:

```text
Pyth
```

---

## Mistake 3 — Confusing `find()` and `index()`

```text
find()  → -1
index() → ValueError
```

when the substring doesn't exist.

---

## Mistake 4 — `split()` and `join()` direction

Remember:

```text
split → String → List
join  → List → String
```

---

## Mistake 5 — Case sensitivity

```python
"Python" == "python"
```

is:

```text
False
```

For case-insensitive comparison:

```python
"Python".lower() == "python".lower()
```

---

## Mistake 6 — Forgetting strings can contain digits

```python
"123".isdigit()
```

is `True`, but:

```python
type("123")
```

is:

```text
str
```

---

# 🧪 45. Complete Practice Program

Let's build a small **Text Analyzer** using many concepts.

```python
text = input("Enter text: ")

# Clean text
text = text.strip()

# Convert to lowercase
clean_text = text.lower()

# Number of characters
length = len(clean_text)

# Count vowels
vowels = "aeiou"
vowel_count = 0

for char in clean_text:
    if char in vowels:
        vowel_count += 1

# Count words
words = clean_text.split()

print("\n--- Text Analysis ---")
print("Original:", text)
print("Length:", length)
print("Words:", len(words))
print("Vowels:", vowel_count)
print("Reversed:", clean_text[::-1])

if clean_text == clean_text[::-1]:
    print("Palindrome: Yes")
else:
    print("Palindrome: No")
```

### Concepts used

```text
input()
strip()
lower()
len()
for
if
in
split()
[::-1]
comparison
```

This is exactly the kind of combination you should practice before moving into DSA.

---

# 📌 46. String Complexity Cheat Sheet

For a string of length `n`:

| Operation | Typical complexity |
|---|---:|
| Indexing `s[i]` | O(1) |
| `len(s)` | O(1) |
| Traversing | O(n) |
| `find()` | O(n) |
| `count()` | O(n) |
| `replace()` | O(n) |
| `lower()` | O(n) |
| `upper()` | O(n) |
| Reverse using slicing | O(n) |
| Sorting | O(n log n) |
| Character frequency with hash map | O(n) |
| Longest unique substring with sliding window | O(n) |

> 🟡 **Important:** Exact complexity can depend on the operation, implementation, and input characteristics, but these are the standard interview-level expectations.

---

# 🎯 47. Interview Questions

### Q1. What is a string?

A string is an immutable sequence of Unicode characters used to represent text.

---

### Q2. Are Python strings mutable?

**No.** Python strings are immutable.

---

### Q3. What is the difference between indexing and slicing?

**Indexing** retrieves one character.

```python
s[2]
```

**Slicing** retrieves a portion.

```python
s[1:4]
```

---

### Q4. What does `[::-1]` do?

It reverses a sequence.

```python
"Python"[::-1]
```

→

```text
nohtyP
```

---

### Q5. Difference between `find()` and `index()`?

`find()` returns `-1` if the substring isn't found.

`index()` raises `ValueError`.

---

### Q6. Difference between `split()` and `join()`?

```text
split → String → List
join  → List → String
```

---

### Q7. What is Unicode?

Unicode is a standard for representing characters from many writing systems and symbols.

---

### Q8. How do you check whether a string is a palindrome?

```python
s == s[::-1]
```

---

### Q9. How do you check two strings are anagrams?

Simple approach:

```python
sorted(s1) == sorted(s2)
```

Or frequency-based:

```python
Counter(s1) == Counter(s2)
```

---

### Q10. How do you find character frequency?

```python
from collections import Counter

Counter("banana")
```

---

### Q11. How do you find the first non-repeating character?

Count all characters first, then traverse the original string and find the first character whose count is `1`.

---

### Q12. What is a substring?

A substring is a **continuous part of a string**.

For:

```text
"hello"
```

Examples:

```text
"hel"
"ell"
"llo"
```

But:

```text
"hlo"
```

is not a substring because its characters are not continuous.

---

### Q13. What is the difference between substring and subsequence?

**Substring:**

Characters must be continuous.

```text
abcde
 ↓↓↓
bcd
```

**Subsequence:**

Characters don't need to be continuous, but their order must remain.

```text
abcde
 ↓ ↓
ace
```

---

# 🧠 48. Difficult Words → Very Easy Meaning

| Difficult | Easy |
|---|---|
| Immutable | Cannot change directly |
| Mutable | Can change |
| Character | One letter/symbol |
| Index | Position |
| Slice | Take a part |
| Traverse | Visit one by one |
| Substring | Continuous part |
| Subsequence | Ordered part, gaps allowed |
| Frequency | How many times |
| Anagram | Same letters, different order |
| Palindrome | Same forward/backward |
| Lexicographical | Dictionary-like comparison |
| Unicode | Global character numbering system |
| Delimiter | Separator |
| Iteration | One loop round |
| Complexity | How much time/memory an algorithm needs |

---

# 🗺️ 49. Final String Mind Map

```text
                         🐍 STRING
                            │
       ┌────────────────────┼─────────────────────┐
       │                    │                     │
   FUNDAMENTALS            METHODS              DSA
       │                    │                     │
       ├─ Creation          ├─ upper()           ├─ Reverse
       ├─ Indexing           ├─ lower()           ├─ Palindrome
       ├─ Negative index     ├─ title()           ├─ Anagram
       ├─ Slicing            ├─ capitalize()      ├─ Frequency
       ├─ Immutability       ├─ strip()           ├─ First unique
       ├─ Traversal          ├─ split()            ├─ Longest substring
       ├─ Comparison         ├─ join()             ├─ Remove duplicates
       ├─ Concatenation      ├─ find()             └─ Compression
       ├─ Repetition         ├─ index()
       ├─ Membership         ├─ replace()
       └─ Unicode            ├─ count()
                            ├─ startswith()
                            ├─ endswith()
                            ├─ isalpha()
                            ├─ isdigit()
                            ├─ isalnum()
                            └─ partition()
```

# ⭐ 50. What You Must Remember

```text
STRING
  │
  ├── Index → one character
  │
  ├── Slice → part of string
  │
  ├── Immutable → cannot change directly
  │
  ├── + → concatenate
  │
  ├── * → repeat
  │
  ├── in → membership
  │
  ├── split() → String → List
  │
  ├── join() → List → String
  │
  ├── find() → -1 if absent
  │
  ├── index() → error if absent
  │
  ├── Counter → frequency
  │
  ├── [::-1] → reverse
  │
  ├── Two pointers → palindrome
  │
  ├── Hash map → frequency/anagram
  │
  └── Sliding window → longest substring
```

## 🔥 Interview Formula Sheet

\[
\boxed{\text{Slice} = s[start:stop:step]}
\]

\[
\boxed{\text{Window Length} = right-left+1}
\]

\[
\boxed{\text{Palindrome} = s == reverse(s)}
\]

\[
\boxed{\text{Anagram} = frequency(s_1)==frequency(s_2)}
\]

\[
\boxed{\text{Fibonacci: }F_n=F_{n-1}+F_{n-2}}
\]

The **most important progression** is:

```text
String basics
     ↓
Indexing + slicing
     ↓
Loops + conditions
     ↓
String methods
     ↓
Frequency counting
     ↓
Two pointers
     ↓
Sliding window
     ↓
String DSA problems
```

Mastering that progression will prepare you for the string portion of **DSA and Python interviews**.
