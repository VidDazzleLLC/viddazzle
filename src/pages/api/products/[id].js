/**
 * API Routes: Individual Product Management
 * Handles GET, PUT, DELETE for specific products
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/products/[id] - Get product details
 * PUT /api/products/[id] - Update product
 * DELETE /api/products/[id] - Delete product
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

    const { id: productId } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Verify user owns this product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    if (req.method === 'GET') {
      return await handleGetProduct(req, res, productId, user.id);
    } else if (req.method === 'PUT') {
      return await handleUpdateProduct(req, res, productId, user.id);
    } else if (req.method === 'DELETE') {
      return await handleDeleteProduct(req, res, productId, user.id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in product API:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET - Get product details with performance
 */
async function handleGetProduct(req, res, productId, userId) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('seller_id', userId)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Get linked campaigns
  const { data: campaigns } = await supabase
    .from('product_campaigns')
    .select(`
      campaign_id,
      priority,
      custom_response_template,
      listening_campaigns (
        id,
        name,
        description,
        status
      )
    `)
    .eq('product_id', productId);

  // Get performance metrics
  const { data: performance } = await supabase
    .from('product_performance')
    .select('*')
    .eq('product_id', productId)
    .single();

  // Get recent matches
  const { data: recentMatches } = await supabase
    .from('product_mention_matches')
    .select(`
      id,
      match_score,
      matched_keywords,
      outreach_created,
      created_at,
      social_mentions (
        id,
        content,
        platform,
        author_username,
        opportunity_score,
        sentiment
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(10);

  return res.status(200).json({
    product,
    campaigns: campaigns || [],
    performance: performance || {
      total_matches: 0,
      total_outreach_sent: 0,
      total_responses: 0,
      positive_responses: 0,
      response_rate_percent: 0
    },
    recent_matches: recentMatches || []
  });
}

/**
 * PUT - Update product
 */
async function handleUpdateProduct(req, res, productId, userId) {
  const updates = { ...req.body };

  // Remove fields that shouldn't be updated
  delete updates.id;
  delete updates.seller_id;
  delete updates.created_at;
  delete updates.updated_at;

  // Handle campaign links separately
  const campaignIds = updates.campaign_ids;
  delete updates.campaign_ids;

  // Update product
  const { data: product, error: updateError } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('seller_id', userId)
    .select()
    .single();

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // Update campaign links if provided
  if (campaignIds !== undefined) {
    // Delete existing links
    await supabase
      .from('product_campaigns')
      .delete()
      .eq('product_id', productId);

    // Create new links
    if (campaignIds.length > 0) {
      const campaignLinks = campaignIds.map(campaignId => ({
        product_id: productId,
        campaign_id: campaignId
      }));

      await supabase
        .from('product_campaigns')
        .insert(campaignLinks);
    }
  }

  return res.status(200).json({
    message: 'Product updated successfully',
    product
  });
}

/**
 * DELETE - Delete product
 */
async function handleDeleteProduct(req, res, productId, userId) {
  // Check if product has any outreach messages
  const { data: outreachMessages } = await supabase
    .from('outreach_messages')
    .select('id')
    .eq('product_id', productId)
    .limit(1);

  if (outreachMessages && outreachMessages.length > 0) {
    // Soft delete by setting inactive instead of hard delete
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId)
      .eq('seller_id', userId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({
      message: 'Product deactivated successfully (has existing outreach messages)',
      soft_delete: true
    });
  }

  // Hard delete if no outreach exists
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', userId);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  return res.status(200).json({
    message: 'Product deleted successfully',
    soft_delete: false
  });
}
