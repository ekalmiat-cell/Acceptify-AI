import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import CurrentUserId, DbSession
from app.models.essay_review import EssayReview
from app.schemas.essay import (
    EssayAnalyzeRequest,
    EssayReviewRead,
    EssayReviewSummaryRead,
)
from app.services.llm.context_builder import (
    build_student_context,
    build_university_context,
)
from app.services.llm.exceptions import LLMProviderError
from app.services.llm.factory import get_llm_provider

router = APIRouter()


@router.post(
    "/essays/analyze",
    response_model=EssayReviewRead,
    status_code=status.HTTP_201_CREATED,
)
async def analyze_essay(
    payload: EssayAnalyzeRequest,
    user_id: CurrentUserId,
    db: DbSession,
) -> EssayReview:
    """Analyzes an admissions essay using the configured AI model and persists the evaluation."""
    word_count = len(payload.essay_text.split())
    if word_count < 25:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The essay is too short for a meaningful review (minimum 25 words).",
        )

    # 1. Safely gather non-PII institutional and profile context
    uni_context = await build_university_context(
        db=db,
        university_id=payload.university_id,
        program_id=payload.program_id,
    )
    student_context = await build_student_context(
        db=db,
        user_id=user_id,
        include_context=payload.include_profile_context,
    )

    # 2. Invoke the configured LLM provider
    provider = get_llm_provider()
    try:
        analysis_result = await provider.analyze_essay(
            essay_text=payload.essay_text,
            prompt_text=payload.prompt_text,
            university_context=uni_context,
            student_context=student_context,
        )
    except LLMProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during essay analysis: {exc}",
        ) from exc

    # 3. Persist review into database
    snippet = payload.essay_text[:280] + ("..." if len(payload.essay_text) > 280 else "")
    review = EssayReview(
        user_id=user_id,
        university_id=payload.university_id,
        program_id=payload.program_id,
        title=payload.title.strip() if payload.title else "Untitled Essay",
        prompt_text=payload.prompt_text,
        word_count=word_count,
        essay_snippet=snippet,
        essay_text=payload.essay_text,
        analysis_result=analysis_result.model_dump(),
        overall_score=analysis_result.overall_score,
    )

    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/essays", response_model=list[EssayReviewSummaryRead])
async def list_essay_reviews(
    user_id: CurrentUserId,
    db: DbSession,
) -> list[EssayReview]:
    """Returns all essay reviews for the authenticated student, newest first."""
    result = await db.scalars(
        select(EssayReview)
        .where(EssayReview.user_id == user_id)
        .order_by(EssayReview.created_at.desc())
    )
    return list(result)


@router.get("/essays/{essay_id}", response_model=EssayReviewRead)
async def get_essay_review(
    essay_id: uuid.UUID,
    user_id: CurrentUserId,
    db: DbSession,
) -> EssayReview:
    """Retrieves a specific past essay review by ID."""
    review = await db.get(EssayReview, essay_id)
    if not review or review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay review not found.",
        )
    return review


@router.delete("/essays/{essay_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_essay_review(
    essay_id: uuid.UUID,
    user_id: CurrentUserId,
    db: DbSession,
) -> None:
    """Permanently deletes an essay review for privacy/data retention."""
    review = await db.get(EssayReview, essay_id)
    if not review or review.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Essay review not found.",
        )

    await db.delete(review)
    await db.commit()
