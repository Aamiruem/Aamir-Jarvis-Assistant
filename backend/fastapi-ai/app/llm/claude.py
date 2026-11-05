"""Shared Claude client and request defaults (Anthropic Python SDK).

Credentials: ANTHROPIC_API_KEY from .env, or an `ant auth login` profile.
"""
import asyncio
import os
import time

import anthropic
from dotenv import dotenv_values

from app.config import settings

FALLBACK_BETA = "server-side-fallback-2026-07-01"

_client: anthropic.AsyncAnthropic | None = None
_client_key: str | None = None
_env_seen: tuple = ()


def _current_key() -> str | None:
    """ANTHROPIC_API_KEY, re-read from the .env files whenever they change, so a new key
    saved with `npm run set-key` works without restarting the service."""
    global _env_seen
    files = [f for f in settings.model_config["env_file"] if f.exists()]
    stamp = tuple((str(f), f.stat().st_mtime) for f in files)
    if stamp != _env_seen:
        _env_seen = stamp
        if not os.environ.get("ANTHROPIC_API_KEY"):  # a real environment variable always wins
            for f in files:  # later files override earlier ones, as in config.Settings
                key = (dotenv_values(f).get("ANTHROPIC_API_KEY") or "").strip()
                if key:
                    settings.anthropic_api_key = key
    return settings.anthropic_api_key


def get_client() -> anthropic.AsyncAnthropic:
    global _client, _client_key
    key = _current_key()
    if _client is None or key != _client_key:
        _client = anthropic.AsyncAnthropic(**({"api_key": key} if key else {}))
        _client_key = key
    return _client


# --- Is the key usable? (reported by /health, so the UI can say so before anyone chats) ------
KEY_CHECK_TTL = 300  # seconds a result is trusted (a failed check is retried sooner)
_key_status: dict = {"status": "unknown", "key": None, "at": 0.0}
_key_check: asyncio.Task | None = None


def note_api_error(e: Exception) -> None:
    """Called when a real request fails, so /health shows the problem without another API call."""
    status = _status_for(e)
    if status:
        _key_status.update(status=status, key=_current_key(), at=time.monotonic())


def _status_for(e: Exception) -> str | None:
    if isinstance(e, anthropic.AuthenticationError):
        return "invalid_key"
    if "credit balance" in str(e).lower():
        return "no_credits"
    if isinstance(e, anthropic.APIConnectionError):
        return "unreachable"
    return None


async def _check_key(key: str) -> None:
    try:
        await get_client().with_options(timeout=8, max_retries=0).models.list(limit=1)
        status = "ok"
    except Exception as e:  # noqa: BLE001 - any failure is reported, never raised
        status = _status_for(e) or "unknown"
    _key_status.update(status=status, key=key, at=time.monotonic())


def key_status() -> str:
    """"ok" | "no_key" | "invalid_key" | "no_credits" | "unreachable" | "unknown" (not checked yet).
    Never waits for the network: a stale result is refreshed in the background."""
    global _key_check
    key = _current_key()
    if not key:
        return "no_key"
    fresh = _key_status["key"] == key and time.monotonic() - _key_status["at"] < (KEY_CHECK_TTL if _key_status["status"] == "ok" else 30)
    if not fresh and (_key_check is None or _key_check.done()):
        try:
            _key_check = asyncio.get_running_loop().create_task(_check_key(key))
        except RuntimeError:  # no event loop (called from a script): leave the old answer
            pass
    return _key_status["status"] if _key_status["key"] == key else "unknown"


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
    response = await get_client().beta.messages.create(
        messages=[{"role": "user", "content": prompt_content}], **params
    )
    if response.stop_reason == "refusal":
        return "I can't help with that request."
    return text_of(response)
