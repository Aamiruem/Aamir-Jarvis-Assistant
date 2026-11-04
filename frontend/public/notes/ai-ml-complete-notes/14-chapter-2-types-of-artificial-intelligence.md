> **You asked:**
>
> ## Chapter 2: Types of Artificial Intelligence
>
> ### Based on capability
>
> -  Artificial Narrow Intelligence 
> -  Artificial General Intelligence 
> -  Artificial Super Intelligence 
>
> ### Based on functionality
>
> -  Reactive machines 
> -  Limited-memory AI 
> -  Theory-of-mind AI 
> -  Self-aware AI     Explain the chapter <chapter name/topic> in detail.  
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

# Chapter 2: Types of Artificial Intelligence

Artificial Intelligence can be classified in two common ways:

```text
1. Based on Capability
2. Based on Functionality
```

These classifications answer two different questions:

```text
Capability:
"How powerful or intelligent is the AI?"

Functionality:
"How does the AI behave or work?"
```

A simple map is:

```text
Artificial Intelligence
│
├── Based on Capability
│   ├── ANI
│   ├── AGI
│   └── ASI
│
└── Based on Functionality
    ├── Reactive Machines
    ├── Limited-Memory AI
    ├── Theory-of-Mind AI
    └── Self-Aware AI
```

---

# Part 1: AI Types Based on Capability

Capability means:

> **What range of intellectual tasks can the AI perform?**

There are three major categories:

```text
ANI → Narrow intelligence
AGI → General intelligence
ASI → Super intelligence
```

Think of them as:

```text
Specific Task
    ↓
Human-Level General Ability
    ↓
Beyond Human Ability

ANI → AGI → ASI
```

---

# 1. Artificial Narrow Intelligence

## Full Form

**ANI = Artificial Narrow Intelligence**

It is also called:

- Narrow AI
- Weak AI
- Task-specific AI

---

## Definition

ANI is an AI system designed to perform **one task or a limited group of related tasks**.

In simple words:

> ANI can be very intelligent at one thing, but it does not have general human intelligence.

Examples include:

- spam detection
- recommendation systems
- face recognition
- translation
- fraud detection
- chess engines
- object detection
- speech recognition

---

# Example

Consider a chess AI.

```text
Chess Board
    ↓
Chess AI
    ↓
Best Move
```

It can defeat strong human chess players.

But ask it:

```text
"Prepare my dinner."
```

It cannot do that.

So its intelligence is **narrow**.

---

# Real-World Analogy

Imagine a person who is world-class at only one specific task.

For example:

```text
Excellent calculator
but
cannot understand language
```

That is similar to narrow AI.

---

# Examples of ANI

### Recommendation System

```text
User history
    ↓
Recommendation model
    ↓
Recommended movies/products
```

### Email Spam Filter

```text
Email
 ↓
Classifier
 ↓
Spam / Not Spam
```

### Image Classifier

```text
Image
 ↓
Model
 ↓
Cat / Dog
```

---

# Important Characteristics of ANI

ANI:

- works within a defined domain
- may perform extremely well
- does not possess broad general intelligence
- cannot automatically transfer all knowledge to unrelated tasks
- represents nearly all deployed AI systems today

---

# Python Example: Narrow AI

A simple rule-based spam detector:

```python
def spam_detector(message):
    spam_words = [
        "free",
        "win",
        "prize"
    ]

    message = message.lower()

    for word in spam_words:
        if word in message:
            return "Spam"

    return "Not Spam"


print(
    spam_detector(
        "You won a free prize!"
    )
)
```

Output:

```text
Spam
```

---

# Dry Run

Input:

```text
"You won a free prize!"
```

| Step | Operation | Result |
|---|---|---|
| 1 | Convert to lowercase | `you won a free prize!` |
| 2 | Check `"free"` | Found |
| 3 | Return | Spam |

This system can detect simple spam patterns.

But it cannot:

- drive a car
- diagnose disease
- play chess

That is why it is narrow.

---

# ANI Diagram

```text
                 ANI
                  │
       ┌──────────┼──────────┐
       │          │          │
     Spam      Chess      Face
   Detection     AI      Recognition
       │          │          │
       └──── Specialized ─────┘
```

