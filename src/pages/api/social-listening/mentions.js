// API Route: Social Mentions
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
    const {
      campaignId,
      platform,
      minOpportunityScore,
      sentiment,
      isReplied,
      limit = 50,
      offset = 0,
    } = req.query;

    // Build query
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (campaignId) {
      conditions.push(`campaign_id = $${paramCount++}`);
      values.push(campaignId);
    }

    if (platform) {
      conditions.push(`platform = $${paramCount++}`);
      values.push(platform);
    }

    if (minOpportunityScore) {
      conditions.push(`opportunity_score >= $${paramCount++}`);
      values.push(parseInt(minOpportunityScore));
    }

    if (sentiment) {
      conditions.push(`sentiment = $${paramCount++}`);
      values.push(sentiment);
    }

    if (isReplied !== undefined) {
      conditions.push(`is_replied = $${paramCount++}`);
      values.push(isReplied === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(parseInt(limit));
    values.push(parseInt(offset));

    const result = await pool.query(
      `SELECT sm.*, lc.name as campaign_name
       FROM social_mentions sm
       LEFT JOIN listening_campaigns lc ON sm.campaign_id = lc.id
       ${whereClause}
       ORDER BY sm.detected_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      values
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM social_mentions sm ${whereClause}`,
      values.slice(0, -2)
    );

    res.status(200).json({
      mentions: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
