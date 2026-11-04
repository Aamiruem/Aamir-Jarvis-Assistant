> **You asked:**
>
> ## Chapter 3: AI Problem-Solving Techniques
>
> -  Problem formulation 
> -  State-space representation 
> -  Initial and goal states 
> -  Operators and actions 
> -  Search trees and search graphs 
> -  Breadth-First Search 
> -  Depth-First Search 
> -  Uniform-Cost Search 
> -  Depth-Limited Search 
> -  Iterative Deepening 
> -  Bidirectional Search 
> -  Greedy Best-First Search 
> -  A\* search 
> -  Heuristic functions 
> -  Hill climbing 
> -  Beam search 
> -  Constraint satisfaction problems 
> -  Minimax algorithm 
> -  Alpha-beta pruning      Explain the chapter <chapter name/topic> in detail.  
>   Break down all concepts step by step in very simple language.  
>   Include: 
>   - Clear definitions of each concept 
>   - Important formulas with parameter names explained 
>   - Real-world examples for each concept 
>   - Visualizations or diagrams to make it intuitive 
>   - Conceptual code examples (Python preferred) with dry run tables 
>   - Common mistakes and how to avoid them 
>   - Interview-style questions with answers for practice 
>   Make the explanation very conceptual, beginner-friendly, and structured like a study guide. 
>   more and understand through the graph

# Chapter 3: AI Problem-Solving Techniques  
## Search Algorithms, Heuristics, CSP, Minimax and Alpha-Beta Pruning

This chapter explains **how an AI system searches through possible choices to find a solution**.

A useful way to understand the entire chapter is:

```text
                         AI PROBLEM
                            │
                            ▼
                    Problem Formulation
                            │
                            ▼
                       State Space
                            │
                  ┌─────────┴─────────┐
                  │                   │
             Search Problem        Game/CSP
                  │                   │
          ┌───────┴────────┐     ┌────┴─────┐
          │                │     │          │
     Uninformed        Informed  CSP      Games
       Search           Search    │          │
          │                │      │          │
   BFS / DFS / UCS      Greedy    │       Minimax
   DLS / IDS /         A*         │       Alpha-Beta
   Bidirectional      Hill Climb   │
                     Beam Search   │
                                   ▼
                               Solution
```

The central idea is:

> **A problem is represented as states connected by actions. Search algorithms explore those states until they find a goal.**

---

# 1. Problem Formulation

## Definition

**Problem formulation** means converting a real-world problem into a form that an AI algorithm can solve.

Before searching, the AI must know:

1. Where am I now?
2. What actions can I take?
3. What states can those actions produce?
4. What does success look like?
5. How expensive is each action?

---

# Example: Route Finding

Suppose you want to travel from Delhi to Jaipur.

```text
Delhi
  │
  ├──── Gurgaon
  │        │
  │        └──── Jaipur
  │
  └──── Alwar
           │
           └──── Jaipur
```

We formulate:

```text
Initial state = Delhi

Goal state = Jaipur

Actions =
Travel to connected city

State =
Current city

Cost =
Distance/time between cities
```

---

# Formal Problem Representation

A search problem can be represented as:

\[
P=(S,A,s_0,G,C)
\]

Where:

- \(S\) = set of possible states
- \(A\) = set of available actions
- \(s_0\) = initial state
- \(G\) = goal state or goal test
- \(C\) = action/path cost

---

# Example

```text
S = {A, B, C, D, G}

A = possible edges

s₀ = A

G = G

C = edge cost
```

Graph:

```text
       2
   A ------- B
   |         |
  4|         |3
   |         |
   C ------- D
       1     |
             |2
             G
```

---

# 2. State-Space Representation

## Definition

A **state space** is the collection of all possible states the problem can reach.

Think of it as:

> Every possible situation the AI could be in.

---

# Example: 8-Puzzle

Initial board:

```text
1 2 3
4 _ 6
7 5 8
```

Possible actions:

```text
Move blank:
↑
↓
←
→
```

Each resulting board is a new state.

```text
                 Initial
              ┌─────────┐
              │ 1 2 3   │
              │ 4 _ 6   │
              │ 7 5 8   │
              └────┬────┘
          ┌────────┼────────┐
          ▼        ▼        ▼
       Move Up   Move Left Move Down
```

All possible board configurations form the **state space**.

---

# Graph Representation

Suppose:

```text
A = initial state
G = goal
```

```text
          A
       /  |  \
      B   C   D
     / \     / \
    E   F   H   I
        |
        G
```

Every node represents a state.

Every edge represents an action.

---

# 3. Initial State and Goal State

## Initial State

The **initial state** is where the problem begins.

Notation:

\[
s_0
\]

Example:

```text
Robot position = Room A
```

---

## Goal State

The **goal state** is the desired final state.

Example:

```text
Robot position = Room G
```

Search:

```text
A
│
├── B
│   └── E
│
└── C
    └── G ← Goal
```

---

# Goal Test

Sometimes there can be multiple acceptable goals.

Instead of:

```python
state == "G"
```

we use:

```python
def is_goal(state):
    return state in goal_states
```

---

# 4. Operators and Actions

## Definition

An **operator** is a rule that transforms one state into another.

An **action** is an application of that operator.

Example:

```text
Current state:
Robot at A

Action:
Move right

New state:
Robot at B
```

---

# State Transition

Mathematically:

\[
s' = Result(s,a)
\]

Where:

