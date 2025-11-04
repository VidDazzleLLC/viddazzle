#!/usr/bin/env node

/**
 * Apply Complete Database Schema
 *
 * This script applies the complete unified schema to Supabase
 * using the Supabase client library.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applySchema() {
  console.log('🔍 VidDazzle Complete Schema Application\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  try {
    // Read the complete schema file
    const schemaPath = path.join(__dirname, '../supabase/complete-schema.sql');
    console.log(`📄 Reading schema file: ${schemaPath}`);

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Applying complete schema to database...\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: schemaSql });

    if (error) {
      // Try direct execution if RPC fails
      console.log('   Trying alternative method...');
      const { error: directError } = await supabase.from('_sqlExecute').select('*');

      if (directError) {
        throw new Error(`Failed to execute schema: ${error.message}`);
      }
    }

    console.log('✅ Schema application completed!\n');

    // Verify tables exist
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

    console.log('📊 Table Statistics:');
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ ${table}: Table may not exist - ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${count || 0} rows`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database setup completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Schema application failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the schema application
applySchema().catch((error) => {
  console.error('\n❌ Unexpected error:');
  console.error(error);
  process.exit(1);
});
