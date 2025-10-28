import Anthropic from '@anthropic-ai/sdk';
import { saveWorkflow, query } from '@/lib/database';
import mcpToolsData from '@/../../public/config/MCP_TOOLS_DEFINITION.json';
import { trackUsage, checkPlatformAvailable } from '@/lib/quota-manager';

// In-memory cache for idempotency and response caching
const idempotencyCache = new Map();
const responseCache = new Map();

// Cleanup old cache entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);

  // Cleanup idempotency cache (1 hour TTL)
  for (const [key, value] of idempotencyCache.entries()) {
    if (value.timestamp < oneHourAgo) {
      idempotencyCache.delete(key);
    }
  }

  // Cleanup response cache (1 hour TTL)
  for (const [key, value] of responseCache.entries()) {
    if (value.timestamp < oneHourAgo) {
      responseCache.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Autopilot command execution endpoint
 * POST /api/autopilot/command
 * Body: { command: string, files?: string[] }
 * Headers: X-Idempotency-Key (optional)
 *
 * Generates a workflow from the command and executes it immediately
 *
 * Features:
 * - Rate limiting via quota system
 * - Idempotency to prevent duplicate workflow creation
 * - Response caching to reduce Claude API costs
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // FEATURE 1: Idempotency - Prevent duplicate workflow creation
  const idempotencyKey = req.headers['x-idempotency-key'] || `cmd_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Return cached result if this request was already processed
  if (idempotencyCache.has(idempotencyKey)) {
    const cached = idempotencyCache.get(idempotencyKey);
    console.log('✅ Returning cached result for idempotency key:', idempotencyKey);
    return res.status(200).json({
      ...cached.result,
      cached: true,
      cached_at: new Date(cached.timestamp).toISOString(),
    });
  }

  // FEATURE 2: Rate Limiting - Prevent quota exhaustion
  const quotaCheck = await checkPlatformAvailable('autopilot', 'commands');
  if (!quotaCheck.available) {
    console.warn('⚠️ Rate limit exceeded for autopilot commands');
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: quotaCheck.message,
      usage: quotaCheck.usage,
      limits: quotaCheck.limits,
      retry_after: '1 hour',
    });
  }

  // FEATURE 3: Response Caching - Reduce Claude API costs for identical commands
  const { command, files = [] } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command is required' });
  }

  // Create cache key from command + files
  const cacheKey = JSON.stringify({ command, files: files.sort() });

  // Return cached workflow if identical command was recently processed
  if (responseCache.has(cacheKey)) {
    const cached = responseCache.get(cacheKey);
    console.log('✅ Returning cached workflow for identical command');

    // Still execute the workflow (it's a new request) but use cached workflow definition
    const apiHost = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseURL = `${protocol}://${apiHost}`;

    const executionResponse = await fetch(`${baseURL}/api/execute-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: cached.workflow.id,
      }),
    });

    const executionData = await executionResponse.json();

    // Track usage for rate limiting
    await trackUsage('autopilot', 'commands', 1);

    const result = {
      success: true,
      workflow: cached.workflow,
      workflowId: cached.workflow.id,
      execution: executionData,
      result: executionData.success
        ? `Workflow completed successfully with ${executionData.results?.length || 0} steps`
        : `Workflow failed: ${executionData.error || 'Unknown error'}`,
      cached_workflow: true,
      cached_at: new Date(cached.timestamp).toISOString(),
    };

    // Store in idempotency cache
    idempotencyCache.set(idempotencyKey, {
      result,
      timestamp: Date.now(),
    });

    return res.status(200).json(result);
  }

  // Validate ANTHROPIC_API_KEY exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not configured');
    return res.status(500).json({
      error: 'Claude API not configured',
      message: 'ANTHROPIC_API_KEY environment variable is missing',
    });
  }

  let anthropic;
  try {
    anthropic = new Anthropic({ apiKey });
  } catch (initError) {
    console.error('❌ Failed to initialize Anthropic client:', initError);
    return res.status(500).json({
      error: 'Claude API initialization failed',
      message: initError.message,
    });
  }

  try {
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
    console.log('📝 Claude workflow response received:', rawResponse.substring(0, 200) + '...');

    // Parse workflow with improved error handling
    let workflow;
    try {
      // Try multiple parsing strategies
      let jsonText = rawResponse;

      // Strategy 1: Remove markdown code blocks (```json ... ```)
      const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        jsonText = markdownMatch[1].trim();
        console.log('✅ Extracted JSON from markdown code block');
      }

      // Strategy 2: Extract JSON object from text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        console.log('✅ Extracted JSON object from text');
      }

      // Strategy 3: Parse the JSON
      workflow = JSON.parse(jsonText);
      console.log('✅ Successfully parsed workflow JSON');

    } catch (parseError) {
      console.error('❌ Failed to parse workflow. Raw response:', rawResponse);
      console.error('Parse error:', parseError.message);

      return res.status(500).json({
        error: 'Failed to parse workflow',
        message: `Claude returned invalid JSON: ${parseError.message}`,
        rawResponse: rawResponse.substring(0, 500), // Only return first 500 chars
        hint: 'Try rephrasing your command or check if the workflow is too complex',
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

    // Execute workflow immediately using dynamic URL
    const apiHost = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseURL = `${protocol}://${apiHost}`;

    console.log('🚀 Executing workflow via:', `${baseURL}/api/execute-workflow`);

    const executionResponse = await fetch(`${baseURL}/api/execute-workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: saved.id,
      }),
    });

    const executionData = await executionResponse.json();

    // Track usage for rate limiting
    await trackUsage('autopilot', 'commands', 1);

    // Build result object
    const result = {
      success: true,
      workflow: saved,
      workflowId: saved.id,
      execution: executionData,
      result: executionData.success
        ? `Workflow completed successfully with ${executionData.results?.length || 0} steps`
        : `Workflow failed: ${executionData.error || 'Unknown error'}`,
    };

    // Store workflow in response cache (for duplicate command detection)
    responseCache.set(cacheKey, {
      workflow: saved,
      timestamp: Date.now(),
    });
    console.log('💾 Cached workflow definition for future requests');

    // Store result in idempotency cache (for duplicate request detection)
    idempotencyCache.set(idempotencyKey, {
      result,
      timestamp: Date.now(),
    });
    console.log('💾 Cached result for idempotency key:', idempotencyKey);

    // Return combined result
    return res.status(200).json(result);

  } catch (error) {
    console.error('Autopilot command error:', error);
    return res.status(500).json({
      error: 'Command execution failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
