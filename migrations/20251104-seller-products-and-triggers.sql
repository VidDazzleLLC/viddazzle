-- Migration: Seller Products and Buyer Engagement Triggers
-- Description: Enable sellers to manage multiple products/solutions and detect positive buyer engagement

-- ============================================================================
-- PRODUCTS/SOLUTIONS TABLE
-- ============================================================================
-- Allows sellers to define multiple products or solutions they offer
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Product Information
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Product Details
  features JSONB DEFAULT '[]'::jsonb, -- Array of product features
  benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefits
  target_audience TEXT, -- Who this product is for

  -- Offer Details
  call_to_action TEXT, -- What action you want buyers to take
  offer_url TEXT, -- Link to product page, booking calendar, etc.
  offer_type TEXT CHECK (offer_type IN ('product', 'service', 'consultation', 'free_trial', 'demo', 'download', 'other')),

  -- Response Template
  response_template TEXT, -- Template for outreach messages for this product
  ai_personalization_enabled BOOLEAN DEFAULT true,

  -- Targeting & Matching
  matching_keywords TEXT[] DEFAULT '{}', -- Keywords this product solves for
  exclude_keywords TEXT[] DEFAULT '{}', -- Keywords to avoid
  target_sentiment TEXT[] DEFAULT ARRAY['positive', 'neutral'], -- Which sentiment to target
  target_intent TEXT[] DEFAULT ARRAY['purchase_intent', 'question', 'informational'], -- Which intent to target
  min_opportunity_score INTEGER DEFAULT 50 CHECK (min_opportunity_score >= 0 AND min_opportunity_score <= 100),

  -- Status & Availability
  is_active BOOLEAN DEFAULT true,
  max_offers_per_day INTEGER DEFAULT 10, -- Rate limiting per product

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_keywords ON products USING GIN(matching_keywords);

-- ============================================================================
-- PRODUCT-CAMPAIGN LINKING TABLE
-- ============================================================================
-- Links products to listening campaigns for automated matching
CREATE TABLE IF NOT EXISTS product_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES listening_campaigns(id) ON DELETE CASCADE,

  -- Override settings for this specific campaign
  custom_response_template TEXT, -- Override product's default template
  priority INTEGER DEFAULT 1, -- If multiple products match, which to prioritize

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique product-campaign combinations
  UNIQUE(product_id, campaign_id)
);

CREATE INDEX idx_product_campaigns_product ON product_campaigns(product_id);
CREATE INDEX idx_product_campaigns_campaign ON product_campaigns(campaign_id);

-- ============================================================================
-- POSITIVE TRIGGER WORDS TABLE
-- ============================================================================
-- Define positive engagement triggers that indicate buyer interest
CREATE TABLE IF NOT EXISTS positive_trigger_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Trigger Configuration
  trigger_phrase TEXT NOT NULL, -- e.g., "interested", "tell me more", "yes please"
  trigger_type TEXT CHECK (trigger_type IN ('interest', 'purchase_intent', 'positive_sentiment', 'confirmation', 'question', 'request_info')) DEFAULT 'interest',

  -- Matching Options
  match_type TEXT CHECK (match_type IN ('exact', 'contains', 'regex', 'fuzzy')) DEFAULT 'contains',
  case_sensitive BOOLEAN DEFAULT false,

  -- Scoring
  confidence_boost INTEGER DEFAULT 10 CHECK (confidence_boost >= 0 AND confidence_boost <= 50), -- Boost opportunity score by this amount

  -- System or User-defined
  is_system_default BOOLEAN DEFAULT false, -- System-wide defaults vs user-specific
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system defaults

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_trigger_words_active ON positive_trigger_words(is_active) WHERE is_active = true;
CREATE INDEX idx_trigger_words_user ON positive_trigger_words(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- BUYER RESPONSES TABLE
-- ============================================================================
-- Track buyer responses to outreach messages and detect positive triggers
CREATE TABLE IF NOT EXISTS buyer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  outreach_message_id UUID NOT NULL REFERENCES outreach_messages(id) ON DELETE CASCADE,
  original_mention_id UUID REFERENCES social_mentions(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Response Content
  response_content TEXT NOT NULL,
  response_platform TEXT NOT NULL CHECK (response_platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'email', 'other')),
  response_url TEXT, -- Link to the response on social media

  -- Author Information
  author_username TEXT,
  author_profile_url TEXT,

  -- AI Analysis
  detected_triggers JSONB DEFAULT '[]'::jsonb, -- Array of detected trigger phrases
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score DECIMAL(3, 2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),

  buyer_interest_level TEXT CHECK (buyer_interest_level IN ('high', 'medium', 'low', 'none')) DEFAULT 'medium',
  is_positive_response BOOLEAN DEFAULT false, -- Whether this triggered positive engagement

  -- AI Suggestions
  suggested_next_action TEXT, -- What seller should do next
  ai_analysis JSONB, -- Full AI analysis output

  -- Status & Tracking
  response_processed BOOLEAN DEFAULT false,
  next_outreach_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_buyer_responses_outreach ON buyer_responses(outreach_message_id);
CREATE INDEX idx_buyer_responses_product ON buyer_responses(product_id);
CREATE INDEX idx_buyer_responses_positive ON buyer_responses(is_positive_response) WHERE is_positive_response = true;
CREATE INDEX idx_buyer_responses_unprocessed ON buyer_responses(response_processed) WHERE response_processed = false;

-- ============================================================================
-- BUYER CONSENT TABLE
-- ============================================================================
-- Track buyer permissions and consent for offers
CREATE TABLE IF NOT EXISTS buyer_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Buyer Identification (from social media)
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'linkedin', 'reddit', 'email', 'other')),
  platform_user_id TEXT NOT NULL, -- Their ID on that platform
  platform_username TEXT,

  -- Consent Details
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT CHECK (consent_type IN ('explicit', 'implicit', 'opt_out')) DEFAULT 'implicit',
  consent_given BOOLEAN DEFAULT true,

  -- Context
  consent_source TEXT, -- How consent was obtained (e.g., 'positive_response', 'dm_request', 'form_submission')
  original_mention_id UUID REFERENCES social_mentions(id) ON DELETE SET NULL,
  original_response_id UUID REFERENCES buyer_responses(id) ON DELETE SET NULL,

  -- Data Privacy
  can_contact BOOLEAN DEFAULT true,
  can_store_data BOOLEAN DEFAULT true,
  can_share_with_partners BOOLEAN DEFAULT false,

  -- Metadata
  consent_obtained_at TIMESTAMPTZ DEFAULT now(),
  consent_expires_at TIMESTAMPTZ, -- Optional expiration
  last_contact_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure unique buyer per seller per platform
  UNIQUE(platform, platform_user_id, seller_id)
);

