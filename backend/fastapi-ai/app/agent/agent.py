"""The Jarvis agent: a streaming, tool-using loop written by hand so you can see every step.

    user msg -> Claude --(tool_use)--> run tools -> results -> Claude -> ... -> final answer

It yields small event dicts that the API turns into Server-Sent Events:
  {"type": "text", "text": "..."}        streamed answer tokens
  {"type": "tool", "name": ..., ...}     a tool was called
  {"type": "error", "message": ...}
  {"type": "done", "usage": {...}, "tools": [...]}
"""
import asyncio
from collections.abc import AsyncIterator

from app.agent.tools import ToolContext, run_tool, tool_specs
from app.config import settings
from app.db import sql
from app.llm.claude import base_params, get_client
from app.timeutil import now_local

SYSTEM_PROMPT = """You are JARVIS, a personal AI assistant: warm, sharp, a little witty, and concise.

You can call tools for the current time, exact arithmetic, weather, Wikipedia, the user's
task list and reminders, long-term memory, the user's uploaded documents (search_knowledge),
and their computer (apps, files, clipboard, screen, volume, media, power).
For current events, prices, news or facts you aren't sure of, search the web (web_search) and
say where the answer came from; to read a page the user links, use web_fetch.
When the user asks what their notes or uploaded documents SAY, search the knowledge base before
answering and name the source documents you used. If a search finds nothing relevant, say so
rather than guessing. Use calculate for any arithmetic beyond the trivial.

On their own computer you can find and open their files (find_files, then open_file: use these
when they want a file found, opened or played). You can read and fill their clipboard: "this",
"what I copied" or "the clipboard" means read_clipboard, and after rewriting, translating or
drafting something they will paste, put it there with copy_to_clipboard and say so. You can see
their screen: "my screen", "this error" or "what am I looking at" means look_at_screen.

The user's schedule is their task list: tasks with reminder times are their appointments. When
they ask about their schedule, day or calendar, use list_tasks and present it by time. You have no
access to Google or Outlook calendars; say so only if they ask for those specifically.
When asked to write or draft an email, use compose_email so it opens ready to send.
The user has a contact list: when they name a person (email Priya, call my manager), look them up
with find_contact first and use the stored email; if nobody matches, ask for the address.

When the user asks to be reminded at a time, create a task with remind_at computed from the
current time given below. When they share a lasting personal detail or preference, save it
with remember; use what you remember naturally, without announcing it every time.

One message often holds several requests ("remind me to call mom at 6, add milk to my list,
and what's the weather in Pune?"). Do ALL of them: call every tool needed (independent tools
in the same turn), then confirm each result in one short line, in the order asked. If one part
fails, still do the rest and say which part didn't work.

Many messages are spoken through a microphone and your reply is read aloud. Speech-to-text
can mishear words; interpret them sensibly from context. Keep answers short enough to be read
aloud comfortably unless the user asks for detail.
Use Markdown only when it genuinely helps (lists, code)."""

# Added to the per-request block (not the cached prompt) when the request was spoken.
VOICE_STYLE = """This request was spoken and your reply will be read aloud right away, sentence by sentence.
Talk like a person in conversation: lead with the answer in the first sentence, keep it to one to
three short sentences, and use no Markdown, lists, tables, emoji or URLs. Say numbers, times and
units the way people say them aloud. If you need a tool, call it straight away without announcing it.
If the request is unclear, ask one short question back."""


def _user_context(user_id: str, voice: bool = False) -> str:
    """Per-request context, kept separate from the static prompt so that one stays cacheable."""
    now = now_local()
    lines = [f"Current time: {now.isoformat(timespec='minutes')} ({now.strftime('%A')}, {settings.default_timezone})."]
    if voice:
        lines.append(VOICE_STYLE)
    memories = sql.list_memories(user_id, limit=50)
    if memories:
        lines.append("What you remember about the user (id: fact):")
        lines += [f"- {m['id']}: {m['fact']}" for m in memories]
    return "\n".join(lines)


def _clean_history(history: list[dict]) -> list[dict]:
    """Prior turns arrive as plain text from the Node server; the API requires a user-first list."""
    msgs = [{"role": m["role"], "content": m["content"]} for m in history if m.get("content")]
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    return msgs


async def run_agent(
    user_message: str, history: list[dict] | None = None, user_id: str = "local", fast: bool = False
) -> AsyncIterator[dict]:
    client = get_client()
    ctx = ToolContext(user_id=user_id)
    messages = [*_clean_history(history or []), {"role": "user", "content": user_message}]

    tools = tool_specs()
    if settings.enable_web_search:  # live knowledge: search the web, and read pages the user links
        tools.append({"type": "web_search_20260209", "name": "web_search", "max_uses": 3})
        tools.append({"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 3})

    system = [
        {"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}},
        {"type": "text", "text": await asyncio.to_thread(_user_context, user_id, fast)},
    ]
    params = {**base_params(max_tokens=32000), "system": system, "tools": tools}
    if fast:  # voice: a quick answer matters more than deep thinking
        params["output_config"] = {**params.get("output_config", {}), "effort": "low"}
    usage = {"input_tokens": 0, "output_tokens": 0}
    tools_used: list[str] = []
    json_retries = 0

    for _ in range(settings.agent_max_steps):
        try:
            async with client.beta.messages.stream(messages=messages, **params) as stream:
                async for event in stream:
                    if event.type == "text":
                        yield {"type": "text", "text": event.text}
                response = await stream.get_final_message()
            json_retries = 0
        except ValueError:
            # Tool-input JSON that could not be parsed at all: re-issue the turn (bounded).
            json_retries += 1
            if json_retries > 2:
                yield {"type": "error", "message": "The model produced an unreadable tool call."}
                break
            continue

        usage["input_tokens"] += response.usage.input_tokens
        usage["output_tokens"] += response.usage.output_tokens

        if response.stop_reason == "pause_turn":  # server tool (web search) needs another round
            messages.append({"role": "assistant", "content": response.content})
            continue

        tool_uses = [b for b in response.content if b.type == "tool_use"]
        if response.stop_reason == "refusal":
            yield {"type": "error", "message": "I can't help with that request."}
            break
        if not tool_uses:
            break
        if response.stop_reason == "max_tokens":
            yield {"type": "error", "message": "Response was cut off before a tool call finished."}
            break

        # Run all requested tools in parallel (DB/HTTP calls are blocking, so use threads).
        outputs = await asyncio.gather(*(asyncio.to_thread(run_tool, b.name, b.input, ctx) for b in tool_uses))

        results = []
        for block, (content, is_error) in zip(tool_uses, outputs):
            tools_used.append(block.name)
            yield {"type": "tool", "name": block.name, "input": block.input, "ok": not is_error}
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": content, "is_error": is_error})

        # Append the full assistant content (incl. thinking blocks) unchanged, then all results in ONE user turn.
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": results})
    else:
        yield {"type": "error", "message": "Stopped after the maximum number of agent steps."}

    yield {"type": "done", "usage": usage, "tools": tools_used}
