"""Saved models, their model cards, an experiment log, and predictions with input checks.

    data_dir/mllab/<user>/models/<model_id>/model.joblib   the fitted pipeline
                                           /card.json      report + what prediction needs
    data_dir/mllab/<user>/runs.jsonl                       one line per training run (experiment log)
    data_dir/mllab/<user>/datasets/<dataset_id>.csv        uploaded data, kept for re-training

Only files this module wrote are ever loaded (joblib uses pickle, so never load uploads).
"""
import json
import re
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np

from app.config import settings
from app.mllab.data import _number

ID_RE = re.compile(r"^[a-z0-9-]{1,40}$")
BUILTIN = "_builtin"  # models every user can use (the house price project)


def _root(user_id: str) -> Path:
    return settings.data_dir / "mllab" / user_id


def _check_id(value: str) -> str:
    if not ID_RE.match(value or ""):
        raise ValueError("Invalid id.")
    return value


def new_id() -> str:
    return uuid.uuid4().hex[:12]


# ---------- datasets ----------

def save_dataset(user_id: str, data: bytes, filename: str) -> str:
    dataset_id = new_id()
    folder = _root(user_id) / "datasets"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{dataset_id}.csv").write_bytes(data)
    (folder / f"{dataset_id}.json").write_text(json.dumps({"filename": filename[:200]}), encoding="utf-8")
    return dataset_id


def load_dataset(user_id: str, dataset_id: str) -> tuple[bytes, str]:
    path = _root(user_id) / "datasets" / f"{_check_id(dataset_id)}.csv"
    if not path.exists():
        raise FileNotFoundError("Dataset not found.")
    info = json.loads(path.with_suffix(".json").read_text(encoding="utf-8"))
    return path.read_bytes(), info["filename"]


# ---------- models ----------

def save_model(user_id: str, pipeline, report: dict, meta: dict, *, name: str, source: str, model_id: str | None = None) -> dict:
    model_id = _check_id(model_id or new_id())
    folder = _root(user_id) / "models" / model_id
    folder.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline, folder / "model.joblib", compress=3)
    card = {
        "id": model_id,
        "name": name[:120],
        "source": source[:200],
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "report": report,
        "meta": meta,
    }
    (folder / "card.json").write_text(json.dumps(card, default=_jsonable), encoding="utf-8")
    log_run(user_id, card)
    return card


def _jsonable(value):
    if isinstance(value, np.generic):
        return value.item()
    return str(value)


def log_run(user_id: str, card: dict) -> None:
    """Experiment tracking: every run's model, settings and scores, appended (never rewritten)."""
    r = card["report"]
    line = {
        "at": card["created_at"], "model_id": card["id"], "name": card["name"], "task": r["task"], "target": r["target"],
        "best": r["best"], "test": {k: v for k, v in r["test"].items() if k != "confusion"},
        "cv": r["leaderboard"][0]["cv"], "rows": r["rows"], "seconds": r.get("seconds"),
    }
    path = _root(user_id) / "runs.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, default=_jsonable) + "\n")


def list_runs(user_id: str, limit: int = 50) -> list[dict]:
    path = _root(user_id) / "runs.jsonl"
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").splitlines()[-limit:]
    return [json.loads(line) for line in reversed(lines)]


def _card_path(user_id: str, model_id: str) -> Path:
    return _root(user_id) / "models" / _check_id(model_id) / "card.json"


def get_card(user_id: str, model_id: str) -> dict:
    for owner in (user_id, BUILTIN):
        path = _card_path(owner, model_id)
        if path.exists():
            card = json.loads(path.read_text(encoding="utf-8"))
            card["builtin"] = owner == BUILTIN
            return card
    raise FileNotFoundError("Model not found.")


