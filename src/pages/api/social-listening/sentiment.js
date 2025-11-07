/**
 * AI-Powered Sentiment Analysis & Lead Scoring API
 * Integrates Claude 3.5 Sonnet for enterprise-grade social media analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Main API handler
 * Supports:
 * - Single mention analysis: POST with {mentionId}
 * - Batch campaign analysis: POST with {campaignId, batchAnalyze: true}
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mentionId, campaignId, batchAnalyze } = req.body;

  try {
    if (batchAnalyze && campaignId) {
      // Batch process all mentions in a campaign
      const results = await batchAnalyzeCampaign(campaignId);
      return res.status(200).json({
        success: true,
        processed: results.processed,
        failed: results.failed,
        results: results.data,
      });
    } else if (mentionId) {
      // Analyze single mention
      const result = await analyzeMention(mentionId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        error: 'Missing required parameters: mentionId or campaignId with batchAnalyze',
      });
    }
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze sentiment',
      details: error.message,
    });
  }
}

/**
 * Analyze a single social media mention
 */
async function analyzeMention(mentionId) {
  const startTime = Date.now();

  // Fetch mention data
  const { data: mention, error: fetchError } = await supabase
    .from('social_mentions')
    .select('*')
    .eq('id', mentionId)
    .single();

  if (fetchError || !mention) {
    throw new Error(`Mention not found: ${mentionId}`);
  }

  // Prepare content for analysis
  const content = `
Platform: ${mention.platform}
Author: ${mention.author_username}
Followers: ${mention.author_followers || 'unknown'}
Content: ${mention.content}
${mention.title ? `Title: ${mention.title}` : ''}
  `.trim();

  // Call Claude for sentiment analysis
  const sentimentData = await analyzeSentimentWithClaude(content);

  // Calculate lead score
  const leadScore = calculateLeadScore({
    sentiment: sentimentData,
    mention,
  });

  const processingTime = Date.now() - startTime;

  // Store sentiment analysis
  const { data: sentimentRecord, error: sentimentError } = await supabase
    .from('sentiment_analysis')
    .insert({
      mention_id: mentionId,
      campaign_id: mention.campaign_id,
      sentiment: sentimentData.sentiment,
      confidence_score: sentimentData.confidence,
      polarity_score: sentimentData.polarity,
      emotions: sentimentData.emotions,
      primary_emotion: sentimentData.primaryEmotion,
      entities: sentimentData.entities,
      key_phrases: sentimentData.keyPhrases,
      topics: sentimentData.topics,
      intent: sentimentData.intent,
      model_version: 'claude-3-5-sonnet-20241022',
      processing_time_ms: processingTime,
    })
    .select()
    .single();

  if (sentimentError) {
    console.error('Failed to store sentiment:', sentimentError);
  }

  // Store lead if qualified
  if (leadScore.isQualified) {
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        mention_id: mentionId,
        campaign_id: mention.campaign_id,
        username: mention.author_username,
        platform: mention.platform,
        profile_url: mention.author_url,
        lead_score: leadScore.totalScore,
        intent_score: leadScore.intentScore,
        influence_score: leadScore.influenceScore,
        engagement_score: leadScore.engagementScore,
        qualification_status: 'qualified',
        qualification_reason: leadScore.reason,
        intent_signals: leadScore.signals,
        pain_points: sentimentData.painPoints || [],
      });

    if (leadError) {
      console.error('Failed to store lead:', leadError);
    }
  }

  return {
    mentionId,
    sentiment: sentimentData,
    leadScore,
    processingTimeMs: processingTime,
  };
}

/**
 * Batch analyze all mentions in a campaign
 */
async function batchAnalyzeCampaign(campaignId) {
  // Fetch all unanalyzed mentions
  const { data: mentions, error } = await supabase
    .from('social_mentions')
    .select('id')
    .eq('campaign_id', campaignId)
    .is('sentiment_analyzed', false)
    .limit(100); // Process 100 at a time

  if (error || !mentions) {
    throw new Error('Failed to fetch mentions');
  }

  const results = {
    processed: 0,
    failed: 0,
    data: [],
  };

  // Process each mention
  for (const mention of mentions) {
    try {
      const result = await analyzeMention(mention.id);
      results.processed++;
      results.data.push(result);
    } catch (error) {
      console.error(`Failed to analyze mention ${mention.id}:`, error);
      results.failed++;
    }
  }

  return results;
}

/**
 * Use Claude to analyze sentiment and extract insights
 */
