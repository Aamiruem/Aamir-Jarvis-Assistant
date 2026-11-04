> **You asked:**
>
> Phase 9: Hyperparameter Tuning
> Grid Search
> Random Search
> Bayesian Optimization
> Optuna
> Hyperopt

I’ll explain hyperparameter tuning from interview basics to practical code: what it is, why it matters, Grid Search, Random Search, Bayesian Optimization, Optuna, Hyperopt, and comparison tables.

# Phase 9: Hyperparameter Tuning  
# Grid Search, Random Search, Bayesian Optimization, Optuna, Hyperopt

Hyperparameter tuning means finding the **best settings for a machine learning model**.

Simple meaning:

```text id="hudder"
Model + Best Hyperparameters = Better Performance
```

Example:

```text id="57pp5h"
Random Forest hyperparameters:
n_estimators
max_depth
min_samples_split
max_features
```

---

# 1. Parameter vs Hyperparameter

| Parameter | Hyperparameter |
|---|---|
| Learned by model automatically | Set before training |
| Example: coefficients in Linear Regression | Example: max_depth in Decision Tree |
| Model finds it from data | Data scientist chooses/tunes it |

## Example

In Linear Regression:

```text id="7dj6q2"
Parameters:
Slope
Intercept
```

In Random Forest:

```text id="6c8fcg"
Hyperparameters:
n_estimators
max_depth
min_samples_split
```

## Interview Answer

Parameters are learned by the model during training, while hyperparameters are set before training and control how the model learns.

---

# 2. What is Hyperparameter Tuning?

## Easy Definition

Hyperparameter tuning is the process of trying different hyperparameter values and selecting the best combination based on validation performance.

Example:

```text id="xnvmfc"
Decision Tree max_depth:
2, 3, 4, 5, 6
```

We train and test the model with different values, then choose the best one.

## Why Hyperparameter Tuning?

It helps to:

```text id="gspwoq"
Improve accuracy
Reduce overfitting
Reduce underfitting
Improve generalization
Find best model configuration
```

## Interview Answer

Hyperparameter tuning is the process of selecting the best hyperparameter values for a model to improve performance on unseen data.

---

# 3. Common Hyperparameters by Model

| Model | Important Hyperparameters |
|---|---|
| Logistic Regression | `C`, `penalty`, `solver` |
| KNN | `n_neighbors`, `weights`, `metric` |
| Decision Tree | `max_depth`, `min_samples_split`, `criterion` |
| Random Forest | `n_estimators`, `max_depth`, `max_features` |
| SVM | `C`, `kernel`, `gamma` |
| XGBoost | `n_estimators`, `learning_rate`, `max_depth`, `subsample` |
| Neural Network | `learning_rate`, `batch_size`, `epochs`, `hidden_layers` |

---

# 4. Grid Search

## Easy Definition

Grid Search tries **all possible combinations** of given hyperparameter values.

Simple meaning:

```text id="2w4pnf"
Try everything and choose the best.
```

Scikit-learn’s `GridSearchCV` optimizes estimator parameters using cross-validated grid search over a parameter grid. citeturn162473search0

---

## Example

Suppose we tune Decision Tree:

```python id="0sl8la"
max_depth = [2, 3, 4]
min_samples_split = [2, 5]
```

Grid Search tries:

| Combination | max_depth | min_samples_split |
|---|---:|---:|
| 1 | 2 | 2 |
| 2 | 2 | 5 |
| 3 | 3 | 2 |
| 4 | 3 | 5 |
| 5 | 4 | 2 |
| 6 | 4 | 5 |

Total combinations:

```text id="u5ufkt"
3 × 2 = 6 combinations
```

---

## Grid Search Code

```python id="yx0jpb"
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

# Load data
iris = load_iris()
X = iris.data
y = iris.target

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42
)

# Model
model = DecisionTreeClassifier(random_state=42)

# Hyperparameter grid
param_grid = {
    "max_depth": [2, 3, 4, 5],
    "min_samples_split": [2, 5, 10],
    "criterion": ["gini", "entropy"]
}

# Grid Search
grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,
    scoring="accuracy"
)

grid_search.fit(X_train, y_train)

print("Best Parameters:", grid_search.best_params_)
print("Best CV Score:", grid_search.best_score_)

# Test performance
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)

print("Test Accuracy:", accuracy_score(y_test, y_pred))
```

