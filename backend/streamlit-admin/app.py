"""Jarvis admin dashboard (Streamlit).

    streamlit run backend/streamlit-admin/app.py

Streamlit turns a Python script into a web app: perfect for ML demos, admin
tools and data exploration without writing any React.
"""
import os

import pandas as pd
import requests
import streamlit as st

AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")

st.set_page_config(page_title="Jarvis Admin", page_icon="🤖", layout="wide")

st.sidebar.title("🤖 Jarvis Admin")
# The dashboard is a trusted admin tool: it can act as any user id (a MongoDB user _id, or "local").
acting_user = st.sidebar.text_input("Act as user id", os.environ.get("JARVIS_USER_ID", "local"))
HEADERS = {
    "X-Internal-Key": os.environ.get("INTERNAL_API_KEY", "change-me-internal-key"),
    "X-User-Id": acting_user,
    "X-User-Role": "admin",
}


def api(method: str, path: str, **kwargs):
    r = requests.request(method, f"{AI_URL}{path}", headers=HEADERS, timeout=180, **kwargs)
    r.raise_for_status()
    return r.json()


page = st.sidebar.radio("Page", ["Overview", "Chat tester", "Knowledge base", "NLP playground", "Tasks", "Memory"])

try:
    health = requests.get(f"{AI_URL}/health", timeout=5).json()
    st.sidebar.success(f"AI service online · {health['model']}")
    st.sidebar.caption(f"DB: {health['database']} · storage: {health['storage']} · embedder: {health['rag_embedder']}")
except Exception:
    st.sidebar.error(f"AI service unreachable at {AI_URL}")
    st.stop()

if page == "Overview":
    st.header("Usage analytics (all users)")
    s = api("GET", "/admin/stats")
    c1, c2, c3, c4, c5 = st.columns(5)
    c1.metric("Messages", s["total_messages"])
    c2.metric("Active users", s["active_users"])
    c3.metric("Avg latency", f"{s['avg_latency_ms']} ms")
    c4.metric("Input tokens", f"{s['input_tokens']:,}")
    c5.metric("Output tokens", f"{s['output_tokens']:,}")

    st.subheader("Messages by intent")
    if s["by_intent"]:
        df = pd.DataFrame(sorted(s["by_intent"].items(), key=lambda kv: -kv[1]), columns=["intent", "messages"])
        st.dataframe(df, hide_index=True, use_container_width=True)
    else:
        st.info("No chats logged yet.")

    st.subheader("Recent messages")
    st.dataframe(pd.DataFrame(s["recent"]), hide_index=True, use_container_width=True)

elif page == "Chat tester":
    st.header("Chat with the agent")
    msg = st.text_area("Message", "What's 15% of 2,480 and what time is it in London?")
    if st.button("Send", type="primary"):
        with st.spinner("Thinking…"):
            out = api("POST", "/chat", json={"message": msg})
        st.markdown(out["reply"])
        with st.expander("Details: tools, NLP, tokens"):
            st.json({"tools": out["tools"], "nlp": out["nlp"], "usage": out["usage"]})

elif page == "Knowledge base":
    st.header("Knowledge base (RAG)")
    files = st.file_uploader("Upload documents", type=["pdf", "txt", "md"], accept_multiple_files=True)
    if files and st.button("Index files", type="primary"):
        for f in files:
            res = api("POST", "/rag/upload", files={"file": (f.name, f.getvalue(), f.type)})
            st.success(f"{res['source']}: {res['chunks']} chunks")

    docs = api("GET", "/rag/documents")
    st.dataframe(pd.DataFrame(docs) if docs else pd.DataFrame(columns=["doc_id", "source", "chunks"]), hide_index=True)

    st.subheader("Classic RAG vs. retrieval only")
    q = st.text_input("Question about your documents")
    col1, col2 = st.columns(2)
    if q and col1.button("Retrieve passages"):
        for h in api("POST", "/rag/search", json={"query": q}):
            st.caption(f"{h['source']} · score {h['score']}")
            st.write(h["text"][:500])
    if q and col2.button("Answer with Claude"):
        with st.spinner("Generating…"):
            res = api("POST", "/rag/query", json={"query": q})
        st.markdown(res["answer"])
        st.caption("Sources: " + ", ".join(s["source"] for s in res["sources"]))

elif page == "NLP playground":
    st.header("NLP pipeline")
    text = st.text_input("Text", "Remind me to email priya@example.com tomorrow at 5pm, this is great!")
    if text:
        st.json(api("POST", "/nlp/analyze", json={"text": text}))
    st.caption("Edit backend/fastapi-ai/ml/data/intents.json, then retrain:")
    if st.button("Retrain intent model"):
        api("POST", "/nlp/retrain")
        st.success("Model retrained")

elif page == "Tasks":
    st.header("Tasks (SQL)")
    with st.form("new_task", clear_on_submit=True):
        title = st.text_input("Title")
        due = st.text_input("Due (optional)")
        remind = st.text_input("Remind at (optional, ISO e.g. 2026-11-02T17:00)")
        if st.form_submit_button("Add") and title:
            api("POST", "/tasks", json={"title": title, "due": due or None, "remind_at": remind or None})
    tasks = api("GET", "/tasks", params={"include_done": True})
    st.dataframe(pd.DataFrame(tasks), hide_index=True, use_container_width=True)
    st.subheader("Notifications")
    st.dataframe(pd.DataFrame(api("GET", "/notifications")), hide_index=True, use_container_width=True)

elif page == "Memory":
    st.header("Long-term memory")
    fact = st.text_input("Add a fact")
    if st.button("Remember") and fact:
        api("POST", "/memories", json={"fact": fact})
    for m in api("GET", "/memories"):
        col1, col2 = st.columns([8, 1])
        col1.write(f"🧠 {m['fact']}")
        if col2.button("Forget", key=f"forget-{m['id']}"):
            api("DELETE", f"/memories/{m['id']}")
            st.rerun()
