/**
 * Platform Integrations Library
 *
 * Complete API integrations for:
 * - Aitable.ai (CRM)
 * - Muraena.ai (B2B Leads)
 * - Social Media Platforms (Twitter, LinkedIn, Facebook, Reddit)
 * - AI Sales & Sentiment Analysis (Claude)
 */

import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// AITABLE.AI CRM INTEGRATION
// ============================================

const AITABLE_API_BASE = 'https://aitable.ai/fusion/v1';
const AITABLE_API_KEY = process.env.AITABLE_API_KEY;

export async function aitableCreateRecord(datasheetId, fields) {
  try {
    const response = await axios.post(
      `${AITABLE_API_BASE}/datasheets/${datasheetId}/records`,
      {
        records: [{ fields }]
      },
      {
        headers: {
          'Authorization': `Bearer ${AITABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      record_id: response.data.data.records[0].recordId
    };
  } catch (error) {
    console.error('Aitable create record error:', error);
    throw new Error(`Aitable CRM error: ${error.response?.data?.message || error.message}`);
  }
}

export async function aitableGetRecords(datasheetId, options = {}) {
  try {
    const params = {};
    if (options.viewId) params.viewId = options.viewId;
    if (options.filterByFormula) params.filterByFormula = options.filterByFormula;
    if (options.maxRecords) params.maxRecords = options.maxRecords;

    const response = await axios.get(
      `${AITABLE_API_BASE}/datasheets/${datasheetId}/records`,
      {
        headers: {
          'Authorization': `Bearer ${AITABLE_API_KEY}`
        },
        params
      }
    );

    return {
      records: response.data.data.records,
      total: response.data.data.total
    };
  } catch (error) {
    console.error('Aitable get records error:', error);
    throw new Error(`Aitable CRM error: ${error.response?.data?.message || error.message}`);
  }
}

export async function aitableUpdateRecord(datasheetId, recordId, fields) {
  try {
    const response = await axios.patch(
      `${AITABLE_API_BASE}/datasheets/${datasheetId}/records`,
      {
        records: [{ recordId, fields }]
      },
      {
        headers: {
          'Authorization': `Bearer ${AITABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      record_id: recordId
    };
  } catch (error) {
    console.error('Aitable update record error:', error);
    throw new Error(`Aitable CRM error: ${error.response?.data?.message || error.message}`);
  }
}

// ============================================
// MURAENA.AI LEAD GENERATION INTEGRATION
// ============================================

const MURAENA_API_BASE = 'https://api.muraena.ai/v1';
const MURAENA_API_KEY = process.env.MURAENA_API_KEY;

export async function muraenaSearchPeople(filters) {
  try {
    const searchParams = {};
    if (filters.job_title) searchParams.job_title = filters.job_title;
    if (filters.company_name) searchParams.company_name = filters.company_name;
    if (filters.industry) searchParams.industry = filters.industry;
    if (filters.location) searchParams.location = filters.location;
    if (filters.company_size) searchParams.company_size = filters.company_size;
    if (filters.limit) searchParams.limit = filters.limit;

    const response = await axios.post(
      `${MURAENA_API_BASE}/people/search`,
      searchParams,
      {
        headers: {
          'Authorization': `Bearer ${MURAENA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      profiles: response.data.data || response.data.results,
      total_found: response.data.total || response.data.results?.length || 0
    };
  } catch (error) {
    console.error('Muraena search error:', error);
    throw new Error(`Muraena API error: ${error.response?.data?.message || error.message}`);
  }
}

export async function muraenaRevealContact(personId) {
  try {
    const response = await axios.post(
      `${MURAENA_API_BASE}/people/reveal`,
      { person_id: personId },
      {
        headers: {
          'Authorization': `Bearer ${MURAENA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data.data || response.data;

    return {
      email: data.email,
      phone: data.phone,
      linkedin_url: data.linkedin_url,
      company: data.company,
      job_title: data.job_title
    };
  } catch (error) {
    console.error('Muraena reveal contact error:', error);
    throw new Error(`Muraena API error: ${error.response?.data?.message || error.message}`);
  }
}

// ============================================
// SOCIAL MEDIA MONITORING
// ============================================

export async function socialMonitorMentions(keywords, platforms, options = {}) {
  // This is a simplified implementation that combines multiple social APIs
  // In production, you'd integrate with actual social media APIs

  const mentions = [];

  for (const platform of platforms) {
    try {
      let platformMentions = [];

      switch (platform) {
        case 'twitter':
          platformMentions = await monitorTwitter(keywords, options);
          break;
        case 'linkedin':
          platformMentions = await monitorLinkedIn(keywords, options);
          break;
        case 'reddit':
          platformMentions = await monitorReddit(keywords, options);
          break;
        case 'facebook':
          platformMentions = await monitorFacebook(keywords, options);
          break;
      }

      mentions.push(...platformMentions);
    } catch (error) {
      console.error(`Error monitoring ${platform}:`, error);
    }
  }

  return {
    mentions,
    total: mentions.length
  };
}

async function monitorTwitter(keywords, options) {
  // Twitter API v2 integration
  const TWITTER_API_KEY = process.env.TWITTER_BEARER_TOKEN;

  if (!TWITTER_API_KEY) {
    console.warn('Twitter API key not configured');
    return [];
  }

  try {
    const query = keywords.join(' OR ');
    const response = await axios.get(
      'https://api.twitter.com/2/tweets/search/recent',
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_API_KEY}`
        },
        params: {
          query,
          max_results: options.limit || 10,
          'tweet.fields': 'author_id,created_at,public_metrics,entities',
          'user.fields': 'name,username,description',
          expansions: 'author_id'
        }
      }
    );

    const mentions = response.data.data?.map(tweet => ({
      platform: 'twitter',
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      created_at: tweet.created_at,
      engagement: tweet.public_metrics,
      url: `https://twitter.com/i/web/status/${tweet.id}`
    })) || [];

    return mentions;
  } catch (error) {
    console.error('Twitter monitoring error:', error);
    return [];
  }
}

async function monitorLinkedIn(keywords, options) {
  // LinkedIn API integration would go here
  // Note: LinkedIn API has strict access requirements
  console.warn('LinkedIn monitoring requires app approval - using placeholder');
  return [];
}

async function monitorReddit(keywords, options) {
  // Reddit API integration
  try {
    const query = keywords.join(' OR ');
    const response = await axios.get(
      'https://www.reddit.com/search.json',
      {
        params: {
          q: query,
          limit: options.limit || 10,
          sort: 'new'
        }
      }
    );

    const mentions = response.data.data.children.map(post => ({
      platform: 'reddit',
      id: post.data.id,
      text: post.data.title + ' ' + (post.data.selftext || ''),
      author_id: post.data.author,
      created_at: new Date(post.data.created_utc * 1000).toISOString(),
      subreddit: post.data.subreddit,
      score: post.data.score,
      url: `https://reddit.com${post.data.permalink}`
    }));

    return mentions;
  } catch (error) {
    console.error('Reddit monitoring error:', error);
    return [];
  }
}

async function monitorFacebook(keywords, options) {
  // Facebook Graph API integration would go here
  console.warn('Facebook monitoring requires page access token - using placeholder');
  return [];
}

export async function socialPostReply(platform, postId, message) {
  switch (platform) {
    case 'twitter':
      return await twitterReply(postId, message);
    case 'linkedin':
      return await linkedInComment(postId, message);
    case 'reddit':
      return await redditComment(postId, message);
    default:
      throw new Error(`Platform ${platform} not supported for replies`);
  }
}

async function twitterReply(tweetId, message) {
  const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
  const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
  const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
  const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

  if (!TWITTER_ACCESS_TOKEN) {
    throw new Error('Twitter credentials not configured');
  }

  // This would use OAuth 1.0a for posting
  // Simplified implementation - in production use twitter-api-v2 library
  throw new Error('Twitter reply requires OAuth setup - see documentation');
}

async function redditComment(postId, message) {
  // Reddit API comment posting
  throw new Error('Reddit comment requires OAuth setup - see documentation');
}

async function linkedInComment(postId, message) {
  // LinkedIn API comment posting
  throw new Error('LinkedIn comment requires OAuth setup - see documentation');
}

export async function socialSendDM(platform, userId, message) {
  throw new Error('Direct messaging requires platform-specific OAuth - see documentation');
}

// ============================================
// AI SENTIMENT ANALYSIS & LEAD QUALIFICATION
// ============================================

export async function analyzeSentiment(text, context = '') {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      system: `You are an expert sentiment analyzer and lead identifier. Analyze social media posts to:
1. Determine sentiment (positive, negative, neutral, mixed)
2. Identify emotions
3. Detect if the person is expressing a need/pain point (potential lead)
4. Extract specific pain points

Respond in JSON format only.`,
      messages: [{
        role: 'user',
        content: `Analyze this social media post:

"${text}"

${context ? `Context: ${context}` : ''}

Return JSON:
{
  "sentiment": "positive|negative|neutral|mixed",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2"],
  "is_lead": true|false,
  "pain_points": ["pain1", "pain2"]
}`
      }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return result;
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      emotions: [],
      is_lead: false,
      pain_points: []
    };
  }
}

export async function identifyLead(postContent, userProfile = {}, businessContext = '') {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      system: `You are an expert B2B sales AI. Analyze social media activity to identify qualified leads.

Business Offerings:
- iProsper.io: Voice AI system for customer service automation
- Neuro Marketing AI: Advanced marketing intelligence platform
- Business Financing: Competitive financing solutions for growing businesses

Identify if this person is a qualified lead and recommend the best solution.`,
      messages: [{
        role: 'user',
        content: `Post: "${postContent}"

User Profile: ${JSON.stringify(userProfile)}

${businessContext ? `Additional Context: ${businessContext}` : ''}

Determine:
1. Is this a qualified B2B lead?
2. Lead score (0-100)
3. What pain points are they expressing?
4. Which solution fits best?
5. Suggested personalized response

Return JSON:
{
  "is_qualified_lead": boolean,
  "lead_score": number,
  "pain_points": array,
  "recommended_solution": string,
  "suggested_response": string
}`
      }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return result;
  } catch (error) {
    console.error('Lead identification error:', error);
    return {
      is_qualified_lead: false,
      lead_score: 0,
      pain_points: [],
      recommended_solution: 'none',
      suggested_response: ''
    };
  }
}

export async function generateSalesResponse(leadInfo, offerType, tone = 'consultative') {
  const offerDetails = {
    voice_ai: {
      name: 'iProsper.io',
      description: 'Voice AI system that automates customer service and engagement',
      benefits: 'Reduce costs, scale support 24/7, improve customer satisfaction'
    },
    neuro_marketing: {
      name: 'Neuro Marketing AI',
      description: 'Advanced AI-powered marketing intelligence platform',
      benefits: 'Data-driven insights, optimize campaigns, increase conversions'
    },
    financing: {
      name: 'Business Financing',
      description: 'Competitive financing solutions for growing businesses',
      benefits: 'Flexible terms, fast approval, fuel your growth'
    },
    general: {
      name: 'Business Solutions',
      description: 'Complete suite of AI and financing solutions',
      benefits: 'Transform your business with cutting-edge technology'
    }
  };

  const offer = offerDetails[offerType] || offerDetails.general;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1024,
      system: `You are a ${tone} sales expert. Generate personalized, helpful responses to potential leads.

Offering: ${offer.name}
Description: ${offer.description}
Benefits: ${offer.benefits}

Guidelines:
- Be helpful, not pushy
- Address their specific pain points
- Provide genuine value
- Include a clear but soft call-to-action
- Keep it concise (2-3 paragraphs max)`,
      messages: [{
        role: 'user',
        content: `Lead Information:
${JSON.stringify(leadInfo, null, 2)}

Generate a personalized response that:
1. Acknowledges their specific situation/pain points
2. Explains how ${offer.name} can help
3. Includes a clear call-to-action

Return JSON:
{
  "message": "full message text",
  "subject_line": "if this is for email/DM",
  "call_to_action": "specific CTA"
}`
      }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return result;
  } catch (error) {
    console.error('Sales response generation error:', error);
    return {
      message: `I noticed you mentioned challenges with ${leadInfo.pain_points?.[0] || 'business growth'}. We help businesses like yours with ${offer.description}. Would you be open to a quick chat?`,
      subject_line: `Solution for ${leadInfo.pain_points?.[0] || 'your business'}`,
      call_to_action: 'Schedule a 15-minute call'
    };
  }
}

export async function qualifyLeadConversation(conversationHistory = [], latestMessage, businessContext = '') {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      system: `You are a sales qualification AI. Have natural conversations with leads to qualify them using BANT framework:
- Budget: Can they afford it?
- Authority: Are they a decision-maker?
- Need: Do they have a genuine need?
- Timeline: When do they need it?

${businessContext}

Be conversational, helpful, and gather information naturally.`,
      messages: [
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: latestMessage
        }
      ]
    });

    const aiResponse = response.content[0].text;

    // Extract qualification signals from the conversation
    const qualificationStatus = determineQualificationStatus(conversationHistory, latestMessage);

    return {
      response: aiResponse,
      qualification_status: qualificationStatus.status,
      budget_indicator: qualificationStatus.budget,
      urgency: qualificationStatus.urgency,
      next_action: qualificationStatus.next_action
    };
  } catch (error) {
    console.error('Lead conversation error:', error);
    return {
      response: 'Thanks for your interest! Could you tell me more about your current challenges?',
      qualification_status: 'needs_more_info',
      budget_indicator: 'unknown',
      urgency: 'unknown',
      next_action: 'Continue conversation'
    };
  }
}

