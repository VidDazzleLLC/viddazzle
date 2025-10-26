import { generateImprovementSuggestions, optimizeWorkflow } from '@/lib/learning-engine';
import { getWorkflow } from '@/lib/database';

/**
 * Get AI-powered improvement suggestions for a workflow
 *
 * GET /api/workflow/suggestions?workflowId=xxx
 * POST /api/workflow/suggestions (with workflow in body)
 */
export default async function handler(req, res) {
  try {
    let workflow;

    if (req.method === 'GET') {
      const { workflowId } = req.query;
      if (!workflowId) {
        return res.status(400).json({ error: 'workflowId is required' });
      }
      workflow = await getWorkflow(workflowId);
    } else if (req.method === 'POST') {
      workflow = req.body.workflow;
      if (!workflow) {
        return res.status(400).json({ error: 'workflow is required in body' });
      }
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Generate AI-powered suggestions
    const suggestions = await generateImprovementSuggestions(workflow);

    return res.status(200).json({
      success: true,
      workflowName: workflow.name,
      suggestions: suggestions.suggestions || [],
      count: suggestions.suggestions?.length || 0,
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error.message,
    });
  }
}
