-- Social Media Listening & Outreach Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns Table
CREATE TABLE IF NOT EXISTS listening_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platforms TEXT[] NOT NULL, -- ['twitter', 'linkedin', 'reddit', 'facebook']
    keywords TEXT[] NOT NULL,
    hashtags TEXT[],
    accounts_to_monitor TEXT[],
    filters JSONB DEFAULT '{}', -- { min_followers, min_engagement, languages, locations, exclude_keywords, sentiment_filter }
    status VARCHAR(50) DEFAULT 'draft', -- 'active', 'paused', 'completed', 'draft'
    interval_minutes INTEGER DEFAULT 15,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    CONSTRAINT valid_status CHECK (status IN ('active', 'paused', 'completed', 'draft'))
);

-- Social Mentions Table
CREATE TABLE IF NOT EXISTS social_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_post_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_username VARCHAR(255) NOT NULL,
    author_display_name VARCHAR(255),
    author_profile_url TEXT,
    author_follower_count INTEGER,
    post_url TEXT NOT NULL,
    engagement JSONB DEFAULT '{}', -- { likes, comments, shares, views }
    sentiment VARCHAR(50), -- 'positive', 'negative', 'neutral', 'mixed'
    sentiment_score DECIMAL(3, 2), -- -1.00 to 1.00
    relevance_score INTEGER, -- 0 to 100
    opportunity_score INTEGER, -- 0 to 100
    intent VARCHAR(50), -- 'informational', 'purchase_intent', 'complaint', 'question', etc.
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    post_created_at TIMESTAMP WITH TIME ZONE,
    keywords_matched TEXT[],
    is_replied BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(platform, platform_post_id),
    CONSTRAINT valid_platform CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'facebook')),
    CONSTRAINT valid_sentiment CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    CONSTRAINT valid_relevance_score CHECK (relevance_score BETWEEN 0 AND 100),
    CONSTRAINT valid_opportunity_score CHECK (opportunity_score BETWEEN 0 AND 100)
);

-- Outreach Rules Table
CREATE TABLE IF NOT EXISTS outreach_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggers JSONB NOT NULL, -- { min_opportunity_score, min_relevance_score, sentiment, intent, etc. }
    response_template TEXT NOT NULL,
    use_ai_personalization BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT TRUE,
    rate_limit JSONB DEFAULT '{"max_per_hour": 10, "max_per_day": 50}',
    channels JSONB NOT NULL, -- [{ type: 'reply', platform: 'twitter', delay_minutes: 0 }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach Messages Table
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mention_id UUID REFERENCES social_mentions(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES outreach_rules(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending_approval', -- 'pending_approval', 'approved', 'sent', 'failed', 'rejected'
    channel JSONB NOT NULL, -- { type: 'reply', platform: 'twitter', delay_minutes: 0 }
    message_content TEXT NOT NULL,
    ai_personalization_used BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_received BOOLEAN DEFAULT FALSE,
    conversion_tracked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending_approval', 'approved', 'sent', 'failed', 'rejected'))
);

-- Platform Credentials Table (encrypted in production!)
CREATE TABLE IF NOT EXISTS platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL, -- Encrypted credentials
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform),
    CONSTRAINT valid_platform CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'facebook'))
);

-- Indexes for Performance
CREATE INDEX idx_campaigns_user_id ON listening_campaigns(user_id);
CREATE INDEX idx_campaigns_status ON listening_campaigns(status);
CREATE INDEX idx_campaigns_last_run ON listening_campaigns(last_run_at);

CREATE INDEX idx_mentions_campaign_id ON social_mentions(campaign_id);
CREATE INDEX idx_mentions_platform ON social_mentions(platform);
CREATE INDEX idx_mentions_detected_at ON social_mentions(detected_at);
CREATE INDEX idx_mentions_opportunity_score ON social_mentions(opportunity_score);
CREATE INDEX idx_mentions_is_replied ON social_mentions(is_replied);
CREATE INDEX idx_mentions_platform_post_id ON social_mentions(platform, platform_post_id);

CREATE INDEX idx_outreach_rules_campaign_id ON outreach_rules(campaign_id);
CREATE INDEX idx_outreach_rules_is_active ON outreach_rules(is_active);

CREATE INDEX idx_outreach_messages_mention_id ON outreach_messages(mention_id);
CREATE INDEX idx_outreach_messages_status ON outreach_messages(status);
CREATE INDEX idx_outreach_messages_campaign_id ON outreach_messages(campaign_id);
CREATE INDEX idx_outreach_messages_sent_at ON outreach_messages(sent_at);

CREATE INDEX idx_platform_credentials_user_id ON platform_credentials(user_id);

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
CREATE TRIGGER update_listening_campaigns_updated_at
    BEFORE UPDATE ON listening_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_rules_updated_at
    BEFORE UPDATE ON outreach_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outreach_messages_updated_at
    BEFORE UPDATE ON outreach_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_credentials_updated_at
    BEFORE UPDATE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
