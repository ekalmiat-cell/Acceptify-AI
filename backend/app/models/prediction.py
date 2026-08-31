from datetime import datetime

from sqlalchemy import DateTime, Integer, String
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

    # What actually happened — 'admitted', 'rejected', 'waitlisted' or
    # 'withdrawn', and NULL for every prediction whose decision hasn't come
    # back yet (which is most of them, most of the time).
    #
    # This column is the only thing that can ever tell us whether the scoring
    # model is any good. A score of 70 means nothing until we know what share
    # of the students it gave a 70 to were admitted; until then the model is
    # structural, not calibrated, and the app says so wherever it shows a
    # probability. Storing the score alongside the outcome — rather than
    # recomputing it later — is deliberate: weights get retuned from the
    # admin panel, and a calibration set has to record what was actually
    # predicted at the time, not what today's model would have said.
    outcome: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    outcome_reported_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