async function analyzeSentimentWithClaude(content) {
  const prompt = `Analyze this social media post and provide a detailed sentiment analysis.

Post:
${content}

Provide your analysis in the following JSON format:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": 0.0-1.0,
  "polarity": -1.0 to 1.0,
  "primaryEmotion": "joy" | "anger" | "sadness" | "fear" | "surprise" | "disgust" | "neutral",
  "emotions": {
    "joy": 0.0-1.0,
    "anger": 0.0-1.0,
    "sadness": 0.0-1.0,
    "fear": 0.0-1.0,
    "surprise": 0.0-1.0
  },
  "entities": [
    {"text": "entity name", "type": "PERSON" | "ORGANIZATION" | "LOCATION" | "PRODUCT" | "BRAND"}
  ],
  "keyPhrases": ["phrase1", "phrase2"],
  "topics": ["topic1", "topic2"],
  "intent": "purchase" | "support" | "complaint" | "question" | "feedback" | "general",
  "painPoints": ["pain point 1", "pain point 2"],
  "purchaseIntent": true | false,
  "reasoning": "Brief explanation of the analysis"
}

Focus on:
1. Accurate sentiment classification
2. Detecting purchase intent signals
3. Identifying pain points or problems mentioned
4. Extracting relevant entities and topics
5. Understanding the user's intent`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const analysis = JSON.parse(jsonText);

    return analysis;
  } catch (error) {
    console.error('Claude API error:', error);
    
    // Return fallback analysis
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      polarity: 0,
      primaryEmotion: 'neutral',
      emotions: {},
      entities: [],
      keyPhrases: [],
      topics: [],
      intent: 'general',
      painPoints: [],
      purchaseIntent: false,
      reasoning: 'Fallback analysis due to API error',
    };
  }
}

/**
 * Calculate lead score based on sentiment and mention data
 * Algorithm:
 * - Intent Score (50%): Purchase intent, problems mentioned, questions, negative sentiment
 * - Influence Score (25%): Follower count (logarithmic scale)
 * - Engagement Score (15%): Likes, comments, shares
 * - Confidence Score (10%): AI confidence in analysis
 */
function calculateLeadScore({ sentiment, mention }) {
  // 1. Intent Score (0-100, weighted 50%)
  let intentScore = 0;
  
  if (sentiment.purchaseIntent) {
    intentScore += 40;
  }
  
  if (sentiment.intent === 'purchase') {
    intentScore += 30;
  } else if (sentiment.intent === 'question') {
    intentScore += 20;
  } else if (sentiment.intent === 'complaint' || sentiment.intent === 'support') {
    intentScore += 15;
  }
  
  if (sentiment.painPoints && sentiment.painPoints.length > 0) {
    intentScore += Math.min(sentiment.painPoints.length * 5, 20);
  }
  
  if (sentiment.sentiment === 'negative') {
    intentScore += 10;
  }
  
  intentScore = Math.min(intentScore, 100);

  // 2. Influence Score (0-100, weighted 25%)
  let influenceScore = 0;
  const followers = mention.author_followers || 0;
  
  if (followers > 0) {
    // Logarithmic scale: 0 followers = 0, 100 = 10, 1K = 30, 10K = 50, 100K = 70, 1M+ = 100
    influenceScore = Math.min(Math.log10(followers + 1) * 25, 100);
  }

  // 3. Engagement Score (0-100, weighted 15%)
  let engagementScore = 0;
  const likes = mention.likes_count || 0;
  const comments = mention.comments_count || 0;
  const shares = mention.shares_count || 0;
  const totalEngagement = likes + (comments * 3) + (shares * 5);
  
  if (totalEngagement > 0) {
    engagementScore = Math.min(Math.log10(totalEngagement + 1) * 30, 100);
  }

  // 4. Confidence Score (0-100, weighted 10%)
  const confidenceScore = sentiment.confidence * 100;

  // Calculate weighted total score
  const totalScore = (
    intentScore * 0.5 +
    influenceScore * 0.25 +
    engagementScore * 0.15 +
    confidenceScore * 0.1
  );

  // Qualify leads with score >= 60
  const isQualified = totalScore >= 60;

  // Collect intent signals
  const signals = [];
  if (sentiment.purchaseIntent) signals.push('purchase_intent');
  if (sentiment.painPoints?.length > 0) signals.push('pain_points_mentioned');
  if (sentiment.intent === 'question') signals.push('asking_questions');
  if (sentiment.sentiment === 'negative') signals.push('negative_sentiment');

  // Generate qualification reason
  let reason = '';
  if (isQualified) {
    if (intentScore >= 50) {
      reason = 'High purchase intent detected';
    } else if (influenceScore >= 60) {
      reason = 'Influential author with relevant content';
    } else if (totalScore >= 70) {
      reason = 'Strong overall lead indicators';
    } else {
      reason = 'Qualified based on combined factors';
    }
  }

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    intentScore: Math.round(intentScore * 100) / 100,
    influenceScore: Math.round(influenceScore * 100) / 100,
    engagementScore: Math.round(engagementScore * 100) / 100,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    isQualified,
    reason,
    signals,
  };
}
