from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUserId, DbSession
from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse
from app.services.llm.copilot_service import get_student_full_context, run_copilot_chat
from app.services.llm.exceptions import LLMProviderError

router = APIRouter()


@router.post("/copilot/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    payload: CopilotChatRequest,
    user_id: CurrentUserId,
    db: DbSession,
) -> CopilotChatResponse:
    """Answers admissions questions in real-time using Gemini 3.7 Flash with student context."""
    student_context = None
    if payload.include_context:
        student_context = await get_student_full_context(db=db, user_id=user_id)

    try:
        return await run_copilot_chat(
            messages=payload.messages,
            student_context=student_context,
        )
    except LLMProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred in Copilot: {exc}",
        ) from exc
