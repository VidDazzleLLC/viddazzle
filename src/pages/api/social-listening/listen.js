// API Route: Trigger Listening Job
import { Pool } from 'pg';
import { SocialListener } from '../../../lib/social/listener.js';

const getDbPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pool = getDbPool();

  try {
    const { campaignId, runAll } = req.body;

    const listener = new SocialListener(
      pool,
      process.env.ANTHROPIC_API_KEY
    );

    let result;

    if (runAll) {
      // Run all active campaigns
      result = await listener.runAllActiveCampaigns();
    } else if (campaignId) {
      // Run specific campaign
      result = await listener.runListeningJob(campaignId);
    } else {
      return res.status(400).json({ error: 'campaignId or runAll required' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Listening job error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
