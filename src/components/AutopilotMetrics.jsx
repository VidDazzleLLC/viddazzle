import { useState, useEffect } from 'react';

/**
 * Autopilot Metrics Dashboard
 * Displays real-time performance metrics, cache effectiveness, and cost savings
 */
export default function AutopilotMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics/autopilot');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 10 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">Failed to load metrics: {error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-2 text-red-600 text-sm underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Autopilot Performance</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchMetrics}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">
            {metrics.requests.total}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total Requests</div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-900">
            {metrics.cache.hit_rate}%
          </div>
          <div className="text-sm text-green-700 mt-1">Cache Hit Rate</div>
        </div>

        {/* Cost Savings */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="text-2xl font-bold text-blue-900">
            ${metrics.cost_savings.estimated_savings_usd}
          </div>
          <div className="text-sm text-blue-700 mt-1">Cost Savings</div>
        </div>

        {/* Error Rate */}
        <div className={`rounded-lg border p-4 ${
          parseFloat(metrics.requests.error_rate) > 5
            ? 'bg-red-50 border-red-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`text-2xl font-bold ${
            parseFloat(metrics.requests.error_rate) > 5
              ? 'text-red-900'
              : 'text-gray-900'
          }`}>
            {metrics.requests.error_rate}%
          </div>
          <div className={`text-sm mt-1 ${
            parseFloat(metrics.requests.error_rate) > 5
              ? 'text-red-700'
              : 'text-gray-600'
          }`}>
            Error Rate
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cache Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Cache Performance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Cache Hits:</span>
              <span className="font-medium text-gray-900">{metrics.cache.total_hits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Idempotency Hits:</span>
              <span className="font-medium text-gray-900">{metrics.cache.idempotency_hits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Response Cache Hits:</span>
              <span className="font-medium text-gray-900">{metrics.cache.response_cache_hits}</span>
            </div>
          </div>
        </div>

        {/* Claude API Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Claude API Usage</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total API Calls:</span>
              <span className="font-medium text-gray-900">{metrics.claude_api.total_calls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Calls Saved (Cache):</span>
              <span className="font-medium text-green-600">{metrics.claude_api.calls_saved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cache Effectiveness:</span>
              <span className="font-medium text-gray-900">{metrics.claude_api.cache_effectiveness}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Quota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Performance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response Time:</span>
              <span className="font-medium text-gray-900">
                {metrics.performance.avg_response_time_ms}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime:</span>
              <span className="font-medium text-gray-900">
                {metrics.uptime.hours}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Started:</span>
              <span className="font-medium text-gray-900">
                {new Date(metrics.uptime.started_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quota Status */}
        {metrics.quota && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Monthly Quota</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Usage:</span>
                <span className="font-medium text-gray-900">
                  {metrics.quota.usage_count} / {metrics.quota.limit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-medium text-gray-900">{metrics.quota.remaining}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usage:</span>
                <span className={`font-medium ${
                  parseFloat(metrics.quota.usage_percent) > 80
                    ? 'text-red-600'
                    : parseFloat(metrics.quota.usage_percent) > 60
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {metrics.quota.usage_percent}%
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      parseFloat(metrics.quota.usage_percent) > 80
                        ? 'bg-red-600'
                        : parseFloat(metrics.quota.usage_percent) > 60
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${metrics.quota.usage_percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Last Updated */}
      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
