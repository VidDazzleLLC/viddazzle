/**
 * Database Auto-Initialization Module
 * Automatically initializes the database schema on application startup
 *
 * This runs once when the application starts and is idempotent
 * (safe to run multiple times - won't recreate existing tables)
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let isInitialized = false;
let isInitializing = false;

/**
 * Check if database tables exist
 */
async function checkDatabaseInitialized(pool) {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('workflows', 'workflow_executions', 'tutorial_embeddings')
    `);

    return parseInt(result.rows[0].count) >= 3;
  } catch (error) {
    console.error('Error checking database status:', error.message);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Initialize database schema
 */
async function initializeDatabase() {
  // Prevent multiple simultaneous initializations
  if (isInitializing) {
    console.log('⏳ Database initialization already in progress...');
    return { success: false, message: 'Already initializing' };
  }

  if (isInitialized) {
    console.log('✅ Database already initialized');
    return { success: true, message: 'Already initialized' };
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!databaseUrl) {
    console.log('⚠️  No DATABASE_URL configured - skipping auto-initialization');
    return { success: false, message: 'No DATABASE_URL' };
  }

  isInitializing = true;

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  let client;

  try {
    console.log('🔧 Starting database auto-initialization...');

    // Check if already initialized
    const alreadyInitialized = await checkDatabaseInitialized(pool);
    if (alreadyInitialized) {
      console.log('✅ Database tables already exist - skipping initialization');
      isInitialized = true;
      isInitializing = false;
      await pool.end();
      return { success: true, message: 'Already initialized' };
    }

    // Connect and initialize
    client = await pool.connect();
    console.log('📡 Connected to database');

    // Read schema file
    const schemaPath = resolve(process.cwd(), 'supabase/complete-schema.sql');
    console.log('📄 Loading schema from:', schemaPath);

    const schema = readFileSync(schemaPath, 'utf8');
    console.log(`📋 Schema loaded (${schema.length} bytes)`);

    // Execute schema
    console.log('⚙️  Executing schema...');
    await client.query(schema);
    console.log('✅ Schema executed successfully');

    // Verify
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables
      WHERE schemaname = 'public'
    `);

    const tableCount = parseInt(tablesResult.rows[0].count);
    console.log(`✅ Database initialized with ${tableCount} tables`);

    isInitialized = true;
    isInitializing = false;

    return {
      success: true,
      message: 'Database initialized successfully',
      tables: tableCount
    };

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    isInitializing = false;

    return {
      success: false,
      error: error.message,
      message: 'Initialization failed - will retry on next request'
    };

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

/**
 * Initialize database if needed
 * Safe to call multiple times
 */
export async function ensureDatabaseInitialized() {
  if (isInitialized) {
    return { success: true, message: 'Already initialized' };
  }

  return await initializeDatabase();
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized() {
  return isInitialized;
}

// Auto-initialize on module load (when app starts)
if (process.env.AUTO_INIT_DATABASE !== 'false') {
  // Run async initialization without blocking
  initializeDatabase()
    .then(result => {
      if (result.success) {
        console.log('🎉 Database auto-initialization completed');
      } else {
        console.log('ℹ️  Database auto-initialization skipped:', result.message);
      }
    })
    .catch(error => {
      console.error('⚠️  Database auto-initialization error:', error.message);
    });
}

export default {
  ensureDatabaseInitialized,
  isDatabaseInitialized,
};
