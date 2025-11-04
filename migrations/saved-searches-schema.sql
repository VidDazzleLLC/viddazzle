-- Saved Searches and Alerts Schema Migration
-- This enables users to save search criteria and receive alerts when matching mentions are found

-- Saved Searches Table
-- Stores user-defined search criteria and alert preferences
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Search criteria (JSONB for flexibility)
  search_criteria JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example structure:
  -- {
  --   "keywords": ["buying tesla", "need lawyer"],
  --   "platforms": ["twitter", "facebook", "reddit"],
  --   "sentiment": ["positive", "neutral"],
  --   "intent": ["purchase_intent", "question"],
  --   "min_opportunity_score": 70,
  --   "min_relevance_score": 60,
  --   "min_follower_count": 1000,
  --   "exclude_keywords": ["spam", "bot"],
  --   "languages": ["en"]
  -- }

  -- Alert settings (JSONB for flexibility)
  alert_settings JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example structure:
  -- {
  --   "frequency": "immediate" | "hourly" | "daily" | "weekly",
  --   "channels": ["email", "webhook", "in_app"],
  --   "email": "user@example.com",
  --   "webhook_url": "https://...",
  --   "digest_time": "09:00",  // For daily/weekly digests
  --   "max_alerts_per_day": 50,
  --   "require_approval": false,
  --   "group_similar": true
  -- }

  is_active BOOLEAN DEFAULT TRUE,
  is_premium BOOLEAN DEFAULT FALSE, -- For paid tiers

  -- Tracking
  last_triggered_at TIMESTAMPTZ,
  total_alerts_sent INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Search Alerts Table
-- Records individual alert instances when mentions match saved searches
CREATE TABLE IF NOT EXISTS saved_search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  mention_id UUID NOT NULL REFERENCES social_mentions(id) ON DELETE CASCADE,

  -- Snapshot of why this matched (for historical reference)
  match_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Example:
  -- {
  --   "matched_keywords": ["buying tesla"],
  --   "opportunity_score": 85,
  --   "relevance_score": 90,
  --   "sentiment": "positive",
  --   "intent": "purchase_intent",
  --   "match_reason": "High opportunity score with purchase intent"
  -- }

  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  is_notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,

  -- User actions on this alert
  is_viewed BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  is_actioned BOOLEAN DEFAULT FALSE, -- User took action (replied, contacted, etc.)

  UNIQUE(saved_search_id, mention_id) -- Prevent duplicate alerts for same mention
);

-- Alert Notifications Table
-- Tracks notification delivery across different channels
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES saved_search_alerts(id) ON DELETE SET NULL,

  -- Notification details
  channel VARCHAR(50) NOT NULL, -- 'email', 'webhook', 'in_app'
  recipient TEXT NOT NULL, -- Email address, webhook URL, or user_id

  -- Delivery status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Content (for digest notifications, may contain multiple alerts)
  notification_data JSONB DEFAULT '{}'::JSONB,

  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Notification Preferences Table
