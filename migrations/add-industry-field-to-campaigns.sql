-- Add industry field to listening_campaigns table for premium targeting
-- This enables industry-specific lead quality scoring and premium pricing tiers

-- Add industry enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE industry_type AS ENUM (
        'general',
        'legal',
        'mortgage',
        'realestate',
        'roofing',
        'solar',
        'homeimprovement',
        'plasticsurgery',
        'healthcare',
        'insurance',
        'financial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add industry column to listening_campaigns table
ALTER TABLE listening_campaigns 
ADD COLUMN IF NOT EXISTS industry industry_type DEFAULT 'general';

-- Add index for faster queries by industry
CREATE INDEX IF NOT EXISTS idx_listening_campaigns_industry 
ON listening_campaigns(industry);

-- Add comment to document the field
COMMENT ON COLUMN listening_campaigns.industry IS 'Target industry for lead scoring and premium pricing. Affects lead quality calculation with industry-specific keyword bonuses.';

-- Update any existing campaigns without an industry to 'general'
UPDATE listening_campaigns 
SET industry = 'general' 
WHERE industry IS NULL;
