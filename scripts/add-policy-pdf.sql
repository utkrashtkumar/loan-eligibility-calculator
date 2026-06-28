-- Add policy_pdf column to bank_policies table if it doesn't exist
ALTER TABLE bank_policies ADD COLUMN IF NOT EXISTS policy_pdf TEXT;
