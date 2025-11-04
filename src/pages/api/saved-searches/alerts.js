// API: Saved Search Alerts
import { Pool } from 'pg';

const getDbPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
};

export default async function handler(req, res) {
  const pool = getDbPool();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, pool);
      case 'PUT':
        return await handlePut(req, res, pool);
      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Saved search alerts API error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

// GET - List alerts for a saved search or user
async function handleGet(req, res, pool) {
  const { userId, savedSearchId, unviewedOnly, limit = 50, offset = 0 } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    let query;
    let params;

    if (savedSearchId) {
      // Get alerts for specific saved search
      query = `
        SELECT
          ssa.*,
          sm.platform,
          sm.content,
          sm.author_username,
          sm.author_display_name,
          sm.post_url,
          sm.engagement,
          sm.sentiment,
          sm.opportunity_score,
          sm.relevance_score,
          sm.intent,
          sm.detected_at,
          ss.name as search_name
        FROM saved_search_alerts ssa
        JOIN social_mentions sm ON ssa.mention_id = sm.id
        JOIN saved_searches ss ON ssa.saved_search_id = ss.id
        WHERE ssa.saved_search_id = $1
          AND ss.user_id = $2
          ${unviewedOnly === 'true' ? 'AND ssa.is_viewed = false' : ''}
        ORDER BY ssa.triggered_at DESC
        LIMIT $3 OFFSET $4
      `;
      params = [savedSearchId, userId, limit, offset];
    } else {
      // Get all alerts for user across all saved searches
      query = `
        SELECT
          ssa.*,
          sm.platform,
          sm.content,
          sm.author_username,
          sm.author_display_name,
          sm.post_url,
          sm.engagement,
          sm.sentiment,
          sm.opportunity_score,
          sm.relevance_score,
          sm.intent,
          sm.detected_at,
          ss.name as search_name,
          ss.id as saved_search_id
        FROM saved_search_alerts ssa
        JOIN social_mentions sm ON ssa.mention_id = sm.id
        JOIN saved_searches ss ON ssa.saved_search_id = ss.id
        WHERE ss.user_id = $1
          ${unviewedOnly === 'true' ? 'AND ssa.is_viewed = false' : ''}
        ORDER BY ssa.triggered_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    }

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = savedSearchId
      ? `SELECT COUNT(*) FROM saved_search_alerts ssa
         JOIN saved_searches ss ON ssa.saved_search_id = ss.id
         WHERE ssa.saved_search_id = $1 AND ss.user_id = $2
         ${unviewedOnly === 'true' ? 'AND ssa.is_viewed = false' : ''}`
      : `SELECT COUNT(*) FROM saved_search_alerts ssa
         JOIN saved_searches ss ON ssa.saved_search_id = ss.id
         WHERE ss.user_id = $1
         ${unviewedOnly === 'true' ? 'AND ssa.is_viewed = false' : ''}`;

    const countParams = savedSearchId ? [savedSearchId, userId] : [userId];
    const countResult = await pool.query(countQuery, countParams);

    return res.status(200).json({
      alerts: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
}

// PUT - Update alert status (mark as viewed, archived, actioned)
async function handlePut(req, res, pool) {
  const { alertId, userId } = req.query;
  const { isViewed, isArchived, isActioned } = req.body;

  if (!alertId || !userId) {
    return res.status(400).json({ error: 'alertId and userId are required' });
  }

  try {
    // Verify user owns this alert
    const checkResult = await pool.query(
      `SELECT ssa.id FROM saved_search_alerts ssa
       JOIN saved_searches ss ON ssa.saved_search_id = ss.id
       WHERE ssa.id = $1 AND ss.user_id = $2`,
      [alertId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (isViewed !== undefined) {
      updates.push(`is_viewed = $${paramCount++}`);
      values.push(isViewed);
    }
    if (isArchived !== undefined) {
      updates.push(`is_archived = $${paramCount++}`);
      values.push(isArchived);
    }
    if (isActioned !== undefined) {
      updates.push(`is_actioned = $${paramCount++}`);
      values.push(isActioned);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(alertId);

    const result = await pool.query(
      `UPDATE saved_search_alerts
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++}
       RETURNING *`,
      values
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
}
