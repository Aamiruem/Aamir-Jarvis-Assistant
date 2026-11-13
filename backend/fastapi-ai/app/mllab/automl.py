"""AutoML: try several algorithms the right way, keep the best one, and report honestly.

    1. split      80% train / 20% test (stratified for classes). The test rows are not touched
                  until the very end, so the final scores are an honest estimate for new data.
    2. pipeline   numbers: fill gaps with the median + scale; text: one-hot categories (missing is
                  its own category). Fitted inside each fold, so nothing leaks from validation rows.
    3. compare    linear / logistic, KNN, decision tree, random forest, gradient boosting, XGBoost and
                  SVM, each with k-fold cross-validation (mean ± spread, plus the training score).
    4. tune       randomized hyperparameter search on the winner.
    5. test       score once on the held-out test rows, next to a naive baseline it must beat;
                  over/underfitting check; permutation feature importance; error band.
    6. explore    PCA (how many directions carry 90% of the variation) and K-means segments.
"""
import time
from collections.abc import Callable

import numpy as np
from sklearn.base import clone
from sklearn.cluster import KMeans
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.ensemble import (
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    r2_score,
    roc_auc_score,
    root_mean_squared_error,
    silhouette_score,
)
from sklearn.model_selection import KFold, RandomizedSearchCV, StratifiedKFold, cross_validate, train_test_split
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor

from app.mllab.data import Table, as_float

try:
    from xgboost import XGBClassifier, XGBRegressor
except Exception:  # not installed, or its DLL blocked (Windows Smart App Control): skip it
    XGBClassifier = XGBRegressor = None

SEED = 0
Progress = Callable[[str, int], None]


# ---------- preprocessing (module-level functions so the pipeline can be saved with joblib) ----------

def to_float(X: np.ndarray) -> np.ndarray:
    return np.column_stack([as_float(X[:, j]) for j in range(X.shape[1])]) if X.shape[1] else np.empty((len(X), 0))


def to_text(X: np.ndarray) -> np.ndarray:
    return np.vectorize(lambda v: "(missing)" if v is None else str(v), otypes=[object])(X) if X.size else X


def build_preprocessor(kinds: list[str], max_categories: int = 30) -> ColumnTransformer:
    num = [i for i, k in enumerate(kinds) if k == "numeric"]
    cat = [i for i, k in enumerate(kinds) if k == "categorical"]
    parts = []
    if num:
        parts.append(("num", Pipeline([
            ("float", FunctionTransformer(to_float)),
            ("impute", SimpleImputer(strategy="median", add_indicator=True)),
            ("scale", StandardScaler()),
        ]), num))
    if cat:
        parts.append(("cat", Pipeline([
            ("text", FunctionTransformer(to_text)),
            ("onehot", OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=5, max_categories=max_categories, sparse_output=False)),
        ]), cat))
    return ColumnTransformer(parts)


# ---------- the algorithms ----------

def candidates(task: str, n_rows: int) -> dict:
    reg = task == "regression"
    models = {
        "Linear regression (Ridge)" if reg else "Logistic regression": Ridge() if reg else LogisticRegression(max_iter=3000),
        "K-nearest neighbors": KNeighborsRegressor(15) if reg else KNeighborsClassifier(15),
        "Decision tree": (DecisionTreeRegressor if reg else DecisionTreeClassifier)(max_depth=10, min_samples_leaf=5, random_state=SEED),
        "Random forest": (RandomForestRegressor if reg else RandomForestClassifier)(
            n_estimators=200, min_samples_leaf=2, n_jobs=-1, random_state=SEED),
        "Gradient boosting": (HistGradientBoostingRegressor if reg else HistGradientBoostingClassifier)(random_state=SEED),
    }
    if XGBRegressor is not None:
        common = dict(n_estimators=400, learning_rate=0.05, max_depth=6, subsample=0.9, colsample_bytree=0.9,
                      n_jobs=-1, random_state=SEED, verbosity=0)
        models["XGBoost"] = XGBRegressor(**common) if reg else XGBClassifier(**common, eval_metric="logloss")
    if n_rows <= 5000:  # kernel SVMs get slow beyond a few thousand rows
        models["Support vector machine"] = SVR() if reg else SVC()
    return models


