export const CHANGELOG_MIN_LENGTH = 8;
export const CHANGELOG_MAX_LENGTH = 500;

export function normalizeChangelog(value: unknown): string {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function validateChangelog(value: unknown): string {
  const changelog = normalizeChangelog(value);
  if (changelog.length < CHANGELOG_MIN_LENGTH) {
    throw new Error(
      `Add a short changelog (${CHANGELOG_MIN_LENGTH}–${CHANGELOG_MAX_LENGTH} characters) before publishing to production`
    );
  }
  if (changelog.length > CHANGELOG_MAX_LENGTH) {
    throw new Error(`Changelog must be ${CHANGELOG_MAX_LENGTH} characters or less`);
  }
  return changelog;
}
