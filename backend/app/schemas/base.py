from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Base for schemas that read from ORM model instances."""

    model_config = ConfigDict(from_attributes=True)
