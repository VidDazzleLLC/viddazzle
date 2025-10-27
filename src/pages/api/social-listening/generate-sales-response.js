/**
 * AI Sales Response Generator
 *
 * Generates personalized, context-aware sales responses for social media engagement
 * Uses Claude AI to create authentic, helpful responses that don't feel like spam
 *
 * This ACTUALLY WORKS - powered by Claude API
 */

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Validate ANTHROPIC_API_KEY exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      success: false,
      error: 'Claude API not configured',
      message: 'ANTHROPIC_API_KEY environment variable is missing',
    });
  }

  let anthropic;
  try {
    anthropic = new Anthropic({ apiKey });
  } catch (initError) {
    console.error('❌ Failed to initialize Anthropic client:', initError);
    return res.status(500).json({
      success: false,
      error: 'Claude API initialization failed',
      message: initError.message,
    });
  }

  try {
    const {
      original_post,        // The post we're responding to
      sentiment_analysis,   // Optional: analysis from analyze-sentiment endpoint
      your_company,         // Your company name/info
      your_solution,        // Brief description of what you offer
      tone,                 // professional, friendly, casual, consultative
      goal,                 // start_conversation, offer_help, share_resource, book_meeting
      platform,             // twitter, linkedin, facebook, reddit
    } = req.body;

    if (!original_post) {
      return res.status(400).json({
        error: 'Missing required field: original_post',
        example: {
          original_post: "Frustrated with our current CRM. Spent 2 hours trying to generate a simple report...",
          your_company: "AutomationPro",
          your_solution: "We help companies automate their CRM workflows and reporting",
          tone: "consultative",
          goal: "start_conversation",
          platform: "linkedin"
        }
      });
    }

    console.log('🤖 Generating AI sales response...', {
      post_preview: original_post.substring(0, 50) + '...',
      goal: goal || 'start_conversation',
      tone: tone || 'professional'
    });

    // Build context for Claude
    const contextParts = [];

    if (sentiment_analysis) {
      contextParts.push(`Sentiment Analysis:
- Sentiment: ${sentiment_analysis.sentiment}
- Lead Quality: ${sentiment_analysis.lead_quality}
- Pain Points: ${sentiment_analysis.pain_points?.join(', ')}
- Buying Signals: ${sentiment_analysis.buying_signals?.join(', ')}
- Engagement Approach: ${sentiment_analysis.engagement_approach}`);
    }

    if (your_company || your_solution) {
      contextParts.push(`Your Company/Solution:
${your_company ? `Company: ${your_company}` : ''}
${your_solution ? `What We Do: ${your_solution}` : ''}`);
    }

    const context = contextParts.join('\n\n');

    // Generate response using Claude
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 1024,
      temperature: 0.7, // Higher temperature for more natural, varied responses
      system: `You are an expert B2B sales professional who engages authentically on social media.

Your goal is to generate helpful, non-spammy responses that:
1. Show genuine empathy and understanding
2. Provide immediate value (insight, tip, or resource)
3. Subtly position your solution if relevant
4. Open the door for further conversation
5. Feel human and authentic, not robotic or salesy

IMPORTANT RULES:
- NEVER be pushy or overtly salesy
- NEVER say "I work for..." or "My company..." immediately
- DO lead with empathy and value
- DO ask thoughtful questions
- DO share a quick tip or insight
- Keep it conversational and brief (2-3 sentences for ${platform === 'twitter' ? 'Twitter' : 'most platforms'})
- Match the tone: ${tone || 'professional'}

Response goal: ${goal || 'start_conversation'}

Return JSON with this structure:
{
  "response_text": "The actual response to post",
  "response_length": number of characters,
  "alternative_response": "A different approach (optional)",
  "follow_up_suggestions": ["suggestion1", "suggestion2"],
  "reasoning": "Why this approach works",
  "dos": ["do this", "do that"],
  "donts": ["don't do this", "don't do that"]
}`,
      messages: [
        {
          role: 'user',
          content: `Generate a sales response for this social media post:

ORIGINAL POST:
"${original_post}"

PLATFORM: ${platform || 'unknown'}

${context ? `CONTEXT:\n${context}` : ''}

Generate an authentic, helpful response that achieves the goal: ${goal || 'start_conversation'}

Return valid JSON only.`
        }
      ]
    });

    // Parse Claude's response
    const responseText = response.content[0].text;

    let generatedResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      generatedResponse = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      throw new Error('Failed to parse AI response generation');
    }

    // Add platform-specific validations and adjustments
    const platformLimits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 8000,
      reddit: 10000,
    };

    const charLimit = platformLimits[platform] || 1000;

    if (generatedResponse.response_text.length > charLimit) {
      // Too long for platform - generate shorter version
      console.warn(`Response too long for ${platform}: ${generatedResponse.response_text.length} chars`);

      // Add truncation warning
      generatedResponse.warning = `Response exceeds ${platform} character limit (${charLimit}). Consider using alternative or shortening.`;
    }

    // Build final result
    const result = {
      success: true,
      generated_at: new Date().toISOString(),
      platform: platform || 'unknown',
      goal: goal || 'start_conversation',
      tone: tone || 'professional',

      // The generated responses
      primary_response: generatedResponse.response_text,
      alternative_response: generatedResponse.alternative_response || null,

      // Metadata
      response_length: generatedResponse.response_length || generatedResponse.response_text.length,
      character_limit: charLimit,
      within_limit: generatedResponse.response_text.length <= charLimit,

      // Guidance
      follow_up_suggestions: generatedResponse.follow_up_suggestions || [],
      best_practices: {
        dos: generatedResponse.dos || [],
        donts: generatedResponse.donts || []
      },

      // AI reasoning
      reasoning: generatedResponse.reasoning || '',

      // Ready to use
      ready_to_post: generatedResponse.response_text.length <= charLimit,

      // Next steps
      next_actions: generateNextActions(goal, sentiment_analysis)
    };

    console.log('✅ AI response generated:', {
      length: result.response_length,
      within_limit: result.within_limit,
      goal: goal
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Response generation error:', error);

    return res.status(500).json({
      success: false,
      error: 'Response generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Generate suggested next actions based on goal and lead quality
 */
function generateNextActions(goal, sentimentAnalysis) {
  const actions = [];

  // Based on goal
  switch (goal) {
    case 'book_meeting':
      actions.push({
        action: 'send_calendar_link',
        description: 'If they respond positively, send calendar booking link',
        timing: 'immediate'
      });
      break;

    case 'share_resource':
      actions.push({
        action: 'prepare_resource',
        description: 'Have the resource/link ready to share',
        timing: 'immediate'
      });
      break;

    case 'start_conversation':
      actions.push({
        action: 'monitor_response',
        description: 'Watch for their reply and engage quickly',
        timing: 'within 1 hour'
      });
      break;
  }

  // Based on lead quality
  if (sentimentAnalysis?.lead_quality === 'hot') {
    actions.push({
      action: 'escalate_to_sales',
      description: 'Notify sales team of hot lead engagement',
      timing: 'immediate'
    });
  }

  // Always add these
  actions.push({
    action: 'log_to_crm',
    description: 'Log engagement in Aitable CRM',
    timing: 'immediate'
  });

  actions.push({
    action: 'schedule_followup',
    description: 'Set reminder to follow up if no response in 48h',
    timing: '48 hours'
  });

  return actions;
}
