#!/usr/bin/env node

/**
 * Deploy-time Database Migration Script
 *
 * This script runs during Vercel deployments to ensure database schema is up-to-date.
 * It safely handles migrations without requiring manual intervention.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Get database connection
let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// If no DATABASE_URL, construct from Supabase credentials
if (!connectionString && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (projectRef && process.env.DB_PASSWORD) {
    connectionString = `postgresql://postgres.${projectRef}:${process.env.DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  }
}

if (!connectionString) {
  console.log('⚠️  No database connection configured. Skipping migrations.');
  console.log('   Set DATABASE_URL or POSTGRES_URL environment variable to enable automatic migrations.');
  process.exit(0); // Exit successfully - migrations are optional during build
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  // Add timeouts for build environment
  connectionTimeoutMillis: 10000,
  query_timeout: 30000,
  statement_timeout: 30000,
});

async function checkTableExists(client, tableName) {
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } catch (error) {
    console.log(`⚠️  Could not check table ${tableName}: ${error.message}`);
    return false;
  }
}

async function runMigration() {
  let client;

  try {
    console.log('🔍 VidDazzle Deployment Migration\n');
    console.log('🔌 Connecting to database...');

    client = await pool.connect();
    console.log('✅ Connected!\n');

    // Check if key tables exist
    const coreTablesExist = await checkTableExists(client, 'workflows') &&
                            await checkTableExists(client, 'workflow_executions');

    if (coreTablesExist) {
      console.log('✅ Database schema is up to date');
      console.log('   All required tables exist.\n');
      return;
    }

    console.log('📝 Applying database schema...\n');

    // Try to apply complete schema
    const schemaPath = path.join(__dirname, '../supabase/complete-schema.sql');

    if (!fs.existsSync(schemaPath)) {
      console.log('⚠️  Schema file not found. Skipping migration.');
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    await client.query(schemaSql);

    console.log('✅ Schema applied successfully!\n');

    // Verify critical tables
    const tables = ['workflows', 'workflow_executions', 'platform_credentials'];
    console.log('📊 Verifying tables:');

    for (const table of tables) {
      const exists = await checkTableExists(client, table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('\n⚠️  Migration error:', error.message);
    console.error('   Continuing with deployment...\n');
    // Don't fail the build if migration fails
    // The app can still deploy, migrations can be run manually if needed
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run migration with timeout
const migrationTimeout = setTimeout(() => {
  console.log('⚠️  Migration timeout - continuing with deployment');
  process.exit(0);
}, 45000); // 45 second timeout

runMigration()
  .then(() => {
    clearTimeout(migrationTimeout);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(migrationTimeout);
    console.error('⚠️  Migration script error:', error.message);
    process.exit(0); // Don't fail the build
  });
