import { Pool } from 'pg';

// Create a connection pool to Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to execute queries
export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

/**
 * Create a new workflow
 */
export async function createWorkflow(workflowData) {
  const { name, description, steps, status = 'draft', metadata = {}, user_id = null } = workflowData;

  const result = await query(
    `INSERT INTO workflows (name, description, steps, status, metadata, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, JSON.stringify(steps), status, JSON.stringify(metadata), user_id]
  );

  return result.rows[0];
}

/**
 * Get all workflows
 */
export async function getWorkflows(userId = null) {
  let queryText = 'SELECT * FROM workflows';
  let params = [];

  if (userId) {
    queryText += ' WHERE user_id = $1';
    params = [userId];
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id) {
  const result = await query(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Workflow not found');
  }

  return result.rows[0];
}

/**
 * Update a workflow
 */
export async function updateWorkflow(id, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex}`);
    values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
    paramIndex++;
  });

  values.push(id);

  const result = await query(
    `UPDATE workflows SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Workflow not found');
  }

  return result.rows[0];
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id) {
  await query('DELETE FROM workflows WHERE id = $1', [id]);
}

/**
 * Create a workflow execution record
 */
export async function createExecution(executionData) {
  const { workflow_id = null, status = 'pending', execution_log = [] } = executionData;

  const result = await query(
    `INSERT INTO workflow_executions (workflow_id, status, execution_log)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [workflow_id, status, JSON.stringify(execution_log)]
  );

  return result.rows[0];
}

/**
 * Update a workflow execution
 */
export async function updateExecution(id, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.keys(updates).forEach(key => {
    fields.push(`${key} = $${paramIndex}`);
    values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
    paramIndex++;
  });

  values.push(id);

  const result = await query(
    `UPDATE workflow_executions SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('Execution not found');
  }

  return result.rows[0];
}

/**
 * Get executions for a workflow
 */
export async function getExecutions(workflowId) {
  const result = await query(
    'SELECT * FROM workflow_executions WHERE workflow_id = $1 ORDER BY started_at DESC',
    [workflowId]
  );

  return result.rows;
}

/**
 * Search tutorial embeddings using vector similarity
 */
export async function searchTutorials(queryEmbedding, matchThreshold = 0.7, matchCount = 5) {
  const result = await query(
    `SELECT id, content, metadata,
            1 - (embedding <=> $1::vector) as similarity
     FROM tutorial_embeddings
     WHERE 1 - (embedding <=> $1::vector) > $2
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [`[${queryEmbedding.join(',')}]`, matchThreshold, matchCount]
  );

  return result.rows;
}

/**
 * Insert tutorial embedding
 */
export async function insertTutorialEmbedding(content, embedding, metadata = {}) {
  const result = await query(
    `INSERT INTO tutorial_embeddings (content, embedding, metadata, category, tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      content,
      `[${embedding.join(',')}]`,
      JSON.stringify(metadata),
      metadata.category || null,
      metadata.tags || []
    ]
  );

  return result.rows[0];
}

/**
 * Log MCP tool usage
 */
export async function logToolUsage(toolData) {
  const {
    tool_name,
    workflow_id = null,
    execution_id = null,
    input = {},
    output = null,
    success = false,
    error = null,
    duration_ms = 0
  } = toolData;

  const result = await query(
    `INSERT INTO mcp_tool_usage
     (tool_name, workflow_id, execution_id, input, output, success, error, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      tool_name,
      workflow_id,
      execution_id,
      JSON.stringify(input),
      output ? JSON.stringify(output) : null,
      success,
      error,
      duration_ms
    ]
  );

  return result.rows[0];
}

/**
 * Get connector configurations
 */
export async function getConnectors() {
  const result = await query(
    'SELECT * FROM connectors WHERE enabled = true ORDER BY name'
  );

  return result.rows;
}

/**
 * Upsert a connector configuration
 */
export async function upsertConnector(connectorData) {
  const { name, type, config, enabled = true } = connectorData;

  const result = await query(
    `INSERT INTO connectors (name, type, config, enabled)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name)
     DO UPDATE SET type = $2, config = $3, enabled = $4, updated_at = NOW()
     RETURNING *`,
    [name, type, JSON.stringify(config), enabled]
  );

  return result.rows[0];
}

// Export pool for direct access if needed
export { pool };
export default { pool, query };
