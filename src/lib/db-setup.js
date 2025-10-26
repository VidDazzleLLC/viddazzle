import { query } from './database';

/**
 * Database Setup and Migration Script
 *
 * This module handles automated database schema creation and updates.
 * Run this to create all necessary tables for the Workflow Autopilot.
 */

export async function setupDatabase() {
  const results = {
    success: true,
    tables: [],
    errors: [],
  };

  try {
    // Create users table (for demo/testing workflows)
    await createUsersTable();
    results.tables.push('users');

    // Create workflows table
    await createWorkflowsTable();
    results.tables.push('workflows');

    // Create workflow_executions table
    await createWorkflowExecutionsTable();
    results.tables.push('workflow_executions');

    // Create tutorial_embeddings table (for learning)
    await createTutorialEmbeddingsTable();
    results.tables.push('tutorial_embeddings');

    // Create mcp_tool_usage table
    await createMcpToolUsageTable();
    results.tables.push('mcp_tool_usage');

    // Create connectors table
    await createConnectorsTable();
    results.tables.push('connectors');

    // Create email_logs table (for workflow logging)
    await createEmailLogsTable();
    results.tables.push('email_logs');

    // Create workflow_logs table (general purpose logging)
    await createWorkflowLogsTable();
    results.tables.push('workflow_logs');

  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Check if database is initialized
 */
export async function isDatabaseInitialized() {
  try {
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'workflows'
      );
    `);
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

/**
 * Create users table (for demo/testing workflows)
 */
async function createUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create index on email for fast lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Insert sample users for testing workflows
  await query(`
    INSERT INTO users (email, name, role, metadata)
    VALUES
      ('john.doe@example.com', 'John Doe', 'user', '{"department": "Engineering"}'),
      ('jane.smith@example.com', 'Jane Smith', 'admin', '{"department": "Product"}'),
      ('bob.wilson@example.com', 'Bob Wilson', 'user', '{"department": "Sales"}'),
      ('alice.johnson@example.com', 'Alice Johnson', 'user', '{"department": "Marketing"}'),
      ('team@example.com', 'Team Distribution', 'system', '{"type": "group"}')
    ON CONFLICT (email) DO NOTHING;
  `);
}

/**
 * Create workflows table
 */
async function createWorkflowsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      steps JSONB NOT NULL,
      variables JSONB DEFAULT '{}',
      triggers JSONB DEFAULT '{}',
      status TEXT DEFAULT 'draft',
      metadata JSONB DEFAULT '{}',
      user_id UUID,
      execution_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      failure_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
  `);
}

/**
 * Create workflow_executions table
 */
async function createWorkflowExecutionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending',
      started_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP,
      execution_log JSONB DEFAULT '[]',
      result JSONB,
      error TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON workflow_executions(workflow_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_executions_status ON workflow_executions(status);
  `);
}

/**
 * Create tutorial_embeddings table (requires pgvector extension)
 */
async function createTutorialEmbeddingsTable() {
  // Enable pgvector extension
  await query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  await query(`
    CREATE TABLE IF NOT EXISTS tutorial_embeddings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      content TEXT NOT NULL,
      embedding vector(1536),
      metadata JSONB DEFAULT '{}',
      category TEXT,
      tags TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create vector index for similarity search
  await query(`
    CREATE INDEX IF NOT EXISTS idx_tutorial_embeddings_vector
    ON tutorial_embeddings USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  `);
}

/**
 * Create mcp_tool_usage table
 */
async function createMcpToolUsageTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS mcp_tool_usage (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tool_name TEXT NOT NULL,
      workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
      execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
      input JSONB,
      output JSONB,
      success BOOLEAN DEFAULT false,
      error TEXT,
      duration_ms INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON mcp_tool_usage(tool_name);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_tool_usage_workflow_id ON mcp_tool_usage(workflow_id);
  `);
}

/**
 * Create connectors table
 */
async function createConnectorsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS connectors (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      config JSONB NOT NULL,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

/**
 * Create email_logs table (for workflow email logging)
 * Comprehensive schema to support all email-related workflows
 */
async function createEmailLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
      execution_id UUID REFERENCES workflow_executions(id) ON DELETE SET NULL,
      email_type TEXT DEFAULT 'notification',
      recipient TEXT NOT NULL,
      recipient_name TEXT,
      from_email TEXT,
      from_name TEXT,
      cc TEXT[],
      bcc TEXT[],
      reply_to TEXT,
      subject TEXT,
      body TEXT,
      html_body TEXT,
      template_id TEXT,
      attachments JSONB DEFAULT '[]',
      headers JSONB DEFAULT '{}',
      status TEXT DEFAULT 'sent',
      success BOOLEAN DEFAULT true,
      error TEXT,
      provider TEXT,
      message_id TEXT,
      metadata JSONB DEFAULT '{}',
      sent_at TIMESTAMP DEFAULT NOW(),
      delivered_at TIMESTAMP,
      opened_at TIMESTAMP,
      clicked_at TIMESTAMP
    );
  `);

  // Add missing columns to existing tables (migration)
  await query(`
    DO $$
    DECLARE
      columns_to_add TEXT[] := ARRAY[
        'success:BOOLEAN DEFAULT true',
        'error:TEXT',
        'email_type:TEXT DEFAULT ''notification''',
        'recipient_name:TEXT',
        'from_email:TEXT',
        'from_name:TEXT',
        'cc:TEXT[]',
        'bcc:TEXT[]',
        'reply_to:TEXT',
        'html_body:TEXT',
        'template_id:TEXT',
        'attachments:JSONB DEFAULT ''[]''',
        'headers:JSONB DEFAULT ''{}''',
        'provider:TEXT',
        'message_id:TEXT',
        'delivered_at:TIMESTAMP',
        'opened_at:TIMESTAMP',
        'clicked_at:TIMESTAMP'
      ];
      col_def TEXT;
      col_name TEXT;
      col_type TEXT;
    BEGIN
      FOREACH col_def IN ARRAY columns_to_add
      LOOP
        col_name := split_part(col_def, ':', 1);
        col_type := split_part(col_def, ':', 2);

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'email_logs' AND column_name = col_name
        ) THEN
          EXECUTE format('ALTER TABLE email_logs ADD COLUMN %I %s', col_name, col_type);
        END IF;
      END LOOP;
    END $$;
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_workflow_id ON email_logs(workflow_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_success ON email_logs(success);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
  `);
}

/**
 * Create workflow_logs table (general purpose logging for workflows)
 */
async function createWorkflowLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS workflow_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
      execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
      log_level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_logs_workflow_id ON workflow_logs(workflow_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution_id ON workflow_logs(execution_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_workflow_logs_level ON workflow_logs(log_level);
  `);
}

/**
 * Drop all tables (use with caution!)
 */
export async function dropAllTables() {
  const tables = [
    'workflow_logs',
    'email_logs',
    'mcp_tool_usage',
    'workflow_executions',
    'workflows',
    'connectors',
    'tutorial_embeddings',
    'users',
  ];

  for (const table of tables) {
    await query(`DROP TABLE IF EXISTS ${table} CASCADE;`);
  }
}

/**
 * Reset database (drop and recreate all tables)
 */
export async function resetDatabase() {
  await dropAllTables();
  return await setupDatabase();
}
