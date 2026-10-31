"""NLP analysis: intent (ML), sentiment (lexicon), and entities (regex or spaCy).

Uses only lightweight techniques by default so it runs anywhere. If spaCy and
en_core_web_sm are installed (requirements-dl.txt), entity extraction upgrades
to a real neural NER model automatically.
"""
import re

from app.nlp.intent import get_classifier

POSITIVE = {
    "good", "great", "awesome", "amazing", "love", "like", "thanks", "thank", "happy",
    "excellent", "nice", "cool", "perfect", "fantastic", "helpful", "wonderful", "best",
}
NEGATIVE = {
    "bad", "terrible", "awful", "hate", "angry", "sad", "worst", "useless", "broken",
    "annoying", "slow", "wrong", "stupid", "problem", "fail", "failed", "error", "bug",
}
NEGATORS = {"not", "no", "never", "don't", "isn't", "wasn't", "can't", "won't"}

ENTITY_PATTERNS = {
    "TIME": r"\b\d{1,2}(:\d{2})?\s?(am|pm)\b",
    "DATE": r"\b(today|tomorrow|tonight|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})\b",
    "EMAIL": r"\b[\w.+-]+@[\w-]+\.[\w.]+\b",
    "URL": r"https?://\S+",
    "NUMBER": r"\b\d+(\.\d+)?\b",
}

try:
    import spacy

    _nlp = spacy.load("en_core_web_sm")
except Exception:  # spaCy or its model is optional
    _nlp = None


def sentiment(text: str) -> float:
    """Returns a score from -1 (negative) to +1 (positive)."""
    tokens = re.findall(r"[a-z']+", text.lower())
    score = 0
    for i, tok in enumerate(tokens):
        polarity = (tok in POSITIVE) - (tok in NEGATIVE)
        if polarity and i > 0 and tokens[i - 1] in NEGATORS:
            polarity = -polarity
        score += polarity
    return round(max(-1.0, min(1.0, score / 3)), 2)


def entities(text: str) -> list[dict]:
    if _nlp is not None:
        return [{"text": e.text, "label": e.label_} for e in _nlp(text).ents]
    found = []
    for label, pattern in ENTITY_PATTERNS.items():
        for m in re.finditer(pattern, text, flags=re.IGNORECASE):
            found.append({"text": m.group(0), "label": label})
    return found


def analyze(text: str) -> dict:
    intent, confidence = get_classifier().predict(text)
    return {
        "intent": intent,
        "confidence": confidence,
        "sentiment": sentiment(text),
        "entities": entities(text),
        "ner_engine": "spacy" if _nlp else "regex",
    }
