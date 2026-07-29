from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Program(Base, TimestampMixin):
    """A field of study offered at a university (e.g. "MIT Computer
    Science"). Sits between University and EvaluationProfile:

        University -> Program -> EvaluationProfile -> EvaluationWeight

    `parent_program_id` is a self-reference that's unused today but lets a
    Program become a Specialization of another Program (e.g. "Artificial
    Intelligence" under "Computer Science") without a schema change — see
    `level`, which distinguishes the two without needing a new table.
    """

    __tablename__ = "programs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    university_id: Mapped[str] = mapped_column(
        ForeignKey("universities.id"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    # One of the canonical field-of-study values the "Choose Your Intended
    # Field of Study" step offers (frontend/src/lib/fields-of-study.ts).
    field: Mapped[str] = mapped_column(String, nullable=False, index=True)
    parent_program_id: Mapped[str | None] = mapped_column(
        ForeignKey("programs.id"), nullable=True
    )
    level: Mapped[str] = mapped_column(String, nullable=False, default="program")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
