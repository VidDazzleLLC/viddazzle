#!/usr/bin/env node

/**
 * Railway Setup Verification Script
 *
 * Checks if all required environment variables are configured
 * for successful Railway deployment.
 */

// Simple color helpers (no external dependencies)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
};

// Required Railway environment variables
const REQUIRED_VARS = {
  critical: [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ],
  important: [
    'CLAUDE_MODEL',
    'NODE_ENV',
    'NEXT_PUBLIC_APP_URL',
    'MCP_TOOLS_ENABLED',
    'MCP_MAX_RETRIES',
    'MCP_TIMEOUT',
    'MAX_WORKFLOW_STEPS',
    'WORKFLOW_TIMEOUT',
    'ENABLE_WORKFLOW_LEARNING',
    'EMBEDDING_MODEL',
    'EMBEDDING_DIMENSION',
  ]
};

// Required GitHub Secrets
const REQUIRED_SECRETS = [
  'RAILWAY_TOKEN',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_NAME',
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

console.log('\n🔍 VidDazzle Railway Setup Verification\n');
console.log('=' .repeat(60));

// Check Critical Variables
console.log('\n📋 CRITICAL Environment Variables:\n');
let criticalMissing = 0;

REQUIRED_VARS.critical.forEach(varName => {
  const exists = !!process.env[varName];
  const status = exists ? colors.green('✅ SET') : colors.red('❌ MISSING');
  console.log(`   ${status}  ${varName}`);
  if (!exists) {
    criticalMissing++;
    if (varName === 'DATABASE_URL') {
      console.log(colors.yellow('      ⚠️  This is causing your deployment failures!'));
    }
  }
});

// Check Important Variables
console.log('\n📋 Important Environment Variables:\n');
let importantMissing = 0;

REQUIRED_VARS.important.forEach(varName => {
  const exists = !!process.env[varName];
  const status = exists ? colors.green('✅ SET') : colors.yellow('⚠️  MISSING');
  console.log(`   ${status}  ${varName}`);
  if (!exists) importantMissing++;
});

// Overall Status
console.log('\n' + '=' .repeat(60));
console.log('\n📊 Setup Status:\n');

if (criticalMissing === 0 && importantMissing === 0) {
  console.log(colors.green('✅ All environment variables are configured!'));
  console.log(colors.green('✅ Your Railway deployment should work correctly.\n'));
} else {
  if (criticalMissing > 0) {
    console.log(colors.red(`❌ ${criticalMissing} CRITICAL variable(s) missing`));
    console.log(colors.red('   Your deployment WILL FAIL without these!\n'));
  }
  if (importantMissing > 0) {
    console.log(colors.yellow(`⚠️  ${importantMissing} important variable(s) missing`));
    console.log(colors.yellow('   Some features may not work correctly.\n'));
  }
}

// Check DATABASE_URL format if it exists
if (process.env.DATABASE_URL) {
  console.log('🔌 Database Connection String:\n');
  const dbUrl = process.env.DATABASE_URL;

  // Parse the connection string
  try {
    const url = new URL(dbUrl);
    console.log(colors.green('   ✅ Format appears valid'));
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port || '5432'}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);

    // Check if it's a Supabase connection
    if (url.hostname.includes('supabase')) {
      console.log(colors.blue('   ℹ️  Using Supabase PostgreSQL'));
    } else if (url.hostname.includes('railway')) {
      console.log(colors.blue('   ℹ️  Using Railway PostgreSQL'));
    }
  } catch (error) {
    console.log(colors.red('   ❌ Invalid connection string format!'));
    console.log(`   Error: ${error.message}`);
  }
  console.log();
}

// GitHub Secrets Check
console.log('=' .repeat(60));
console.log('\n🔐 GitHub Secrets Status:\n');
console.log(colors.yellow('   ℹ️  Cannot verify GitHub Secrets from this script'));
console.log(colors.yellow('   ℹ️  You must manually check these in GitHub Settings\n'));

console.log('   Required GitHub Secrets:');
REQUIRED_SECRETS.forEach(secret => {
  console.log(`      • ${secret}`);
});

console.log('\n   To add GitHub Secrets:');
console.log('   1. Go to GitHub → Settings → Secrets → Actions');
console.log('   2. Click "New repository secret"');
console.log('   3. Add each secret from the list above\n');

// Instructions
console.log('=' .repeat(60));
console.log('\n📖 Next Steps:\n');

if (criticalMissing > 0) {
  console.log(colors.red('🚨 IMMEDIATE ACTION REQUIRED:\n'));
  console.log('1. Read RAILWAY_SETUP_FIX.md for detailed instructions');
  console.log('2. Get your DATABASE_URL from Supabase Dashboard');
  console.log('3. Add DATABASE_URL to Railway environment variables');
  console.log('4. Add all missing variables to Railway');
  console.log('5. Add all GitHub Secrets (see list above)');
  console.log('6. Redeploy and test\n');
} else {
  console.log(colors.green('✅ Environment variables look good!\n'));
  console.log('Next steps:');
  console.log('1. Verify GitHub Secrets are configured');
  console.log('2. Push a commit to test auto-deployment');
  console.log('3. Monitor Railway logs for any issues\n');
}

// Useful Links
console.log('=' .repeat(60));
console.log('\n🔗 Useful Links:\n');
console.log('   Railway Dashboard: https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57');
console.log('   Railway Variables: https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57/service/7269fb20-0d9e-46ad-ac69-3fc5309f65e5/variables');
console.log('   GitHub Actions: https://github.com/VidDazzleLLC/viddazzle/actions');
console.log('   Supabase Dashboard: https://supabase.com/dashboard');
console.log('   Railway Tokens: https://railway.app/account/tokens\n');

console.log('=' .repeat(60));
console.log();