---

# 2. Artificial General Intelligence

## Full Form

**AGI = Artificial General Intelligence**

It is sometimes described as:

- General AI
- Human-level general intelligence

---

## Definition

AGI refers to a hypothetical AI capable of understanding, learning, reasoning, and applying knowledge across a broad range of tasks at roughly human-like generality.

In simple words:

> AGI would not be limited to only one task. It could learn and handle many different kinds of intellectual problems.

---

# Example

Imagine an AI that can:

```text
Learn Python
↓
Solve mathematics
↓
Understand history
↓
Plan a trip
↓
Learn a new game
↓
Write software
↓
Adapt to unfamiliar tasks
```

without needing a separate specialized model for every task.

That would be closer to AGI.

---

# ANI vs AGI Example

ANI:

```text
Chess AI
→ excellent at chess
```

AGI:

```text
Same AI
→ learns chess
→ writes code
→ solves math
→ plans a business
→ learns biology
```

---

# Important Characteristics of AGI

A true AGI would likely need abilities such as:

- reasoning
- transfer learning
- planning
- abstraction
- common sense
- adaptation
- learning from limited examples
- understanding different domains

---

# Transfer Learning Concept

Suppose an AI learns:

```text
Driving a car
```

and can use that experience to learn:

```text
Driving a truck
```

more easily.

This ability to transfer knowledge is important for general intelligence.

---

# Conceptual Diagram

```text
                  AGI
                   │
       ┌───────────┼────────────┐
       │           │            │
      Math       Language      Vision
       │           │            │
       ├──── General Reasoning ──┤
       │           │            │
     Planning     Coding      Learning
```

---

# Important Current Reality

AGI remains a research goal and concept. There is no universally accepted test proving that current AI systems possess full human-level general intelligence.

---

# Conceptual Python Analogy

We cannot build true AGI in a few lines of Python, but we can illustrate multi-task routing:

```python
def simple_general_agent(task, value):
    if task == "math":
        return value * 2

    elif task == "sentiment":
        if "good" in value.lower():
            return "Positive"
        return "Unknown"

    elif task == "weather_advice":
        if value < 10:
            return "Wear warm clothes"
        return "Normal clothes"

    return "Task not supported"


print(
    simple_general_agent(
        "math",
        5
    )
)

print(
    simple_general_agent(
        "sentiment",
        "This is good"
    )
)
```

Output:

```text
10
Positive
```

This is still not AGI.

Why?

Because the programmer manually defined each capability.

The system cannot independently learn arbitrary new intellectual tasks.

---

# Dry Run

Case:

```python
simple_general_agent(
    "math",
    5
)
```

| Step | Condition | Result |
|---|---|---|
| task == `"math"` | True | execute |
| `5 * 2` | 10 | return |

---

# 3. Artificial Super Intelligence

## Full Form

**ASI = Artificial Super Intelligence**

---

## Definition

ASI is a hypothetical AI that would exceed the best human capabilities across most or all intellectual areas.

In simple words:

> ASI would be more capable than humans at virtually every cognitive task.

Possible areas include:

- science
- mathematics
- engineering
- creativity
- strategy
- planning
- research
- decision making

---

# Conceptual Comparison

```text
ANI
Specific intelligence
        ↓
AGI
Human-like general intelligence
        ↓
ASI
Beyond human general intelligence
```

---

# Example

Imagine the world's best:

```text
Doctor
+
Engineer
+
Mathematician
+
Programmer
+
Scientist
+
Strategist
```

combined into one system—and the system performs beyond all of them.

That would represent the idea of ASI.

---

# Is ASI Available Today?

No established system is recognized as ASI.

It remains hypothetical.

---

# Possible Benefits of ASI

Theoretically, it could help solve:

- complex diseases
- climate modeling
- scientific discovery
- energy optimization
- large-scale engineering challenges

---

# Possible Risks

A highly capable system could create serious problems if:

- objectives are poorly specified
- actions conflict with human values
- humans cannot understand or control decisions
- security fails

This connects to:

> AI alignment and AI safety.

---

