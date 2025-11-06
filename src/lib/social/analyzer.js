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
  async 207
  (mentions, campaignContext = {}) {
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
207
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

  /**
   * SUPER-EFFICIENT BATCH ANALYSIS (98% Cost Reduction!)
   * Analyzes up to 50 mentions in a SINGLE API call
   * 
   * @param {Array} mentions - Array of mentions to analyze
   * @param {Object} campaignContext - Campaign context
   * @param {number} batchSize - Max mentions per batch (default: 50)
   * @returns {Promise<Array>} Array of analysis results
   */
  async analyzeMentionsBatch(mentions, campaignContext = {}, batchSize = 50) {
    if (!mentions || mentions.length === 0) {
      return [];
    }

    const allResults = [];

    // Process in chunks of batchSize
    for (let i = 0; i < mentions.length; i += batchSize) {
      const batch = mentions.slice(i, i + batchSize);
      
      try {
        // Build a single prompt that analyzes ALL mentions at once
        const batchPrompt = this.buildBatchAnalysisPrompt(batch, campaignContext);
        
        const message = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022', // Use Sonnet (80% cheaper than Opus!)
          max_tokens: 8000, // Enough for 50 analyses
          messages: [
            {
              role: 'user',
              content: batchPrompt
            }
          ]
        });

        const response = message.content[0].text;
        const batchResults = this.parseBatchAnalysisResponse(response, batch);
        allResults.push(...batchResults);

      } catch (error) {
        console.error('Batch analysis error:', error);
        // Fallback: return default analysis for this batch
        const defaultResults = batch.map(mention => ({
          sentiment: 'neutral',
          sentimentScore: 0,
          relevanceScore: 50,
          opportunityScore: 30,
          leadQualityScore: 40, // New!
          buyingIntent: 'low',
          intent: 'informational',
          reasoning: 'Batch analysis failed, using defaults'
        }));
        allResults.push(...defaultResults);
      }

      // Small delay between large batches to avoid rate limits
      if (i + batchSize < mentions.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return allResults;
  }

  /**
   * Build prompt for batch analysis (50 mentions in one prompt)
   */
  buildBatchAnalysisPrompt(mentions, campaignContext) {
    const { keywords = [], productInfo = '' } = campaignContext;

    let prompt = `You are analyzing ${mentions.length} social media mentions for a marketing campaign. Analyze each mention and provide structured data.

Campaign Keywords: ${keywords.join(', ')}
${productInfo ? `Product/Service: ${productInfo}` : ''}

MENTIONS TO ANALYZE:

`;

    mentions.forEach((mention, index) => {
      prompt += `[${index + 1}] Platform: ${mention.platform} | Author: ${mention.authorUsername} (${mention.authorFollowerCount || 0} followers)
Content: "${mention.content.substring(0, 500)}"
Engagement: ${mention.engagement.likes}♥ ${mention.engagement.comments}💬 ${mention.engagement.shares}🔁

`;
    });

    prompt += `
For EACH mention [1-${mentions.length}], provide analysis in this JSON array format:
[
  {
    "index": 1,
    "sentiment": "positive|negative|neutral|mixed",
    "sentimentScore": <-1.0 to 1.0>,
    "relevanceScore": <0-100>,
    "opportunityScore": <0-100>,
    "leadQualityScore": <0-100>,
    "buyingIntent": "high|medium|low|none",
    "intent": "purchase_intent|question|complaint|recommendation|comparison|informational",
    "reasoning": "<brief analysis>"
  },
  // ... for all ${mentions.length} mentions
]

LEAD QUALITY SCORING CRITERIA (0-100):
- 90-100: High-value lead (buying intent + budget + authority)
- 70-89: Good lead (strong interest + engagement)
- 50-69: Medium lead (relevant but passive)
- 30-49: Low lead (minimal intent)
- 0-29: Not a lead (spam, irrelevant, low engagement)

BUYING INTENT SIGNALS:
HIGH: "looking for", "need", "recommend", "vs", "which", "best", "budget", "price"
MEDIUM: "interested", "considering", "thinking about", "curious"
LOW: "cool", "nice", general discussion

Return ONLY the JSON array, no other text:`;

    return prompt;
  }

  /**
   * Parse batch analysis response
   */
  parseBatchAnalysisResponse(response, mentions) {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        const analyses = JSON.parse(jsonMatch[0]);
        
        // Map analyses back to mentions by index
        return mentions.map((mention, idx) => {
          const analysis = analyses.find(a => a.index === idx + 1) || analyses[idx];
          
          if (!analysis) {
            // Fallback if analysis missing
            return {
              sentiment: 'neutral',
              sentimentScore: 0,
              relevanceScore: 50,
              opportunityScore: 30,
              leadQualityScore: 40,
              buyingIntent: 'low',
              intent: 'informational',
              reasoning: 'Analysis missing from batch response'
            };
          }

          return {
            sentiment: analysis.sentiment || 'neutral',
            sentimentScore: analysis.sentimentScore || 0,
            relevanceScore: analysis.relevanceScore || 50,
            opportunityScore: analysis.opportunityScore || 30,
            leadQualityScore: analysis.leadQualityScore || 40,
            buyingIntent: analysis.buyingIntent || 'low',
            intent: analysis.intent || 'informational',
            reasoning: analysis.reasoning || ''
          };
        });
      }
    } catch (error) {
      console.error('Failed to parse batch response:', error);
    }

    // Fallback: return defaults
    return mentions.map(() => ({
      sentiment: 'neutral',
      sentimentScore: 0,
      relevanceScore: 50,
      opportunityScore: 30,
      leadQualityScore: 40,
      buyingIntent: 'low',
      intent: 'informational',
      reasoning: 'Failed to parse batch response'
    }));
  }

  /**
   * Calculate lead quality score based on multiple factors
   * Premium feature for high-ticket industries
   * 
   * @param {Object} mention - Social media mention
   * @param {Object} analysis - AI analysis result
   * @param {string} industry - Target industry (legal, mortgage, realestate, etc.)
   * @returns {number} Lead quality score 0-100
   */
  calculateLeadQualityScore(mention, analysis, industry = 'general') {
    let score = 0;

    // 1. BUYING INTENT (40 points max)
    const intentScores = {
      high: 40,
      medium: 25,
      low: 10,
      none: 0
    };
    score += intentScores[analysis.buyingIntent] || 0;

    // 2. ENGAGEMENT QUALITY (20 points max)
    const engagementScore = this.calculateEngagementScore(mention);
    score += Math.min(engagementScore / 5, 20); // Scale to 20 points

    // 3. AUDIENCE SIZE (15 points max)
    const followerScore = Math.min(mention.authorFollowerCount / 1000, 15);
    score += followerScore;

    // 4. SENTIMENT (10 points max)
    if (analysis.sentiment === 'positive') score += 10;
    else if (analysis.sentiment === 'neutral') score += 5;
    else if (analysis.sentiment === 'mixed') score += 3;

    // 5. RELEVANCE (15 points max)
    score += (analysis.relevanceScore / 100) * 15;

    // INDUSTRY-SPECIFIC BONUSES
    const industryBonuses = this.getIndustryBonuses(mention, analysis, industry);
    score += industryBonuses;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Industry-specific scoring bonuses
   */
  getIndustryBonuses(mention, analysis, industry) {
    let bonus = 0;
    const content = mention.content.toLowerCase();

    switch(industry) {
      case 'legal':
        // High-value keywords for lawyers
        if (/accident|injury|lawsuit|sue|lawyer|attorney/i.test(content)) bonus += 10;
        if (/settlement|compensation|damages/i.test(content)) bonus += 5;
        if (/need.*lawyer|looking for.*attorney/i.test(content)) bonus += 15;
        break;

      case 'mortgage':
        // High-value for loan officers
        if (/pre.?approved|pre.?qualification|mortgage rate/i.test(content)) bonus += 15;
        if (/refinance|first.?time.*buyer|home.*loan/i.test(content)) bonus += 10;
        if (/credit score|down payment|interest rate/i.test(content)) bonus += 5;
        break;

      case 'realestate':
        // High-value for agents
        if (/house hunting|looking.*home|want to buy/i.test(content)) bonus += 15;
        if (/realtor|real estate agent|list my house/i.test(content)) bonus += 10;
        if (/neighborhood|school district|commute/i.test(content)) bonus += 5;
        break;

      case 'roofing':
      case 'solar':
      case 'homeimprovement':
        // High-value for contractors
        if (/quote|estimate|how much|cost/i.test(content)) bonus += 15;
        if (/need.*roof|replace.*roof|leak/i.test(content)) bonus += 10;
        if (/recommend|referral|contractor/i.test(content)) bonus += 8;
        break;

      case 'plasticsurgery':
      case 'healthcare':
        // High-value for medical
        if (/consultation|surgeon|procedure|recovery/i.test(content)) bonus += 15;
        if (/before.*after|results|experience/i.test(content)) bonus += 8;
        if (/cost|price|financing|payment plan/i.test(content)) bonus += 10;
        break;

      case 'insurance':
        // High-value for agents
        if (/quote|coverage|policy|premium/i.test(content)) bonus += 15;
        if (/life insurance|health insurance|auto insurance/i.test(content)) bonus += 10;
        if (/need.*insurance|shopping for/i.test(content)) bonus += 12;
        break;

      default:
        // General scoring
        if (/price|cost|budget|afford/i.test(content)) bonus += 5;
        if (/recommend|suggest|best/i.test(content)) bonus += 3;
    }

    return Math.min(bonus, 20); // Cap bonuses at 20 points
  }
}

export default SocialAnalyzer;
