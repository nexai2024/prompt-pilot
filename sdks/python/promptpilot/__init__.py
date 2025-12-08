"""
Prompt Pilot Python SDK
A Python client library for interacting with the Prompt Pilot API.

Usage:
    from promptpilot import PromptPilot

    client = PromptPilot(api_key="pp_live_your_api_key")
    result = client.prompts.execute(
        prompt_id="uuid-here",
        variables={"topic": "AI"}
    )
    print(result.content)
"""

__version__ = "0.1.0"

from .client import PromptPilot
from .exceptions import PromptPilotError, AuthenticationError, RateLimitError

__all__ = [
    "PromptPilot",
    "PromptPilotError",
    "AuthenticationError",
    "RateLimitError",
]
