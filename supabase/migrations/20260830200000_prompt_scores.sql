-- Prompt score history for AI quality tracking
CREATE TABLE IF NOT EXISTS prompt_scores (
  id SERIAL PRIMARY KEY,
  supabase_id UUID NOT NULL UNIQUE,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  overall_score INTEGER NOT NULL DEFAULT 0,
  clarity INTEGER NOT NULL DEFAULT 0,
  specificity INTEGER NOT NULL DEFAULT 0,
  structure INTEGER NOT NULL DEFAULT 0,
  variables INTEGER NOT NULL DEFAULT 0,
  robustness INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  strengths TEXT,
  improvements TEXT,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_scores_prompt_id ON prompt_scores(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_scores_organization_id ON prompt_scores(organization_id);
