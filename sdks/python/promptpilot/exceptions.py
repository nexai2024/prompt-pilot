"""
Exception classes for Prompt Pilot SDK
"""


class PromptPilotError(Exception):
    """Base exception for all Prompt Pilot errors"""
    pass


class AuthenticationError(PromptPilotError):
    """Raised when authentication fails"""
    pass


class RateLimitError(PromptPilotError):
    """Raised when rate limit is exceeded"""
    pass


class ValidationError(PromptPilotError):
    """Raised when request validation fails"""
    pass
