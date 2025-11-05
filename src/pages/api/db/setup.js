/**
 * Database Setup API Endpoint
 * Automatically sets up the database schema when called
 *
 * This endpoint is idempotent - safe to call multiple times
 * It will only create tables/extensions that don't exist
 *
 * GET /api/db/setup - Initialize database schema
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  // Only allow GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if DATABASE_URL is configured
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL not configured',
      message: 'Please set DATABASE_URL environment variable'
    });
  }

  // Create connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  let client;
  const results = {
    success: false,
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Step 1: Connect to database
    results.steps.push({ step: 'connect', status: 'attempting' });
    client = await pool.connect();
    results.steps[results.steps.length - 1].status = 'success';

    // Step 2: Load schema file
    results.steps.push({ step: 'load_schema', status: 'attempting' });
    const schemaPath = resolve(process.cwd(), 'supabase/complete-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].size = `${schema.length} bytes`;

    // Step 3: Execute schema SQL
    results.steps.push({ step: 'execute_schema', status: 'attempting' });
    await client.query(schema);
    results.steps[results.steps.length - 1].status = 'success';

    // Step 4: Verify tables
    results.steps.push({ step: 'verify_tables', status: 'attempting' });
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].tables = tablesResult.rows.map(r => r.tablename);
    results.steps[results.steps.length - 1].count = tablesResult.rows.length;

    // Step 5: Verify extensions
    results.steps.push({ step: 'verify_extensions', status: 'attempting' });
    const extResult = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'vector')
      ORDER BY extname
    `);
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].extensions = extResult.rows.map(r => ({
      name: r.extname,
      version: r.extversion
    }));

    // Step 6: Verify functions
    results.steps.push({ step: 'verify_functions', status: 'attempting' });
    const funcResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('match_tutorial_embeddings', 'update_updated_at_column')
      ORDER BY routine_name
    `);
    results.steps[results.steps.length - 1].status = 'success';
    results.steps[results.steps.length - 1].functions = funcResult.rows.map(r => r.routine_name);

    results.success = true;
    results.message = 'Database schema setup completed successfully';

    return res.status(200).json(results);

  } catch (error) {
    // Log the error
    console.error('Database setup error:', error);

    // Update the last step with error
    if (results.steps.length > 0) {
      results.steps[results.steps.length - 1].status = 'error';
      results.steps[results.steps.length - 1].error = error.message;
    }

    results.success = false;
    results.error = error.message;
    results.message = 'Database setup failed';

    return res.status(500).json(results);

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}
