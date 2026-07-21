from pydantic import ConfigDict
from pydantic.alias_generators import to_camel

from app.schemas.base import BaseSchema


class UniversityRequirement(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    label: str
    value: str


class AcceptRatePoint(BaseSchema):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    year: str
    rate: float


class UniversityRead(BaseSchema):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)

    id: str
    slug: str
    name: str
    short_name: str
    country: str
    city: str
    logo_initials: str

    world_ranking: int
    national_ranking: int | None = None
    acceptance_rate: float
    selectivity_level: str

    min_gpa: float
    sat_low: int
    sat_high: int
    act_min: int | None = None
    act_max: int | None = None
    ielts_min: float
    toefl_min: int

    tuition_per_year_usd: int
    living_cost_per_year_usd: int
    scholarship_available: bool
    scholarship_coverage: str
    application_deadline: str
    decision_type: str

    tags: list[str]
    description: str
    requirements: list[UniversityRequirement]
    accept_rate_trend: list[AcceptRatePoint]

    gradient_from: str
    gradient_to: str
    website: str
