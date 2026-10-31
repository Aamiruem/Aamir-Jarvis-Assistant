"""02 · SQL — standard SQL on a real database engine (SQLite ships with Python).

Run:  python 02-sql/main.py
Everything here also works on PostgreSQL (see 03-postgresql for Postgres-only features).
"""
import sqlite3

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
db.execute("PRAGMA foreign_keys = ON")


def q(sql: str, params: tuple = ()) -> list[dict]:
    return [dict(r) for r in db.execute(sql, params).fetchall()]


def show(title: str, rows: list[dict]) -> None:
    print(f"\n── {title}")
    for r in rows:
        print("  ", r)


# ── Schema with constraints ──────────────────────────────────────────────────
db.executescript("""
CREATE TABLE users (
  id         INTEGER PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL
);
CREATE TABLE tasks (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  priority   INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  done       BOOLEAN NOT NULL DEFAULT 0,
  due_at     TEXT
);
CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT, balance INTEGER NOT NULL CHECK (balance >= 0));
""")

# ── INSERT (always with ? parameters — never format user input into SQL) ─────
db.executemany("INSERT INTO users (email, name) VALUES (?, ?)",
               [("aamir@example.com", "Aamir"), ("manish@example.com", "Manish"), ("sara@example.com", "Sara")])
db.executemany("INSERT INTO tasks (user_id, title, priority, done, due_at) VALUES (?, ?, ?, ?, ?)", [
    (1, "Learn SQL", 1, 0, "2026-11-01"),
    (1, "Buy milk", 4, 1, None),
    (1, "Write tests", 2, 0, "2026-11-03"),
    (2, "Deploy API", 2, 0, None),
    (2, "Fix login bug", 1, 1, "2026-10-28"),
])
db.executemany("INSERT INTO accounts (owner, balance) VALUES (?, ?)", [("Aamir", 1000), ("Manish", 200)])

# ── Constraints protect your data ────────────────────────────────────────────
for bad_sql, params in [
    ("INSERT INTO users (email, name) VALUES (?, ?)", ("aamir@example.com", "Dup")),   # UNIQUE
    ("INSERT INTO tasks (user_id, title) VALUES (?, ?)", (99, "orphan")),              # FOREIGN KEY
    ("INSERT INTO tasks (user_id, title, priority) VALUES (?, ?, ?)", (1, "x", 9)),     # CHECK
]:
    try:
        db.execute(bad_sql, params)
        raise AssertionError("constraint should have failed")
    except sqlite3.IntegrityError as e:
        print("rejected:", e)

# ── SELECT, WHERE, ORDER BY, LIMIT ───────────────────────────────────────────
rows = q("SELECT title, priority FROM tasks WHERE user_id = ? AND done = 0 ORDER BY priority, due_at LIMIT 10", (1,))
show("Aamir's open tasks", rows)
assert [r["title"] for r in rows] == ["Learn SQL", "Write tests"]

# ── INNER JOIN vs LEFT JOIN ──────────────────────────────────────────────────
inner = q("SELECT u.name, t.title FROM tasks t JOIN users u ON u.id = t.user_id ORDER BY t.id")
left = q("""SELECT u.name, COUNT(t.id) AS task_count
            FROM users u LEFT JOIN tasks t ON t.user_id = u.id
            GROUP BY u.id ORDER BY u.id""")
show("LEFT JOIN keeps users with zero tasks", left)
assert len(inner) == 5 and left[2] == {"name": "Sara", "task_count": 0}

# ── GROUP BY + HAVING ────────────────────────────────────────────────────────
stats = q("""SELECT user_id,
                    COUNT(*) AS total,
                    SUM(CASE WHEN done THEN 1 ELSE 0 END) AS completed,
                    ROUND(AVG(priority), 2) AS avg_priority
             FROM tasks GROUP BY user_id HAVING COUNT(*) >= 2 ORDER BY user_id""")
show("per-user stats", stats)
assert stats[0] == {"user_id": 1, "total": 3, "completed": 1, "avg_priority": 2.33}

# ── Subquery ─────────────────────────────────────────────────────────────────
urgent = q("SELECT name FROM users WHERE id IN (SELECT user_id FROM tasks WHERE priority = 1 AND NOT done)")
assert urgent == [{"name": "Aamir"}]

# ── CTE + window functions ───────────────────────────────────────────────────
ranked = q("""
WITH open_tasks AS (SELECT * FROM tasks WHERE NOT done)
SELECT u.name, o.title, o.priority,
       RANK()   OVER (PARTITION BY o.user_id ORDER BY o.priority) AS rank_in_user,
       COUNT(*) OVER (PARTITION BY o.user_id)                     AS user_open
FROM open_tasks o JOIN users u ON u.id = o.user_id
ORDER BY u.name, rank_in_user""")
show("window functions", ranked)
assert ranked[0]["rank_in_user"] == 1 and ranked[0]["user_open"] == 2

# ── UPDATE / DELETE ──────────────────────────────────────────────────────────
db.execute("UPDATE tasks SET done = 1 WHERE title = ?", ("Learn SQL",))
db.execute("DELETE FROM tasks WHERE done = 1 AND due_at < ?", ("2026-10-30",))
assert q("SELECT COUNT(*) AS n FROM tasks")[0]["n"] == 4

# ── Transactions: all or nothing ─────────────────────────────────────────────
def transfer(src: str, dst: str, amount: int) -> None:
    with db:  # commits on success, rolls back on any exception
        db.execute("UPDATE accounts SET balance = balance + ? WHERE owner = ?", (amount, dst))
        db.execute("UPDATE accounts SET balance = balance - ? WHERE owner = ?", (amount, src))


transfer("Aamir", "Manish", 300)
try:
    transfer("Manish", "Aamir", 10_000)  # would go negative → CHECK fails → whole transfer undone
except sqlite3.IntegrityError:
    print("\ntransfer rolled back")
balances = {r["owner"]: r["balance"] for r in q("SELECT owner, balance FROM accounts")}
show("balances", [balances])
assert balances == {"Aamir": 700, "Manish": 500}

# ── Indexes: check the query plan ────────────────────────────────────────────
db.execute("CREATE INDEX idx_tasks_user_done ON tasks (user_id, done)")
plan = q("EXPLAIN QUERY PLAN SELECT * FROM tasks WHERE user_id = 1 AND done = 0")
print("\nplan:", plan[0]["detail"])
assert "idx_tasks_user_done" in plan[0]["detail"]

# ── ON DELETE CASCADE ────────────────────────────────────────────────────────
db.execute("DELETE FROM users WHERE id = 2")
assert q("SELECT COUNT(*) AS n FROM tasks WHERE user_id = 2")[0]["n"] == 0

print("\n✓ 02-sql passed")
