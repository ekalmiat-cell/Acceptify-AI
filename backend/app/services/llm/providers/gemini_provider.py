import json
from typing import Any

import httpx
from pydantic import ValidationError

from app.schemas.essay import EssayAnalysisResult
from app.services.llm.base import BaseLLMProvider
from app.services.llm.exceptions import (
    LLMInvalidKeyError,
    LLMProviderError,
    LLMRateLimitError,
    LLMResponseParsingError,
    LLMTimeoutError,
)
from app.services.llm.prompts import SYSTEM_PROMPT, format_user_prompt


class GeminiProvider(BaseLLMProvider):
    """Google Gemini LLM provider implementation using the REST API with structured outputs."""

    def __init__(
        self,
        api_key: str | None,
        model: str = "gemini-3.7-flash",
        timeout_seconds: int = 35,
    ):
        self.api_key = api_key
        self.model = model
        self.timeout_seconds = timeout_seconds

    async def analyze_essay(
        self,
        essay_text: str,
        prompt_text: str | None = None,
        university_context: dict[str, Any] | None = None,
        student_context: dict[str, Any] | None = None,
    ) -> EssayAnalysisResult:
        if not self.api_key:
            raise LLMInvalidKeyError("Google Gemini")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        user_content = format_user_prompt(
            essay_text=essay_text,
            prompt_text=prompt_text,
            university_context=university_context,
            student_context=student_context,
        )

        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_content}],
                }
            ],
            "generationConfig": {
                "temperature": 0.3,
                "response_mime_type": "application/json",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(self.timeout_seconds) from exc
        except httpx.RequestError as exc:
            raise LLMProviderError(f"Network error communicating with Google Gemini: {exc}") from exc

        if response.status_code == 429:
            raise LLMRateLimitError("Google Gemini")
        elif response.status_code in (401, 403):
            raise LLMInvalidKeyError("Google Gemini")
        elif response.status_code != 200:
            raise LLMProviderError(
                f"Gemini API returned error status {response.status_code}: {response.text}"
            )

        try:
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise LLMResponseParsingError("No candidates returned in Gemini response.")

            text_content = candidates[0]["content"]["parts"][0]["text"]
            parsed_json = json.loads(text_content)
            return EssayAnalysisResult.model_validate(parsed_json)
        except (KeyError, IndexError, json.JSONDecodeError, ValidationError) as exc:
            raise LLMResponseParsingError(f"Failed to validate structured Gemini response: {exc}") from exc
