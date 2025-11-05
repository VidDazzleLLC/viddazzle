/**
 * EXAMPLE: Protected Workflows API
 *
 * This is an example of how to secure your API endpoints.
 * Copy this pattern to all your API routes before launching.
 *
 * Features:
 * - Authentication required (Bearer token)
 * - Rate limiting (30 requests/minute)
 * - Input validation
 * - Error handling
 */

import { getWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { rateLimit, RateLimitPresets, combine } from '@/lib/rate-limit';
import { withValidation, validateSchema } from '@/lib/validation';

/**
 * Schema for creating/updating workflows
 */
const workflowSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 1000,
  },
  steps: {
    required: true,
    type: 'array',
    minItems: 1,
    maxItems: 100,
  },
  status: {
    required: false,
    type: 'string',
    enum: ['draft', 'active', 'archived'],
  },
};

/**
 * Main handler - now with authentication and authorization
 */
async function handler(req, res) {
  // req.user is automatically attached by withAuth middleware
  const userId = req.user.id;

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, userId);
      case 'POST':
        return await handlePost(req, res, userId);
      case 'PUT':
        return await handlePut(req, res, userId);
      case 'DELETE':
        return await handleDelete(req, res, userId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Workflow API error:', error);

    // Don't expose internal errors to users
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
}

async function handleGet(req, res, userId) {
  const { id } = req.query;

  if (id) {
    // Get specific workflow - verify ownership
    const workflow = await getWorkflow(id);

    // Check if user owns this workflow
    if (workflow.user_id && workflow.user_id !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this workflow'
      });
    }

    return res.status(200).json({ workflow });
  } else {
    // List user's workflows only
    const workflows = await getWorkflows(userId);
    return res.status(200).json({ workflows });
  }
}

async function handlePost(req, res, userId) {
  // Validate input
  const { valid, errors } = validateSchema(req.body, workflowSchema);

  if (!valid) {
    return res.status(400).json({
      error: 'Validation Error',
      errors
    });
  }

  const { name, description, steps, status, metadata } = req.body;

  // Create workflow with user ownership
  const workflow = await createWorkflow({
    name,
    description,
    steps,
    status: status || 'draft',
    metadata: metadata || {},
    user_id: userId, // Associate with authenticated user
  });

  return res.status(201).json({ workflow });
}

async function handlePut(req, res, userId) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  // Verify ownership before updating
  const existing = await getWorkflow(id);

  if (existing.user_id && existing.user_id !== userId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to modify this workflow'
    });
  }

  // Validate updates
  if (Object.keys(updates).length > 0) {
    const { valid, errors } = validateSchema(updates, workflowSchema);

    if (!valid) {
      return res.status(400).json({
        error: 'Validation Error',
        errors
      });
    }
  }

  const workflow = await updateWorkflow(id, updates);
  return res.status(200).json({ workflow });
}

async function handleDelete(req, res, userId) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  // Verify ownership before deleting
  const existing = await getWorkflow(id);

  if (existing.user_id && existing.user_id !== userId) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to delete this workflow'
    });
  }

  await deleteWorkflow(id);
  return res.status(200).json({ success: true });
}

/**
 * CRITICAL: Apply security middleware before exporting
 *
 * This combines:
 * 1. Authentication (withAuth) - Requires valid Bearer token
 * 2. Rate limiting (rateLimit) - 30 requests per minute
 *
 * The order matters! Auth runs first, then rate limit.
 */
export default combine(
  withAuth,
  rateLimit(RateLimitPresets.STANDARD)
)(handler);

/**
 * TO USE THIS PATTERN IN YOUR OTHER APIs:
 *
 * 1. Copy the imports at the top
 * 2. Add the combine() + export at the bottom
 * 3. Use req.user.id for user-specific operations
 * 4. Add validation schemas for your data
 * 5. Check ownership before modifying/deleting resources
 *
 * That's it! Your API is now secure.
 */
