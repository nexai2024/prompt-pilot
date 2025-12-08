# Prompt Pilot Python SDK

Official Python SDK for Prompt Pilot - Transform AI prompts into production-ready APIs.

## Installation

```bash
pip install promptpilot
```

## Quick Start

```python
from promptpilot import PromptPilot

# Initialize the client
client = PromptPilot(api_key="pp_live_your_api_key")

# Execute a prompt
result = client.prompts.execute(
    prompt_id="uuid-of-your-prompt",
    variables={
        "topic": "Artificial Intelligence",
        "tone": "professional"
    }
)

print(result.content)
print(f"Tokens used: {result.tokens_used}")
print(f"Cost: ${result.cost_dollars:.4f}")
print(f"Latency: {result.latency_ms}ms")
```

## Features

- ✅ Execute prompts with variables
- ✅ List and manage prompts
- ✅ Override model and parameters
- ✅ Automatic retries
- ✅ Type hints and autocompletion
- ✅ Comprehensive error handling

## Usage Examples

### Execute a Prompt

```python
result = client.prompts.execute(
    prompt_id="uuid-here",
    variables={"topic": "AI", "length": "short"}
)
print(result.content)
```

### Override Model Settings

```python
result = client.prompts.execute(
    prompt_id="uuid-here",
    variables={"topic": "AI"},
    model="gpt-4-turbo",  # Override default model
    temperature=0.9,       # Override temperature
    max_tokens=500         # Override max tokens
)
```

### List All Prompts

```python
prompts = client.prompts.list(organization_id="your-org-id")
for prompt in prompts:
    print(f"{prompt['name']}: {prompt['status']}")
```

### Create a New Prompt

```python
prompt = client.prompts.create(
    organization_id="your-org-id",
    name="My Prompt",
    content="Generate content about {{topic}}",
    description="A simple content generator",
    model="gpt-4"
)
print(f"Created prompt: {prompt['id']}")
```

### Error Handling

```python
from promptpilot import PromptPilotError, AuthenticationError, RateLimitError

try:
    result = client.prompts.execute(prompt_id="uuid", variables={})
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Rate limit exceeded, please wait")
except PromptPilotError as e:
    print(f"Error: {e}")
```

## Configuration

```python
client = PromptPilot(
    api_key="pp_live_xxx",
    base_url="https://api.promptpilot.com",  # Optional: custom API URL
    timeout=30  # Optional: request timeout in seconds
)
```

## Response Object

The `PromptResponse` object contains:

- `content` (str): The generated content
- `tokens_used` (int): Number of tokens consumed
- `cost_cents` (int): Cost in cents
- `cost_dollars` (float): Cost in dollars
- `latency_ms` (int): Response time in milliseconds
- `model` (str): Model used
- `provider` (str): Provider (openai, anthropic, cohere)
- `raw` (dict): Raw response data

## Requirements

- Python 3.7+
- requests

## Support

- Documentation: https://docs.promptpilot.com
- Issues: https://github.com/promptpilot/python-sdk/issues
- Email: support@promptpilot.com

## License

MIT License
