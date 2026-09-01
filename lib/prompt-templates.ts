export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'support' | 'extraction' | 'coding' | 'marketing' | 'ops';
  model: string;
  temperature: number;
  maxTokens: number;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default_value?: string;
  }>;
}

export const TEMPLATE_CATEGORIES: Array<{ id: PromptTemplate['category'] | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'support', label: 'Support' },
  { id: 'extraction', label: 'Extraction' },
  { id: 'coding', label: 'Coding' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'ops', label: 'Operations' },
];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'support-triage',
    name: 'Support ticket triage',
    description: 'Classify inbound tickets by urgency, product area, and suggested first reply.',
    category: 'support',
    model: 'gpt-4-turbo',
    temperature: 0.2,
    maxTokens: 500,
    content: `You are a customer support triage assistant for {{company}}.

Classify the ticket and draft a first reply.

Ticket:
{{ticket}}

Return JSON with keys: urgency (low|medium|high|critical), product_area, summary, suggested_reply.`,
    variables: [
      { name: 'company', type: 'string', description: 'Company name', required: true, default_value: 'Acme' },
      { name: 'ticket', type: 'string', description: 'Raw ticket text', required: true },
    ],
  },
  {
    id: 'support-tone',
    name: 'Empathetic reply rewriter',
    description: 'Rewrite a draft support reply so it stays accurate, warm, and concise.',
    category: 'support',
    model: 'gpt-4',
    temperature: 0.4,
    maxTokens: 400,
    content: `Rewrite this support reply for {{product}}. Keep facts, remove blame, and stay under 120 words.

Draft:
{{draft}}`,
    variables: [
      { name: 'product', type: 'string', description: 'Product name', required: true },
      { name: 'draft', type: 'string', description: 'Draft reply', required: true },
    ],
  },
  {
    id: 'extract-json',
    name: 'Structured data extractor',
    description: 'Pull named fields from messy text into strict JSON.',
    category: 'extraction',
    model: 'gpt-4-turbo',
    temperature: 0,
    maxTokens: 600,
    content: `Extract the following fields from the source text: {{fields}}.
If a field is missing, use null. Return JSON only.

Source:
{{source}}`,
    variables: [
      { name: 'fields', type: 'string', description: 'Comma-separated field names', required: true },
      { name: 'source', type: 'string', description: 'Unstructured source text', required: true },
    ],
  },
  {
    id: 'extract-entities',
    name: 'Entity highlighter',
    description: 'Find people, companies, dates, and amounts in a document.',
    category: 'extraction',
    model: 'gpt-4',
    temperature: 0.1,
    maxTokens: 500,
    content: `Identify entities in the document. Group them as people, organizations, dates, and monetary_amounts.

Document:
{{document}}`,
    variables: [{ name: 'document', type: 'string', description: 'Document text', required: true }],
  },
  {
    id: 'code-review',
    name: 'PR review assistant',
    description: 'Review a diff for bugs, missing tests, and API contract risks.',
    category: 'coding',
    model: 'gpt-4-turbo',
    temperature: 0.2,
    maxTokens: 900,
    content: `Review this {{language}} diff. Rank findings by severity. Suggest concrete patches.

Diff:
{{diff}}`,
    variables: [
      { name: 'language', type: 'string', description: 'Language', required: true, default_value: 'TypeScript' },
      { name: 'diff', type: 'string', description: 'Git diff', required: true },
    ],
  },
  {
    id: 'code-explain',
    name: 'Code explainer',
    description: 'Explain a snippet for a teammate who is new to the codebase.',
    category: 'coding',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 700,
    content: `Explain this {{language}} code to a new teammate. Cover purpose, inputs, outputs, and failure modes.

Code:
{{code}}`,
    variables: [
      { name: 'language', type: 'string', description: 'Language', required: true, default_value: 'TypeScript' },
      { name: 'code', type: 'string', description: 'Source code', required: true },
    ],
  },
  {
    id: 'mkt-launch',
    name: 'Launch copy pack',
    description: 'Generate a landing headline, subhead, and three benefit bullets.',
    category: 'marketing',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 500,
    content: `Write launch copy for {{product}} targeting {{audience}}.
Return: headline, subhead, and 3 benefit bullets. Avoid hype words.`,
    variables: [
      { name: 'product', type: 'string', description: 'Product name and one-liner', required: true },
      { name: 'audience', type: 'string', description: 'Target audience', required: true },
    ],
  },
  {
    id: 'mkt-seo',
    name: 'SEO meta writer',
    description: 'Write title, description, and OG copy from a page brief.',
    category: 'marketing',
    model: 'gpt-4-turbo',
    temperature: 0.4,
    maxTokens: 350,
    content: `Create SEO metadata for this page. Title <= 60 chars. Description <= 155 chars.

Brief:
{{brief}}`,
    variables: [{ name: 'brief', type: 'string', description: 'Page brief', required: true }],
  },
  {
    id: 'ops-standup',
    name: 'Standup summarizer',
    description: 'Turn messy team notes into blockers, decisions, and next actions.',
    category: 'ops',
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 450,
    content: `Summarize this standup for {{team}}. Output: shipped, in_progress, blockers, decisions, next_actions.

Notes:
{{notes}}`,
    variables: [
      { name: 'team', type: 'string', description: 'Team name', required: true },
      { name: 'notes', type: 'string', description: 'Raw standup notes', required: true },
    ],
  },
  {
    id: 'ops-incident',
    name: 'Incident timeline',
    description: 'Turn Slack/logs into a clean incident timeline and customer update.',
    category: 'ops',
    model: 'gpt-4-turbo',
    temperature: 0.2,
    maxTokens: 700,
    content: `Create an incident report from the log. Include timeline, impact, current status, and a customer-facing update.

Log:
{{log}}`,
    variables: [{ name: 'log', type: 'string', description: 'Incident notes or log excerpt', required: true }],
  },
  {
    id: 'extract-eval',
    name: 'Prompt eval judge',
    description: 'Score a model output against a rubric and expected constraints.',
    category: 'ops',
    model: 'gpt-4',
    temperature: 0,
    maxTokens: 400,
    content: `Score the candidate output from 1-5 on accuracy, completeness, and format.
Expected constraints: {{rubric}}

Output:
{{output}}

Return JSON: scores, rationale, pass (boolean).`,
    variables: [
      { name: 'rubric', type: 'string', description: 'What a passing answer must include', required: true },
      { name: 'output', type: 'string', description: 'Model output to judge', required: true },
    ],
  },
  {
    id: 'support-faq',
    name: 'FAQ from docs',
    description: 'Turn a help article into 5 concise FAQ pairs.',
    category: 'support',
    model: 'gpt-4',
    temperature: 0.4,
    maxTokens: 600,
    content: `Create 5 FAQ pairs from this help article. Answers must stay faithful to the source.

Article:
{{article}}`,
    variables: [{ name: 'article', type: 'string', description: 'Help article', required: true }],
  },
];

export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((template) => template.id === id);
}
