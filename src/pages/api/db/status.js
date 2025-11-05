/**
 * Database Status API Endpoint
 * Checks if database is properly initialized with all required tables
 *
 * GET /api/db/status - Check database initialization status
 */

import { Pool } from 'pg';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    return res.status(200).json({
      configured: false,
      initialized: false,
      message: 'DATABASE_URL not configured'
    });
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });

  let client;

  try {
    client = await pool.connect();

    // Check for required tables
    const requiredTables = [
      'workflows',
      'workflow_executions',
      'tutorial_embeddings',
      'mcp_tool_usage',
      'connectors',
      'listening_campaigns',
      'social_mentions',
      'outreach_rules',
      'outreach_messages',
      'platform_credentials'
    ];

    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = ANY($1::text[])
    `, [requiredTables]);

    const existingTables = tablesResult.rows.map(r => r.tablename);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    // Check for required extensions
    const extResult = await client.query(`
      SELECT extname
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'vector')
    `);

    const existingExtensions = extResult.rows.map(r => r.extname);
    const missingExtensions = ['uuid-ossp', 'vector'].filter(e => !existingExtensions.includes(e));

    const isInitialized = missingTables.length === 0 && missingExtensions.length === 0;

    return res.status(200).json({
      configured: true,
      initialized: isInitialized,
      database: {
        tables: {
          required: requiredTables.length,
          existing: existingTables.length,
          missing: missingTables
        },
        extensions: {
          required: 2,
          existing: existingExtensions.length,
          missing: missingExtensions
        }
      },
      setupUrl: isInitialized ? null : '/api/db/setup',
      message: isInitialized
        ? 'Database is fully initialized'
        : 'Database needs initialization - call /api/db/setup'
    });

  } catch (error) {
    console.error('Database status check error:', error);

    return res.status(500).json({
      configured: true,
      initialized: false,
      error: error.message,
      message: 'Failed to check database status'
    });

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}
