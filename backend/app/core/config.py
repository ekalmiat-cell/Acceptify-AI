from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, sourced from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # SQLAlchemy async URL, e.g. postgresql+asyncpg://user:pass@host:5432/db
    database_url: str

    # Better Auth (frontend) base URL. Also doubles as the JWT issuer, and
    # {auth_issuer}/api/auth/jwks is where signing keys are fetched from.
    auth_issuer: str

    # Must match the `audience` configured on the frontend's jwt() plugin.
    auth_audience: str

    # Comma-separated in .env, e.g. "http://localhost:3000,https://acceptify.ai"
    cors_origins: Annotated[list[str], NoDecode] = []

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
