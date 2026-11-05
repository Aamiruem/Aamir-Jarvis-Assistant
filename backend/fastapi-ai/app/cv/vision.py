"""Computer vision: classic CV with OpenCV + multimodal LLM understanding with Claude.

detect_faces() is the classic approach (Haar cascade, runs locally, no AI API).
describe_image() sends the picture to Claude, which can read text, recognise
objects and answer free-form questions.
"""
import base64

import cv2
import numpy as np

from app.llm.claude import complete

# OpenCV 5 moved Haar cascades to opencv-contrib; without them face detection is skipped
# instead of the whole service failing to start.
_face_cascade = (
    cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data")
    else None
)


def decode(image_bytes: bytes) -> np.ndarray:
    img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def detect_faces(img: np.ndarray) -> list[dict]:
    if _face_cascade is None:
        return []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = _face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    return [{"x": int(x), "y": int(y), "w": int(w), "h": int(h)} for (x, y, w, h) in faces]


def image_stats(img: np.ndarray) -> dict:
    h, w = img.shape[:2]
    b, g, r = (float(c) for c in img.reshape(-1, 3).mean(axis=0))
    brightness = float(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).mean())
    return {"width": w, "height": h, "avg_rgb": [round(r), round(g), round(b)], "brightness": round(brightness)}


async def describe_image(image_bytes: bytes, media_type: str, question: str | None) -> str:
    content = [
        {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": base64.standard_b64encode(image_bytes).decode()},
        },
        {"type": "text", "text": question or "Describe what you see in this image in 2-3 sentences."},
    ]
    return await complete(content, system="You are AZARVIS's vision module. Be concise and specific.", max_tokens=4000)
