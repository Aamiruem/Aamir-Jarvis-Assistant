"""SQL layer (SQLAlchemy 2.0).

SQLite by default, PostgreSQL when DATABASE_URL=postgresql+psycopg://user:pass@host/db.
SQL holds *structured* data: tasks, reminders, memories, notifications and chat
analytics. Free-form conversation history lives in MongoDB (see backend/express-api/), so you
get to compare SQL and NoSQL.

Every row carries a user_id, and every query filters on it: one user can never
read or change another user's data.

Times are stored in UTC. (SQLite drops the timezone, so values read back are
treated as UTC by _aware().) Schema changes need a migration tool in real
projects. Try Alembic as an exercise; here, delete data/jarvis.db to reset.
"""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, create_engine, delete, func, or_, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.config import settings

_url = settings.sqlalchemy_url
engine = create_engine(
    _url,
    connect_args={"check_same_thread": False} if _url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _iso(dt: datetime | None) -> str | None:
    dt = _aware(dt)
    return dt.isoformat(timespec="seconds") if dt else None


class Base(DeclarativeBase):
    pass


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(300))
    due: Mapped[str | None] = mapped_column(String(80), nullable=True)
    remind_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    reminded: Mapped[bool] = mapped_column(default=False)
    done: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "due": self.due,
            "remind_at": _iso(self.remind_at),
            "done": self.done,
            "created_at": _iso(self.created_at),
        }


class Memory(Base):
    """A durable fact about the user ("prefers metric units", "sister is called Riya")."""

    __tablename__ = "memories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    fact: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def to_dict(self) -> dict:
        return {"id": self.id, "fact": self.fact, "created_at": _iso(self.created_at)}


class Contact(Base):
    """Someone in the user's address book (Jarvis looks people up here to email or call them)."""

    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    company: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    favorite: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "email": self.email,
            "company": self.company,
            "notes": self.notes,
            "favorite": self.favorite,
            "created_at": _iso(self.created_at),
        }


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(String(1000), default="")
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    def to_dict(self) -> dict:
        return {"id": self.id, "title": self.title, "body": self.body, "read": self.read, "created_at": _iso(self.created_at)}


class ChatLog(Base):
    """One row per chat turn, used by the analytics endpoints and Streamlit dashboard."""

    __tablename__ = "chat_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), index=True)
    message: Mapped[str] = mapped_column(String(2000))
    intent: Mapped[str] = mapped_column(String(40))
    sentiment: Mapped[float] = mapped_column(Float, default=0.0)
    tools_used: Mapped[str] = mapped_column(String(300), default="")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


def init_db() -> None:
    Base.metadata.create_all(engine)


# ---------- tasks ----------

def create_task(user_id: str, title: str, due: str | None = None, remind_at: datetime | None = None) -> dict:
    with SessionLocal.begin() as s:
        task = Task(user_id=user_id, title=title, due=due, remind_at=remind_at)
        s.add(task)
        s.flush()
        return task.to_dict()


def list_tasks(user_id: str, include_done: bool = False) -> list[dict]:
    with SessionLocal() as s:
        q = select(Task).where(Task.user_id == user_id).order_by(Task.created_at.desc())
        if not include_done:
            q = q.where(Task.done.is_(False))
        return [t.to_dict() for t in s.scalars(q)]


def _get_task(s, user_id: str, task_id: int) -> Task | None:
    task = s.get(Task, task_id)
    return task if task is not None and task.user_id == user_id else None


def set_task_done(user_id: str, task_id: int, done: bool = True) -> dict | None:
    with SessionLocal.begin() as s:
        task = _get_task(s, user_id, task_id)
        if task is None:
            return None
        task.done = done
        return task.to_dict()


def delete_task(user_id: str, task_id: int) -> bool:
    with SessionLocal.begin() as s:
        task = _get_task(s, user_id, task_id)
        if task is None:
            return False
        s.delete(task)
        return True


# ---------- reminders & notifications ----------

def fire_due_reminders(now: datetime | None = None) -> int:
    """Turn every due, un-sent reminder into a notification. Returns how many fired.

    FOR UPDATE SKIP LOCKED (Postgres) lets several workers run this safely in parallel;
    SQLite ignores it, which is fine for a single process.
    """
    now = now or _now()
    with SessionLocal.begin() as s:
        due = s.scalars(
            select(Task)
            .where(Task.remind_at.is_not(None), Task.remind_at <= now, Task.reminded.is_(False), Task.done.is_(False))
            .with_for_update(skip_locked=True)
        ).all()
        for task in due:
            task.reminded = True
            s.add(Notification(user_id=task.user_id, title=f"Reminder: {task.title}", body=task.due or ""))
        return len(due)


def add_notification(user_id: str, title: str, body: str = "") -> dict:
    with SessionLocal.begin() as s:
        n = Notification(user_id=user_id, title=title[:300], body=body[:1000])
        s.add(n)
        s.flush()
        return n.to_dict()


def list_notifications(user_id: str, unread_only: bool = False, limit: int = 30) -> list[dict]:
    with SessionLocal() as s:
        q = select(Notification).where(Notification.user_id == user_id)
        if unread_only:
            q = q.where(Notification.read.is_(False))
        return [n.to_dict() for n in s.scalars(q.order_by(Notification.created_at.desc()).limit(limit))]


