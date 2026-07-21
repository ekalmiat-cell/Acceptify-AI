from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class University(Base, TimestampMixin):
    """The platform's university catalog — the single source of truth the
    match prediction engine, search/filter UI, and dream-university
    selection all read from. `id` uses the same stable string scheme the
    frontend has always used (e.g. "uni-mit"), since `predictions` and
    `student_profiles.dream_university_id` already reference it.
    """

    __tablename__ = "universities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    short_name: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False, index=True)
    city: Mapped[str] = mapped_column(String, nullable=False)
    logo_initials: Mapped[str] = mapped_column(String, nullable=False)

    world_ranking: Mapped[int] = mapped_column(Integer, nullable=False)
    national_ranking: Mapped[int | None] = mapped_column(Integer, nullable=True)
    acceptance_rate: Mapped[float] = mapped_column(Float, nullable=False)
    selectivity_level: Mapped[str] = mapped_column(String, nullable=False)

    min_gpa: Mapped[float] = mapped_column(Float, nullable=False)
    sat_low: Mapped[int] = mapped_column(Integer, nullable=False)
    sat_high: Mapped[int] = mapped_column(Integer, nullable=False)
    act_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    act_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ielts_min: Mapped[float] = mapped_column(Float, nullable=False)
    toefl_min: Mapped[int] = mapped_column(Integer, nullable=False)

    tuition_per_year_usd: Mapped[int] = mapped_column(Integer, nullable=False)
    living_cost_per_year_usd: Mapped[int] = mapped_column(Integer, nullable=False)
    scholarship_available: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    scholarship_coverage: Mapped[str] = mapped_column(String, nullable=False)
    application_deadline: Mapped[str] = mapped_column(String, nullable=False)
    decision_type: Mapped[str] = mapped_column(String, nullable=False)

    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    requirements: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    accept_rate_trend: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    gradient_from: Mapped[str] = mapped_column(String, nullable=False)
    gradient_to: Mapped[str] = mapped_column(String, nullable=False)
    website: Mapped[str] = mapped_column(String, nullable=False)
