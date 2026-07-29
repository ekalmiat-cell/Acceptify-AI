from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class StudentProfile(Base, TimestampMixin):
    """A user's real academic profile — the direct inputs to the match
    prediction engine (frontend `lib/predict.ts`). One row per Better Auth
    user, keyed by their (string) user id.
    """

    __tablename__ = "student_profiles"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    gpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    sat_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    act_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ielts_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    toefl_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ent_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dream_university_id: Mapped[str | None] = mapped_column(String, nullable=True)
    dream_program_id: Mapped[str | None] = mapped_column(String, nullable=True)
