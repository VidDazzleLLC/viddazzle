/**
 * API Route: Buyer Responses List
 * Get buyer responses for user's outreach messages
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/buyer-responses - List buyer responses
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      campaign_id,
      product_id,
      is_positive,
      interest_level,
      unprocessed_only,
      limit = 50,
      offset = 0
    } = req.query;

    // Build query to get responses for user's campaigns
    let query = supabase
      .from('buyer_responses')
      .select(`
        *,
        outreach_messages (
          id,
          message_content,
          campaign_id,
          product_id
        ),
        products (
          id,
          name,
          description
        ),
        social_mentions (
          id,
          content,
          platform,
          author_username,
          opportunity_score
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // We need to filter by user's campaigns
    // First get user's campaign IDs
    const { data: campaigns } = await supabase
      .from('listening_campaigns')
      .select('id')
      .eq('user_id', user.id);

    const campaignIds = campaigns?.map(c => c.id) || [];

    if (campaignIds.length === 0) {
      return res.status(200).json({
        responses: [],
        total: 0,
        summary: {
          total_responses: 0,
          positive_responses: 0,
          high_interest: 0,
          pending_follow_up: 0
        }
      });
    }

    // Apply filters
    if (campaign_id) {
      query = query.eq('outreach_messages.campaign_id', campaign_id);
    }

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (is_positive === 'true') {
      query = query.eq('is_positive_response', true);
    }

    if (interest_level) {
      query = query.eq('buyer_interest_level', interest_level);
    }

    if (unprocessed_only === 'true') {
      query = query.eq('next_outreach_sent', false);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching responses:', error);
      return res.status(500).json({ error: error.message });
    }

    // Filter to only include responses from user's campaigns
    const userResponses = responses?.filter(r =>
      r.outreach_messages && campaignIds.includes(r.outreach_messages.campaign_id)
    ) || [];

    // Calculate summary stats
    const summary = {
      total_responses: userResponses.length,
      positive_responses: userResponses.filter(r => r.is_positive_response).length,
      high_interest: userResponses.filter(r => r.buyer_interest_level === 'high').length,
      pending_follow_up: userResponses.filter(r => r.is_positive_response && !r.next_outreach_sent).length,
      by_sentiment: {
        positive: userResponses.filter(r => r.sentiment === 'positive').length,
        neutral: userResponses.filter(r => r.sentiment === 'neutral').length,
        negative: userResponses.filter(r => r.sentiment === 'negative').length,
        mixed: userResponses.filter(r => r.sentiment === 'mixed').length
      },
      by_interest: {
        high: userResponses.filter(r => r.buyer_interest_level === 'high').length,
        medium: userResponses.filter(r => r.buyer_interest_level === 'medium').length,
        low: userResponses.filter(r => r.buyer_interest_level === 'low').length,
        none: userResponses.filter(r => r.buyer_interest_level === 'none').length
      }
    };

    return res.status(200).json({
      responses: userResponses,
      total: userResponses.length,
      summary
    });

  } catch (error) {
    console.error('Error in buyer responses API:', error);
    return res.status(500).json({ error: error.message });
  }
}
