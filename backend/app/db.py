"""
Session persistence layer using Python's built-in sqlite3.
Stores analysis results keyed by UUID for 24-hour re-fetch without re-upload.
"""
import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "sessions.db")


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create sessions table and purge stale sessions older than 24 hours."""
    with _get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                result_json TEXT NOT NULL
            )
        """)
        # Purge sessions older than 24 hours
        cutoff = (datetime.utcnow() - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%S")
        conn.execute("DELETE FROM sessions WHERE created_at < ?", (cutoff,))
        conn.commit()


def save_result(session_id: str, result: dict) -> None:
    """Persist an analysis result JSON under the given session ID."""
    with _get_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO sessions (id, created_at, result_json) VALUES (?, ?, ?)",
            (
                session_id,
                datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
                json.dumps(result),
            ),
        )
        conn.commit()


def get_result(session_id: str) -> Optional[dict]:
    """Retrieve a stored result by session ID, or None if not found / expired."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT result_json FROM sessions WHERE id = ?", (session_id,)
        ).fetchone()
    if row:
        return json.loads(row["result_json"])
    return None