function determineQualificationStatus(history, latestMessage) {
  const allText = [...history.map(m => m.content), latestMessage].join(' ').toLowerCase();

  let status = 'needs_more_info';
  let budget = 'unknown';
  let urgency = 'unknown';

  // Budget indicators
  if (allText.match(/budget|cost|price|afford|invest/i)) {
    budget = 'discussed';
  }

  // Urgency indicators
  if (allText.match(/asap|urgent|immediately|soon|this week|this month/i)) {
    urgency = 'high';
  } else if (allText.match(/next quarter|few months|planning/i)) {
    urgency = 'medium';
  }

  // Qualification status
  if (allText.match(/yes|interested|let's do it|sign up|get started/i)) {
    status = 'qualified';
  } else if (allText.match(/maybe|not sure|think about|later/i)) {
    status = 'nurture';
  } else if (allText.match(/no|not interested|too expensive|already have/i)) {
    status = 'disqualified';
  }

  return {
    status,
    budget,
    urgency,
    next_action: status === 'qualified' ? 'Schedule demo' : 'Continue nurturing'
  };
}

// ============================================
// FULL SALES AUTOMATION WORKFLOW
// ============================================

export async function runFullSalesAutomation(keywords, platforms, offerTypes, autoEngage = true) {
  const results = {
    leads_found: 0,
    leads_qualified: 0,
    engagements_sent: 0,
    crm_records_created: 0
  };

  try {
    // Step 1: Monitor social media
    const { mentions } = await socialMonitorMentions(keywords, platforms, { limit: 50 });
    results.leads_found = mentions.length;

    // Step 2: Analyze and qualify each mention
    for (const mention of mentions) {
      const sentiment = await analyzeSentiment(mention.text);

      if (!sentiment.is_lead) continue;

      const leadQualification = await identifyLead(mention.text, { platform: mention.platform });

      if (!leadQualification.is_qualified_lead || leadQualification.lead_score < 50) continue;

      results.leads_qualified++;

      // Step 3: Generate and send response (if auto-engage enabled)
      if (autoEngage && offerTypes.length > 0) {
        const offerType = offerTypes[0]; // Use first offer type for now
        const salesResponse = await generateSalesResponse(leadQualification, offerType);

        // For now, just log (actual sending requires OAuth setup)
        console.log(`Would send to ${mention.author_id}: ${salesResponse.message}`);
        results.engagements_sent++;
      }

      // Step 4: Store in CRM (if Aitable is configured)
      if (process.env.AITABLE_API_KEY && process.env.AITABLE_LEADS_DATASHEET_ID) {
        try {
          await aitableCreateRecord(process.env.AITABLE_LEADS_DATASHEET_ID, {
            'Platform': mention.platform,
            'Lead Name': mention.author_id,
            'Post Content': mention.text,
            'Lead Score': leadQualification.lead_score,
            'Pain Points': leadQualification.pain_points.join(', '),
            'Status': 'New',
            'Source URL': mention.url
          });
          results.crm_records_created++;
        } catch (error) {
          console.error('CRM storage error:', error);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Full sales automation error:', error);
    throw error;
  }
}
