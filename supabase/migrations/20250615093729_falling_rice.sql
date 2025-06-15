/*
  # Seed Initial Data for Prompt Pilot Platform

  1. Billing Plans
    - Create starter, professional, and enterprise plans
  
  2. Sample Data
    - Create sample organization and user data for development
*/

-- Insert billing plans
INSERT INTO billing_plans (name, description, price_monthly, price_yearly, max_apis, max_api_calls, max_storage_gb, features) VALUES
(
  'Starter',
  'Perfect for individuals and small projects',
  2900, -- $29.00
  29000, -- $290.00 (save 2 months)
  5,
  10000,
  1,
  '["5 AI APIs", "10K API calls/month", "Basic prompt studio", "Community support", "Standard models"]'
),
(
  'Professional',
  'Ideal for growing businesses and teams',
  9900, -- $99.00
  99000, -- $990.00 (save 2 months)
  25,
  100000,
  10,
  '["25 AI APIs", "100K API calls/month", "Advanced prompt studio", "Priority support", "Premium models", "Custom domains", "Analytics dashboard"]'
),
(
  'Enterprise',
  'For large organizations with specific needs',
  0, -- Custom pricing
  0,
  -1, -- Unlimited
  -1, -- Unlimited
  -1, -- Unlimited
  '["Unlimited APIs", "Custom API limits", "White-label solution", "Dedicated support", "Custom models", "Advanced security", "SLA guarantee"]'
);

-- Note: In a real application, you would not seed user data in migrations
-- This is just for development purposes
-- The actual user data would be created through the application signup flow