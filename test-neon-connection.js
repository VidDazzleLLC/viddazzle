#!/usr/bin/env node

/**
 * Neon PostgreSQL Database Connection Test Script
 *
 * This script tests the connection to Neon PostgreSQL database
 * and verifies the database is accessible.
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

console.log('🔍 Testing Neon PostgreSQL Database Connection...\n');
console.log(`📍 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

// Create connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  let client;
  let allTestsPassed = true;

  try {
    // Test 1: Basic connection
    console.log('1️⃣  Testing basic connection...');
    client = await pool.connect();
    console.log('   ✅ Successfully connected to Neon PostgreSQL\n');

    // Test 2: Check database version
    console.log('2️⃣  Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log(`   ✅ ${versionResult.rows[0].version.split(',')[0]}\n`);

    // Test 3: Check pgvector extension
    console.log('3️⃣  Checking pgvector extension...');
    const extResult = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'"
    );
    if (extResult.rows.length > 0) {
      console.log('   ✅ pgvector extension is installed\n');
    } else {
      console.log('   ⚠️  pgvector extension is NOT installed (will be installed during schema setup)\n');
    }

    // Test 4: List existing tables
    console.log('4️⃣  Checking existing tables...');
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    if (tablesResult.rows.length > 0) {
      console.log('   ✅ Found existing tables:');
      tablesResult.rows.forEach(row => {
        console.log(`      - ${row.tablename}`);
      });
    } else {
      console.log('   ℹ️  No tables found (schema will be created next)');
    }
    console.log();

    // Test 5: Test write permission
    console.log('5️⃣  Testing write permissions...');
    try {
      await client.query('CREATE TEMP TABLE test_write (id SERIAL PRIMARY KEY, test_col TEXT)');
      await client.query("INSERT INTO test_write (test_col) VALUES ('test')");
      const writeTest = await client.query('SELECT * FROM test_write');
      if (writeTest.rows.length > 0) {
        console.log('   ✅ Write permissions verified\n');
      }
    } catch (err) {
      console.log(`   ❌ Write permission test failed: ${err.message}\n`);
      allTestsPassed = false;
    }

    // Final summary
    console.log('='.repeat(60));
    if (allTestsPassed) {
      console.log('✅ Neon PostgreSQL connection is working perfectly!');
      console.log('🎉 Ready to set up database schema!');
    } else {
      console.log('⚠️  Connection works but some tests failed');
      console.log('Please review the errors above.');
    }
    console.log('='.repeat(60));

  } catch (err) {
    console.error('\n❌ Connection failed:');
    console.error(`   Error: ${err.message}`);
    if (err.code) {
      console.error(`   Code: ${err.code}`);
    }
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your DATABASE_URL is correct');
    console.error('   2. Check that your Neon project is active');
    console.error('   3. Ensure your IP is allowed (Neon allows all by default)');
    console.error('   4. Verify your internet connection');
    allTestsPassed = false;
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run the test
testConnection();