# Capability Comparison Table

| Feature | ANI | AGI | ASI |
|---|---|---|---|
| Meaning | Narrow AI | General AI | Super AI |
| Scope | Specific tasks | Broad tasks | Beyond humans broadly |
| Human-like generality | No | Intended yes | Beyond |
| Current status | Real | Research goal | Hypothetical |
| Example | Spam filter | Hypothetical general learner | Hypothetical superintelligence |
| Transfer ability | Limited | Strong | Extremely strong |

---

# Memory Trick

```text
ANI = ONE AREA
AGI = GENERAL AREAS
ASI = SUPERHUMAN AREAS
```

---

# Part 2: AI Types Based on Functionality

This classification asks:

> **How does the AI use information and interact with the world?**

The four categories are:

```text
Reactive Machines
      ↓
Limited Memory
      ↓
Theory of Mind
      ↓
Self-Aware AI
```

Think of increasing capability to model past/context/internal states.

---

# 4. Reactive Machines

## Definition

A **reactive machine** responds only to the current situation.

It does not maintain meaningful memory of previous experiences for future decisions.

Simple idea:

```text
Current Input
    ↓
Decision
    ↓
Action
```

No long-term history is required.

---

# Example: Simple Chess System

A reactive chess system may:

```text
Observe current board
       ↓
Calculate possible moves
       ↓
Choose best move
```

It does not need to remember:

```text
"What happened three games ago?"
```

---

# Simple Reflex Example

```python
def traffic_agent(light):
    if light == "red":
        return "STOP"

    elif light == "green":
        return "GO"

    return "WAIT"


print(
    traffic_agent("red")
)
```

Output:

```text
STOP
```

---

# Dry Run

| Input | Condition | Action |
|---|---|---|
| red | `light == "red"` | STOP |

The system reacts only to:

```text
current light
```

It does not remember past lights.

---

# Reactive Machine Diagram

```text
Environment
    ↓
Current Perception
    ↓
Reactive AI
    ↓
Action
```

---

# Characteristics

Reactive machines:

- react to current input
- usually do not store historical experience
- have no persistent internal world model
- are simple and fast
- work well in controlled environments

---

# Limitation

Suppose:

```text
Road is currently clear
```

but five seconds ago:

```text
pedestrian disappeared behind a truck
```

A purely reactive system ignoring memory could miss important context.

That motivates limited-memory AI.

---

# 5. Limited-Memory AI

## Definition

**Limited-memory AI** uses current information plus some past data or learned historical patterns to make decisions.

In simple words:

> It remembers enough past information to make better decisions.

---

# Example: Self-Driving Car

A self-driving car may use:

```text
Current vehicle speed
+
Nearby vehicle positions
+
Recent movement history
+
Lane information
```

to predict:

```text
Where another vehicle may move next
```

---

# Diagram

```text
Past Observations
       │
       ▼
Memory / Model
       │
Current Input
       │
       ▼
    AI System
       │
       ▼
    Decision
```

---

# Example

Suppose another car positions were:

```text
t1 → 50 m
t2 → 45 m
t3 → 40 m
```

The AI can infer:

```text
The car is approaching.
```

This requires recent history.

---

# Simple Formula for Velocity

If position changes over time:

\[
v=
\frac{\Delta x}
{\Delta t}
\]

Where:

- \(v\) = velocity
- \(\Delta x\) = change in position
- \(\Delta t\) = change in time

Suppose:

\[
x_1=50m
\]

\[
x_2=40m
\]

\[
\Delta t=2s
\]

Then:

\[
v=
\frac{40-50}{2}
=-5m/s
\]

Negative indicates movement toward the reference point under this coordinate convention.

AI can use this recent history to predict risk.

---

# Python Example

```python
def movement_trend(history):
    if len(history) < 2:
        return "Not enough memory"

    previous = history[-2]
    current = history[-1]

    if current < previous:
        return "Object getting closer"

    elif current > previous:
        return "Object moving away"

    return "Object stable"


distances = [
    50,
    45,
    40
]

print(
    movement_trend(
        distances
    )
)
```

Output:

```text
Object getting closer
```

---

# Dry Run

