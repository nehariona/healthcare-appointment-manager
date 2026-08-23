"""add doctor verification

Revision ID: 0e411d946f98
Revises: cbe5a14f9433
Create Date: 2026-08-22 23:18:25.028893
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = "0e411d946f98"
down_revision: Union[str, Sequence[str], None] = "cbe5a14f9433"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "is_verified")