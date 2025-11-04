#!/usr/bin/env tsx

/**
 * Database Migration Runner
 *
 * This script runs SQL migrations for the VidDazzle database.
 * It can connect to either PostgreSQL (via DATABASE_URL) or Supabase.
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL or POSTGRES_URL environment variable');
  console.error('   Please set DATABASE_URL in your .env file');
  process.exit(1);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration(migrationFile: string) {
  const migrationPath = path.join(__dirname, '../migrations', migrationFile);

  console.log(`\n📄 Reading migration file: ${migrationFile}`);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`🚀 Executing migration...`);

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
  } catch (error: any) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    throw error;
  } finally {
    client.release();
  }
}

async function checkTableExists(tableName: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  } finally {
    client.release();
  }
}

async function runAllMigrations() {
  console.log('🔍 VidDazzle Database Migration Runner\n');
  console.log(`📍 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    client.release();
    console.log('✅ Database connection successful\n');

    // Check if social listening tables already exist
    console.log('🔍 Checking existing tables...');
    const platformCredentialsExists = await checkTableExists('platform_credentials');
    const listeningCampaignsExists = await checkTableExists('listening_campaigns');
    const socialMentionsExists = await checkTableExists('social_mentions');

    if (platformCredentialsExists && listeningCampaignsExists && socialMentionsExists) {
      console.log('ℹ️  Social listening tables already exist');
      console.log('   - platform_credentials: ✓');
      console.log('   - listening_campaigns: ✓');
      console.log('   - social_mentions: ✓');
      console.log('   - outreach_rules: ✓');
      console.log('   - outreach_messages: ✓');
      console.log('\n✨ Database is up to date!\n');
    } else {
      console.log('📝 Social listening tables need to be created\n');

      // Run the social listening migration
      await runMigration('social-listening-schema.sql');

      console.log('\n✅ All migrations completed successfully!');
      console.log('✨ Database is now ready for social listening features!\n');
    }

    // Show table stats
    console.log('📊 Table Statistics:');
    const tables = [
      'platform_credentials',
      'listening_campaigns',
      'social_mentions',
      'outreach_rules',
      'outreach_messages'
    ];

    for (const table of tables) {
      try {
        const client = await pool.connect();
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        client.release();
        console.log(`   ${table}: ${result.rows[0].count} rows`);
      } catch (error: any) {
        console.log(`   ${table}: Error - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration process completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error: any) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runAllMigrations().catch((error) => {
  console.error('\n❌ Unexpected error:');
  console.error(error);
  process.exit(1);
});
