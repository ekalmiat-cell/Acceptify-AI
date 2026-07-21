import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base for every domain table this backend owns.

    Better Auth's own tables (user, session, account, verification) are
    managed separately by the frontend/Kysely — they are NOT SQLAlchemy
    models and Alembic never touches them. Better Auth's default `user.id`
    is a generated string (not a Postgres UUID), so any domain column that
    references it must be typed String, not UUID(as_uuid=True).
    """


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
