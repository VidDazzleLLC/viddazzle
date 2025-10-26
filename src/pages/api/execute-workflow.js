import { getWorkflow, createExecution, updateExecution, updateWorkflow, logToolUsage, getConnectors, query } from '@/lib/database';
import axios from 'axios';
import mcpToolsData from '@/../../public/config/MCP_TOOLS_DEFINITION.json';

// Use imported JSON data
const mcpTools = mcpToolsData;

/**
 * Execute a workflow
 *
 * This endpoint executes a workflow step-by-step, handling errors,
 * retries, and variable substitution.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { workflowId, workflow: inlineWorkflow, input = {} } = req.body;

    if (!workflowId && !inlineWorkflow) {
      return res.status(400).json({ error: 'workflowId or workflow is required' });
    }

    // Get workflow from database or use inline workflow
    let workflow;
    if (workflowId) {
      workflow = await getWorkflow(workflowId);
    } else {
      workflow = inlineWorkflow;
    }

    // Create execution record
    const execution = await createExecution({
      workflow_id: workflowId || null,
      status: 'running',
      execution_log: [],
    });

    const executionId = execution.id;

    // Execute workflow
    const result = await executeWorkflow(workflow, input, executionId, workflowId);

    // Update execution record
    await updateExecution(executionId, {
      status: result.success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      result: result.outputs,
      error: result.error || null,
      execution_log: result.log,
      duration_ms: result.duration,
    });

    // Update workflow stats
    if (workflowId) {
      const stats = {
        execution_count: workflow.execution_count + 1,
        success_count: result.success ? workflow.success_count + 1 : workflow.success_count,
        failure_count: result.success ? workflow.failure_count : workflow.failure_count + 1,
      };
      await updateWorkflow(workflowId, stats);
    }

    return res.status(200).json({
      success: result.success,
      executionId,
      outputs: result.outputs,
      error: result.error,
      log: result.log,
      duration: result.duration,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return res.status(500).json({
      error: 'Failed to execute workflow',
      message: error.message,
    });
  }
}

/**
 * Execute workflow steps
 */
async function executeWorkflow(workflow, input, executionId, workflowId) {
  const startTime = Date.now();
  const log = [];
  const outputs = {};
  const variables = { ...workflow.variables, ...input };

  try {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];

      log.push({
        step_id: step.id,
        step_name: step.name,
        status: 'running',
        timestamp: new Date().toISOString(),
      });

      try {
        // Execute step with retry logic
        const stepResult = await executeStepWithRetry(step, variables, workflowId, executionId);

        // Store output
        outputs[step.id] = stepResult;
        variables[step.id] = stepResult;

        log[log.length - 1].status = 'completed';
        log[log.length - 1].output = stepResult;
        log[log.length - 1].duration = stepResult._duration;
      } catch (error) {
        log[log.length - 1].status = 'failed';
        log[log.length - 1].error = error.message;

        // Handle error based on step configuration
        if (step.on_error === 'stop') {
          throw error;
        } else if (step.on_error === 'continue') {
          outputs[step.id] = { error: error.message };
          variables[step.id] = { error: error.message };
          continue;
        }
      }
    }

    return {
      success: true,
      outputs,
      log,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      outputs,
      error: error.message,
      log,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Execute a single step with retry logic
 */
async function executeStepWithRetry(step, variables, workflowId, executionId) {
  const maxAttempts = step.retry?.max_attempts || 1;
  const delayMs = step.retry?.delay_ms || 1000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await executeStep(step, variables, workflowId, executionId);
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }
}

/**
 * Execute a single step
 */
async function executeStep(step, variables, workflowId, executionId) {
  const startTime = Date.now();

  // Resolve variables in input
  const resolvedInput = resolveVariables(step.input, variables);

  // Get tool definition
  const tool = mcpTools.tools.find(t => t.name === step.tool);
  if (!tool) {
    throw new Error(`Tool not found: ${step.tool}`);
  }

  // Execute tool
  let result;
  try {
    result = await executeTool(tool, resolvedInput, step.timeout || 30000);
  } catch (error) {
    await logToolUsage({
      tool_name: step.tool,
      workflow_id: workflowId,
      execution_id: executionId,
      input: resolvedInput,
      output: null,
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime,
    });
    throw error;
  }

  // Log tool usage
  await logToolUsage({
    tool_name: step.tool,
    workflow_id: workflowId,
    execution_id: executionId,
    input: resolvedInput,
    output: result,
    success: true,
    error: null,
    duration_ms: Date.now() - startTime,
  });

  return {
    ...result,
    _duration: Date.now() - startTime,
  };
}

/**
 * Execute a tool based on its type
 */
async function executeTool(tool, input, timeout) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
  );

  const executionPromise = (async () => {
    switch (tool.category) {
      case 'network':
        return await executeNetworkTool(tool, input);
      case 'database':
        return await executeDatabaseTool(tool, input);
      case 'control':
        return await executeControlTool(tool, input);
      case 'data':
        return await executeDataTool(tool, input);
      default:
        return await executeGenericTool(tool, input);
    }
  })();

  return Promise.race([executionPromise, timeoutPromise]);
}

