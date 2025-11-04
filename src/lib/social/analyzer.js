// AI-Powered Social Media Mention Analyzer using Claude
import Anthropic from '@anthropic-ai/sdk';

export class SocialAnalyzer {
  constructor(apiKey) {
    this.anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
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
}

export default SocialAnalyzer;