SEARCH_SPACE = {
    "Linear regression (Ridge)": {"alpha": [0.01, 0.1, 1, 10, 100]},
    "Logistic regression": {"C": [0.01, 0.1, 1, 10, 100]},
    "K-nearest neighbors": {"n_neighbors": [3, 5, 9, 15, 25, 41], "weights": ["uniform", "distance"]},
    "Decision tree": {"max_depth": [4, 6, 8, 12, 16, None], "min_samples_leaf": [1, 2, 5, 10, 20]},
    "Random forest": {"n_estimators": [200, 400], "max_depth": [None, 12, 20], "min_samples_leaf": [1, 2, 4],
                      "max_features": ["sqrt", 0.5, 1.0]},
    "Gradient boosting": {"learning_rate": [0.03, 0.06, 0.1, 0.2], "max_leaf_nodes": [15, 31, 63],
                          "min_samples_leaf": [10, 20, 40], "l2_regularization": [0.0, 0.1, 1.0]},
    "XGBoost": {"n_estimators": [300, 600, 900], "learning_rate": [0.03, 0.06, 0.1], "max_depth": [4, 6, 8],
                "subsample": [0.8, 1.0], "colsample_bytree": [0.7, 0.9, 1.0], "min_child_weight": [1, 3, 5]},
    "Support vector machine": {"C": [0.3, 1, 3, 10, 30], "gamma": ["scale", 0.3, 0.1, 0.03]},
}


def _scoring(task: str, n_classes: int) -> tuple[dict, str]:
    if task == "regression":
        return {"r2": "r2", "mae": "neg_mean_absolute_error", "rmse": "neg_root_mean_squared_error"}, "r2"
    scoring = {"accuracy": "accuracy", "f1": "f1_macro"}
    if n_classes == 2:
        scoring["roc_auc"] = "roc_auc"
    return scoring, "f1"


def _r(x, digits=4):
    return None if x is None else round(float(x), digits)


# ---------- the run ----------

def detect_task(table: Table, target: str) -> str:
    if table.kinds[target] == "numeric":
        y = as_float(table.column(target))
        if len(np.unique(y[~np.isnan(y)])) > 15:
            return "regression"
    return "classification"


