/**
 * Product-Buyer Matching Engine
 * Matches social mentions (buyer signals) with seller products/solutions
 */

import { createClient } from '@supabase/supabase-js';

export class ProductMatcher {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Find all products that match a given mention
   * @param {Object} mention - Social media mention object
   * @param {string} campaignId - Optional campaign ID to filter products
   * @returns {Promise<Array>} Array of matching products with match scores
   */
  async findMatchingProducts(mention, campaignId = null) {
    try {
      // Get all active products for the campaign owner
      let query = this.supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Filter by campaign if provided
      if (campaignId) {
        const { data: campaign } = await this.supabase
          .from('listening_campaigns')
          .select('user_id')
          .eq('id', campaignId)
          .single();

        if (campaign) {
          query = query.eq('seller_id', campaign.user_id);
        }
      }

      const { data: products, error } = await query;

      if (error || !products || products.length === 0) {
        return [];
      }

      // Score each product against the mention
      const matchedProducts = [];

      for (const product of products) {
        const matchResult = this.scoreProductMatch(mention, product);

        if (matchResult.isMatch) {
          matchedProducts.push({
            ...product,
            matchScore: matchResult.matchScore,
            matchedKeywords: matchResult.matchedKeywords,
            matchReason: matchResult.reason
          });
        }
      }

      // Sort by match score (highest first)
      matchedProducts.sort((a, b) => b.matchScore - a.matchScore);

      // Check rate limits and filter out products that have reached their daily limit
      const productsWithinLimits = [];
      for (const product of matchedProducts) {
        const withinLimit = await this.checkRateLimit(product.id, product.max_offers_per_day);
        if (withinLimit) {
          productsWithinLimits.push(product);
        }
      }

      return productsWithinLimits;
    } catch (error) {
      console.error('Error finding matching products:', error);
      return [];
    }
  }

  /**
   * Score how well a product matches a mention
   * @param {Object} mention - Social media mention
   * @param {Object} product - Product object
   * @returns {Object} Match result with score and details
   */
  scoreProductMatch(mention, product) {
    const contentLower = mention.content.toLowerCase();
    let matchScore = 0;
    const matchedKeywords = [];
    const reasons = [];

    // 1. Keyword Matching (0-40 points)
    const keywordScore = this.scoreKeywordMatch(
      contentLower,
      product.matching_keywords || [],
      product.exclude_keywords || []
    );
    matchScore += keywordScore.score;
    matchedKeywords.push(...keywordScore.matchedKeywords);
    if (keywordScore.hasExcludes) {
      return { isMatch: false, matchScore: 0, matchedKeywords: [], reason: 'Contains excluded keywords' };
    }
    if (keywordScore.score > 0) {
      reasons.push(`Matched ${keywordScore.matchedKeywords.length} keywords`);
    }

    // 2. Sentiment Matching (0-20 points)
    if (product.target_sentiment && product.target_sentiment.includes(mention.sentiment)) {
      matchScore += 20;
      reasons.push(`Sentiment match (${mention.sentiment})`);
    } else if (product.target_sentiment && product.target_sentiment.length > 0) {
      // Wrong sentiment - reduce score
      matchScore -= 10;
      reasons.push(`Sentiment mismatch (wanted ${product.target_sentiment.join('/')}, got ${mention.sentiment})`);
    }

    // 3. Intent Matching (0-20 points)
    if (product.target_intent && product.target_intent.includes(mention.intent)) {
      matchScore += 20;
      reasons.push(`Intent match (${mention.intent})`);
    }

    // 4. Opportunity Score Threshold (0-20 points)
    if (mention.opportunity_score >= product.min_opportunity_score) {
      const opportunityBonus = Math.min((mention.opportunity_score - product.min_opportunity_score) / 5, 20);
      matchScore += opportunityBonus;
      reasons.push(`High opportunity score (${mention.opportunity_score})`);
    } else {
      // Below minimum opportunity score - not a match
      return {
        isMatch: false,
        matchScore: 0,
        matchedKeywords: [],
        reason: `Opportunity score too low (${mention.opportunity_score} < ${product.min_opportunity_score})`
      };
    }

    // Must have matched at least one keyword
    if (matchedKeywords.length === 0) {
      return {
        isMatch: false,
        matchScore: 0,
        matchedKeywords: [],
        reason: 'No matching keywords'
      };
    }

    // Cap score at 100
    matchScore = Math.min(matchScore, 100);

    return {
      isMatch: matchScore >= 30, // Minimum 30% match required
      matchScore: Math.round(matchScore),
      matchedKeywords,
      reason: reasons.join('; ')
    };
  }

