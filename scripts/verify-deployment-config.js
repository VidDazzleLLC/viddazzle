#!/usr/bin/env node

/**
 * Deployment Configuration Verification Script
 *
 * This script helps verify that all necessary environment variables
 * and configurations are in place for automated deployments.
 */

require('dotenv').config();

const chalk = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

console.log('\n' + chalk.bold('🔍 VidDazzle Deployment Configuration Check\n'));

// Check environment variables
const checks = {
  '🔑 Anthropic API': {
    required: true,
    vars: ['ANTHROPIC_API_KEY'],
    docs: 'Get it from https://console.anthropic.com/settings/keys'
  },
  '🗄️  Supabase Configuration': {
    required: true,
    vars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    docs: 'Supabase Dashboard → Settings → API'
  },
  '💾 Database Connection': {
    required: false,
    vars: ['DATABASE_URL', 'DB_PASSWORD'],
    docs: 'Required for automated migrations. Supabase Dashboard → Settings → Database',
    note: 'Optional: Migrations can be run manually if not set'
  },
  '🌐 Social Media APIs': {
    required: false,
    vars: ['TWITTER_API_KEY', 'REDDIT_CLIENT_ID'],
    docs: 'Required only if using social listening features',
    note: 'Optional: Only needed for specific features'
  }
};

let totalRequired = 0;
let totalOptional = 0;
let passedRequired = 0;
let passedOptional = 0;

Object.entries(checks).forEach(([category, config]) => {
  console.log(chalk.bold(`\n${category}`));

  const missing = [];
  const present = [];

  config.vars.forEach(varName => {
    const exists = !!process.env[varName];

    if (config.required) {
      totalRequired++;
      if (exists) passedRequired++;
    } else {
      totalOptional++;
      if (exists) passedOptional++;
    }

    if (exists) {
      present.push(varName);
      const value = process.env[varName];
      const maskedValue = value.length > 20 ? value.substring(0, 8) + '...' + value.substring(value.length - 4) : '***';
      console.log(`  ${chalk.green('✓')} ${varName}: ${maskedValue}`);
    } else {
      missing.push(varName);
      console.log(`  ${chalk.red('✗')} ${varName}: ${chalk.red('NOT SET')}`);
    }
  });

  if (missing.length > 0) {
    console.log(`  ${chalk.yellow('ℹ')}  ${config.docs}`);
    if (config.note) {
      console.log(`  ${chalk.blue('ℹ')}  ${config.note}`);
    }
  }
});

// Summary
console.log('\n' + '─'.repeat(60));
console.log(chalk.bold('\n📊 Summary\n'));

const requiredPercentage = totalRequired > 0 ? Math.round((passedRequired / totalRequired) * 100) : 100;
const optionalPercentage = totalOptional > 0 ? Math.round((passedOptional / totalOptional) * 100) : 100;

console.log(`Required Variables: ${passedRequired}/${totalRequired} (${requiredPercentage}%)`);
console.log(`Optional Variables: ${passedOptional}/${totalOptional} (${optionalPercentage}%)`);

// Overall status
console.log('\n' + '─'.repeat(60));

if (passedRequired === totalRequired) {
  console.log(chalk.green(chalk.bold('\n✅ Ready for deployment!\n')));
  console.log('All required environment variables are configured.');
  console.log('\nNext steps:');
  console.log('1. Set up environment variables in Vercel Dashboard');
  console.log('2. Configure GitHub Actions secrets');
  console.log('3. Push to main branch to trigger deployment');
  console.log('\n📖 See DEPLOYMENT.md for detailed setup instructions\n');
} else {
  console.log(chalk.red(chalk.bold('\n❌ Configuration incomplete\n')));
  console.log(`Missing ${totalRequired - passedRequired} required variable(s).`);
  console.log('\nPlease add the missing variables to your .env file.');
  console.log('Then add them to:');
  console.log('  • Vercel Dashboard → Settings → Environment Variables');
  console.log('  • GitHub Repository → Settings → Secrets → Actions\n');
  console.log('📖 See DEPLOYMENT.md for detailed setup instructions\n');
  process.exit(1);
}

// Check for .env.example
const fs = require('fs');
const path = require('path');

if (fs.existsSync(path.join(__dirname, '../.env.example'))) {
  console.log(chalk.blue('💡 Tip: Copy .env.example to .env to get started'));
  console.log(chalk.blue('   cp .env.example .env\n'));
}

// Deployment readiness checklist
console.log(chalk.bold('🚀 Deployment Readiness Checklist:\n'));

const deploymentChecks = [
  { name: 'Local .env file configured', check: passedRequired === totalRequired },
  { name: 'Vercel project connected', check: false, manual: true },
  { name: 'Vercel environment variables set', check: false, manual: true },
  { name: 'GitHub Actions secrets configured', check: false, manual: true },
  { name: 'Database schema applied', check: false, manual: true },
];

deploymentChecks.forEach(check => {
  if (check.manual) {
    console.log(`  ${chalk.yellow('○')} ${check.name} (manual verification needed)`);
  } else if (check.check) {
    console.log(`  ${chalk.green('✓')} ${check.name}`);
  } else {
    console.log(`  ${chalk.red('✗')} ${check.name}`);
  }
});

console.log('\n📖 Full deployment guide: DEPLOYMENT.md\n');
