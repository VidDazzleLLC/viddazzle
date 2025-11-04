// Social Media Listening & Outreach Types

export type Platform = 'twitter' | 'linkedin' | 'reddit' | 'facebook';

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

export type IntentType =
  | 'informational'
  | 'purchase_intent'
  | 'complaint'
  | 'question'
  | 'recommendation'
  | 'comparison'
  | 'feedback';

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

export type OutreachStatus =
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'failed'
  | 'rejected';

export interface ListeningCampaign {
  id: string;
  name: string;
  description?: string;
  platforms: Platform[];
  keywords: string[];
  hashtags?: string[];
  accounts_to_monitor?: string[];
  filters: CampaignFilters;
  status: CampaignStatus;
  interval_minutes: number;
  last_run_at?: Date;
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface CampaignFilters {
  min_followers?: number;
  min_engagement?: number;
  languages?: string[];
  locations?: string[];
  exclude_keywords?: string[];
  sentiment_filter?: SentimentType[];
}

export interface SocialMention {
  id: string;
  campaign_id: string;
  platform: Platform;
  platform_post_id: string;
  content: string;
  author_username: string;
  author_display_name: string;
  author_profile_url: string;
  author_follower_count?: number;
  post_url: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  sentiment: SentimentType;
  sentiment_score: number; // -1 to 1
  relevance_score: number; // 0 to 100
  opportunity_score: number; // 0 to 100
  intent: IntentType;
  detected_at: Date;
  post_created_at: Date;
  keywords_matched: string[];
  is_replied: boolean;
  is_archived: boolean;
  metadata?: Record<string, any>;
}

export interface OutreachRule {
  id: string;
  campaign_id: string;
  name: string;
  is_active: boolean;
  triggers: OutreachTrigger;
  response_template: string;
  use_ai_personalization: boolean;
  require_approval: boolean;
  rate_limit: {
    max_per_hour: number;
    max_per_day: number;
  };
  channels: OutreachChannel[];
  created_at: Date;
  updated_at: Date;
}

export interface OutreachTrigger {
  min_opportunity_score?: number;
  min_relevance_score?: number;
  sentiment?: SentimentType[];
  intent?: IntentType[];
  min_follower_count?: number;
  keywords_required?: string[];
  platforms?: Platform[];
}

export interface OutreachChannel {
  type: 'reply' | 'dm' | 'email';
  platform?: Platform;
  delay_minutes?: number;
}

export interface OutreachMessage {
  id: string;
  mention_id: string;
  rule_id: string;
  campaign_id: string;
  status: OutreachStatus;
  channel: OutreachChannel;
  message_content: string;
  ai_personalization_used: boolean;
  sent_at?: Date;
  error_message?: string;
  response_received: boolean;
  conversion_tracked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CampaignAnalytics {
  campaign_id: string;
  period: {
    start: Date;
    end: Date;
  };
  mentions: {
    total: number;
    by_platform: Record<Platform, number>;
    by_sentiment: Record<SentimentType, number>;
    by_intent: Record<IntentType, number>;
    avg_opportunity_score: number;
  };
  outreach: {
    total_sent: number;
    pending_approval: number;
    response_rate: number;
    conversion_rate: number;
    by_channel: Record<string, number>;
  };
  top_keywords: Array<{ keyword: string; count: number }>;
  top_authors: Array<{ username: string; mentions: number }>;
}

export interface AIAnalysisResult {
  sentiment: SentimentType;
  sentiment_score: number;
  relevance_score: number;
  opportunity_score: number;
  intent: IntentType;
  reasoning: string;
  suggested_response?: string;
}

export interface PlatformCredentials {
  twitter?: {
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
    accessToken?: string;
    accessTokenSecret?: string;
  };
  linkedin?: {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
  };
  reddit?: {
    clientId: string;
    clientSecret: string;
    username?: string;
    password?: string;
  };
  facebook?: {
    appId: string;
    appSecret: string;
    accessToken?: string;
  };
}