| Step | Value |
|---|---:|
| previous | 45 |
| current | 40 |
| `40 < 45` | True |
| Result | Object getting closer |

Here past information affects the current decision.

---

# Examples of Limited-Memory AI

Many machine-learning systems fit this broad category because they learn from historical data.

Examples:

- recommendation systems
- self-driving perception systems
- fraud-detection models
- forecasting models
- chat systems using recent conversation context

---

# Reactive vs Limited Memory

| Reactive | Limited Memory |
|---|---|
| Current input only | Current + past information |
| No historical context | Uses some history |
| Simpler | More adaptive |
| Reflex behavior | Pattern/context-based behavior |

---

# 6. Theory-of-Mind AI

## Definition

**Theory of Mind AI** refers to a more advanced hypothetical type of AI that could model the mental and emotional states of other agents or people.

Theory of mind in humans means understanding that other people may have:

- beliefs
- emotions
- intentions
- desires
- knowledge
- perspectives

different from your own.

---

# Example

Suppose:

```text
Person says:
"I'm fine."
```

But:

- voice sounds sad
- facial expression looks upset
- behavior is unusual

A strong theory-of-mind system might infer:

```text
Person may not actually be fine.
```

---

# Conceptual Flow

```text
Words
+
Facial Expression
+
Voice Tone
+
Situation
     ↓
Theory-of-Mind Model
     ↓
Possible Mental State
     ↓
Appropriate Response
```

---

# Real-World Potential Applications

Could be useful for:

- social robots
- healthcare assistants
- personalized tutoring
- customer-service agents
- human-robot collaboration

---

# Important Limitation

Current AI can infer emotion or intent from patterns, but this is not the same as possessing a human-like theory of mind.

That distinction is important.

---

# Conceptual Python Example

This is only a simple simulation:

```python
def estimate_emotion(
    words,
    tone
):
    words = words.lower()
    tone = tone.lower()

    if (
        "fine" in words
        and tone == "sad"
    ):
        return "Possibly upset"

    if tone == "happy":
        return "Possibly happy"

    return "Uncertain"


print(
    estimate_emotion(
        "I am fine",
        "sad"
    )
)
```

Output:

```text
Possibly upset
```

This is not real theory-of-mind intelligence. It is only rule-based inference.

---

# Dry Run

| Input | Value |
|---|---|
| words | `"I am fine"` |
| tone | `"sad"` |
| `"fine" in words` | True |
| `tone == "sad"` | True |
| Output | Possibly upset |

---

# 7. Self-Aware AI

## Definition

**Self-aware AI** is a hypothetical type of AI that would possess awareness of its own internal existence, mental states, and identity.

In simple words:

> A self-aware AI would supposedly know that it exists and understand its own internal state in a meaningful conscious sense.

---

# Conceptual Difference

Limited memory:

```text
"I remember previous data."
```

Theory of mind:

```text
"I can model what another person may think."
```

Self-aware AI:

```text
"I understand my own internal mental state."
```

The last category is hypothetical.

---

# Important Reality

There is no accepted evidence that today's AI systems are conscious or self-aware in the human sense.

Models can produce sentences such as:

```text
"I think..."
"I feel..."
"I believe..."
```

without necessarily having conscious subjective experience.

These may simply be generated language patterns.

---

# Conceptual Diagram

```text
Reactive
  ↓
Current state

Limited Memory
  ↓
Current + past

Theory of Mind
  ↓
Others' mental states

Self-Aware
  ↓
Own mental state / consciousness
```

---

# Functionality Comparison Table

| Type | Memory | Understand Others | Self Awareness | Status |
|---|---|---|---|---|
| Reactive | No meaningful history | No | No | Exists |
| Limited Memory | Yes, limited/contextual | Limited inference possible | No | Exists broadly |
| Theory of Mind | Advanced social modeling | Intended yes | No | Research concept |
| Self-Aware | Advanced | Intended yes | Intended yes | Hypothetical |

---

# 8. Capability vs Functionality

Do not mix these two classifications.

## Capability asks:

```text
How broad is the intelligence?
```

Categories:

```text
ANI
AGI
ASI
```

