// API Route: Send Outreach Message
import { Pool } from 'pg';
import { OutreachAutomation } from '../../../lib/social/outreach.js';

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
    const { messageId, action } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'messageId required' });
    }

    const outreach = new OutreachAutomation(pool);

    let result;

    switch (action) {
      case 'send':
        result = await outreach.sendMessage(messageId);
        break;

      case 'approve':
        const approved = await outreach.approveMessage(messageId, req.body.userId);
        result = { success: approved };
        break;

      case 'reject':
        const rejected = await outreach.rejectMessage(messageId, req.body.userId);
        result = { success: rejected };
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. Use: send, approve, or reject' });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Outreach API error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}
