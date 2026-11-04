> **You asked:**
>
> Module 16: Association Rule Learning
> Apriori
> Eclat
> FP Growth

I’ll explain Association Rule Learning from market-basket logic: support, confidence, lift, then Apriori, Eclat, FP-Growth, code, comparison, projects, and interview answers.

# Phase 7: Unsupervised Learning  
# Module 16: Association Rule Learning

Association Rule Learning is an **unsupervised machine learning technique** used to find relationships between items.

Simple meaning:

```text
Association Rule Learning = Find which items are bought/used together
```

Most common example:

```text
If customer buys Bread and Butter,
then customer may also buy Milk.
```

Rule format:

```text
Bread + Butter → Milk
```

This is mostly used in **market basket analysis**.

---

# 1. What is Association Rule Learning?

## Easy Definition

Association Rule Learning finds hidden patterns between items in large transaction data.

Example transaction data:

| Transaction ID | Items |
|---|---|
| T1 | Bread, Milk |
| T2 | Bread, Butter, Milk |
| T3 | Bread, Butter |
| T4 | Milk, Butter |
| T5 | Bread, Milk, Butter |

Association rule can be:

```text
Bread → Milk
```

Meaning:

```text
Customers who buy Bread often buy Milk also.
```

---

## Where It Is Used?

```text
Retail stores
E-commerce recommendation
Amazon product recommendation
Grocery basket analysis
Movie recommendation
Medicine combination analysis
Website click pattern analysis
Fraud pattern detection
```

## Interview Answer

Association Rule Learning is an unsupervised learning technique used to find relationships between items in transactional data. It is commonly used in market basket analysis.

---

# 2. Important Terms

Before Apriori, Eclat, and FP-Growth, you must understand:

```text
Support
Confidence
Lift
Frequent Itemset
Association Rule
```

---

# 3. Itemset

## Easy Definition

Itemset means a group of items.

Examples:

```text
{Bread}
{Bread, Milk}
{Bread, Butter, Milk}
```

## Types

| Type | Example |
|---|---|
| 1-itemset | `{Bread}` |
| 2-itemset | `{Bread, Milk}` |
| 3-itemset | `{Bread, Milk, Butter}` |

---

# 4. Frequent Itemset

## Easy Definition

Frequent itemset means items that appear frequently in transactions.

Example:

If `{Bread, Milk}` appears many times, then it is a frequent itemset.

---

# 5. Support

## Easy Definition

Support tells how frequently an item or itemset appears in all transactions.

Formula:

```text
Support(A) = Transactions containing A / Total transactions
```

Example:

| Transaction | Items |
|---|---|
| T1 | Bread, Milk |
| T2 | Bread, Butter, Milk |
| T3 | Bread, Butter |
| T4 | Milk, Butter |
| T5 | Bread, Milk, Butter |

Total transactions:

```text
5
```

Transactions containing Bread:

```text
T1, T2, T3, T5 = 4
```

Support of Bread:

```text
Support(Bread) = 4 / 5 = 0.8
```

So Bread appears in 80% transactions.

---

## Support of Bread and Milk

Transactions containing both Bread and Milk:

```text
T1, T2, T5 = 3
```

```text
Support(Bread, Milk) = 3 / 5 = 0.6
```

## Interview Answer

Support measures how frequently an itemset appears in the dataset.

---

# 6. Confidence

## Easy Definition

Confidence tells how often item B is bought when item A is bought.

Rule:

```text
A → B
```

Formula:

```text
Confidence(A → B) = Support(A and B) / Support(A)
```

Example rule:

```text
Bread → Milk
```

Support:

```text
Support(Bread, Milk) = 3/5 = 0.6
Support(Bread) = 4/5 = 0.8
```

Confidence:

```text
Confidence(Bread → Milk) = 0.6 / 0.8
Confidence = 0.75
```

Meaning:

```text
75% of customers who bought Bread also bought Milk.
```

## Interview Answer

Confidence measures the probability of buying item B when item A is already bought.

---

# 7. Lift

## Easy Definition

Lift tells whether the relationship between two items is actually strong or just happening by chance.

Formula:

```text
Lift(A → B) = Confidence(A → B) / Support(B)
```

Or:

```text
Lift(A → B) = Support(A and B) / [Support(A) × Support(B)]
```

---

## Lift Interpretation

| Lift Value | Meaning |
|---:|---|
| Lift > 1 | Positive relationship |
| Lift = 1 | No relationship |
| Lift < 1 | Negative relationship |

Example:

```text
Lift = 2
```

Meaning:

```text
Buying A increases the chance of buying B by 2 times.
```

## Interview Answer

Lift measures the strength of an association rule. If lift is greater than 1, the rule is useful and shows positive association.

---

# 8. Association Rule Format

Association rule is written as:

```text
Antecedent → Consequent
```

Example:

```text
Bread → Milk
```

Where:

```text
Bread = Antecedent / Left-hand side
Milk = Consequent / Right-hand side
```

Another example:

```text
Bread + Butter → Milk
```

Meaning:

```text
If a customer buys Bread and Butter, they may also buy Milk.
```

---

# 9. Apriori Algorithm

## Easy Definition

Apriori is an association rule learning algorithm used to find frequent itemsets.

Simple meaning:

```text
Apriori finds items that appear together frequently.
```

---

## Main Idea of Apriori

Apriori uses this rule:

```text
If an itemset is frequent, then all its subsets must also be frequent.
```

Example:

If:

```text
{Bread, Milk, Butter}
```

is frequent, then these should also be frequent:

```text
{Bread}
{Milk}
{Butter}
{Bread, Milk}
{Bread, Butter}
{Milk, Butter}
```

---

## How Apriori Works

```text
1. Find frequent 1-itemsets.
2. Use them to create 2-itemsets.
3. Remove itemsets below minimum support.
4. Use frequent 2-itemsets to create 3-itemsets.
5. Repeat until no more frequent itemsets.
6. Generate association rules using confidence and lift.
```

---

## Apriori Example

Transactions:

```text
T1: Bread, Milk
T2: Bread, Butter, Milk
T3: Bread, Butter
T4: Milk, Butter
T5: Bread, Milk, Butter
```

Minimum support:

```text
0.6
```

### Step 1: Count 1-itemsets

| Item | Count | Support |
|---|---:|---:|
| Bread | 4 | 0.8 |
| Milk | 4 | 0.8 |
| Butter | 4 | 0.8 |

All are frequent.

---

### Step 2: Count 2-itemsets

| Itemset | Count | Support |
|---|---:|---:|
| Bread, Milk | 3 | 0.6 |
| Bread, Butter | 3 | 0.6 |
| Milk, Butter | 3 | 0.6 |

All are frequent.

---

### Step 3: Count 3-itemset

| Itemset | Count | Support |
|---|---:|---:|
| Bread, Milk, Butter | 2 | 0.4 |

This is not frequent because:

```text
0.4 < 0.6
```

So Apriori stops.

---

## Apriori Code

Install library:

```bash
pip install mlxtend
```

Code:

```python
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, association_rules

# Transaction data
transactions = [
    ["Bread", "Milk"],
    ["Bread", "Butter", "Milk"],
    ["Bread", "Butter"],
    ["Milk", "Butter"],
    ["Bread", "Milk", "Butter"]
]

# Convert transaction data into one-hot encoded DataFrame
te = TransactionEncoder()
te_array = te.fit(transactions).transform(transactions)

df = pd.DataFrame(te_array, columns=te.columns_)

print("One-Hot Encoded Data:")
print(df)

# Apply Apriori
frequent_itemsets = apriori(
    df,
    min_support=0.6,
    use_colnames=True
)

print("\nFrequent Itemsets:")
print(frequent_itemsets)

# Generate association rules
rules = association_rules(
    frequent_itemsets,
    metric="confidence",
    min_threshold=0.7
)

print("\nAssociation Rules:")
print(rules[["antecedents", "consequents", "support", "confidence", "lift"]])
```

---

## Output Meaning

Example output:

```text
Bread → Milk
Confidence = 0.75
Lift = 0.9375
```

Meaning:

```text
75% of customers who bought Bread also bought Milk.
But lift is less than 1, so the rule is not very strong.
```

---

## Advantages of Apriori

```text
Easy to understand
Good for small and medium datasets
Generates clear association rules
Useful for market basket analysis
```

## Limitations of Apriori

```text
Can be slow on large datasets
Generates many candidate itemsets
Needs multiple database scans
Performance decreases with many items
```

## When to Use Apriori?

Use Apriori when:

```text
Dataset is small or medium
You want simple association rules
You want easy interpretation
Number of unique items is not very large
```

## Interview Answer

Apriori is an association rule learning algorithm that finds frequent itemsets using support, confidence, and lift. It works by generating candidate itemsets and pruning those below minimum support.

---

# 10. Eclat Algorithm

## Easy Definition

