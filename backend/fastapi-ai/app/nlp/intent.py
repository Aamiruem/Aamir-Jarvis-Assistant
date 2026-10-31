"""Classic ML intent classifier: TF-IDF features + Logistic Regression (scikit-learn).

This is the "traditional ML" half of the project. It runs in milliseconds, costs
nothing, and is used for analytics and routing hints. Compare it with the PyTorch
version in ml/train_intent_dl.py and with asking the LLM directly.
"""
import json
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from app.config import SERVICE_DIR, settings

DATASET = SERVICE_DIR / "ml" / "data" / "intents.json"
MODEL_PATH = settings.data_dir / "intent_model.joblib"


def load_dataset(path: Path = DATASET) -> tuple[list[str], list[str]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    texts, labels = [], []
    for label, examples in data.items():
        texts += examples
        labels += [label] * len(examples)
    return texts, labels


def build_pipeline() -> Pipeline:
    return Pipeline([
        # char n-grams make the model robust to typos ("wether", "remnd me")
        ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True)),
        ("clf", LogisticRegression(max_iter=2000, C=10)),
    ])


def train(save: bool = True) -> Pipeline:
    texts, labels = load_dataset()
    model = build_pipeline().fit(texts, labels)
    if save:
        joblib.dump(model, MODEL_PATH)
    return model


class IntentClassifier:
    def __init__(self) -> None:
        self.model: Pipeline = joblib.load(MODEL_PATH) if MODEL_PATH.exists() else train()

    def retrain(self) -> None:
        self.model = train()

    def predict(self, text: str) -> tuple[str, float]:
        probs = self.model.predict_proba([text])[0]
        best = probs.argmax()
        return str(self.model.classes_[best]), round(float(probs[best]), 3)


_classifier: IntentClassifier | None = None


def get_classifier() -> IntentClassifier:
    global _classifier
    if _classifier is None:
        _classifier = IntentClassifier()
    return _classifier
