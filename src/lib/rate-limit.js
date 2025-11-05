/**
 * Rate Limiting Middleware
 * Protects API routes from abuse by limiting request frequency
 */

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > 300000) { // 5 minutes
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  // Very strict - for expensive operations
  STRICT: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please try again in a minute.'
  },
  // Standard - for most API endpoints
  STANDARD: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please try again later.'
  },
  // Relaxed - for lightweight operations
  RELAXED: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please slow down.'
  },
  // Per hour limits
  HOURLY: {
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour
    message: 'Hourly rate limit exceeded. Please try again later.'
  }
};

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(req) {
  // Prefer user ID if authenticated
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  return `ip:${ip}`;
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(clientId, options) {
  const now = Date.now();
  const key = `${clientId}:${options.windowMs}`;

  // Get or create rate limit data
  let data = rateLimitStore.get(key);

  if (!data || now > data.resetTime) {
    // Create new rate limit window
    data = {
      count: 0,
      resetTime: now + options.windowMs,
      startTime: now
    };
    rateLimitStore.set(key, data);
  }

  // Increment request count
  data.count++;

  // Check if limit exceeded
  const limited = data.count > options.maxRequests;

  return {
    limited,
    remaining: Math.max(0, options.maxRequests - data.count),
    resetTime: data.resetTime,
    retryAfter: Math.ceil((data.resetTime - now) / 1000)
  };
}

/**
 * Rate limiting middleware
 *
 * @param {object} options - Rate limit configuration
 * @param {number} options.maxRequests - Maximum requests allowed in window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {string} options.message - Error message when rate limited
 *
 * Usage:
 * export default rateLimit({ maxRequests: 10, windowMs: 60000 })(handler)
 */
export function rateLimit(options = RateLimitPresets.STANDARD) {
  return function rateLimitMiddleware(handler) {
    return async (req, res) => {
      const clientId = getClientId(req);
      const result = checkRateLimit(clientId, options);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (result.limited) {
        res.setHeader('Retry-After', result.retryAfter);
        return res.status(429).json({
          error: 'Too Many Requests',
          message: options.message,
          retryAfter: result.retryAfter
        });
      }

      // Continue to handler
      return handler(req, res);
    };
  };
}

/**
 * Combine middleware functions
 * Usage: export default combine(withAuth, rateLimit())(handler)
 */
export function combine(...middlewares) {
  return function combinedMiddleware(handler) {
    return middlewares.reduceRight((acc, middleware) => {
      return middleware(acc);
    }, handler);
  };
}

export default {
  rateLimit,
  RateLimitPresets,
  combine,
};