def list_models(user_id: str) -> list[dict]:
    cards = []
    for owner in (BUILTIN, user_id):
        folder = _root(owner) / "models"
        if not folder.exists():
            continue
        for path in folder.glob("*/card.json"):
            card = json.loads(path.read_text(encoding="utf-8"))
            r = card["report"]
            cards.append({
                "id": card["id"], "name": card["name"], "source": card["source"], "created_at": card["created_at"],
                "builtin": owner == BUILTIN, "task": r["task"], "target": r["target"], "best": r["best"]["model"],
                "test": {k: v for k, v in r["test"].items() if k != "confusion"}, "summary": r["summary"],
                "features": card["meta"]["features"],
            })
    builtin = [c for c in cards if c["builtin"]]
    own = sorted((c for c in cards if not c["builtin"]), key=lambda c: c["created_at"], reverse=True)
    return builtin + own  # built-in projects first, then the user's newest models


def delete_model(user_id: str, model_id: str) -> bool:
    folder = _root(user_id) / "models" / _check_id(model_id)  # never the shared built-in models
    if not folder.exists():
        return False
    shutil.rmtree(folder)
    return True


def delete_user(user_id: str) -> None:
    shutil.rmtree(_root(user_id), ignore_errors=True)


_cache: dict[Path, tuple[float, object]] = {}


def _load_pipeline(user_id: str, model_id: str):
    for owner in (user_id, BUILTIN):
        path = _root(owner) / "models" / _check_id(model_id) / "model.joblib"
        if path.exists():
            mtime = path.stat().st_mtime
            hit = _cache.get(path)
            if not hit or hit[0] != mtime:
                _cache[path] = (mtime, joblib.load(path))
            return _cache[path][1]
    raise FileNotFoundError("Model not found.")


# ---------- prediction ----------

def predict(user_id: str, model_id: str, rows: list[dict]) -> list[dict]:
    """Predicts for each row ({feature: value}); missing features are filled like in training.
    Each result says how unusual the input is compared with the training data (drift check)."""
    card = get_card(user_id, model_id)
    meta = card["meta"]
    pipeline = _load_pipeline(user_id, model_id)
    features, stats = meta["features"], meta["stats"]
    lower = {f.lower(): f for f in features}
    X, notes = [], []
    for row in rows:
        values, row_notes = [None] * len(features), []
        for key, value in row.items():
            f = lower.get(str(key).lower())
            if f is None:
                row_notes.append(f"'{key}' isn't an input of this model, so it was ignored.")
                continue
            v = _number(str(value)) if value is not None else None
            if stats[f]["kind"] == "numeric":
                if v is not None and not isinstance(v, float):
                    raise ValueError(f"'{f}' must be a number, got '{value}'.")
                if v is not None:
                    s = stats[f]
                    z = abs(v - s["mean"]) / s["std"]
                    if z > 4 or v < s["min"] - 3 * s["std"] or v > s["max"] + 3 * s["std"]:
                        row_notes.append(f"{f} = {v:g} is far outside the training data ({s['min']:g} to {s['max']:g}); treat this prediction with caution.")
            elif v is not None:
                v = str(v)
                if v not in stats[f]["categories"]:
                    row_notes.append(f"{f} = '{v}' never appeared in the training data.")
            values[features.index(f)] = v
        missing = [f for f, v in zip(features, values) if v is None]
        if missing:
            row_notes.append(f"Not given, filled with typical values: {', '.join(missing)}.")
        X.append(values)
        notes.append(row_notes)

    X = np.array(X, dtype=object)
    out = []
    if meta["task"] == "regression":
        preds = pipeline.predict(X)
        band = meta.get("interval") or {}
        for p, n in zip(preds, notes):
            item = {"prediction": round(float(p), 4), "notes": n}
            if band:
                item["likely_range"] = [round(float(p + band["low"]), 4), round(float(p + band["high"]), 4)]
            out.append(item)
    else:
        classes = meta["classes"]
        labels = pipeline.predict(X)
        probs = pipeline.predict_proba(X) if hasattr(pipeline, "predict_proba") else None
        for i, (label, n) in enumerate(zip(labels, notes)):
            item = {"prediction": classes[int(label)], "notes": n}
            if probs is not None:
                item["confidence"] = round(float(probs[i].max()), 3)
            out.append(item)
    return out
