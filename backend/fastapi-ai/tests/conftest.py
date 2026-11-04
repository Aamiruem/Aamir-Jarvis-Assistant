"""Test setup: a throwaway data directory, so tests never touch your real database."""
import os
import sys
import tempfile
import types

os.environ["DATA_DIR"] = tempfile.mkdtemp(prefix="jarvis-test-")
os.environ["DATABASE_URL"] = ""
os.environ["S3_BUCKET"] = ""
os.environ["INTERNAL_API_KEY"] = "test-key"
os.environ["PC_WATCH_INTERVAL_SECONDS"] = "86400"  # the real PC watcher must not alert during tests

try:
    import anthropic  # noqa: F401
except ImportError:
    # The LLM is never called in these tests; a stub keeps them runnable where the SDK
    # can't load (e.g. a native dependency blocked by Windows Smart App Control).
    stub = types.ModuleType("anthropic")
    stub.AsyncAnthropic = object
    sys.modules["anthropic"] = stub
