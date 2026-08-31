from app.core.config import Settings, get_settings
from app.services.llm.base import BaseLLMProvider
from app.services.llm.providers.gemini_provider import GeminiProvider
from app.services.llm.providers.mock_provider import MockLLMProvider
from app.services.llm.providers.openai_provider import OpenAIProvider


def get_llm_provider(settings: Settings | None = None) -> BaseLLMProvider:
    """Factory that resolves the configured LLM provider instance."""
    if settings is None:
        settings = get_settings()

    provider_type = settings.llm_provider.lower().strip()

    if provider_type == "gemini":
        if not settings.gemini_api_key and not settings.is_production:
            # Safe offline fallback for local dev when no key is set yet
            return MockLLMProvider()
        return GeminiProvider(
            api_key=settings.gemini_api_key,
            model=settings.gemini_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )
    elif provider_type == "openai":
        if not settings.openai_api_key and not settings.is_production:
            return MockLLMProvider()
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )
    elif provider_type == "mock":
        return MockLLMProvider()

    # Default fallback
    return MockLLMProvider()
