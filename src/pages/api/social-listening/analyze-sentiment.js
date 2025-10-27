/**
 * Social Listening - Sentiment Analysis API
 *
 * Analyzes social media posts/mentions using Claude AI to:
 * - Determine sentiment (positive, negative, neutral)
 * - Identify if it's a sales lead
 * - Extract pain points and buying signals
 * - Score lead quality
 * - Suggest engagement approach
 *
 * This ACTUALLY WORKS - uses Claude API which is already configured
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
      text,              // The social media post/comment text
      platform,          // twitter, linkedin, facebook, reddit
      author_profile,    // Optional: author info (followers, bio, etc.)
      context,           // Optional: additional context
    } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Missing required field: text',
        example: {
          text: "Really frustrated with our current CRM system. Looking for alternatives...",
          platform: "twitter",
          author_profile: {
            followers: 5000,
            bio: "VP of Sales at TechCorp",
            verified: true
          }
        }
      });
    }

    console.log('🔍 Analyzing sentiment for:', {
      platform,
      text_preview: text.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Use Claude to analyze the social post
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 2048,
      temperature: 0.3, // Lower temperature for more consistent analysis
      system: `You are an expert B2B sales analyst specializing in social listening and lead identification.

Your task is to analyze social media posts and determine:
1. Sentiment (positive, negative, neutral)
2. Whether this represents a sales opportunity
3. Pain points or needs expressed
4. Buying signals or intent indicators
5. Recommended engagement approach

Return your analysis as JSON with this exact structure:
{
  "sentiment": "positive|negative|neutral",
  "sentiment_score": 0.0-1.0 (where 1.0 is most positive),
  "is_lead": true|false,
  "lead_quality": "hot|warm|cold|not_a_lead",
  "lead_score": 0-100,
  "buying_signals": ["signal1", "signal2"],
  "pain_points": ["pain1", "pain2"],
  "topics": ["topic1", "topic2"],
  "urgency": "high|medium|low",
  "recommended_action": "engage_immediately|monitor|qualify|ignore",
  "engagement_approach": "brief description of how to engage",
  "reasoning": "brief explanation of the analysis"
}

Be conservative with lead identification - only mark as lead if there's genuine intent or need.`,
      messages: [
        {
          role: 'user',
          content: `Analyze this social media post:

Platform: ${platform || 'unknown'}
Text: "${text}"
${author_profile ? `\nAuthor Profile: ${JSON.stringify(author_profile, null, 2)}` : ''}
${context ? `\nAdditional Context: ${context}` : ''}

Provide your analysis as valid JSON only, no other text.`
        }
      ]
    });

    // Parse Claude's response
    const analysisText = response.content[0].text;

    // Extract JSON from response (Claude might wrap it in markdown)
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', analysisText);
      throw new Error('Failed to parse AI analysis');
    }

    // Enrich analysis with metadata
    const result = {
      success: true,
      analyzed_at: new Date().toISOString(),
      platform: platform || 'unknown',
      original_text: text,
      analysis: {
        ...analysis,
        // Add confidence score based on text length and detail
        confidence: calculateConfidence(text, analysis),
      },
      // Add suggested next steps
      next_steps: generateNextSteps(analysis),
      // Add Aitable CRM fields ready to use
      crm_fields: generateCRMFields(text, platform, analysis, author_profile),
    };

    console.log('✅ Sentiment analysis complete:', {
      sentiment: result.analysis.sentiment,
      is_lead: result.analysis.is_lead,
      lead_score: result.analysis.lead_score,
      action: result.analysis.recommended_action
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Sentiment analysis error:', error);

    return res.status(500).json({
      success: false,
      error: 'Sentiment analysis failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Calculate confidence score for the analysis
 */
function calculateConfidence(text, analysis) {
  let confidence = 0.7; // Base confidence

  // More text = higher confidence
  if (text.length > 100) confidence += 0.1;
  if (text.length > 300) confidence += 0.1;

  // Clear buying signals = higher confidence
  if (analysis.buying_signals && analysis.buying_signals.length > 0) {
    confidence += 0.05 * analysis.buying_signals.length;
  }

  // Specific pain points = higher confidence
  if (analysis.pain_points && analysis.pain_points.length > 0) {
    confidence += 0.05 * analysis.pain_points.length;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Generate actionable next steps based on analysis
 */
function generateNextSteps(analysis) {
  const steps = [];

  if (analysis.is_lead) {
    switch (analysis.lead_quality) {
      case 'hot':
        steps.push({
          priority: 1,
          action: 'immediate_engagement',
          description: 'Engage within 1 hour - high-intent lead',
          tool: 'ai_generate_response'
        });
        steps.push({
          priority: 2,
          action: 'add_to_crm',
          description: 'Add to Aitable CRM as hot lead',
          tool: 'aitable_create_record'
        });
        steps.push({
          priority: 3,
          action: 'schedule_followup',
          description: 'Schedule follow-up in 24 hours',
          tool: 'calendar_reminder'
        });
        break;

      case 'warm':
        steps.push({
          priority: 1,
          action: 'add_to_crm',
          description: 'Add to Aitable CRM as warm lead',
          tool: 'aitable_create_record'
        });
        steps.push({
          priority: 2,
          action: 'monitor_engagement',
          description: 'Monitor for additional signals',
          tool: 'social_monitor'
        });
        steps.push({
          priority: 3,
          action: 'engage_within_24h',
          description: 'Prepare personalized outreach',
          tool: 'ai_generate_response'
        });
        break;

      case 'cold':
        steps.push({
          priority: 1,
          action: 'add_to_nurture',
          description: 'Add to nurture campaign in Aitable',
          tool: 'aitable_create_record'
        });
        steps.push({
          priority: 2,
          action: 'monitor',
          description: 'Monitor for warming signals',
          tool: 'social_monitor'
        });
        break;
    }
  } else {
    steps.push({
      priority: 1,
      action: 'monitor',
      description: 'Continue monitoring - not a lead currently',
      tool: 'social_monitor'
    });
  }

  return steps;
}

/**
 * Generate ready-to-use CRM fields for Aitable
 */
function generateCRMFields(text, platform, analysis, authorProfile) {
  return {
    // Standard CRM fields
    lead_source: platform || 'social_media',
    lead_status: analysis.lead_quality || 'cold',
    lead_score: analysis.lead_score || 0,

    // Contact info (if available from author profile)
    name: authorProfile?.name || authorProfile?.username || 'Unknown',
    social_profile: authorProfile?.profile_url || '',

    // Lead details
    sentiment: analysis.sentiment,
    urgency: analysis.urgency,
    pain_points: analysis.pain_points?.join(', ') || '',
    buying_signals: analysis.buying_signals?.join(', ') || '',
    topics: analysis.topics?.join(', ') || '',

    // Original content
    original_post: text,
    analyzed_at: new Date().toISOString(),

    // Next action
    next_action: analysis.recommended_action,
    engagement_approach: analysis.engagement_approach,

    // Metadata
    confidence_score: analysis.confidence || 0.7,
    ai_analysis: analysis.reasoning || ''
  };
}
