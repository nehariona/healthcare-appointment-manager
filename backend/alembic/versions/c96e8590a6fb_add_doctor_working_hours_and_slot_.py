"""add doctor working hours and slot duration

Revision ID: c96e8590a6fb
Revises: 75d638e9b721
Create Date: 2026-08-23 10:52:51.834339
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c96e8590a6fb"
down_revision: Union[str, Sequence[str], None] = "75d638e9b721"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "doctors",
        sa.Column(
            "working_start",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'09:00:00'")
        )
    )

    op.add_column(
        "doctors",
        sa.Column(
            "working_end",
            sa.Time(),
            nullable=False,
            server_default=sa.text("'17:00:00'")
        )
    )

    op.add_column(
        "doctors",
        sa.Column(
            "slot_duration",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("30")
        )
    )

    op.add_column(
        "doctors",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true")
        )
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column("doctors", "is_active")
    op.drop_column("doctors", "slot_duration")
    op.drop_column("doctors", "working_end")
    op.drop_column("doctors", "working_start")