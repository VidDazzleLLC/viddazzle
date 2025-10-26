import { getToolPerformanceStats } from '@/lib/learning-engine';
import { query } from '@/lib/database';

/**
 * Get learning analytics and performance stats
 *
 * GET /api/analytics/learning
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get tool performance stats
    const toolStats = await getToolPerformanceStats();

    // Get learning insights count
    const insightsResult = await query(`
      SELECT
        metadata->>'type' as type,
        metadata->>'category' as category,
        COUNT(*) as count
      FROM tutorial_embeddings
      WHERE metadata IS NOT NULL
      GROUP BY metadata->>'type', metadata->>'category'
      ORDER BY count DESC
    `);

    // Get recent learnings
    const recentResult = await query(`
      SELECT
        id,
        content,
        metadata->>'type' as type,
        metadata->>'category' as category,
        metadata->>'confidence' as confidence,
        created_at
      FROM tutorial_embeddings
      WHERE metadata IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // Get workflow success trends
    const trendsResult = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_executions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(duration_ms) as avg_duration
      FROM workflow_executions
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    return res.status(200).json({
      success: true,
      tools: toolStats,
      insights: {
        byType: insightsResult.rows,
        recent: recentResult.rows,
        total: insightsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
      },
      trends: trendsResult.rows,
      summary: {
        totalTools: toolStats.length,
        totalInsights: insightsResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
        avgSuccessRate: toolStats.length > 0
          ? (toolStats.reduce((sum, t) => sum + t.successRate, 0) / toolStats.length)
          : 0,
      },
    });
  } catch (error) {
    console.error('Error getting learning analytics:', error);
    return res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message,
    });
  }
}
