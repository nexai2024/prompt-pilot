-- Multi-tenant domain columns for organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS vanity_subdomain text UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE,
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token text;

CREATE INDEX IF NOT EXISTS idx_organizations_vanity_subdomain ON organizations(vanity_subdomain);
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON organizations(custom_domain);
