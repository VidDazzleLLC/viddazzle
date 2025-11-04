// API Route: Campaign Analytics
import { Pool } from 'pg';

const getDbPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = getDbPool();

  try {
    const { campaignId, startDate, endDate } = req.query;

    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId required' });
    }

    // Date range
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate || new Date().toISOString();

    // Get mention statistics
    const mentionsStats = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE platform = 'twitter') as twitter_count,
        COUNT(*) FILTER (WHERE platform = 'reddit') as reddit_count,
        COUNT(*) FILTER (WHERE platform = 'linkedin') as linkedin_count,
        COUNT(*) FILTER (WHERE platform = 'facebook') as facebook_count,
        COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
        COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
        COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
        COUNT(*) FILTER (WHERE sentiment = 'mixed') as mixed_count,
        COUNT(*) FILTER (WHERE intent = 'purchase_intent') as purchase_intent_count,
        COUNT(*) FILTER (WHERE intent = 'question') as question_count,
        COUNT(*) FILTER (WHERE intent = 'complaint') as complaint_count,
        AVG(opportunity_score)::DECIMAL(5,2) as avg_opportunity_score,
        AVG(relevance_score)::DECIMAL(5,2) as avg_relevance_score
       FROM social_mentions
       WHERE campaign_id = $1
         AND detected_at BETWEEN $2 AND $3`,
      [campaignId, start, end]
    );

    // Get outreach statistics
    const outreachStats = await pool.query(
      `SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_approval,
        COUNT(*) FILTER (WHERE response_received = true) as responses,
        COUNT(*) FILTER (WHERE conversion_tracked = true) as conversions
       FROM outreach_messages
       WHERE campaign_id = $1
         AND created_at BETWEEN $2 AND $3`,
      [campaignId, start, end]
    );

    // Get top keywords
    const topKeywords = await pool.query(
      `SELECT keyword, COUNT(*) as count
       FROM social_mentions, unnest(keywords_matched) as keyword
       WHERE campaign_id = $1
         AND detected_at BETWEEN $2 AND $3
       GROUP BY keyword
       ORDER BY count DESC
       LIMIT 10`,
      [campaignId, start, end]
    );

    // Get top authors
    const topAuthors = await pool.query(
      `SELECT author_username, COUNT(*) as mentions
       FROM social_mentions
       WHERE campaign_id = $1
         AND detected_at BETWEEN $2 AND $3
       GROUP BY author_username
       ORDER BY mentions DESC
       LIMIT 10`,
      [campaignId, start, end]
    );

    // Get daily trend
    const dailyTrend = await pool.query(
      `SELECT
        DATE(detected_at) as date,
        COUNT(*) as mentions,
        AVG(opportunity_score)::DECIMAL(5,2) as avg_opportunity_score
       FROM social_mentions
       WHERE campaign_id = $1
         AND detected_at BETWEEN $2 AND $3
       GROUP BY DATE(detected_at)
       ORDER BY date DESC`,
      [campaignId, start, end]
    );

    const stats = mentionsStats.rows[0];
    const outreach = outreachStats.rows[0];

    res.status(200).json({
      period: { start, end },
      mentions: {
        total: parseInt(stats.total),
        by_platform: {
          twitter: parseInt(stats.twitter_count),
          reddit: parseInt(stats.reddit_count),
          linkedin: parseInt(stats.linkedin_count),
          facebook: parseInt(stats.facebook_count),
        },
        by_sentiment: {
          positive: parseInt(stats.positive_count),
          negative: parseInt(stats.negative_count),
          neutral: parseInt(stats.neutral_count),
          mixed: parseInt(stats.mixed_count),
        },
        by_intent: {
          purchase_intent: parseInt(stats.purchase_intent_count),
          question: parseInt(stats.question_count),
          complaint: parseInt(stats.complaint_count),
        },
        avg_opportunity_score: parseFloat(stats.avg_opportunity_score) || 0,
        avg_relevance_score: parseFloat(stats.avg_relevance_score) || 0,
      },
      outreach: {
        total_sent: parseInt(outreach.total_sent),
        pending_approval: parseInt(outreach.pending_approval),
        response_rate: outreach.total_sent > 0
          ? (parseInt(outreach.responses) / parseInt(outreach.total_sent)) * 100
          : 0,
        conversion_rate: outreach.total_sent > 0
          ? (parseInt(outreach.conversions) / parseInt(outreach.total_sent)) * 100
          : 0,
      },
      top_keywords: topKeywords.rows,
      top_authors: topAuthors.rows,
      daily_trend: dailyTrend.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
