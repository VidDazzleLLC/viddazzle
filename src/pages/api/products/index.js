/**
 * API Routes: Product Management
 * Handles CRUD operations for seller products/solutions
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/products - List all products for authenticated user
 * POST /api/products - Create a new product
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
      return await handleGetProducts(req, res, user.id);
    } else if (req.method === 'POST') {
      return await handleCreateProduct(req, res, user.id);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in products API:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET - List products for user
 */
async function handleGetProducts(req, res, userId) {
  const { is_active, campaign_id, include_performance } = req.query;

  let query = supabase
    .from('products')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  // Filter by active status
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active === 'true');
  }

  // Filter by linked campaign
  if (campaign_id) {
    const { data: productCampaigns } = await supabase
      .from('product_campaigns')
      .select('product_id')
      .eq('campaign_id', campaign_id);

    const productIds = productCampaigns?.map(pc => pc.product_id) || [];
    query = query.in('id', productIds);
  }

  const { data: products, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Include performance metrics if requested
  if (include_performance === 'true') {
    const { data: performance } = await supabase
      .from('product_performance')
      .select('*')
      .eq('seller_id', userId);

    // Merge performance data with products
    const productsWithPerformance = products.map(product => {
      const perf = performance?.find(p => p.product_id === product.id);
      return {
        ...product,
        performance: perf || {
          total_matches: 0,
          total_outreach_sent: 0,
          total_responses: 0,
          positive_responses: 0,
          response_rate_percent: 0
        }
      };
    });

    return res.status(200).json({
      products: productsWithPerformance,
      total: productsWithPerformance.length
    });
  }

  return res.status(200).json({
    products,
    total: products.length
  });
}

/**
 * POST - Create a new product
 */
async function handleCreateProduct(req, res, userId) {
  const {
    name,
    description,
    category,
    price,
    currency = 'USD',
    features = [],
    benefits = [],
    target_audience,
    call_to_action,
    offer_url,
    offer_type = 'product',
    response_template,
    ai_personalization_enabled = true,
    matching_keywords = [],
    exclude_keywords = [],
    target_sentiment = ['positive', 'neutral'],
    target_intent = ['purchase_intent', 'question', 'informational'],
    min_opportunity_score = 50,
    max_offers_per_day = 10,
    is_active = true,
    campaign_ids = [] // Array of campaign IDs to link to
  } = req.body;

  // Validation
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  if (matching_keywords.length === 0) {
    return res.status(400).json({
      error: 'At least one matching keyword is required to match buyers with this product'
    });
  }

  // Create product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      seller_id: userId,
      name: name.trim(),
      description,
      category,
      price,
      currency,
      features,
      benefits,
      target_audience,
      call_to_action,
      offer_url,
      offer_type,
      response_template,
      ai_personalization_enabled,
      matching_keywords,
      exclude_keywords,
      target_sentiment,
      target_intent,
      min_opportunity_score,
      max_offers_per_day,
      is_active
    })
    .select()
    .single();

  if (productError) {
    return res.status(500).json({ error: productError.message });
  }

  // Link to campaigns if provided
  if (campaign_ids && campaign_ids.length > 0) {
    const campaignLinks = campaign_ids.map(campaignId => ({
      product_id: product.id,
      campaign_id: campaignId
    }));

    const { error: linkError } = await supabase
      .from('product_campaigns')
      .insert(campaignLinks);

    if (linkError) {
      console.error('Error linking campaigns:', linkError);
      // Don't fail the request, just log the error
    }
  }

  return res.status(201).json({
    message: 'Product created successfully',
    product
  });
}
