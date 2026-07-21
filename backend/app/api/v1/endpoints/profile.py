from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUserId, DbSession
from app.models.achievement import Achievement
from app.models.student_profile import StudentProfile
from app.schemas.profile import (
    AcademicProfileRead,
    AcademicProfileUpdate,
    AchievementRead,
    AchievementUpdate,
)

router = APIRouter()


@router.get("/profile/academics", response_model=AcademicProfileRead)
async def get_academic_profile(user_id: CurrentUserId, db: DbSession) -> AcademicProfileRead:
    profile = await db.get(StudentProfile, user_id)
    if profile is None:
        return AcademicProfileRead()
    return AcademicProfileRead.model_validate(profile)


@router.put("/profile/academics", response_model=AcademicProfileRead)
async def update_academic_profile(
    payload: AcademicProfileUpdate, user_id: CurrentUserId, db: DbSession
) -> StudentProfile:
    profile = await db.get(StudentProfile, user_id)
    if profile is None:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/profile/achievements", response_model=list[AchievementRead])
async def list_achievements(user_id: CurrentUserId, db: DbSession) -> list[Achievement]:
    """Returns only the achievements the user has actually recorded — the
    frontend merges this against its static catalog to fill in the rest as
    not-yet-achieved.
    """
    result = await db.scalars(select(Achievement).where(Achievement.user_id == user_id))
    return list(result)


@router.put("/profile/achievements/{key}", response_model=AchievementRead)
async def upsert_achievement(
    key: str, payload: AchievementUpdate, user_id: CurrentUserId, db: DbSession
) -> Achievement:
    result = await db.scalars(
        select(Achievement).where(Achievement.user_id == user_id, Achievement.key == key)
    )
    achievement = result.first()
    if achievement is None:
        achievement = Achievement(user_id=user_id, key=key)
        db.add(achievement)

    achievement.achieved = payload.achieved
    achievement.value = payload.value
    achievement.level = payload.level

    await db.commit()
    await db.refresh(achievement)
    return achievement