---

## Advantages of Grid Search

```text id="r0ur1w"
Simple to understand
Tries all combinations
Good for small search space
Reliable if parameter grid is small
```

## Limitations

```text id="zm9ak5"
Slow for large search space
Computationally expensive
May waste time on unimportant combinations
Not ideal for deep learning or large models
```

## When to Use Grid Search?

Use Grid Search when:

```text id="d03d0b"
Dataset is small or medium
Search space is small
You want exhaustive checking
Training time is manageable
```

## Interview Answer

Grid Search is a hyperparameter tuning technique that tries all possible combinations from a predefined parameter grid and selects the best combination using cross-validation.

---

# 5. Random Search

## Easy Definition

Random Search randomly selects hyperparameter combinations from a given search space.

Simple meaning:

```text id="ia45me"
Do not try everything.
Try random combinations and choose the best.
```

Scikit-learn explains that `RandomizedSearchCV` samples a fixed number of parameter settings from specified distributions, controlled by `n_iter`; this trades off runtime against solution quality. citeturn162473search2

---

## Example

Suppose total possible combinations are:

```text id="wpqldk"
1000
```

Random Search may try only:

```text id="wxnnsr"
50 random combinations
```

This saves time.

---

## Random Search Code

```python id="20z157"
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from scipy.stats import randint

model = RandomForestClassifier(random_state=42)

param_dist = {
    "n_estimators": randint(50, 300),
    "max_depth": randint(2, 20),
    "min_samples_split": randint(2, 20),
    "max_features": ["sqrt", "log2", None]
}

random_search = RandomizedSearchCV(
    estimator=model,
    param_distributions=param_dist,
    n_iter=20,
    cv=5,
    scoring="accuracy",
    random_state=42,
    n_jobs=-1
)

random_search.fit(X_train, y_train)

print("Best Parameters:", random_search.best_params_)
print("Best CV Score:", random_search.best_score_)
```

---

## Grid Search vs Random Search

| Grid Search | Random Search |
|---|---|
| Tries all combinations | Tries random combinations |
| Slow for large space | Faster |
| Good for small search space | Good for large search space |
| Exhaustive | Not exhaustive |
| More expensive | Less expensive |

Scikit-learn’s user guide also states that GridSearchCV exhaustively considers all parameter combinations, while RandomizedSearchCV samples a given number of candidates from a parameter space. citeturn162473search1

---

## Advantages of Random Search

```text id="n6vdo3"
Faster than Grid Search
Good for large search space
Can find good results with fewer trials
Works well when only some hyperparameters matter
```

## Limitations

```text id="krg45u"
May miss best combination
Result depends on randomness
Needs enough iterations
```

## When to Use Random Search?

Use Random Search when:

```text id="kogr7o"
Search space is large
Training is expensive
You want quick good results
You do not need to try every combination
```

## Interview Answer

Random Search is a hyperparameter tuning technique that randomly samples combinations from a search space. It is faster than Grid Search and useful for large search spaces.

---

# 6. Bayesian Optimization

## Easy Definition

Bayesian Optimization is a smart tuning method that uses previous results to decide the next best hyperparameter combination.

Simple meaning:

```text id="s741mh"
Grid Search tries everything.
Random Search tries randomly.
Bayesian Optimization learns from past trials and chooses smart next trials.
```

---

## Main Idea

Bayesian Optimization works like this:

```text id="jykrjr"
1. Try some hyperparameter values.
2. Check model performance.
3. Build a probability model of what works well.
4. Choose the next promising hyperparameter values.
5. Repeat.
```

---

## Real-Life Example

Suppose you are preparing tea.

First try:

```text id="mnz825"
Sugar = 1 spoon → taste is low
Sugar = 2 spoons → taste is good
Sugar = 5 spoons → too sweet
```

Next time, you will not randomly try 10 spoons. You will try near 2 spoons.

That is the idea of Bayesian Optimization.

---

## Important Terms

