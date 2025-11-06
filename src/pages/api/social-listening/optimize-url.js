// API Route: URL Optimization with AI - Enhanced with Rate Limiting & Safety
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

// ============================================================================
// SAFETY LIMITS: Prevent abuse and excessive resource usage
// ============================================================================
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024; // 2MB max response size
const TIMEOUT_MS = 10000; // 10 second timeout
const MAX_CONTENT_LENGTH = 5000; // 5000 character limit for content extraction
const REQUEST_DELAY_MS = 1000; // 1 second delay between requests (throttling)

// ============================================================================
// RATE LIMITING: In-memory storage for rate limiting (use Redis in production)
// ============================================================================
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per user

// ============================================================================
// API QUOTA TRACKING: Monitor API usage to prevent suspension
// ============================================================================
const apiQuotas = {
  anthropic: {
    limit: 1000, // Daily limit (adjust based on your plan)
    used: 0,
    resetTime: Date.now() + 24 * 60 * 60 * 1000
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check and enforce rate limits for a user/IP
 * @param {string} identifier - User ID or IP address
 * @returns {object} - { allowed: boolean, retryAfter: number }
 */
function checkRateLimit(identifier) {
  const now = Date.now();
  const userLimits = rateLimits.get(identifier) || { requests: [], lastRequest: 0 };
  
  // Remove old requests outside the window
  userLimits.requests = userLimits.requests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  
  // Check if user exceeded rate limit
  if (userLimits.requests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = Math.min(...userLimits.requests);
    const retryAfter = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Check throttling (minimum delay between requests)
  const timeSinceLastRequest = now - userLimits.lastRequest;
  if (timeSinceLastRequest < REQUEST_DELAY_MS) {
    const retryAfter = Math.ceil((REQUEST_DELAY_MS - timeSinceLastRequest) / 1000);
    return { allowed: false, retryAfter, reason: 'throttled' };
  }
  
  // Add current request
  userLimits.requests.push(now);
  userLimits.lastRequest = now;
  rateLimits.set(identifier, userLimits);
  
  return { allowed: true };
}

/**
 * Check API quota availability
 * @param {string} service - Service name (e.g., 'anthropic')
 * @returns {object} - { available: boolean, remaining: number }
 */
function checkApiQuota(service) {
  const quota = apiQuotas[service];
  if (!quota) return { available: true, remaining: Infinity };
  
  // Reset quota if time window expired
  if (Date.now() > quota.resetTime) {
    quota.used = 0;
    quota.resetTime = Date.now() + 24 * 60 * 60 * 1000;
  }
  
  const remaining = quota.limit - quota.used;
  return {
    available: remaining > 0,
    remaining,
    resetTime: quota.resetTime
  };
}

/**
 * Increment API quota usage
 * @param {string} service - Service name
 */
function incrementApiQuota(service) {
  if (apiQuotas[service]) {
    apiQuotas[service].used++;
  }
}

/**
 * Validate URL to prevent abuse
 * @param {string} url - URL to validate
 * @returns {object} - { valid: boolean, reason: string }
 */
function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Block local/private IPs (SSRF prevention)
    if (
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      parsedUrl.hostname.startsWith('192.168.') ||
      parsedUrl.hostname.startsWith('10.') ||
      parsedUrl.hostname.startsWith('172.')
    ) {
      return { valid: false, reason: 'Local/private URLs not allowed' };
    }
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, reason: 'Only HTTP/HTTPS protocols allowed' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Detect spam/bot-like patterns in requests
 * @param {string} url - URL being analyzed
 * @param {string} identifier - User identifier
 * @returns {object} - { suspicious: boolean, reason: string }
 */
function detectSpamPatterns(url, identifier) {
  // Check for repeated identical requests (potential bot)
  const userLimits = rateLimits.get(identifier);
  if (userLimits && userLimits.requests.length >= 5) {
    const recentRequests = userLimits.requests.slice(-5);
    const timeDiff = recentRequests[4] - recentRequests[0];
    
    // If 5 requests within 5 seconds, flag as suspicious
    if (timeDiff < 5000) {
      return { suspicious: true, reason: 'Too many requests in short time' };
    }
  }
  
  return { suspicious: false };
}

/**
 * Exponential backoff for retries
 * @param {number} attempt - Retry attempt number
 * @returns {number} - Delay in milliseconds
 */
function getBackoffDelay(attempt) {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Get user identifier (IP address or user ID)
  const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  try {
    // 1. VALIDATE URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return res.status(400).json({ error: urlValidation.reason });
    }

    // 2. CHECK RATE LIMITS
    const rateCheck = checkRateLimit(identifier);
    if (!rateCheck.allowed) {
      const message = rateCheck.reason === 'throttled'
        ? 'Request throttled. Please wait before making another request.'
        : 'Rate limit exceeded. Too many requests.';
      
      return res.status(429).json({
        error: message,
        retryAfter: rateCheck.retryAfter,
        remainingTime: rateCheck.retryAfter
      });
    }

    // 3. DETECT SPAM PATTERNS
    const spamCheck = detectSpamPatterns(url, identifier);
    if (spamCheck.suspicious) {
      console.warn(`Suspicious activity detected from ${identifier}: ${spamCheck.reason}`);
      return res.status(429).json({
        error: 'Suspicious activity detected. Please slow down.',
        reason: spamCheck.reason
      });
    }

    // 4. CHECK API QUOTA
    const quotaCheck = checkApiQuota('anthropic');
    if (!quotaCheck.available) {
      return res.status(503).json({
        error: 'API quota exceeded. Please try again later.',
        remaining: 0,
        resetTime: new Date(quotaCheck.resetTime).toISOString()
      });
    }

    // 5. FETCH WEBPAGE CONTENT (with safety limits)
    console.log('Fetching URL:', url);
    let pageContent = '';
    let pageTitle = '';
    let metaDescription = '';

    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        maxContentLength: MAX_RESPONSE_SIZE,
        maxBodyLength: MAX_RESPONSE_SIZE,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: (status) => status < 500 // Accept 4xx, reject 5xx
      });

      // Handle rate limit from external site
      if (response.status === 429) {
        return res.status(429).json({
          error: 'The target website is rate limiting requests. Please try again later.',
          website: url
        });
      }

      const html = response.data;

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1] : '';

      // Extract meta description
      const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      metaDescription = metaMatch ? metaMatch[1] : '';

      // Extract visible text (basic extraction)
      pageContent = html
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, MAX_CONTENT_LENGTH);

    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError.message);
      // Continue with AI analysis even if fetch fails
    }

    // 6. USE CLAUDE AI TO ANALYZE (with quota tracking)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `Analyze this webpage and extract relevant information for a social media listening campaign:

