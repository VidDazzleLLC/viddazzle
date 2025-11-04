// API: Saved Searches CRUD Operations
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
      case 'POST':
        return await handlePost(req, res, pool);
      case 'PUT':
        return await handlePut(req, res, pool);
      case 'DELETE':
        return await handleDelete(req, res, pool);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Saved searches API error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

// GET - List all saved searches for a user
async function handleGet(req, res, pool) {
  const { userId, id, includeStats } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get specific saved search by ID
    if (id) {
      const result = await pool.query(
        `SELECT * FROM saved_searches
         WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Saved search not found' });
      }

      // Optionally include alert statistics
      if (includeStats === 'true') {
        const statsResult = await pool.query(
          `SELECT
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE is_viewed = false) as unviewed_alerts,
            COUNT(*) FILTER (WHERE is_actioned = true) as actioned_alerts,
            MAX(triggered_at) as last_alert_at
           FROM saved_search_alerts
           WHERE saved_search_id = $1`,
          [id]
        );

        result.rows[0].stats = statsResult.rows[0];
      }

      return res.status(200).json(result.rows[0]);
    }

    // List all saved searches for user
    const result = await pool.query(
      `SELECT
        ss.*,
        COUNT(ssa.id) as total_alerts,
        COUNT(ssa.id) FILTER (WHERE ssa.is_viewed = false) as unviewed_alerts,
        MAX(ssa.triggered_at) as last_alert_at
       FROM saved_searches ss
       LEFT JOIN saved_search_alerts ssa ON ss.id = ssa.saved_search_id
       WHERE ss.user_id = $1
       GROUP BY ss.id
       ORDER BY ss.created_at DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    throw error;
  }
}

// POST - Create new saved search
async function handlePost(req, res, pool) {
  const {
    userId,
    name,
    description,
    searchCriteria,
    alertSettings,
    isActive = true,
    isPremium = false
  } = req.body;

  // Validation
  if (!userId || !name || !searchCriteria) {
    return res.status(400).json({
      error: 'Missing required fields: userId, name, searchCriteria'
    });
  }

  // Validate search criteria structure
  if (!searchCriteria.keywords || !Array.isArray(searchCriteria.keywords) || searchCriteria.keywords.length === 0) {
    return res.status(400).json({
      error: 'searchCriteria must include at least one keyword'
    });
  }

  // Default alert settings if not provided
  const defaultAlertSettings = {
    frequency: 'immediate',
    channels: ['in_app'],
    max_alerts_per_day: 50,
    require_approval: false,
    group_similar: false,
    ...alertSettings
  };

  try {
    const result = await pool.query(
      `INSERT INTO saved_searches
       (user_id, name, description, search_criteria, alert_settings, is_active, is_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        name,
        description || null,
        JSON.stringify(searchCriteria),
        JSON.stringify(defaultAlertSettings),
        isActive,
        isPremium
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating saved search:', error);
    throw error;
  }
}

// PUT - Update existing saved search
async function handlePut(req, res, pool) {
  const { id, userId } = req.query;
  const {
    name,
    description,
    searchCriteria,
    alertSettings,
    isActive,
    isPremium
  } = req.body;

  if (!id || !userId) {
    return res.status(400).json({ error: 'id and userId are required' });
  }

  try {
    // Verify ownership
    const checkResult = await pool.query(
      'SELECT id FROM saved_searches WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
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
    if (searchCriteria !== undefined) {
      updates.push(`search_criteria = $${paramCount++}`);
      values.push(JSON.stringify(searchCriteria));
    }
    if (alertSettings !== undefined) {
      updates.push(`alert_settings = $${paramCount++}`);
      values.push(JSON.stringify(alertSettings));
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }
    if (isPremium !== undefined) {
      updates.push(`is_premium = $${paramCount++}`);
      values.push(isPremium);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id, userId);

    const result = await pool.query(
      `UPDATE saved_searches
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING *`,
      values
    );

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating saved search:', error);
    throw error;
  }
}

// DELETE - Delete saved search
async function handleDelete(req, res, pool) {
  const { id, userId } = req.query;

  if (!id || !userId) {
    return res.status(400).json({ error: 'id and userId are required' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Saved search deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    throw error;
  }
}
