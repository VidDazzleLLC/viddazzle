/**
 * API Routes: Product-Campaign Linking
 * Handles linking products to listening campaigns
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/products/campaigns - Link a product to a campaign
 * DELETE /api/products/campaigns - Unlink a product from a campaign
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

    if (req.method === 'POST') {
      return await handleLinkProduct(req, res, user.id);
    } else if (req.method === 'DELETE') {
      return await handleUnlinkProduct(req, res, user.id);
    } else if (req.method === 'GET') {
      return await handleGetLinks(req, res, user.id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in product campaigns API:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST - Link product to campaign
 */
async function handleLinkProduct(req, res, userId) {
  const { product_id, campaign_id, priority = 1, custom_response_template } = req.body;

  if (!product_id || !campaign_id) {
    return res.status(400).json({ error: 'product_id and campaign_id are required' });
  }

  // Verify user owns the product
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('seller_id', userId)
    .single();

  if (!product) {
    return res.status(404).json({ error: 'Product not found or access denied' });
  }

  // Verify user owns the campaign
  const { data: campaign } = await supabase
    .from('listening_campaigns')
    .select('id')
    .eq('id', campaign_id)
    .eq('user_id', userId)
    .single();

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found or access denied' });
  }

  // Create the link
  const { data: link, error: linkError } = await supabase
    .from('product_campaigns')
    .insert({
      product_id,
      campaign_id,
      priority,
      custom_response_template
    })
    .select()
    .single();

  if (linkError) {
    if (linkError.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Product is already linked to this campaign' });
    }
    return res.status(500).json({ error: linkError.message });
  }

  return res.status(201).json({
    message: 'Product linked to campaign successfully',
    link
  });
}

/**
 * DELETE - Unlink product from campaign
 */
async function handleUnlinkProduct(req, res, userId) {
  const { product_id, campaign_id } = req.body;

  if (!product_id || !campaign_id) {
    return res.status(400).json({ error: 'product_id and campaign_id are required' });
  }

  // Verify user owns the product
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('seller_id', userId)
    .single();

  if (!product) {
    return res.status(404).json({ error: 'Product not found or access denied' });
  }

  // Delete the link
  const { error: deleteError } = await supabase
    .from('product_campaigns')
    .delete()
    .eq('product_id', product_id)
    .eq('campaign_id', campaign_id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  return res.status(200).json({
    message: 'Product unlinked from campaign successfully'
  });
}

/**
 * GET - Get all product-campaign links for user
 */
async function handleGetLinks(req, res, userId) {
  const { product_id, campaign_id } = req.query;

  let query = supabase
    .from('product_campaigns')
    .select(`
      *,
      products (
        id,
        name,
        is_active,
        seller_id
      ),
      listening_campaigns (
        id,
        name,
        status,
        user_id
      )
    `);

  // Apply filters
  if (product_id) {
    query = query.eq('product_id', product_id);
  }
  if (campaign_id) {
    query = query.eq('campaign_id', campaign_id);
  }

  const { data: links, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Filter to only user's products/campaigns
  const userLinks = links?.filter(link =>
    link.products?.seller_id === userId &&
    link.listening_campaigns?.user_id === userId
  ) || [];

  return res.status(200).json({
    links: userLinks,
    total: userLinks.length
  });
}
