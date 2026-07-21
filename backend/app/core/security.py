from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import get_settings

settings = get_settings()

bearer_scheme = HTTPBearer(auto_error=False)

# Better Auth's jwt plugin defaults to EdDSA (Ed25519); RS256/ES256/PS256 are
# accepted too in case that default is ever overridden on the frontend.
ACCEPTED_ALGORITHMS = ["EdDSA", "ES256", "RS256", "PS256"]


@lru_cache
def get_jwk_client() -> PyJWKClient:
    jwks_url = f"{settings.auth_issuer.rstrip('/')}/api/auth/jwks"
    return PyJWKClient(jwks_url, cache_keys=True)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> str:
    """Verifies the bearer JWT against Better Auth's JWKS and returns the
    session's user id (the token's `sub` claim).

    The frontend mints this token via `GET /api/auth/token` from an active
    Better Auth session — see frontend/src/lib/auth.ts and api-client.ts.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        signing_key = get_jwk_client().get_signing_key_from_jwt(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=ACCEPTED_ALGORITHMS,
            audience=settings.auth_audience,
            issuer=settings.auth_issuer,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    return user_id
