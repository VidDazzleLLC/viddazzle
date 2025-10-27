/**
 * Social Automation Configuration API
 *
 * Manages automation settings for social listening:
 * - GET: Load current settings
 * - POST: Save new settings
 *
 * Settings control automation mode, volume limits, lead filters, platform selection, etc.
 */

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Validate DATABASE_URL exists
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not configured');
    return res.status(500).json({
      success: false,
      error: 'Database not configured',
      message: 'DATABASE_URL environment variable is missing',
    });
  }

  let sql;
  try {
    sql = neon(databaseUrl);
  } catch (dbError) {
    console.error('❌ Failed to connect to database:', dbError);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: dbError.message,
    });
  }

  try {
    // GET - Load current settings
    if (req.method === 'GET') {
      console.log('📥 Loading automation settings...');

      // Get the most recent settings
      const result = await sql`
        SELECT * FROM social_automation_settings
        ORDER BY updated_at DESC
        LIMIT 1
      `;

      if (result.length === 0) {
        // Return default settings if none exist
        const defaultSettings = {
          mode: 'manual',
          max_posts_per_day: 15,
          max_posts_per_platform: 10,
          min_delay_minutes: 5,
          max_delay_minutes: 15,
          auto_post_threshold: 80,
          enabled_platforms: {
            linkedin: true,
            twitter: false,
            facebook: false,
            reddit: false,
          },
          company_name: '',
          company_solution: '',
          albato_webhook_url: '',
          enable_health_monitoring: true,
          pause_if_low_engagement: true,
          require_approval_warm_leads: true,
        };

        console.log('📝 No settings found, returning defaults');

        return res.status(200).json({
          success: true,
          settings: defaultSettings,
          is_default: true,
        });
      }

      const settings = result[0].settings;

      console.log('✅ Settings loaded:', {
        mode: settings.mode,
        max_posts_per_day: settings.max_posts_per_day,
      });

      return res.status(200).json({
        success: true,
        settings: settings,
        is_default: false,
        updated_at: result[0].updated_at,
      });
    }

    // POST - Save new settings
    if (req.method === 'POST') {
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({
          error: 'Missing required field: settings',
        });
      }

      console.log('💾 Saving automation settings:', {
        mode: settings.mode,
        max_posts_per_day: settings.max_posts_per_day,
      });

      // Validate settings
      if (!['manual', 'semi-auto', 'full-auto'].includes(settings.mode)) {
        return res.status(400).json({
          error: 'Invalid mode. Must be: manual, semi-auto, or full-auto',
        });
      }

      if (settings.max_posts_per_day < 1 || settings.max_posts_per_day > 50) {
        return res.status(400).json({
          error: 'max_posts_per_day must be between 1 and 50',
        });
      }

      if (settings.auto_post_threshold < 60 || settings.auto_post_threshold > 100) {
        return res.status(400).json({
          error: 'auto_post_threshold must be between 60 and 100',
        });
      }

      // Create table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS social_automation_settings (
          id SERIAL PRIMARY KEY,
          settings JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;

      // Insert new settings
      await sql`
        INSERT INTO social_automation_settings (settings, updated_at)
        VALUES (${JSON.stringify(settings)}, NOW())
      `;

      console.log('✅ Settings saved successfully');

      return res.status(200).json({
        success: true,
        message: 'Settings saved successfully',
        settings: settings,
      });
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Method not allowed. Use GET or POST.',
    });

  } catch (error) {
    console.error('❌ Config API error:', error);

    return res.status(500).json({
      success: false,
      error: 'Configuration operation failed',
      message: error.message,
    });
  }
}
