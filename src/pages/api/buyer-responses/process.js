/**
 * API Route: Process Buyer Responses
 * Analyzes buyer responses, detects positive triggers, and matches with products
 */

import { createClient } from '@supabase/supabase-js';
import { SocialAnalyzer } from '../../../lib/social/analyzer.js';
import { ProductMatcher } from '../../../lib/social/product-matcher.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/buyer-responses/process - Process a buyer's response to outreach
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      outreach_message_id,
      response_content,
      response_platform,
      response_url,
      author_username,
      author_profile_url,
      auto_send_product = false // Whether to automatically send product if triggers detected
    } = req.body;

    // Validation
    if (!outreach_message_id || !response_content) {
      return res.status(400).json({
        error: 'outreach_message_id and response_content are required'
      });
    }

    // Get the original outreach message and mention
    const { data: outreachMessage, error: outreachError } = await supabase
      .from('outreach_messages')
      .select(`
        *,
        social_mentions (
          id,
          content,
          platform,
          sentiment,
          intent,
          opportunity_score,
          author_username,
          campaign_id
        ),
        listening_campaigns (
          user_id
        )
      `)
      .eq('id', outreach_message_id)
      .single();

    if (outreachError || !outreachMessage) {
      return res.status(404).json({ error: 'Outreach message not found' });
    }

    const userId = outreachMessage.listening_campaigns.user_id;
    const originalMention = outreachMessage.social_mentions;

    // Initialize analyzer and matcher
    const analyzer = new SocialAnalyzer(
      process.env.ANTHROPIC_API_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const matcher = new ProductMatcher(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Analyze the buyer's response
    const analysis = await analyzer.analyzeBuyerResponse(
      { content: response_content, platform: response_platform },
      originalMention,
      userId
    );

    // Create buyer response record
    const { data: buyerResponse, error: responseError } = await supabase
      .from('buyer_responses')
      .insert({
        outreach_message_id,
        original_mention_id: originalMention.id,
        product_id: outreachMessage.product_id,
        response_content,
        response_platform: response_platform || originalMention.platform,
        response_url,
        author_username: author_username || originalMention.author_username,
        author_profile_url,
        detected_triggers: analysis.detectedTriggers,
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentimentScore,
        buyer_interest_level: analysis.buyerInterestLevel,
        is_positive_response: analysis.isPositiveResponse,
        suggested_next_action: analysis.suggestedNextAction,
        ai_analysis: {
          triggerTypes: analysis.triggerTypes,
          intent: analysis.intent,
          opportunityScore: analysis.opportunityScore,
          reasoning: analysis.reasoning,
          shouldSendProduct: analysis.shouldSendProduct,
          requiresManualReview: analysis.requiresManualReview
        },
        response_processed: true
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error creating buyer response:', responseError);
      return res.status(500).json({ error: responseError.message });
    }

    // Update outreach message with response received
    await supabase
      .from('outreach_messages')
      .update({ response_received: true })
      .eq('id', outreach_message_id);

    // Track buyer consent if positive response
    if (analysis.isPositiveResponse) {
      await trackBuyerConsent({
        platform: response_platform || originalMention.platform,
        platformUserId: author_username || originalMention.author_username,
        platformUsername: author_username || originalMention.author_username,
        sellerId: userId,
        consentType: 'implicit',
        consentSource: 'positive_response',
        originalMentionId: originalMention.id,
        originalResponseId: buyerResponse.id
      });
    }

    let productOffer = null;
    let followUpMessage = null;

    // If positive triggers detected and buyer wants product info
    if (analysis.shouldSendProduct) {
      // Find best matching product
      let product;

      if (outreachMessage.product_id) {
        // Use the product that was originally offered
        const { data: existingProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', outreachMessage.product_id)
          .single();
        product = existingProduct;
      } else {
        // Find best matching product for this buyer
        product = await matcher.getBestProduct(
          originalMention,
          originalMention.campaign_id
        );
      }

      if (product) {
        productOffer = {
          id: product.id,
          name: product.name,
          description: product.description,
          call_to_action: product.call_to_action,
          offer_url: product.offer_url
        };

        // Generate follow-up message with product details if auto-send enabled
        if (auto_send_product) {
          followUpMessage = await generateProductOfferMessage(
            product,
            analysis,
            originalMention,
            analyzer
          );

          // Create a follow-up outreach message record
          const { data: followUp } = await supabase
            .from('outreach_messages')
            .insert({
              campaign_id: originalMention.campaign_id,
              rule_id: outreachMessage.rule_id,
              mention_id: originalMention.id,
              product_id: product.id,
              message_content: followUpMessage,
              channel: outreachMessage.channel,
              status: 'pending_approval', // Requires approval before sending
              ai_personalization_used: true,
              parent_message_id: outreach_message_id // Link to original message
            })
            .select()
            .single();

          if (followUp) {
            // Update buyer response with follow-up created
            await supabase
              .from('buyer_responses')
              .update({ next_outreach_sent: true })
              .eq('id', buyerResponse.id);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Buyer response processed successfully',
      response: {
        id: buyerResponse.id,
        is_positive: analysis.isPositiveResponse,
        interest_level: analysis.buyerInterestLevel,
        detected_triggers: analysis.detectedTriggers,
        trigger_types: analysis.triggerTypes,
        sentiment: analysis.sentiment,
        suggested_action: analysis.suggestedNextAction,
        should_send_product: analysis.shouldSendProduct,
        requires_manual_review: analysis.requiresManualReview
      },
      product_offer: productOffer,
      follow_up_message: followUpMessage,
      recommendations: {
        next_steps: getNextStepRecommendations(analysis, productOffer),
        urgency: analysis.buyerInterestLevel === 'high' ? 'high' : 'medium',
        auto_follow_up_recommended: analysis.shouldSendProduct
      }
    });

  } catch (error) {
    console.error('Error processing buyer response:', error);
    return res.status(500).json({
      error: error.message,
      details: 'Failed to process buyer response'
    });
  }
}

/**
 * Track buyer consent for outreach
 */
async function trackBuyerConsent(params) {
  try {
    const {
      platform,
      platformUserId,
      platformUsername,
      sellerId,
      consentType,
      consentSource,
      originalMentionId,
      originalResponseId
    } = params;

    // Upsert consent record
    const { error } = await supabase
      .from('buyer_consent')
      .upsert({
        platform,
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        seller_id: sellerId,
        consent_type: consentType,
        consent_source: consentSource,
        original_mention_id: originalMentionId,
        original_response_id: originalResponseId,
        consent_given: true,
        can_contact: true,
        can_store_data: true,
        consent_obtained_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'platform,platform_user_id,seller_id'
      });

    if (error) {
      console.error('Error tracking consent:', error);
    }
  } catch (error) {
    console.error('Error in trackBuyerConsent:', error);
  }
}

/**
 * Generate a personalized product offer message
 */
async function generateProductOfferMessage(product, analysis, mention, analyzer) {
  try {
    const template = product.response_template || buildDefaultProductTemplate(product);

    const context = {
      productInfo: `${product.name} - ${product.description}`,
      brandVoice: 'helpful and professional',
      companyName: 'our team',
      additionalContext: `
Buyer showed ${analysis.buyerInterestLevel} interest level.
Detected triggers: ${analysis.detectedTriggers.map(t => t.phrase).join(', ')}
Suggested action: ${analysis.suggestedNextAction}
      `
    };

    const message = await analyzer.generateOutreachMessage(
      mention,
      template,
      context
    );

    // Add call-to-action if provided
    if (product.call_to_action && product.offer_url) {
      return `${message}\n\n${product.call_to_action}: ${product.offer_url}`;
    }

    return message;
  } catch (error) {
    console.error('Error generating product offer message:', error);
    return buildDefaultProductTemplate(product);
  }
}

/**
 * Build default product offer template
 */
function buildDefaultProductTemplate(product) {
  let template = `Thanks for your interest! `;

  if (product.name) {
    template += `I'd love to tell you more about ${product.name}. `;
  }

  if (product.description) {
    template += `${product.description} `;
  }

  if (product.offer_url) {
    template += `\n\nLearn more here: ${product.offer_url}`;
  }

  if (product.call_to_action && !product.offer_url) {
    template += `\n\n${product.call_to_action}`;
  }

  return template;
}

/**
 * Get recommended next steps based on analysis
 */
function getNextStepRecommendations(analysis, productOffer) {
  const steps = [];

  if (analysis.shouldSendProduct && productOffer) {
    steps.push({
      action: 'send_product_offer',
      priority: 'high',
      description: `Send ${productOffer.name} details to the buyer`
    });
  }

  if (analysis.buyerInterestLevel === 'high') {
    steps.push({
      action: 'prioritize_response',
      priority: 'high',
      description: 'Buyer shows high interest - respond quickly'
    });
  }

  if (analysis.isPurchaseIntent) {
    steps.push({
      action: 'provide_pricing',
      priority: 'high',
      description: 'Buyer asking about purchase - provide pricing and purchase info'
    });
  }

  if (analysis.isRequestInfo) {
    steps.push({
      action: 'send_details',
      priority: 'medium',
      description: 'Buyer requested more information - send detailed product info'
    });
  }

  if (analysis.requiresManualReview) {
    steps.push({
      action: 'manual_review',
      priority: 'medium',
      description: 'Response requires human review before proceeding'
    });
  }

  if (steps.length === 0) {
    steps.push({
      action: 'monitor',
      priority: 'low',
      description: 'Monitor for follow-up responses'
    });
  }

  return steps;
}
