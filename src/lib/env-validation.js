/**
 * Environment Variable Validation
 * Validates required environment variables on application startup
 *
 * This prevents runtime errors due to missing configuration
 */

// Define required environment variables by category
const ENV_REQUIREMENTS = {
  // Critical - App won't work without these
  critical: [
    {
      key: 'DATABASE_URL',
      description: 'PostgreSQL database connection string (Neon)',
      example: 'postgresql://user:pass@host/db',
    },
    {
      key: 'ANTHROPIC_API_KEY',
      description: 'Claude API key for AI features',
      example: 'sk-ant-api03-...',
    },
  ],

  // Important - Some features won't work
  important: [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      description: 'Supabase project URL (for auth)',
      example: 'https://xxx.supabase.co',
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (for admin operations)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  ],

  // Optional - App works without these but with limited functionality
  optional: [
    {
      key: 'TWITTER_API_KEY',
      description: 'Twitter API key (for social listening)',
      example: 'xxx',
    },
    {
      key: 'TWITTER_API_SECRET',
      description: 'Twitter API secret',
      example: 'xxx',
    },
    {
      key: 'TWITTER_BEARER_TOKEN',
      description: 'Twitter Bearer token',
      example: 'xxx',
    },
    {
      key: 'REDDIT_CLIENT_ID',
      description: 'Reddit client ID',
      example: 'xxx',
    },
    {
      key: 'REDDIT_CLIENT_SECRET',
      description: 'Reddit client secret',
      example: 'xxx',
    },
    {
      key: 'LINKEDIN_CLIENT_ID',
      description: 'LinkedIn client ID',
      example: 'xxx',
    },
    {
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      description: 'Sentry DSN for error monitoring',
      example: 'https://xxx@sentry.io/xxx',
    },
  ],

  // Production-only requirements
  production: [
    {
      key: 'NEXT_PUBLIC_APP_URL',
      description: 'Production app URL',
      example: 'https://yourdomain.com',
    },
    {
      key: 'ALLOWED_ORIGINS',
      description: 'Comma-separated list of allowed CORS origins',
      example: 'https://yourdomain.com,https://www.yourdomain.com',
    },
  ],
};

/**
 * Validate environment variables
 */
export function validateEnvironment(options = {}) {
  const {
    exitOnError = false,
    checkProduction = process.env.NODE_ENV === 'production',
    verbose = true,
  } = options;

  const results = {
    valid: true,
    critical: [],
    important: [],
    optional: [],
    production: [],
  };

  if (verbose) {
    console.log('🔍 Validating environment variables...');
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
  }

  // Check critical variables
  for (const env of ENV_REQUIREMENTS.critical) {
    const value = process.env[env.key];
    if (!value) {
      results.valid = false;
      results.critical.push(env);
      if (verbose) {
        console.error(`❌ CRITICAL: ${env.key} is missing`);
        console.error(`   ${env.description}`);
        console.error(`   Example: ${env.example}`);
        console.error('');
      }
    } else if (verbose) {
      console.log(`✅ ${env.key}`);
    }
  }

  // Check important variables
  for (const env of ENV_REQUIREMENTS.important) {
    const value = process.env[env.key];
    if (!value) {
      results.important.push(env);
      if (verbose) {
        console.warn(`⚠️  IMPORTANT: ${env.key} is missing`);
        console.warn(`   ${env.description}`);
        console.warn(`   Some features may not work`);
        console.warn('');
      }
    } else if (verbose) {
      console.log(`✅ ${env.key}`);
    }
  }

  // Check optional variables (only warn if verbose)
  for (const env of ENV_REQUIREMENTS.optional) {
    const value = process.env[env.key];
    if (!value) {
      results.optional.push(env);
      if (verbose) {
        console.log(`ℹ️  OPTIONAL: ${env.key} is not set`);
      }
    } else if (verbose) {
      console.log(`✅ ${env.key}`);
    }
  }

  // Check production-only variables
  if (checkProduction) {
    for (const env of ENV_REQUIREMENTS.production) {
      const value = process.env[env.key];
      if (!value) {
        results.production.push(env);
        if (verbose) {
          console.error(`❌ PRODUCTION: ${env.key} is missing`);
          console.error(`   ${env.description}`);
          console.error(`   Example: ${env.example}`);
          console.error('');
        }
      } else if (verbose) {
        console.log(`✅ ${env.key}`);
      }
    }

    if (results.production.length > 0) {
      results.valid = false;
    }
  }

  // Summary
  if (verbose) {
    console.log('');
    console.log('='.repeat(60));

    if (results.valid) {
      console.log('✅ Environment validation passed');
    } else {
      console.error('❌ Environment validation failed');
      console.error(`   Critical missing: ${results.critical.length}`);
      if (checkProduction) {
        console.error(`   Production missing: ${results.production.length}`);
      }
    }

    if (results.important.length > 0) {
      console.warn(`   Important missing: ${results.important.length}`);
    }

    if (results.optional.length > 0) {
      console.log(`   Optional missing: ${results.optional.length}`);
    }

    console.log('='.repeat(60));
  }

  // Exit if requested and validation failed
  if (exitOnError && !results.valid) {
    console.error('\n⛔ Exiting due to missing critical environment variables\n');
    process.exit(1);
  }

  return results;
}

/**
 * Get documentation for missing variables
 */
export function getMissingVariablesHelp(results) {
  let help = '\n📋 Missing Environment Variables Guide\n\n';

  if (results.critical.length > 0) {
    help += '🚨 CRITICAL (Required):\n';
    for (const env of results.critical) {
      help += `\n${env.key}=${env.example}\n`;
      help += `  ${env.description}\n`;
    }
  }

  if (results.important.length > 0) {
    help += '\n⚠️  IMPORTANT (Recommended):\n';
    for (const env of results.important) {
      help += `\n${env.key}=${env.example}\n`;
      help += `  ${env.description}\n`;
    }
  }

  if (results.production.length > 0) {
    help += '\n🔒 PRODUCTION (Required in production):\n';
    for (const env of results.production) {
      help += `\n${env.key}=${env.example}\n`;
      help += `  ${env.description}\n`;
    }
  }

  help += '\n📖 See .env.example for full configuration\n';

  return help;
}

/**
 * Validate on module load (only in production)
 */
if (process.env.NODE_ENV === 'production' && process.env.VALIDATE_ENV !== 'false') {
  const results = validateEnvironment({ exitOnError: false, verbose: true });

  if (!results.valid) {
    console.error(getMissingVariablesHelp(results));
  }
}

export default {
  validateEnvironment,
  getMissingVariablesHelp,
};
