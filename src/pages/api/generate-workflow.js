import Anthropic from '@anthropic-ai/sdk';
import { createWorkflow } from '@/lib/database';
import fs from 'fs';
import path from 'path';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Load MCP tools definition
const mcpToolsPath = path.join(process.cwd(), 'public/config/MCP_TOOLS_DEFINITION.json');
const mcpTools = JSON.parse(fs.readFileSync(mcpToolsPath, 'utf-8'));

// Load connectors library
const connectorsPath = path.join(process.cwd(), 'public/config/CONNECTORS_LIBRARY.json');
const connectors = JSON.parse(fs.readFileSync(connectorsPath, 'utf-8'));

/**
 * Generate a workflow using Claude and MCP tools
 *
 * This endpoint uses Claude Opus 4.1 to understand the user's intent and
 * generate a structured workflow using available MCP tools and connectors.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, context = {}, save = true } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Build the system prompt with MCP tools and connectors context
    const systemPrompt = buildSystemPrompt();

    // Call Claude to generate the workflow
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(prompt, context),
        },
      ],
      temperature: 0.7,
    });

    // Extract the workflow from Claude's response
    const workflowData = parseWorkflowResponse(response);

    // Save to database if requested
    let savedWorkflow = null;
    if (save) {
      savedWorkflow = await createWorkflow({
        name: workflowData.name,
        description: workflowData.description,
        steps: workflowData.steps,
        status: 'draft',
        metadata: {
          generated_by: 'claude',
          model: process.env.CLAUDE_MODEL || 'claude-opus-4-20250514',
          prompt: prompt,
          context: context,
        },
      });
    }

    return res.status(200).json({
      success: true,
      workflow: workflowData,
      saved: savedWorkflow,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error('Error generating workflow:', error);
    return res.status(500).json({
      error: 'Failed to generate workflow',
      message: error.message,
    });
  }
}

/**
 * Build the system prompt with MCP tools and connectors
 */
function buildSystemPrompt() {
  return `You are an expert workflow automation AI assistant. Your task is to generate structured workflows based on user requests.

You have access to the following MCP tools:
${JSON.stringify(mcpTools.tools, null, 2)}

Available connectors:
${JSON.stringify(connectors.connectors.map(c => ({
  id: c.id,
  name: c.name,
  description: c.description,
  actions: c.actions,
})), null, 2)}

When generating workflows, follow these guidelines:

1. WORKFLOW STRUCTURE:
   - Each workflow must have: name, description, and steps array
   - Each step must have: id, name, tool, input, and optional: on_error, retry, timeout
   - Steps can reference previous step outputs using {{step_id.output_field}}

2. TOOL SELECTION:
   - Choose appropriate MCP tools based on the task
   - Use connectors when integrating with external services
   - Prefer built-in tools over external APIs when possible

3. ERROR HANDLING:
   - Add retry logic for network operations (max 3 retries)
   - Include on_error steps for critical operations
   - Use conditional_branch for decision points

4. BEST PRACTICES:
   - Break complex tasks into smaller steps
   - Use descriptive names for steps
   - Add comments in metadata for complex logic
   - Keep workflows under 50 steps for performance

5. OUTPUT FORMAT:
   Return your response as a JSON object with this structure:
   {
     "name": "Workflow Name",
     "description": "What this workflow does",
     "steps": [
       {
         "id": "step_1",
         "name": "Step Name",
         "tool": "tool_name",
         "input": { ... },
         "on_error": "continue|stop|retry",
         "retry": { "max_attempts": 3, "delay_ms": 1000 },
         "timeout": 30000
       }
     ],
     "variables": { ... },
     "triggers": { ... }
   }

Be creative but practical. Generate workflows that are efficient, maintainable, and handle errors gracefully.`;
}

/**
 * Build the user prompt with context
 */
function buildUserPrompt(prompt, context) {
  let userPrompt = `Generate a workflow for the following task:\n\n${prompt}`;

  if (Object.keys(context).length > 0) {
    userPrompt += `\n\nAdditional context:\n${JSON.stringify(context, null, 2)}`;
  }

  userPrompt += `\n\nPlease generate a complete, executable workflow that accomplishes this task. Return only the JSON workflow object.`;

  return userPrompt;
}

/**
 * Parse Claude's response to extract workflow
 */
function parseWorkflowResponse(response) {
  try {
    const content = response.content[0].text;

    // Try to extract JSON from the response
    // Claude might wrap it in markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) ||
                     content.match(/```\n([\s\S]*?)\n```/) ||
                     [null, content];

    const jsonText = jsonMatch[1] || content;
    const workflow = JSON.parse(jsonText);

    // Validate workflow structure
    if (!workflow.name || !workflow.steps || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow structure');
    }

    // Ensure each step has required fields
    workflow.steps = workflow.steps.map((step, index) => ({
      id: step.id || `step_${index + 1}`,
      name: step.name || `Step ${index + 1}`,
      tool: step.tool,
      input: step.input || {},
      on_error: step.on_error || 'stop',
      retry: step.retry || null,
      timeout: step.timeout || 30000,
      metadata: step.metadata || {},
    }));

    return workflow;
  } catch (error) {
    console.error('Error parsing workflow response:', error);
    throw new Error('Failed to parse workflow from Claude response');
  }
}

/**
 * Helper function to validate tool availability
 */
function validateTool(toolName) {
  return mcpTools.tools.find(t => t.name === toolName);
}

/**
 * Helper function to get connector by ID
 */
function getConnector(connectorId) {
  return connectors.connectors.find(c => c.id === connectorId);
}
