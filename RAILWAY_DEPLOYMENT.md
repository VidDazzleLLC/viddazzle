# 🚂 Railway Deployment Guide (All-in-One Solution)

Railway can host both your Next.js app AND PostgreSQL database in one place!

## Why Railway?

✅ Host app + database together
✅ Built-in PostgreSQL with pgvector
✅ Free tier available
✅ Simple deployment from GitHub
✅ Automatic HTTPS
✅ Environment variable management

---

## ⚠️ Important Note About Railway UI

**Railway's current UI does not have a SQL "Query" tab** for executing SQL directly in the browser. You'll need to:

1. **Use the pgvector template** when creating your database (recommended), OR
2. **Connect via an external SQL client** (psql, DBeaver, pgAdmin, etc.) to run your schema

This guide includes detailed instructions for both approaches.

---

## 🚀 Already Deployed? Quick Setup Checklist

If your app is already live on Railway, here's what you need to complete:

- [ ] **Database**: Ensure you're using the pgvector template (check initialization logs)
- [ ] **Schema**: Connect via external SQL client and run `supabase/schema.sql`
- [ ] **Environment Variables**: Add `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, etc.
- [ ] **Test**: Visit your app URL and verify database connection

Jump to [Step 5](#step-5-run-database-schema-via-external-sql-client) for schema setup instructions.

---

## Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"**

---

## Step 2: Deploy from GitHub

### Option A: Deploy from GitHub (Recommended)

1. Click **"Deploy from GitHub repo"**
2. Select `VidDazzleLLC/viddazzle`
3. Railway will auto-detect Next.js

### Option B: Deploy from CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

## Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway creates database and adds connection variables automatically!

---

## Step 4: Enable pgvector Extension

⚠️ **Important**: Railway's current UI does not have a "Query" tab for running SQL directly.

### Option A: Deploy pgvector Template (Recommended)

1. In your Railway project, click **"New"**
2. Search for and deploy the **"pgvector"** template
3. This creates a PostgreSQL database with pgvector pre-enabled
4. Delete your old PostgreSQL service if you created one in Step 3

### Option B: Enable via External Connection

If you already have a standard PostgreSQL database:

1. Connect using an external SQL client (see Step 5 below)
2. Run: `CREATE EXTENSION IF NOT EXISTS vector;`

---

## Step 5: Run Database Schema via External SQL Client

**Railway's UI does not provide a SQL execution panel**, so you must connect externally.

### Get Connection Credentials

1. Click on your PostgreSQL database service in Railway
2. Go to **"Variables"** or **"Connect"** tab
3. Copy the connection details:
   - Host (e.g., `monorail.proxy.rlwy.net`)
   - Port (e.g., `12345`)
   - Database name
   - Username
   - Password
   - Or copy the full `DATABASE_URL`

### Method 1: Using psql (Command Line)

```bash
# Install psql if not already installed
# Ubuntu/Debian: sudo apt-get install postgresql-client
# macOS: brew install postgresql

# Connect using DATABASE_URL
psql "postgresql://username:password@host:port/database"

# Or connect with individual parameters
psql -h monorail.proxy.rlwy.net -p 12345 -U postgres -d railway

# Once connected, run the schema
\i /path/to/viddazzle/supabase/schema.sql

# Or paste the schema contents directly and press Enter
```

### Method 2: Using DBeaver (GUI - Recommended for Beginners)

1. Download [DBeaver](https://dbeaver.io/download/) (free)
2. Click **"New Database Connection"**
3. Select **"PostgreSQL"**
4. Enter your Railway database credentials:
   - Host: `monorail.proxy.rlwy.net`
   - Port: `12345`
   - Database: `railway`
   - Username: `postgres`
   - Password: (from Railway)
5. Click **"Test Connection"** → **"Finish"**
6. Right-click connection → **"SQL Editor"** → **"New SQL Script"**
7. Copy/paste contents from `supabase/schema.sql`
8. Click **"Execute SQL Statement"** (Ctrl+Enter)

### Method 3: Using pgAdmin (GUI)

1. Download [pgAdmin](https://www.pgadmin.org/download/)
2. Right-click **"Servers"** → **"Register"** → **"Server"**
3. **General** tab: Name = "Railway VidDazzle"
4. **Connection** tab: Enter Railway credentials
5. Click **"Save"**
6. Navigate to your database → **"Query Tool"**
7. Paste contents from `supabase/schema.sql`
8. Click **"Execute"** (▶️)

### Method 4: Using TablePlus (GUI - macOS/Windows)

1. Download [TablePlus](https://tableplus.com/)
2. Click **"Create a new connection"**
3. Select **"PostgreSQL"**
4. Enter Railway credentials
5. Click **"Connect"**
6. Press **Cmd+T** (Mac) or **Ctrl+T** (Windows) for SQL editor
7. Paste and run `supabase/schema.sql`

### Verify Schema Installation

After running the schema, verify it worked:

```sql
-- Check that tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Should return: workflows, workflow_executions,
-- tutorial_embeddings, mcp_tool_usage, connectors

-- Verify pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

This creates all tables, indexes, and functions needed for VidDazzle.

---

## Step 6: Add Environment Variables

Railway auto-adds `DATABASE_URL`. Add these manually:

1. Click on your **app service** (not database)
2. Go to **"Variables"** tab
3. Click **"New Variable"**

Add these:

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
CLAUDE_MODEL=claude-opus-4-20250514

# Database (already set automatically as DATABASE_URL)
# Railway also provides POSTGRES_URL - use either

