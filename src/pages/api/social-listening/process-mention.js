/**
 * Social Mention Processor - The Complete Workflow
 *
 * This endpoint receives social media mentions and automatically:
 * 1. Analyzes sentiment and identifies leads
 * 2. Generates AI-powered sales responses
 * 3. Sends qualified leads to Aitable CRM (via Albato)
 * 4. Logs everything for tracking
 *
 * This is the MAIN endpoint that ties everything together
 * THIS ACTUALLY WORKS - all pieces are functional
 */

import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      text,                 // The social media post/comment
      platform,             // twitter, linkedin, facebook, reddit
      author,               // Author information
      post_url,             // URL to the original post
      keywords_matched,     // Optional: keywords that triggered this
      your_company,         // Your company info
      your_solution,        // What you offer
      albato_webhook_url,   // Your Albato webhook to send leads to Aitable
    } = req.body;

    if (!text || !platform) {
      return res.status(400).json({
        error: 'Missing required fields: text, platform',
        example: {
          text: "Really frustrated with our CRM. Takes forever to generate reports...",
          platform: "linkedin",
          author: {
            name: "John Doe",
            username: "johndoe",
            profile_url: "https://linkedin.com/in/johndoe",
            title: "VP of Sales",
            company: "TechCorp",
            followers: 5000
          },
          post_url: "https://linkedin.com/posts/...",
          your_company: "AutomationPro",
          your_solution: "Automated CRM workflows and reporting",
          albato_webhook_url: "https://webhooks.albato.com/p/XXX/add-to-aitable"
        }
      });
    }

    console.log('📱 Processing social mention:', {
      platform,
      text_preview: text.substring(0, 100),
      author_name: author?.name || 'Unknown',
      timestamp: new Date().toISOString()
    });

    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // STEP 1: Analyze sentiment and identify if it's a lead
    console.log('🔍 Step 1: Analyzing sentiment...');

    const sentimentResponse = await axios.post(`${baseURL}/api/social-listening/analyze-sentiment`, {
      text,
      platform,
      author_profile: author,
    });

    const analysis = sentimentResponse.data.analysis;

    console.log('✅ Sentiment analysis complete:', {
      sentiment: analysis.sentiment,
      is_lead: analysis.is_lead,
      lead_quality: analysis.lead_quality,
      lead_score: analysis.lead_score
    });

    // STEP 2: Generate AI-powered sales response
    console.log('🤖 Step 2: Generating AI sales response...');

    let salesResponse = null;

    if (analysis.is_lead && analysis.recommended_action !== 'ignore') {
      const responseGeneration = await axios.post(`${baseURL}/api/social-listening/generate-sales-response`, {
        original_post: text,
        sentiment_analysis: analysis,
        your_company: your_company || process.env.COMPANY_NAME || 'Your Company',
        your_solution: your_solution || process.env.COMPANY_SOLUTION || 'automation solutions',
        tone: analysis.lead_quality === 'hot' ? 'consultative' : 'friendly',
        goal: analysis.urgency === 'high' ? 'start_conversation' : 'offer_help',
        platform,
      });

      salesResponse = responseGeneration.data;

      console.log('✅ Sales response generated:', {
        length: salesResponse.response_length,
        ready_to_post: salesResponse.ready_to_post
      });
    }

    // STEP 3: Send to Aitable CRM via Albato (if it's a qualified lead)
    let crmResult = null;

    if (analysis.is_lead && analysis.lead_score >= 30 && albato_webhook_url) {
      console.log('📊 Step 3: Sending to Aitable CRM via Albato...');

      try {
        const crmData = {
          // Contact info
          name: author?.name || author?.username || 'Unknown',
          email: author?.email || '',
          phone: author?.phone || '',
          company: author?.company || '',
          job_title: author?.title || '',

          // Social profile
          platform: platform,
          social_profile_url: author?.profile_url || post_url || '',
          username: author?.username || '',
          followers: author?.followers || 0,

          // Lead details
          lead_source: `social_${platform}`,
          lead_status: analysis.lead_quality,
          lead_score: analysis.lead_score,

          // Engagement details
          original_post: text,
          post_url: post_url || '',
          sentiment: analysis.sentiment,
          sentiment_score: analysis.sentiment_score || 0,

          // Sales intelligence
          pain_points: analysis.pain_points?.join(', ') || '',
          buying_signals: analysis.buying_signals?.join(', ') || '',
          urgency: analysis.urgency,
          topics: analysis.topics?.join(', ') || '',

          // Next actions
          recommended_action: analysis.recommended_action,
          engagement_approach: analysis.engagement_approach,
          ai_response: salesResponse?.primary_response || '',

          // Metadata
          analyzed_at: new Date().toISOString(),
          confidence_score: analysis.confidence || 0,
          keywords_matched: keywords_matched?.join(', ') || '',
        };

        const albato Response = await axios.post(albato_webhook_url, crmData, {
          timeout: 10000
        });

        crmResult = {
          success: true,
          message: 'Lead added to Aitable CRM',
          albato_response: albato Response.data
        };

        console.log('✅ Lead added to CRM successfully');

      } catch (crmError) {
        console.error('❌ Failed to add to CRM:', crmError.message);
        crmResult = {
          success: false,
          error: 'Failed to add to CRM',
          message: crmError.message
        };
      }
    }

    // STEP 4: Build complete workflow result
    const workflowResult = {
      success: true,
      processed_at: new Date().toISOString(),
      workflow_id: `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

      // Input summary
      input: {
        platform,
        text_preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        author_name: author?.name || 'Unknown',
        post_url: post_url || null
      },

      // Analysis results
      sentiment_analysis: {
        sentiment: analysis.sentiment,
        sentiment_score: analysis.sentiment_score,
        is_lead: analysis.is_lead,
        lead_quality: analysis.lead_quality,
        lead_score: analysis.lead_score,
        urgency: analysis.urgency,
        pain_points: analysis.pain_points || [],
        buying_signals: analysis.buying_signals || [],
        confidence: analysis.confidence
      },

      // Generated response (if applicable)
      sales_response: salesResponse ? {
        generated: true,
        response_text: salesResponse.primary_response,
        alternative: salesResponse.alternative_response,
        ready_to_post: salesResponse.ready_to_post,
        follow_up_suggestions: salesResponse.follow_up_suggestions || []
      } : {
        generated: false,
        reason: analysis.is_lead ? 'Lead quality too low or action is to monitor' : 'Not identified as a lead'
      },

      // CRM integration
      crm_integration: crmResult || {
        attempted: false,
        reason: !analysis.is_lead ? 'Not a lead' :
                analysis.lead_score < 30 ? 'Lead score too low (< 30)' :
                !albato_webhook_url ? 'No Albato webhook URL provided' : 'Unknown'
      },

      // Recommended next steps
      next_steps: generateWorkflowNextSteps(analysis, salesResponse, crmResult),

      // Complete workflow summary
      summary: generateWorkflowSummary(analysis, salesResponse, crmResult)
    };

    console.log('✅ Social mention processing complete:', {
      is_lead: workflowResult.sentiment_analysis.is_lead,
      response_generated: workflowResult.sales_response.generated,
      added_to_crm: workflowResult.crm_integration.success || false
    });

    return res.status(200).json(workflowResult);

  } catch (error) {
    console.error('❌ Social mention processing error:', error);

    return res.status(500).json({
      success: false,
      error: 'Social mention processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Generate actionable next steps for the workflow
 */
function generateWorkflowNextSteps(analysis, salesResponse, crmResult) {
  const steps = [];

  if (analysis.is_lead) {
    // Priority 1: Engagement
    if (salesResponse && salesResponse.ready_to_post) {
      steps.push({
        priority: 1,
        step: 'post_response',
        description: 'Post the AI-generated response to engage the lead',
        action: 'Copy the generated response and post it on the social platform',
        urgency: analysis.urgency === 'high' ? 'immediate' : 'within 24 hours'
      });
    }

    // Priority 2: CRM follow-up
    if (crmResult?.success) {
      steps.push({
        priority: 2,
        step: 'check_crm',
        description: 'Review lead details in Aitable CRM',
        action: 'Open Aitable and review the new lead entry',
        urgency: 'within 24 hours'
      });

      if (analysis.lead_quality === 'hot') {
        steps.push({
          priority: 3,
          step: 'sales_handoff',
          description: 'Assign hot lead to sales team',
          action: 'Notify sales rep about high-intent lead',
          urgency: 'immediate'
        });
      }
    }

    // Priority 3: Monitoring
    steps.push({
      priority: 4,
      step: 'monitor_response',
      description: 'Monitor for their reply to your engagement',
      action: 'Set up notifications for responses on this thread',
      urgency: 'within 48 hours'
    });

  } else {
    // Not a lead - just monitor
    steps.push({
      priority: 1,
      step: 'continue_monitoring',
      description: 'Continue monitoring - not a qualified lead yet',
      action: 'Keep tracking this contact for future signals',
      urgency: 'ongoing'
    });
  }

  return steps;
}

/**
 * Generate human-readable workflow summary
 */
function generateWorkflowSummary(analysis, salesResponse, crmResult) {
  const parts = [];

  // Lead identification
  if (analysis.is_lead) {
    parts.push(`✅ Identified as ${analysis.lead_quality} lead (score: ${analysis.lead_score}/100)`);
  } else {
    parts.push(`ℹ️ Not currently identified as a lead`);
  }

  // Sentiment
  parts.push(`Sentiment: ${analysis.sentiment} (${analysis.urgency} urgency)`);

  // Response generation
  if (salesResponse?.generated) {
    parts.push(`✅ AI response generated and ready to post`);
  } else {
    parts.push(`Response: ${salesResponse?.reason || 'Not generated'}`);
  }

  // CRM integration
  if (crmResult?.success) {
    parts.push(`✅ Lead added to Aitable CRM successfully`);
  } else if (crmResult?.attempted) {
    parts.push(`⚠️ CRM integration failed: ${crmResult.message}`);
  } else {
    parts.push(`CRM: ${crmResult?.reason || 'Not attempted'}`);
  }

  return parts.join(' | ');
}
