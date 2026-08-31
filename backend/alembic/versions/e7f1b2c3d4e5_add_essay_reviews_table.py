"""add essay_reviews table

Revision ID: e7f1b2c3d4e5
Revises: c4f1a7d2e9b0
Create Date: 2026-08-31 10:48:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'e7f1b2c3d4e5'
down_revision: str | None = 'c4f1a7d2e9b0'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'essay_reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('university_id', sa.String(), nullable=True),
        sa.Column('program_id', sa.String(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('prompt_text', sa.Text(), nullable=True),
        sa.Column('word_count', sa.Integer(), nullable=False),
        sa.Column('essay_snippet', sa.String(length=300), nullable=False),
        sa.Column('essay_text', sa.Text(), nullable=False),
        sa.Column('analysis_result', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(['university_id'], ['universities.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_essay_reviews_user_id'), 'essay_reviews', ['user_id'], unique=False)
    op.create_index(
        op.f('ix_essay_reviews_university_id'), 'essay_reviews', ['university_id'], unique=False
    )
    op.create_index(
        op.f('ix_essay_reviews_overall_score'), 'essay_reviews', ['overall_score'], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_essay_reviews_overall_score'), table_name='essay_reviews')
    op.drop_index(op.f('ix_essay_reviews_university_id'), table_name='essay_reviews')
    op.drop_index(op.f('ix_essay_reviews_user_id'), table_name='essay_reviews')
    op.drop_table('essay_reviews')
