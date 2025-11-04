// Core Social Media Listening Engine
import { TwitterClient } from './twitter-client.js';
import { RedditClient } from './reddit-client.js';
import { LinkedInClient } from './linkedin-client.js';
import { SocialAnalyzer } from './analyzer.js';
import { Pool } from 'pg';

export class SocialListener {
  constructor(dbPool, anthropicApiKey) {
    this.db = dbPool;
    this.analyzer = new SocialAnalyzer(anthropicApiKey);
    this.clients = {};
  }

  /**
   * Initialize platform clients with credentials
   * @param {Object} credentials - Platform credentials
   */
  initializeClients(credentials) {
    if (credentials.twitter) {
      this.clients.twitter = new TwitterClient(credentials.twitter);
    }
    if (credentials.reddit) {
      this.clients.reddit = new RedditClient(credentials.reddit);
    }
    if (credentials.linkedin) {
      this.clients.linkedin = new LinkedInClient(credentials.linkedin);
    }
  }

  /**
   * Run listening job for a specific campaign
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Job results
   */
  async runListeningJob(campaignId) {
    try {
      // Fetch campaign details
      const campaign = await this.getCampaign(campaignId);

      if (!campaign || campaign.status !== 'active') {
        return { success: false, message: 'Campaign not active' };
      }

      // Get credentials for this user
      const credentials = await this.getUserCredentials(campaign.user_id);
      this.initializeClients(credentials);

      const allMentions = [];
      const errors = [];

      // Listen on each platform
      for (const platform of campaign.platforms) {
        try {
          const mentions = await this.listenOnPlatform(
            platform,
            campaign.keywords,
            campaign.hashtags,
            campaign.accounts_to_monitor,
            campaign.filters
          );
          allMentions.push(...mentions);
        } catch (error) {
          console.error(`Error listening on ${platform}:`, error);
          errors.push({ platform, error: error.message });
        }
      }

      // Analyze mentions with AI
      const campaignContext = {
        keywords: campaign.keywords,
        productInfo: campaign.description || '',
      };

      const analyzedMentions = [];
      for (const mention of allMentions) {
        const analysis = await this.analyzer.analyzeMention(mention, campaignContext);

        const enrichedMention = {
          ...mention,
          ...analysis,
          campaign_id: campaignId,
        };

        // Check if passes filters
        if (this.analyzer.matchesFilters(enrichedMention, campaign.filters)) {
          analyzedMentions.push(enrichedMention);
        }
      }

      // Save mentions to database
      const savedMentions = await this.saveMentions(analyzedMentions);

      // Update campaign last_run_at
      await this.updateCampaignLastRun(campaignId);

      // Check outreach rules
      await this.processOutreachRules(campaignId, savedMentions);

      return {
        success: true,
        campaignId,
        mentionsFound: allMentions.length,
        mentionsSaved: savedMentions.length,
        errors: errors.length > 0 ? errors : null,
      };
    } catch (error) {
      console.error('Listening job error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Listen on a specific platform
   */
  async listenOnPlatform(platform, keywords, hashtags = [], accounts = [], filters = {}) {
    const client = this.clients[platform];

    if (!client) {
      throw new Error(`No client initialized for ${platform}`);
    }

    const mentions = [];

    // Search by keywords and hashtags
    const searchTerms = [...keywords, ...(hashtags.map(h => `#${h}`) || [])];

    if (searchTerms.length > 0) {
      try {
        const searchResults = await client.searchPosts(searchTerms, {
          language: filters.languages?.[0],
          excludeKeywords: filters.exclude_keywords,
          limit: 100,
        });
        mentions.push(...searchResults);
      } catch (error) {
        console.error(`${platform} search error:`, error.message);
      }
    }

    // Monitor specific accounts
    if (accounts && accounts.length > 0) {
      try {
        const accountResults = await client.getUserTweets?.(accounts) ||
                               await client.getSubredditPosts?.(accounts) ||
                               [];
        mentions.push(...accountResults);
      } catch (error) {
        console.error(`${platform} account monitoring error:`, error.message);
      }
    }

    return mentions;
  }

  /**
   * Get campaign from database
   */
  async getCampaign(campaignId) {
    const result = await this.db.query(
      'SELECT * FROM listening_campaigns WHERE id = $1',
      [campaignId]
    );
    return result.rows[0];
  }

  /**
   * Get user credentials for platforms
   */
  async getUserCredentials(userId) {
    const result = await this.db.query(
      'SELECT platform, credentials FROM platform_credentials WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const credentials = {};
    result.rows.forEach(row => {
      credentials[row.platform] = row.credentials;
    });

    return credentials;
  }

  /**
   * Save mentions to database
   */
  async saveMentions(mentions) {
    const saved = [];

    for (const mention of mentions) {
      try {
        const result = await this.db.query(`
          INSERT INTO social_mentions (
            campaign_id, platform, platform_post_id, content,
            author_username, author_display_name, author_profile_url, author_follower_count,
            post_url, engagement, sentiment, sentiment_score,
            relevance_score, opportunity_score, intent,
            post_created_at, keywords_matched, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (platform, platform_post_id) DO UPDATE SET
            relevance_score = EXCLUDED.relevance_score,
            opportunity_score = EXCLUDED.opportunity_score,
            sentiment = EXCLUDED.sentiment,
            sentiment_score = EXCLUDED.sentiment_score
          RETURNING id
        `, [
          mention.campaign_id,
          mention.platform,
          mention.platformPostId,
          mention.content,
          mention.authorUsername,
          mention.authorDisplayName,
          mention.authorProfileUrl,
          mention.authorFollowerCount || 0,
          mention.postUrl,
          JSON.stringify(mention.engagement),
          mention.sentiment,
          mention.sentimentScore,
          mention.relevanceScore,
          mention.opportunityScore,
          mention.intent,
          mention.postCreatedAt,
          mention.keywordsMatched || [],
          JSON.stringify(mention.metadata || {})
        ]);

        saved.push({ ...mention, id: result.rows[0].id });
      } catch (error) {
        console.error('Error saving mention:', error);
      }
    }

    return saved;
  }

  /**
   * Update campaign last run timestamp
   */
  async updateCampaignLastRun(campaignId) {
    await this.db.query(
      'UPDATE listening_campaigns SET last_run_at = NOW() WHERE id = $1',
      [campaignId]
    );
  }

  /**
   * Process outreach rules for new mentions
   */
  async processOutreachRules(campaignId, mentions) {
    // Get active outreach rules for this campaign
    const rulesResult = await this.db.query(
      'SELECT * FROM outreach_rules WHERE campaign_id = $1 AND is_active = true',
      [campaignId]
    );

    const rules = rulesResult.rows;

    for (const mention of mentions) {
      for (const rule of rules) {
        if (this.mentionMatchesRule(mention, rule)) {
          await this.createOutreachMessage(mention, rule);
        }
      }
    }
  }

  /**
   * Check if mention matches outreach rule triggers
   */
  mentionMatchesRule(mention, rule) {
    const triggers = rule.triggers;

    // Check opportunity score
    if (triggers.min_opportunity_score && mention.opportunityScore < triggers.min_opportunity_score) {
      return false;
    }

    // Check relevance score
    if (triggers.min_relevance_score && mention.relevanceScore < triggers.min_relevance_score) {
      return false;
    }

    // Check sentiment
    if (triggers.sentiment && triggers.sentiment.length > 0) {
      if (!triggers.sentiment.includes(mention.sentiment)) {
        return false;
      }
    }

    // Check intent
    if (triggers.intent && triggers.intent.length > 0) {
      if (!triggers.intent.includes(mention.intent)) {
        return false;
      }
    }

    // Check follower count
    if (triggers.min_follower_count && mention.authorFollowerCount < triggers.min_follower_count) {
      return false;
    }

    // Check platforms
    if (triggers.platforms && triggers.platforms.length > 0) {
      if (!triggers.platforms.includes(mention.platform)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create outreach message for a mention
   */
  async createOutreachMessage(mention, rule) {
    try {
      // Check rate limits
      const canSend = await this.checkRateLimit(rule);
      if (!canSend) {
        console.log(`Rate limit reached for rule ${rule.id}`);
        return;
      }

      // Generate personalized message if AI personalization is enabled
      let messageContent = rule.response_template;

      if (rule.use_ai_personalization) {
        messageContent = await this.analyzer.generateOutreachMessage(
          mention,
          rule.response_template,
          { productInfo: 'Workflow Autopilot - AI-powered automation platform' }
        );
      }

      // Create outreach message record
      for (const channel of rule.channels) {
        await this.db.query(`
          INSERT INTO outreach_messages (
            mention_id, rule_id, campaign_id, status, channel,
            message_content, ai_personalization_used
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          mention.id,
          rule.id,
          rule.campaign_id,
          rule.require_approval ? 'pending_approval' : 'approved',
          JSON.stringify(channel),
          messageContent,
          rule.use_ai_personalization
        ]);
      }
    } catch (error) {
      console.error('Error creating outreach message:', error);
    }
  }

  /**
   * Check rate limits for outreach
   */
  async checkRateLimit(rule) {
    const { max_per_hour, max_per_day } = rule.rate_limit;

    // Check hourly limit
    const hourResult = await this.db.query(`
      SELECT COUNT(*) as count FROM outreach_messages
      WHERE rule_id = $1 AND status = 'sent'
        AND sent_at > NOW() - INTERVAL '1 hour'
    `, [rule.id]);

    if (parseInt(hourResult.rows[0].count) >= max_per_hour) {
      return false;
    }

    // Check daily limit
    const dayResult = await this.db.query(`
      SELECT COUNT(*) as count FROM outreach_messages
      WHERE rule_id = $1 AND status = 'sent'
        AND sent_at > NOW() - INTERVAL '1 day'
    `, [rule.id]);

    if (parseInt(dayResult.rows[0].count) >= max_per_day) {
      return false;
    }

    return true;
  }

  /**
   * Run listening jobs for all active campaigns
   */
  async runAllActiveCampaigns() {
    const result = await this.db.query(`
      SELECT id FROM listening_campaigns
      WHERE status = 'active'
        AND (last_run_at IS NULL OR last_run_at < NOW() - (interval_minutes || ' minutes')::INTERVAL)
    `);

    const results = [];
    for (const campaign of result.rows) {
      const jobResult = await this.runListeningJob(campaign.id);
      results.push(jobResult);
    }

    return results;
  }
}

export default SocialListener;
