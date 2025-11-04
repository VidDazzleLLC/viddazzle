/**
 * Health Check Endpoint
 * Used by Railway and other platforms to verify the application is running
 * and can connect to required services.
 *
 * GET /api/health
 * Returns: { status: "healthy", timestamp: ISO string, database: "connected" }
 */

import { query } from '@/lib/db';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'unknown',
  };

  try {
    // Test database connectivity with a simple query
    const result = await query('SELECT NOW() as current_time');

    if (result && result.rows && result.rows.length > 0) {
      healthCheck.database = 'connected';
      healthCheck.database_time = result.rows[0].current_time;
    } else {
      healthCheck.database = 'error';
      healthCheck.status = 'degraded';
    }

    // Return 200 OK with health status
    return res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);

    // Return 503 Service Unavailable if database is down
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
}
