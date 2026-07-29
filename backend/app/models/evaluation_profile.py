from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class EvaluationProfile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """The admission scoring configuration for one Program. Holds no weights
    itself — those live in `EvaluationWeight` rows — so it's really just a
    named, editable container the admin UI and scoring engine both key off
    of by `program_id`.
    """

    __tablename__ = "evaluation_profiles"

    program_id: Mapped[str] = mapped_column(
        ForeignKey("programs.id"), nullable=False, unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
