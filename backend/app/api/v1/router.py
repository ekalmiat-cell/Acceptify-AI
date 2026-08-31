from fastapi import APIRouter

from app.api.v1.endpoints import (
    copilot,
    essays,
    health,
    predictions,
    profile,
    programs,
    universities,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(copilot.router, tags=["copilot"])
api_router.include_router(essays.router, tags=["essays"])
api_router.include_router(predictions.router, tags=["predictions"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(programs.router, tags=["programs"])
api_router.include_router(universities.router, tags=["universities"])
