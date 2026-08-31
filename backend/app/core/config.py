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

    # Comma-separated addresses allowed to manage the program catalog and its
    # evaluation weights. This app has no role table — admin is an allow-list
    # of email addresses, matched against the `email` claim on the Better Auth
    # JWT. Empty (the default) means nobody is an admin, so the catalog is
    # read-only until someone is deliberately named here.
    admin_emails: Annotated[list[str], NoDecode] = []

    # LLM Provider Configuration
    llm_provider: str = "gemini"  # "gemini", "openai", "claude", or "mock"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.7-flash"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    llm_timeout_seconds: int = 35

    @field_validator("cors_origins", "admin_emails", mode="before")
    @classmethod
    def split_comma_separated(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
