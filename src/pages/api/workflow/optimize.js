import { optimizeWorkflow } from '@/lib/learning-engine';
import { getWorkflow, updateWorkflow } from '@/lib/database';

/**
 * Automatically optimize a workflow using AI
 *
 * POST /api/workflow/optimize
 * Body: { workflowId } or { workflow }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflowId, workflow: inlineWorkflow, apply = false } = req.body;

    let workflow;
    if (workflowId) {
      workflow = await getWorkflow(workflowId);
    } else if (inlineWorkflow) {
      workflow = inlineWorkflow;
    } else {
      return res.status(400).json({ error: 'workflowId or workflow is required' });
    }

    // Run AI optimization
    const optimization = await optimizeWorkflow(workflow);

    if (optimization.error) {
      return res.status(500).json({
        error: 'Optimization failed',
        message: optimization.error,
      });
    }

    // If apply=true, save the optimized version
    if (apply && workflowId) {
      await updateWorkflow(workflowId, {
        steps: optimization.optimized.steps,
        metadata: {
          ...workflow.metadata,
          optimized: true,
          optimization_date: new Date().toISOString(),
          changes: optimization.changes,
        },
      });
    }

    return res.status(200).json({
      success: true,
      applied: apply && workflowId,
      original: optimization.original,
      optimized: optimization.optimized,
      suggestions: optimization.suggestions,
      changes: optimization.changes,
      message: apply
        ? 'Workflow optimized and saved successfully'
        : 'Optimization preview generated (not applied)',
    });
  } catch (error) {
    console.error('Error optimizing workflow:', error);
    return res.status(500).json({
      error: 'Failed to optimize workflow',
      message: error.message,
    });
  }
}
