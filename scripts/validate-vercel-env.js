#!/usr/bin/env node

/**
 * Validates environment variables for Vercel deployment
 * Specifically checks for common DATABASE_URL misconfiguration issues
 *
 * Usage:
 *   npm run validate:env
 *   DATABASE_URL="..." node scripts/validate-vercel-env.js
 */

const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Validating Vercel environment configuration...\n');

// Check 1: DATABASE_URL exists
if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL is not set');
  console.error('');
  console.error('   Database connection will fail without this variable.');
  console.error('');
  console.error('   Solution:');
  console.error('   1. Set DATABASE_URL in your .env file (local)');
  console.error('   2. Set DATABASE_URL in Vercel Dashboard (production)');
  console.error('');
  process.exit(1);
}

// Check 2: Railway internal hostname
if (databaseUrl.includes('railway.internal') || databaseUrl.includes('postgres.railway.internal')) {
  console.error('❌ CRITICAL ERROR: DATABASE_URL uses Railway internal hostname');
  console.error('');
  console.error(`   Current URL: ${databaseUrl.split('@')[1]?.split('/')[0] || 'railway.internal'}`);
  console.error('');
  console.error('   ⚠️  This will FAIL on Vercel deployments! ⚠️');
  console.error('');
  console.error('   Railway internal hostnames (like postgres.railway.internal) only work');
  console.error('   within Railway\'s private network. Vercel cannot access them.');
  console.error('');
  console.error('   Solution:');
  console.error('   1. Use Railway\'s EXTERNAL URL instead:');
  console.error('      - Format: postgresql://...@<random>.proxy.rlwy.net:12345/railway');
  console.error('      - Or: postgresql://...@containers-us-west-xxx.railway.app:5432/railway');
  console.error('');
  console.error('   2. OR use a different database provider:');
  console.error('      - Neon PostgreSQL (recommended)');
  console.error('      - Supabase PostgreSQL');
  console.error('      - Vercel Postgres');
  console.error('');
  console.error('   See: docs/VERCEL_DATABASE_FIX.md');
  console.error('');
  process.exit(1);
}

// Check 3: Localhost
if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  console.error('❌ ERROR: DATABASE_URL uses localhost');
  console.error('');
  console.error('   Localhost URLs only work on your local machine.');
  console.error('   Vercel deployments need a publicly accessible database.');
  console.error('');
  console.error('   Solution:');
  console.error('   1. Use a cloud database provider:');
  console.error('      - Neon PostgreSQL (recommended)');
  console.error('      - Supabase');
  console.error('      - Railway (external URL)');
  console.error('      - Vercel Postgres');
  console.error('');
  process.exit(1);
}

// Check 4: Basic URL format validation
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.warn('⚠️  WARNING: DATABASE_URL does not start with postgresql:// or postgres://');
  console.warn('');
  console.warn(`   Current value: ${databaseUrl.substring(0, 20)}...`);
  console.warn('');
  console.warn('   This might be incorrect. PostgreSQL connection strings should start with:');
  console.warn('   - postgresql://... (preferred)');
  console.warn('   - postgres://... (also valid)');
  console.warn('');
}

// Check 5: Verify it includes required components
const urlPattern = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
const match = databaseUrl.match(urlPattern);

if (!match) {
  console.warn('⚠️  WARNING: DATABASE_URL format may be incomplete');
  console.warn('');
  console.warn('   Expected format:');
  console.warn('   postgresql://username:password@host:port/database');
  console.warn('');
  console.warn('   Current URL structure may be missing components.');
  console.warn('');
}

// Check 6: Common cloud providers (informational)
const provider = detectProvider(databaseUrl);
if (provider) {
  console.log(`✅ DATABASE_URL detected: ${provider}`);
} else {
  console.log('✅ DATABASE_URL format appears valid');
}

// Check 7: SSL mode recommendation for production
if (!databaseUrl.includes('sslmode=')) {
  console.warn('');
  console.warn('💡 TIP: Consider adding SSL mode for production security:');
  console.warn('   Add to your DATABASE_URL: ?sslmode=require');
  console.warn('');
}

console.log('');
console.log('✅ DATABASE_URL validation passed!');
console.log('');
console.log('   Your database configuration is compatible with Vercel deployment.');
console.log('');

process.exit(0);

// Helper: Detect database provider
function detectProvider(url) {
  if (url.includes('neon.tech')) return 'Neon PostgreSQL';
  if (url.includes('supabase.co')) return 'Supabase';
  if (url.includes('railway.app')) return 'Railway (external)';
  if (url.includes('proxy.rlwy.net')) return 'Railway (external)';
  if (url.includes('vercel-storage')) return 'Vercel Postgres';
  if (url.includes('amazonaws.com') && url.includes('rds')) return 'AWS RDS';
  if (url.includes('azure.com')) return 'Azure Database';
  if (url.includes('googleapis.com')) return 'Google Cloud SQL';
  return null;
}
