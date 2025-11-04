// API: Buyer Demand Insights
// Shows sellers what buyers are searching for
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
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Demand insights API error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

// GET - Get buyer demand insights
async function handleGet(req, res, pool) {
  const {
    platform,
    minDemand = 1,
    limit = 100,
    offset = 0,
    sortBy = 'demand_count' // demand_count, last_searched_at, avg_opportunity_score
  } = req.query;

  try {
    const validSortFields = ['demand_count', 'last_searched_at', 'avg_opportunity_score', 'total_searches'];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : 'demand_count';

    let query = `
      SELECT
        keyword_phrase,
        platforms,
        demand_count,
        avg_opportunity_score,
        total_searches,
        active_searches,
        first_searched_at,
        last_searched_at
      FROM buyer_demand_insights
      WHERE demand_count >= $1
    `;

    const params = [minDemand];
    let paramCount = 2;

    // Filter by platform if specified
    if (platform) {
      query += ` AND $${paramCount} = ANY(platforms)`;
      params.push(platform);
      paramCount++;
    }

    query += ` ORDER BY ${orderBy} DESC, keyword_phrase ASC
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;

    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*)
      FROM buyer_demand_insights
      WHERE demand_count >= $1
    `;
    const countParams = [minDemand];

    if (platform) {
      countQuery += ` AND $2 = ANY(platforms)`;
      countParams.push(platform);
    }

    const countResult = await pool.query(countQuery, countParams);

    // Get aggregate statistics
    const statsQuery = `
      SELECT
        SUM(demand_count) as total_demand,
        COUNT(DISTINCT keyword_phrase) as unique_keywords,
        AVG(demand_count) as avg_demand_per_keyword,
        MAX(demand_count) as max_demand
      FROM buyer_demand_insights
      WHERE demand_count >= $1
    `;
    const statsResult = await pool.query(statsQuery, [minDemand]);

    return res.status(200).json({
      insights: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      statistics: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching demand insights:', error);
    throw error;
  }
}
