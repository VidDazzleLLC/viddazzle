// AI-Powered Social Media Mention Analyzer using Claude
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export class SocialAnalyzer {
  constructor(apiKey, supabaseUrl, supabaseKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });

    // Initialize Supabase client for accessing trigger words
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Cache trigger words for performance
    this.triggerWordsCache = null;
    this.triggerWordsCacheTime = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Analyze a social media mention using AI
   * @param {Object} mention - Social media mention object
   * @param {Object} campaignContext - Campaign context (keywords, goals, etc.)
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeMention(mention, campaignContext = {}) {
    try {
      const prompt = this.buildAnalysisPrompt(mention, campaignContext);

      const message = await this.anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const response = message.content[0].text;
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis error:', error);
      // Return default analysis on error
      return {
        sentiment: 'neutral',
        sentimentScore: 0,
        relevanceScore: 50,
        opportunityScore: 30,
        intent: 'informational',
        reasoning: 'Unable to analyze with AI, using default values.',
      };
    }
  }

  /**
   * Generate a personalized outreach message using AI
   * @param {Object} mention - Social media mention object
   * @param {string} template - Response template
   * @param {Object} context - Additional context
   * @returns {Promise<string>} Generated message
   */
  async generateOutreachMessage(mention, template, context = {}) {
    try {
      const prompt = this.buildOutreachPrompt(mention, template, context);

      const message = await this.anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].text.trim();
    } catch (error) {
      console.error('AI message generation error:', error);
      // Return template as fallback
      return template;
    }
  }

  /**
   * Build analysis prompt for Claude
   */
  buildAnalysisPrompt(mention, campaignContext) {
    const { keywords = [], productInfo = '', brandVoice = '' } = campaignContext;

    return `Analyze this social media post and provide structured analysis:

Platform: ${mention.platform}
Author: ${mention.authorUsername} (${mention.authorFollowerCount || 0} followers)
Post: "${mention.content}"
Post URL: ${mention.postUrl}
Engagement: ${mention.engagement.likes} likes, ${mention.engagement.comments} comments, ${mention.engagement.shares} shares

Campaign Keywords: ${keywords.join(', ')}
${productInfo ? `Product/Service Info: ${productInfo}` : ''}
${brandVoice ? `Brand Voice: ${brandVoice}` : ''}

Please analyze and respond in JSON format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "sentimentScore": <number from -1.0 to 1.0>,
  "relevanceScore": <number from 0 to 100 - how relevant is this to the campaign>,
  "opportunityScore": <number from 0 to 100 - likelihood of conversion/engagement>,
  "intent": "informational|purchase_intent|complaint|question|recommendation|comparison|feedback",
  "reasoning": "<brief explanation of your analysis>",
  "suggestedResponse": "<optional: if opportunity score > 70, suggest a personalized response>"
}

Analysis:`;
  }

  /**
   * Build outreach message generation prompt
   */
  buildOutreachPrompt(mention, template, context) {
    const { productInfo = '', brandVoice = '', companyName = 'our company' } = context;

    return `Generate a personalized outreach message for this social media post:

Platform: ${mention.platform}
Author: ${mention.authorUsername}
Post: "${mention.content}"
Sentiment: ${mention.sentiment}
Intent: ${mention.intent}

Template to personalize:
"${template}"

Context:
${productInfo ? `Product/Service: ${productInfo}` : ''}
${brandVoice ? `Brand Voice: ${brandVoice}` : ''}
Company: ${companyName}

Guidelines:
- Keep it natural and conversational
- Match the platform's tone (Twitter: casual, LinkedIn: professional, Reddit: authentic)
- Reference specific parts of their post to show you read it
- Don't be overly salesy
- Keep it concise (under 280 chars for Twitter)
- Be helpful and add value
- Include relevant hashtags if appropriate for the platform

Personalized message:`;
  }

  /**
   * Parse AI analysis response
   */
  parseAnalysisResponse(response) {
    try {
      // Try to parse as JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          sentimentScore: parsed.sentimentScore || 0,
          relevanceScore: parsed.relevanceScore || 50,
          opportunityScore: parsed.opportunityScore || 30,
          intent: parsed.intent || 'informational',
          reasoning: parsed.reasoning || '',
          suggestedResponse: parsed.suggestedResponse,
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
    }

    // Fallback: try to extract from text
    return this.extractFromText(response);
  }

  /**
   * Extract analysis from unstructured text (fallback)
   */
  extractFromText(text) {
    const result = {
      sentiment: 'neutral',
      sentimentScore: 0,
      relevanceScore: 50,
      opportunityScore: 30,
      intent: 'informational',
      reasoning: text,
    };

    // Try to extract sentiment
    if (/positive/i.test(text)) result.sentiment = 'positive';
    else if (/negative/i.test(text)) result.sentiment = 'negative';
    else if (/mixed/i.test(text)) result.sentiment = 'mixed';

    // Try to extract scores
    const scoreMatch = text.match(/(\d+)\/100/g);
    if (scoreMatch && scoreMatch.length >= 2) {
      result.relevanceScore = parseInt(scoreMatch[0]);
      result.opportunityScore = parseInt(scoreMatch[1]);
    }

    // Try to extract intent
    if (/purchase|buy|looking for/i.test(text)) result.intent = 'purchase_intent';
    else if (/question|how to|help me/i.test(text)) result.intent = 'question';
    else if (/complaint|issue|problem/i.test(text)) result.intent = 'complaint';
    else if (/recommend/i.test(text)) result.intent = 'recommendation';
    else if (/compare|vs|versus/i.test(text)) result.intent = 'comparison';

    return result;
  }

  /**
   * Batch analyze multiple mentions
   * @param {Array} mentions - Array of mentions
   * @param {Object} campaignContext - Campaign context
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeBatch(mentions, campaignContext = {}) {
    const results = [];

    // Process in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < mentions.length; i += batchSize) {
      const batch = mentions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(mention => this.analyzeMention(mention, campaignContext))
      );
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < mentions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Calculate engagement score
   * @param {Object} mention - Social media mention
   * @returns {number} Engagement score 0-100
   */
  calculateEngagementScore(mention) {
    const { likes, comments, shares, views } = mention.engagement;

    // Weighted engagement calculation
    const engagementPoints = (
      (likes || 0) * 1 +
      (comments || 0) * 3 +
      (shares || 0) * 5
    );

    // Normalize based on platform and follower count
    const followerCount = mention.authorFollowerCount || 1;
    const engagementRate = engagementPoints / followerCount;

    // Platform-specific benchmarks
    const platformBenchmarks = {
      twitter: 0.05, // 5% engagement rate is good
      linkedin: 0.02, // 2% is good
      reddit: 0.10, // 10% is good
      facebook: 0.03, // 3% is good
    };

    const benchmark = platformBenchmarks[mention.platform] || 0.05;
    const score = Math.min((engagementRate / benchmark) * 50, 100);

    return Math.round(score);
  }

  /**
   * Check if mention matches campaign filters
   * @param {Object} mention - Social media mention
   * @param {Object} filters - Campaign filters
   * @returns {boolean} Whether mention passes filters
   */
  matchesFilters(mention, filters = {}) {
    const {
      min_followers,
      min_engagement,
      languages,
      locations,
      exclude_keywords,
      sentiment_filter,
    } = filters;

    // Check follower count
    if (min_followers && mention.authorFollowerCount < min_followers) {
      return false;
    }

    // Check engagement
    if (min_engagement) {
      const engagementScore = this.calculateEngagementScore(mention);
      if (engagementScore < min_engagement) {
        return false;
      }
    }

    // Check excluded keywords
    if (exclude_keywords && exclude_keywords.length > 0) {
      const contentLower = mention.content.toLowerCase();
      if (exclude_keywords.some(keyword => contentLower.includes(keyword.toLowerCase()))) {
        return false;
      }
    }

    // Check sentiment filter
    if (sentiment_filter && sentiment_filter.length > 0) {
      if (!sentiment_filter.includes(mention.sentiment)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Load trigger words from database with caching
   * @param {string} userId - Optional user ID to include user-specific triggers
   * @returns {Promise<Array>} Array of trigger words
   */
  async loadTriggerWords(userId = null) {
    // Check cache
    const now = Date.now();
    if (this.triggerWordsCache && this.triggerWordsCacheTime &&
        (now - this.triggerWordsCacheTime) < this.CACHE_DURATION) {
      return this.triggerWordsCache;
    }

    try {
      let query = this.supabase
        .from('positive_trigger_words')
        .select('*')
        .eq('is_active', true);

      // Include system defaults + user's custom triggers
      if (userId) {
        query = query.or(`is_system_default.eq.true,user_id.eq.${userId}`);
      } else {
        query = query.eq('is_system_default', true);
      }

      const { data: triggers, error } = await query;

      if (error) {
        console.error('Error loading trigger words:', error);
        return [];
      }

      // Update cache
      this.triggerWordsCache = triggers || [];
      this.triggerWordsCacheTime = now;

      return this.triggerWordsCache;
    } catch (error) {
      console.error('Error loading trigger words:', error);
      return [];
    }
  }

  /**
   * Check if text matches a trigger word based on match type
   * @param {string} text - Text to check
   * @param {Object} trigger - Trigger word object
   * @returns {boolean} Whether text matches the trigger
   */
  matchesTriggerWord(text, trigger) {
    const content = trigger.case_sensitive ? text : text.toLowerCase();
    const phrase = trigger.case_sensitive ? trigger.trigger_phrase : trigger.trigger_phrase.toLowerCase();

    switch (trigger.match_type) {
      case 'exact':
        return content === phrase;

      case 'contains':
        return content.includes(phrase);

      case 'regex':
        try {
          const regex = new RegExp(phrase, trigger.case_sensitive ? '' : 'i');
          return regex.test(text);
        } catch (error) {
          console.error('Invalid regex pattern:', phrase, error);
          return false;
        }

      case 'fuzzy':
        // Simple fuzzy matching using Levenshtein-like approach
        return this.fuzzyMatch(content, phrase);

      default:
        return false;
    }
  }

  /**
   * Simple fuzzy matching (Levenshtein distance based)
   * @param {string} text - Text to search in
   * @param {string} pattern - Pattern to search for
   * @returns {boolean} Whether pattern fuzzy matches text
   */
  fuzzyMatch(text, pattern) {
    // Check if pattern appears with up to 2 character differences
    const words = text.split(/\s+/);
    for (const word of words) {
      if (this.levenshteinDistance(word, pattern) <= 2) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Detect positive trigger words in text
   * @param {string} text - Text to analyze (buyer response)
   * @param {string} userId - Optional user ID for custom triggers
   * @returns {Promise<Object>} Detection result with triggers found and confidence boost
   */
  async detectPositiveTriggers(text, userId = null) {
    if (!text || text.trim().length === 0) {
      return {
        hasPositiveTriggers: false,
        detectedTriggers: [],
        totalConfidenceBoost: 0,
        triggerTypes: []
      };
    }

    const triggers = await this.loadTriggerWords(userId);
    const detectedTriggers = [];
    let totalBoost = 0;

    for (const trigger of triggers) {
      if (this.matchesTriggerWord(text, trigger)) {
        detectedTriggers.push({
          id: trigger.id,
          phrase: trigger.trigger_phrase,
          type: trigger.trigger_type,
          confidence_boost: trigger.confidence_boost,
          match_type: trigger.match_type
        });
        totalBoost += trigger.confidence_boost;
      }
    }

    // Extract unique trigger types
    const triggerTypes = [...new Set(detectedTriggers.map(t => t.type))];

    return {
      hasPositiveTriggers: detectedTriggers.length > 0,
      detectedTriggers,
      totalConfidenceBoost: Math.min(totalBoost, 50), // Cap at 50
      triggerTypes,
      isPurchaseIntent: triggerTypes.includes('purchase_intent'),
      isConfirmation: triggerTypes.includes('confirmation'),
      isRequestInfo: triggerTypes.includes('request_info')
    };
  }

  /**
   * Analyze a buyer response to an outreach message
   * @param {Object} response - Response object with content
   * @param {Object} originalMention - Original mention that triggered outreach
   * @param {string} userId - User ID for custom triggers
   * @returns {Promise<Object>} Complete analysis with trigger detection
   */
  async analyzeBuyerResponse(response, originalMention = {}, userId = null) {
    try {
      // First, detect positive triggers
      const triggerAnalysis = await this.detectPositiveTriggers(response.content, userId);

      // Then do AI sentiment analysis
      const prompt = this.buildResponseAnalysisPrompt(response, originalMention, triggerAnalysis);

      const message = await this.anthropic.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const aiResponse = message.content[0].text;
      const aiAnalysis = this.parseResponseAnalysis(aiResponse);

      // Combine trigger detection with AI analysis
      const baseOpportunityScore = aiAnalysis.opportunityScore || 30;
      const boostedScore = Math.min(baseOpportunityScore + triggerAnalysis.totalConfidenceBoost, 100);

      return {
        // Trigger detection results
        detectedTriggers: triggerAnalysis.detectedTriggers,
        hasPositiveTriggers: triggerAnalysis.hasPositiveTriggers,
        triggerTypes: triggerAnalysis.triggerTypes,

        // AI analysis results
        sentiment: aiAnalysis.sentiment,
        sentimentScore: aiAnalysis.sentimentScore,
        buyerInterestLevel: aiAnalysis.buyerInterestLevel,
        intent: aiAnalysis.intent,

        // Combined scoring
        baseOpportunityScore,
        confidenceBoost: triggerAnalysis.totalConfidenceBoost,
        opportunityScore: boostedScore,

        // Actionable insights
        isPositiveResponse: triggerAnalysis.hasPositiveTriggers ||
                           aiAnalysis.sentiment === 'positive' ||
                           aiAnalysis.buyerInterestLevel === 'high',
        suggestedNextAction: aiAnalysis.suggestedNextAction,
        reasoning: aiAnalysis.reasoning,

        // Flags for automation
        shouldSendProduct: triggerAnalysis.isPurchaseIntent ||
                          triggerAnalysis.isRequestInfo ||
                          aiAnalysis.buyerInterestLevel === 'high',
        requiresManualReview: aiAnalysis.sentiment === 'mixed' && !triggerAnalysis.hasPositiveTriggers
      };
    } catch (error) {
      console.error('Error analyzing buyer response:', error);
      // Return safe defaults
      return {
        detectedTriggers: [],
        hasPositiveTriggers: false,
        triggerTypes: [],
        sentiment: 'neutral',
        sentimentScore: 0,
        buyerInterestLevel: 'low',
        intent: 'informational',
        baseOpportunityScore: 30,
        confidenceBoost: 0,
        opportunityScore: 30,
        isPositiveResponse: false,
        suggestedNextAction: 'Review response manually',
        reasoning: 'Unable to analyze response with AI',
        shouldSendProduct: false,
        requiresManualReview: true
      };
    }
  }

  /**
   * Build prompt for analyzing buyer responses
   */
  buildResponseAnalysisPrompt(response, originalMention, triggerAnalysis) {
    return `Analyze this buyer's response to our outreach message:

ORIGINAL MENTION CONTEXT:
Platform: ${originalMention.platform || 'Unknown'}
Original Post: "${originalMention.content || 'N/A'}"
Original Sentiment: ${originalMention.sentiment || 'Unknown'}

BUYER'S RESPONSE:
"${response.content}"

TRIGGER WORD DETECTION:
Positive triggers detected: ${triggerAnalysis.hasPositiveTriggers ? 'YES' : 'NO'}
${triggerAnalysis.hasPositiveTriggers ? `Detected phrases: ${triggerAnalysis.detectedTriggers.map(t => t.phrase).join(', ')}` : ''}
${triggerAnalysis.hasPositiveTriggers ? `Trigger types: ${triggerAnalysis.triggerTypes.join(', ')}` : ''}

Please analyze and respond in JSON format:
{
  "sentiment": "positive|negative|neutral|mixed",
  "sentimentScore": <number from -1.0 to 1.0>,
  "buyerInterestLevel": "high|medium|low|none",
  "opportunityScore": <number from 0 to 100 - likelihood of conversion>,
  "intent": "purchase_intent|request_info|question|positive_feedback|negative_feedback|neutral_acknowledgment|no_interest",
  "reasoning": "<brief explanation of buyer's intent and interest level>",
  "suggestedNextAction": "<what should we do next - e.g., 'Send product details', 'Schedule call', 'Follow up in a week', 'Close conversation'>"
}

Analysis:`;
  }

  /**
   * Parse AI response analysis
   */
  parseResponseAnalysis(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sentiment: parsed.sentiment || 'neutral',
          sentimentScore: parsed.sentimentScore || 0,
          buyerInterestLevel: parsed.buyerInterestLevel || 'low',
          opportunityScore: parsed.opportunityScore || 30,
          intent: parsed.intent || 'neutral_acknowledgment',
          reasoning: parsed.reasoning || '',
          suggestedNextAction: parsed.suggestedNextAction || 'Review manually'
        };
      }
    } catch (error) {
      console.error('Failed to parse response analysis:', error);
    }

    // Fallback
    return {
      sentiment: 'neutral',
      sentimentScore: 0,
      buyerInterestLevel: 'low',
      opportunityScore: 30,
      intent: 'neutral_acknowledgment',
      reasoning: response,
      suggestedNextAction: 'Review manually'
    };
  }

  /**
   * Clear trigger words cache (useful after adding new custom triggers)
   */
  clearTriggerCache() {
    this.triggerWordsCache = null;
    this.triggerWordsCacheTime = null;
  }
}

export default SocialAnalyzer;
