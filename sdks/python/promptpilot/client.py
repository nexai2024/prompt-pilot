"""
Main client class for Prompt Pilot SDK
"""

import requests
from typing import Dict, Any, Optional
from .exceptions import PromptPilotError, AuthenticationError, RateLimitError


class PromptsResource:
    """Resource for managing prompts"""

    def __init__(self, client: 'PromptPilot'):
        self.client = client

    def execute(
        self,
        prompt_id: str,
        variables: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> 'PromptResponse':
        """
        Execute a prompt with the given variables

        Args:
            prompt_id: UUID of the prompt to execute
            variables: Dictionary of variables to substitute in the prompt
            model: Override the model (optional)
            temperature: Override temperature (optional)
            max_tokens: Override max tokens (optional)

        Returns:
            PromptResponse object with the result
        """
        payload = {
            "prompt_id": prompt_id,
            "variables": variables or {},
        }

        if model:
            payload["model"] = model
        if temperature is not None:
            payload["temperature"] = temperature
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens

        response = self.client._request("POST", "/api/prompts/execute", json=payload)
        return PromptResponse(response)

    def list(self, organization_id: str) -> list:
        """List all prompts for an organization"""
        response = self.client._request(
            "GET",
            f"/api/prompts?organizationId={organization_id}"
        )
        return response.get("prompts", [])

    def get(self, prompt_id: str) -> Dict[str, Any]:
        """Get a specific prompt"""
        response = self.client._request("GET", f"/api/prompts/{prompt_id}")
        return response.get("prompt", {})

    def create(
        self,
        organization_id: str,
        name: str,
        content: str,
        description: Optional[str] = None,
        model: str = "gpt-4",
        **kwargs
    ) -> Dict[str, Any]:
        """Create a new prompt"""
        payload = {
            "organization_id": organization_id,
            "name": name,
            "content": content,
            "description": description,
            "model": model,
            **kwargs
        }
        response = self.client._request("POST", "/api/prompts", json=payload)
        return response.get("prompt", {})


class PromptResponse:
    """Response from a prompt execution"""

    def __init__(self, data: Dict[str, Any]):
        self.content = data.get("content", "")
        self.tokens_used = data.get("tokens_used", 0)
        self.cost_cents = data.get("cost_cents", 0)
        self.latency_ms = data.get("latency_ms", 0)
        self.model = data.get("model", "")
        self.provider = data.get("provider", "")
        self.raw = data

    @property
    def cost_dollars(self) -> float:
        """Cost in dollars"""
        return self.cost_cents / 100

    def __str__(self) -> str:
        return self.content


class PromptPilot:
    """
    Main client for Prompt Pilot API

    Usage:
        client = PromptPilot(api_key="pp_live_xxx")
        result = client.prompts.execute(prompt_id="uuid", variables={"key": "value"})
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://your-domain.com",
        timeout: int = 30
    ):
        """
        Initialize the Prompt Pilot client

        Args:
            api_key: Your Prompt Pilot API key
            base_url: Base URL for the API (default: production)
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": f"promptpilot-python/{__version__}"
        })

        # Resources
        self.prompts = PromptsResource(self)

    def _request(
        self,
        method: str,
        path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Make an HTTP request to the API"""
        url = f"{self.base_url}{path}"

        try:
            response = self.session.request(
                method,
                url,
                timeout=self.timeout,
                **kwargs
            )

            # Handle errors
            if response.status_code == 401:
                raise AuthenticationError("Invalid API key")
            elif response.status_code == 429:
                raise RateLimitError("Rate limit exceeded")
            elif response.status_code >= 400:
                error_data = response.json() if response.content else {}
                error_msg = error_data.get("error", f"HTTP {response.status_code}")
                raise PromptPilotError(error_msg)

            return response.json() if response.content else {}

        except requests.exceptions.Timeout:
            raise PromptPilotError("Request timeout")
        except requests.exceptions.ConnectionError:
            raise PromptPilotError("Connection error")
        except requests.exceptions.RequestException as e:
            raise PromptPilotError(f"Request failed: {str(e)}")
