from typing import Literal
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=15000)


class CopilotChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    include_context: bool = Field(
        default=True, description="Whether to include student profile and admissions context"
    )


class CopilotChatResponse(BaseModel):
    reply: str
    suggested_followups: list[str] = Field(default_factory=list)
