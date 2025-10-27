import { resetQuotas } from '@/lib/quota-manager';

/**
 * Reset quota counts (manual override)
 * POST /api/quota/reset
 * Body: { platform?: string, admin_key: string }
 *
 * IMPORTANT: Requires admin key for security
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { platform, admin_key } = req.body;

    // Security: Require admin key
    if (admin_key !== process.env.QUOTA_ADMIN_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid admin key' });
    }

    const result = await resetQuotas(platform || null);

    return res.status(200).json({
      success: true,
      message: `Reset ${result.reset_count} quota entries`,
      ...result,
    });
  } catch (error) {
    console.error('Error resetting quotas:', error);
    return res.status(500).json({
      error: 'Failed to reset quotas',
      message: error.message,
    });
  }
}
