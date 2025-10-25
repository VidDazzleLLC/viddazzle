import { getWorkflows, getWorkflow, createWorkflow, updateWorkflow, deleteWorkflow } from '@/lib/supabase';

/**
 * API endpoint for managing workflows
 *
 * GET /api/workflows - List all workflows
 * GET /api/workflows?id=xxx - Get a specific workflow
 * POST /api/workflows - Create a new workflow
 * PUT /api/workflows - Update a workflow
 * DELETE /api/workflows?id=xxx - Delete a workflow
 */
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Workflow API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

async function handleGet(req, res) {
  const { id, userId } = req.query;

  if (id) {
    // Get specific workflow
    const workflow = await getWorkflow(id);
    return res.status(200).json({ workflow });
  } else {
    // List all workflows
    const workflows = await getWorkflows(userId);
    return res.status(200).json({ workflows });
  }
}

async function handlePost(req, res) {
  const { name, description, steps, status, metadata } = req.body;

  if (!name || !steps) {
    return res.status(400).json({ error: 'name and steps are required' });
  }

  const workflow = await createWorkflow({
    name,
    description,
    steps,
    status: status || 'draft',
    metadata: metadata || {},
  });

  return res.status(201).json({ workflow });
}

async function handlePut(req, res) {
  const { id, ...updates } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  const workflow = await updateWorkflow(id, updates);
  return res.status(200).json({ workflow });
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'id is required' });
  }

  await deleteWorkflow(id);
  return res.status(200).json({ success: true });
}