-- Indexes
CREATE INDEX idx_buyer_consent_seller ON buyer_consent(seller_id);
CREATE INDEX idx_buyer_consent_buyer ON buyer_consent(platform, platform_user_id);
CREATE INDEX idx_buyer_consent_active ON buyer_consent(consent_given) WHERE consent_given = true;

-- ============================================================================
-- PRODUCT-MENTION MATCHES TABLE
-- ============================================================================
-- Track which products match which buyer mentions for analytics and optimization
CREATE TABLE IF NOT EXISTS product_mention_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  mention_id UUID NOT NULL REFERENCES social_mentions(id) ON DELETE CASCADE,

  -- Match Quality
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  matched_keywords TEXT[], -- Which keywords matched

  -- Status
  outreach_created BOOLEAN DEFAULT false,
  outreach_message_id UUID REFERENCES outreach_messages(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(product_id, mention_id)
);

CREATE INDEX idx_product_matches_product ON product_mention_matches(product_id);
CREATE INDEX idx_product_matches_mention ON product_mention_matches(mention_id);
CREATE INDEX idx_product_matches_pending ON product_mention_matches(outreach_created) WHERE outreach_created = false;

-- ============================================================================
-- INSERT DEFAULT POSITIVE TRIGGER WORDS
-- ============================================================================
-- Seed some common positive engagement triggers
INSERT INTO positive_trigger_words (trigger_phrase, trigger_type, match_type, confidence_boost, is_system_default) VALUES
  -- Interest Indicators
  ('interested', 'interest', 'contains', 20, true),
  ('tell me more', 'interest', 'contains', 25, true),
  ('more info', 'interest', 'contains', 20, true),
  ('sounds good', 'positive_sentiment', 'contains', 15, true),
  ('sounds interesting', 'interest', 'contains', 20, true),

  -- Purchase Intent
  ('how much', 'purchase_intent', 'contains', 30, true),
  ('what''s the price', 'purchase_intent', 'contains', 30, true),
  ('where can i buy', 'purchase_intent', 'contains', 35, true),
  ('want to purchase', 'purchase_intent', 'contains', 40, true),
  ('ready to buy', 'purchase_intent', 'contains', 40, true),

  -- Positive Confirmations
  ('yes please', 'confirmation', 'contains', 30, true),
  ('yes!', 'confirmation', 'exact', 25, true),
  ('absolutely', 'confirmation', 'contains', 20, true),
  ('definitely', 'confirmation', 'contains', 20, true),
  ('sure', 'confirmation', 'exact', 15, true),

  -- Questions (showing interest)
  ('how does it work', 'question', 'contains', 15, true),
  ('can you explain', 'question', 'contains', 15, true),
  ('do you have', 'question', 'contains', 15, true),
  ('is there a', 'question', 'contains', 10, true),

  -- Request for Information
  ('send me details', 'request_info', 'contains', 25, true),
  ('dm me', 'request_info', 'contains', 30, true),
  ('message me', 'request_info', 'contains', 30, true),
  ('contact me', 'request_info', 'contains', 30, true),
  ('email me', 'request_info', 'contains', 35, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- UPDATE OUTREACH_MESSAGES TABLE TO LINK PRODUCTS
-- ============================================================================
-- Add product_id column to outreach_messages if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'outreach_messages'
                 AND column_name = 'product_id') THEN
    ALTER TABLE outreach_messages
    ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

    CREATE INDEX idx_outreach_messages_product ON outreach_messages(product_id);
  END IF;
