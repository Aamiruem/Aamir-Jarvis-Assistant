"""Shared Claude client and request defaults (Anthropic Python SDK).

Credentials: ANTHROPIC_API_KEY from .env, or an `ant auth login` profile. When there is no working
Claude key and OPENAI_API_KEY is set, get_client() hands back an OpenAI stand-in with the same
messages interface (app/llm/openai_shim.py), so every feature keeps working.
"""
import asyncio
import os
import time

import anthropic
from dotenv import dotenv_values

from app.config import settings

FALLBACK_BETA = "server-side-fallback-2026-07-01"

_client = None  # anthropic.AsyncAnthropic, or the OpenAI stand-in (openai_shim.AsyncOpenAIAsClaude)
_client_for: tuple | None = None
_env_seen: tuple = ()

# Keys re-read from the .env files when they change (so `npm run set-key` works without a restart).
# A real environment variable always wins over the file.
_KEYS = {"ANTHROPIC_API_KEY": "anthropic_api_key", "OPENAI_API_KEY": "openai_api_key"}


def _refresh_keys() -> None:
    global _env_seen
    files = [f for f in settings.model_config["env_file"] if f.exists()]
    stamp = tuple((str(f), f.stat().st_mtime) for f in files)
    if stamp == _env_seen:
        return
    _env_seen = stamp
    for env_name, field in _KEYS.items():
        if os.environ.get(env_name):
            continue
        for f in files:  # later files override earlier ones, as in config.Settings
            value = (dotenv_values(f).get(env_name) or "").strip()
            if value:
                setattr(settings, field, value)


def _current_key() -> str | None:
    """The Claude key (ANTHROPIC_API_KEY)."""
    _refresh_keys()
    return settings.anthropic_api_key


def _openai_key() -> str:
    _refresh_keys()
    return (settings.openai_api_key or "").strip()


# --- Which AI answers: Claude, or OpenAI when there is no working Claude key -----------------
# AI_PROVIDER=auto (default): Claude when its key works; OpenAI when the Claude key is missing,
# rejected or out of credits and OPENAI_API_KEY is set. "anthropic" or "openai" forces one.
CLAUDE_UNUSABLE = {"no_key", "invalid_key", "no_credits"}


def provider() -> str:
    """"anthropic" | "openai": who answers requests right now."""
    choice = (settings.ai_provider or "auto").lower()
    has_openai = bool(_openai_key())
    if choice == "openai" and has_openai:
        return "openai"
    if choice == "anthropic" or not has_openai:
        return "anthropic"
    key = _current_key()
    if not key:
        return "openai"
    known = _status[("anthropic", key)]["status"] if ("anthropic", key) in _status else "unknown"
    return "openai" if known in CLAUDE_UNUSABLE else "anthropic"


def get_client():
    """The client for the provider in use. Both answer client.beta.messages.create / .stream."""
    global _client, _client_for
    which = provider()
    key = _openai_key() if which == "openai" else _current_key()
    if _client is None or _client_for != (which, key):
        if which == "openai":
            from app.llm.openai_shim import AsyncOpenAIAsClaude
            _client = AsyncOpenAIAsClaude(key)
        else:
            _client = anthropic.AsyncAnthropic(**({"api_key": key} if key else {}))
        _client_for = (which, key)
    return _client


async def ready_client():
    """get_client(), after making sure an unchecked Claude key really works when OpenAI could stand
    in for it, so the first request after a restart doesn't fail on a rejected Claude key."""
    key = _current_key()
    if (settings.ai_provider or "auto").lower() == "auto" and key and _openai_key() and ("anthropic", key) not in _status:
        await _check("anthropic", key)
    return get_client()


# --- Is the key usable? (reported by /health, so the UI can say so before anyone chats) ------
KEY_CHECK_TTL = 300  # seconds a result is trusted (a failed check is retried sooner)
_status: dict[tuple, dict] = {}  # (provider, key) -> {"status", "at"}
_checks: dict[str, asyncio.Task] = {}


