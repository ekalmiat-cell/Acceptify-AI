import re
import uuid

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import delete, select

from app.api.deps import CurrentUserId, DbSession
from app.core.criteria import DEFAULT_WEIGHTS
from app.models.evaluation_profile import EvaluationProfile
from app.models.evaluation_weight import EvaluationWeight
from app.models.program import Program
from app.models.university import University
from app.schemas.program import (
    EvaluationProfileRead,
    EvaluationProfileUpdate,
    ProgramCreate,
    ProgramRead,
    ProgramUpdate,
)

router = APIRouter()


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug)


async def _get_program_or_404(program_id: str, db: DbSession) -> Program:
    program = await db.get(Program, program_id)
    if program is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    return program


async def _seed_default_weights(evaluation_profile_id: uuid.UUID, db: DbSession) -> None:
    for criterion_key, weight in DEFAULT_WEIGHTS.items():
        db.add(
            EvaluationWeight(
                evaluation_profile_id=evaluation_profile_id,
                criterion_key=criterion_key,
                weight=weight,
            )
        )


@router.get("/programs", response_model=list[ProgramRead])
async def list_programs(
    db: DbSession,
    university_id: str | None = Query(default=None, alias="universityId"),
) -> list[Program]:
    """Public, like /universities — this is reference data the field-of-study
    picker and the admin panel both read from.
    """
    stmt = select(Program)
    if university_id:
        stmt = stmt.where(Program.university_id == university_id)
    stmt = stmt.order_by(Program.name.asc())
    result = await db.scalars(stmt)
    return list(result)


@router.get("/programs/{program_id}", response_model=ProgramRead)
async def get_program(program_id: str, db: DbSession) -> Program:
    return await _get_program_or_404(program_id, db)


@router.post("/programs", response_model=ProgramRead, status_code=status.HTTP_201_CREATED)
async def create_program(payload: ProgramCreate, _user_id: CurrentUserId, db: DbSession) -> Program:
    """Admin-facing: this app has no role system yet, so any signed-in user
    can manage the program catalog — same trust model as every other
    authenticated write endpoint here.
    """
    university = await db.get(University, payload.university_id)
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    slug = _slugify(payload.name)
    program = Program(
        id=f"prog-{_slugify(payload.university_id)}-{slug}-{uuid.uuid4().hex[:6]}",
        university_id=payload.university_id,
        slug=slug,
        name=payload.name,
        field=payload.field,
        parent_program_id=payload.parent_program_id,
        level="specialization" if payload.parent_program_id else "program",
        description=payload.description,
    )
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program


@router.put("/programs/{program_id}", response_model=ProgramRead)
async def update_program(
    program_id: str, payload: ProgramUpdate, _user_id: CurrentUserId, db: DbSession
) -> Program:
    program = await _get_program_or_404(program_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(program, field, value)

    await db.commit()
    await db.refresh(program)
    return program


@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_program(program_id: str, _user_id: CurrentUserId, db: DbSession) -> None:
    program = await _get_program_or_404(program_id, db)
    result = await db.scalars(
        select(EvaluationProfile).where(EvaluationProfile.program_id == program.id)
    )
    for profile in result:
        await db.execute(
            delete(EvaluationWeight).where(EvaluationWeight.evaluation_profile_id == profile.id)
        )
        await db.delete(profile)
    await db.delete(program)
    await db.commit()


@router.post("/programs/resolve", response_model=ProgramRead)
async def resolve_program(
    _user_id: CurrentUserId,
    db: DbSession,
    university_id: str = Query(alias="universityId"),
    field: str = Query(),
) -> Program:
    """Finds the Program for (university, field of study), creating it (with
    a default-weighted EvaluationProfile) on first use. This is what backs
    the "Choose Your Intended Field of Study" step — every university/field
    pair gets a real, DB-stored, individually-editable Program the first
    time a student picks it, so the admin catalog grows from actual usage
    instead of needing to be pre-seeded for all 28 fields x every school.
    """
    university = await db.get(University, university_id)
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")

    existing = await db.scalars(
        select(Program).where(Program.university_id == university_id, Program.field == field)
    )
    program = existing.first()
    if program is not None:
        return program

    slug = _slugify(field)
    program = Program(
        id=f"prog-{_slugify(university_id)}-{slug}",
        university_id=university_id,
        slug=slug,
        name=field,
        field=field,
        level="program",
    )
    db.add(program)
    await db.flush()

    evaluation_profile = EvaluationProfile(program_id=program.id, name=f"{field} — default profile")
    db.add(evaluation_profile)
    await db.flush()

    await _seed_default_weights(evaluation_profile.id, db)

    await db.commit()
    await db.refresh(program)
    return program


@router.get("/programs/{program_id}/evaluation-profile", response_model=EvaluationProfileRead)
async def get_evaluation_profile(program_id: str, db: DbSession) -> EvaluationProfile:
    """Public: the scoring engine (frontend `lib/predict.ts`) reads this to
    know how to weigh a student's profile against this specific program.
    """
    await _get_program_or_404(program_id, db)

    result = await db.scalars(
        select(EvaluationProfile).where(EvaluationProfile.program_id == program_id)
    )
    profile = result.first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No evaluation profile for this program yet",
        )

    weights = await db.scalars(
        select(EvaluationWeight).where(EvaluationWeight.evaluation_profile_id == profile.id)
    )
    profile.weights = list(weights)  # type: ignore[attr-defined]
    return profile


@router.put("/programs/{program_id}/evaluation-profile", response_model=EvaluationProfileRead)
async def upsert_evaluation_profile(
    program_id: str, payload: EvaluationProfileUpdate, _user_id: CurrentUserId, db: DbSession
) -> EvaluationProfile:
    """Full replace of the profile's weights — the admin weight editor always
    sends the complete set of criterion weights on save.
    """
    program = await _get_program_or_404(program_id, db)

    result = await db.scalars(
        select(EvaluationProfile).where(EvaluationProfile.program_id == program_id)
    )
    profile = result.first()
    if profile is None:
        default_name = payload.name or f"{program.name} — profile"
        profile = EvaluationProfile(program_id=program.id, name=default_name)
        db.add(profile)
        await db.flush()

    if payload.name is not None:
        profile.name = payload.name
    if payload.description is not None:
        profile.description = payload.description
    if payload.is_active is not None:
        profile.is_active = payload.is_active

    if payload.weights is not None:
        await db.execute(
            delete(EvaluationWeight).where(EvaluationWeight.evaluation_profile_id == profile.id)
        )
        for item in payload.weights:
            db.add(
                EvaluationWeight(
                    evaluation_profile_id=profile.id,
                    criterion_key=item.criterion_key,
                    weight=item.weight,
                )
            )

    await db.commit()
    await db.refresh(profile)

    weights = await db.scalars(
        select(EvaluationWeight).where(EvaluationWeight.evaluation_profile_id == profile.id)
    )
    profile.weights = list(weights)  # type: ignore[attr-defined]
    return profile
