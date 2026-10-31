"""Talk to Jarvis from the terminal (no extra packages needed).

    python jarvis.py

Requires the AI service to be running:  cd backend/fastapi-ai && uvicorn app.main:app --port 8000
"""
import json
import os
import urllib.request

AI_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000")
KEY = os.environ.get("INTERNAL_API_KEY", "change-me-internal-key")
USER_ID = os.environ.get("JARVIS_USER_ID", "local")  # whose tasks/memories/documents to use


def stream_chat(message: str, history: list[dict]) -> str:
    req = urllib.request.Request(
        f"{AI_URL}/chat/stream",
        data=json.dumps({"message": message, "history": history}).encode(),
        headers={"Content-Type": "application/json", "X-Internal-Key": KEY, "X-User-Id": USER_ID},
    )
    reply = ""
    with urllib.request.urlopen(req, timeout=300) as resp:
        for raw in resp:
            line = raw.decode("utf-8").strip()
            if not line.startswith("data: "):
                continue
            ev = json.loads(line[6:])
            if ev["type"] == "text":
                reply += ev["text"]
                print(ev["text"], end="", flush=True)
            elif ev["type"] == "tool":
                print(f"\n  [tool: {ev['name']}]", flush=True)
            elif ev["type"] == "error":
                print(f"\n  [error: {ev['message']}]", flush=True)
    print()
    return reply


def main() -> None:
    print("Hello, I'm Jarvis. Type 'exit' to quit.\n")
    history: list[dict] = []
    while True:
        try:
            message = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if message.lower() in {"exit", "quit", "bye"}:
            break
        if not message:
            continue
        print("Jarvis: ", end="", flush=True)
        reply = stream_chat(message, history)
        history += [{"role": "user", "content": message}, {"role": "assistant", "content": reply}]
    print("Goodbye.")


if __name__ == "__main__":
    main()