URL: ${url}
Title: ${pageTitle}
Meta Description: ${metaDescription}
Content Sample: ${pageContent.substring(0, 2000)}

Please extract and provide:
1. 5-10 relevant keywords (single words or short phrases)
2. 3-5 relevant hashtags (without the # symbol)
3. A brief campaign description (1-2 sentences)
4. Suggested platforms (twitter, reddit, linkedin) - choose 1-2 most relevant

Format your response as valid JSON with this structure:
{
  "keywords": ["keyword1", "keyword2"],
  "hashtags": ["hashtag1", "hashtag2"],
  "description": "campaign description",
  "platforms": ["twitter", "reddit"]
}`;

    // Increment API quota before making request
    incrementApiQuota('anthropic');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse AI response
    const aiResponse = message.content[0].text;
    console.log('AI Response:', aiResponse);

    // Extract JSON from response (Claude sometimes includes markdown)
    let result;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      result = {
        keywords: ['social media', 'marketing', 'engagement'],
        hashtags: ['socialmedia', 'marketing'],
        description: 'Monitor mentions and conversations related to this product/service',
        platforms: ['twitter', 'reddit']
      };
    }

    // 7. RETURN RESULTS WITH QUOTA INFO
    const updatedQuota = checkApiQuota('anthropic');
    
    return res.status(200).json({
      keywords: result.keywords || [],
      hashtags: result.hashtags || [],
      description: result.description || '',
      platforms: result.platforms || ['twitter'],
      // Include quota information for monitoring
      _meta: {
        quotaRemaining: updatedQuota.remaining,
        quotaResetTime: new Date(updatedQuota.resetTime).toISOString()
      }
    });

  } catch (error) {
    console.error('Optimization error:', error);
    
    // Handle specific error types
    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'API rate limit exceeded. Please try again later.',
        retryAfter: error.response.headers['retry-after'] || 60
      });
    }
    
    return res.status(500).json({
      error: error.message || 'Failed to optimize URL',
      keywords: [],
      hashtags: [],
      description: '',
      platforms: []
    });
  }
}