## Functionality asks:

```text
How does the system use information?
```

Categories:

```text
Reactive
Limited Memory
Theory of Mind
Self-Aware
```

---

# Example

A chess AI could be:

```text
Capability:
ANI
```

and:

```text
Functionality:
Reactive
```

A self-driving system could be:

```text
Capability:
ANI
```

and broadly:

```text
Functionality:
Limited Memory
```

So one AI system can have one label from each classification.

---

# 9. Complete Classification Diagram

```text
                    ARTIFICIAL INTELLIGENCE
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
       By Capability                      By Functionality
            │                                   │
     ┌──────┼──────┐                 ┌──────────┼───────────┐
     │      │      │                 │          │           │
    ANI    AGI    ASI             Reactive   Limited     Theory
                                          Memory       of Mind
                                                         │
                                                         ▼
                                                    Self-Aware
```

---

# 10. Intelligence Progression

A conceptual progression:

```text
TASK RANGE

ANI
│
│ Specific tasks
▼

AGI
│
│ General human-like tasks
▼

ASI
│
│ Beyond human capability
▼
```

Functionality progression:

```text
INTERNAL MODEL

Reactive
   ↓
Limited Memory
   ↓
Theory of Mind
   ↓
Self-Aware
```

---

# 11. Important Formula: Expected Utility

For more advanced intelligent behavior, an agent may choose the action with the highest expected utility:

\[
a^*=
\arg\max_a
E[U|a]
\]

Where:

- \(a\) = possible action
- \(a^*\) = best action
- \(U\) = utility/value
- \(E\) = expected value

Example:

| Action | Expected Utility |
|---|---:|
| Stop | 90 |
| Continue | 20 |
| Turn | 60 |

Best action:

```text
Stop
```

because:

\[
90 = \max(90,20,60)
\]

This formula is not specific to ANI/AGI/ASI, but it helps understand intelligent decision making.

---

# 12. Memory Formula Concept

A limited-memory system may use recent observations:

\[
M_t=
\{x_{t-n},...,x_{t-1},x_t\}
\]

Where:

- \(M_t\) = available memory at time \(t\)
- \(x_t\) = current observation
- \(n\) = number of past observations retained

Then decision:

\[
a_t=f(M_t)
\]

Meaning:

> Current action depends on current and recent observations.

---

# Example

Suppose:

```text
Mₜ = [50, 45, 40]
```

representing recent distances.

The model learns:

```text
Distance decreasing
→ object approaching
→ brake
```

---

# 13. Practical Combined Python Example

Let's simulate reactive and limited-memory behavior.

```python
class ReactiveAgent:
    def act(self, current_distance):
        if current_distance < 10:
            return "BRAKE"

        return "MOVE"


class LimitedMemoryAgent:
    def __init__(self):
        self.history = []

    def act(self, current_distance):
        self.history.append(
            current_distance
        )

        if current_distance < 10:
            return "BRAKE"

        if len(self.history) >= 2:
            previous = self.history[-2]

            if current_distance < previous:
                return "SLOW_DOWN"

        return "MOVE"


reactive = ReactiveAgent()

memory_agent = LimitedMemoryAgent()

distances = [
    30,
    20,
    15
]

for distance in distances:
    print(
        "Distance:",
        distance,
        "Reactive:",
        reactive.act(distance),
        "Limited Memory:",
        memory_agent.act(distance)
    )
```

Possible output:

```text
Distance: 30 Reactive: MOVE Limited Memory: MOVE
Distance: 20 Reactive: MOVE Limited Memory: SLOW_DOWN
Distance: 15 Reactive: MOVE Limited Memory: SLOW_DOWN
```

---

# Dry Run

## Step 1

Distance:

```text
30
```

Reactive:

```text
30 < 10? No
→ MOVE
```

Limited memory:

```text
history = [30]
No previous value
→ MOVE
```

---

## Step 2

Distance:

```text
20
```

Reactive:

```text
20 < 10? No
→ MOVE
```

Limited memory:

```text
history = [30,20]

20 < 30
→ Object approaching
→ SLOW_DOWN
```

---

## Step 3

Distance:

```text
15
```

