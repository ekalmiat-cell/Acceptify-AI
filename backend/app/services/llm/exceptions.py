class LLMProviderError(Exception):
    """Base exception for all LLM provider failures."""

    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class LLMInvalidKeyError(LLMProviderError):
    """Raised when an API key is missing, invalid, or unauthorized."""

    def __init__(self, provider: str):
        super().__init__(
            f"Invalid or missing API key for {provider}. Please check your server environment configuration.",
            status_code=500,
        )


class LLMRateLimitError(LLMProviderError):
    """Raised when the LLM provider rate limit is exceeded."""

    def __init__(self, provider: str):
        super().__init__(
            f"Rate limit exceeded for {provider}. Please wait a moment and try again.",
            status_code=429,
        )


class LLMTimeoutError(LLMProviderError):
    """Raised when the LLM provider request times out."""

    def __init__(self, timeout_seconds: int):
        super().__init__(
            f"AI evaluation timed out after {timeout_seconds} seconds. Please try again.",
            status_code=504,
        )


class LLMResponseParsingError(LLMProviderError):
    """Raised when the model response cannot be parsed into the expected structured schema."""

    def __init__(self, details: str):
        super().__init__(
            f"Failed to parse structured feedback from the AI provider: {details}",
            status_code=502,
        )
