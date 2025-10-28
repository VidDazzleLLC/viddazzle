/**
 * Quota Management System
 *
 * Protects lifetime deal credits by:
 * - Tracking usage across all platforms
 * - Warning at 80% usage
 * - Auto-pausing at 100%
 * - Monthly automatic reset
 * - Detailed usage analytics
 */

import { query } from '@/lib/database';

// ============================================
// QUOTA LIMITS CONFIGURATION
// ============================================

/**
 * Configure YOUR specific lifetime deal limits here
 * Edit these values to match your exact tier/plan
 */
export const QUOTA_LIMITS = {
  // Blastable.com - Email Campaigns
  blastable: {
    monthly_sends: process.env.BLASTABLE_MONTHLY_LIMIT || 100000, // Your tier's monthly send limit
    monthly_contacts: process.env.BLASTABLE_CONTACT_LIMIT || 100000, // Your contact limit
    enabled: true,
  },

  // Albato.com - Automations
  albato: {
    monthly_operations: process.env.ALBATO_MONTHLY_LIMIT || 150000, // Tier 3 = 150k, Tier 4 = 250k
    cost_per_extra: 0.0015, // Cost if you go over (for tracking only)
    enabled: true,
  },

  // Aitable.ai - CRM
  aitable: {
    monthly_ai_credits: process.env.AITABLE_MONTHLY_LIMIT || 2000, // Your tier's AI credits
    gpt35_cost: 1, // GPT-3.5 query costs 1 credit
    gpt4_cost: 20, // GPT-4 query costs 20 credits
    enabled: true,
  },

  // Muraena.ai - B2B Leads
  muraena: {
    monthly_credits: process.env.MURAENA_MONTHLY_LIMIT || 10000, // Business plan = 10k
    cost_per_reveal: 1, // Each contact reveal = 1 credit
    search_unlimited: true, // Search doesn't use credits
    enabled: true,
  },

  // Twitter/X API
  twitter: {
    monthly_tweets: process.env.TWITTER_MONTHLY_LIMIT || 50000, // Your app's limit
    rate_limit_posts_per_hour: 300, // Standard limit
    rate_limit_searches_per_hour: 450, // Standard limit
    enabled: true,
  },

  // Autopilot - Workflow Command API
  autopilot: {
    commands: process.env.AUTOPILOT_MONTHLY_LIMIT || 1000, // Monthly command limit
    cost_per_command: 0.40, // Estimated cost per Claude Opus 4 call (for tracking only)
    enabled: true,
  },

  // Warning thresholds (percentage)
  warning_threshold: 0.80, // Warn at 80%
  pause_threshold: 1.0, // Auto-pause at 100%
};

// ============================================
// QUOTA TRACKING & ENFORCEMENT
// ============================================

/**
 * Initialize quota tracking table in database
 */
