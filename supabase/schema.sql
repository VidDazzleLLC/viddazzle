-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Workflows table
CREATE TABLE workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  metadata JSONB,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0
);

-- Workflow executions table
CREATE TABLE workflow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  execution_log JSONB,
  duration_ms INTEGER
);

-- Tutorial/Learning data table with vector embeddings
CREATE TABLE tutorial_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP tool usage tracking
CREATE TABLE mcp_tool_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  workflow_id UUID REFERENCES workflows(id),
  execution_id UUID REFERENCES workflow_executions(id),
  input JSONB,
  output JSONB,
  success BOOLEAN,
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connector configurations
CREATE TABLE connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_tutorial_embeddings_category ON tutorial_embeddings(category);
CREATE INDEX idx_mcp_tool_usage_tool_name ON mcp_tool_usage(tool_name);
CREATE INDEX idx_connectors_type ON connectors(type);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_tutorial_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    metadata,
    1 - (embedding <=> query_embedding) as similarity
  FROM tutorial_embeddings
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorial_embeddings_updated_at BEFORE UPDATE ON tutorial_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connectors_updated_at BEFORE UPDATE ON connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
