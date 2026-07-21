from fastapi import APIRouter, status
from sqlalchemy import select

from app.api.deps import CurrentUserId, DbSession
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionCreate, PredictionRead

router = APIRouter()


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
