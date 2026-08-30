"""Add JSONB translation columns for products, categories, and specs."""

from collections.abc import Sequence

from alembic import op

revision: str = "005"
down_revision: str | None = "004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
            ADD COLUMN IF NOT EXISTS title_ko TEXT,
            ADD COLUMN IF NOT EXISTS description_ko TEXT,
            ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

        ALTER TABLE categories
            ADD COLUMN IF NOT EXISTS name_ko TEXT,
            ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

        ALTER TABLE product_specs
            ADD COLUMN IF NOT EXISTS key_ko TEXT,
            ADD COLUMN IF NOT EXISTS value_ko TEXT,
            ADD COLUMN IF NOT EXISTS translations JSONB NOT NULL DEFAULT '{}'::jsonb;

        -- Backfill Korean source from current fields
        UPDATE products SET title_ko = title WHERE title_ko IS NULL;
        UPDATE products SET description_ko = description WHERE description_ko IS NULL;
        UPDATE categories SET name_ko = name WHERE name_ko IS NULL;
        UPDATE product_specs SET key_ko = key, value_ko = value WHERE key_ko IS NULL;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE products
            DROP COLUMN IF EXISTS title_ko,
            DROP COLUMN IF EXISTS description_ko,
            DROP COLUMN IF EXISTS translations;
        ALTER TABLE categories
            DROP COLUMN IF EXISTS name_ko,
            DROP COLUMN IF EXISTS translations;
        ALTER TABLE product_specs
            DROP COLUMN IF EXISTS key_ko,
            DROP COLUMN IF EXISTS value_ko,
            DROP COLUMN IF EXISTS translations;
        """
    )
