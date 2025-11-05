/**
 * Test all database connections
 */

import { createClient } from '@supabase/supabase-js';

console.log('🔍 Testing Database Connections...\n');

// Test Supabase
async function testSupabase() {
  console.log('📦 Testing Supabase...');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase: Missing credentials\n');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to fetch from a simple table or check auth
    const { data, error } = await supabase.auth.getSession();

    if (error && error.message.includes('fetch')) {
      console.log('❌ Supabase: Network error - cannot reach server');
      console.log(`   URL: ${supabaseUrl}`);
      console.log(`   Error: ${error.message}\n`);
      return false;
    }

    // Try a simple query to verify connection
    const { error: queryError } = await supabase
      .from('workflows')
      .select('count')
      .limit(1);

    if (queryError) {
      if (queryError.message.includes('relation') || queryError.message.includes('does not exist')) {
        console.log('⚠️  Supabase: Connected but tables not set up');
        console.log('   Need to run migrations\n');
        return 'needs_migration';
      }
      console.log('❌ Supabase: Query error');
      console.log(`   ${queryError.message}\n`);
      return false;
    }

    console.log('✅ Supabase: Connected successfully!');
    console.log(`   URL: ${supabaseUrl}\n`);
    return true;
  } catch (err) {
    console.log('❌ Supabase: Connection failed');
    console.log(`   ${err.message}\n`);
    return false;
  }
}

// Test Neon/Postgres
async function testNeonPostgres() {
  console.log('🐘 Testing Neon/PostgreSQL...');

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl) {
    console.log('⚠️  Neon: No DATABASE_URL or POSTGRES_URL configured\n');
    return false;
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    console.log('✅ Neon/PostgreSQL: Connected successfully!');
    console.log(`   Database: ${dbUrl.split('@')[1]?.split('/')[0]}\n`);
    return true;
  } catch (err) {
    console.log('❌ Neon/PostgreSQL: Connection failed');
    console.log(`   ${err.message}\n`);
    return false;
  }
}

// Test Railway (usually via DATABASE_URL)
async function testRailway() {
  console.log('🚂 Testing Railway...');

  const railwayUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

  if (!railwayUrl) {
    console.log('⚠️  Railway: No RAILWAY_DATABASE_URL configured\n');
    return false;
  }

  try {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: railwayUrl,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    console.log('✅ Railway: Connected successfully!');
    console.log(`   Database: ${railwayUrl.split('@')[1]?.split('/')[0]}\n`);
    return true;
  } catch (err) {
    console.log('❌ Railway: Connection failed');
    console.log(`   ${err.message}\n`);
    return false;
  }
}

// Run all tests
async function runTests() {
  const supabaseResult = await testSupabase();
  const neonResult = await testNeonPostgres();
  const railwayResult = await testRailway();

  console.log('📊 Summary:');
  console.log('━'.repeat(50));
  console.log(`Supabase: ${supabaseResult === true ? '✅ Working' : supabaseResult === 'needs_migration' ? '⚠️  Needs Migration' : '❌ Failed'}`);
  console.log(`Neon/Postgres: ${neonResult ? '✅ Working' : '❌ Not Configured'}`);
  console.log(`Railway: ${railwayResult ? '✅ Working' : '❌ Not Configured'}`);
  console.log('━'.repeat(50));

  if (supabaseResult === 'needs_migration') {
    console.log('\n💡 Next steps: Run database migrations for Supabase');
  } else if (!supabaseResult && !neonResult && !railwayResult) {
    console.log('\n⚠️  No working database connection found!');
    console.log('Please configure at least one database:');
    console.log('  - Supabase: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('  - Neon: DATABASE_URL');
    console.log('  - Railway: RAILWAY_DATABASE_URL or DATABASE_URL');
  }
}

runTests().catch(console.error);
