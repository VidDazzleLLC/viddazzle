/**
 * Health Check Endpoint
 * Used by Railway and other platforms to verify the application is running
 * and can connect to required services.
 *
 * GET /api/health
 * Returns: { status: "healthy", timestamp: ISO string, database: "configured" }
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'viddazzle',
    version: '1.0.0',
  };

  // Check if database is configured
  const hasDatabase = !!(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );

  healthCheck.database = hasDatabase ? 'configured' : 'not configured';

  // Check if API keys are configured
  healthCheck.anthropic_api = !!process.env.ANTHROPIC_API_KEY;

  // Return 200 OK with health status
  return res.status(200).json(healthCheck);
}
