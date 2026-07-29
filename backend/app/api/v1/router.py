from fastapi import APIRouter

from app.api.v1.endpoints import health, predictions, profile, programs, universities

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(predictions.router, tags=["predictions"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(programs.router, tags=["programs"])
api_router.include_router(universities.router, tags=["universities"])