  /**
   * Score keyword matching
   * @returns {Object} Keyword match result
   */
  scoreKeywordMatch(content, matchingKeywords, excludeKeywords) {
    const matchedKeywords = [];
    let score = 0;

    // Check exclude keywords first (disqualifying)
    for (const keyword of excludeKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        return { score: 0, matchedKeywords: [], hasExcludes: true };
      }
    }

    // Check matching keywords
    for (const keyword of matchingKeywords) {
      if (content.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        // Each keyword match is worth up to 10 points (max 40 for 4+ keywords)
        score += 10;
      }
    }

    return {
      score: Math.min(score, 40), // Cap at 40 points
      matchedKeywords,
      hasExcludes: false
    };
  }

  /**
   * Check if product has reached its daily rate limit
   * @param {string} productId - Product ID
   * @param {number} maxPerDay - Maximum offers per day
   * @returns {Promise<boolean>} Whether product is within rate limit
   */
  async checkRateLimit(productId, maxPerDay) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count outreach messages sent for this product today
      const { data, error } = await this.supabase
        .from('outreach_messages')
        .select('id')
        .eq('product_id', productId)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error checking rate limit:', error);
        return false;
      }

      const todayCount = data?.length || 0;
      return todayCount < maxPerDay;
    } catch (error) {
      console.error('Error in checkRateLimit:', error);
      return false;
    }
  }

  /**
   * Record a product-mention match in the database
   * @param {string} productId - Product ID
   * @param {string} mentionId - Mention ID
   * @param {number} matchScore - Match score (0-100)
   * @param {Array} matchedKeywords - Matched keywords
   * @returns {Promise<Object>} Created match record
   */
  async recordMatch(productId, mentionId, matchScore, matchedKeywords) {
    try {
      const { data, error } = await this.supabase
        .from('product_mention_matches')
        .insert({
          product_id: productId,
          mention_id: mentionId,
          match_score: matchScore,
          matched_keywords: matchedKeywords,
          outreach_created: false
        })
        .select()
        .single();

      if (error) {
        // Ignore duplicate errors
        if (error.code === '23505') {
          console.log('Match already recorded:', productId, mentionId);
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error recording match:', error);
      return null;
    }
  }

  /**
   * Get the best matching product for a mention
   * @param {Object} mention - Social media mention
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object|null>} Best matching product or null
   */
  async getBestProduct(mention, campaignId = null) {
    const matches = await this.findMatchingProducts(mention, campaignId);

    if (matches.length === 0) {
      return null;
    }

    // If multiple products from same campaign, check priority
    if (campaignId) {
      const withPriority = await this.addCampaignPriority(matches, campaignId);
      withPriority.sort((a, b) => {
        // First by priority (higher is better)
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // Then by match score
        return b.matchScore - a.matchScore;
      });
      return withPriority[0];
    }

    // Return highest scoring product
    return matches[0];
  }

  /**
   * Add campaign priority to product matches
   * @param {Array} products - Product matches
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Array>} Products with priority added
   */
  async addCampaignPriority(products, campaignId) {
    const productIds = products.map(p => p.id);

    const { data: campaignLinks } = await this.supabase
      .from('product_campaigns')
      .select('product_id, priority')
      .eq('campaign_id', campaignId)
      .in('product_id', productIds);

    const priorityMap = {};
    campaignLinks?.forEach(link => {
      priorityMap[link.product_id] = link.priority || 1;
    });

    return products.map(product => ({
      ...product,
      priority: priorityMap[product.id] || 1
    }));
  }

  /**
   * Find all mentions that match a specific product
   * @param {string} productId - Product ID
   * @param {number} limit - Maximum number of mentions to return
   * @returns {Promise<Array>} Array of matching mentions
   */
  async findMentionsForProduct(productId, limit = 50) {
    try {
      // Get product details
      const { data: product, error: productError } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        return [];
      }

      // Get campaigns this product is linked to
      const { data: campaignLinks } = await this.supabase
        .from('product_campaigns')
        .select('campaign_id')
        .eq('product_id', productId);

      const campaignIds = campaignLinks?.map(cl => cl.campaign_id) || [];

      if (campaignIds.length === 0) {
        return [];
      }

      // Get recent mentions from these campaigns
      const { data: mentions, error: mentionsError } = await this.supabase
        .from('social_mentions')
        .select('*')
        .in('campaign_id', campaignIds)
        .gte('opportunity_score', product.min_opportunity_score)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (mentionsError) {
        console.error('Error fetching mentions:', mentionsError);
        return [];
      }

      // Score and filter mentions
      const matchedMentions = [];
      for (const mention of mentions || []) {
        const matchResult = this.scoreProductMatch(mention, product);
        if (matchResult.isMatch) {
          matchedMentions.push({
            ...mention,
            matchScore: matchResult.matchScore,
            matchedKeywords: matchResult.matchedKeywords
          });
        }
      }

      return matchedMentions.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error finding mentions for product:', error);
      return [];
    }
  }

  /**
   * Batch process mentions to find and record product matches
   * @param {Array} mentions - Array of mentions
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<Object>} Summary of matches created
   */
  async batchMatchMentions(mentions, campaignId) {
    const results = {
      totalMentions: mentions.length,
      totalMatches: 0,
      matchesByProduct: {},
      errors: []
    };

    for (const mention of mentions) {
      try {
        const matches = await this.findMatchingProducts(mention, campaignId);

        for (const match of matches) {
          const recorded = await this.recordMatch(
            match.id,
            mention.id,
            match.matchScore,
            match.matchedKeywords
          );

          if (recorded) {
            results.totalMatches++;
            results.matchesByProduct[match.id] = (results.matchesByProduct[match.id] || 0) + 1;
          }
        }
      } catch (error) {
        results.errors.push({
          mentionId: mention.id,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get product match statistics
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Match statistics
   */
  async getProductMatchStats(productId) {
    try {
      const { data: matches, error } = await this.supabase
        .from('product_mention_matches')
        .select('*')
        .eq('product_id', productId);

      if (error) {
        throw error;
      }

      const totalMatches = matches?.length || 0;
      const outreachCreated = matches?.filter(m => m.outreach_created).length || 0;
      const avgMatchScore = totalMatches > 0
        ? matches.reduce((sum, m) => sum + m.match_score, 0) / totalMatches
        : 0;

      // Get unique keywords matched
      const allKeywords = matches?.flatMap(m => m.matched_keywords || []) || [];
      const uniqueKeywords = [...new Set(allKeywords)];

      return {
        totalMatches,
        outreachCreated,
        conversionRate: totalMatches > 0 ? (outreachCreated / totalMatches * 100).toFixed(2) : 0,
        avgMatchScore: Math.round(avgMatchScore),
        topKeywords: this.getTopKeywords(allKeywords)
      };
    } catch (error) {
      console.error('Error getting product match stats:', error);
      return {
        totalMatches: 0,
        outreachCreated: 0,
        conversionRate: 0,
        avgMatchScore: 0,
        topKeywords: []
      };
    }
  }

  /**
   * Get top keywords by frequency
   */
  getTopKeywords(keywords) {
    const frequency = {};
    keywords.forEach(kw => {
      frequency[kw] = (frequency[kw] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
  }
}

export default ProductMatcher;
