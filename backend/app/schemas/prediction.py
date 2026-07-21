import uuid
from datetime import datetime

from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

from app.schemas.base import BaseSchema


class PredictionRead(BaseSchema):
    model_config = ConfigDict(
        from_attributes=True, populate_by_name=True, alias_generator=to_camel
    )

    id: uuid.UUID
    university_id: str
    match_score: int
    category: str
    status: str
    created_at: datetime


class PredictionCreate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    university_id: str
    match_score: int
    category: str
    status: str = "Saved"
