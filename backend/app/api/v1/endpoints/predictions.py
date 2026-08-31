import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUserId, DbSession
from app.models.prediction import Prediction
from app.schemas.prediction import (
    OutcomeSummaryRead,
    PredictionCreate,
    PredictionOutcomeUpdate,
    PredictionRead,
    ScoreBandSummary,
)

router = APIRouter()

# The bands the calibration table is reported in. Wide on purpose: a table
# with twenty rows and three outcomes in it looks like evidence without being
# any, and these are the same cut points the app already uses to call a
# university safe (>= 70) or a reach (< 40).
SCORE_BANDS: list[tuple[str, int, int]] = [
    ("Reach (0-39)", 0, 39),
    ("Lower target (40-54)", 40, 54),
    ("Upper target (55-69)", 55, 69),
    ("Safe (70-84)", 70, 84),
    ("Very safe (85-100)", 85, 100),
]

# Below this many reported outcomes, an admit rate per band is noise. The
# number is a judgement call, not a statistical test — but having *a*
# threshold, declared up front, is what stops three lucky reports from being
# presented as a calibrated model.
MIN_OUTCOMES_TO_CALIBRATE = 100


@router.get("/predictions", response_model=list[PredictionRead])
async def list_predictions(user_id: CurrentUserId, db: DbSession) -> list[Prediction]:
    """Returns the authenticated user's own prediction history, newest first."""
    result = await db.scalars(
        select(Prediction)
        .where(Prediction.user_id == user_id)
        .order_by(Prediction.created_at.desc())
    )
    return list(result)


@router.post("/predictions", response_model=PredictionRead, status_code=status.HTTP_201_CREATED)
async def create_prediction(
    payload: PredictionCreate, user_id: CurrentUserId, db: DbSession
) -> Prediction:
    """Persists a run of the admission analysis engine as a report the user
    can revisit from their prediction history."""
    prediction = Prediction(user_id=user_id, **payload.model_dump())
    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)
    return prediction


@router.get("/predictions/outcomes/summary", response_model=OutcomeSummaryRead)
async def outcome_summary(user_id: CurrentUserId, db: DbSession) -> OutcomeSummaryRead:
    """Platform-wide outcome totals, aggregated.

    Deliberately not scoped to the requesting user: the question this answers
    is "is the scoring model any good yet", and one student's four
    applications cannot answer it. Only counts and means leave this endpoint —
    no university, no user, nothing that could be traced back to a person.
    """
    rows = (
        await db.execute(
            select(Prediction.match_score, Prediction.outcome).where(
                Prediction.outcome.is_not(None)
            )
        )
    ).all()

    counts = {"admitted": 0, "rejected": 0, "waitlisted": 0, "withdrawn": 0}
    scores: dict[str, list[int]] = {"admitted": [], "rejected": []}

    for match_score, outcome in rows:
        if outcome in counts:
            counts[outcome] += 1
        if outcome in scores:
            scores[outcome].append(match_score)

    def mean(values: list[int]) -> float | None:
        return round(sum(values) / len(values), 1) if values else None

    bands = [
        ScoreBandSummary(
            label=label,
            min_score=low,
            max_score=high,
            reported=sum(1 for score, _ in rows if low <= score <= high),
            # Waitlists and withdrawals count as reported but not as
            # admissions: neither is a "yes", and folding either one in would
            # flatter the model on data that doesn't support it.
            admitted=sum(
                1 for score, outcome in rows if low <= score <= high and outcome == "admitted"
            ),
        )
        for label, low, high in SCORE_BANDS
    ]

    return OutcomeSummaryRead(
        reported=len(rows),
        admitted=counts["admitted"],
        rejected=counts["rejected"],
        waitlisted=counts["waitlisted"],
        withdrawn=counts["withdrawn"],
        mean_score_admitted=mean(scores["admitted"]),
        mean_score_rejected=mean(scores["rejected"]),
        bands=bands,
        is_calibrated=len(rows) >= MIN_OUTCOMES_TO_CALIBRATE,
    )


@router.patch("/predictions/{prediction_id}/outcome", response_model=PredictionRead)
async def report_outcome(
    prediction_id: uuid.UUID,
    payload: PredictionOutcomeUpdate,
    user_id: CurrentUserId,
    db: DbSession,
) -> Prediction:
    """Records what actually happened to an application.

    Scoped to the caller's own predictions — the `user_id` filter is the
    authorisation check, so a valid id belonging to somebody else reads as a
    404 rather than a 403 (which would confirm the row exists).
    """
    prediction = await db.scalar(
        select(Prediction).where(
            Prediction.id == prediction_id, Prediction.user_id == user_id
        )
    )
    if prediction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    prediction.outcome = payload.outcome
    prediction.outcome_reported_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(prediction)
    return prediction
