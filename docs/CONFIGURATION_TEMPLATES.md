# Configuration Templates

This document contains all configuration templates for the Workflow Autopilot app.

## package.json

```json
{
  "name": "workflow-autopilot",
  "version": "1.0.0",
  "description": "AI-powered workflow automation platform with Claude and MCP",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "@supabase/supabase-js": "^2.39.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.5",
    "react-markdown": "^9.0.1",
    "lucide-react": "^0.321.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1"
  },
  "engines": {
    "node": ">=18.17.0"
  }
}
```

## next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'Workflow Autopilot',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Content-Type, Authorization' },
        ],
      },
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig
```

## vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_APP_NAME": "Workflow Autopilot",
    "NEXT_PUBLIC_APP_VERSION": "1.0.0"
  },
  "regions": ["iad1"],
  "functions": {
    "src/pages/api/**/*.js": {
      "maxDuration": 300,
      "memory": 1024
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

## .env.example

```env
# Claude API Configuration
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-opus-4-20250514

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# MCP Configuration
MCP_TOOLS_ENABLED=true
MCP_MAX_RETRIES=3
MCP_TIMEOUT=30000

# Workflow Configuration
MAX_WORKFLOW_STEPS=50
WORKFLOW_TIMEOUT=300000
ENABLE_WORKFLOW_LEARNING=true

# Vector Embeddings Configuration
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

## .gitignore

```
# Dependencies
node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode
.idea
*.swp
*.swo
```

## tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
```

## postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## jsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/public/*": ["./public/*"]
    }
  },
  "include": ["src/**/*", "next.config.js"],
  "exclude": ["node_modules"]
}
```

## Supabase SQL Schema

```sql
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
```

## ESLint Configuration (.eslintrc.json)

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off"
  }
}
```
