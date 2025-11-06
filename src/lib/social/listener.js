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

          // ========================================================================
    // SUPER-EFFICIENT BATCH ANALYSIS (98% COST REDUCTION!)
    // Analyzes ALL mentions in batch instead of one-by-one
    // ========================================================================
    console.log(`Analyzing ${allMentions.length} mentions with AI (batch mode)...`);
    
    const batchAnalysisResults = await this.analyzer.analyzeMentionsBatch(
      allMentions,
      campaignContext
    );

    // Combine mentions with their analysis results
    const 112
      = allMentions.map((mention, index) => {
      const analysis = batchAnalysisResults[index] || {};
      
      const enrichedMention = {
        ...mention,
        ...analysis,
        campaign_id: campaignId,
        // Add lead quality score for premium features
        leadQualityScore: this.analyzer.calculateLeadQualityScore(
          mention,
          analysis,
          campaign.industry || 'general'
        )
      };

      // Check if passes filters
      return enrichedMention;
    });

    // Filter mentions that pass campaign filters
    const filteredMentions = analyzedMentions.filter(mention =>
      this.analyzer.matchesFilters(mention, campaign.filters)
    );}

      // Save mentions to database
      const savedMentions = await this.saveMentions(filteredMentions);

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

    filteredMentions