Eclat stands for **Equivalence Class Clustering and bottom-up Lattice Traversal**.

Simple meaning:

```text
Eclat finds frequent itemsets using transaction IDs.
```

Unlike Apriori, Eclat uses a vertical data format.

---

## Horizontal vs Vertical Format

### Apriori uses horizontal format:

| Transaction | Items |
|---|---|
| T1 | Bread, Milk |
| T2 | Bread, Butter |
| T3 | Milk, Butter |

### Eclat uses vertical format:

| Item | Transaction IDs |
|---|---|
| Bread | T1, T2 |
| Milk | T1, T3 |
| Butter | T2, T3 |

---

## Main Idea of Eclat

Eclat finds common transactions by intersecting transaction ID sets.

Example:

```text
Bread appears in: T1, T2, T5
Milk appears in:  T1, T4, T5
```

Intersection:

```text
Bread ∩ Milk = T1, T5
```

So:

```text
Support(Bread, Milk) = 2 transactions
```

---

## How Eclat Works

```text
1. Convert transactions into vertical format.
2. Store transaction IDs for each item.
3. Intersect transaction ID sets to find itemset support.
4. Keep itemsets above minimum support.
5. Generate frequent itemsets.
```

---

## Eclat Code from Scratch

```python
transactions = {
    "T1": {"Bread", "Milk"},
    "T2": {"Bread", "Butter", "Milk"},
    "T3": {"Bread", "Butter"},
    "T4": {"Milk", "Butter"},
    "T5": {"Bread", "Milk", "Butter"}
}

min_support_count = 3

# Step 1: Create vertical format
vertical_data = {}

for tid, items in transactions.items():
    for item in items:
        if item not in vertical_data:
            vertical_data[item] = set()
        vertical_data[item].add(tid)

print("Vertical Data:")
print(vertical_data)

# Step 2: Find frequent 1-itemsets
frequent_itemsets = {}

for item, tids in vertical_data.items():
    if len(tids) >= min_support_count:
        frequent_itemsets[frozenset([item])] = tids

print("\nFrequent 1-itemsets:")
for itemset, tids in frequent_itemsets.items():
    print(set(itemset), "Support Count:", len(tids))

# Step 3: Generate 2-itemsets using intersection
items = list(frequent_itemsets.keys())

print("\nFrequent 2-itemsets:")
for i in range(len(items)):
    for j in range(i + 1, len(items)):
        itemset1 = items[i]
        itemset2 = items[j]

        combined_itemset = itemset1.union(itemset2)
        combined_tids = frequent_itemsets[itemset1].intersection(
            frequent_itemsets[itemset2]
        )

        if len(combined_tids) >= min_support_count:
            print(set(combined_itemset), "Support Count:", len(combined_tids))
```

---

## Advantages of Eclat

```text
Faster than Apriori in many cases
Uses transaction ID intersection
Does not generate as many candidates as Apriori
Good for frequent itemset mining
```

## Limitations of Eclat

```text
Can use more memory
Not ideal for extremely large transaction ID sets
Less commonly available in basic ML libraries
```

## When to Use Eclat?

Use Eclat when:

```text
You want faster frequent itemset mining
Dataset can fit in memory
You want to use vertical transaction format
```

## Interview Answer

Eclat is an association rule learning algorithm that uses vertical data format. It finds frequent itemsets by intersecting transaction ID sets.

---

# 11. FP-Growth Algorithm

## Easy Definition

FP-Growth stands for **Frequent Pattern Growth**.

Simple meaning:

```text
FP-Growth finds frequent itemsets without generating many candidates.
```

It is faster than Apriori for large datasets.

---

## Main Idea

FP-Growth compresses transaction data into a tree structure called an **FP-Tree**.

```text
FP-Tree = Frequent Pattern Tree
```

Then it mines frequent patterns from the tree.

---

## How FP-Growth Works

```text
1. Scan dataset and find frequent items.
2. Sort items by frequency.
3. Build FP-Tree.
4. Mine frequent patterns from FP-Tree.
5. Generate association rules.
```

---

## Why FP-Growth is Faster Than Apriori?

Apriori generates many candidate itemsets.

Example:

```text
Candidate 1-itemsets
Candidate 2-itemsets
Candidate 3-itemsets
Candidate 4-itemsets
...
```

FP-Growth avoids large candidate generation by using FP-Tree.

---

## FP-Growth Code

