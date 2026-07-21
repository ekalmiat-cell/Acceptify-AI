from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import or_, select

from app.api.deps import DbSession
from app.models.university import University
from app.schemas.university import UniversityRead

router = APIRouter()


@router.get("/universities", response_model=list[UniversityRead])
async def list_universities(
    db: DbSession,
    search: str | None = Query(default=None, description="Matches name, country, or city"),
    country: str | None = Query(default=None),
    selectivity: str | None = Query(default=None),
) -> list[University]:
    """The full university catalog — this is the single source of truth
    behind search, dream-university selection, and the match prediction
    engine. Public: it's reference data, not user data, so no auth required.
    """
    stmt = select(University)

    if search:
        like = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                University.name.ilike(like),
                University.country.ilike(like),
                University.city.ilike(like),
            )
        )

    if country:
        stmt = stmt.where(University.country == country)

    if selectivity:
        stmt = stmt.where(University.selectivity_level == selectivity)

    stmt = stmt.order_by(University.world_ranking.asc())

    result = await db.scalars(stmt)
    return list(result)


@router.get("/universities/{university_id}", response_model=UniversityRead)
async def get_university(university_id: str, db: DbSession) -> University:
    university = await db.get(University, university_id)
    if university is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    return university