def mark_notifications_read(user_id: str, ids: list[int]) -> int:
    with SessionLocal.begin() as s:
        rows = s.scalars(select(Notification).where(Notification.user_id == user_id, Notification.id.in_(ids))).all()
        for n in rows:
            n.read = True
        return len(rows)


# ---------- memories ----------

MAX_MEMORIES = 200


def add_memory(user_id: str, fact: str) -> dict:
    with SessionLocal.begin() as s:
        count = s.scalar(select(func.count(Memory.id)).where(Memory.user_id == user_id)) or 0
        if count >= MAX_MEMORIES:
            raise ValueError(f"Memory is full ({MAX_MEMORIES} facts). Ask the user which memories to forget.")
        memory = Memory(user_id=user_id, fact=fact.strip()[:500])
        s.add(memory)
        s.flush()
        return memory.to_dict()


def list_memories(user_id: str, limit: int = MAX_MEMORIES) -> list[dict]:
    with SessionLocal() as s:
        q = select(Memory).where(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(limit)
        return [m.to_dict() for m in s.scalars(q)]


def delete_memory(user_id: str, memory_id: int) -> bool:
    with SessionLocal.begin() as s:
        memory = s.get(Memory, memory_id)
        if memory is None or memory.user_id != user_id:
            return False
        s.delete(memory)
        return True


# ---------- contacts ----------

MAX_CONTACTS = 2000
CONTACT_FIELDS = ("name", "phone", "email", "company", "notes", "favorite")


def create_contact(user_id: str, **fields) -> dict:
    with SessionLocal.begin() as s:
        count = s.scalar(select(func.count(Contact.id)).where(Contact.user_id == user_id)) or 0
        if count >= MAX_CONTACTS:
            raise ValueError(f"Contact list is full ({MAX_CONTACTS}).")
        contact = Contact(user_id=user_id, **{k: v for k, v in fields.items() if k in CONTACT_FIELDS})
        s.add(contact)
        s.flush()
        return contact.to_dict()


def list_contacts(user_id: str, query: str = "", limit: int = MAX_CONTACTS) -> list[dict]:
    """Favorites first, then A to Z. query matches name, email, phone or company (case-insensitive)."""
    with SessionLocal() as s:
        q = select(Contact).where(Contact.user_id == user_id)
        if query.strip():
            like = f"%{query.strip().lower()}%"
            q = q.where(or_(*(func.lower(col).like(like) for col in (Contact.name, Contact.email, Contact.phone, Contact.company))))
        q = q.order_by(Contact.favorite.desc(), func.lower(Contact.name)).limit(limit)
        return [c.to_dict() for c in s.scalars(q)]


def update_contact(user_id: str, contact_id: int, **fields) -> dict | None:
    with SessionLocal.begin() as s:
        contact = s.get(Contact, contact_id)
        if contact is None or contact.user_id != user_id:
            return None
        for key, value in fields.items():
            if key in CONTACT_FIELDS and not (key == "name" and not value):  # a contact always keeps a name
                setattr(contact, key, value)
        return contact.to_dict()


def delete_contact(user_id: str, contact_id: int) -> bool:
    with SessionLocal.begin() as s:
        contact = s.get(Contact, contact_id)
        if contact is None or contact.user_id != user_id:
            return False
        s.delete(contact)
        return True


# ---------- analytics ----------

def log_chat(**fields) -> None:
    with SessionLocal.begin() as s:
        s.add(ChatLog(**fields))


def chat_stats(user_id: str | None = None) -> dict:
    """Per-user stats, or global stats when user_id is None (admin only)."""
    scope = (ChatLog.user_id == user_id,) if user_id else ()
    with SessionLocal() as s:
        total = s.scalar(select(func.count(ChatLog.id)).where(*scope)) or 0
        by_intent = dict(s.execute(select(ChatLog.intent, func.count()).where(*scope).group_by(ChatLog.intent)).all())
        avg_latency = s.scalar(select(func.avg(ChatLog.latency_ms)).where(*scope)) or 0
        tokens = s.execute(select(func.sum(ChatLog.input_tokens), func.sum(ChatLog.output_tokens)).where(*scope)).one()
        users = s.scalar(select(func.count(func.distinct(ChatLog.user_id))).where(*scope)) or 0
        recent = s.scalars(select(ChatLog).where(*scope).order_by(ChatLog.created_at.desc()).limit(20)).all()
        return {
            "total_messages": total,
            "active_users": users,
            "by_intent": by_intent,
            "avg_latency_ms": round(float(avg_latency)),
            "input_tokens": tokens[0] or 0,
            "output_tokens": tokens[1] or 0,
            "recent": [
                {
                    "message": r.message[:120],
                    "intent": r.intent,
                    "sentiment": r.sentiment,
                    "tools": r.tools_used,
                    "latency_ms": r.latency_ms,
                    "at": _iso(r.created_at),
                }
                for r in recent
            ],
        }


def delete_user_data(user_id: str) -> dict:
    """Account deletion: remove every SQL row that belongs to a user."""
    with SessionLocal.begin() as s:
        return {
            model.__tablename__: s.execute(delete(model).where(model.user_id == user_id)).rowcount
            for model in (Task, Memory, Contact, Notification, ChatLog)
        }
