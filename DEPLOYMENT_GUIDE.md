# 🚀 Deployment Guide: Neon.tech + Vercel

This guide will help you deploy the Workflow Autopilot app to production using:
- **Neon.tech** for PostgreSQL database (with pgvector)
- **Vercel** for Next.js application hosting

---

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click **"Create a project"**
3. Choose:
   - **Project name**: `workflow-autopilot`
   - **Region**: Choose closest to your users
   - **PostgreSQL version**: 16 (or latest)
4. Click **"Create project"**

### 1.2 Enable pgvector Extension

In the Neon SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 Run Database Schema

1. Copy the entire content from `supabase/schema.sql`
2. Paste into Neon SQL Editor
3. Click **"Run"** to execute

This will create:
- `workflows` table
- `workflow_executions` table
- `tutorial_embeddings` table (with vector support)
- `mcp_tool_usage` table
- `connectors` table
- All necessary indexes and functions

### 1.4 Get Connection String

1. In Neon dashboard, go to **"Connection Details"**
2. Copy the connection string (it looks like):
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```
3. Save this - you'll need it for Vercel!

---

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 2.2 Deploy from Command Line

In the project directory, run:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **Project name?** → workflow-autopilot (or your choice)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

### 2.3 Set Environment Variables

After initial deployment, set environment variables:

```bash
# Claude API
vercel env add ANTHROPIC_API_KEY
# Paste your Claude API key when prompted

vercel env add CLAUDE_MODEL
# Enter: claude-opus-4-20250514

# Neon Database (convert to Supabase-compatible format)
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: https://your-neon-host (we'll use REST API)

# For direct PostgreSQL connection with Neon:
vercel env add DATABASE_URL
# Paste your Neon connection string

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# You can use a placeholder or implement JWT auth

vercel env add SUPABASE_SERVICE_ROLE_KEY
# You can use a placeholder or implement JWT auth

# Optional: OpenAI for embeddings
vercel env add OPENAI_API_KEY
# Paste your OpenAI API key (if using embeddings)

# App Configuration
vercel env add MCP_TOOLS_ENABLED
# Enter: true

vercel env add MAX_WORKFLOW_STEPS
# Enter: 50

vercel env add WORKFLOW_TIMEOUT
# Enter: 300000
```

### 2.4 Update Code for Neon (Direct PostgreSQL)

Since Neon doesn't have the same REST API as Supabase, we need to use PostgreSQL client:

**Install PostgreSQL client:**
```bash
npm install pg
```

**Alternative: Use Vercel Postgres Integration**

Or you can use Vercel's built-in Postgres (powered by Neon):

```bash
vercel link
vercel postgres create
```

This automatically sets up environment variables!

### 2.5 Deploy Production

```bash
vercel --prod
```

---

## Step 3: Alternative - Vercel Postgres (Easier!)

Vercel has built-in Neon integration:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **"Create Database"**
5. Choose **"Postgres"** (powered by Neon)
6. Name it: `workflow-autopilot-db`
7. Click **"Create"**

Then in Neon SQL Editor (linked from Vercel):
- Run the schema from `supabase/schema.sql`

Vercel automatically adds these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

---

## Step 4: Update Database Client for Neon

Create a new file `src/lib/neon.js`:

```javascript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getWorkflows() {
  const result = await query(
    'SELECT * FROM workflows ORDER BY created_at DESC'
  );
  return result.rows;
}

export async function createWorkflow(workflowData) {
  const { name, description, steps, status, metadata } = workflowData;
  const result = await query(
    `INSERT INTO workflows (name, description, steps, status, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description, JSON.stringify(steps), status, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

// Add other database functions...
```

---

## Step 5: Verify Deployment

Once deployed, Vercel will give you a URL like:
- `https://workflow-autopilot.vercel.app`
- Or your custom domain

### Test your deployment:

1. **Visit the URL** - Should see the homepage
2. **Test workflow generation** - Create a simple workflow
3. **Check database** - Verify data is saved in Neon
4. **Test execution** - Run a workflow

---

## Environment Variables Summary

Here's what you need to set in Vercel:

| Variable | Value | Source |
|----------|-------|--------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Anthropic Console |
| `CLAUDE_MODEL` | `claude-opus-4-20250514` | Fixed value |
| `DATABASE_URL` | `postgresql://...` | Neon Dashboard |
| `OPENAI_API_KEY` | `sk-...` (optional) | OpenAI Console |
| `MCP_TOOLS_ENABLED` | `true` | Fixed value |
| `MAX_WORKFLOW_STEPS` | `50` | Fixed value |
| `WORKFLOW_TIMEOUT` | `300000` | Fixed value |

---

## Quick Deploy Commands

```bash
# 1. Install dependencies
npm install pg

# 2. Build locally to test
npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Set environment variables (one-time)
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
# ... etc

# 5. Redeploy with new env vars
vercel --prod
```

---

## Troubleshooting

### Database Connection Issues
- Verify Neon connection string is correct
- Check that pgvector extension is enabled
- Ensure SSL is configured (`?sslmode=require`)

### Build Failures
- Check all environment variables are set
- Verify `package.json` has all dependencies
- Review build logs in Vercel dashboard

### API Errors
- Check Anthropic API key is valid
- Verify database schema is applied
- Review function logs in Vercel

---

## Next Steps

After deployment:
1. Set up custom domain (optional)
2. Configure authentication (Auth0, Clerk, etc.)
3. Set up monitoring (Vercel Analytics, Sentry)
4. Enable rate limiting
5. Set up CI/CD with GitHub integration

---

🎉 **Your app is now live!** Visit your Vercel URL to use Workflow Autopilot in production.
