/**
 * GDPR Data Export Endpoint
 * Allows users to export all their data as required by GDPR Article 15
 *
 * POST /api/user/export
 * Body: { format: 'json' | 'csv', include: ['workflows', 'products', ...] }
 *
 * Returns: Download link or data directly
 */

import { withAuth } from '@/lib/auth-middleware';
import { rateLimit, RateLimitPresets, combine } from '@/lib/rate-limit';
import { validateSchema } from '@/lib/validation';
import { dataExportSchema } from '@/lib/validation-schemas';
import { query } from '@/lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.user.id;

  // Validate request
  const { format = 'json', include } = req.body;
  const { valid, errors } = validateSchema(req.body, dataExportSchema);

  if (!valid) {
    return res.status(400).json({ error: 'Validation Error', errors });
  }

  try {
    const userData = {
      user: {
        id: userId,
        email: req.user.email,
        created_at: req.user.created_at,
        exported_at: new Date().toISOString(),
      },
      data: {},
    };

    // Determine what to include
    const includeAll = !include || include.length === 0;
    const shouldInclude = (type) => includeAll || include.includes(type);

    // Export workflows
    if (shouldInclude('workflows')) {
      const workflows = await query(
        'SELECT * FROM workflows WHERE user_id = $1',
        [userId]
      );
      userData.data.workflows = workflows.rows;
    }

    // Export workflow executions
    if (shouldInclude('executions')) {
      const executions = await query(
        `SELECT we.* FROM workflow_executions we
         JOIN workflows w ON we.workflow_id = w.id
         WHERE w.user_id = $1`,
        [userId]
      );
      userData.data.executions = executions.rows;
    }

    // Export campaigns
    if (shouldInclude('campaigns')) {
      const campaigns = await query(
        'SELECT * FROM listening_campaigns WHERE user_id = $1',
        [userId]
      );
      userData.data.campaigns = campaigns.rows;
    }

    // Export mentions
    if (shouldInclude('mentions')) {
      const mentions = await query(
        `SELECT sm.* FROM social_mentions sm
         JOIN listening_campaigns lc ON sm.campaign_id = lc.id
         WHERE lc.user_id = $1`,
        [userId]
      );
      userData.data.mentions = mentions.rows;
    }

    // Export saved searches
    if (shouldInclude('searches')) {
      const searches = await query(
        'SELECT * FROM saved_searches WHERE user_id = $1',
        [userId]
      );
      userData.data.searches = searches.rows;
    }

    // Export products
    if (shouldInclude('products')) {
      const products = await query(
        'SELECT * FROM seller_products WHERE user_id = $1',
        [userId]
      );
      userData.data.products = products.rows;
    }

    // Format response
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user-data-${userId}-${Date.now()}.json"`
      );
      return res.status(200).json(userData);
    } else if (format === 'csv') {
      // Simple CSV export (you can enhance this)
      let csv = 'Type,ID,Name,Created At\n';

      // Add workflows
      if (userData.data.workflows) {
        for (const wf of userData.data.workflows) {
          csv += `Workflow,${wf.id},"${wf.name}",${wf.created_at}\n`;
        }
      }

      // Add campaigns
      if (userData.data.campaigns) {
        for (const camp of userData.data.campaigns) {
          csv += `Campaign,${camp.id},"${camp.name}",${camp.created_at}\n`;
        }
      }

      // Add products
      if (userData.data.products) {
        for (const prod of userData.data.products) {
          csv += `Product,${prod.id},"${prod.name}",${prod.created_at}\n`;
        }
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user-data-${userId}-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }
  } catch (error) {
    console.error('Data export error:', error);
    return res.status(500).json({
      error: 'Export failed',
      message: 'Failed to export your data. Please try again or contact support.',
    });
  }
}

// Apply security - strict rate limit for expensive operation
export default combine(
  withAuth,
  rateLimit(RateLimitPresets.STRICT) // 5 requests per minute
)(handler);
