import { getQuotaStatus, getQuotaDashboard } from '@/lib/quota-manager';

/**
 * Get quota usage status
 * GET /api/quota/status?platform=aitable (optional)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platform, dashboard } = req.query;

    if (dashboard === 'true') {
      // Return full dashboard
      const dashboardData = await getQuotaDashboard();
      return res.status(200).json(dashboardData);
    } else {
      // Return status for specific platform or all
      const status = await getQuotaStatus(platform || null);
      return res.status(200).json({
        success: true,
        platform: platform || 'all',
        status,
      });
    }
  } catch (error) {
    console.error('Error getting quota status:', error);
    return res.status(500).json({
      error: 'Failed to get quota status',
      message: error.message,
    });
  }
}
