-- Complete VidDazzle Database Schema
-- This file contains ALL tables needed for the application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- WORKFLOW AUTOMATION TABLES
-- ============================================

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  execution_log JSONB,
  duration_ms INTEGER
);

-- Tutorial/Learning data table with vector embeddings
CREATE TABLE IF NOT EXISTS tutorial_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP tool usage tracking
CREATE TABLE IF NOT EXISTS mcp_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  workflow_id UUID REFERENCES workflows(id),
  execution_id UUID REFERENCES workflow_executions(id),
  input JSONB,
  output JSONB,
  success BOOLEAN,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connector configurations
CREATE TABLE IF NOT EXISTS connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL LISTENING & OUTREACH TABLES
-- ============================================

-- Campaigns Table
CREATE TABLE IF NOT EXISTS listening_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platforms TEXT[] NOT NULL,
    keywords TEXT[] NOT NULL,
    hashtags TEXT[],
    accounts_to_monitor TEXT[],
    filters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
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
    engagement JSONB DEFAULT '{}',
    sentiment VARCHAR(50),
    sentiment_score DECIMAL(3, 2),
    relevance_score INTEGER,
    opportunity_score INTEGER,
    intent VARCHAR(50),
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
    triggers JSONB NOT NULL,
    response_template TEXT NOT NULL,
    use_ai_personalization BOOLEAN DEFAULT TRUE,
    require_approval BOOLEAN DEFAULT TRUE,
    rate_limit JSONB DEFAULT '{"max_per_hour": 10, "max_per_day": 50}',
    channels JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach Messages Table
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mention_id UUID REFERENCES social_mentions(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES outreach_rules(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending_approval',
    channel JSONB NOT NULL,
    message_content TEXT NOT NULL,
    ai_personalization_used BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    response_received BOOLEAN DEFAULT FALSE,
    conversion_tracked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_outreach_status CHECK (status IN ('pending_approval', 'approved', 'sent', 'failed', 'rejected'))
);

-- Platform Credentials Table
CREATE TABLE IF NOT EXISTS platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform),
    CONSTRAINT valid_cred_platform CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'facebook'))
);

-- ============================================
-- INDEXES
-- ============================================

-- Workflow indexes
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_tutorial_embeddings_category ON tutorial_embeddings(category);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_usage_tool_name ON mcp_tool_usage(tool_name);
CREATE INDEX IF NOT EXISTS idx_connectors_type ON connectors(type);

-- Social listening indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON listening_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON listening_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_last_run ON listening_campaigns(last_run_at);
CREATE INDEX IF NOT EXISTS idx_mentions_campaign_id ON social_mentions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mentions_platform ON social_mentions(platform);
CREATE INDEX IF NOT EXISTS idx_mentions_detected_at ON social_mentions(detected_at);
CREATE INDEX IF NOT EXISTS idx_mentions_opportunity_score ON social_mentions(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_mentions_is_replied ON social_mentions(is_replied);
CREATE INDEX IF NOT EXISTS idx_mentions_platform_post_id ON social_mentions(platform, platform_post_id);
CREATE INDEX IF NOT EXISTS idx_outreach_rules_campaign_id ON outreach_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_rules_is_active ON outreach_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_mention_id ON outreach_messages(mention_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON outreach_messages(status);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign_id ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_sent_at ON outreach_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_platform_credentials_user_id ON platform_credentials(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_tutorial_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  FROM tutorial_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Workflow triggers
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tutorial_embeddings_updated_at ON tutorial_embeddings;
CREATE TRIGGER update_tutorial_embeddings_updated_at BEFORE UPDATE ON tutorial_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_connectors_updated_at ON connectors;
CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Social listening triggers
DROP TRIGGER IF EXISTS update_listening_campaigns_updated_at ON listening_campaigns;
CREATE TRIGGER update_listening_campaigns_updated_at
    BEFORE UPDATE ON listening_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outreach_rules_updated_at ON outreach_rules;
CREATE TRIGGER update_outreach_rules_updated_at
    BEFORE UPDATE ON outreach_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outreach_messages_updated_at ON outreach_messages;
CREATE TRIGGER update_outreach_messages_updated_at
    BEFORE UPDATE ON outreach_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_credentials_updated_at ON platform_credentials;
CREATE TRIGGER update_platform_credentials_updated_at
    BEFORE UPDATE ON platform_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
