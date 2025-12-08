# Prompt Pilot JavaScript SDK

Official JavaScript/TypeScript SDK for Prompt Pilot - Transform AI prompts into production-ready APIs.

## Installation

```bash
npm install @promptpilot/sdk
# or
yarn add @promptpilot/sdk
```

## Quick Start

```typescript
import { PromptPilot } from '@promptpilot/sdk';

// Initialize the client
const client = new PromptPilot({
  apiKey: 'pp_live_your_api_key'
});

// Execute a prompt
const result = await client.prompts.execute({
  promptId: 'uuid-of-your-prompt',
  variables: {
    topic: 'Artificial Intelligence',
    tone: 'professional'
  }
});

console.log(result.content);
console.log(`Tokens: ${result.tokensUsed}`);
console.log(`Cost: $${result.costDollars.toFixed(4)}`);
console.log(`Latency: ${result.latencyMs}ms`);
```

## Features

- ✅ Full TypeScript support
- ✅ Execute prompts with variables
- ✅ List and manage prompts
- ✅ Override model and parameters
- ✅ Automatic error handling
- ✅ Promise-based API
- ✅ Works in Node.js and browsers

## Usage Examples

### Execute a Prompt

```typescript
const result = await client.prompts.execute({
  promptId: 'uuid-here',
  variables: { topic: 'AI', length: 'short' }
});

console.log(result.content);
```

### Override Model Settings

```typescript
const result = await client.prompts.execute({
  promptId: 'uuid-here',
  variables: { topic: 'AI' },
  model: 'gpt-4-turbo',     // Override default model
  temperature: 0.9,          // Override temperature
  maxTokens: 500             // Override max tokens
});
```

### List All Prompts

```typescript
const prompts = await client.prompts.list('your-org-id');
prompts.forEach(prompt => {
  console.log(`${prompt.name}: ${prompt.status}`);
});
```

### Create a New Prompt

```typescript
const prompt = await client.prompts.create({
  organizationId: 'your-org-id',
  name: 'My Prompt',
  content: 'Generate content about {{topic}}',
  description: 'A simple content generator',
  model: 'gpt-4'
});

console.log(`Created prompt: ${prompt.id}`);
```

### Update a Prompt

```typescript
const updated = await client.prompts.update('prompt-id', {
  name: 'Updated Name',
  content: 'New content with {{variable}}'
});
```

### Delete a Prompt

```typescript
await client.prompts.delete('prompt-id');
```

### Error Handling

```typescript
import {
  PromptPilot,
  PromptPilotError,
  AuthenticationError,
  RateLimitError
} from '@promptpilot/sdk';

try {
  const result = await client.prompts.execute({
    promptId: 'uuid',
    variables: {}
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limit exceeded');
  } else if (error instanceof PromptPilotError) {
    console.error(`Error: ${error.message}`);
  }
}
```

## Configuration

```typescript
const client = new PromptPilot({
  apiKey: 'pp_live_xxx',
  baseURL: 'https://api.promptpilot.com', // Optional: custom API URL
  timeout: 30000 // Optional: request timeout in ms
});
```

## TypeScript Types

The SDK is written in TypeScript and provides full type definitions:

```typescript
interface PromptResponse {
  content: string;
  tokensUsed: number;
  costCents: number;
  costDollars: number;
  latencyMs: number;
  model: string;
  provider: string;
  raw: any;
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  description?: string;
  model: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

## Browser Usage

The SDK works in modern browsers that support the Fetch API:

```html
<script type="module">
  import { PromptPilot } from '@promptpilot/sdk';

  const client = new PromptPilot({ apiKey: 'pp_live_xxx' });

  const result = await client.prompts.execute({
    promptId: 'uuid',
    variables: { topic: 'AI' }
  });

  console.log(result.content);
</script>
```

## React Example

```tsx
import { useEffect, useState } from 'react';
import { PromptPilot } from '@promptpilot/sdk';

const client = new PromptPilot({ apiKey: process.env.PROMPTPILOT_API_KEY });

function PromptExecutor() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const executePrompt = async () => {
    setLoading(true);
    try {
      const response = await client.prompts.execute({
        promptId: 'your-prompt-id',
        variables: { topic: 'AI' }
      });
      setResult(response.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={executePrompt} disabled={loading}>
        Execute Prompt
      </button>
      {result && <p>{result}</p>}
    </div>
  );
}
```

## Requirements

- Node.js 14+ or modern browser
- fetch API support (or polyfill for older browsers)

## Support

- Documentation: https://docs.promptpilot.com
- Issues: https://github.com/promptpilot/js-sdk/issues
- Email: support@promptpilot.com

## License

MIT License