export async function initializeQuotaTracking() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS quota_tracking (
      id SERIAL PRIMARY KEY,
      platform VARCHAR(50) NOT NULL,
      usage_type VARCHAR(50) NOT NULL,
      usage_count INTEGER DEFAULT 0,
      month_year VARCHAR(7) NOT NULL, -- Format: "2025-01"
      last_updated TIMESTAMP DEFAULT NOW(),
      warnings_sent INTEGER DEFAULT 0,
      is_paused BOOLEAN DEFAULT FALSE,
      UNIQUE(platform, usage_type, month_year)
    );

    -- Performance indexes for common query patterns
    -- Note: UNIQUE constraint on (platform, usage_type, month_year) already creates a composite index

    -- Index 1: Quick lookup of current month's data (used in most queries)
    CREATE INDEX IF NOT EXISTS idx_quota_month ON quota_tracking(month_year);

    -- Index 2: Platform-specific queries (used in getQuotaStatus)
    CREATE INDEX IF NOT EXISTS idx_quota_platform ON quota_tracking(platform);

    -- Index 3: Fast lookup of paused quotas (used in checkPlatformAvailable - runs on EVERY API call)
    CREATE INDEX IF NOT EXISTS idx_quota_paused_month ON quota_tracking(is_paused, month_year)
    WHERE is_paused = TRUE;

    -- Index 4: Time-series analytics (used in dashboard and historical queries)
    CREATE INDEX IF NOT EXISTS idx_quota_month_updated ON quota_tracking(month_year, last_updated DESC);

    -- Index 5: Usage analytics (for finding high-usage platforms quickly)
    CREATE INDEX IF NOT EXISTS idx_quota_usage_count ON quota_tracking(usage_count DESC)
    WHERE usage_count > 0;

    -- Index 6: Warning status lookup (for finding platforms near limits)
    CREATE INDEX IF NOT EXISTS idx_quota_warnings ON quota_tracking(month_year, warnings_sent)
    WHERE warnings_sent > 0;
  `;

  try {
    await query(createTableQuery);
    console.log('✅ Quota tracking initialized with performance indexes');
  } catch (error) {
    console.error('Error initializing quota tracking:', error);
  }
}

/**
 * Get current month-year string
 */
function getCurrentMonthYear() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Track a platform usage
 */
export async function trackUsage(platform, usageType, count = 1) {
  const monthYear = getCurrentMonthYear();

  try {
    // Insert or update usage count
    const upsertQuery = `
      INSERT INTO quota_tracking (platform, usage_type, usage_count, month_year, last_updated)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (platform, usage_type, month_year)
      DO UPDATE SET
        usage_count = quota_tracking.usage_count + $3,
        last_updated = NOW()
      RETURNING usage_count, is_paused;
    `;

    const result = await query(upsertQuery, [platform, usageType, count, monthYear]);
    const { usage_count, is_paused } = result.rows[0];

    // Check if paused
    if (is_paused) {
      throw new Error(`Platform ${platform} is paused due to quota limit. Wait for monthly reset.`);
    }

    // Check quota and warn/pause if needed
    await checkQuotaLimits(platform, usageType, usage_count);

    return { success: true, current_usage: usage_count };
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * Check if usage has hit warning or pause thresholds
 */
async function checkQuotaLimits(platform, usageType, currentUsage) {
  const platformConfig = QUOTA_LIMITS[platform];
  if (!platformConfig || !platformConfig.enabled) return;

  // Get the limit for this usage type
  let limit;
  switch (platform) {
    case 'blastable':
      limit = usageType === 'sends' ? platformConfig.monthly_sends : platformConfig.monthly_contacts;
      break;
    case 'albato':
      limit = platformConfig.monthly_operations;
      break;
    case 'aitable':
      limit = platformConfig.monthly_ai_credits;
      break;
    case 'muraena':
      limit = platformConfig.monthly_credits;
      break;
    case 'twitter':
      limit = platformConfig.monthly_tweets;
      break;
    case 'autopilot':
      limit = platformConfig.commands;
      break;
    default:
      return;
  }

  const usagePercent = currentUsage / limit;
  const monthYear = getCurrentMonthYear();

  // PAUSE at 100%
  if (usagePercent >= QUOTA_LIMITS.pause_threshold) {
    await query(
      `UPDATE quota_tracking
       SET is_paused = TRUE
       WHERE platform = $1 AND usage_type = $2 AND month_year = $3`,
      [platform, usageType, monthYear]
    );

    throw new Error(
      `🚨 QUOTA LIMIT REACHED: ${platform} ${usageType} is at ${currentUsage}/${limit} (100%). ` +
      `Auto-paused until monthly reset. Your lifetime credits are protected!`
    );
  }

  // WARN at 80%
  if (usagePercent >= QUOTA_LIMITS.warning_threshold) {
    const warningResult = await query(
      `SELECT warnings_sent FROM quota_tracking
       WHERE platform = $1 AND usage_type = $2 AND month_year = $3`,
      [platform, usageType, monthYear]
    );

    const warningsSent = warningResult.rows[0]?.warnings_sent || 0;

    // Send warning only once per threshold crossing
    if (warningsSent === 0 || (usagePercent >= 0.90 && warningsSent === 1)) {
      console.warn(
        `⚠️  QUOTA WARNING: ${platform} ${usageType} at ${currentUsage}/${limit} (${Math.round(usagePercent * 100)}%)`
      );

      await query(
        `UPDATE quota_tracking
         SET warnings_sent = warnings_sent + 1
         WHERE platform = $1 AND usage_type = $2 AND month_year = $3`,
        [platform, usageType, monthYear]
      );

      // You could send email/Slack notification here
      // await sendQuotaWarning(platform, usageType, currentUsage, limit);
    }
  }
}

/**
 * Get quota status for a platform
 */
export async function getQuotaStatus(platform = null) {
  const monthYear = getCurrentMonthYear();

  let queryText;
  let params;

  if (platform) {
    queryText = `
      SELECT * FROM quota_tracking
      WHERE platform = $1 AND month_year = $2
      ORDER BY usage_type;
    `;
    params = [platform, monthYear];
  } else {
    queryText = `
      SELECT * FROM quota_tracking
      WHERE month_year = $1
      ORDER BY platform, usage_type;
    `;
    params = [monthYear];
  }

  const result = await query(queryText, params);

  // Enrich with limit information
  const statusData = result.rows.map(row => {
    const platformConfig = QUOTA_LIMITS[row.platform];
    let limit = 0;

    if (platformConfig) {
      switch (row.platform) {
        case 'blastable':
          limit = row.usage_type === 'sends' ? platformConfig.monthly_sends : platformConfig.monthly_contacts;
          break;
        case 'albato':
          limit = platformConfig.monthly_operations;
          break;
        case 'aitable':
          limit = platformConfig.monthly_ai_credits;
          break;
        case 'muraena':
          limit = platformConfig.monthly_credits;
          break;
        case 'twitter':
          limit = platformConfig.monthly_tweets;
          break;
        case 'autopilot':
          limit = platformConfig.commands;
          break;
      }
    }

    const usagePercent = limit > 0 ? (row.usage_count / limit) * 100 : 0;

    return {
      ...row,
      limit,
      usage_percent: usagePercent.toFixed(2),
      remaining: Math.max(0, limit - row.usage_count),
      status: row.is_paused
        ? 'paused'
        : usagePercent >= 90
        ? 'critical'
        : usagePercent >= 80
        ? 'warning'
        : 'healthy',
    };
  });

  return statusData;
}

/**
 * Get comprehensive dashboard data
 */
export async function getQuotaDashboard() {
  const allStatus = await getQuotaStatus();

  const dashboard = {
    month_year: getCurrentMonthYear(),
    platforms: {},
    overall_health: 'healthy',
    critical_platforms: [],
  };

  // Group by platform
  for (const status of allStatus) {
    if (!dashboard.platforms[status.platform]) {
      dashboard.platforms[status.platform] = {
        enabled: QUOTA_LIMITS[status.platform]?.enabled || false,
        usage_types: {},
      };
    }

    dashboard.platforms[status.platform].usage_types[status.usage_type] = {
      current: status.usage_count,
      limit: status.limit,
      percentage: status.usage_percent,
      remaining: status.remaining,
      status: status.status,
      is_paused: status.is_paused,
    };

    // Track critical platforms
    if (status.status === 'critical' || status.is_paused) {
      dashboard.critical_platforms.push(`${status.platform}:${status.usage_type}`);
      dashboard.overall_health = 'critical';
    } else if (status.status === 'warning' && dashboard.overall_health === 'healthy') {
      dashboard.overall_health = 'warning';
    }
  }

  return dashboard;
}

/**
 * Check if platform is available before API call
 * Returns structured response instead of throwing to allow graceful handling
 */
export async function checkPlatformAvailable(platform, usageType) {
  const monthYear = getCurrentMonthYear();

  try {
    const result = await query(
      `SELECT is_paused, usage_count FROM quota_tracking
       WHERE platform = $1 AND usage_type = $2 AND month_year = $3`,
      [platform, usageType, monthYear]
    );

    // Get platform limits
    const platformConfig = QUOTA_LIMITS[platform];
    let limit = 0;

    if (platformConfig) {
      switch (platform) {
        case 'blastable':
          limit = usageType === 'sends' ? platformConfig.monthly_sends : platformConfig.monthly_contacts;
          break;
        case 'albato':
          limit = platformConfig.monthly_operations;
          break;
        case 'aitable':
          limit = platformConfig.monthly_ai_credits;
          break;
        case 'muraena':
          limit = platformConfig.monthly_credits;
          break;
        case 'twitter':
          limit = platformConfig.monthly_tweets;
          break;
        case 'autopilot':
          limit = platformConfig?.commands || 1000; // Default limit
          break;
        default:
          // Unknown platform - allow by default
          return {
            available: true,
            message: 'Quota tracking not configured for this platform',
          };
      }
    }

    if (result.rows.length > 0) {
      const { is_paused, usage_count } = result.rows[0];

      if (is_paused) {
        return {
          available: false,
          message: `Platform ${platform} (${usageType}) is currently paused due to quota limits. Monthly reset occurs on the 1st of each month.`,
          usage: {
            current: usage_count,
            limit: limit,
            percentage: limit > 0 ? Math.round((usage_count / limit) * 100) : 0,
          },
        };
      }

      // Platform exists and is not paused
      return {
        available: true,
        message: 'Quota available',
        usage: {
          current: usage_count,
          limit: limit,
          remaining: Math.max(0, limit - usage_count),
          percentage: limit > 0 ? Math.round((usage_count / limit) * 100) : 0,
        },
      };
    }

    // First use - no tracking record yet
    return {
      available: true,
      message: 'First usage for this period',
      usage: {
        current: 0,
        limit: limit,
        remaining: limit,
        percentage: 0,
      },
    };

  } catch (error) {
    console.error('Error checking platform availability:', error);
    // On error, allow the request (fail open for better UX)
    return {
      available: true,
      message: 'Could not check quota status, allowing request',
      error: error.message,
    };
  }
}

/**
 * Manually reset quotas (for testing or emergency)
 */
export async function resetQuotas(platform = null) {
  const monthYear = getCurrentMonthYear();

  let resetQuery;
  let params;

  if (platform) {
    resetQuery = `
      UPDATE quota_tracking
      SET usage_count = 0, is_paused = FALSE, warnings_sent = 0, last_updated = NOW()
      WHERE platform = $1 AND month_year = $2
      RETURNING *;
    `;
    params = [platform, monthYear];
  } else {
    resetQuery = `
      UPDATE quota_tracking
      SET usage_count = 0, is_paused = FALSE, warnings_sent = 0, last_updated = NOW()
      WHERE month_year = $1
      RETURNING *;
    `;
    params = [monthYear];
  }

  const result = await query(resetQuery, params);

  console.log(`✅ Reset ${result.rowCount} quota entries for ${platform || 'all platforms'}`);

  return {
    success: true,
    reset_count: result.rowCount,
    platform: platform || 'all',
  };
}

/**
 * Get historical usage data
 */
export async function getHistoricalUsage(months = 6) {
  const historicalQuery = `
    SELECT * FROM quota_tracking
    ORDER BY month_year DESC, platform, usage_type
    LIMIT $1;
  `;

  const result = await query(historicalQuery, [months * 20]); // Approximate rows

  return result.rows;
}

// ============================================
// AUTOMATIC MONTHLY RESET (Cron Job)
// ============================================

/**
 * Automatic monthly reset function
 * Should be called by a cron job on the 1st of each month
 */
export async function performMonthlyReset() {
  const currentMonth = getCurrentMonthYear();

  console.log(`🔄 Performing monthly quota reset for ${currentMonth}`);

  // Reset all quotas for the new month
  // This doesn't delete old data, just ensures new month starts fresh
  const result = await resetQuotas();

  console.log(`✅ Monthly reset complete: ${result.reset_count} platforms reset`);

  return result;
}

// Initialize on module load
if (process.env.NODE_ENV !== 'test') {
  initializeQuotaTracking().catch(console.error);
}
