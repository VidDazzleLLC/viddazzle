#!/usr/bin/env node

/**
 * Neon PostgreSQL Schema Setup Script
 *
 * This script sets up the complete database schema for VidDazzle
 * on Neon PostgreSQL database.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });
dotenv.config({ path: resolve(__dirname, '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL environment variable');
  process.exit(1);
}

console.log('🔧 Setting up Neon PostgreSQL Database Schema...\n');
console.log(`📍 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 10000,
});

async function setupSchema() {
  let client;

  try {
    console.log('1️⃣  Connecting to database...');
    client = await pool.connect();
    console.log('   ✅ Connected successfully\n');

    // Read the complete schema file
    console.log('2️⃣  Loading schema file...');
    const schemaPath = resolve(__dirname, 'supabase/complete-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    console.log('   ✅ Schema file loaded\n');

    // Execute the schema
    console.log('3️⃣  Executing schema SQL...');
    console.log('   ⏳ This may take a moment...\n');

    await client.query(schema);

    console.log('   ✅ Schema executed successfully\n');

    // Verify tables were created
    console.log('4️⃣  Verifying tables...');
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length > 0) {
      console.log('   ✅ Tables created successfully:');
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.tablename}`);
      });
    } else {
      console.log('   ⚠️  No tables found after schema execution');
    }
    console.log();

    // Verify extensions
    console.log('5️⃣  Verifying extensions...');
    const extResult = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'vector')
      ORDER BY extname
    `);

    if (extResult.rows.length > 0) {
      console.log('   ✅ Extensions installed:');
      extResult.rows.forEach(row => {
        console.log(`      - ${row.extname} (version ${row.extversion})`);
      });
    }
    console.log();

    // Verify functions
    console.log('6️⃣  Verifying functions...');
    const funcResult = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('match_tutorial_embeddings', 'update_updated_at_column')
      ORDER BY routine_name
    `);

    if (funcResult.rows.length > 0) {
      console.log('   ✅ Functions created:');
      funcResult.rows.forEach(row => {
        console.log(`      - ${row.routine_name}()`);
      });
    }
    console.log();

    console.log('='.repeat(60));
    console.log('✅ Database schema setup completed successfully!');
    console.log('🎉 Your Neon PostgreSQL database is ready to use!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n❌ Schema setup failed:');
    console.error(`   Error: ${err.message}`);
    if (err.code) {
      console.error(`   Code: ${err.code}`);
    }
    console.error('\n📋 Details:');
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the setup
setupSchema();
