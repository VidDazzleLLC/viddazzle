/**
 * Social Mention Webhook Listener
 *
 * Receives incoming social mentions from:
 * - Mention.com
 * - Brand24
 * - Hootsuite
 * - Buffer
 * - Custom Albato flows
 * - Any tool via webhook
 *
 * Automatically processes mentions through the full workflow:
 * 1. Sentiment analysis
 * 2. Lead scoring
 * 3. Response generation
 * 4. Auto-posting (if enabled and qualified)
 * 5. CRM logging
 *
 * SECURITY: Validates webhook signatures to prevent unauthorized access
 */

import axios from 'axios';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // SECURITY: Validate webhook signature (optional but recommended)
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid webhook signature',
      });
    }
    console.log('✅ Webhook signature verified');
  } else {
    console.warn('⚠️ WEBHOOK_SECRET not set - webhook is unprotected!');
  }

  try {
    const {
      text,                  // The social media post text
      platform,              // linkedin, twitter, reddit, facebook
      author,                // Author info (name, title, company, profile_url)
      post_url,              // URL to the original post
      mentioned_at,          // When the mention happened
      mention_type,          // direct_mention, keyword, brand_mention
      source_tool,           // mention.com, brand24, albato, etc.
    } = req.body;

    // Validate required fields
    if (!text || !platform) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['text', 'platform'],
        received: { text: !!text, platform: !!platform },
      });
    }

    console.log('📥 Webhook received:', {
      platform,
      text_length: text.length,
      source: source_tool || 'unknown',
      mention_type: mention_type || 'unknown',
    });

    // STEP 1: Process the mention through our workflow
    console.log('🔄 Processing mention through workflow...');

    // Use relative path for internal API calls (works in both dev and production)
    const apiHost = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseURL = `${protocol}://${apiHost}`;

    // Validate environment variables
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME;
    const companySolution = process.env.NEXT_PUBLIC_COMPANY_SOLUTION;

    if (!companyName || !companySolution) {
      console.warn('⚠️ Company info not configured - responses will be generic');
    }

    const workflowResponse = await axios.post(
      `${baseURL}/api/social-listening/process-mention`,
      {
        text: text,
        platform: platform,
        author: author || {
          name: 'Unknown User',
          title: 'Unknown',
          company: 'Unknown',
        },
        post_url: post_url,
        your_company: companyName || 'Your Company',
        your_solution: companySolution || 'Your solution',
        albato_webhook_url: process.env.AITABLE_ALBATO_WEBHOOK_URL,
      },
      { timeout: 30000 }
    );

    const workflow = workflowResponse.data;

    console.log('✅ Workflow complete:', {
      workflow_id: workflow.workflow_id,
      is_lead: workflow.sentiment_analysis?.is_lead,
      lead_score: workflow.sentiment_analysis?.lead_score,
      lead_quality: workflow.sentiment_analysis?.lead_quality,
    });

    // STEP 2: Check if we should auto-post
    const shouldAutoPost = workflow.sentiment_analysis?.is_lead &&
                          workflow.sales_response?.generated &&
                          workflow.sales_response?.ready_to_post;

    let autoPostResult = null;

    if (shouldAutoPost) {
      console.log('🤖 Attempting auto-post...');

      try {
        const autoPostResponse = await axios.post(
          `${baseURL}/api/social-listening/auto-post`,
          {
            lead_id: workflow.workflow_id,
            platform: platform,
            response_text: workflow.sales_response.response_text,
            lead_score: workflow.sentiment_analysis.lead_score,
            original_post_url: post_url,
            author_info: author,
          },
          { timeout: 15000 }
        );

        autoPostResult = autoPostResponse.data;

        if (autoPostResult.success) {
          console.log('✅ Auto-posted successfully!');
        } else {
          console.log('⚠️ Auto-post blocked:', autoPostResult.error);
        }

      } catch (autoPostError) {
        console.log('❌ Auto-post failed:', autoPostError.message);

        autoPostResult = {
          success: false,
          error: autoPostError.response?.data?.error || autoPostError.message,
          message: autoPostError.response?.data?.message || 'Auto-post failed',
        };
      }
    } else {
      console.log('⏭️ Skipping auto-post:', {
        is_lead: workflow.sentiment_analysis?.is_lead,
        response_generated: workflow.sales_response?.generated,
        ready_to_post: workflow.sales_response?.ready_to_post,
      });
    }

    // STEP 3: Return comprehensive response
    return res.status(200).json({
      success: true,
      webhook_received: true,
      processed_at: new Date().toISOString(),

      // Input summary
      input: {
        platform: platform,
        text_preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        source_tool: source_tool || 'unknown',
      },

      // Workflow results
      workflow_id: workflow.workflow_id,
      sentiment_analysis: workflow.sentiment_analysis,
      sales_response: workflow.sales_response,
      crm_integration: workflow.crm_integration,

      // Auto-posting results
      auto_post_attempted: shouldAutoPost,
      auto_post_result: autoPostResult,

      // Next steps
      next_steps: workflow.next_steps || [],

      // Summary
      summary: `${workflow.sentiment_analysis?.is_lead ? '✅ LEAD IDENTIFIED' : '❌ Not a lead'} | Score: ${workflow.sentiment_analysis?.lead_score || 0}/100 | ${autoPostResult?.success ? '✅ AUTO-POSTED' : autoPostResult ? `⚠️ ${autoPostResult.error}` : '⏭️ No auto-post'}`,
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