-- Global notification settings per user
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  email_enabled BOOLEAN DEFAULT TRUE,
  webhook_enabled BOOLEAN DEFAULT FALSE,
  in_app_enabled BOOLEAN DEFAULT TRUE,

  -- Rate limiting
  max_emails_per_day INTEGER DEFAULT 50,
  max_webhooks_per_hour INTEGER DEFAULT 100,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME, -- e.g., '22:00'
  quiet_hours_end TIME,   -- e.g., '08:00'
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

  -- Digest preferences
  daily_digest_enabled BOOLEAN DEFAULT FALSE,
  daily_digest_time TIME DEFAULT '09:00',
  weekly_digest_enabled BOOLEAN DEFAULT FALSE,
  weekly_digest_day INTEGER DEFAULT 1, -- 1=Monday

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Demand Insights Table (NEW FEATURE)
-- Aggregates saved searches to show sellers what buyers are looking for
CREATE TABLE IF NOT EXISTS buyer_demand_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Aggregated demand data
  keyword_phrase TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  demand_count INTEGER DEFAULT 1, -- How many buyers are searching for this

  -- Metadata
  avg_opportunity_score NUMERIC(5,2),
  total_searches INTEGER DEFAULT 0,
  active_searches INTEGER DEFAULT 0,

  -- Time tracking
  first_searched_at TIMESTAMPTZ DEFAULT NOW(),
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(keyword_phrase)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_search_id ON saved_search_alerts(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_mention_id ON saved_search_alerts(mention_id);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_triggered_at ON saved_search_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_is_notified ON saved_search_alerts(is_notified) WHERE is_notified = false;

CREATE INDEX IF NOT EXISTS idx_alert_notifications_user_id ON alert_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_buyer_demand_keyword ON buyer_demand_insights(keyword_phrase);
CREATE INDEX IF NOT EXISTS idx_buyer_demand_count ON buyer_demand_insights(demand_count DESC);

-- GIN indexes for JSONB queries
CREATE INDEX IF NOT EXISTS idx_saved_searches_criteria_gin ON saved_searches USING GIN (search_criteria);
CREATE INDEX IF NOT EXISTS idx_saved_search_alerts_match_gin ON saved_search_alerts USING GIN (match_data);

-- Functions and Triggers
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update buyer demand insights when saved searches are created/updated
CREATE OR REPLACE FUNCTION update_buyer_demand_insights()
RETURNS TRIGGER AS $$
DECLARE
  keyword TEXT;
  platforms_array TEXT[];
BEGIN
  -- Extract keywords and platforms from search criteria
  IF NEW.search_criteria ? 'keywords' THEN
    platforms_array := COALESCE((NEW.search_criteria->>'platforms')::TEXT[], ARRAY['twitter', 'facebook', 'linkedin', 'reddit']);

    FOR keyword IN SELECT jsonb_array_elements_text(NEW.search_criteria->'keywords')
    LOOP
      INSERT INTO buyer_demand_insights (keyword_phrase, platforms, demand_count, total_searches, active_searches, last_searched_at)
      VALUES (keyword, platforms_array, 1, 1, CASE WHEN NEW.is_active THEN 1 ELSE 0 END, NOW())
      ON CONFLICT (keyword_phrase)
      DO UPDATE SET
        demand_count = buyer_demand_insights.demand_count + 1,
        total_searches = buyer_demand_insights.total_searches + 1,
        active_searches = buyer_demand_insights.active_searches + CASE WHEN NEW.is_active THEN 1 ELSE 0 END,
        last_searched_at = NOW();
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demand_on_saved_search_insert
  AFTER INSERT ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_demand_insights();

-- Row Level Security (RLS) Policies
-- Enable RLS on tables
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_demand_insights ENABLE ROW LEVEL SECURITY;

-- Policies for saved_searches
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for saved_search_alerts
CREATE POLICY "Users can view alerts for their saved searches"
  ON saved_search_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_searches
      WHERE saved_searches.id = saved_search_alerts.saved_search_id
      AND saved_searches.user_id = auth.uid()
    )
  );

-- Policies for alert_notifications
CREATE POLICY "Users can view their own notifications"
  ON alert_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for user_notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Buyer demand insights are public (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view buyer demand insights"
  ON buyer_demand_insights FOR SELECT
  TO authenticated
  USING (true);

-- Comments for documentation
COMMENT ON TABLE saved_searches IS 'User-defined search criteria for automated social media monitoring and alerts';
COMMENT ON TABLE saved_search_alerts IS 'Individual alert instances when mentions match saved search criteria';
COMMENT ON TABLE alert_notifications IS 'Notification delivery tracking across email, webhook, and in-app channels';
COMMENT ON TABLE user_notification_preferences IS 'Global notification preferences and rate limiting per user';
COMMENT ON TABLE buyer_demand_insights IS 'Aggregated view of what buyers are searching for, visible to sellers';

COMMENT ON COLUMN saved_searches.search_criteria IS 'JSONB: keywords, platforms, sentiment, intent, scores, filters';
COMMENT ON COLUMN saved_searches.alert_settings IS 'JSONB: frequency, channels, delivery preferences, rate limits';
COMMENT ON COLUMN saved_search_alerts.match_data IS 'JSONB: Snapshot of match reasoning for historical reference';
COMMENT ON COLUMN buyer_demand_insights.demand_count IS 'Number of active buyers searching for this keyword';
