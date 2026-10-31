"""A small, readable vector store for RAG (Retrieval-Augmented Generation).

Pipeline: document -> chunks -> embeddings -> cosine-similarity search.

Each user gets their own index, so searches only ever see that user's documents.

Embedders:
  * tfidf (default): sparse keyword vectors from scikit-learn, no downloads.
  * sentence-transformers: dense semantic vectors (all-MiniLM-L6-v2), install
    requirements-dl.txt and set RAG_EMBEDDER=sentence-transformers.

Once you understand this file, swap it for a production vector DB:
pgvector (Postgres), MongoDB Atlas Vector Search, Chroma, or Pinecone.
"""
import json
import threading
import uuid
from dataclasses import dataclass

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from app.config import settings

CHUNK_SIZE = 900
CHUNK_OVERLAP = 150


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split on paragraphs, then pack paragraphs into ~size-char chunks with overlap."""
    paragraphs = [p.strip() for p in text.replace("\r", "").split("\n\n") if p.strip()]
    chunks, current = [], ""
    for para in paragraphs:
        while len(para) > size:  # very long paragraph: hard split
            chunks.append(para[:size])
            para = para[size - overlap:]
        if len(current) + len(para) + 2 > size and current:
            chunks.append(current)
            current = current[-overlap:] + "\n\n" + para
        else:
            current = f"{current}\n\n{para}" if current else para
    if current:
        chunks.append(current)
    return chunks


class TfidfEmbedder:
    def fit_transform(self, texts: list[str]) -> np.ndarray:
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True)
        return self.vectorizer.fit_transform(texts).toarray()

    def encode_query(self, text: str) -> np.ndarray:
        return self.vectorizer.transform([text]).toarray()[0]


class SentenceTransformerEmbedder:
    _model = None  # one shared model; loading it is slow

    def __init__(self) -> None:
        if SentenceTransformerEmbedder._model is None:
            from sentence_transformers import SentenceTransformer

            SentenceTransformerEmbedder._model = SentenceTransformer("all-MiniLM-L6-v2")
        self.model = SentenceTransformerEmbedder._model

    def fit_transform(self, texts: list[str]) -> np.ndarray:
        return self.model.encode(texts, normalize_embeddings=True)

    def encode_query(self, text: str) -> np.ndarray:
        return self.model.encode([text], normalize_embeddings=True)[0]


def _new_embedder():
    return SentenceTransformerEmbedder() if settings.rag_embedder == "sentence-transformers" else TfidfEmbedder()


@dataclass
class _UserIndex:
    chunks: list[dict]
    matrix: np.ndarray
    embedder: object


class VectorStore:
    def __init__(self) -> None:
        self.path = settings.data_dir / "rag_chunks.json"
        self.lock = threading.Lock()
        self.chunks: list[dict] = json.loads(self.path.read_text("utf-8")) if self.path.exists() else []
        self._indexes: dict[str, _UserIndex | None] = {}  # built lazily per user

    def _save(self) -> None:
        self.path.write_text(json.dumps(self.chunks, ensure_ascii=False), "utf-8")

    def _user_chunks(self, user_id: str) -> list[dict]:
        return [c for c in self.chunks if c.get("user_id", "local") == user_id]

    def _index_for(self, user_id: str) -> _UserIndex | None:
        if user_id not in self._indexes:
            chunks = self._user_chunks(user_id)
            if not chunks:
                self._indexes[user_id] = None
            else:
                embedder = _new_embedder()
                m = embedder.fit_transform([c["text"] for c in chunks])
                norms = np.linalg.norm(m, axis=1, keepdims=True)
                self._indexes[user_id] = _UserIndex(chunks, m / np.where(norms == 0, 1, norms), embedder)
        return self._indexes[user_id]

    def add_document(self, user_id: str, source: str, text: str, uri: str | None = None) -> dict:
        doc_id = uuid.uuid4().hex[:12]
        pieces = chunk_text(text)
        with self.lock:
            self.chunks += [
                {"user_id": user_id, "doc_id": doc_id, "source": source, "uri": uri, "index": i, "text": t}
                for i, t in enumerate(pieces)
            ]
            self._save()
            self._indexes.pop(user_id, None)
        return {"doc_id": doc_id, "source": source, "chunks": len(pieces)}

    def delete_document(self, user_id: str, doc_id: str) -> bool:
        with self.lock:
            before = len(self.chunks)
            self.chunks = [c for c in self.chunks if not (c["doc_id"] == doc_id and c.get("user_id", "local") == user_id)]
            if len(self.chunks) == before:
                return False
            self._save()
            self._indexes.pop(user_id, None)
            return True

    def delete_user(self, user_id: str) -> int:
        with self.lock:
            before = len(self.chunks)
            self.chunks = [c for c in self.chunks if c.get("user_id", "local") != user_id]
            self._save()
            self._indexes.pop(user_id, None)
            return before - len(self.chunks)

    def list_documents(self, user_id: str) -> list[dict]:
        docs: dict[str, dict] = {}
        for c in self._user_chunks(user_id):
            d = docs.setdefault(c["doc_id"], {"doc_id": c["doc_id"], "source": c["source"], "chunks": 0})
            d["chunks"] += 1
        return list(docs.values())

    def search(self, user_id: str, query: str, k: int = 4, min_score: float = 0.05) -> list[dict]:
        with self.lock:
            index = self._index_for(user_id)
            if index is None:
                return []
            q = index.embedder.encode_query(query)
            norm = np.linalg.norm(q)
            if norm == 0:
                return []
            scores = index.matrix @ (q / norm)
            top = np.argsort(scores)[::-1][:k]
            return [
                {**index.chunks[i], "score": round(float(scores[i]), 3)}
                for i in top
                if scores[i] >= min_score
            ]


_store: VectorStore | None = None


def get_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
