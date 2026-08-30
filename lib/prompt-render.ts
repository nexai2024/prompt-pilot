export function renderPromptTemplate(
  content: string,
  variables: Record<string, unknown>
): string {
  let rendered = content;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
      String(value ?? '')
    );
  }
  return rendered;
}
