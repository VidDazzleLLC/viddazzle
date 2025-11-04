#!/usr/bin/env node

/**
 * Fix Database - Apply Complete Schema
 *
 * This script applies the complete unified schema to your Supabase database.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get connection info from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env file');
  process.exit(1);
}

// Extract project ref from Supabase URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project reference from Supabase URL');
  process.exit(1);
}

// Construct direct PostgreSQL connection string
// Supabase connection format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
const connectionString = `postgresql://postgres.${projectRef}:${process.env.DB_PASSWORD || 'ENTER_PASSWORD_HERE'}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('🔍 VidDazzle Database Fixer\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`📍 Region: us-east-1\n`);

if (!process.env.DB_PASSWORD) {
  console.log('⚠️  Database password not set!');
  console.log('\nTo fix your database, you need your Supabase database password.');
  console.log('\nOption 1: Set DB_PASSWORD in your .env file:');
  console.log('   DB_PASSWORD=your_actual_password');
  console.log('\nOption 2: Get password from Supabase Dashboard:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  console.log('   2. Look for "Database password" section');
  console.log('   3. Reset if needed and copy the password');
  console.log('   4. Add DB_PASSWORD=<password> to your .env file');
  console.log('\nOption 3: Use SQL Editor (EASIEST):');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
  console.log('   2. Copy the contents of: supabase/complete-schema.sql');
  console.log('   3. Paste into SQL Editor and click "Run"');
  console.log('\n❌ Exiting. Please set DB_PASSWORD or use the SQL Editor.\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!\n');

    // Read the complete schema
    const schemaPath = path.join(__dirname, 'supabase/complete-schema.sql');
    console.log(`📄 Reading schema: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Applying complete schema...\n');

    // Execute the schema
    await client.query(schemaSql);

    console.log('✅ Schema applied successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...\n');

    const tables = [
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

    console.log('📊 Table Status:');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`   ✅ ${table.padEnd(25)} ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`   ❌ ${table.padEnd(25)} ERROR: ${error.message}`);
      }
    }

    client.release();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 DATABASE IS FIXED!');
    console.log('='.repeat(60));
    console.log('\n✨ Your app should now work properly!\n');

  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 The database password is incorrect.');
      console.error('   Please check your DB_PASSWORD in .env file');
      console.error('   Or reset it in: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Cannot connect to database.');
      console.error('   Check your internet connection and Supabase project status');
    }

    console.error('\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixDatabase();