```python
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import fpgrowth, association_rules

transactions = [
    ["Bread", "Milk"],
    ["Bread", "Butter", "Milk"],
    ["Bread", "Butter"],
    ["Milk", "Butter"],
    ["Bread", "Milk", "Butter"]
]

# One-hot encoding
te = TransactionEncoder()
te_array = te.fit(transactions).transform(transactions)

df = pd.DataFrame(te_array, columns=te.columns_)

# Apply FP-Growth
frequent_itemsets = fpgrowth(
    df,
    min_support=0.6,
    use_colnames=True
)

print("Frequent Itemsets:")
print(frequent_itemsets)

# Generate rules
rules = association_rules(
    frequent_itemsets,
    metric="confidence",
    min_threshold=0.7
)

print("\nAssociation Rules:")
print(rules[["antecedents", "consequents", "support", "confidence", "lift"]])
```

---

## Advantages of FP-Growth

```text
Faster than Apriori
Does not generate many candidates
Works well on large datasets
Uses compressed FP-Tree structure
```

## Limitations of FP-Growth

```text
FP-Tree can be complex to understand
Can use memory for very large data
Implementation is more complex than Apriori
```

## When to Use FP-Growth?

Use FP-Growth when:

```text
Dataset is large
Apriori is slow
You want efficient frequent itemset mining
There are many transactions and items
```

## Interview Answer

FP-Growth is an association rule learning algorithm that finds frequent itemsets using an FP-Tree structure. It is faster than Apriori because it avoids generating many candidate itemsets.

---

# 12. Apriori vs Eclat vs FP-Growth

| Algorithm | Main Idea | Data Format | Speed | Best For |
|---|---|---|---|---|
| Apriori | Candidate generation | Horizontal | Slower | Small/medium datasets |
| Eclat | Transaction ID intersection | Vertical | Faster than Apriori | Frequent itemset mining |
| FP-Growth | FP-Tree pattern mining | Tree-based | Fast | Large datasets |

---

# 13. Support vs Confidence vs Lift

| Metric | Meaning | Formula |
|---|---|---|
| Support | How often itemset appears | `Transactions with A / Total transactions` |
| Confidence | How often B occurs when A occurs | `Support(A,B) / Support(A)` |
| Lift | Strength of rule | `Confidence(A→B) / Support(B)` |

---

# 14. Complete Association Rule Code

```python
import pandas as pd

from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules

# Transaction data
transactions = [
    ["Milk", "Bread", "Butter"],
    ["Bread", "Butter"],
    ["Milk", "Bread"],
    ["Milk", "Butter"],
    ["Bread", "Milk", "Butter"],
    ["Bread", "Eggs"],
    ["Milk", "Eggs"],
    ["Bread", "Milk", "Eggs"]
]

# Convert transactions into one-hot encoded DataFrame
te = TransactionEncoder()
te_array = te.fit(transactions).transform(transactions)

df = pd.DataFrame(te_array, columns=te.columns_)

print("Transaction Data:")
print(df)

# -----------------------------
# 1. Apriori
# -----------------------------
apriori_itemsets = apriori(
    df,
    min_support=0.3,
    use_colnames=True
)

apriori_rules = association_rules(
    apriori_itemsets,
    metric="confidence",
    min_threshold=0.6
)

print("\nApriori Frequent Itemsets:")
print(apriori_itemsets)

print("\nApriori Rules:")
print(apriori_rules[["antecedents", "consequents", "support", "confidence", "lift"]])

# -----------------------------
# 2. FP-Growth
# -----------------------------
fp_itemsets = fpgrowth(
    df,
    min_support=0.3,
    use_colnames=True
)

fp_rules = association_rules(
    fp_itemsets,
    metric="confidence",
    min_threshold=0.6
)

print("\nFP-Growth Frequent Itemsets:")
print(fp_itemsets)

print("\nFP-Growth Rules:")
print(fp_rules[["antecedents", "consequents", "support", "confidence", "lift"]])
```

---

# 15. How to Read Association Rules

Suppose output rule is:

```text
Bread → Milk
Support = 0.50
Confidence = 0.80
Lift = 1.20
```

Meaning:

```text
Support = Bread and Milk appear together in 50% transactions.

Confidence = 80% customers who bought Bread also bought Milk.

Lift = Customers who bought Bread are 1.2 times more likely to buy Milk compared to normal chance.
```

---

# 16. Real Project: Market Basket Analysis

## Project Name

```text
Market Basket Analysis using Apriori and FP-Growth
```

## Problem Statement

Find product combinations frequently bought together and generate recommendations.

---

## Dataset Example

