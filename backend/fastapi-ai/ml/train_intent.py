"""Train and evaluate the scikit-learn intent classifier.

    cd backend/fastapi-ai
    python -m ml.train_intent

Prints 5-fold cross-validation accuracy and a per-intent report, then saves the
model to data/intent_model.joblib (the API loads it from there).
Try: add examples to ml/data/intents.json, add a new intent, change the n-gram range.
"""
from sklearn.metrics import classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_predict, cross_val_score

from app.nlp.intent import MODEL_PATH, build_pipeline, load_dataset, train


def main() -> None:
    texts, labels = load_dataset()
    print(f"{len(texts)} examples, {len(set(labels))} intents\n")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(build_pipeline(), texts, labels, cv=cv)
    print(f"Cross-validated accuracy: {scores.mean():.2%} (+/- {scores.std():.2%})\n")

    preds = cross_val_predict(build_pipeline(), texts, labels, cv=cv)
    print(classification_report(labels, preds, zero_division=0))

    model = train(save=True)
    print(f"Saved model to {MODEL_PATH}")
    for sample in ["remind me to water the plants", "how warm is it in goa", "what's 99 * 12"]:
        print(f"  {sample!r:40} -> {model.predict([sample])[0]}")


if __name__ == "__main__":
    main()
