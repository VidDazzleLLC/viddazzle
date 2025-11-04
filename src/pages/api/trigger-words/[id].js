/**
 * API Routes: Individual Trigger Word Management
 * Handles PUT, DELETE for specific custom trigger words
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * PUT /api/trigger-words/[id] - Update custom trigger word
 * DELETE /api/trigger-words/[id] - Delete custom trigger word
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

    const { id: triggerId } = req.query;

    if (!triggerId) {
      return res.status(400).json({ error: 'Trigger word ID is required' });
    }

    // Verify user owns this trigger and it's not a system default
    const { data: trigger, error: fetchError } = await supabase
      .from('positive_trigger_words')
      .select('*')
      .eq('id', triggerId)
      .eq('user_id', user.id)
      .eq('is_system_default', false)
      .single();

    if (fetchError || !trigger) {
      return res.status(404).json({ error: 'Custom trigger word not found or access denied' });
    }

    if (req.method === 'PUT') {
      return await handleUpdateTriggerWord(req, res, triggerId, user.id);
    } else if (req.method === 'DELETE') {
      return await handleDeleteTriggerWord(req, res, triggerId, user.id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in trigger word API:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * PUT - Update custom trigger word
 */
async function handleUpdateTriggerWord(req, res, triggerId, userId) {
  const updates = { ...req.body };

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.user_id;
  delete updates.is_system_default;
  delete updates.created_at;

  // Validation
  if (updates.confidence_boost !== undefined) {
    if (updates.confidence_boost < 0 || updates.confidence_boost > 50) {
      return res.status(400).json({ error: 'confidence_boost must be between 0 and 50' });
    }
  }

  if (updates.trigger_type) {
    const validTypes = ['interest', 'purchase_intent', 'positive_sentiment', 'confirmation', 'question', 'request_info'];
    if (!validTypes.includes(updates.trigger_type)) {
      return res.status(400).json({ error: `trigger_type must be one of: ${validTypes.join(', ')}` });
    }
  }

  if (updates.match_type) {
    const validMatchTypes = ['exact', 'contains', 'regex', 'fuzzy'];
    if (!validMatchTypes.includes(updates.match_type)) {
      return res.status(400).json({ error: `match_type must be one of: ${validMatchTypes.join(', ')}` });
    }
  }

  // Update trigger word
  const { data: trigger, error: updateError } = await supabase
    .from('positive_trigger_words')
    .update(updates)
    .eq('id', triggerId)
    .eq('user_id', userId)
    .eq('is_system_default', false)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.status(200).json({
    message: 'Custom trigger word updated successfully',
    trigger
  });
}

/**
 * DELETE - Delete custom trigger word
 */
async function handleDeleteTriggerWord(req, res, triggerId, userId) {
  const { error: deleteError } = await supabase
    .from('positive_trigger_words')
    .delete()
    .eq('id', triggerId)
    .eq('user_id', userId)
    .eq('is_system_default', false);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  return res.status(200).json({
    message: 'Custom trigger word deleted successfully'
  });
}
