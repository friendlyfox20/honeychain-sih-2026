"""phase5_qr_verification

Revision ID: 1890ab24c102
Revises: 157baa54b911
Create Date: 2026-09-07 13:49:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '1890ab24c102'
down_revision: Union[str, None] = '157baa54b911'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('qr_verifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.String(length=100), nullable=False),
        sa.Column('verification_token', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.batch_id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('verification_token', name='uq_qr_verification_token')
    )
    op.create_index(op.f('ix_qr_verifications_id'), 'qr_verifications', ['id'], unique=False)
    op.create_index(op.f('ix_qr_verifications_batch_id'), 'qr_verifications', ['batch_id'], unique=False)
    op.create_index(op.f('ix_qr_verifications_verification_token'), 'qr_verifications', ['verification_token'], unique=True)

def downgrade() -> None:
    op.drop_index(op.f('ix_qr_verifications_verification_token'), table_name='qr_verifications')
    op.drop_index(op.f('ix_qr_verifications_batch_id'), table_name='qr_verifications')
    op.drop_index(op.f('ix_qr_verifications_id'), table_name='qr_verifications')
    op.drop_table('qr_verifications')
