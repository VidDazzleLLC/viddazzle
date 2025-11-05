#!/usr/bin/env node

/**
 * Database Initialization Script
 * Runs automatically during deployment to ensure database is set up
 *
 * This script is idempotent - safe to run multiple times
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('🔧 Database Initialization Script');
console.log('='.repeat(60));

if (!databaseUrl) {
  console.log('⚠️  No DATABASE_URL configured');
  console.log('ℹ️  Skipping database initialization');
  console.log('='.repeat(60));
  process.exit(0); // Exit successfully - not an error
}

console.log(`📡 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function initializeDatabase() {
  let client;

  try {
    // Step 1: Connect
    console.log('\n1️⃣  Connecting to database...');
    client = await pool.connect();
    console.log('   ✅ Connected successfully');

    // Step 2: Check if already initialized
    console.log('\n2️⃣  Checking existing tables...');
    const existingTablesResult = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('workflows', 'workflow_executions', 'tutorial_embeddings')
    `);

    const existingCount = parseInt(existingTablesResult.rows[0].count);

    if (existingCount >= 3) {
      console.log('   ✅ Database already initialized');
      console.log('   ℹ️  Skipping schema execution (tables exist)');
      console.log('\n' + '='.repeat(60));
      console.log('✅ Database is ready');
      console.log('='.repeat(60));
      process.exit(0);
    }

    console.log('   ℹ️  Database needs initialization');

    // Step 3: Load schema
    console.log('\n3️⃣  Loading schema file...');
    const schemaPath = resolve(process.cwd(), 'supabase/complete-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    console.log(`   ✅ Schema loaded (${schema.length} bytes)`);

    // Step 4: Execute schema
    console.log('\n4️⃣  Executing schema...');
    console.log('   ⏳ This may take a moment...');
    await client.query(schema);
    console.log('   ✅ Schema executed successfully');

    // Step 5: Verify
    console.log('\n5️⃣  Verifying installation...');

    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    console.log(`   ✅ Created ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`      - ${row.tablename}`);
    });

    const extResult = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'vector')
    `);

    if (extResult.rows.length > 0) {
      console.log('\n   ✅ Installed extensions:');
      extResult.rows.forEach(row => {
        console.log(`      - ${row.extname} (v${row.extversion})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database initialization completed successfully!');
    console.log('='.repeat(60));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database initialization failed');
    console.error(`   Error: ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 The database server is not accessible');
    } else if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error('\n💡 Cannot resolve database hostname (DNS issue)');
      console.error('   This is usually a network/environment issue');
      console.error('   The database will auto-initialize when the app starts');
    }

    console.error('\n='.repeat(60));

    // Don't fail the build for DNS issues - let the app handle it
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.log('⚠️  Exiting with success - app will retry on startup');
      process.exit(0);
    }

    process.exit(1);

  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run initialization
initializeDatabase();