Limited memory:

```text
history = [30,20,15]

15 < 20
→ SLOW_DOWN
```

This demonstrates why memory can improve decisions.

---

# 14. Real-World Examples Summary

## ANI

```text
Spam filter
Recommendation system
Face recognition
Speech recognition
```

## AGI

```text
Hypothetical broad human-level AI
```

## ASI

```text
Hypothetical intelligence beyond humans
```

## Reactive Machine

```text
Rule-based current-state system
Some classical game-playing systems
```

## Limited Memory

```text
Self-driving perception
Recommendation models
Fraud detection
Forecasting
```

## Theory of Mind

Potential:

```text
Social robots
Emotionally adaptive assistants
```

## Self-Aware

```text
Hypothetical conscious AI
```

---

# 15. Common Mistakes

## Mistake 1: ANI means weak performance

Wrong.

ANI can outperform humans in a specific task.

Example:

```text
Chess AI
```

can be extremely strong.

"Narrow" refers to scope, not quality.

---

## Mistake 2: Modern LLMs automatically equal AGI

Do not assume that.

Broad capability does not by itself prove human-level general intelligence.

---

## Mistake 3: AGI and ASI are the same

No.

```text
AGI
≈ broad human-like generality

ASI
> human capability
```

---

## Mistake 4: Reactive AI learns from history

Reactive machines typically respond to present input rather than depending on stored experience.

---

## Mistake 5: Limited memory means permanent memory

No.

It may use:

- temporary context
- recent observations
- learned historical data

but not necessarily permanent human-like memory.

---

## Mistake 6: Emotion classification = Theory of Mind

Not necessarily.

A system detecting:

```text
smile → happy
```

does not automatically understand beliefs, intentions and perspectives.

---

## Mistake 7: LLM saying "I feel" means self-awareness

No.

Generating language about feelings does not prove conscious experience.

---

## Mistake 8: Capability and functionality are the same classification

Incorrect.

Example:

```text
ANI + Limited Memory
```

can describe the same system.

---

# 16. Interview Questions and Answers

## Q1. What are the types of AI based on capability?

Three major categories are:

1. ANI
2. AGI
3. ASI

---

## Q2. What is ANI?

Artificial Narrow Intelligence is designed to perform one specific task or a limited set of tasks.

---

## Q3. Give examples of ANI.

Examples:

- spam filters
- recommendation systems
- face recognition
- chess AI

---

## Q4. Is ANI weak?

Not necessarily.

ANI can outperform humans within its specialized domain.

---

## Q5. What is AGI?

Artificial General Intelligence is the idea of AI that can learn, reason and perform a broad range of intellectual tasks with human-like generality.

---

## Q6. Does AGI exist?

AGI remains a research goal; there is no universally accepted system proven to possess full human-level general intelligence.

---

## Q7. What is ASI?

Artificial Super Intelligence is a hypothetical AI whose intellectual capability exceeds humans broadly.

---

## Q8. ANI vs AGI?

ANI:

```text
Specific tasks
```

AGI:

```text
General tasks across domains
```

---

## Q9. AGI vs ASI?

AGI is intended to reach broad human-level intelligence.

ASI would exceed human intelligence.

---

# 17. Functionality Interview Questions

## Q10. What are the AI types based on functionality?

They are:

1. Reactive machines
2. Limited-memory AI
3. Theory-of-mind AI
4. Self-aware AI

---

## Q11. What is a reactive machine?

A reactive AI responds to current observations without relying on meaningful stored history.

---

## Q12. Give an example of reactive AI.

A simple traffic-light agent or classical current-state game-playing system.

---

## Q13. What is limited-memory AI?

AI that uses current information plus some past observations or learned historical data for decisions.

---

## Q14. Give examples of limited-memory AI.

Examples:

- self-driving systems
- fraud detection
- recommendations
- forecasting models

---

## Q15. Reactive vs limited-memory AI?

Reactive AI uses current input.

Limited-memory AI also uses some past information.

---

## Q16. What is Theory-of-Mind AI?

A hypothetical advanced AI capable of modeling beliefs, emotions, intentions and mental states of others.

---

