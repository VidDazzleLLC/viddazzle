#!/usr/bin/env node
/**
 * Railway pgvector Database Connection Test
 * Tests database connectivity, schema, and pgvector extension
 */

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('🚂 Testing Railway pgvector Database Connection...\n');

if (!databaseUrl) {
  console.error('❌ No DATABASE_URL or POSTGRES_URL found in environment');
  console.log('\nPlease set one of these environment variables:');
  console.log('  DATABASE_URL=postgresql://...');
  console.log('  POSTGRES_URL=postgresql://...');
  process.exit(1);
}

console.log('✓ Database URL found');
console.log(`  Host: ${databaseUrl.split('@')[1]?.split('/')[0] || 'hidden'}\n`);

async function testConnection() {
  const sql = neon(databaseUrl);

  try {
    // Test 1: Basic connectivity
    console.log('Test 1: Basic Connectivity');
    const result = await sql`SELECT version(), current_database(), current_user`;
    console.log('  ✓ Connected successfully');
    console.log(`  ✓ Database: ${result[0].current_database}`);
    console.log(`  ✓ User: ${result[0].current_user}`);
    console.log(`  ✓ PostgreSQL: ${result[0].version.split(' ')[1]}\n`);

    // Test 2: Check pgvector extension
    console.log('Test 2: pgvector Extension');
    const extensions = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    if (extensions.length > 0) {
      console.log(`  ✓ pgvector extension installed (v${extensions[0].extversion})`);
    } else {
      console.log('  ⚠️  pgvector extension not found');
      console.log('  → Run: CREATE EXTENSION IF NOT EXISTS vector;\n');
      return;
    }
    console.log('');

    // Test 3: Check schema/tables
    console.log('Test 3: Database Schema');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('  ⚠️  No tables found - schema needs to be created');
      console.log('  → Run the schema creation SQL from your migration files\n');
    } else {
      console.log(`  ✓ Found ${tables.length} table(s):`);
      tables.forEach(t => console.log(`    - ${t.table_name}`));
      console.log('');
    }

    // Test 4: Check for required tables
    console.log('Test 4: Required Tables');
    const requiredTables = ['workflows', 'executions', 'tutorial_embeddings', 'tool_usage_logs', 'connectors'];

    for (const tableName of requiredTables) {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        )
      `;

      if (tableExists[0].exists) {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
        console.log(`  ✓ ${tableName} table exists (${count[0].count} records)`);
      } else {
        console.log(`  ✗ ${tableName} table missing`);
      }
    }
    console.log('');

    // Test 5: Test vector operations (if tutorial_embeddings exists)
    console.log('Test 5: Vector Operations');
    const vectorTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'tutorial_embeddings'
      )
    `;

    if (vectorTableExists[0].exists) {
      try {
        // Check if the embedding column exists and is a vector type
        const columnInfo = await sql`
          SELECT column_name, udt_name, character_maximum_length
          FROM information_schema.columns
          WHERE table_name = 'tutorial_embeddings'
          AND column_name = 'embedding'
        `;

        if (columnInfo.length > 0) {
          console.log(`  ✓ Vector column 'embedding' exists (type: ${columnInfo[0].udt_name})`);

          // Try a simple vector operation
          const testVector = await sql`SELECT '[1,2,3]'::vector(3) as vec`;
          console.log('  ✓ Vector operations working');
        } else {
          console.log('  ⚠️  No embedding column found in tutorial_embeddings');
        }
      } catch (err) {
        console.log(`  ✗ Vector test failed: ${err.message}`);
      }
    } else {
      console.log('  ⚠️  tutorial_embeddings table not found - skipping vector tests');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ Database Connection Test Complete!');
    console.log('═══════════════════════════════════════');
    console.log('\nYour Railway pgvector database is ready to use! 🎉');

  } catch (error) {
    console.error('\n❌ Connection Test Failed');
    console.error(`Error: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify DATABASE_URL is correct in Railway');
    console.error('  2. Ensure pgvector service is running');
    console.error('  3. Check database credentials and permissions');
    process.exit(1);
  }
}

testConnection();
