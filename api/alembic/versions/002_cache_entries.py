"""Add UNLOGGED cache_entries table for Postgres-native caching."""

from collections.abc import Sequence

from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE UNLOGGED TABLE IF NOT EXISTS cache_entries (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_cache_entries_expires_at ON cache_entries (expires_at)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS cache_entries")
