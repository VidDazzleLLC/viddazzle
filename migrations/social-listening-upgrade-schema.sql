-- Enterprise Social Listening Upgrade Schema
-- Created: 2025-11-06
-- Purpose: Add sentiment analysis, influencer tracking, trend detection, and lead scoring

-- ============================================================================
-- 1. SENTIMENT ANALYSIS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID NOT NULL REFERENCES social_mentions(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Sentiment scores
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  polarity_score DECIMAL(5,4) NOT NULL CHECK (polarity_score >= -1 AND polarity_score <= 1),
  
  -- Emotion analysis
  emotions JSONB DEFAULT '{}',
  primary_emotion VARCHAR(50),
  
  -- Entity extraction
  entities JSONB DEFAULT '[]',
  key_phrases JSONB DEFAULT '[]',
  
  -- Context
  topics JSONB DEFAULT '[]',
  intent VARCHAR(100),
  
  -- AI metadata
  model_version VARCHAR(50),
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sentiment_analysis_mention ON sentiment_analysis(mention_id);
CREATE INDEX idx_sentiment_analysis_campaign ON sentiment_analysis(campaign_id);
CREATE INDEX idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment);
CREATE INDEX idx_sentiment_analysis_created ON sentiment_analysis(created_at DESC);

-- ============================================================================
-- 2. INFLUENCERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Identity
  username VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  profile_url TEXT,
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  
  -- Metrics
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4),
  
  -- Relevance scoring
  relevance_score DECIMAL(5,2) CHECK (relevance_score >= 0 AND relevance_score <= 100),
  mention_count INTEGER DEFAULT 0,
  avg_sentiment DECIMAL(5,4),
  
  -- Categorization
  categories JSONB DEFAULT '[]',
  is_verified BOOLEAN DEFAULT FALSE,
  influence_tier VARCHAR(20) CHECK (influence_tier IN ('micro', 'mid', 'macro', 'mega')),
  
  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(username, platform, campaign_id)
);

CREATE INDEX idx_influencers_campaign ON influencers(campaign_id);
CREATE INDEX idx_influencers_platform ON influencers(platform);
CREATE INDEX idx_influencers_relevance ON influencers(relevance_score DESC);
CREATE INDEX idx_influencers_tier ON influencers(influence_tier);

-- ============================================================================
-- 3. TRENDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Trend details
  trend_type VARCHAR(50) NOT NULL CHECK (trend_type IN ('keyword', 'hashtag', 'topic', 'phrase')),
  value TEXT NOT NULL,
  normalized_value TEXT,
  
  -- Metrics
  mention_count INTEGER DEFAULT 0,
  unique_authors INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  avg_sentiment DECIMAL(5,4),
  
  -- Velocity analysis
  velocity_score DECIMAL(5,2),
  growth_rate DECIMAL(7,4),
  peak_time TIMESTAMPTZ,
  
  -- Time windows
  time_window VARCHAR(20) CHECK (time_window IN ('hour', 'day', 'week', 'month')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('emerging', 'active', 'declining', 'dormant')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, trend_type, value, window_start)
);

CREATE INDEX idx_trends_campaign ON trends(campaign_id);
CREATE INDEX idx_trends_type ON trends(trend_type);
CREATE INDEX idx_trends_velocity ON trends(velocity_score DESC);
CREATE INDEX idx_trends_window ON trends(window_start DESC, window_end DESC);
CREATE INDEX idx_trends_status ON trends(status);

-- ============================================================================
-- 4. ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Context
  related_mention_id UUID REFERENCES social_mentions(id) ON DELETE SET NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'actioned')),
  read_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_campaign ON alerts(campaign_id);
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- ============================================================================
-- 5. ALERT RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Rule definition
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  conditions JSONB NOT NULL,
  
  -- Actions
  actions JSONB NOT NULL,
  notification_channels JSONB DEFAULT '[]',
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  throttle_minutes INTEGER DEFAULT 0,
  
  -- Tracking
  last_triggered_at TIMESTAMPTZ,
  trigger_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_campaign ON alert_rules(campaign_id);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);

-- ============================================================================
-- 6. COMPETITORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Competitor details
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  keywords JSONB DEFAULT '[]',
  social_handles JSONB DEFAULT '{}',
  
  -- Metrics
  mention_count INTEGER DEFAULT 0,
  sentiment_score DECIMAL(5,4),
  share_of_voice DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, name)
);

CREATE INDEX idx_competitors_campaign ON competitors(campaign_id);

-- ============================================================================
-- 7. LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID NOT NULL REFERENCES social_mentions(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Lead details
  username VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  profile_url TEXT,
  
  -- Scoring (0-100)
  lead_score DECIMAL(5,2) NOT NULL CHECK (lead_score >= 0 AND lead_score <= 100),
  intent_score DECIMAL(5,2) CHECK (intent_score >= 0 AND intent_score <= 100),
  influence_score DECIMAL(5,2) CHECK (influence_score >= 0 AND influence_score <= 100),
  engagement_score DECIMAL(5,2) CHECK (engagement_score >= 0 AND engagement_score <= 100),
  
  -- Qualification
  qualification_status VARCHAR(20) DEFAULT 'new' CHECK (qualification_status IN ('new', 'qualified', 'unqualified', 'contacted', 'converted')),
  qualification_reason TEXT,
  
  -- Context
  intent_signals JSONB DEFAULT '[]',
  pain_points JSONB DEFAULT '[]',
  
  -- Follow-up
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  contacted_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_status ON leads(qualification_status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ============================================================================
-- 8. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Report details
  report_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  format VARCHAR(20) CHECK (format IN ('pdf', 'excel', 'json', 'html')),
  
  -- Time range
  date_from TIMESTAMPTZ NOT NULL,
  date_to TIMESTAMPTZ NOT NULL,
  
  -- Content
  sections JSONB DEFAULT '[]',
  data JSONB,
  
  -- File
  file_url TEXT,
  file_size INTEGER,
  
  -- Schedule
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_cron VARCHAR(100),
  next_run_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_campaign ON reports(campaign_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

-- ============================================================================
-- 9. COMMUNITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES listening_campaigns(id) ON DELETE CASCADE,
  
  -- Community details
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(50) NOT NULL,
  community_url TEXT,
  
  -- Metrics
  member_count INTEGER DEFAULT 0,
  mention_count INTEGER DEFAULT 0,
  avg_sentiment DECIMAL(5,4),
  engagement_rate DECIMAL(5,4),
  
  -- Classification
  categories JSONB DEFAULT '[]',
  keywords JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_id, platform, community_url)
);

CREATE INDEX idx_communities_campaign ON communities(campaign_id);
CREATE INDEX idx_communities_platform ON communities(platform);