- \(s\) = current state
- \(a\) = action
- \(s'\) = resulting state

---

# Example

```text
State = A
Action = Move to C

Result(A, Move-C) = C
```

---

# 5. Search Tree vs Search Graph

This distinction is very important.

## Search Tree

A search tree shows **how the algorithm explores paths**.

The same state may appear multiple times.

Example:

```text
             A
           /   \
          B     C
           \   /
            D
```

As a search tree:

```text
             A
           /   \
          B     C
          |     |
          D     D
```

`D` appears twice.

---

# Search Graph

A search graph stores states uniquely.

```text
             A
           /   \
          B     C
           \   /
            D
```

Now `D` is one state with two incoming paths.

---

# Why Visited Sets Matter

Without remembering visited nodes:

```text
A → B → C → A → B → C → ...
```

The search can loop forever.

Python:

```python
visited = set()

if node not in visited:
    visited.add(node)
```

---

# 6. Important Search Terminology

Before algorithms, remember these symbols.

| Symbol | Meaning |
|---|---|
| \(b\) | branching factor |
| \(d\) | depth of shallowest goal |
| \(m\) | maximum search depth |
| \(l\) | depth limit |
| \(C^*\) | optimal solution cost |
| \(\epsilon\) | minimum positive step cost |
| \(g(n)\) | cost from start to node |
| \(h(n)\) | estimated cost from node to goal |
| \(f(n)\) | estimated total cost |

---

# Branching Factor

If every node has roughly three children:

\[
b=3
\]

Example:

```text
          A
       /  |  \
      B   C   D
```

---

# Depth

```text
Depth 0:       A

Depth 1:     B C D

Depth 2:    E F G H
```

If goal `G` is at depth 2:

\[
d=2
\]

---

# PART A — UNINFORMED SEARCH

Uninformed search algorithms do **not know how close a node is to the goal**.

They only know:

- graph structure
- available actions
- path cost, if applicable

Main algorithms:

```text
BFS
DFS
UCS
DLS
IDS
Bidirectional Search
```

---

# 7. Breadth-First Search — BFS

## Definition

**BFS explores level by level.**

It visits all nodes at depth 1 before depth 2.

It uses a:

> **Queue — FIFO**

FIFO:

```text
First In
First Out
```

---

# BFS Graph

```text
                   A
                /  |  \
               B   C   D
              / \      / \
             E   F    G   H
            /             \
           I               J
```

BFS order:

```text
A
↓
B C D
↓
E F G H
↓
I J
```

So:

```text
A → B → C → D → E → F → G → H ...
```

If goal is `G`, BFS finds it before exploring deeper nodes.

---

# Queue Visualization

Start:

```text
Queue = [A]
```

Process A:

```text
Remove A
Add B,C,D

Queue = [B,C,D]
```

Process B:

```text
Remove B
Add E,F

Queue = [C,D,E,F]
```

---

# Python BFS

```python
from collections import deque


def bfs(graph, start, goal):
    queue = deque([(start, [start])])
    visited = {start}

    while queue:
        node, path = queue.popleft()

        if node == goal:
            return path

        for neighbour in graph[node]:
            if neighbour not in visited:
                visited.add(neighbour)

                queue.append(
                    (
                        neighbour,
                        path + [neighbour]
                    )
                )

    return None


graph = {
    "A": ["B", "C", "D"],
    "B": ["E", "F"],
    "C": [],
    "D": ["G", "H"],
    "E": [],
    "F": [],
    "G": [],
    "H": []
}

print(
    bfs(
        graph,
        "A",
        "G"
    )
)
```

Output:

```text
['A', 'D', 'G']
```

---

# BFS Dry Run

| Step | Remove | Queue after expansion | Visited |
|---:|---|---|---|
| 1 | A | B,C,D | A,B,C,D |
| 2 | B | C,D,E,F | A,B,C,D,E,F |
| 3 | C | D,E,F | same |
| 4 | D | E,F,G,H | +G,H |
| 5 | E | F,G,H | same |
| 6 | F | G,H | same |
| 7 | G | goal found | stop |

---

# BFS Properties

### Complete?

Yes, if branching factor is finite.

### Optimal?

Yes when every step has the same cost.

### Time Complexity

\[
O(b^d)
\]

### Space Complexity

\[
O(b^d)
\]

The biggest weakness of BFS is memory.

---

# Real-World Uses

- shortest path in unweighted graph
- social-network connections
- web crawling
- minimum moves problems
- level-order traversal

---

# 8. Depth-First Search — DFS

## Definition

DFS explores **one path as deeply as possible** before backtracking.

Uses:

> Stack — LIFO

LIFO:

```text
Last In
First Out
```

---

# DFS Graph

```text
             A
           / | \
          B  C  D
         / \
        E   F
       /
      G
```

Possible DFS:

```text
A
↓
B
↓
E
↓
G
```

Then backtrack.

---

# Stack Visualization

```text
Stack = [A]

Pop A
Push D,C,B

Stack = [D,C,B]

Pop B
Push F,E

Stack = [D,C,F,E]

Pop E
...
```

---

# Python DFS

```python
def dfs(graph, start, goal):
    stack = [(start, [start])]
    visited = set()

    while stack:
        node, path = stack.pop()

        if node == goal:
            return path

        if node in visited:
            continue

        visited.add(node)

        for neighbour in reversed(
            graph[node]
        ):
            if neighbour not in visited:
                stack.append(
                    (
                        neighbour,
                        path + [neighbour]
                    )
                )

    return None
```

---

# DFS Dry Run

Graph:

```text
A
├── B
│   ├── E
│   └── F
└── C
    └── G
```

Goal = `G`.

Possible traversal:

| Step | Node | Stack |
|---:|---|---|
| 1 | A | C,B |
| 2 | B | C,F,E |
| 3 | E | C,F |
| 4 | F | C |
| 5 | C | G |
| 6 | G | goal |

---

# DFS Properties

### Complete?

Not always for infinite-depth spaces unless repeated-state handling and finite graph assumptions apply.

### Optimal?

No.

### Time Complexity

\[
O(b^m)
\]

### Space Complexity

\[
O(bm)
\]

DFS uses much less memory than BFS.

---

# BFS vs DFS

| BFS | DFS |
|---|---|
| Queue | Stack |
| Level by level | Deep first |
| Shortest unweighted path | Not guaranteed shortest |
| High memory | Lower memory |
| Complete under standard finite branching assumptions | Can fail in infinite spaces |

---

# 9. Uniform-Cost Search — UCS

## Definition

UCS expands the node with the **lowest total path cost so far**.

It does not care about depth.

It cares about:

\[
g(n)
\]

Where:

\[
g(n)=\text{cost from start to node }n
\]

Uses:

> Priority Queue

---

# Example

```text
         2
    A -------- B
    |          |
  10|          |2
    |          |
    C -------- G
         1
```

Paths:

```text
A → C → G
Cost = 10 + 1 = 11

A → B → G
Cost = 2 + 2 = 4
```

BFS might depend on number of edges.

UCS chooses cost 4.

---

# UCS Expansion

```text
A(0)
│
├── B(2)
└── C(10)

Choose B because 2 < 10.

B → G = 4

Now frontier:
G(4)
C(10)

Choose G.
```

---

# Python UCS

```python
import heapq


def uniform_cost_search(
    graph,
    start,
    goal
):
    pq = [(0, start, [start])]
    best_cost = {}

    while pq:
        cost, node, path = heapq.heappop(
            pq
        )

        if (
            node in best_cost
            and best_cost[node] <= cost
        ):
            continue

        best_cost[node] = cost

        if node == goal:
            return cost, path

        for neighbour, edge_cost in graph[node]:
            new_cost = cost + edge_cost

            heapq.heappush(
                pq,
                (
                    new_cost,
                    neighbour,
                    path + [neighbour]
                )
            )

    return None


graph = {
    "A": [("B", 2), ("C", 10)],
    "B": [("G", 2)],
    "C": [("G", 1)],
    "G": []
}

print(
    uniform_cost_search(
        graph,
        "A",
        "G"
    )
)
```

Output:

```text
(4, ['A', 'B', 'G'])
```

---

# UCS Properties

### Complete?

Yes if every step cost is at least some positive \(\epsilon\).

### Optimal?

Yes with non-negative step costs.

### Complexity

Often expressed in AI textbooks as roughly:

\[
O\left(
b^{1+\lfloor C^*/\epsilon \rfloor}
\right)
\]

Where:

- \(C^*\) = cost of optimal solution
- \(\epsilon\) = smallest positive step cost

---

# BFS vs UCS

BFS:

```text
Lowest depth first
```

UCS:

```text
Lowest path cost first
```

If all edge costs are identical:

> UCS behaves similarly to BFS.

---

# 10. Depth-Limited Search — DLS

## Definition

Depth-Limited Search is DFS with a maximum depth.

```text
DFS
+
Depth Limit
=
DLS
```

---

# Example

```text
Depth 0:      A
             / \
Depth 1:    B   C
           /     \
Depth 2:  D       E
         /
Depth 3:F ← goal
```

Suppose:

\[
limit=2
\]

DLS will not reach `F`.

---

# Python DLS

```python
def depth_limited_search(
    graph,
    node,
    goal,
    limit,
    path=None
):
    if path is None:
        path = [node]

    if node == goal:
        return path

    if limit == 0:
        return None

    for neighbour in graph[node]:
        if neighbour not in path:
            result = depth_limited_search(
                graph,
                neighbour,
                goal,
                limit - 1,
                path + [neighbour]
            )

            if result:
                return result

    return None
```

---

# DLS Properties

Time:

\[
O(b^l)
\]

Space:

\[
O(bl)
\]

Where:

- \(l\) = depth limit

---

# Main Advantage

Avoids DFS going infinitely deep.

---

# Main Problem

If:

```text
Goal depth = 5
Limit = 4
```

then goal is missed.

---

# 11. Iterative Deepening Search — IDS

## Definition

IDS repeatedly runs Depth-Limited Search with increasing limits.

```text
limit = 0
limit = 1
limit = 2
limit = 3
...
```

until goal is found.

---

# Visualization

Tree:

```text
          A
        /   \
       B     C
      / \   / \
     D   E F   G
        /
       H
```

Iteration 0:

```text
A
```

Iteration 1:

```text
A
B C
```

Iteration 2:

```text
A
B C
D E F G
```

Iteration 3:

```text
...
H
```

---

# Why Repeated Work Is Okay

At first it looks wasteful.

But most nodes exist at the deepest level.

Example:

If:

\[
b=10
\]

nodes at:

```text
depth 0 = 1
depth 1 = 10
depth 2 = 100
depth 3 = 1000
```

Repeating the small upper levels costs relatively little.

---

# Python IDS

```python
def iterative_deepening(
    graph,
    start,
    goal,
    max_depth
):
    for limit in range(
        max_depth + 1
    ):
        result = depth_limited_search(
            graph,
            start,
            goal,
            limit
        )

        if result:
            return result

    return None
```

---

# IDS Properties

### Complete?

Yes under standard finite branching assumptions.

### Optimal?

Yes when step costs are equal.

### Time

\[
O(b^d)
\]

### Space

\[
O(bd)
\]

---

# Why IDS Is Important

It combines:

```text
BFS's completeness
+
DFS's low memory
```

---

# 12. Bidirectional Search

## Definition

Bidirectional search searches simultaneously:

```text
Start → forward
Goal → backward
```

until the two searches meet.

---

# Traditional Search

```text
A
↓
↓
↓
↓
↓
G
```

Bidirectional:

```text
A → → → M ← ← ← G
          ↑
        Meet
```

---

# Graph Example

```text
A → B → C → D → E → G
```

Forward:

```text
A → B → C
```

Backward:

```text
G → E → D
```

Meet between C and D.

---

# Complexity

Instead of searching approximately:

\[
b^d
\]

nodes, each direction goes about:

\[
d/2
\]

giving roughly:

\[
O(b^{d/2})
\]

which can be a huge improvement.

---

# Requirements

Bidirectional search works best when:

- goal state is explicitly known
- reverse actions are possible
- checking intersection is efficient

---

# PART B — INFORMED SEARCH

Informed algorithms use additional knowledge called a:

> **Heuristic**

Main techniques:

```text
Greedy Best-First Search
A*
Hill Climbing
Beam Search
```

---

# 13. Heuristic Function

## Definition

A **heuristic function** estimates how far a state is from the goal.

Notation:

\[
h(n)
\]

Where:

- \(n\) = current node
- \(h(n)\) = estimated remaining cost

---

# Example: Route Finding

If we are traveling to Jaipur:

```text
City       h(n)

Delhi      240 km
Gurgaon    220 km
Alwar      120 km
Jaipur       0 km
```

The heuristic could be straight-line distance to Jaipur.

---

# Goal

At the goal:

\[
h(goal)=0
\]

---

# Good vs Bad Heuristic

Good heuristic:

```text
Closely estimates real remaining cost.
```

Poor heuristic:

```text
Provides little useful guidance.
```

---

# Admissible Heuristic

A heuristic is **admissible** if it never overestimates the actual optimal cost.

\[
h(n)\le h^*(n)
\]

Where:

- \(h(n)\) = estimated cost
- \(h^*(n)\) = actual optimal remaining cost

Example:

Actual distance:

```text
100 km
```

Admissible estimates:

```text
90
80
60
```

Not admissible:

```text
120
```

---

# Consistent Heuristic

A heuristic is consistent if:

\[
h(n)
\le
c(n,n')+h(n')
\]

for each transition.

Where:

- \(n\) = current node
- \(n'\) = successor
- \(c(n,n')\) = action cost

This resembles the triangle inequality.

---

# 14. Greedy Best-First Search

## Definition

Greedy Best-First Search chooses the node that **looks closest to the goal** according to:

\[
f(n)=h(n)
\]

It ignores the cost already spent.

---

# Example

```text
            Start
          /       \
        A           B
     h=2           h=5
      │
      G
```

Greedy chooses A because:

\[
2<5
\]

---

# Problem

Suppose:

```text
Start → A costs 100
A → Goal costs 100

Start → B costs 2
B → Goal costs 3
```

Heuristic:

```text
h(A)=1
h(B)=4
```

Greedy chooses A because it **looks closer**.

But actual cost:

```text
A path = 200
B path = 5
```

So Greedy is not guaranteed optimal.

---

# Python Greedy Search

```python
import heapq


def greedy_best_first(
    graph,
    heuristic,
    start,
    goal
):
    pq = [
        (
            heuristic[start],
            start,
            [start]
        )
    ]

    visited = set()

    while pq:
        _, node, path = heapq.heappop(
            pq
        )

        if node == goal:
            return path

        if node in visited:
            continue

        visited.add(node)

        for neighbour in graph[node]:
            if neighbour not in visited:
                heapq.heappush(
                    pq,
                    (
                        heuristic[neighbour],
                        neighbour,
                        path + [neighbour]
                    )
                )

    return None
```

---

# Greedy Memory Trick

> Greedy asks: **Which node looks closest to the goal right now?**

---

# 15. A* Search

Pronounced:

> **A-star**

A* is one of the most important search algorithms in AI.

---

## Definition

A* uses both:

1. cost already spent
2. estimated remaining cost

Formula:

\[
f(n)=g(n)+h(n)
\]

Where:

- \(g(n)\) = actual cost from start to node
- \(h(n)\) = estimated cost from node to goal
- \(f(n)\) = estimated total path cost

---

# A* Intuition

```text
Start
 ─────────► n ─────────► Goal

   g(n)         h(n)

Total estimate:
f(n)=g(n)+h(n)
```

---

# Example

Suppose:

| Node | \(g(n)\) | \(h(n)\) | \(f(n)\) |
|---|---:|---:|---:|
| A | 4 | 6 | 10 |
| B | 6 | 2 | 8 |
| C | 3 | 8 | 11 |

A* chooses:

```text
B
```

because:

\[
f(B)=8
\]

is smallest.

---

# A* Graph Example

```text
                    S
                 /     \
              2 /       \ 4
               A         B
             /   \        \
          2 /     \5       \2
           C       D        G
            \
             \3
              G
```

Suppose heuristic:

```text
h(S)=5
h(A)=4
h(B)=2
h(C)=3
h(D)=4
h(G)=0
```

At S:

```text
A:
g=2
h=4
f=6

B:
g=4
h=2
f=6
```

A* considers total estimated cost, not only heuristic.

---

# Python A*

```python
import heapq


def a_star(
    graph,
    heuristic,
    start,
    goal
):
    pq = [
        (
            heuristic[start],
            0,
            start,
            [start]
        )
    ]

    best_g = {
        start: 0
    }

    while pq:
        f, g, node, path = heapq.heappop(
            pq
        )

        if node == goal:
            return g, path

        if g > best_g.get(
            node,
            float("inf")
        ):
            continue

        for neighbour, cost in graph[node]:
            new_g = g + cost

            if new_g < best_g.get(
                neighbour,
                float("inf")
            ):
                best_g[neighbour] = new_g

                new_f = (
                    new_g
                    +
                    heuristic[neighbour]
                )

                heapq.heappush(
                    pq,
                    (
                        new_f,
                        new_g,
                        neighbour,
                        path + [neighbour]
                    )
                )

    return None
```

---

# A* Dry Run

Suppose:

```text
S → A cost 2
S → B cost 4
A → G cost 6
B → G cost 2
```

Heuristic:

```text
h(A)=4
h(B)=2
h(G)=0
```

At S:

| Node | g | h | f |
|---|---:|---:|---:|
| A | 2 | 4 | 6 |
| B | 4 | 2 | 6 |

Expand one.

From B:

```text
g(G)=4+2=6
h(G)=0

f(G)=6
```

Optimal cost:

```text
6
```

---

# A* Properties

With suitable conditions:

### Complete?

Yes.

### Optimal?

Yes if heuristic is admissible; for standard graph-search A*, consistency is especially useful.

---

# A* Special Cases

If:

\[
h(n)=0
\]

then:

\[
f(n)=g(n)
\]

A* becomes:

> Uniform-Cost Search

If we ignore:

\[
g(n)
\]

then search behaves like:

> Greedy Best-First Search

This relationship is very important:

```text
UCS:
f(n)=g(n)

Greedy:
f(n)=h(n)

A*:
f(n)=g(n)+h(n)
```

---

# 16. Hill Climbing

## Definition

Hill climbing is a **local search algorithm** that repeatedly moves to a better neighboring state.

It does not usually keep an entire search tree.

---

# Mountain Analogy

Imagine standing on a mountain in fog.

You cannot see the whole mountain.

You:

```text
Check nearby points
      ↓
Move uphill
      ↓
Check again
      ↓
Move uphill
      ↓
Reach peak
```

---

# Graph

```text
Value
  ↑
  │                Global Maximum
  │                    /\
  │                   /  \
  │       Local      /    \
  │      Maximum    /      \
  │        /\      /
  │       /  \____/
  │______/______________________→ State
```

Problem:

Hill climbing can stop at a:

> **Local maximum**

instead of the global maximum.

---

# Other Problems

### Local Maximum

```text
        /\
       /  \       /\
______/    \_____/  \____
       stop       global
```

### Plateau

```text
        ____________
_______/            \______
```

No neighbour appears better.

### Ridge

Improvement requires sideways/non-obvious movement.

---

# Python Example

```python
def hill_climb(values, start):
    current = start

    while True:
        neighbours = []

        if current > 0:
            neighbours.append(
                current - 1
            )

        if current < len(values) - 1:
            neighbours.append(
                current + 1
            )

        best = max(
            neighbours,
            key=lambda i: values[i]
        )

        if values[best] <= values[current]:
            return current

        current = best


values = [
    1,
    3,
    6,
    8,
    7,
    5
]

result = hill_climb(
    values,
    0
)

print(result)
print(values[result])
```

Output:

```text
3
8
```

---

# Dry Run

| Current index | Value | Best neighbor | Next |
|---:|---:|---:|---:|
| 0 | 1 | index 1 = 3 | 1 |
| 1 | 3 | index 2 = 6 | 2 |
| 2 | 6 | index 3 = 8 | 3 |
| 3 | 8 | neighbors 6,7 | stop |

---

# Ways to Improve Hill Climbing

- random restart
- stochastic hill climbing
- sideways moves

---

# 17. Beam Search

## Definition

Beam Search explores multiple promising states but keeps only the best:

\[
k
\]

states at each level.

`k` is called:

> **beam width**

---

# Example

Suppose:

\[
k=2
\]

Tree:

```text
                A
          /     |      \
         B      C       D
       h=5    h=2     h=3
```

Keep best two:

```text
C and D
```

Discard:

```text
B
```

Next level:

```text
          C           D
        /   \       /   \
       E     F     G     H
      h=6   h=1   h=2   h=5
```

Keep:

```text
F and G
```

---

# Beam Width

Small:

```text
k=1
```

Almost greedy.

Larger:

```text
k=10
```

explores more alternatives but uses more memory.

---

# Conceptual Python

```python
def beam_search(
    graph,
    heuristic,
    start,
    goal,
    beam_width=2
):
    level = [
        (start, [start])
    ]

    while level:
        candidates = []

        for node, path in level:
            if node == goal:
                return path

            for neighbour in graph[node]:
                candidates.append(
                    (
                        neighbour,
                        path + [neighbour]
                    )
                )

        candidates.sort(
            key=lambda x:
            heuristic[x[0]]
        )

        level = candidates[
            :beam_width
        ]

    return None
```

---

# Beam Search Advantage

Reduces memory compared with storing every candidate.

---

# Disadvantage

It can discard the path containing the optimal solution.

So it is not generally complete or optimal.

---

# PART C — CONSTRAINT SATISFACTION

# 18. Constraint Satisfaction Problems — CSP

## Definition

A **Constraint Satisfaction Problem** contains:

1. variables
2. domains
3. constraints

We need to assign values to variables so that all constraints are satisfied.

---

# Formula

A CSP can be described as:

\[
CSP=(X,D,C)
\]

Where:

- \(X\) = variables
- \(D\) = domains
- \(C\) = constraints

---

# Example: Map Coloring

We want neighboring regions to have different colors.

```text
      A
    /   \
   B --- C
```

Variables:

```text
A
B
C
```

Domain:

```text
{Red, Green, Blue}
```

Constraints:

```text
A ≠ B
A ≠ C
B ≠ C
```

Possible solution:

```text
A = Red
B = Green
C = Blue
```

---

# CSP Visualization

```text
Variables
   │
   ├── A → {R,G,B}
   ├── B → {R,G,B}
   └── C → {R,G,B}
        │
        ▼
Constraints
A ≠ B
A ≠ C
B ≠ C
        │
        ▼
Solution
A=R, B=G, C=B
```

---

# Real-World CSP Applications

- Sudoku
- timetable scheduling
- employee scheduling
- map coloring
- exam scheduling
- resource allocation

---

# Sudoku as CSP

Variables:

```text
81 cells
```

Domain:

```text
1...9
```

Constraints:

```text
No duplicate in row
No duplicate in column
No duplicate in 3×3 box
```

---

# Backtracking for CSP

Backtracking:

```text
Choose variable
    ↓
Assign value
    ↓
Check constraints
    ↓
Valid?
 ┌─────┴─────┐
Yes          No
 ↓            ↓
Continue   Backtrack
```

---

# Python Map Coloring

```python
regions = [
    "A",
    "B",
    "C"
]

colors = [
    "Red",
    "Green",
    "Blue"
]

neighbours = {
    "A": ["B", "C"],
    "B": ["A", "C"],
    "C": ["A", "B"]
}


def is_valid(
    region,
    color,
    assignment
):
    for neighbour in neighbours[region]:
        if (
            assignment.get(neighbour)
            == color
        ):
            return False

    return True


def backtrack(assignment):
    if len(assignment) == len(regions):
        return assignment

    region = regions[
        len(assignment)
    ]

    for color in colors:
        if is_valid(
            region,
            color,
            assignment
        ):
            assignment[region] = color

            result = backtrack(
                assignment
            )

            if result:
                return result

            del assignment[region]

    return None


print(
    backtrack({})
)
```

Possible output:

```text
{
 'A': 'Red',
 'B': 'Green',
 'C': 'Blue'
}
```

---

# Dry Run

| Variable | Try | Valid? | Assignment |
|---|---|---|---|
| A | Red | Yes | A=Red |
| B | Red | No | — |
| B | Green | Yes | B=Green |
| C | Red | No | — |
| C | Green | No | — |
| C | Blue | Yes | C=Blue |

Solution found.

---

# CSP Improvement Techniques

Common advanced techniques include:

### MRV

Choose variable with fewest legal values.

**Minimum Remaining Values**

### Degree Heuristic

Choose variable constraining the most other variables.

### Forward Checking

Remove impossible future values after each assignment.

### Arc Consistency

Ensure variable-domain values remain compatible with constraints.

---

# PART D — ADVERSARIAL SEARCH

# 19. Minimax Algorithm

## Definition

**Minimax** is used in two-player competitive games.

Examples:

- Chess
- Tic-Tac-Toe
- Checkers

Assumptions usually include:

```text
MAX player wants maximum score.
MIN player wants minimum score.
```

---

# Game Tree

```text
                    MAX
                 /       \
               MIN       MIN
              /  \       /  \
             3    5     2    9
```

MIN chooses minimum:

```text
Left MIN:
min(3,5)=3

Right MIN:
min(2,9)=2
```

Then MAX chooses:

\[
max(3,2)=3
\]

So MAX chooses left branch.

---

# Minimax Flow

```text
Terminal scores
      ↓
MIN chooses smallest
      ↓
MAX chooses largest
      ↓
Best move
```

---

# Formula

For MAX node:

\[
V(n)=
\max_{c\in Children(n)}
V(c)
\]

For MIN node:

\[
V(n)=
\min_{c\in Children(n)}
V(c)
\]

---

# Python Minimax

```python
def minimax(
    scores,
    depth,
    index,
    maximizing
):
    if depth == 0:
        return scores[index]

    if maximizing:
        return max(
            minimax(
                scores,
                depth - 1,
                index * 2,
                False
            ),
            minimax(
                scores,
                depth - 1,
                index * 2 + 1,
                False
            )
        )

    return min(
        minimax(
            scores,
            depth - 1,
            index * 2,
            True
        ),
        minimax(
            scores,
            depth - 1,
            index * 2 + 1,
            True
        )
    )


scores = [
    3,
    5,
    2,
    9
]

print(
    minimax(
        scores,
        2,
        0,
        True
    )
)
```

Output:

```text
3
```

---

# Minimax Dry Run

Leaves:

```text
3,5,2,9
```

MIN layer:

```text
min(3,5)=3
min(2,9)=2
```

MAX layer:

```text
max(3,2)=3
```

Final answer:

```text
3
```

---

# Minimax Complexity

If:

- branching factor = \(b\)
- search depth = \(m\)

Time:

\[
O(b^m)
\]

Depth-first implementation space:

\[
O(bm)
\]

approximately under common representation assumptions.

---

# Problem with Minimax

Chess has enormous game trees.

Exploring every possible move is expensive.

This leads to:

> Alpha-Beta Pruning.

---

# 20. Alpha-Beta Pruning

## Definition

Alpha-beta pruning improves minimax by skipping branches that **cannot affect the final decision**.

It produces the same optimal result as minimax when used correctly.

---

# Important Values

## Alpha

\[
\alpha
\]

Best score MAX can guarantee so far.

Think:

> MAX's best known value.

Initially:

\[
\alpha=-\infty
\]

---

## Beta

\[
\beta
\]

Best score MIN can guarantee so far.

Think:

> MIN's best known value.

Initially:

\[
\beta=+\infty
\]

---

# Pruning Condition

Prune when:

\[
\alpha\ge\beta
\]

because remaining branch cannot change the decision.

---

# Graph Example

```text
                     MAX
                  /       \
                MIN       MIN
               /  \      /   \
              3    5    2     ?
```

Evaluate left MIN:

```text
min(3,5)=3
```

MAX now has:

\[
\alpha=3
\]

Evaluate right MIN.

First child:

```text
2
```

Right MIN can already produce at most:

\[
\beta=2
\]

Now:

\[
\alpha=3
\]

and:

\[
\beta=2
\]

Since:

\[
\alpha\ge\beta
\]

the remaining right child can be pruned.

```text
                     MAX
                  /       \
                MIN       MIN
               /  \      /   \
              3    5    2     X
                              PRUNED
```

---

# Why Can We Ignore It?

MAX already has an option worth:

```text
3
```

The right MIN branch can force the outcome to at most:

```text
2
```

MAX would never choose it.

So examining the remaining child cannot change MAX's decision.

---

# Python Alpha-Beta

```python
def alpha_beta(
    tree,
    depth,
    index,
    maximizing,
    alpha,
    beta
):
    if depth == 0:
        return tree[index]

    if maximizing:
        best = float("-inf")

        for child in range(2):
            value = alpha_beta(
                tree,
                depth - 1,
                index * 2 + child,
                False,
                alpha,
                beta
            )

            best = max(
                best,
                value
            )

            alpha = max(
                alpha,
                best
            )

            if beta <= alpha:
                break

        return best

    else:
        best = float("inf")

        for child in range(2):
            value = alpha_beta(
                tree,
                depth - 1,
                index * 2 + child,
                True,
                alpha,
                beta
            )

            best = min(
                best,
                value
            )

            beta = min(
                beta,
                best
            )

            if beta <= alpha:
                break

        return best
```

---

# Alpha-Beta Complexity

Worst case:

\[
O(b^m)
\]

With excellent move ordering, effective complexity can approach:

\[
O(b^{m/2})
\]

This means it can search roughly twice as deep with similar work in ideal circumstances.

---

# 21. Search Algorithm Master Graph

Use this graph to remember all major algorithms.

```text
                        SEARCH
                          │
           ┌──────────────┴───────────────┐
           │                              │
     UNINFORMED                       INFORMED
           │                              │
    No heuristic                      Uses h(n)
           │                              │
 ┌─────────┼──────────────┐       ┌───────┼─────────┐
 │         │              │       │       │         │
BFS       DFS            UCS    Greedy    A*      Local
 │         │              │       │       │         │
Queue     Stack        g(n)    h(n)   g+h     ┌────┴────┐
                                                 │       │
                                               Hill    Beam
                                              Climb    Search
```

---

# 22. Algorithm Comparison Table

| Algorithm | Main Rule | Data Structure | Optimal? | Complete? |
|---|---|---|---|---|
| BFS | shallowest first | Queue | Yes for equal costs | Yes |
| DFS | deepest first | Stack | No | Not always |
| UCS | minimum \(g(n)\) | Priority queue | Yes | Yes under positive-cost assumptions |
| DLS | DFS up to limit | Stack/recursion | No | Only if goal within limit |
| IDS | repeated DLS | Stack | Yes for equal costs | Yes |
| Bidirectional | search from both ends | Usually queues/frontiers | Yes in BFS-style equal-cost case | Depends on setup |
| Greedy | minimum \(h(n)\) | Priority queue | No | Not always |
| A* | minimum \(g+h\) | Priority queue | Yes with appropriate heuristic conditions | Yes under standard assumptions |
| Hill Climbing | best neighbor | Local state | No | No |
| Beam Search | best \(k\) states | Limited frontier | No | No |

---

# 23. BFS, UCS, Greedy and A* on One Graph

This is the best conceptual comparison.

Suppose:

```text
                S
             /     \
          2 /       \ 5
           A         B
          /           \
       10/             \2
        G               G
```

Heuristic:

```text
h(A)=1
h(B)=2
h(G)=0
```

### BFS

Counts levels:

```text
S → A → G
S → B → G
```

Both depth 2. Depending on order, may choose A route.

Cost:

```text
12
```

---

### UCS

Uses:

\[
g(n)
\]

Paths:

```text
S-A-G = 12
S-B-G = 7
```

Chooses:

```text
S-B-G
```

---

### Greedy

Uses:

\[
h(n)
\]

A:

```text
h=1
```

B:

```text
h=2
```

Chooses A, even though expensive.

---

### A*

A:

\[
g=2,\quad h=1
\]

\[
f=3
\]

B:

\[
g=5,\quad h=2
\]

\[
f=7
\]

Initially A looks attractive, but A* continues using path costs and can still discover the lower-cost solution depending on frontier values and heuristic correctness.

The key difference:

```text
BFS     → depth
UCS     → path cost
Greedy  → estimated remaining cost
A*      → path cost + estimated remaining cost
```

---

# 24. Search Algorithm Selection Guide

If graph is unweighted and you need shortest number of moves:

```text
BFS
```

If weighted and want cheapest path:

```text
UCS
```

If memory is very limited:

```text
DFS / IDS
```

If goal depth unknown and all actions have similar costs:

```text
IDS
```

If you can search from both start and goal:

```text
Bidirectional
```

If you have a good heuristic:

```text
A*
```

If you need fast approximate search:

```text
Greedy / Beam
```

If only local neighboring solutions can be evaluated:

```text
Hill Climbing
```

If assigning values under rules:

```text
CSP / Backtracking
```

If opponent is actively trying to defeat you:

```text
Minimax + Alpha-Beta
```

---

# 25. Important Common Mistakes

## Mistake 1: BFS always finds cheapest path

Not when edges have different costs.

BFS minimizes:

```text
number of edges
```

not:

```text
total weighted cost
```

Use UCS for weighted paths.

---

## Mistake 2: DFS finds shortest path

No.

DFS simply goes deep.

---

## Mistake 3: UCS and Greedy are identical

No.

```text
UCS:
g(n)

Greedy:
h(n)
```

---

## Mistake 4: A* uses only heuristic

No.

\[
A^*=g+h
\]

---

## Mistake 5: Greedy is always faster and optimal

It may be fast, but it is not guaranteed optimal.

---

## Mistake 6: A heuristic must equal exact cost

No.

It is an estimate.

If exact remaining cost were already known, search would be much easier.

---

## Mistake 7: Bigger heuristic is always better

No.

For optimal A*, overestimating can violate admissibility.

---

## Mistake 8: DLS and IDS are the same

DLS:

```text
one fixed limit
```

IDS:

```text
0,1,2,3,... limits
```

---

## Mistake 9: Bidirectional search always works

It requires suitable reverse search and a well-defined goal.

---

## Mistake 10: Hill climbing remembers all alternatives

Usually no.

It is local search.

This is why it can get trapped.

---

## Mistake 11: Beam search is BFS

No.

Beam search discards all but the best `k` nodes.

---

## Mistake 12: CSP means search for a path

Not necessarily.

CSP searches for:

> assignments satisfying constraints.

---

## Mistake 13: Minimax assumes opponent helps you

No.

MIN is assumed to choose the best move for itself, which means worst outcome for MAX.

---

## Mistake 14: Alpha-beta changes the minimax answer

No.

Correct alpha-beta pruning gives the same minimax result while examining fewer nodes.

---

# 26. Interview Questions with Answers

## Q1. What is problem formulation in AI?

Problem formulation converts a real-world problem into states, actions, an initial state, a goal test, and possibly path costs.

---

## Q2. What is state space?

The state space is the set of all possible states reachable in a problem.

---

## Q3. What is an initial state?

The state where search starts.

---

## Q4. What is a goal state?

A state satisfying the problem's success condition.

---

## Q5. What is an operator?

A rule that transforms one state into another.

---

## Q6. Search tree vs graph?

A search tree represents explored paths and may duplicate states. A graph represents unique states and connections.

---

## Q7. What data structure does BFS use?

Queue.

---

## Q8. What data structure does DFS use?

Stack or recursion.

---

## Q9. Why is BFS complete?

Because it systematically explores increasingly deeper levels when branching is finite.

---

## Q10. When is BFS optimal?

When all step costs are equal.

---

## Q11. Why isn't DFS optimal?

It may find a deep solution before a shorter or cheaper solution.

---

## Q12. What is UCS?

Uniform-Cost Search expands the node with lowest path cost \(g(n)\).

---

## Q13. BFS vs UCS?

BFS minimizes depth.

UCS minimizes cumulative cost.

---

## Q14. What is Depth-Limited Search?

DFS with a maximum depth.

---

## Q15. What is Iterative Deepening?

Repeated DLS with limits:

```text
0,1,2,3,...
```

---

## Q16. Why use IDS?

It combines BFS-like completeness with DFS-like memory use.

---

## Q17. What is bidirectional search?

Search simultaneously from start and goal until the frontiers meet.

---

## Q18. What is a heuristic?

A function estimating remaining cost from a node to a goal.

\[
h(n)
\]

---

## Q19. What is an admissible heuristic?

One that never overestimates optimal remaining cost.

\[
h(n)\le h^*(n)
\]

---

## Q20. What is Greedy Best-First Search?

It expands the node with smallest heuristic value.

\[
f(n)=h(n)
\]

---

## Q21. What is A*?

A* chooses the node with:

\[
f(n)=g(n)+h(n)
\]

---

## Q22. Why is A* better than Greedy?

It considers both cost already spent and estimated cost remaining.

---

## Q23. When does A* become UCS?

When:

\[
h(n)=0
\]

---

## Q24. What is hill climbing?

A local search method that repeatedly moves to a better neighboring state.

---

## Q25. What is a local maximum?

A state better than all immediate neighbors but worse than the global optimum.

---

## Q26. What is beam search?

A search algorithm that keeps only the best `k` candidates at each level.

---

## Q27. What is beam width?

The number of states retained:

\[
k
\]

---

## Q28. What is CSP?

A problem involving variables, domains, and constraints.

\[
CSP=(X,D,C)
\]

---

## Q29. Give examples of CSP.

- Sudoku
- scheduling
- map coloring
- resource allocation

---

## Q30. What is backtracking?

Trying an assignment and undoing it when it violates constraints or cannot lead to a solution.

---

# 27. Minimax Interview Questions

## Q31. What is minimax?

An adversarial search algorithm for two-player games where MAX maximizes utility and MIN minimizes it.

---

## Q32. What is a terminal state?

An end state where game outcome can be evaluated.

---

## Q33. What is an evaluation function?

A function estimating how good a non-terminal state is when full game-tree search is impossible.

Example chess evaluation:

\[
Score=
9Q+5R+3B+3N+1P
\]

approximately based on piece values, although real engines use far richer evaluation.

---

## Q34. What is alpha-beta pruning?

An optimization of minimax that skips branches unable to influence the final decision.

---

## Q35. What is alpha?

The best value MAX can guarantee so far.

---

## Q36. What is beta?

The best value MIN can guarantee so far.

---

## Q37. When do we prune?

\[
\alpha\ge\beta
\]

---

## Q38. Does alpha-beta change the answer?

No. It reduces the number of states evaluated.

---

# 28. Scenario-Based Questions

## Scenario 1

> Find the minimum number of moves from one maze cell to another where all moves cost 1.

Use:

```text
BFS
```

Why?

All edges have equal cost.

---

## Scenario 2

> Find cheapest flight route where tickets have different prices.

Use:

```text
Uniform-Cost Search
```

---

## Scenario 3

> GPS routing with straight-line distance to destination.

Use:

```text
A*
```

because:

```text
g(n) = distance already travelled
h(n) = estimated remaining distance
```

---

## Scenario 4

> Need low memory and goal depth is unknown.

Use:

```text
Iterative Deepening
```

---

## Scenario 5

> Assign teachers to classes without schedule conflicts.

Use:

```text
CSP
```

---

## Scenario 6

> Build a Tic-Tac-Toe AI.

Use:

```text
Minimax
```

and optimize with:

```text
Alpha-Beta Pruning
```

---

# 29. Full Practical Example: Shortest Route

Graph:

```text
                     A
                2 /     \ 4
                 B       C
              3 / \5     \1
               D   E      F
                \  |      /
               4\ |2   3/
                  \|    /
                    G
```

Edges:

```python
graph = {
    "A": [
        ("B", 2),
        ("C", 4)
    ],

    "B": [
        ("D", 3),
        ("E", 5)
    ],

    "C": [
        ("F", 1)
    ],

    "D": [
        ("G", 4)
    ],

    "E": [
        ("G", 2)
    ],

    "F": [
        ("G", 3)
    ],

    "G": []
}
```

Possible paths:

### Path 1

\[
A\to B\to D\to G
\]

Cost:

\[
2+3+4=9
\]

### Path 2

\[
A\to B\to E\to G
\]

Cost:

\[
2+5+2=9
\]

### Path 3

\[
A\to C\to F\to G
\]

Cost:

\[
4+1+3=8
\]

Optimal path:

```text
A → C → F → G
```

Cost:

\[
8
\]

UCS can find this without a heuristic.

A* can potentially find it more efficiently with a good heuristic.

---

# 30. Final Formula Revision

### Search problem

\[
P=(S,A,s_0,G,C)
\]

### State transition

\[
s'=Result(s,a)
\]

### UCS

\[
f(n)=g(n)
\]

### Greedy

\[
f(n)=h(n)
\]

### A*

\[
\boxed{f(n)=g(n)+h(n)}
\]

### Admissible heuristic

\[
h(n)\le h^*(n)
\]

### Consistent heuristic

\[
h(n)\le c(n,n')+h(n')
\]

### CSP

\[
CSP=(X,D,C)
\]

### Minimax MAX

\[
V(n)=\max V(child)
\]

### Minimax MIN

\[
V(n)=\min V(child)
\]

### Alpha-beta pruning

\[
\boxed{\alpha\ge\beta}
\]

---

# 31. Final Visual Revision Graph

```text
                          AI PROBLEM SOLVING
                                  │
                                  ▼
                        Problem Formulation
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
             State              Actions             Goal
              │
              ▼
                          STATE SPACE
                              │
                ┌─────────────┴─────────────┐
                │                           │
              SEARCH                      CSP
                │                           │
      ┌─────────┴─────────┐            Variables
      │                   │             Domains
 Uninformed            Informed         Constraints
      │                   │
 ┌────┼────┐          ┌───┼─────────┐
 │    │    │          │   │         │
BFS  DFS  UCS       Greedy A*     Local
 │    │    │          │    │      │
Queue Stack g(n)     h(n) g+h   Hill/Beam
                                     
                                  GAME SEARCH
                                       │
                                   Minimax
                                       │
                                Alpha-Beta Pruning
```

# 32. Best Last-Minute Memory Table

| Algorithm | Remember this |
|---|---|
| BFS | Go level by level |
| DFS | Go deep first |
| UCS | Cheapest path so far |
| DLS | DFS with depth limit |
| IDS | DLS with 0,1,2,3... |
| Bidirectional | Search from both ends |
| Greedy | Follow smallest heuristic |
| A* | Cost so far + heuristic |
| Hill Climbing | Move to better neighbour |
| Beam | Keep best `k` states |
| CSP | Variables + domains + constraints |
| Minimax | MAX vs MIN |
| Alpha-Beta | Skip useless branches |

## Best interview answer: “How does AI solve search problems?”

> **AI first formulates a problem using states, actions, an initial state, a goal test, and optionally action costs. The possible states and transitions form a state space. Uninformed algorithms such as BFS, DFS and Uniform-Cost Search explore this space without heuristic knowledge, while informed algorithms such as Greedy Best-First and A* use a heuristic to guide search. A* combines the path cost \(g(n)\) and estimated remaining cost \(h(n)\) using \(f(n)=g(n)+h(n)\). Local-search algorithms such as hill climbing and beam search reduce the amount of stored search information. Constraint satisfaction problems represent tasks using variables, domains and constraints, while adversarial games use Minimax to model competing players and Alpha-Beta pruning to avoid exploring branches that cannot influence the final decision.**

The single most useful graph to remember is:

```text
                     SEARCH
                       │
          ┌────────────┴────────────┐
          │                         │
      Uninformed                 Informed
          │                         │
   BFS DFS UCS DLS IDS       Greedy A* Hill Beam
                                  │
                             Heuristic h(n)

A* = g(n) + h(n)

Games:
Minimax → Alpha-Beta

Assignments:
CSP → Backtracking
```

This graph gives you the structure of almost the **entire AI problem-solving chapter**.