## Q17. Does emotion detection equal Theory of Mind?

No.

Emotion classification is only one narrow signal and does not prove full understanding of beliefs or intentions.

---

## Q18. What is self-aware AI?

A hypothetical AI possessing awareness of its own internal mental state or existence.

---

## Q19. Does self-aware AI exist today?

There is no accepted evidence that current AI systems possess human-like self-awareness.

---

# 18. Scenario-Based Interview Questions

## Q20. A spam filter is which AI type?

Capability:

```text
ANI
```

Functionality:

usually treated as:

```text
Limited-memory/data-driven AI
```

because it learns from historical examples, although a purely rule-based version could be reactive.

---

## Q21. A chess engine sees the board and chooses a move without storing game history. What type?

Capability:

```text
ANI
```

Functionality:

```text
Reactive machine
```

---

## Q22. A self-driving system analyzes the last few seconds of nearby vehicle movement. What type?

Capability:

```text
ANI
```

Functionality:

```text
Limited-memory AI
```

---

## Q23. A robot understands that a child falsely believes a toy is in another room. What category would this represent?

Conceptually:

```text
Theory-of-Mind AI
```

because it models another person's belief.

---

## Q24. An AI says, "I am sad." Does that prove self-awareness?

No.

Text generation is not evidence of subjective conscious experience.

---

# 19. Comparison Table for Fast Revision

| Type | Core Idea | Example/Status |
|---|---|---|
| ANI | Specialized intelligence | Real |
| AGI | Broad human-like intelligence | Research goal |
| ASI | Beyond-human intelligence | Hypothetical |
| Reactive | Current input only | Real |
| Limited Memory | Current + past data | Real |
| Theory of Mind | Models others' mental states | Research concept |
| Self-Aware | Awareness of own mental state | Hypothetical |

---

# 20. Easy Memory Tricks

## Capability

Remember:

```text
N → G → S
```

Meaning:

```text
Narrow
General
Super
```

So:

```text
ANI → One/few tasks
AGI → Many general tasks
ASI → Beyond humans
```

---

## Functionality

Remember:

```text
R → M → T → S
```

Meaning:

```text
Reactive
Memory
Theory of Mind
Self-Aware
```

Or:

> **React → Remember → Understand Others → Understand Self**

---

# 21. Concept Map

```text
                 TYPES OF AI
                     │
       ┌─────────────┴─────────────┐
       │                           │
   Capability                  Functionality
       │                           │
   ┌───┼───┐              ┌────────┼──────────┐
   │   │   │              │        │          │
  ANI AGI ASI         Reactive  Limited    Theory
                               Memory      of Mind
                                             │
                                             ▼
                                        Self-Aware
```

---

# 22. Final Last-Minute Revision

### ANI

> AI specialized for one or a limited set of tasks.

### AGI

> Hypothetical AI with broad human-like general intellectual capability.

### ASI

> Hypothetical AI more capable than humans across intellectual domains.

### Reactive Machine

> AI that reacts mainly to the current state.

### Limited Memory

> AI that uses current information and some past information.

### Theory of Mind

> Hypothetical AI capable of modeling others' beliefs, emotions and intentions.

### Self-Aware AI

> Hypothetical AI with meaningful awareness of its own internal existence or mental state.

---

# Best Interview Answer: “Explain the Types of AI”

> **Artificial Intelligence can be classified based on capability and functionality. Based on capability, ANI is task-specific intelligence and represents most real-world AI systems today. AGI refers to hypothetical broad human-level general intelligence, while ASI refers to hypothetical intelligence exceeding humans across most intellectual areas. Based on functionality, reactive machines respond mainly to current inputs, while limited-memory systems also use historical or recent information. Theory-of-mind AI would model the beliefs, emotions and intentions of other entities, while self-aware AI would possess awareness of its own internal state. The last two categories remain largely research or hypothetical concepts.**

The easiest final diagram to remember is:

```text
CAPABILITY:
ANI → AGI → ASI
Specific → General → Superhuman

FUNCTIONALITY:
Reactive → Limited Memory → Theory of Mind → Self-Aware
React → Remember → Understand Others → Understand Self
```
