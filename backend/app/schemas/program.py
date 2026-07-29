import uuid

from pydantic import ConfigDict, field_validator
from pydantic.alias_generators import to_camel

from app.core.criteria import ALL_CRITERIA
from app.schemas.base import BaseSchema


class ProgramRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id: str
    university_id: str
    slug: str
    name: str
    field: str
    parent_program_id: str | None = None
    level: str
    description: str | None = None


class ProgramCreate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    university_id: str
    name: str
    field: str
    parent_program_id: str | None = None
    description: str | None = None


class ProgramUpdate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    name: str | None = None
    field: str | None = None
    parent_program_id: str | None = None
    description: str | None = None


class EvaluationWeightRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    criterion_key: str
    weight: float


class EvaluationWeightInput(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    criterion_key: str
    weight: float

    @field_validator("criterion_key")
    @classmethod
    def must_be_known_criterion(cls, value: str) -> str:
        if value not in ALL_CRITERIA:
            raise ValueError(f"Unknown criterion key: {value}")
        return value


class EvaluationProfileRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id: uuid.UUID
    program_id: str
    name: str
    description: str | None = None
    is_active: bool
    weights: list[EvaluationWeightRead] = []


class EvaluationProfileUpdate(BaseSchema):
    """Full replace: the weights list sent here becomes the entire set of
    weights for the profile. Simpler for an admin form (send everything on
    save) than a patch-style partial update.
    """

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    weights: list[EvaluationWeightInput] | None = None
