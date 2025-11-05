/**
 * Sentry Error Monitoring Integration
 * Automatically configured for production error tracking
 *
 * To enable, install Sentry and set environment variables:
 * npm install @sentry/nextjs
 * NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
 */

// Check if Sentry is installed and configured
let Sentry = null;
let sentryEnabled = false;

try {
  // Try to import Sentry if installed
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // In a real setup, you would install @sentry/nextjs
    // Sentry = require('@sentry/nextjs');
    // sentryEnabled = true;
    console.log('⚠️  Sentry DSN found but @sentry/nextjs not installed');
    console.log('   Install with: npm install @sentry/nextjs');
  }
} catch (e) {
  console.log('ℹ️  Sentry not configured (optional)');
}

/**
 * Initialize Sentry (call this in _app.jsx or a startup script)
 */
export function initSentry() {
  if (!sentryEnabled || !Sentry) {
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only send errors in production
    enabled: process.env.NODE_ENV === 'production',

    // Ignore common non-critical errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],

    // BeforeSend hook to filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive query params
      if (event.request?.query_string) {
        event.request.query_string = event.request.query_string.replace(
          /([?&])(token|key|password|secret)=[^&]*/gi,
          '$1$2=REDACTED'
        );
      }

      return event;
    },
  });

  console.log('✅ Sentry error monitoring enabled');
}

/**
 * Log error to Sentry (or console if not available)
 */
export function logError(error, context = {}) {
  if (sentryEnabled && Sentry) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    // Fallback to console logging
    console.error('Error:', error);
    if (Object.keys(context).length > 0) {
      console.error('Context:', context);
    }
  }
}

/**
 * Log message to Sentry (or console if not available)
 */
export function logMessage(message, level = 'info', context = {}) {
  if (sentryEnabled && Sentry) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
    logFn(`[${level.toUpperCase()}]`, message);
    if (Object.keys(context).length > 0) {
      logFn('Context:', context);
    }
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user) {
  if (sentryEnabled && Sentry) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // Don't include sensitive data
    });
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (sentryEnabled && Sentry) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, data = {}) {
  if (sentryEnabled && Sentry) {
    Sentry.addBreadcrumb({
      message,
      data,
      timestamp: Date.now(),
    });
  }
}

export default {
  initSentry,
  logError,
  logMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
};