| Term | Easy Meaning |
|---|---|
| Objective Function | Function to optimize |
| Search Space | Possible hyperparameter values |
| Surrogate Model | Approximate model of performance |
| Acquisition Function | Decides next trial |
| Trial | One hyperparameter experiment |

---

## Advantages

```text id="gd6mkf"
Smarter than Grid and Random Search
Good for expensive models
Needs fewer trials
Learns from previous results
```

## Limitations

```text id="zyzxpr"
More complex
Needs extra library
Can be slower per trial due to optimization logic
May need careful search space design
```

## When to Use Bayesian Optimization?

Use Bayesian Optimization when:

```text id="yamvq2"
Model training is expensive
Search space is large
You want efficient tuning
You want better results with fewer trials
```

## Interview Answer

Bayesian Optimization is a smart hyperparameter tuning method that uses previous trial results to choose the next promising hyperparameter values.

---

# 7. Optuna

## Easy Definition

Optuna is a Python framework for automatic hyperparameter optimization.

Simple meaning:

```text id="x29ye2"
Optuna automatically searches for the best hyperparameters.
```

Optuna describes itself as an automatic hyperparameter optimization framework for machine learning, using an imperative “define-by-run” style API. citeturn378556search2

---

## Install Optuna

```bash id="00nb94"
pip install optuna
```

---

## Optuna Main Concepts

| Concept | Meaning |
|---|---|
| Study | Full optimization process |
| Trial | One experiment |
| Objective Function | Function to minimize or maximize |
| Suggest | Choose hyperparameter value |
| Best Params | Best hyperparameters found |

---

## Optuna Code

```python id="c31zp3"
import optuna

from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

# Load data
iris = load_iris()
X = iris.data
y = iris.target

def objective(trial):
    # Suggest hyperparameters
    n_estimators = trial.suggest_int("n_estimators", 50, 300)
    max_depth = trial.suggest_int("max_depth", 2, 20)
    min_samples_split = trial.suggest_int("min_samples_split", 2, 20)

    # Model
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        random_state=42
    )

    # Cross-validation score
    score = cross_val_score(
        model,
        X,
        y,
        cv=5,
        scoring="accuracy"
    ).mean()

    return score

# Create study
study = optuna.create_study(direction="maximize")

# Run optimization
study.optimize(objective, n_trials=50)

print("Best Score:", study.best_value)
print("Best Parameters:", study.best_params)
```

---

## Optuna with Pruning

Pruning means stopping bad trials early.

Simple meaning:

```text id="x7qt39"
If a trial is performing badly, stop it early and save time.
```

Optuna’s GitHub page also describes its define-by-run API as useful for dynamically constructing hyperparameter search spaces. citeturn378556search5

---

## Advantages of Optuna

```text id="2solqu"
Easy to use
Smart search
Supports pruning
Good for machine learning and deep learning
Works with scikit-learn, XGBoost, LightGBM, PyTorch, TensorFlow
```

## Limitations

```text id="qgglio"
Needs extra package
Need to write objective function
Search result depends on search space quality
```

## When to Use Optuna?

Use Optuna when:

```text id="6rwrag"
You want smart tuning
You have many hyperparameters
Model training is costly
You want pruning
You are working with ML or deep learning projects
```

## Interview Answer

Optuna is an automatic hyperparameter optimization framework. It uses an objective function and trials to search for the best hyperparameters efficiently.

---

# 8. Hyperopt

## Easy Definition

Hyperopt is a Python library used for hyperparameter optimization.

Simple meaning:

```text id="ctezbr"
Hyperopt searches for best hyperparameters using smart optimization algorithms.
```

Hyperopt’s documentation says it was designed to accommodate Bayesian optimization algorithms. citeturn378556search3

---

## Install Hyperopt

```bash id="gnmbbo"
pip install hyperopt
```

---

## Hyperopt Main Concepts

| Concept | Meaning |
|---|---|
| Objective Function | Function to minimize |
| Search Space | Hyperparameter ranges |
| Trials | Stores experiment results |
| fmin | Function that runs optimization |
| tpe.suggest | Tree-structured Parzen Estimator search |

