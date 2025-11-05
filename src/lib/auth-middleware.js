/**
 * Authentication Middleware
 * Protects API routes by verifying user authentication
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client for server-side auth verification
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Verify authentication token from request
 */
export async function verifyAuth(req) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, user: null, error: 'No authentication token provided' };
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseAdmin) {
    // If Supabase is not configured, allow request (for development)
    console.warn('⚠️  Supabase not configured - authentication check skipped');
    return { authenticated: true, user: { id: 'dev-user' }, error: null };
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { authenticated: false, user: null, error: 'Invalid or expired token' };
    }

    return { authenticated: true, user, error: null };
  } catch (error) {
    return { authenticated: false, user: null, error: error.message };
  }
}

/**
 * Middleware wrapper to protect API routes
 * Usage: export default withAuth(handler)
 */
export function withAuth(handler) {
  return async (req, res) => {
    const { authenticated, user, error } = await verifyAuth(req);

    if (!authenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: error || 'Authentication required'
      });
    }

    // Attach user to request object
    req.user = user;

    // Call the original handler
    return handler(req, res);
  };
}

/**
 * Optional auth middleware - allows unauthenticated requests but attaches user if authenticated
 */
export function withOptionalAuth(handler) {
  return async (req, res) => {
    const { authenticated, user } = await verifyAuth(req);

    // Attach user if authenticated, null if not
    req.user = authenticated ? user : null;

    // Call the original handler
    return handler(req, res);
  };
}

/**
 * Check if user has permission for a resource
 * @param {object} user - User object from authentication
 * @param {string} resource - Resource identifier (e.g., workflow ID)
 * @param {string} action - Action to perform (e.g., 'read', 'write', 'delete')
 */
export function checkPermission(user, resource, action) {
  // For now, users can only access their own resources
  // You can extend this for admin roles, teams, etc.

  if (!user) {
    return false;
  }

  // Add your permission logic here
  // Example: Check if user owns the resource
  // Example: Check if user has admin role
  // Example: Check if user is part of a team that owns the resource

  return true; // Placeholder - implement your logic
}

export default {
  verifyAuth,
  withAuth,
  withOptionalAuth,
  checkPermission,
};
