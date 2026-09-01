-- Prompt version lanes: system slots (dev, prod, shelf) plus numbered snapshots.

ALTER TABLE prompt_versions
  ADD COLUMN IF NOT EXISTS lane text NOT NULL DEFAULT 'snapshot',
  ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS response_format text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS variables_json text,
  ADD COLUMN IF NOT EXISTS populated boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_lane
  ON prompt_versions(prompt_id, lane);