Hyperopt’s wiki describes its hyperparameter optimization algorithms as adaptive exploration strategies that replace normal sampling logic. citeturn378556search6

---

## Hyperopt Code

```python id="vuy9e2"
from hyperopt import fmin, tpe, hp, Trials, STATUS_OK

from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

# Load data
iris = load_iris()
X = iris.data
y = iris.target

# Search space
space = {
    "n_estimators": hp.quniform("n_estimators", 50, 300, 10),
    "max_depth": hp.quniform("max_depth", 2, 20, 1),
    "min_samples_split": hp.quniform("min_samples_split", 2, 20, 1)
}

# Objective function
def objective(params):
    model = RandomForestClassifier(
        n_estimators=int(params["n_estimators"]),
        max_depth=int(params["max_depth"]),
        min_samples_split=int(params["min_samples_split"]),
        random_state=42
    )

    score = cross_val_score(
        model,
        X,
        y,
        cv=5,
        scoring="accuracy"
    ).mean()

    # Hyperopt minimizes, so return negative accuracy
    return {
        "loss": -score,
        "status": STATUS_OK
    }

trials = Trials()

best = fmin(
    fn=objective,
    space=space,
    algo=tpe.suggest,
    max_evals=50,
    trials=trials
)

print("Best Parameters:", best)
```

---

## Why Return Negative Accuracy?

Hyperopt minimizes loss.

But accuracy should be maximized.

So we use:

```text id="ydm4fo"
loss = -accuracy
```

Example:

```text id="pqcmd7"
Accuracy = 0.95
Loss = -0.95
```

The lower loss is better.

---

## Advantages of Hyperopt

```text id="egrjjo"
Supports Bayesian optimization
Good for complex search spaces
Can be more efficient than Grid Search
Works with ML models
```

## Limitations

```text id="webzxt"
Syntax is slightly more complex than Optuna
Need to convert some values to int
Minimization style can confuse beginners
```

## When to Use Hyperopt?

Use Hyperopt when:

```text id="ibxeep"
You want Bayesian-style tuning
You have complex search space
You want efficient search
You are comfortable writing objective functions
```

## Interview Answer

Hyperopt is a Python library for hyperparameter optimization. It uses search spaces, objective functions, and algorithms like TPE to find good hyperparameters efficiently.

---

# 9. Complete Comparison Table

| Method | Search Style | Best For | Speed | Main Limitation |
|---|---|---|---|---|
| Grid Search | Exhaustive | Small search space | Slow | Tries every combination |
| Random Search | Random sampling | Large search space | Faster | May miss best values |
| Bayesian Optimization | Smart adaptive search | Expensive models | Efficient | More complex |
| Optuna | Automatic smart tuning | ML/DL projects | Efficient | Requires objective function |
| Hyperopt | Bayesian-style tuning | Complex spaces | Efficient | More complex syntax |

---

# 10. Which Tuning Method Should You Use?

| Situation | Best Method |
|---|---|
| Very small parameter grid | Grid Search |
| Large search space | Random Search |
| Expensive model training | Bayesian Optimization |
| Modern ML tuning | Optuna |
| Complex search space | Hyperopt |
| Beginner level | Grid Search / Random Search |
| Interview project | Random Search + Optuna |

---

# 11. Complete Practical Example: Compare Grid Search and Random Search

```python id="f6cxkf"
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split, GridSearchCV, RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from scipy.stats import randint

# Load data
iris = load_iris()
X = iris.data
y = iris.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Model
model = RandomForestClassifier(random_state=42)

# -------------------------
# Grid Search
# -------------------------
grid_params = {
    "n_estimators": [50, 100, 150],
    "max_depth": [3, 5, 7],
    "min_samples_split": [2, 5]
}

grid = GridSearchCV(
    model,
    grid_params,
    cv=5,
    scoring="accuracy",
    n_jobs=-1
)

grid.fit(X_train, y_train)

print("Grid Search Best Params:", grid.best_params_)
print("Grid Search Best Score:", grid.best_score_)

# -------------------------
# Random Search
# -------------------------
random_params = {
    "n_estimators": randint(50, 300),
    "max_depth": randint(2, 20),
    "min_samples_split": randint(2, 20)
}

random_search = RandomizedSearchCV(
    model,
    random_params,
    n_iter=20,
    cv=5,
    scoring="accuracy",
    random_state=42,
    n_jobs=-1
)

random_search.fit(X_train, y_train)

print("Random Search Best Params:", random_search.best_params_)
print("Random Search Best Score:", random_search.best_score_)

# Final test
best_model = random_search.best_estimator_
y_pred = best_model.predict(X_test)

print("Final Test Accuracy:", accuracy_score(y_test, y_pred))
```

