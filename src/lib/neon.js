/**
 * Neon PostgreSQL Database Client
 * Direct PostgreSQL connection for Neon.tech or Vercel Postgres
 */

import { Pool } from 'pg';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a SQL query
 */
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
  const { name, description, steps, status = 'draft', user_id = null, metadata = {} } = workflowData;

  const result = await query(
    `INSERT INTO workflows (name, description, steps, status, user_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description, JSON.stringify(steps), status, user_id, JSON.stringify(metadata)]
  );

  return result.rows[0];
}

/**
 * Get all workflows
 */
export async function getWorkflows(userId = null) {
  let sql = 'SELECT * FROM workflows';
  const params = [];

  if (userId) {
    sql += ' WHERE user_id = $1';
    params.push(userId);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id) {
  const result = await query('SELECT * FROM workflows WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new Error('Workflow not found');
  }

  return result.rows[0];
}

/**
 * Update a workflow
 */
export async function updateWorkflow(id, updates) {
  const { name, description, steps, status, metadata } = updates;

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(description);
  }
  if (steps !== undefined) {
    fields.push(`steps = $${paramCount++}`);
    values.push(JSON.stringify(steps));
  }
  if (status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (metadata !== undefined) {
    fields.push(`metadata = $${paramCount++}`);
    values.push(JSON.stringify(metadata));
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE workflows SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
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
  const { workflow_id, status = 'pending', result = null, error = null, execution_log = null } = executionData;

  const queryResult = await query(
    `INSERT INTO workflow_executions (workflow_id, status, result, error, execution_log)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [workflow_id, status, JSON.stringify(result), error, JSON.stringify(execution_log)]
  );

  return queryResult.rows[0];
}

/**
 * Update a workflow execution
 */
export async function updateExecution(id, updates) {
  const { status, completed_at, result, error, execution_log, duration_ms } = updates;

  const fields = [];
  const values = [];
  let paramCount = 1;

  if (status !== undefined) {
    fields.push(`status = $${paramCount++}`);
    values.push(status);
  }
  if (completed_at !== undefined) {
    fields.push(`completed_at = $${paramCount++}`);
    values.push(completed_at);
  }
  if (result !== undefined) {
    fields.push(`result = $${paramCount++}`);
    values.push(JSON.stringify(result));
  }
  if (error !== undefined) {
    fields.push(`error = $${paramCount++}`);
    values.push(error);
  }
  if (execution_log !== undefined) {
    fields.push(`execution_log = $${paramCount++}`);
    values.push(JSON.stringify(execution_log));
  }
  if (duration_ms !== undefined) {
    fields.push(`duration_ms = $${paramCount++}`);
    values.push(duration_ms);
  }

  values.push(id);

  const result = await query(
    `UPDATE workflow_executions SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

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
    'SELECT * FROM match_tutorial_embeddings($1::vector, $2, $3)',
    [JSON.stringify(queryEmbedding), matchThreshold, matchCount]
  );

  return result.rows;
}

/**
 * Insert tutorial embedding
 */
export async function insertTutorialEmbedding(content, embedding, metadata = {}) {
  const { category = null, tags = [] } = metadata;

  const result = await query(
    `INSERT INTO tutorial_embeddings (content, embedding, metadata, category, tags)
     VALUES ($1, $2::vector, $3, $4, $5)
     RETURNING *`,
    [content, JSON.stringify(embedding), JSON.stringify(metadata), category, tags]
  );

  return result.rows[0];
}

/**
 * Log MCP tool usage
 */
export async function logToolUsage(toolData) {
  const { tool_name, workflow_id, execution_id, input, output, success, error, duration_ms } = toolData;

  const result = await query(
    `INSERT INTO mcp_tool_usage (tool_name, workflow_id, execution_id, input, output, success, error, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      tool_name,
      workflow_id,
      execution_id,
      JSON.stringify(input),
      JSON.stringify(output),
      success,
      error,
      duration_ms,
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
     ON CONFLICT (name) DO UPDATE SET
       type = EXCLUDED.type,
       config = EXCLUDED.config,
       enabled = EXCLUDED.enabled,
       updated_at = NOW()
     RETURNING *`,
    [name, type, JSON.stringify(config), enabled]
  );

  return result.rows[0];
}

export default pool;
