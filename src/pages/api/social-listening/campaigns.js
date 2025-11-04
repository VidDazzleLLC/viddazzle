// API Route: Social Listening Campaigns CRUD
import { Pool } from 'pg';

// Initialize database connection
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
        await handleGet(req, res, pool);
        break;
      case 'POST':
        await handlePost(req, res, pool);
        break;
      case 'PUT':
        await handlePut(req, res, pool);
        break;
      case 'DELETE':
        await handleDelete(req, res, pool);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

// GET - List campaigns or get specific campaign
async function handleGet(req, res, pool) {
  const { id, userId } = req.query;

  if (id) {
    // Get specific campaign
    const result = await pool.query(
      'SELECT * FROM listening_campaigns WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.status(200).json(result.rows[0]);
  }

  // List all campaigns for user
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const result = await pool.query(
    `SELECT *,
      (SELECT COUNT(*) FROM social_mentions WHERE campaign_id = listening_campaigns.id) as mentions_count
     FROM listening_campaigns
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  res.status(200).json(result.rows);
}

// POST - Create new campaign
async function handlePost(req, res, pool) {
  const {
    name,
    description,
    platforms,
    keywords,
    hashtags,
    accounts_to_monitor,
    filters,
    interval_minutes,
    user_id,
  } = req.body;

  // Validation
  if (!name || !platforms || !keywords || !user_id) {
    return res.status(400).json({
      error: 'Missing required fields: name, platforms, keywords, user_id'
    });
  }

  if (!Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'platforms must be a non-empty array' });
  }

  if (!Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'keywords must be a non-empty array' });
  }

  const result = await pool.query(
    `INSERT INTO listening_campaigns (
      name, description, platforms, keywords, hashtags,
      accounts_to_monitor, filters, interval_minutes, user_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      name,
      description || null,
      platforms,
      keywords,
      hashtags || [],
      accounts_to_monitor || [],
      JSON.stringify(filters || {}),
      interval_minutes || 15,
      user_id,
      'draft'
    ]
  );

  res.status(201).json(result.rows[0]);
}

// PUT - Update campaign
async function handlePut(req, res, pool) {
  const { id } = req.query;
  const {
    name,
    description,
    platforms,
    keywords,
    hashtags,
    accounts_to_monitor,
    filters,
    status,
    interval_minutes,
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }

  // Build dynamic update query
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description);
  }
  if (platforms !== undefined) {
    updates.push(`platforms = $${paramCount++}`);
    values.push(platforms);
  }
  if (keywords !== undefined) {
    updates.push(`keywords = $${paramCount++}`);
    values.push(keywords);
  }
  if (hashtags !== undefined) {
    updates.push(`hashtags = $${paramCount++}`);
    values.push(hashtags);
  }
  if (accounts_to_monitor !== undefined) {
    updates.push(`accounts_to_monitor = $${paramCount++}`);
    values.push(accounts_to_monitor);
  }
  if (filters !== undefined) {
    updates.push(`filters = $${paramCount++}`);
    values.push(JSON.stringify(filters));
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (interval_minutes !== undefined) {
    updates.push(`interval_minutes = $${paramCount++}`);
    values.push(interval_minutes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE listening_campaigns SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.status(200).json(result.rows[0]);
}

// DELETE - Delete campaign
async function handleDelete(req, res, pool) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }

  const result = await pool.query(
    'DELETE FROM listening_campaigns WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  res.status(200).json({ success: true, id: result.rows[0].id });
}