---

# 12. Best Practices for Hyperparameter Tuning

```text id="ujks0w"
1. First train a baseline model.
2. Tune only important hyperparameters.
3. Use cross-validation.
4. Do not tune on test data.
5. Keep test data only for final evaluation.
6. Start with Random Search.
7. Use Optuna for advanced tuning.
8. Avoid too large search space.
9. Use proper scoring metric.
10. Save best parameters and model.
```

---

# 13. Data Leakage Warning

Do not use test data during tuning.

Wrong:

```text id="z9vsq5"
Tune model on test data
```

Correct:

```text id="fk7e60"
Train data → model training and cross-validation tuning
Test data → final evaluation only
```

Why?

```text id="i4y3c3"
If test data is used during tuning, final accuracy becomes fake.
```

---

# 14. Most Asked Interview Questions

## Q1. What is hyperparameter tuning?

Hyperparameter tuning is the process of finding the best hyperparameter values for a model to improve performance.

---

## Q2. Parameter vs hyperparameter?

```text id="57vy1f"
Parameter is learned by the model.
Hyperparameter is set before training.
```

---

## Q3. What is Grid Search?

Grid Search tries all possible combinations from a predefined hyperparameter grid.

---

## Q4. What is Random Search?

Random Search randomly samples hyperparameter combinations from a search space.

---

## Q5. Grid Search vs Random Search?

```text id="e4sb7x"
Grid Search tries all combinations and is slower.
Random Search tries selected random combinations and is faster.
```

---

## Q6. What is Bayesian Optimization?

Bayesian Optimization is a smart tuning technique that uses previous trial results to decide the next best hyperparameter values.

---

## Q7. What is Optuna?

Optuna is an automatic hyperparameter optimization framework that uses trials and objective functions to find best hyperparameters.

---

## Q8. What is Hyperopt?

Hyperopt is a Python library for hyperparameter optimization. It supports Bayesian-style optimization using algorithms like TPE.

---

## Q9. Why should we use cross-validation in tuning?

Cross-validation gives a more reliable estimate of model performance and reduces dependency on one train-validation split.

---

## Q10. Why should test data not be used in tuning?

Because test data should represent unseen data. If we tune using test data, model performance becomes biased and unrealistic.

---

# 15. Final Summary Table

| Concept | Easy Meaning | Interview Point |
|---|---|---|
| Hyperparameter | Setting chosen before training | Controls model learning |
| Hyperparameter Tuning | Finding best settings | Improves performance |
| Grid Search | Tries all combinations | Accurate but slow |
| Random Search | Tries random combinations | Faster for large search |
| Bayesian Optimization | Learns from previous trials | Smart and efficient |
| Optuna | Modern automatic tuning library | Easy, flexible, supports pruning |
| Hyperopt | Bayesian optimization library | Uses search space and TPE |
| Cross-validation | Multiple validation splits | Reliable tuning |
| Data Leakage | Test data used during tuning | Must avoid |

---

# Final Interview Summary

```text id="3v06ts"
Hyperparameter tuning is the process of finding the best model settings before training.

Grid Search tries all combinations from a predefined grid, so it is simple but slow.

Random Search tries random combinations, so it is faster and useful for large search spaces.

Bayesian Optimization is smarter because it learns from previous trials and chooses better next trials.

Optuna is a modern automatic hyperparameter optimization framework that uses studies, trials, and objective functions.

Hyperopt is another optimization library that uses search spaces and algorithms like TPE.

In real projects, I first build a baseline model, then use Random Search or Optuna with cross-validation, and finally evaluate the best model only once on the test data.
```
