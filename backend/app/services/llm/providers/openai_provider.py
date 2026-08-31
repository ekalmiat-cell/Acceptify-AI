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


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM provider implementation with JSON mode."""

    def __init__(
        self,
        api_key: str | None,
        model: str = "gpt-4o-mini",
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
            raise LLMInvalidKeyError("OpenAI")

        url = "https://api.openai.com/v1/chat/completions"

        user_content = format_user_prompt(
            essay_text=essay_text,
            prompt_text=prompt_text,
            university_context=university_context,
            student_context=student_context,
        )

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.api_key}",
                    },
                )
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(self.timeout_seconds) from exc
        except httpx.RequestError as exc:
            raise LLMProviderError(f"Network error communicating with OpenAI: {exc}") from exc

        if response.status_code == 429:
            raise LLMRateLimitError("OpenAI")
        elif response.status_code in (401, 403):
            raise LLMInvalidKeyError("OpenAI")
        elif response.status_code != 200:
            raise LLMProviderError(
                f"OpenAI API returned error status {response.status_code}: {response.text}"
            )

        try:
            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                raise LLMResponseParsingError("No choices returned in OpenAI response.")

            content_text = choices[0]["message"]["content"]
            parsed_json = json.loads(content_text)
            return EssayAnalysisResult.model_validate(parsed_json)
        except (KeyError, IndexError, json.JSONDecodeError, ValidationError) as exc:
            raise LLMResponseParsingError(f"Failed to validate structured OpenAI response: {exc}") from exc
