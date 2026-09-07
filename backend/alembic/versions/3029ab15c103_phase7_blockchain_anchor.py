"""phase7_blockchain_anchor

Revision ID: 3029ab15c103
Revises: 1890ab24c102
Create Date: 2026-09-07 14:32:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '3029ab15c103'
down_revision: Union[str, None] = '1890ab24c102'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('blockchain_anchors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('batch_id', sa.String(length=100), nullable=False),
        sa.Column('record_type', sa.String(length=50), nullable=False),
        sa.Column('record_id', sa.String(length=100), nullable=True),
        sa.Column('payload_hash', sa.String(length=64), nullable=False),
        sa.Column('blockchain_provider', sa.String(length=50), nullable=False),
        sa.Column('network', sa.String(length=50), nullable=False),
        sa.Column('transaction_hash', sa.String(length=100), nullable=False),
        sa.Column('block_number', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ANCHORED'),
        sa.Column('anchored_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['batch_id'], ['batches.batch_id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_blockchain_anchors_id'), 'blockchain_anchors', ['id'], unique=False)
    op.create_index(op.f('ix_blockchain_anchors_batch_id'), 'blockchain_anchors', ['batch_id'], unique=False)
    op.create_index(op.f('ix_blockchain_anchors_payload_hash'), 'blockchain_anchors', ['payload_hash'], unique=False)
    op.create_index(op.f('ix_blockchain_anchors_transaction_hash'), 'blockchain_anchors', ['transaction_hash'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_blockchain_anchors_transaction_hash'), table_name='blockchain_anchors')
    op.drop_index(op.f('ix_blockchain_anchors_payload_hash'), table_name='blockchain_anchors')
    op.drop_index(op.f('ix_blockchain_anchors_batch_id'), table_name='blockchain_anchors')
    op.drop_index(op.f('ix_blockchain_anchors_id'), table_name='blockchain_anchors')
    op.drop_table('blockchain_anchors')
