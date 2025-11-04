/**
 * Google Auth Diagnostic Tool
 *
 * This script tests your Google OAuth configuration with Supabase
 * Run: node scripts/test-google-auth.js
 */

require('dotenv').config({ path: '.env.local' });

async function testGoogleAuth() {
  console.log('\n🔍 Google Auth Configuration Test\n');
  console.log('=' .repeat(50));

  // Check environment variables
  console.log('\n1️⃣ Checking Environment Variables...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing');
    return;
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  }

  if (!supabaseKey) {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    return;
  } else {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: [PRESENT]');
  }

  // Extract project reference
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.log('❌ Could not extract project reference from URL');
    return;
  }

  console.log('✅ Project Reference:', projectRef);

  // Test URLs
  console.log('\n2️⃣ Required Redirect URIs...\n');
  console.log('You need to add these to Supabase Dashboard > Authentication > URL Configuration:');
  console.log('');
  console.log('📝 Site URL:');
  console.log('   http://localhost:3000');
  console.log('');
  console.log('📝 Redirect URLs (add all of these):');
  console.log('   http://localhost:3000/app');
  console.log('   http://localhost:3000/**');
  console.log('');

  // Google OAuth callback
  console.log('\n3️⃣ Google OAuth Configuration...\n');
  console.log('Your Supabase OAuth Callback URL:');
  console.log(`   https://${projectRef}.supabase.co/auth/v1/callback`);
  console.log('');
  console.log('Add this to Google Cloud Console:');
  console.log('   1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   2. Select your OAuth 2.0 Client ID (or create one)');
  console.log('   3. Add to "Authorized redirect URIs":');
  console.log(`      https://${projectRef}.supabase.co/auth/v1/callback`);
  console.log('');

  // Supabase configuration steps
  console.log('\n4️⃣ Supabase Dashboard Configuration...\n');
  console.log('Go to: https://supabase.com/dashboard/project/' + projectRef + '/auth/providers');
  console.log('');
  console.log('Enable Google Provider:');
  console.log('   1. Find "Google" in the providers list');
  console.log('   2. Toggle it ON');
  console.log('   3. Choose one of:');
  console.log('');
  console.log('   Option A - Quick Setup (Development):');
  console.log('      ✓ Just enable the provider');
  console.log('      ✓ Supabase provides default OAuth for testing');
  console.log('      ⚠️  Not recommended for production');
  console.log('');
  console.log('   Option B - Full Setup (Recommended):');
  console.log('      ✓ Go to Google Cloud Console');
  console.log('      ✓ Create OAuth 2.0 credentials');
  console.log('      ✓ Copy Client ID and Client Secret');
  console.log('      ✓ Paste them in Supabase Google provider settings');
  console.log('');

  // Check if running
  console.log('\n5️⃣ Testing App Access...\n');

  try {
    const response = await fetch('http://localhost:3000/login', { method: 'HEAD' });
    if (response.ok) {
      console.log('✅ App is running at http://localhost:3000');
      console.log('');
      console.log('🧪 Test Google Auth:');
      console.log('   1. Go to: http://localhost:3000/login');
      console.log('   2. Click "Sign in with Google"');
      console.log('   3. Check browser console for errors');
    } else {
      console.log('⚠️  App might not be running');
      console.log('   Run: npm run dev');
    }
  } catch (err) {
    console.log('⚠️  App is not running at http://localhost:3000');
    console.log('   Run: npm run dev');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n📚 Full documentation: docs/AUTHENTICATION_SETUP.md\n');
}

// Run the test
testGoogleAuth().catch(console.error);
