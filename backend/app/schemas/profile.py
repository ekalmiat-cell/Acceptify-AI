from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

from app.schemas.base import BaseSchema


class AcademicProfileRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    gpa: float | None = None
    sat_score: int | None = None
    act_score: int | None = None
    ielts_score: float | None = None
    toefl_score: int | None = None
    ent_score: int | None = None
    dream_university_id: str | None = None


class AcademicProfileUpdate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    gpa: float | None = None
    sat_score: int | None = None
    act_score: int | None = None
    ielts_score: float | None = None
    toefl_score: int | None = None
    ent_score: int | None = None
    dream_university_id: str | None = None


class AchievementRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    key: str
    achieved: bool
    value: str | None = None
    level: str | None = None


class AchievementUpdate(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    achieved: bool
    value: str | None = None
    level: str | None = None
