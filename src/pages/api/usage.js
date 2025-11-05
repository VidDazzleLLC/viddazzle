/**
 * Usage Tracking API
 * Tracks API calls, token usage, and provides analytics
 */

import { supabase } from '@/lib/supabase';

// In-memory fallback for when DB is unavailable
const memoryStore = {
  requests: [],
  totals: {
    total_requests: 0,
    total_tokens: 0,
    total_cost: 0
  }
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getUsageStats(req, res);
  } else if (req.method === 'POST') {
    return logUsage(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getUsageStats(req, res) {
  try {
    // Try to get from Supabase first
    const { data: user } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const stats = calculateStats(data);
        return res.status(200).json({ success: true, ...stats, source: 'database' });
      }
    }

    // Fallback to memory store
    const stats = calculateStats(memoryStore.requests);
    return res.status(200).json({
      success: true,
      ...stats,
      source: 'memory',
      note: 'Using in-memory storage. Data will be lost on restart.'
    });
  } catch (error) {
    console.error('Error fetching usage:', error);

    // Return memory store on any error
    const stats = calculateStats(memoryStore.requests);
    return res.status(200).json({
      success: true,
      ...stats,
      source: 'memory',
      error: error.message
    });
  }
}

async function logUsage(req, res) {
  try {
    const { endpoint, tokens_used, model, cost, metadata } = req.body;

    const usageRecord = {
      endpoint: endpoint || 'unknown',
      tokens_used: tokens_used || 0,
      model: model || 'claude-opus-4',
      cost: cost || (tokens_used * 0.000015), // Rough estimate: $15 per 1M tokens
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };

    // Try to log to Supabase
    try {
      const { data: user } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('api_usage')
          .insert([{ ...usageRecord, user_id: user.id }]);

        if (!error) {
          return res.status(200).json({ success: true, logged: true, source: 'database' });
        }
      }
    } catch (dbError) {
      console.log('DB logging failed, using memory store:', dbError.message);
    }

    // Fallback to memory store
    memoryStore.requests.push(usageRecord);
    memoryStore.totals.total_requests++;
    memoryStore.totals.total_tokens += usageRecord.tokens_used;
    memoryStore.totals.total_cost += usageRecord.cost;

    // Keep only last 1000 requests in memory
    if (memoryStore.requests.length > 1000) {
      memoryStore.requests = memoryStore.requests.slice(-1000);
    }

    return res.status(200).json({
      success: true,
      logged: true,
      source: 'memory',
      note: 'Logged to memory. Data will be lost on restart.'
    });
  } catch (error) {
    console.error('Error logging usage:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

function calculateStats(requests) {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const recent24h = requests.filter(r => new Date(r.created_at) > last24h);
  const recent7d = requests.filter(r => new Date(r.created_at) > last7d);
  const recent30d = requests.filter(r => new Date(r.created_at) > last30d);

  return {
    total: {
      requests: requests.length,
      tokens: requests.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      cost: requests.reduce((sum, r) => sum + (r.cost || 0), 0)
    },
    last_24h: {
      requests: recent24h.length,
      tokens: recent24h.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      cost: recent24h.reduce((sum, r) => sum + (r.cost || 0), 0)
    },
    last_7d: {
      requests: recent7d.length,
      tokens: recent7d.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      cost: recent7d.reduce((sum, r) => sum + (r.cost || 0), 0)
    },
    last_30d: {
      requests: recent30d.length,
      tokens: recent30d.reduce((sum, r) => sum + (r.tokens_used || 0), 0),
      cost: recent30d.reduce((sum, r) => sum + (r.cost || 0), 0)
    },
    recent_requests: requests.slice(-10).reverse()
  };
}
