"""OpenAI as a stand-in for Claude: the same `client.beta.messages.create / .stream` calls the rest
of Azarvis makes, answered by OpenAI's Chat Completions API.

Used when there is no working Claude key but OPENAI_API_KEY is set (or AI_PROVIDER=openai), so
chat, the agent's tools, voice, notes, vision, planning and summaries all keep working.

What carries over: system prompts, text, images (base64), your own tools (tool_use / tool_result),
streaming text, JSON-schema output (output_config.format) and token usage. What doesn't:
Anthropic's server tools (web_search, web_fetch) are left out, and thinking blocks are dropped.
"""
from __future__ import annotations

import json
from types import SimpleNamespace as NS

import openai

from app.config import settings

# Anthropic stop reasons the callers check, from OpenAI finish reasons.
STOP = {"stop": "end_turn", "tool_calls": "tool_use", "function_call": "tool_use", "length": "max_tokens", "content_filter": "refusal"}
EFFORT = {"low": "low", "medium": "medium", "high": "high", "xhigh": "high", "max": "high"}


def _get(block, key, default=None):
    """A content block may be a dict (built by our code) or an object (a previous response)."""
    return block.get(key, default) if isinstance(block, dict) else getattr(block, key, default)


def _text_of_blocks(content) -> str:
    if isinstance(content, str):
        return content
    return "\n\n".join(_get(b, "text", "") for b in content if _get(b, "type") == "text")


def _user_parts(content) -> list[dict] | str:
    if isinstance(content, str):
        return content
    parts = []
    for b in content:
        kind = _get(b, "type")
        if kind == "text":
            parts.append({"type": "text", "text": _get(b, "text", "")})
        elif kind == "image":
            src = _get(b, "source", {}) or {}
            if _get(src, "type") == "base64":
                parts.append({"type": "image_url", "image_url": {"url": f"data:{_get(src, 'media_type')};base64,{_get(src, 'data')}"}})
            elif _get(src, "type") == "url":
                parts.append({"type": "image_url", "image_url": {"url": _get(src, "url")}})
    return parts


def _tool_result_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return _text_of_blocks(content) or json.dumps([_get(b, "type") for b in content])
    return json.dumps(content, default=str)


def to_openai_messages(system, messages: list) -> list[dict]:
    """Anthropic-style system + messages → Chat Completions messages."""
    out: list[dict] = []
    sys_text = _text_of_blocks(system) if system else ""
    if sys_text:
        out.append({"role": "system", "content": sys_text})
    for m in messages:
        role, content = m["role"], m["content"]
        if role == "assistant":
            if isinstance(content, str):
                out.append({"role": "assistant", "content": content})
                continue
            text = _text_of_blocks(content)
            calls = [
                {"id": _get(b, "id"), "type": "function", "function": {"name": _get(b, "name"), "arguments": json.dumps(_get(b, "input") or {})}}
                for b in content if _get(b, "type") == "tool_use"
            ]
            msg: dict = {"role": "assistant", "content": text or None}
            if calls:
                msg["tool_calls"] = calls
            out.append(msg)
            continue
        # user: tool results become "tool" messages; anything else stays a user message
        if isinstance(content, list) and any(_get(b, "type") == "tool_result" for b in content):
            for b in content:
                if _get(b, "type") == "tool_result":
                    body = _tool_result_text(_get(b, "content", ""))
                    if _get(b, "is_error"):
                        body = f"[tool error] {body}"
                    out.append({"role": "tool", "tool_call_id": _get(b, "tool_use_id"), "content": body})
            rest = [b for b in content if _get(b, "type") != "tool_result"]
            if rest:
                out.append({"role": "user", "content": _user_parts(rest)})
            continue
        out.append({"role": "user", "content": _user_parts(content)})
    return out


def to_openai_tools(tools: list | None) -> list[dict] | None:
    """Our own tools only; Anthropic server tools (web_search_*, web_fetch_*) have no equivalent here."""
    fns = [
        {"type": "function", "function": {"name": t["name"], "description": t.get("description", ""), "parameters": t.get("input_schema") or {"type": "object", "properties": {}}}}
        for t in tools or [] if "input_schema" in t
    ]
    return fns or None


def request_kwargs(params: dict) -> dict:
    """Anthropic request params → Chat Completions arguments."""
    model = settings.openai_model
    kwargs: dict = {
        "model": model,
        "messages": to_openai_messages(params.get("system"), params.get("messages", [])),
        "max_completion_tokens": min(int(params.get("max_tokens") or 4000), settings.openai_max_tokens),
    }
    tools = to_openai_tools(params.get("tools"))
    if tools:
        kwargs["tools"] = tools
    config = params.get("output_config") or {}
    fmt = config.get("format")
    if fmt and fmt.get("type") == "json_schema":
        kwargs["response_format"] = {"type": "json_schema", "json_schema": {"name": "result", "schema": fmt["schema"]}}
    effort = EFFORT.get(config.get("effort", ""))
    if effort and model.startswith(("gpt-5", "gpt-6", "o1", "o3", "o4")):  # reasoning models only
        kwargs["reasoning_effort"] = effort
    return kwargs


