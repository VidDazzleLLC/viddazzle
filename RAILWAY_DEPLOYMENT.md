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

1. Click on your PostgreSQL database
2. Go to **"Query"** tab
3. Run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Step 5: Run Database Schema

In the PostgreSQL Query tab:

1. Copy contents from `supabase/schema.sql`
2. Paste and **Execute**

This creates all tables, indexes, and functions.

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

🎉 **Done!** Your app is live on Railway with built-in PostgreSQL!

Access at: `https://your-app.up.railway.app`
