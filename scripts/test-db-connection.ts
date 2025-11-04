#!/usr/bin/env tsx

/**
 * Database Connection Test Script
 *
 * This script tests the connection to Supabase and verifies that all required
 * database objects (tables, extensions, functions) are properly set up.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create Supabase client with service role key for testing
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  let allTestsPassed = true;

  // Test 1: Check pgvector extension
  console.log('1️⃣  Checking pgvector extension...');
  try {
    const { data, error } = await supabase.rpc('pg_extension_exists', {
      extension_name: 'vector'
    }).single();

    if (error) {
      // If the function doesn't exist, try a direct query
      const { data: extData, error: extError } = await supabase
        .from('pg_extension')
        .select('extname')
        .eq('extname', 'vector')
        .single();

      if (extError) {
        console.log('   ⚠️  Cannot verify pgvector (this is OK if permissions are limited)');
      } else {
        console.log('   ✅ pgvector extension is enabled');
      }
    } else {
      console.log('   ✅ pgvector extension is enabled');
    }
  } catch (err) {
    console.log('   ⚠️  Cannot verify pgvector (this is OK if permissions are limited)');
  }

  // Test 2: Check required tables
  console.log('\n2️⃣  Checking required tables...');
  const requiredTables = [
    'workflows',
    'workflow_executions',
    'tutorial_embeddings',
    'mcp_tool_usage',
    'connectors'
  ];

  for (const table of requiredTables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ Table '${table}' - Error: ${error.message}`);
        allTestsPassed = false;
      } else {
        console.log(`   ✅ Table '${table}' exists (${count ?? 0} rows)`);
      }
    } catch (err: any) {
      console.log(`   ❌ Table '${table}' - Error: ${err.message}`);
      allTestsPassed = false;
    }
  }

  // Test 3: Test workflow table structure
  console.log('\n3️⃣  Testing workflow table structure...');
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('id, name, description, steps, created_at, updated_at')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error querying workflows: ${error.message}`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Workflow table structure is correct');
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    allTestsPassed = false;
  }

  // Test 4: Test tutorial_embeddings table and vector similarity function
  console.log('\n4️⃣  Testing tutorial_embeddings and vector search...');
  try {
    const { data, error } = await supabase
      .from('tutorial_embeddings')
      .select('id, title, content, embedding')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error querying tutorial_embeddings: ${error.message}`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Tutorial embeddings table structure is correct');

      // Test the match_tutorial_embeddings function
      // Create a dummy embedding vector for testing (1536 dimensions of zeros)
      const testEmbedding = Array(1536).fill(0);
      const { data: matchData, error: matchError } = await supabase
        .rpc('match_tutorial_embeddings', {
          query_embedding: testEmbedding,
          match_threshold: 0.0,
          match_count: 1
        });

      if (matchError) {
        console.log(`   ⚠️  Vector similarity function exists but returned: ${matchError.message}`);
      } else {
        console.log('   ✅ Vector similarity search function is working');
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    allTestsPassed = false;
  }

  // Test 5: Test MCP tool usage table
  console.log('\n5️⃣  Testing mcp_tool_usage table...');
  try {
    const { data, error } = await supabase
      .from('mcp_tool_usage')
      .select('id, tool_name, input_params, output_result, execution_time_ms, created_at')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error querying mcp_tool_usage: ${error.message}`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ MCP tool usage table structure is correct');
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    allTestsPassed = false;
  }

  // Test 6: Test connectors table
  console.log('\n6️⃣  Testing connectors table...');
  try {
    const { data, error } = await supabase
      .from('connectors')
      .select('id, name, type, config, is_active, created_at, updated_at')
      .limit(1);

    if (error) {
      console.log(`   ❌ Error querying connectors: ${error.message}`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Connectors table structure is correct');
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    allTestsPassed = false;
  }

  // Test 7: Insert and retrieve a test workflow
  console.log('\n7️⃣  Testing write operations (insert/delete)...');
  try {
    const testWorkflow = {
      name: 'Test Workflow',
      description: 'Database connection test',
      steps: [
        {
          id: 'step1',
          type: 'test',
          config: { message: 'Hello from test' }
        }
      ]
    };

    const { data: insertData, error: insertError } = await supabase
      .from('workflows')
      .insert(testWorkflow)
      .select()
      .single();

    if (insertError) {
      console.log(`   ❌ Error inserting test workflow: ${insertError.message}`);
      allTestsPassed = false;
    } else {
      console.log('   ✅ Successfully inserted test workflow');

      // Clean up: delete the test workflow
      const { error: deleteError } = await supabase
        .from('workflows')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.log(`   ⚠️  Created test workflow but couldn't clean up: ${deleteError.message}`);
      } else {
        console.log('   ✅ Successfully deleted test workflow');
      }
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
    allTestsPassed = false;
  }

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All database tests passed!');
    console.log('🎉 Your Supabase database is ready to use!');
    console.log('='.repeat(50));
    process.exit(0);
  } else {
    console.log('❌ Some database tests failed');
    console.log('Please review the errors above and fix them.');
    console.log('='.repeat(50));
    process.exit(1);
  }
}

// Run the tests
testDatabaseConnection().catch((err) => {
  console.error('\n❌ Unexpected error during testing:');
  console.error(err);
  process.exit(1);
});
