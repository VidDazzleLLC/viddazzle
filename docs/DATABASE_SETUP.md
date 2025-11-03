# Database Setup Guide

## Overview

VidDazzle uses Supabase as its PostgreSQL database with pgvector extension for vector similarity search. This guide covers the setup and verification process.

## Prerequisites

- Supabase account and project
- Node.js 18.17.0 or higher
- Database credentials (URL, anon key, service role key)

## Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use an existing one
3. Note your project URL and API keys

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Schema Setup

1. Open Supabase SQL Editor: `https://supabase.com/dashboard/project/YOUR_PROJECT/sql`
2. Copy the SQL script from `schema/supabase-schema.sql`
3. Paste and execute in the SQL Editor

The script creates:
- **pgvector extension** - For vector similarity search
- **Tables:**
  - `workflows` - Workflow definitions and configurations
  - `workflow_executions` - Execution history and results
  - `tutorial_embeddings` - Vector embeddings for RAG
  - `mcp_tool_usage` - MCP tool usage tracking
  - `connectors` - External service connectors
- **Indexes** - Performance optimization indexes
- **Functions:**
  - `match_tutorial_embeddings()` - Vector similarity search
  - `update_updated_at_column()` - Auto-update timestamps
- **Triggers** - Automatic timestamp updates

## Verification

### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard > Table Editor
2. Verify all tables exist: workflows, workflow_executions, tutorial_embeddings, mcp_tool_usage, connectors
3. Check Database > Extensions to confirm pgvector is enabled

### Option 2: Local Test Script

If your environment has proper network access:

```bash
npm run test:db
```

**Note:** This may fail in restricted environments (containers, CI/CD) due to DNS resolution issues. The test script requires:
- Outbound HTTPS access to Supabase
- Proper DNS resolution
- Node.js fetch API support

If the test fails with DNS errors (`EAI_AGAIN`), verify your database setup through:
- Supabase Dashboard (Table Editor)
- Testing from your deployed application
- Using `psql` with direct connection string

### Option 3: Test from Deployed Application

The most reliable way to verify database connectivity is to deploy your application and test the actual API endpoints. The application will be able to connect to Supabase from the production environment.

## Database Schema

### Workflows Table

Stores workflow definitions with steps and configurations.

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Workflow Executions Table

Tracks workflow execution history and results.

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  input JSONB,
  output JSONB,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Tutorial Embeddings Table

Stores tutorial content with vector embeddings for RAG (Retrieval Augmented Generation).

```sql
CREATE TABLE tutorial_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### MCP Tool Usage Table

Tracks Model Context Protocol (MCP) tool usage and performance.

```sql
CREATE TABLE mcp_tool_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL,
  input_params JSONB,
  output_result JSONB,
  error TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Connectors Table

Manages external service connectors (APIs, databases, etc.).

```sql
CREATE TABLE connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Vector Similarity Search

The `match_tutorial_embeddings` function enables semantic search:

```sql
SELECT * FROM match_tutorial_embeddings(
  query_embedding := your_embedding_vector,
  match_threshold := 0.7,
  match_count := 5
);
```

This returns the most similar tutorial content based on cosine similarity.

## Troubleshooting

### DNS Resolution Errors (EAI_AGAIN)

If you see DNS errors when running the test script locally:
- This is an environment-specific issue
- Verify the database setup through Supabase Dashboard instead
- Test from your deployed application on Railway/Vercel
- The database itself is fine; it's a connectivity issue

### Connection Timeout

- Check your Supabase project is active (not paused)
- Verify your API keys are correct
- Ensure firewall allows outbound HTTPS (port 443)

### Permission Errors

- Use the service role key for admin operations
- Use the anon key for client-side operations
- Check Row Level Security (RLS) policies if enabled

## Next Steps

1. ✅ Database schema created
2. ✅ Environment variables configured
3. ✅ Supabase client set up
4. → Test API endpoints
5. → Deploy to Railway/Vercel
6. → Add seed data (optional)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
