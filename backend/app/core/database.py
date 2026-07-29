from collections.abc import AsyncGenerator
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# libpq query parameters that asyncpg does not accept as connect() kwargs.
# `sslmode` is translated into asyncpg's own `ssl` argument; the rest are
# simply dropped.
_LIBPQ_ONLY_PARAMS = {"sslmode", "channel_binding"}

# sslmode values that mean "plaintext is acceptable" — anything else asks for
# an encrypted connection.
_PLAINTEXT_SSLMODES = {"disable", "allow", "prefer"}


def build_engine_args(raw_url: str) -> tuple[str, dict[str, Any]]:
    """Normalises a Postgres URL into something asyncpg can actually connect with.

    Managed providers (Neon, Supabase, Railway) hand out libpq-style URLs like
    `postgresql://user:pw@host/db?sslmode=require&channel_binding=require`.
    asyncpg understands neither the bare `postgresql://` scheme that SQLAlchemy
    maps to psycopg2, nor those query parameters — it raises
    `TypeError: connect() got an unexpected keyword argument 'sslmode'`.

    Rather than making whoever deploys this hand-edit the connection string
    (and get it wrong at 2am), translate it here.
    """
    split = urlsplit(raw_url)

    scheme = split.scheme
    if scheme in {"postgres", "postgresql"}:
        scheme = "postgresql+asyncpg"

    kept_params: list[tuple[str, str]] = []
    sslmode: str | None = None

    for key, value in parse_qsl(split.query, keep_blank_values=True):
        if key == "sslmode":
            sslmode = value
        elif key not in _LIBPQ_ONLY_PARAMS:
            kept_params.append((key, value))

    connect_args: dict[str, Any] = {}
    if sslmode is not None and sslmode not in _PLAINTEXT_SSLMODES:
        connect_args["ssl"] = True

    normalized = urlunsplit(
        (scheme, split.netloc, split.path, urlencode(kept_params), split.fragment)
    )
    return normalized, connect_args


_url, _connect_args = build_engine_args(settings.database_url)

engine = create_async_engine(_url, pool_pre_ping=True, connect_args=_connect_args)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding a request-scoped async session."""
    async with AsyncSessionLocal() as session:
        yield session
