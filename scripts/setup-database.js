#!/usr/bin/env node

/**
 * Database Setup CLI Script
 *
 * Run this script to initialize the database:
 *   node scripts/setup-database.js
 *
 * Or from npm:
 *   npm run db:setup
 *
 * Note: This script loads Next.js environment variables automatically
 */

require('dotenv').config({ path: '.env.local' });

const { setupDatabase, isDatabaseInitialized, resetDatabase } = require('../src/lib/db-setup.js');

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset');

  console.log('🔧 Workflow Autopilot - Database Setup\n');

  try {
    // Check current status
    const initialized = await isDatabaseInitialized();
    console.log(`📊 Database status: ${initialized ? '✅ Initialized' : '⚠️  Not initialized'}\n`);

    if (shouldReset) {
      console.log('⚠️  WARNING: Resetting database (all data will be lost)');
      console.log('🔄 Dropping and recreating all tables...\n');
      const result = await resetDatabase();

      if (result.success) {
        console.log('✅ Database reset complete!\n');
        console.log('📋 Tables created:');
        result.tables.forEach(table => console.log(`   - ${table}`));
      } else {
        console.error('❌ Database reset failed!');
        console.error('Errors:', result.errors);
        process.exit(1);
      }
    } else {
      console.log('🚀 Setting up database tables...\n');
      const result = await setupDatabase();

      if (result.success) {
        console.log('✅ Database setup complete!\n');
        console.log('📋 Tables created/verified:');
        result.tables.forEach(table => console.log(`   - ${table}`));
      } else {
        console.error('❌ Database setup failed!');
        console.error('Errors:', result.errors);
        process.exit(1);
      }
    }

    console.log('\n🎉 All done! Your database is ready to use.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
