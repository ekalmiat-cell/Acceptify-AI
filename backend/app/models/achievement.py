from sqlalchemy import Boolean, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Achievement(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single self-reported achievement/activity entry for a user, keyed
    against the frontend's static achievement catalog
    (frontend/src/data/achievement-catalog.ts) by `key`.
    """

    __tablename__ = "achievements"
    __table_args__ = (UniqueConstraint("user_id", "key", name="uq_achievements_user_id_key"),)

    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    key: Mapped[str] = mapped_column(String, nullable=False)
    achieved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    value: Mapped[str | None] = mapped_column(String, nullable=True)
    level: Mapped[str | None] = mapped_column(String, nullable=True)
