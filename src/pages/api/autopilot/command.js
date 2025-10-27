import Anthropic from '@anthropic-ai/sdk';
import { saveWorkflow, query } from '@/lib/database';
import mcpToolsData from '@/../../public/config/MCP_TOOLS_DEFINITION.json';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Autopilot command execution endpoint
 * POST /api/autopilot/command
 * Body: { command: string, files?: string[] }
 *
 * Generates a workflow from the command and executes it immediately
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, files = [] } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' });
    }

    // Build context about uploaded files
    let fileContext = '';
    if (files.length > 0) {
      fileContext = `\n\nUploaded files available for use:\n${files.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;
    }

    // Generate workflow using Claude
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: `You are an expert workflow automation assistant. Your job is to convert natural language commands into executable workflows.

Available MCP Tools:
${JSON.stringify(mcpToolsData.tools, null, 2)}

Generate a valid workflow JSON that:
1. Uses the available MCP tools to accomplish the user's command
2. Includes proper error handling
3. Chains steps logically with variable substitution
4. Returns a complete, executable workflow

Response format (JSON only, no markdown):
{
  "name": "Workflow name",
  "description": "What this workflow does",
  "steps": [
    {
      "id": "step1",
      "name": "Step name",
      "tool": "tool_name",
      "input": { "param": "value or {{previous_step.output}}" }
    }
  ]
}${fileContext}`,
      messages: [
        {
          role: 'user',
          content: command,
        },
      ],
    });

    const rawResponse = message.content[0].text;

    // Parse workflow
    let workflow;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workflow = JSON.parse(jsonMatch[0]);
      } else {
        workflow = JSON.parse(rawResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse workflow:', rawResponse);
      return res.status(500).json({
        error: 'Failed to parse workflow',
        message: parseError.message,
        rawResponse,
      });
    }

    // Validate workflow structure
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      return res.status(500).json({
        error: 'Invalid workflow structure',
        message: 'Workflow must have a steps array',
      });
    }

    // Save workflow to database
    const saved = await saveWorkflow(workflow);

    // Execute workflow immediately
    const executionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/execute-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: saved.id,
      }),
    });

    const executionData = await executionResponse.json();

    // Return combined result
    return res.status(200).json({
      success: true,
      workflow: saved,
      workflowId: saved.id,
      execution: executionData,
      result: executionData.success
        ? `Workflow completed successfully with ${executionData.results?.length || 0} steps`
        : `Workflow failed: ${executionData.error || 'Unknown error'}`,
    });

  } catch (error) {
    console.error('Autopilot command error:', error);
    return res.status(500).json({
      error: 'Command execution failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
