ALTER TABLE prompt_versions
  ADD COLUMN IF NOT EXISTS changelog text;

ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_fixtures text;

ALTER TABLE deployments
  ADD COLUMN IF NOT EXISTS changelog text,
  ADD COLUMN IF NOT EXISTS prompt_version integer;
