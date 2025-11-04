// API Route: Outreach Queue Management
import { Pool } from 'pg';
import { OutreachAutomation } from '../../../lib/social/outreach.js';

const getDbPool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
};

export default async function handler(req, res) {
  const pool = getDbPool();

  try {
    const outreach = new OutreachAutomation(pool);

    if (req.method === 'GET') {
      // Get pending messages
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const messages = await outreach.getPendingMessages(userId);
      return res.status(200).json(messages);
    }

    if (req.method === 'POST') {
      const { action, messageIds, userId } = req.body;

      if (action === 'process') {
        // Process the queue (send approved messages)
        const result = await outreach.processQueue();
        return res.status(200).json(result);
      }

      if (action === 'bulk_approve') {
        if (!messageIds || !userId) {
          return res.status(400).json({ error: 'messageIds and userId required' });
        }

        const count = await outreach.bulkApprove(messageIds, userId);
        return res.status(200).json({ success: true, approved: count });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Queue API error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
