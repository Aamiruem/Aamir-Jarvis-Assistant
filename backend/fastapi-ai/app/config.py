"""Central settings, read from environment variables or a .env file (pydantic-settings)."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_DIR = Path(__file__).resolve().parent.parent   # backend/fastapi-ai
PROJECT_ROOT = SERVICE_DIR.parent.parent               # where the shared .env lives


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(PROJECT_ROOT / ".env", SERVICE_DIR / ".env"),
        extra="ignore",
    )

    # LLM
    anthropic_api_key: str | None = None
    claude_model: str = "claude-opus-5-5"
    claude_effort: str = "medium"          # low | medium | high | xhigh | max
    claude_fallbacks: str = "default"      # server-side refusal fallback; "" disables
    enable_web_search: bool = True         # Anthropic server-side web_search + web_fetch tools
    agent_max_steps: int = 8

    # Assistant behaviour
    default_timezone: str = "Asia/Kolkata"   # used when the user gives a time without a zone
    reminder_interval_seconds: int = 30      # how often the scheduler checks for due reminders
    pc_watch_interval_seconds: int = 30      # how often the PC watcher looks at battery, disk, downloads…
    system_control: bool = True              # open apps/sites, volume, lock... on THIS PC (false on servers)

    # Data
    data_dir: Path = SERVICE_DIR / "data"
    database_url: str = ""                 # empty -> SQLite file in data_dir
    rag_embedder: str = "tfidf"            # tfidf | sentence-transformers

    # AWS
    s3_bucket: str | None = None
    aws_region: str = "ap-south-1"

    # Security / networking
    internal_api_key: str = "change-me-internal-key"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost:8501"
    # WhatsApp Jarvis (app/whatsapp/): messages arrive at the Express API's webhook on Vercel and
    # this PC fetches them from WHATSAPP_RELAY_URL with WHATSAPP_RELAY_KEY (no tunnel, no open port).
    # WHATSAPP_OWNER_NUMBER: your number with country code, digits only (e.g. 91XXXXXXXXXX): only
    # that number can give commands. WHATSAPP_USER_ID: whose tasks to use ("" = the most active user
    # on this PC). GROQ_API_KEY (free tier): understands WhatsApp voice notes (Whisper).
    whatsapp_relay_url: str = ""
    whatsapp_relay_key: str = ""
    whatsapp_owner_number: str = ""
    whatsapp_user_id: str = ""
    whatsapp_poll_seconds: float = 3.0
    groq_api_key: str = ""

    # Local bridge (app/routers/local_bridge.py): these websites may read this PC's read-only
    # device details (CPU, memory, disk, battery, wired/Wi-Fi) from the browser. "" turns it off.
    local_bridge_origins: str = "https://azarvis-app.vercel.app,https://azarvis-ai.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"

    @property
    def sqlalchemy_url(self) -> str:
        return self.database_url or f"sqlite:///{(self.data_dir / 'jarvis.db').as_posix()}"


settings = Settings()
settings.data_dir.mkdir(parents=True, exist_ok=True)
