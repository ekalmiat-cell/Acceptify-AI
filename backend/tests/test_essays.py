import uuid
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id, get_db
from app.main import app
from app.models.essay_review import EssayReview
from app.schemas.essay import (
    CategoryScores,
    EssayAnalysisResult,
    EssayAnalyzeRequest,
    PromptAlignment,
    UniversityAlignment,
)
from app.services.llm.exceptions import (
    LLMInvalidKeyError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseParsingError,
    LLMTimeoutError,
)
from app.services.llm.factory import get_llm_provider
from app.services.llm.providers.mock_provider import MockLLMProvider


@pytest.mark.asyncio
async def test_mock_llm_provider_returns_valid_analysis() -> None:
    provider = MockLLMProvider()
    essay = (
        "Ever since I was ten, I took apart broken radios to understand how electromagnetic signals "
        "travel across distances. In high school, I channeled this curiosity into building a low-cost "
        "mesh network for rural sensor data. Working through unexpected packet collisions taught me "
        "resilience and system architecture. At MIT, I hope to continue exploring distributed networks "
        "and collaborate with faculty on scalable computing."
    )
    result = await provider.analyze_essay(
        essay_text=essay,
        prompt_text="Describe something you created and its impact on you.",
        university_context={"name": "Massachusetts Institute of Technology"},
        student_context={"field": "Computer Science"},
    )

    assert isinstance(result, EssayAnalysisResult)
    assert 0 <= result.overall_score <= 100
    assert result.headline_verdict
    assert isinstance(result.category_scores, CategoryScores)
    assert len(result.strengths) > 0
    assert len(result.weaknesses) > 0
    assert isinstance(result.prompt_alignment, PromptAlignment)
    assert isinstance(result.university_alignment, UniversityAlignment)
    assert len(result.actionable_recommendations) > 0
    assert len(result.suggested_next_steps) > 0


def test_essay_analyze_request_validation() -> None:
    # Valid payload
    payload = EssayAnalyzeRequest(
        title="My Draft",
        essay_text="A" * 200,
        university_id="uni-mit",
        prompt_text="Why this college?",
    )
    assert payload.title == "My Draft"
    assert len(payload.essay_text) == 200


def test_llm_exceptions() -> None:
    assert LLMInvalidKeyError("Gemini").status_code == 500
    assert LLMRateLimitError("Gemini").status_code == 429
    assert LLMTimeoutError(35).status_code == 504
    assert LLMResponseParsingError("bad json").status_code == 502
    assert LLMProviderError("unknown error").status_code == 502


def test_llm_factory_resolves_mock() -> None:
    provider = get_llm_provider()
    # In test environment with no API key, returns MockLLMProvider
    assert isinstance(provider, MockLLMProvider)


def test_analyze_essay_too_short_422(client: TestClient) -> None:
    app.dependency_overrides[get_current_user_id] = lambda: "test-user-123"
    try:
        response = client.post(
            "/api/v1/essays/analyze",
            json={
                "title": "Short Essay",
                "essay_text": "This is way too short.",
            },
        )
        # Should fail either at schema min_length (150 chars) or endpoint word count (25 words)
        assert response.status_code in (422, 400)
    finally:
        app.dependency_overrides.pop(get_current_user_id, None)
