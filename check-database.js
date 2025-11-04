#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');

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

  const results = {
    exists: [],
    missing: []
  };

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist')) {
          results.missing.push(table);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
        }
      } else {
        results.exists.push({ name: table, count: count || 0 });
      }
    } catch (err) {
      results.missing.push(table);
    }
  }

  console.log('✅ EXISTING TABLES:\n');
  if (results.exists.length === 0) {
    console.log('   None found\n');
  } else {
    results.exists.forEach(t => {
      console.log(`   ✓ ${t.name.padEnd(25)} (${t.count} rows)`);
    });
    console.log();
  }

  console.log('❌ MISSING TABLES:\n');
  if (results.missing.length === 0) {
    console.log('   None - database is complete!\n');
  } else {
    results.missing.forEach(t => {
      console.log(`   ✗ ${t}`);
    });
    console.log();
  }

  if (results.missing.length > 0) {
    console.log('🔧 FIX REQUIRED:\n');
    console.log('   Run: node fix-database.js');
    console.log('   Or apply supabase/complete-schema.sql via SQL Editor\n');
  } else {
    console.log('🎉 DATABASE IS COMPLETE!\n');
  }
}

checkDatabase().catch(console.error);
