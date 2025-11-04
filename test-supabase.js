// Quick test script to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can query
    console.log('\n✓ Supabase client created');

    // Test 2: List tables
    const { data: tables, error: tablesError } = await supabase
      .from('workflows')
      .select('*')
      .limit(1);

    if (tablesError) {
      if (tablesError.message.includes('relation "workflows" does not exist')) {
        console.log('\n⚠️  Database tables not found - schema needs to be created');
        console.log('   Run the SQL from supabase/schema.sql in Supabase SQL Editor');
      } else {
        console.error('\n✗ Error querying database:', tablesError.message);
      }
    } else {
      console.log('\n✓ Database connection successful');
      console.log(`✓ Workflows table exists (${tables?.length || 0} records)`);
    }

    // Test 3: Check for pgvector extension
    const { data: extensions, error: extError } = await supabase.rpc('pg_catalog.pg_extension');

  } catch (error) {
    console.error('\n✗ Connection failed:', error.message);
  }
}

testConnection();
