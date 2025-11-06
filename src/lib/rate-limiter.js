/**
 * Centralized Rate Limiter & API Quota Manager
 * 
 * Provides reusable rate limiting, throttling, and quota tracking
 * for all API endpoints to prevent account suspension and abuse.
 * 
 * Features:
 * - Per-user/IP rate limiting
 * - Request throttling with minimum delays
 * - API quota tracking (Anthropic, Twitter, Reddit, LinkedIn)
 * - Spam pattern detection
 * - URL validation and SSRF prevention
 * - 429 error handling with exponential backoff
 * 
 * Usage:
 *   import { RateLimiter } from '@/lib/rate-limiter';
 *   
 *   const limiter = new RateLimiter();
 *   const check = limiter.checkRateLimit(userId);
 *   if (!check.allowed) {
 *     return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: check.retryAfter });
 *   }
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  // Rate Limiting
  rateLimitWindow: 60 * 1000, // 1 minute
  maxRequestsPerWindow: 10, // Max 10 requests per minute
  requestDelayMs: 1000, // 1 second between requests
  
  // Spam Detection
  spamThreshold: 5, // 5 requests
  spamWindowMs: 5000, // within 5 seconds
  
  // Safety Limits
  maxResponseSize: 2 * 1024 * 1024, // 2MB
  timeoutMs: 10000, // 10 seconds
  maxContentLength: 5000, // 5000 chars
};

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

class RateLimiter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.rateLimits = new Map();
    this.apiQuotas = {
      anthropic: { limit: 1000, used: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 },
      twitter: { limit: 300, used: 0, resetTime: Date.now() + 15 * 60 * 1000 }, // 15 min window
      reddit: { limit: 60, used: 0, resetTime: Date.now() + 60 * 1000 }, // 1 min window
      linkedin: { limit: 100, used: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 },
    };
  }

  /**
   * Check rate limit for a user/IP
   * @param {string} identifier - User ID or IP address
   * @returns {{allowed: boolean, retryAfter: number, reason?: string}}
   */
  checkRateLimit(identifier) {
    const now = Date.now();
    const userLimits = this.rateLimits.get(identifier) || { requests: [], lastRequest: 0 };
    
    // Remove old requests outside window
    userLimits.requests = userLimits.requests.filter(
      timestamp => now - timestamp < this.config.rateLimitWindow
    );
    
    // Check if exceeded rate limit
    if (userLimits.requests.length >= this.config.maxRequestsPerWindow) {
      const oldestRequest = Math.min(...userLimits.requests);
      const retryAfter = Math.ceil((oldestRequest + this.config.rateLimitWindow - now) / 1000);
      return { allowed: false, retryAfter, reason: 'rate_limit' };
    }
    
    // Check throttling
    const timeSinceLastRequest = now - userLimits.lastRequest;
    if (timeSinceLastRequest < this.config.requestDelayMs) {
      const retryAfter = Math.ceil((this.config.requestDelayMs - timeSinceLastRequest) / 1000);
      return { allowed: false, retryAfter, reason: 'throttled' };
    }
    
    // Add current request
    userLimits.requests.push(now);
    userLimits.lastRequest = now;
    this.rateLimits.set(identifier, userLimits);
    
    return { allowed: true, retryAfter: 0 };
  }

  /**
   * Check API quota for a service
   * @param {string} service - Service name (anthropic, twitter, reddit, linkedin)
   * @returns {{available: boolean, remaining: number, resetTime: number}}
   */
  checkApiQuota(service) {
    const quota = this.apiQuotas[service];
    if (!quota) return { available: true, remaining: Infinity, resetTime: null };
    
    // Reset quota if window expired
    if (Date.now() > quota.resetTime) {
      quota.used = 0;
      // Different reset windows for different services
      if (service === 'anthropic' || service === 'linkedin') {
        quota.resetTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      } else if (service === 'twitter') {
        quota.resetTime = Date.now() + 15 * 60 * 1000; // 15 minutes
      } else if (service === 'reddit') {
        quota.resetTime = Date.now() + 60 * 1000; // 1 minute
      }
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
  incrementApiQuota(service) {
    if (this.apiQuotas[service]) {
      this.apiQuotas[service].used++;
    }
  }

  /**
   * Detect spam/bot patterns
   * @param {string} identifier - User identifier
   * @returns {{suspicious: boolean, reason?: string}}
   */
  detectSpamPatterns(identifier) {
    const userLimits = this.rateLimits.get(identifier);
    if (!userLimits || userLimits.requests.length < this.config.spamThreshold) {
      return { suspicious: false };
    }
    
    const recentRequests = userLimits.requests.slice(-this.config.spamThreshold);
    const timeDiff = recentRequests[recentRequests.length - 1] - recentRequests[0];
    
    if (timeDiff < this.config.spamWindowMs) {
      return { suspicious: true, reason: 'Too many requests in short time' };
    }
    
    return { suspicious: false };
  }

  /**
   * Validate URL for security
   * @param {string} url - URL to validate
   * @returns {{valid: boolean, reason?: string}}
   */
  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Block local/private IPs (SSRF prevention)
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
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
   * Get exponential backoff delay for retries
   * @param {number} attempt - Retry attempt number (0-indexed)
   * @returns {number} Delay in milliseconds
   */
  getBackoffDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  }

  /**
   * Handle 429 errors with retry logic
   * @param {Error} error - Axios error object
   * @param {number} attempt - Current attempt number
   * @returns {{shouldRetry: boolean, delay: number}}
   */
  handle429Error(error, attempt = 0) {
    const maxAttempts = 3;
    
    if (attempt >= maxAttempts) {
      return { shouldRetry: false, delay: 0 };
    }
    
    const retryAfter = error.response?.headers?.['retry-after'];
    let delay;
    
    if (retryAfter) {
      // Use retry-after header if available
      delay = parseInt(retryAfter) * 1000;
    } else {
      // Use exponential backoff
      delay = this.getBackoffDelay(attempt);
    }
    
    return { shouldRetry: true, delay };
  }

  /**
   * Get user identifier from request
   * @param {object} req - Express request object
   * @returns {string} User identifier
   */
  getUserIdentifier(req) {
    return req.headers['x-forwarded-for'] || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown';
  }

  /**
   * Middleware function for Express routes
   * @param {object} options - Middleware options
   * @returns {Function} Express middleware function
   */
  middleware(options = {}) {
    const self = this;
    
    return function rateLimitMiddleware(req, res, next) {
      const identifier = self.getUserIdentifier(req);
      
      // Check rate limit
      const rateCheck = self.checkRateLimit(identifier);
      if (!rateCheck.allowed) {
        const message = rateCheck.reason === 'throttled'
          ? 'Request throttled. Please wait before making another request.'
          : 'Rate limit exceeded. Too many requests.';
        
        return res.status(429).json({
          error: message,
          retryAfter: rateCheck.retryAfter
        });
      }
      
      // Check spam patterns
      const spamCheck = self.detectSpamPatterns(identifier);
      if (spamCheck.suspicious) {
        console.warn(`Suspicious activity from ${identifier}: ${spamCheck.reason}`);
        return res.status(429).json({
          error: 'Suspicious activity detected. Please slow down.'
        });
      }
      
      next();
    };
  }

  /**
   * Reset all rate limits (for testing)
   */
  reset() {
    this.rateLimits.clear();
    Object.keys(this.apiQuotas).forEach(service => {
      this.apiQuotas[service].used = 0;
    });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const globalRateLimiter = new RateLimiter();

// ============================================================================
// EXPORTS
// ============================================================================

export { RateLimiter, globalRateLimiter, DEFAULT_CONFIG };
export default globalRateLimiter;