# Optional: OpenAI for embeddings
OPENAI_API_KEY=sk-xxxxx

# App Configuration
MCP_TOOLS_ENABLED=true
MAX_WORKFLOW_STEPS=50
WORKFLOW_TIMEOUT=300000
NODE_ENV=production
```

---

## Step 7: Update Code for PostgreSQL

Railway provides `DATABASE_URL` - our Neon client already supports it!

Just update `src/lib/supabase.js` to use Neon client for Railway:

```javascript
// At the top of API routes, replace:
// import { createWorkflow } from '@/lib/supabase';

// With:
import { createWorkflow } from '@/lib/neon';
```

Or create a database adapter that auto-detects:

```javascript
// src/lib/db.js
const useNeon = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export * from useNeon ? './neon' : './supabase';
```

---

## Step 8: Deploy!

Railway auto-deploys when you push to GitHub!

Or manually:
```bash
railway up
```

You'll get a URL like:
```
https://viddazzle-production.up.railway.app
```

---

## Step 9: Custom Domain (Optional)

1. Go to **"Settings"** in your app service
2. Click **"Domains"**
3. Add your custom domain
4. Update DNS records as shown

---

## Environment Variables on Railway

Railway automatically provides:

| Variable | Auto-Set | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection |
| `POSTGRES_URL` | ✅ | Alternative format |
| `DATABASE_HOST` | ✅ | DB hostname |
| `DATABASE_PORT` | ✅ | DB port |
| `DATABASE_NAME` | ✅ | DB name |
| `DATABASE_USER` | ✅ | DB username |
| `DATABASE_PASSWORD` | ✅ | DB password |

You manually add:

| Variable | You Set | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ❌ | Claude API key |
| `CLAUDE_MODEL` | ❌ | Claude model name |
| `OPENAI_API_KEY` | ❌ | OpenAI key (optional) |
| `MCP_TOOLS_ENABLED` | ❌ | Enable tools |

---

## Cost Comparison

### Railway Free Tier
- $5 free credits per month
- ~500 hours of runtime
- 1 GB RAM
- PostgreSQL included
- Great for hobby projects

### Paid Plan
- $5/month base
- Pay for usage
- Scales automatically
- Production-ready

### vs Vercel + Neon
- Vercel: Free tier + $20/month for production
- Neon: Free tier (0.5 GB) + $19/month for more
- **Railway: Simpler, potentially cheaper**

---

## Database Client Update

Create `src/lib/db.js` (auto-detects platform):

```javascript
// Detect which database client to use
const isDatabaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (isDatabaseUrl) {
  // Using Railway or Vercel Postgres
  module.exports = require('./neon');
} else {
  // Using Supabase
  module.exports = require('./supabase');
}
```

Then in your API routes:
```javascript
import { createWorkflow } from '@/lib/db';
```

---

## Deployment Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Open app
railway open

# Run commands
railway run npm run build

# Link local to project
railway link
```

---

## Advantages of Railway

1. ✅ **All-in-One**: App + database in one platform
2. ✅ **Simpler**: No juggling multiple platforms
3. ✅ **Auto-Deploy**: Push to GitHub = auto deployment
4. ✅ **Built-in DB**: PostgreSQL with pgvector support
5. ✅ **Great DX**: Excellent developer experience
6. ✅ **Fair Pricing**: Pay for what you use

---

## Quick Start Commands

```bash
# 1. Install CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link to project (after creating on railway.app)
railway link

# 4. Add environment variables
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set CLAUDE_MODEL=claude-opus-4-20250514
railway variables set MCP_TOOLS_ENABLED=true

# 5. Deploy
railway up

# 6. Get URL
railway domain
```

---

## Troubleshooting

### "Where is the Query tab in Railway?"

Railway's current UI **does not have a Query tab** for running SQL. You must:
- Use the pgvector template when creating your database, OR
- Connect via external SQL client (psql, DBeaver, pgAdmin, TablePlus)

### "Connection refused" when using psql

Make sure:
- You're using the correct host (e.g., `monorail.proxy.rlwy.net`, NOT `localhost`)
- The port matches Railway's assigned port
- Your IP is not blocked by Railway's firewall (Railway allows all by default)
- You're using the exact password from Railway (copy/paste to avoid typos)

### "Extension vector does not exist"

You need to enable pgvector:
- Deploy the pgvector template, OR
- Connect via SQL client and run: `CREATE EXTENSION IF NOT EXISTS vector;`

### "Database connection failed" in app

Check:
- `DATABASE_URL` is set in your app's environment variables (Railway auto-sets this)
- Your app is using the Neon client (`@neondatabase/serverless`) which works with Railway
- The database service is running (green dot in Railway dashboard)

### "Cannot find module '@neondatabase/serverless'"

Install the dependency:
```bash
npm install @neondatabase/serverless
```

Then push to trigger a new deployment.

### Schema already exists error

If you get "table already exists" errors:
```sql
-- Drop all tables first (⚠️ WARNING: This deletes all data!)
DROP TABLE IF EXISTS mcp_tool_usage CASCADE;
DROP TABLE IF EXISTS workflow_executions CASCADE;
DROP TABLE IF EXISTS workflows CASCADE;
DROP TABLE IF EXISTS tutorial_embeddings CASCADE;
DROP TABLE IF EXISTS connectors CASCADE;

-- Then re-run the schema
```

---

🎉 **Done!** Your app is live on Railway with built-in PostgreSQL!

Access at: `https://your-app.up.railway.app`
