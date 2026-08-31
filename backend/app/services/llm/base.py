from abc import ABC, abstractmethod
from typing import Any

from app.schemas.essay import EssayAnalysisResult


class BaseLLMProvider(ABC):
    """Abstract interface for LLM provider implementations."""

    @abstractmethod
    async def analyze_essay(
        self,
        essay_text: str,
        prompt_text: str | None = None,
        university_context: dict[str, Any] | None = None,
        student_context: dict[str, Any] | None = None,
    ) -> EssayAnalysisResult:
        """Analyzes the submitted essay and returns a validated structured result."""
        pass