END $$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE positive_trigger_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mention_matches ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Users can only manage their own products
CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  USING (auth.uid() = seller_id);

-- PRODUCT CAMPAIGNS: Only product owner can link to campaigns
CREATE POLICY "Users can view product campaigns for their products"
  ON product_campaigns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_campaigns.product_id
    AND products.seller_id = auth.uid()
  ));

CREATE POLICY "Users can create product campaigns for their products"
  ON product_campaigns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_campaigns.product_id
    AND products.seller_id = auth.uid()
  ));

CREATE POLICY "Users can delete product campaigns for their products"
  ON product_campaigns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_campaigns.product_id
    AND products.seller_id = auth.uid()
  ));

-- POSITIVE TRIGGER WORDS: Users can see system defaults + their own custom triggers
CREATE POLICY "Users can view all trigger words"
  ON positive_trigger_words FOR SELECT
  USING (is_system_default = true OR user_id = auth.uid());

CREATE POLICY "Users can create custom trigger words"
  ON positive_trigger_words FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_system_default = false);

CREATE POLICY "Users can update their custom trigger words"
  ON positive_trigger_words FOR UPDATE
  USING (user_id = auth.uid() AND is_system_default = false);

CREATE POLICY "Users can delete their custom trigger words"
  ON positive_trigger_words FOR DELETE
  USING (user_id = auth.uid() AND is_system_default = false);

-- BUYER RESPONSES: Users can see responses to their outreach messages
CREATE POLICY "Users can view responses to their outreach"
  ON buyer_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM outreach_messages om
    JOIN listening_campaigns lc ON om.campaign_id = lc.id
    WHERE om.id = buyer_responses.outreach_message_id
    AND lc.user_id = auth.uid()
  ));

CREATE POLICY "System can insert buyer responses"
  ON buyer_responses FOR INSERT
  WITH CHECK (true); -- Backend system will handle creation

CREATE POLICY "Users can update responses to their outreach"
  ON buyer_responses FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM outreach_messages om
    JOIN listening_campaigns lc ON om.campaign_id = lc.id
    WHERE om.id = buyer_responses.outreach_message_id
    AND lc.user_id = auth.uid()
  ));

-- BUYER CONSENT: Users can only see consent for their interactions
CREATE POLICY "Users can view buyer consent for their interactions"
  ON buyer_consent FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "System can manage buyer consent"
  ON buyer_consent FOR ALL
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- PRODUCT MENTION MATCHES: Users can see matches for their products
CREATE POLICY "Users can view matches for their products"
  ON product_mention_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_mention_matches.product_id
    AND products.seller_id = auth.uid()
  ));

CREATE POLICY "System can create product matches"
  ON product_mention_matches FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_mention_matches.product_id
    AND products.seller_id = auth.uid()
  ));

-- ============================================================================
-- FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_updated_at();

-- Function to update buyer_consent updated_at timestamp
CREATE OR REPLACE FUNCTION update_buyer_consent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER buyer_consent_updated_at
  BEFORE UPDATE ON buyer_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_consent_updated_at();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Product Performance Analytics
CREATE OR REPLACE VIEW product_performance AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.seller_id,
  p.is_active,
  COUNT(DISTINCT pmm.mention_id) as total_matches,
  COUNT(DISTINCT om.id) as total_outreach_sent,
  COUNT(DISTINCT br.id) as total_responses,
  COUNT(DISTINCT br.id) FILTER (WHERE br.is_positive_response = true) as positive_responses,
  CASE
    WHEN COUNT(DISTINCT om.id) > 0
    THEN (COUNT(DISTINCT br.id)::decimal / COUNT(DISTINCT om.id) * 100)
    ELSE 0
  END as response_rate_percent,
  MAX(om.created_at) as last_outreach_sent,
  MAX(br.created_at) as last_response_received
FROM products p
LEFT JOIN product_mention_matches pmm ON p.id = pmm.product_id
LEFT JOIN outreach_messages om ON p.id = om.product_id
LEFT JOIN buyer_responses br ON om.id = br.outreach_message_id
GROUP BY p.id, p.name, p.seller_id, p.is_active;

-- Grant access to the view
GRANT SELECT ON product_performance TO authenticated;

COMMENT ON TABLE products IS 'Stores seller products/solutions for buyer matching and outreach';
COMMENT ON TABLE product_campaigns IS 'Links products to listening campaigns for automated matching';
COMMENT ON TABLE positive_trigger_words IS 'Defines trigger words/phrases that indicate positive buyer engagement';
COMMENT ON TABLE buyer_responses IS 'Tracks buyer responses to outreach messages and detects positive triggers';
COMMENT ON TABLE buyer_consent IS 'Manages buyer permissions and consent for seller outreach';
COMMENT ON TABLE product_mention_matches IS 'Tracks which products match which buyer mentions';
COMMENT ON VIEW product_performance IS 'Analytics view showing product performance metrics';