def note_api_error(e: Exception) -> None:
    """Called when a real request fails, so /health shows the problem without another API call."""
    status = _status_for(e)
    if status:
        which = provider()
        key = _openai_key() if which == "openai" else _current_key()
        _status[(which, key)] = {"status": status, "at": time.monotonic()}


def _status_for(e: Exception) -> str | None:
    try:
        import openai
    except ImportError:  # the OpenAI stand-in is optional
        openai = None
    if isinstance(e, anthropic.AuthenticationError) or (openai and isinstance(e, openai.AuthenticationError)):
        return "invalid_key"
    text = str(e).lower()
    if any(t in text for t in ("credit balance", "no credits", "insufficient_quota", "exceeded your current quota", "billing")):
        return "no_credits"
    if isinstance(e, anthropic.APIConnectionError) or (openai and isinstance(e, openai.APIConnectionError)):
        return "unreachable"
    return None


async def _check(which: str, key: str) -> None:
    try:
        if which == "openai":
            from app.llm.openai_shim import AsyncOpenAIAsClaude
            await AsyncOpenAIAsClaude(key).with_options(timeout=8, max_retries=0).models.list(limit=1)
        else:
            await anthropic.AsyncAnthropic(api_key=key).with_options(timeout=8, max_retries=0).models.list(limit=1)
        status = "ok"
    except Exception as e:  # noqa: BLE001 - any failure is reported, never raised
        status = _status_for(e) or "unknown"
    _status[(which, key)] = {"status": status, "at": time.monotonic()}


def _status_of(which: str, key: str) -> str:
    """The last known status of one key; refreshes it in the background when stale. Never waits."""
    entry = _status.get((which, key))
    fresh = entry and time.monotonic() - entry["at"] < (KEY_CHECK_TTL if entry["status"] == "ok" else 30)
    task = _checks.get(which)
    if not fresh and (task is None or task.done()):
        try:
            _checks[which] = asyncio.get_running_loop().create_task(_check(which, key))
        except RuntimeError:  # no event loop (called from a script): leave the old answer
            pass
    return entry["status"] if entry else "unknown"


def key_status() -> str:
    """The AI key in use: "ok" | "no_key" | "invalid_key" | "no_credits" | "unreachable" | "unknown".
    With a working OpenAI key standing in for a missing or rejected Claude key, that is "ok"."""
    claude_key = _current_key()
    claude = _status_of("anthropic", claude_key) if claude_key else "no_key"
    if provider() == "openai" or (claude in CLAUDE_UNUSABLE and _openai_key()):
        return _status_of("openai", _openai_key())
    return claude


def claude_key_status() -> str:
    """The Claude key alone (for the Command Center's provider list)."""
    key = _current_key()
    return _status_of("anthropic", key) if key else "no_key"


def openai_key_status() -> str:
    key = _openai_key()
    return _status_of("openai", key) if key else "no_key"


def base_params(max_tokens: int = 16000) -> dict:
    """Parameters every Azarvis request shares. Use with client.beta.messages.*"""
    params: dict = {
        "model": settings.claude_model,
        "max_tokens": max_tokens,
        # Opus 5.5 always thinks adaptively; effort controls depth/cost (default medium).
        "output_config": {"effort": settings.claude_effort},
    }
    if settings.claude_fallbacks:
        # If a safety classifier declines, the API re-runs on a fallback model in the same call.
        params["betas"] = [FALLBACK_BETA]
        params["extra_body"] = {"fallbacks": settings.claude_fallbacks}
    return params


def text_of(message) -> str:
    return "".join(b.text for b in message.content if b.type == "text")


async def complete(prompt_content, system: str | None = None, max_tokens: int = 16000) -> str:
    """One-shot (non-agent) request. prompt_content is a string or a list of content blocks."""
    params = base_params(max_tokens)
    if system:
        params["system"] = system
    response = await (await ready_client()).beta.messages.create(
        messages=[{"role": "user", "content": prompt_content}], **params
    )
    if response.stop_reason == "refusal":
        return "I can't help with that request."
    return text_of(response)