def train(
    table: Table,
    target: str,
    *,
    cv_folds: int = 5,
    tune_iter: int = 12,
    max_cv_rows: int = 20_000,
    max_categories: int = 30,
    only: list[str] | None = None,
    progress: Progress | None = None,
) -> tuple[dict, Pipeline, dict]:
    """Returns (report, fitted pipeline, meta). meta holds what prediction needs (features,
    training statistics for input checks, class labels)."""
    started = time.perf_counter()
    say = progress or (lambda msg, pct: None)
    if target not in table.columns:
        raise ValueError(f"No column named '{target}'.")
    task = detect_task(table, target)

    features, dropped = [], []
    for c in table.columns:
        if c == target:
            continue
        kind = table.kinds[c]
        if kind in ("numeric", "categorical"):
            features.append(c)
        else:
            dropped.append({"name": c, "reason": "same value on every row" if kind == "constant" else "looks like an ID or free text"})
    if not features:
        raise ValueError("No usable input columns besides the target.")

    y_raw = table.column(target)
    keep = np.array([v is not None for v in y_raw])
    if task == "regression":  # a stray word in a number column can't be a training label
        keep &= ~np.isnan(as_float(y_raw))
    X = table.rows[keep][:, [table.columns.index(c) for c in features]]
    kinds = [table.kinds[c] for c in features]
    if task == "regression":
        y = as_float(y_raw[keep])
        classes = None
    else:
        encoder = LabelEncoder()
        y = encoder.fit_transform([str(v) for v in y_raw[keep]])
        classes = [str(c) for c in encoder.classes_]
        counts = np.bincount(y)
        if len(classes) < 2:
            raise ValueError(f"'{target}' has only one value, so there is nothing to predict.")
        if counts.min() < 2:
            rare = [classes[i] for i in np.where(counts < 2)[0]]
            raise ValueError(f"Some values of '{target}' appear only once ({', '.join(rare[:5])}); each needs at least 2 rows.")

    say("Splitting into training and test data", 5)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y if task == "classification" else None)
    scoring, primary = _scoring(task, len(classes or []))
    splitter = (KFold(cv_folds, shuffle=True, random_state=SEED) if task == "regression"
                else StratifiedKFold(cv_folds, shuffle=True, random_state=SEED))
    if len(X_train) > max_cv_rows:  # compare on a sample; the winner is still trained on everything
        idx = np.random.default_rng(SEED).choice(len(X_train), max_cv_rows, replace=False)
        X_cv, y_cv = X_train[idx], y_train[idx]
    else:
        X_cv, y_cv = X_train, y_train

    models = candidates(task, len(X_train))
    if only:
        models = {k: v for k, v in models.items() if k in only}
    leaderboard = []
    for i, (name, model) in enumerate(models.items()):
        say(f"Cross-validating {name}", 10 + int(50 * i / len(models)))
        pipe = Pipeline([("prep", build_preprocessor(kinds, max_categories)), ("model", model)])
        t0 = time.perf_counter()
        res = cross_validate(pipe, X_cv, y_cv, cv=splitter, scoring=scoring, return_train_score=True, error_score="raise")
        cv = {}
        for metric in scoring:
            vals = res[f"test_{metric}"] * (-1 if metric in ("mae", "rmse") else 1)
            cv[metric] = {"mean": _r(vals.mean()), "std": _r(vals.std())}
        leaderboard.append({
            "model": name,
            "cv": cv,
            "train_score": _r(res[f"train_{primary}"].mean()),
            "seconds": _r(time.perf_counter() - t0, 1),
        })
    leaderboard.sort(key=lambda row: -row["cv"][primary]["mean"])
    best_name = leaderboard[0]["model"]

    best = Pipeline([("prep", build_preprocessor(kinds, max_categories)), ("model", clone(models[best_name]))])
    tuned, params = False, {}
    space = {f"model__{k}": v for k, v in SEARCH_SPACE.get(best_name, {}).items()}
    if tune_iter and space:
        say(f"Tuning {best_name}", 65)
        n_combos = int(np.prod([len(v) for v in space.values()]))
        search = RandomizedSearchCV(best, space, n_iter=min(tune_iter, n_combos), cv=min(3, cv_folds),
                                    scoring=scoring[primary], random_state=SEED, n_jobs=1)
        search.fit(X_cv, y_cv)
        if search.best_score_ > leaderboard[0]["cv"][primary]["mean"]:
            best, tuned = search.best_estimator_, True
            params = {k.removeprefix("model__"): v for k, v in search.best_params_.items()}

    say("Training the final model and testing it on unseen data", 80)
    best = clone(best).fit(X_train, y_train)
    pred = best.predict(X_test)
    if task == "regression":
        test = {"r2": _r(r2_score(y_test, pred)), "mae": _r(mean_absolute_error(y_test, pred)),
                "rmse": _r(root_mean_squared_error(y_test, pred))}
        base = DummyRegressor().fit(X_train, y_train).predict(X_test)
        baseline = {"r2": _r(r2_score(y_test, base)), "mae": _r(mean_absolute_error(y_test, base))}
        residuals = y_test - pred
        interval = {"low": _r(np.percentile(residuals, 10)), "high": _r(np.percentile(residuals, 90))}
    else:
        test = {"accuracy": _r(accuracy_score(y_test, pred)), "f1": _r(f1_score(y_test, pred, average="macro"))}
        if len(classes) == 2:
            scores = best.predict_proba(X_test)[:, 1] if hasattr(best, "predict_proba") else best.decision_function(X_test)
            test["roc_auc"] = _r(roc_auc_score(y_test, scores))
        test["confusion"] = confusion_matrix(y_test, pred, labels=range(len(classes))).tolist()
        base = DummyClassifier(strategy="most_frequent").fit(X_train, y_train).predict(X_test)
        baseline = {"accuracy": _r(accuracy_score(y_test, base)), "f1": _r(f1_score(y_test, base, average="macro"))}
        interval = None

    train_score = r2_score(y_train, best.predict(X_train)) if task == "regression" else f1_score(y_train, best.predict(X_train), average="macro")
    cv_score = leaderboard[0]["cv"][primary]["mean"]
    gap = train_score - cv_score
    if gap > 0.15:
        verdict, note = "overfitting", "It does much better on rows it trained on than on new rows; more data or a simpler model would help."
    elif gap > 0.07:
        verdict, note = "some overfitting", "It scores higher on its training rows than on new ones, which is usual for tree ensembles; the test score below is the one to trust."
    elif cv_score < 0.3:
        verdict, note = "underfitting", "The inputs explain little of the target; more informative columns would help more than another algorithm."
    else:
        verdict, note = "good fit", "Training and validation scores are close, so it should hold up on new data."

    say("Measuring which inputs matter", 88)
    n_imp = min(len(X_test), 2000)
    imp = permutation_importance(best, X_test[:n_imp], y_test[:n_imp], n_repeats=5, random_state=SEED,
                                 scoring=scoring[primary])
    importance = sorted(
        ({"feature": f, "importance": _r(m), "std": _r(s)} for f, m, s in zip(features, imp.importances_mean, imp.importances_std)),
        key=lambda row: -row["importance"],
    )

    say("Looking for natural groups (PCA and K-means)", 93)
    explore = _explore(best, X_train, y_train, task, classes)

    meta = _meta(features, kinds, X_train, classes, task, target, interval)
    report = {
        "task": task,
        "target": target,
        "features": features,
        "dropped": dropped,
        "rows": int(len(X)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "primary_metric": primary,
        "leaderboard": leaderboard,
        "best": {"model": best_name, "tuned": tuned, "params": params},
        "test": test,
        "baseline": baseline,
        "fit_check": {"train": _r(train_score), "cv": cv_score, "verdict": verdict, "note": note},
        "importance": importance,
        "interval": interval,
        **explore,
        "xgboost_available": XGBRegressor is not None,
    }
    report["summary"] = summarize(report)
    report["seconds"] = _r(time.perf_counter() - started, 1)
    say("Done", 100)
    return report, best, meta


def _explore(model: Pipeline, X_train, y_train, task, classes) -> dict:
    n = min(len(X_train), 3000)
    Z = model.named_steps["prep"].transform(X_train[:n])
    if Z.shape[1] < 2 or n < 30:
        return {"pca": None, "clusters": None}
    pca = PCA(n_components=min(10, Z.shape[1]), random_state=SEED).fit(Z)
    ratios = pca.explained_variance_ratio_
    pcs = {"explained": [_r(r, 3) for r in ratios], "components_for_90pct": int(np.searchsorted(np.cumsum(ratios), 0.9) + 1)}
    # Extreme values would win their own tiny "cluster": cap them at 3 standard deviations, and
    # only accept groupings where every group holds at least 5% of the rows.
    Zc = np.clip(Z, -3, 3)
    best_k, best_s, best_labels = None, -1.0, None
    for k in range(2, 7):
        labels = KMeans(k, n_init=4, random_state=SEED).fit_predict(Zc)
        if np.bincount(labels).min() < 0.05 * n:
            continue
        s = silhouette_score(Zc, labels, sample_size=min(n, 2000), random_state=SEED)
        if s > best_s:
            best_k, best_s, best_labels = k, s, labels
    if best_k is None:
        return {"pca": pcs, "clusters": None}
    groups = []
    for g in range(best_k):
        members = best_labels == g
        info = {"size": int(members.sum())}
        if task == "regression":
            info["target_mean"] = _r(y_train[:n][members].mean())
        else:
            info["top_class"] = classes[int(np.bincount(y_train[:n][members]).argmax())]
        groups.append(info)
    return {"pca": pcs, "clusters": {"k": best_k, "silhouette": _r(best_s, 3), "groups": groups}}


def _meta(features, kinds, X_train, classes, task, target, interval) -> dict:
    stats = {}
    for j, (f, k) in enumerate(zip(features, kinds)):
        if k == "numeric":
            x = as_float(X_train[:, j])
            x = x[~np.isnan(x)]
            stats[f] = {"kind": k, "mean": float(x.mean()), "std": float(x.std()) or 1.0,
                        "min": float(x.min()), "max": float(x.max()), "median": float(np.median(x))}
        else:
            values = [str(v) for v in X_train[:, j] if v is not None]
            uniq, counts = np.unique(values, return_counts=True)
            stats[f] = {"kind": k, "categories": [str(u) for u in uniq[np.argsort(-counts)][:200]]}
    return {"features": features, "stats": stats, "classes": classes, "task": task, "target": target, "interval": interval}


def summarize(r: dict) -> str:
    t, b, name = r["test"], r["baseline"], r["best"]["model"]
    if r["task"] == "regression":
        return (f"{name} predicts {r['target']} with R² {t['r2']:.2f} on {r['test_rows']} rows it never saw "
                f"(a typical error of ±{t['mae']:.3g}), against R² {b['r2']:.2f} for always guessing the average.")
    return (f"{name} predicts {r['target']} correctly {t['accuracy']:.0%} of the time on {r['test_rows']} rows it never saw "
            f"(macro F1 {t['f1']:.2f}), against {b['accuracy']:.0%} for always guessing the most common value.")
