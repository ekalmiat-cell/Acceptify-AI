"""add predictions table

Revision ID: 3bc8f0f04260
Revises:
Create Date: 2026-07-21 19:45:35.717829

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '3bc8f0f04260'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Note: Better Auth's own tables (user, session, account, verification,
    # jwks) are intentionally absent from SQLAlchemy's metadata (see
    # app/models/base.py), so autogenerate's diff against them is ignored here.
    op.create_table(
        'predictions',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('university_id', sa.String(), nullable=False),
        sa.Column('match_score', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_predictions_user_id'), 'predictions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_predictions_user_id'), table_name='predictions')
    op.drop_table('predictions')
