import uuid
from datetime import datetime
from typing import Literal

from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

from app.schemas.base import BaseSchema

# What a student can report back about an application. Kept as a closed set
# rather than free text because these values are the labels of a calibration
# set — a column that also contains "probably rejected?" is not one you can
# compute an admit rate from.
PredictionOutcome = Literal["admitted", "rejected", "waitlisted", "withdrawn"]


class PredictionRead(BaseSchema):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=to_camel
    )

    id: uuid.UUID
    university_id: str
    match_score: int
    category: str
    status: str
    outcome: PredictionOutcome | None = None
    outcome_reported_at: datetime | None = None
    created_at: datetime


class PredictionCreate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    university_id: str
    match_score: int
    category: str
    status: str = "Saved"


class PredictionOutcomeUpdate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    outcome: PredictionOutcome


class ScoreBandSummary(BaseSchema):
    """One row of the calibration table: of the predictions we scored in this
    band, how many came back, and how many of those were admissions."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    min_score: int
    max_score: int
    reported: int
    admitted: int


class OutcomeSummaryRead(BaseSchema):
    """Platform-wide totals — counts only, never anything that identifies a
    student. This is what the methodology page shows to back up (or refuse to
    back up) the model's numbers.
    """

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    reported: int
    admitted: int
    rejected: int
    waitlisted: int
    withdrawn: int
    mean_score_admitted: float | None = None
    mean_score_rejected: float | None = None
    bands: list[ScoreBandSummary] = []
    # False until there are enough reported outcomes to fit anything. The API
    # says so explicitly so the frontend can't quietly present a structural
    # model as a measured one.
    is_calibrated: bool = False
