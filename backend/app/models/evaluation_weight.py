import uuid

from sqlalchemy import Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class EvaluationWeight(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """A single criterion's weight within an EvaluationProfile (e.g. "gpa" ->
    10). `criterion_key` matches one of `app.core.criteria.ALL_CRITERIA` —
    not a DB-level enum, since the criterion catalog is expected to grow and
    a plain string keeps that a code change instead of a migration.

    The scoring engine (frontend `lib/predict.ts`) treats a missing row for
    a given criterion as weight 0 (that criterion doesn't affect the score
    for this program), not an error — so admins only need to set the
    criteria that actually matter for a given program.
    """

    __tablename__ = "evaluation_weights"
    __table_args__ = (
        UniqueConstraint(
            "evaluation_profile_id", "criterion_key", name="uq_eval_weight_profile_criterion"
        ),
    )

    evaluation_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("evaluation_profiles.id"), nullable=False, index=True
    )
    criterion_key: Mapped[str] = mapped_column(String, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=0)
