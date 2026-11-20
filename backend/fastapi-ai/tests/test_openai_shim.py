"""OpenAI standing in for Claude: request/response translation, streaming with tool calls, and when
the app picks OpenAI. A fake OpenAI client is used, so no API calls (or credits) are needed."""
import asyncio
import json
from types import SimpleNamespace as NS

from app.config import settings
from app.llm import claude
from app.llm.openai_shim import AsyncOpenAIAsClaude, request_kwargs, to_openai_messages, to_openai_tools

TOOL = {"name": "calculate", "description": "Math.", "input_schema": {"type": "object", "properties": {"expression": {"type": "string"}}}}


def test_messages_tools_and_images_translate():
    prior = [NS(type="thinking", thinking="…"), NS(type="text", text="Let me work it out."),
             NS(type="tool_use", id="call_1", name="calculate", input={"expression": "6*7"})]
    msgs = to_openai_messages(
        [{"type": "text", "text": "You are Azarvis."}, {"type": "text", "text": "User facts."}],
        [
            {"role": "user", "content": [{"type": "text", "text": "What is this?"},
                                         {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "AAA"}}]},
            {"role": "assistant", "content": prior},
            {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "call_1", "content": '{"result": 42}', "is_error": False}]},
        ],
    )
    assert msgs[0] == {"role": "system", "content": "You are Azarvis.\n\nUser facts."}
    assert msgs[1]["content"][1] == {"type": "image_url", "image_url": {"url": "data:image/png;base64,AAA"}}
    assert msgs[2]["content"] == "Let me work it out."  # thinking dropped
    assert msgs[2]["tool_calls"][0]["function"] == {"name": "calculate", "arguments": json.dumps({"expression": "6*7"})}
    assert msgs[3] == {"role": "tool", "tool_call_id": "call_1", "content": '{"result": 42}'}


def test_server_tools_are_left_out_and_schema_output_maps():
    assert to_openai_tools([TOOL, {"type": "web_search_20260209", "name": "web_search"}]) == [
        {"type": "function", "function": {"name": "calculate", "description": "Math.", "parameters": TOOL["input_schema"]}}
    ]
    kw = request_kwargs({"messages": [{"role": "user", "content": "hi"}], "max_tokens": 99999,
                         "output_config": {"effort": "max", "format": {"type": "json_schema", "schema": {"type": "object"}}}})
    assert kw["max_completion_tokens"] == settings.openai_max_tokens
    assert kw["response_format"]["json_schema"]["schema"] == {"type": "object"}
    assert kw["reasoning_effort"] == "high"


class FakeCompletions:
    """Answers like Chat Completions: a tool call first, then text after the tool result."""

    def __init__(self):
        self.calls = []

    async def create(self, **kw):
        self.calls.append(kw)
        has_result = any(m["role"] == "tool" for m in kw["messages"])
        if kw.get("stream"):
            return self._stream(has_result)
        msg = NS(content="Forty-two.", tool_calls=None, refusal=None)
        return NS(choices=[NS(message=msg, finish_reason="stop")], usage=NS(prompt_tokens=11, completion_tokens=3))

    async def _stream(self, has_result):
        def chunk(content=None, tool=None, finish=None):
            delta = NS(content=content, tool_calls=[tool] if tool else None, refusal=None)
            return NS(choices=[NS(delta=delta, finish_reason=finish)], usage=None)
        if has_result:
            for piece in ("It is ", "42."):
                yield chunk(content=piece)
            yield chunk(finish="stop")
        else:
            yield chunk(tool=NS(index=0, id="call_9", function=NS(name="calculate", arguments='{"expre')))
            yield chunk(tool=NS(index=0, id=None, function=NS(name=None, arguments='ssion": "6*7"}')))
            yield chunk(finish="tool_calls")
        yield NS(choices=[], usage=NS(prompt_tokens=20, completion_tokens=5))


def fake_client():
    c = AsyncOpenAIAsClaude("sk-test")
    fake = FakeCompletions()
    c._client = NS(chat=NS(completions=fake))
    c.messages._client = c._client
    return c, fake


def test_create_and_a_streamed_tool_round_trip():
    async def scenario():
        c, fake = fake_client()
        r = await c.beta.messages.create(messages=[{"role": "user", "content": "6*7?"}], max_tokens=100)
        assert r.stop_reason == "end_turn" and r.content[0].text == "Forty-two." and r.usage.input_tokens == 11

        msgs = [{"role": "user", "content": "6*7? use the tool"}]
        async with c.beta.messages.stream(messages=msgs, tools=[TOOL], max_tokens=100) as s:
            async for _ in s:
                pass
            m = await s.get_final_message()
        tool = m.content[0]
        assert m.stop_reason == "tool_use" and tool.type == "tool_use" and tool.input == {"expression": "6*7"} and tool.id == "call_9"
        assert m.usage.output_tokens == 5

        msgs += [{"role": "assistant", "content": m.content},
                 {"role": "user", "content": [{"type": "tool_result", "tool_use_id": "call_9", "content": "42", "is_error": False}]}]
        async with c.beta.messages.stream(messages=msgs, tools=[TOOL], max_tokens=100) as s:
            text = "".join([ev.text async for ev in s])
            m2 = await s.get_final_message()
        assert text == "It is 42." and m2.stop_reason == "end_turn"
        assert fake.calls[-1]["messages"][-1] == {"role": "tool", "tool_call_id": "call_9", "content": "42"}

    asyncio.run(scenario())


def test_openai_answers_when_claude_is_missing_or_rejected(monkeypatch):
    monkeypatch.setattr(claude, "_refresh_keys", lambda: None)
    monkeypatch.setattr(settings, "ai_provider", "auto")
    monkeypatch.setattr(settings, "openai_api_key", "sk-openai")
    claude._status.clear()

    monkeypatch.setattr(settings, "anthropic_api_key", None)
    assert claude.provider() == "openai"
    assert isinstance(claude.get_client(), AsyncOpenAIAsClaude)

    monkeypatch.setattr(settings, "anthropic_api_key", "sk-ant-bad")
    assert claude.provider() == "anthropic"  # not checked yet: Claude first
    claude._status[("anthropic", "sk-ant-bad")] = {"status": "invalid_key", "at": 1e12}
    assert claude.provider() == "openai"

    claude._status[("anthropic", "sk-ant-bad")] = {"status": "ok", "at": 1e12}
    assert claude.provider() == "anthropic"
    monkeypatch.setattr(settings, "ai_provider", "openai")
    assert claude.provider() == "openai"

    monkeypatch.setattr(settings, "openai_api_key", "")
    assert claude.provider() == "anthropic"  # no OpenAI key: always Claude
    claude._status.clear()


def test_out_of_credit_wording_from_both_providers():
    assert claude._status_for(Exception("Your credit balance is too low")) == "no_credits"
    assert claude._status_for(Exception("Error code: 429 - You have no credits remaining.")) == "no_credits"
