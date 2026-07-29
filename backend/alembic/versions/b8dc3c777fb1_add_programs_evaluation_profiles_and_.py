"""add programs, evaluation profiles and weights, dream program id

Revision ID: b8dc3c777fb1
Revises: 3bc8f0f04260
Create Date: 2026-07-23 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'b8dc3c777fb1'
down_revision: str | None = 'b93a8e5a8110'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'programs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('university_id', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('field', sa.String(), nullable=False),
        sa.Column('parent_program_id', sa.String(), nullable=True),
        sa.Column('level', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['university_id'], ['universities.id']),
        sa.ForeignKeyConstraint(['parent_program_id'], ['programs.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_programs_university_id'), 'programs', ['university_id'])
    op.create_index(op.f('ix_programs_slug'), 'programs', ['slug'])
    op.create_index(op.f('ix_programs_field'), 'programs', ['field'])

    op.create_table(
        'evaluation_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('program_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['program_id'], ['programs.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('program_id'),
    )
    op.create_index(op.f('ix_evaluation_profiles_program_id'), 'evaluation_profiles', ['program_id'])

    op.create_table(
        'evaluation_weights',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('evaluation_profile_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('criterion_key', sa.String(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['evaluation_profile_id'], ['evaluation_profiles.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('evaluation_profile_id', 'criterion_key', name='uq_eval_weight_profile_criterion'),
    )
    op.create_index(
        op.f('ix_evaluation_weights_evaluation_profile_id'), 'evaluation_weights', ['evaluation_profile_id']
    )

    op.add_column('student_profiles', sa.Column('dream_program_id', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('student_profiles', 'dream_program_id')

    op.drop_index(op.f('ix_evaluation_weights_evaluation_profile_id'), table_name='evaluation_weights')
    op.drop_table('evaluation_weights')

    op.drop_index(op.f('ix_evaluation_profiles_program_id'), table_name='evaluation_profiles')
    op.drop_table('evaluation_profiles')

    op.drop_index(op.f('ix_programs_field'), table_name='programs')
    op.drop_index(op.f('ix_programs_slug'), table_name='programs')
    op.drop_index(op.f('ix_programs_university_id'), table_name='programs')
    op.drop_table('programs')