/**
 * Execute network tools (HTTP requests, web scraping)
 */
async function executeNetworkTool(tool, input) {
  if (tool.name === 'http_request') {
    const response = await axios({
      url: input.url,
      method: input.method || 'GET',
      headers: input.headers || {},
      data: input.body,
    });

    return {
      status: response.status,
      headers: response.headers,
      body: response.data,
    };
  }

  throw new Error(`Network tool not implemented: ${tool.name}`);
}

/**
 * Execute database tools
 */
async function executeDatabaseTool(tool, input) {
  if (tool.name === 'database_query') {
    let queryText = '';
    let params = [];

    switch (input.operation) {
      case 'select':
        queryText = `SELECT * FROM ${input.table}`;
        if (input.filter) {
          const conditions = [];
          let paramIndex = 1;
          Object.entries(input.filter).forEach(([key, value]) => {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          });
          if (conditions.length > 0) {
            queryText += ` WHERE ${conditions.join(' AND ')}`;
          }
        }
        break;
      case 'insert':
        const insertKeys = Object.keys(input.data);
        const insertValues = Object.values(input.data);
        queryText = `INSERT INTO ${input.table} (${insertKeys.join(', ')}) VALUES (${insertKeys.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
        params = insertValues;
        break;
      case 'update':
        const updateFields = [];
        let updateParamIndex = 1;
        Object.entries(input.data).forEach(([key, value]) => {
          updateFields.push(`${key} = $${updateParamIndex}`);
          params.push(value);
          updateParamIndex++;
        });
        queryText = `UPDATE ${input.table} SET ${updateFields.join(', ')}`;
        if (input.filter) {
          const conditions = [];
          Object.entries(input.filter).forEach(([key, value]) => {
            conditions.push(`${key} = $${updateParamIndex}`);
            params.push(value);
            updateParamIndex++;
          });
          if (conditions.length > 0) {
            queryText += ` WHERE ${conditions.join(' AND ')}`;
          }
        }
        queryText += ' RETURNING *';
        break;
      case 'delete':
        queryText = `DELETE FROM ${input.table}`;
        if (input.filter) {
          const conditions = [];
          let paramIndex = 1;
          Object.entries(input.filter).forEach(([key, value]) => {
            conditions.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
          });
          if (conditions.length > 0) {
            queryText += ` WHERE ${conditions.join(' AND ')}`;
          }
        }
        queryText += ' RETURNING *';
        break;
    }

    const result = await query(queryText, params);
    return { data: result.rows, count: result.rowCount };
  }

  throw new Error(`Database tool not implemented: ${tool.name}`);
}

/**
 * Execute control flow tools
 */
async function executeControlTool(tool, input) {
  if (tool.name === 'conditional_branch') {
    // Evaluate condition
    const result = evaluateCondition(input.condition, input.context || {});
    return {
      result,
      branch: result ? 'true' : 'false',
    };
  }

  if (tool.name === 'wait_delay') {
    await sleep(input.duration);
    return { waited: input.duration };
  }

  if (tool.name === 'loop_iteration') {
    return {
      iterations: input.items.length,
      results: input.items,
    };
  }

  throw new Error(`Control tool not implemented: ${tool.name}`);
}

/**
 * Execute data transformation tools
 */
async function executeDataTool(tool, input) {
  if (tool.name === 'transform_data') {
    let result = input.data;

    for (const operation of input.operations) {
      switch (operation.type) {
        case 'extract':
          result = extractPath(result, operation.path);
          break;
        case 'map':
          result = Array.isArray(result) ? result.map(item => extractPath(item, operation.path)) : result;
          break;
        case 'filter':
          result = Array.isArray(result) ? result.filter(item => evaluateCondition(operation.condition, item)) : result;
          break;
      }
    }

    return { result };
  }

  throw new Error(`Data tool not implemented: ${tool.name}`);
}

/**
 * Execute generic tools (placeholder for future implementations)
 */
async function executeGenericTool(tool, input) {
  // This is a placeholder for tools that need custom implementation
  console.log(`Executing generic tool: ${tool.name}`, input);
  return { success: true, message: `Tool ${tool.name} executed (placeholder)` };
}

/**
 * Resolve variables in input (replace {{variable}} with actual values)
 */
function resolveVariables(input, variables) {
  if (typeof input === 'string') {
    return input.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      return extractPath(variables, path) || match;
    });
  }

  if (Array.isArray(input)) {
    return input.map(item => resolveVariables(item, variables));
  }

  if (typeof input === 'object' && input !== null) {
    const resolved = {};
    for (const [key, value] of Object.entries(input)) {
      resolved[key] = resolveVariables(value, variables);
    }
    return resolved;
  }

  return input;
}

/**
 * Extract value from object using dot notation path
 */
function extractPath(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Evaluate a simple condition
 */
function evaluateCondition(condition, context) {
  try {
    // Create a function with context variables
    const func = new Function(...Object.keys(context), `return ${condition}`);
    return func(...Object.values(context));
  } catch (error) {
    console.error('Error evaluating condition:', error);
    return false;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
