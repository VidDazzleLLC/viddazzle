/**
 * Autopilot Metrics API
 * GET /api/metrics/autopilot
 *
 * Returns real-time metrics about:
 * - Cache hit rates (idempotency and response cache)
 * - Cost savings from caching
 * - Usage statistics
 * - Performance data
 */

import { getQuotaStatus } from '@/lib/quota-manager';

// Global metrics storage (in-memory, resets on server restart)
// In production, consider using Redis or database for persistence
global.autopilotMetrics = global.autopilotMetrics || {
  totalRequests: 0,
  idempotencyCacheHits: 0,
  responseCacheHits: 0,
  claudeAPICalls: 0,
  errors: 0,
  totalResponseTime: 0,
  startTime: Date.now(),
};

/**
 * Increment metrics (called from command API)
 */
export function trackMetric(metricName, value = 1) {
  if (!global.autopilotMetrics) {
    global.autopilotMetrics = {
      totalRequests: 0,
      idempotencyCacheHits: 0,
      responseCacheHits: 0,
      claudeAPICalls: 0,
      errors: 0,
      totalResponseTime: 0,
      startTime: Date.now(),
    };
  }

  global.autopilotMetrics[metricName] = (global.autopilotMetrics[metricName] || 0) + value;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metrics = global.autopilotMetrics || {
      totalRequests: 0,
      idempotencyCacheHits: 0,
      responseCacheHits: 0,
      claudeAPICalls: 0,
      errors: 0,
      totalResponseTime: 0,
      startTime: Date.now(),
    };

    // Calculate derived metrics
    const totalCacheHits = metrics.idempotencyCacheHits + metrics.responseCacheHits;
    const cacheHitRate = metrics.totalRequests > 0
      ? ((totalCacheHits / metrics.totalRequests) * 100).toFixed(2)
      : 0;

    // Cost savings calculation
    // Claude Opus 4 costs approximately $0.40 per workflow generation
    const costPerClaudeCall = 0.40;
    const cacheSavedCalls = totalCacheHits;
    const estimatedCostSavings = (cacheSavedCalls * costPerClaudeCall).toFixed(2);

    // Average response time
    const avgResponseTime = metrics.totalRequests > 0
      ? Math.round(metrics.totalResponseTime / metrics.totalRequests)
      : 0;

    // Uptime
    const uptimeSeconds = Math.floor((Date.now() - metrics.startTime) / 1000);
    const uptimeHours = (uptimeSeconds / 3600).toFixed(2);

    // Error rate
    const errorRate = metrics.totalRequests > 0
      ? ((metrics.errors / metrics.totalRequests) * 100).toFixed(2)
      : 0;

    // Get quota status for autopilot
    let quotaStatus = null;
    try {
      const quotaData = await getQuotaStatus('autopilot');
      quotaStatus = quotaData.length > 0 ? quotaData[0] : null;
    } catch (error) {
      console.warn('Could not fetch quota status:', error.message);
    }

    // Build response
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        hours: parseFloat(uptimeHours),
        started_at: new Date(metrics.startTime).toISOString(),
      },
      requests: {
        total: metrics.totalRequests,
        successful: metrics.totalRequests - metrics.errors,
        failed: metrics.errors,
        error_rate: parseFloat(errorRate),
      },
      cache: {
        total_hits: totalCacheHits,
        idempotency_hits: metrics.idempotencyCacheHits,
        response_cache_hits: metrics.responseCacheHits,
        hit_rate: parseFloat(cacheHitRate),
      },
      claude_api: {
        total_calls: metrics.claudeAPICalls,
        calls_saved: cacheSavedCalls,
        cache_effectiveness: metrics.claudeAPICalls > 0
          ? ((cacheSavedCalls / (metrics.claudeAPICalls + cacheSavedCalls)) * 100).toFixed(2)
          : 0,
      },
      cost_savings: {
        calls_saved: cacheSavedCalls,
        estimated_savings_usd: parseFloat(estimatedCostSavings),
        cost_per_call: costPerClaudeCall,
      },
      performance: {
        avg_response_time_ms: avgResponseTime,
      },
      quota: quotaStatus,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Metrics API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error.message,
    });
  }
}