| Transaction ID | Items |
|---|---|
| T1 | Milk, Bread, Butter |
| T2 | Bread, Butter |
| T3 | Milk, Bread |
| T4 | Milk, Butter |
| T5 | Bread, Milk, Butter |

---

## Project Steps

```text
1. Import transaction dataset.
2. Convert transactions into list format.
3. Apply one-hot encoding.
4. Apply Apriori or FP-Growth.
5. Generate frequent itemsets.
6. Generate association rules.
7. Filter rules using support, confidence, and lift.
8. Recommend products based on strong rules.
```

---

## Business Insights Example

```text
Rule: Bread → Milk
Confidence: 80%
Lift: 1.2
```

Insight:

```text
Customers who buy Bread are likely to buy Milk also.
Store can place Bread and Milk nearby or create combo offers.
```

Another insight:

```text
Rule: Butter + Bread → Milk
```

Business use:

```text
Give discount on Milk when customer buys Bread and Butter.
```

---

# 17. How to Explain This Project in Interview

```text
I built a Market Basket Analysis project using Association Rule Learning.

The goal was to find which products are frequently bought together.

First, I converted transaction data into one-hot encoded format. Then I used Apriori and FP-Growth algorithms to find frequent itemsets. After that, I generated association rules using support, confidence, and lift.

I used lift to identify strong rules. For example, if Bread → Milk has high confidence and lift greater than 1, then customers buying Bread are more likely to buy Milk. This insight can help businesses create combo offers, product placement strategies, and recommendation systems.
```

---

# 18. Most Asked Interview Questions

## Q1. What is Association Rule Learning?

Association Rule Learning is an unsupervised learning technique used to find relationships between items in transaction data.

---

## Q2. What is Market Basket Analysis?

Market Basket Analysis is a technique used to find products that are frequently bought together.

---

## Q3. What is support?

Support tells how frequently an itemset appears in all transactions.

```text
Support(A) = Transactions containing A / Total transactions
```

---

## Q4. What is confidence?

Confidence tells how often item B is bought when item A is bought.

```text
Confidence(A → B) = Support(A,B) / Support(A)
```

---

## Q5. What is lift?

Lift tells the strength of an association rule.

```text
Lift > 1 means positive association.
Lift = 1 means no association.
Lift < 1 means negative association.
```

---

## Q6. What is Apriori?

Apriori is an association rule learning algorithm that finds frequent itemsets using candidate generation and minimum support pruning.

---

## Q7. What is Eclat?

Eclat is an association rule algorithm that uses vertical transaction ID format and finds frequent itemsets using set intersection.

---

## Q8. What is FP-Growth?

FP-Growth is an efficient association rule algorithm that uses an FP-Tree to find frequent itemsets without generating many candidates.

---

## Q9. Apriori vs FP-Growth?

| Apriori | FP-Growth |
|---|---|
| Generates candidates | Avoids large candidate generation |
| Slower on large data | Faster on large data |
| Easier to understand | More complex |
| Good for small data | Good for large data |

---

## Q10. Apriori vs Eclat?

| Apriori | Eclat |
|---|---|
| Horizontal data format | Vertical data format |
| Candidate generation | Transaction ID intersection |
| More database scans | Fewer scans |
| Easier to implement | Faster in many cases |

---

## Q11. Why is lift important?

Confidence alone can be misleading. Lift tells whether the rule is actually stronger than random chance.

---

## Q12. What is a frequent itemset?

A frequent itemset is a group of items that appears frequently in transactions according to minimum support.

---

# 19. Final Summary

```text
Association Rule Learning is used to find relationships between items in transaction data.

Support tells how frequently an itemset appears.

Confidence tells how often the consequent appears when the antecedent appears.

Lift tells the actual strength of the rule.

Apriori finds frequent itemsets using candidate generation and pruning.

Eclat uses vertical transaction ID format and set intersection.

FP-Growth uses an FP-Tree and is faster than Apriori for large datasets.

Association Rule Learning is commonly used in market basket analysis, product recommendation, combo offers, and customer buying pattern analysis.
```

## Final Interview Summary

```text
Association Rule Learning is an unsupervised learning technique used to discover hidden relationships between items.

I use support to find frequent itemsets, confidence to measure rule reliability, and lift to measure rule strength.

Apriori is simple and uses candidate generation. Eclat uses vertical transaction ID intersection. FP-Growth uses an FP-Tree and is faster for large datasets.

A common project is Market Basket Analysis, where we find products frequently bought together and use those insights for recommendations, offers, and product placement.
```
