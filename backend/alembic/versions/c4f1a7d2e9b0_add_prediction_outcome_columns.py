"""add prediction outcome columns

Revision ID: c4f1a7d2e9b0
Revises: b8dc3c777fb1
Create Date: 2026-08-18 18:41:02.114873

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = 'c4f1a7d2e9b0'
down_revision: str | None = 'b8dc3c777fb1'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Nullable with no default: an unreported decision is genuinely unknown,
    # and back-filling it with 'pending' would put a value in the calibration
    # set that nobody ever reported.
    op.add_column('predictions', sa.Column('outcome', sa.String(), nullable=True))
    op.add_column(
        'predictions',
        sa.Column('outcome_reported_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(op.f('ix_predictions_outcome'), 'predictions', ['outcome'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_predictions_outcome'), table_name='predictions')
    op.drop_column('predictions', 'outcome_reported_at')
    op.drop_column('predictions', 'outcome')
