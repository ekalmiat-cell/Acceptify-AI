from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement
from app.models.program import Program
from app.models.student_profile import StudentProfile
from app.models.university import University


async def build_university_context(
    db: AsyncSession,
    university_id: str | None,
    program_id: str | None,
) -> dict[str, Any] | None:
    """Loads public institutional and program context to evaluate alignment."""
    if not university_id:
        return None

    uni = await db.get(University, university_id)
    if not uni:
        return None

    context: dict[str, Any] = {
        "id": uni.id,
        "name": uni.name,
        "short_name": uni.short_name,
        "country": uni.country,
        "selectivity_level": uni.selectivity_level,
        "description": uni.description,
        "tags": uni.tags,
    }

    if program_id:
        prog = await db.get(Program, program_id)
        if prog:
            context["program_name"] = prog.name
            context["field"] = prog.field

    return context


async def build_student_context(
    db: AsyncSession,
    user_id: str,
    include_context: bool = True,
) -> dict[str, Any] | None:
    """Builds an anonymized, safe summary of the student's profile and achievements.

    Never exposes PII (name, email, exact contact, user id) to the LLM.
    """
    if not include_context:
        return None

    profile = await db.get(StudentProfile, user_id)
    achievements_res = await db.scalars(
        select(Achievement).where(Achievement.user_id == user_id, Achievement.achieved.is_(True))
    )
    achievements = list(achievements_res)

    context: dict[str, Any] = {}

    if profile and profile.dream_program_id:
        prog = await db.get(Program, profile.dream_program_id)
        if prog:
            context["field"] = prog.field

    if achievements:
        active_keys = [a.key for a in achievements if a.key]
        context["achievements_summary"] = ", ".join(active_keys[:10])

    return context if context else None
