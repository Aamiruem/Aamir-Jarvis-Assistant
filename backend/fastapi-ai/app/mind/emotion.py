"""Emotion reading: what the user seems to feel, how strongly, and why we think so.

Two parts, like a person reading a message:
  1. an ML model (scikit-learn: word + character TF-IDF -> Logistic Regression) trained on
     ml/data/emotions.json, for the words themselves (English and common Hinglish);
  2. cues on top: "!!!", ALL CAPS, "???", emoji, intensifiers ("so", "really", "bahut"),
     negation ("not happy"), which change the reading or its intensity.

It runs in about a millisecond and needs no API call. It is a guess, not a diagnosis: the agent
is told to use it to choose a tone, never to label the user.
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline

from app.config import SERVICE_DIR, settings

DATASET = SERVICE_DIR / "ml" / "data" / "emotions.json"

# Where each emotion sits on the two classic axes: valence (unpleasant -1 .. pleasant +1) and
# arousal (calm 0 .. activated 1).
AFFECT = {
    "joy": (0.8, 0.6),
    "gratitude": (0.7, 0.4),
    "excitement": (0.8, 0.9),
    "curiosity": (0.4, 0.55),
    "neutral": (0.0, 0.3),
    "confusion": (-0.2, 0.45),
    "sadness": (-0.7, 0.25),
    "anxiety": (-0.6, 0.75),
    "frustration": (-0.7, 0.8),
    "distress": (-1.0, 0.9),
}
LABELS = {
    "joy": "happy", "gratitude": "grateful", "excitement": "excited", "curiosity": "curious",
    "neutral": "neutral", "confusion": "confused", "sadness": "low", "anxiety": "stressed",
    "frustration": "frustrated", "distress": "in distress",
}
NEGATIVE = {"sadness", "anxiety", "frustration", "distress", "confusion"}

# Words that mean someone may be at risk. Checked by rules, never left to a statistical model.
CRISIS = re.compile(
    r"\b(kill myself|killing myself|end my life|want to die|wanna die|suicid\w*|self[- ]?harm|"
    r"hurt myself|no reason to live|better off dead|can'?t go on)\b",
    re.IGNORECASE,
)
INTENSIFIERS = re.compile(r"\b(so|very|really|extremely|totally|super|too|such|bahut|bohot|ekdum|literally|completely)\b", re.IGNORECASE)
NEGATED_POSITIVE = re.compile(r"\b(not|never|no longer|isn'?t|wasn'?t|don'?t|doesn'?t|nahi|nahin)\s+(\w+\s+)?(happy|good|great|fine|okay|ok|excited|working|well)\b", re.IGNORECASE)
# Feeling words (English and common Hinglish). Each hit nudges the model, so a short message
# like "feeling lonely tonight" is read by its key word even if the sentence is new to the model.
LEXICON = {
    "sadness": r"lonely|alone|sad|depress\w*|cry|crying|cried|hurt\w*|empty|hopeless|heartbroken|grie\w*|miss (you|him|her|them|home)|udaas|dukhi|rona",
    "frustration": r"annoy\w*|angry|mad|irritat\w*|hate|useless|ugh+|wtf|fed up|sick of|pissed|gussa|bekaar|still (not|broken|failing)",
    "anxiety": r"worr\w*|nervous|anxious|scared|afraid|stress\w*|panic\w*|tension|overwhelm\w*|overthink\w*|dar lag|ghabra\w*",
    "joy": r"happy|glad|yay|awesome|delighted|promoted|khush|mast|maza",
    "gratitude": r"thanks?|thank you|thx|grateful|appreciate\w*|shukriya|dhanyava?a?d",
    "confusion": r"confus\w*|unclear|don'?t (get|understand)|makes no sense|lost|samajh nahi",
    "curiosity": r"wonder\w*|curious|how does|what is|what are|explain|teach me|learn about",
    "excitement": r"excit\w*|can'?t wait|pumped|thrilled|wow+|omg|let'?s go",
}
LEXICON = {k: re.compile(rf"\b({v})\b", re.IGNORECASE) for k, v in LEXICON.items()}

EMOJI = {
    "joy": "😀😃😄😁😆😊🙂😍🥰🥳🎉😂🤣❤️💖✨",
    "gratitude": "🙏💐🤝",
    "excitement": "🚀🔥🤩😎💯",
    "sadness": "😢😭😞😔☹🙁💔😿",
    "frustration": "😡😠🤬😤🙄😒",
    "anxiety": "😰😨😱😟😥😬",
    "confusion": "🤔😕🤨❓",
}


@dataclass
class EmotionReading:
    emotion: str                  # the main emotion (a key of AFFECT)
    label: str                    # a human word for it ("frustrated")
    confidence: float             # 0..1, how sure the model is
    intensity: float              # 0..1, how strongly it is expressed
    valence: float                # -1..1
    arousal: float                # 0..1
    scores: dict[str, float]      # top emotions with probabilities
    signals: list[str] = field(default_factory=list)  # why: the cues that were found
    crisis: bool = False

    @property
    def negative(self) -> bool:
        return self.emotion in NEGATIVE

    def as_dict(self) -> dict:
        return {
            "emotion": self.emotion, "label": self.label, "confidence": self.confidence,
            "intensity": self.intensity, "valence": self.valence, "arousal": self.arousal,
            "scores": self.scores, "signals": self.signals, "crisis": self.crisis,
        }


def _dataset() -> tuple[list[str], list[str], str]:
    import json

    raw = DATASET.read_text(encoding="utf-8")
    data = json.loads(raw)
    texts, labels = [], []
    for label, examples in data.items():
        texts += examples
        labels += [label] * len(examples)
    return texts, labels, hashlib.sha1(raw.encode()).hexdigest()[:10]


def build_pipeline() -> Pipeline:
    return Pipeline([
        ("features", FeatureUnion([
            ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, token_pattern=r"(?u)\b\w+'?\w*\b")),
            ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True)),  # typos, Hinglish spellings
        ])),
        ("clf", LogisticRegression(max_iter=3000, C=8, class_weight="balanced")),
    ])


class EmotionModel:
    """Trained once, saved next to the other models; retrained automatically when the dataset changes."""

    def __init__(self) -> None:
        texts, labels, digest = _dataset()
        path = settings.data_dir / f"emotion_model_{digest}.joblib"
        try:
            self.model: Pipeline = joblib.load(path)
        except Exception:
            self.model = build_pipeline().fit(texts, labels)
            try:
                joblib.dump(self.model, path)
            except OSError:
                pass  # read-only disk: keep the model in memory

    def read(self, text: str) -> EmotionReading:
        text = (text or "").strip()
        signals: list[str] = []
        if not text:
            return EmotionReading("neutral", LABELS["neutral"], 1.0, 0.0, 0.0, AFFECT["neutral"][1], {"neutral": 1.0})

        probs = dict(zip(self.model.classes_, (float(p) for p in self.model.predict_proba([text])[0])))

        # Feeling words the model may not know from its small dataset.
        for emotion, pattern in LEXICON.items():
            hits = len(pattern.findall(text))
            if hits:
                probs[emotion] = probs.get(emotion, 0) + 0.3 * min(hits, 2)
                signals.append(f"feeling words ({emotion})")
        # Emoji speak louder than words.
        for emotion, chars in EMOJI.items():
            hits = sum(text.count(c) for c in chars if c)
            if hits:
                probs[emotion] = probs.get(emotion, 0) + 0.25 * min(hits, 3)
                signals.append(f"emoji ({emotion})")
        # "not happy", "nahi chal raha": a positive word that is negated.
        if NEGATED_POSITIVE.search(text):
            moved = sum(probs.get(k, 0) for k in ("joy", "excitement", "gratitude")) * 0.8
            for k in ("joy", "excitement", "gratitude"):
                probs[k] = probs.get(k, 0) * 0.2
            probs["frustration" if re.search(r"\bwork", text, re.IGNORECASE) else "sadness"] += moved
            signals.append("negated positive word")

        total = sum(probs.values()) or 1.0
        probs = {k: v / total for k, v in probs.items()}
        emotion, confidence = max(probs.items(), key=lambda kv: kv[1])
        if confidence < 0.26:  # nothing stands out: don't invent a feeling
            emotion = "neutral"

        # How strongly it is said.
        intensity = 0.25 + 0.6 * confidence if emotion != "neutral" else 0.1
        bangs = text.count("!")
        if bangs:
            intensity += 0.07 * min(bangs, 4)
            signals.append("exclamation marks")
        if re.search(r"\?{2,}|\?!|!\?", text):
            intensity += 0.1
            signals.append("repeated question marks")
        words = re.findall(r"[A-Za-z]{3,}", text)
        caps = [w for w in words if w.isupper()]
        if caps and len(caps) >= max(1, len(words) // 3):
            intensity += 0.15
            signals.append("ALL CAPS")
        n_intense = len(INTENSIFIERS.findall(text))
        if n_intense and emotion != "neutral":
            intensity += 0.06 * min(n_intense, 3)
            signals.append("intensifiers")
        if re.search(r"(.)\1{3,}", text):  # "pleeeease", "noooo"
            intensity += 0.08
            signals.append("stretched words")

        crisis = bool(CRISIS.search(text))
        if crisis:
            emotion, confidence, intensity = "distress", 1.0, 1.0
            signals.append("crisis language")

        intensity = round(min(1.0, intensity), 2)
        valence = sum(p * AFFECT[k][0] for k, p in probs.items() if k in AFFECT)
        if crisis:
            valence = -1.0
        arousal = AFFECT[emotion][1] * 0.6 + intensity * 0.4
        top = dict(sorted(((k, round(v, 3)) for k, v in probs.items()), key=lambda kv: -kv[1])[:3])
        return EmotionReading(
            emotion=emotion,
            label=LABELS[emotion],
            confidence=round(confidence, 3),
            intensity=intensity,
            valence=round(max(-1.0, min(1.0, valence)), 2),
            arousal=round(min(1.0, arousal), 2),
            scores=top,
            signals=signals,
            crisis=crisis,
        )


_model: EmotionModel | None = None


def get_model() -> EmotionModel:
    global _model
    if _model is None:
        _model = EmotionModel()
    return _model


def read_emotion(text: str) -> EmotionReading:
    return get_model().read(text)
