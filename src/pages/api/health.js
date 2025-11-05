/**
 * Health Check Endpoint
 * Used by Railway and other platforms to verify the application is running
 * and can connect to required services.
 *
 * Includes automatic database initialization check and trigger
 *
 * GET /api/health
 * GET /api/health?init=true - Force database initialization check
 *
 * Returns: {
 *   status: "healthy" | "degraded",
 *   timestamp: ISO string,
 *   database: { configured: boolean, initialized: boolean },
 *   setup_url: "/api/db/setup" (if not initialized)
 * }
 */

import { ensureDatabaseInitialized, isDatabaseInitialized } from '../../lib/db-auto-init.js';

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

  healthCheck.database = {
    configured: hasDatabase,
    type: process.env.DATABASE_URL ? 'postgresql' :
          process.env.POSTGRES_URL ? 'postgresql' :
          process.env.NEXT_PUBLIC_SUPABASE_URL ? 'supabase' : 'none',
  };

  // Check database initialization status
  if (hasDatabase && (process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
    const isInitialized = isDatabaseInitialized();

    // If init parameter is provided or not yet initialized, trigger initialization
    if (req.query.init === 'true' || !isInitialized) {
      try {
        const initResult = await ensureDatabaseInitialized();
        healthCheck.database.initialized = initResult.success;
        healthCheck.database.init_message = initResult.message;

        if (!initResult.success) {
          healthCheck.status = 'degraded';
          healthCheck.database.setup_url = '/api/db/setup';
          healthCheck.database.setup_instructions = 'Call GET /api/db/setup to initialize database';
        }
      } catch (error) {
        healthCheck.status = 'degraded';
        healthCheck.database.initialized = false;
        healthCheck.database.error = error.message;
        healthCheck.database.setup_url = '/api/db/setup';
      }
    } else {
      healthCheck.database.initialized = true;
    }
  }

  // Check if API keys are configured
  healthCheck.anthropic_api = !!process.env.ANTHROPIC_API_KEY;

  // Return 200 OK with health status
  return res.status(200).json(healthCheck);
}
