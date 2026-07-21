from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Prediction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single AI match-score calculation a user has run against a university.

    `user_id` stores Better Auth's `user.id` as a plain string — that table
    lives outside SQLAlchemy's metadata, so there's no Postgres FK, only an
    application-level reference.
    """

    __tablename__ = "predictions"

    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    university_id: Mapped[str] = mapped_column(String, nullable=False)
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Saved")
