"""Product markup, discount, manual price overrides."""

from collections.abc import Sequence

from alembic import op

revision: str = "004"
down_revision: str | None = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
            ADD COLUMN IF NOT EXISTS markup_percent NUMERIC,
            ADD COLUMN IF NOT EXISTS discount_percent NUMERIC,
            ADD COLUMN IF NOT EXISTS price_manual_krw NUMERIC
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
            DROP COLUMN IF EXISTS markup_percent,
            DROP COLUMN IF EXISTS discount_percent,
            DROP COLUMN IF EXISTS price_manual_krw
        """
    )
