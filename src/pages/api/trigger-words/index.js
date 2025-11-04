/**
 * API Routes: Positive Trigger Words Management
 * Handles CRUD operations for positive engagement trigger words
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/trigger-words - List all trigger words (system + user's custom)
 * POST /api/trigger-words - Create a custom trigger word
 */
export default async function handler(req, res) {
  try {
    // Get user from session
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      return await handleGetTriggerWords(req, res, user.id);
    } else if (req.method === 'POST') {
      return await handleCreateTriggerWord(req, res, user.id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in trigger words API:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET - List all trigger words (system defaults + user's custom)
 */
async function handleGetTriggerWords(req, res, userId) {
  const { is_active, trigger_type, include_system } = req.query;

  let query = supabase
    .from('positive_trigger_words')
    .select('*')
    .order('is_system_default', { ascending: false }) // System defaults first
    .order('confidence_boost', { ascending: false }); // Then by importance

  // Filter by active status
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  // Filter by trigger type
  if (trigger_type) {
    query = query.eq('trigger_type', trigger_type);
  }

  // Filter: system defaults OR user's custom triggers
  if (include_system === 'false') {
    // Only user's custom triggers
    query = query.eq('user_id', userId);
  } else {
    // System defaults + user's custom
    query = query.or(`is_system_default.eq.true,user_id.eq.${userId}`);
  }

  const { data: triggers, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Group by type for easier frontend consumption
  const groupedByType = triggers.reduce((acc, trigger) => {
    const type = trigger.trigger_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(trigger);
    return acc;
  }, {});

  return res.status(200).json({
    triggers,
    grouped_by_type: groupedByType,
    total: triggers.length,
    system_defaults: triggers.filter(t => t.is_system_default).length,
    custom: triggers.filter(t => !t.is_system_default).length
  });
}

/**
 * POST - Create a custom trigger word
 */
async function handleCreateTriggerWord(req, res, userId) {
  const {
    trigger_phrase,
    trigger_type = 'interest',
    match_type = 'contains',
    case_sensitive = false,
    confidence_boost = 10,
    is_active = true
  } = req.body;

  // Validation
  if (!trigger_phrase || trigger_phrase.trim().length === 0) {
    return res.status(400).json({ error: 'trigger_phrase is required' });
  }

  const validTypes = ['interest', 'purchase_intent', 'positive_sentiment', 'confirmation', 'question', 'request_info'];
  if (!validTypes.includes(trigger_type)) {
    return res.status(400).json({ error: `trigger_type must be one of: ${validTypes.join(', ')}` });
  }

  const validMatchTypes = ['exact', 'contains', 'regex', 'fuzzy'];
  if (!validMatchTypes.includes(match_type)) {
    return res.status(400).json({ error: `match_type must be one of: ${validMatchTypes.join(', ')}` });
  }

  if (confidence_boost < 0 || confidence_boost > 50) {
    return res.status(400).json({ error: 'confidence_boost must be between 0 and 50' });
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('positive_trigger_words')
    .select('id')
    .eq('trigger_phrase', trigger_phrase.trim().toLowerCase())
    .eq('user_id', userId)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'This trigger phrase already exists in your custom triggers' });
  }

  // Create trigger word
  const { data: trigger, error: createError } = await supabase
    .from('positive_trigger_words')
    .insert({
      user_id: userId,
      trigger_phrase: trigger_phrase.trim().toLowerCase(),
      trigger_type,
      match_type,
      case_sensitive,
      confidence_boost,
      is_active,
      is_system_default: false
    })
    .select()
    .single();

  if (createError) {
    return res.status(500).json({ error: createError.message });
  }

  return res.status(201).json({
    message: 'Custom trigger word created successfully',
    trigger
  });
}
