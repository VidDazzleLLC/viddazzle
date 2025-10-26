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
    // Get tool performance stats (with error handling)
    let toolStats = [];
    try {
      toolStats = await getToolPerformanceStats();
    } catch (err) {
      console.warn('Could not get tool stats:', err.message);
    }

    // Get learning insights count (with error handling)
    let insightsResult = { rows: [] };
    try {
      insightsResult = await query(`
        SELECT
          metadata->>'type' as type,
          metadata->>'category' as category,
          COUNT(*) as count
        FROM tutorial_embeddings
        WHERE metadata IS NOT NULL
        GROUP BY metadata->>'type', metadata->>'category'
        ORDER BY count DESC
      `);
    } catch (err) {
      console.warn('Could not get insights:', err.message);
    }

    // Get recent learnings (with error handling)
    let recentResult = { rows: [] };
    try {
      recentResult = await query(`
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
    } catch (err) {
      console.warn('Could not get recent learnings:', err.message);
    }

    // Get workflow success trends (with error handling)
    let trendsResult = { rows: [] };
    try {
      trendsResult = await query(`
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
    } catch (err) {
      console.warn('Could not get trends:', err.message);
    }

    // Calculate totals safely
    const totalInsights = insightsResult.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0);

    return res.status(200).json({
      success: true,
      tools: toolStats || [],
      insights: {
        byType: insightsResult.rows || [],
        recent: recentResult.rows || [],
        total: totalInsights,
      },
      trends: trendsResult.rows || [],
      summary: {
        totalTools: toolStats.length,
        totalInsights,
        avgSuccessRate: toolStats.length > 0
          ? (toolStats.reduce((sum, t) => sum + (t.successRate || 0), 0) / toolStats.length)
          : 0,
      },
      message: totalInsights === 0
        ? 'No learning data yet. Execute some workflows to start learning!'
        : `Learning from ${totalInsights} insights`,
    });
  } catch (error) {
    console.error('Error getting learning analytics:', error);
    return res.status(500).json({
      error: 'Failed to get analytics',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