def _message(text: str, calls: list[dict], finish: str | None, usage, refusal: str | None = None) -> NS:
    content = []
    if text:
        content.append(NS(type="text", text=text))
    for c in calls:
        try:
            args = json.loads(c["arguments"] or "{}")
        except ValueError:
            args = {}
        content.append(NS(type="tool_use", id=c["id"], name=c["name"], input=args))
    stop = "refusal" if refusal else STOP.get(finish or "stop", "end_turn")
    if calls and stop == "end_turn":
        stop = "tool_use"
    return NS(
        content=content,
        stop_reason=stop,
        usage=NS(input_tokens=getattr(usage, "prompt_tokens", 0) or 0, output_tokens=getattr(usage, "completion_tokens", 0) or 0),
        model=settings.openai_model,
        role="assistant",
    )


def from_completion(resp) -> NS:
    choice = resp.choices[0]
    msg = choice.message
    calls = [{"id": t.id, "name": t.function.name, "arguments": t.function.arguments} for t in (msg.tool_calls or [])]
    return _message(msg.content or "", calls, choice.finish_reason, resp.usage, getattr(msg, "refusal", None))


class _Collector:
    """Builds the final message from streamed chunks (text deltas and tool-call pieces)."""

    def __init__(self):
        self.text: list[str] = []
        self.calls: dict[int, dict] = {}
        self.finish = None
        self.usage = None
        self.refusal = None

    def add(self, chunk) -> str:
        if getattr(chunk, "usage", None):
            self.usage = chunk.usage
        if not chunk.choices:
            return ""
        choice = chunk.choices[0]
        if choice.finish_reason:
            self.finish = choice.finish_reason
        delta = choice.delta
        if getattr(delta, "refusal", None):
            self.refusal = (self.refusal or "") + delta.refusal
        for t in delta.tool_calls or []:
            call = self.calls.setdefault(t.index, {"id": "", "name": "", "arguments": ""})
            if t.id:
                call["id"] = t.id
            if t.function and t.function.name:
                call["name"] += t.function.name
            if t.function and t.function.arguments:
                call["arguments"] += t.function.arguments
        piece = delta.content or ""
        if piece:
            self.text.append(piece)
        return piece

    def final(self) -> NS:
        return _message("".join(self.text), [self.calls[i] for i in sorted(self.calls)], self.finish, self.usage, self.refusal)


class _AsyncStream:
    def __init__(self, client: openai.AsyncOpenAI, params: dict):
        self._client, self._params, self._col = client, params, _Collector()

    async def __aenter__(self):
        self._stream = await self._client.chat.completions.create(**request_kwargs(self._params), stream=True, stream_options={"include_usage": True})
        return self

    async def __aexit__(self, *exc):
        close = getattr(self._stream, "close", None)
        if close:
            await close()
        return False

    async def __aiter__(self):
        if getattr(self, "_done", False):
            return
        async for chunk in self._stream:
            piece = self._col.add(chunk)
            if piece:
                yield NS(type="text", text=piece)
        self._done = True

    async def get_final_message(self) -> NS:
        if not getattr(self, "_done", False):  # drain anything the caller didn't read
            async for _ in self.__aiter__():
                pass
        return self._col.final()


class _AsyncMessages:
    def __init__(self, client):
        self._client = client

    async def create(self, **params) -> NS:
        return from_completion(await self._client.chat.completions.create(**request_kwargs(params)))

    def stream(self, **params) -> _AsyncStream:
        return _AsyncStream(self._client, params)


class AsyncOpenAIAsClaude:
    """Looks like anthropic.AsyncAnthropic for the calls Azarvis makes."""

    provider = "openai"

    def __init__(self, api_key: str, timeout: float | None = None, max_retries: int = 2):
        self._client = openai.AsyncOpenAI(api_key=api_key, timeout=timeout or 600, max_retries=max_retries)
        self.messages = _AsyncMessages(self._client)
        self.beta = NS(messages=self.messages)
        self.models = NS(list=self._list_models)
        self._key = api_key

    async def _list_models(self, limit: int = 1):
        return await self._client.models.list()

    def with_options(self, timeout: float | None = None, max_retries: int | None = None) -> "AsyncOpenAIAsClaude":
        return AsyncOpenAIAsClaude(self._key, timeout=timeout, max_retries=2 if max_retries is None else max_retries)


def stream_text_sync(api_key: str, system: str, user_text: str, max_tokens: int, on_text) -> NS:
    """Blocking, streamed one-shot request (for background threads): calls on_text(piece), returns the final message."""
    client = openai.OpenAI(api_key=api_key)
    params = {"system": system, "messages": [{"role": "user", "content": user_text}], "max_tokens": max_tokens,
              "output_config": {"effort": settings.claude_effort}}
    col = _Collector()
    for chunk in client.chat.completions.create(**request_kwargs(params), stream=True, stream_options={"include_usage": True}):
        piece = col.add(chunk)
        if piece:
            on_text(piece)
    return col.final()
