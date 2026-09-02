export function formatRelativeTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return '';

  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (abs < 60) return formatter.format(deltaSeconds, 'second');
  if (abs < 3600) return formatter.format(Math.round(deltaSeconds / 60), 'minute');
  if (abs < 86400) return formatter.format(Math.round(deltaSeconds / 3600), 'hour');
  if (abs < 604800) return formatter.format(Math.round(deltaSeconds / 86400), 'day');
  return date.toLocaleDateString();
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstNameFrom(name: string | null | undefined): string {
  if (!name?.trim()) return '';
  return name.trim().split(/\s+/)[0] || '';
}

export function estimatePromptTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}
