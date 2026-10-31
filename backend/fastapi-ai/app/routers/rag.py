import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.llm.claude import complete
from app.rag.store import get_store
from app.security import Caller, get_caller
from app.storage.s3 import save_file

router = APIRouter(prefix="/rag", tags=["rag"])

MAX_UPLOAD = 20 * 1024 * 1024
ALLOWED_EXT = (".pdf", ".txt", ".md")


def extract_text(filename: str, data: bytes) -> str:
    if filename.lower().endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    return data.decode("utf-8", errors="ignore")


@router.post("/upload")
async def upload(file: UploadFile = File(...), caller: Caller = Depends(get_caller)):
    name = file.filename or "file.txt"
    if not name.lower().endswith(ALLOWED_EXT):
        raise HTTPException(415, f"Only {', '.join(ALLOWED_EXT)} files are supported")
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(413, "File too large (20 MB max)")
    text = extract_text(name, data)
    if not text.strip():
        raise HTTPException(422, "No text could be extracted from this file")
    uri = save_file(caller.user_id, name, data, file.content_type or "application/octet-stream")
    return get_store().add_document(caller.user_id, name, text, uri)


class TextDoc(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1, max_length=500_000)


@router.post("/text")
async def add_text(doc: TextDoc, caller: Caller = Depends(get_caller)):
    return get_store().add_document(caller.user_id, doc.title, doc.text)


@router.get("/documents")
async def documents(caller: Caller = Depends(get_caller)):
    return get_store().list_documents(caller.user_id)


@router.delete("/documents/{doc_id}")
async def delete(doc_id: str, caller: Caller = Depends(get_caller)):
    if not get_store().delete_document(caller.user_id, doc_id):
        raise HTTPException(404, "Document not found")
    return {"deleted": doc_id}


class Query(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    k: int = Field(4, ge=1, le=10)


@router.post("/search")
async def search(q: Query, caller: Caller = Depends(get_caller)):
    return get_store().search(caller.user_id, q.query, k=q.k)


@router.post("/query")
async def classic_rag(q: Query, caller: Caller = Depends(get_caller)):
    """'Classic' RAG: always retrieve, then answer in a single LLM call.
    Compare with the agent, which decides by itself *when* to search (agentic RAG)."""
    hits = get_store().search(caller.user_id, q.query, k=q.k)
    if not hits:
        return {"answer": "Your knowledge base has nothing relevant to that question.", "sources": []}
    context = "\n\n".join(f'<doc source="{h["source"]}">\n{h["text"]}\n</doc>' for h in hits)
    answer = await complete(
        f"{context}\n\nUsing only the documents above, answer: {q.query}\nCite sources by name.",
        system="You answer strictly from provided documents. If they don't contain the answer, say so.",
    )
    return {"answer": answer, "sources": [{"source": h["source"], "score": h["score"]} for h in hits]}
