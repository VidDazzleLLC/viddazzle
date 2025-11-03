# Railway Deployment Testing Guide

## Quick Test Commands

Run these commands to verify your Railway deployment:

```bash
# 1. Test Database Connection
node test-railway-db.js

# 2. Test AI Features
node test-ai-features.js

# 3. Test Local Development (optional)
npm run dev
```

## Setup for Local Testing

### Option 1: Test Against Railway (Recommended)

1. **Get your environment variables from Railway:**
   - Go to [Railway Dashboard](https://railway.com/dashboard)
   - Select your VidDazzle project
   - Click on each service to view variables

2. **Create `.env.local` file:**
   ```bash
   cp .env.local.template .env.local
   ```

3. **Fill in the values from Railway:**
   - DATABASE_URL: From pgvector service → Variables tab
   - ANTHROPIC_API_KEY: From VidDazzle app → Variables tab
   - CLAUDE_MODEL: From VidDazzle app → Variables tab
   - MCP_TOOLS_ENABLED: From VidDazzle app → Variables tab
   - NODE_ENV: From VidDazzle app → Variables tab

### Option 2: Test Directly on Railway

Use Railway's CLI to run tests:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run tests on Railway
railway run node test-railway-db.js
railway run node test-ai-features.js
```

## Test 1: Database Connection

```bash
node test-railway-db.js
```

**Expected Output:**
```
🚂 Testing Railway pgvector Database Connection...

✓ Database URL found

Test 1: Basic Connectivity
  ✓ Connected successfully
  ✓ Database: railway
  ✓ User: postgres
  ✓ PostgreSQL: 15.x

Test 2: pgvector Extension
  ✓ pgvector extension installed (v0.5.x)

Test 3: Database Schema
  ✓ Found X table(s):
    - workflows
    - executions
    - tutorial_embeddings
    - tool_usage_logs
    - connectors

Test 4: Required Tables
  ✓ workflows table exists (X records)
  ✓ executions table exists (X records)
  ✓ tutorial_embeddings table exists (X records)
  ✓ tool_usage_logs table exists (X records)
  ✓ connectors table exists (X records)

Test 5: Vector Operations
  ✓ Vector column 'embedding' exists
  ✓ Vector operations working

✅ Database Connection Test Complete!
```

**Troubleshooting:**
- ❌ "No DATABASE_URL found" → Check Railway pgvector service variables
- ❌ "pgvector extension not found" → Run `CREATE EXTENSION vector;` in Railway SQL
- ❌ "No tables found" → Run schema migration SQL

## Test 2: AI Features

```bash
node test-ai-features.js
```

**Expected Output:**
```
🤖 Testing VidDazzle AI Features...

Environment Configuration:
  ✓ ANTHROPIC_API_KEY: ✓ Set (sk-ant-api...)
  ✓ CLAUDE_MODEL: claude-opus-4-20250514
  ✓ MCP_TOOLS_ENABLED: true
  ✓ NODE_ENV: production

Test 1: Anthropic Client Initialization
  ✓ Anthropic client created successfully

Test 2: MCP Tools Configuration
  ✓ MCP Tools definition found (X tools)

Test 3: Connectors Library
  ✓ Connectors library found (X connectors)

Test 4: Claude API Connectivity
  ✓ Claude responded successfully (XXXms)
  ✓ Model: claude-opus-4-20250514
  ✓ Response: "VidDazzle AI is working!"
  ✓ Tokens: X input, X output

Test 5: Workflow Generation Test
  ✓ Workflow generated successfully (XXXms)
  ✓ Workflow name: "..."
  ✓ Steps: X

✅ AI Features Test Complete!
```

**Troubleshooting:**
- ❌ "ANTHROPIC_API_KEY is required" → Check Railway app variables
- ❌ "Authentication Error" → API key invalid, get new key from console.anthropic.com
- ❌ "Rate Limit Error" → Too many requests, wait or check quota
- ❌ "MCP Tools not found" → Check if public/config/MCP_TOOLS_DEFINITION.json exists

## Test 3: End-to-End Application Test

```bash
npm run dev
```

Then visit http://localhost:3000 and:

1. **Test Homepage:**
   - ✓ Page loads without errors
   - ✓ UI renders correctly

2. **Test Workflow Generation:**
   - Navigate to workflow builder
   - Enter a prompt: "Send welcome email to new users"
   - Click Generate
   - ✓ Workflow appears with AI-generated steps

3. **Test Database Persistence:**
   - Save the generated workflow
   - Refresh the page
   - ✓ Workflow is still there

4. **Test Vector Search (if configured):**
   - Add a tutorial
   - Search for related content
   - ✓ Results appear based on semantic similarity

## Production Deployment Verification

### Check Railway Deployment:

1. **Visit your Railway app URL:**
   - Get URL from Railway dashboard
   - Should show your VidDazzle homepage

2. **Check Railway Logs:**
   ```bash
   # Using Railway CLI
   railway logs

   # Or view in Railway Dashboard → Deployments → View Logs
   ```

3. **Verify Environment Variables:**
   - Railway Dashboard → Your App → Variables
   - ✓ ANTHROPIC_API_KEY is set
   - ✓ CLAUDE_MODEL is set
   - ✓ MCP_TOOLS_ENABLED is set
   - ✓ NODE_ENV is set

4. **Check Database Connection:**
   - Railway Dashboard → pgvector service
   - ✓ Status: Active (green)
   - ✓ Metrics show connection activity

## Common Issues & Solutions

### Database Connection Issues

**Problem:** "relation does not exist"
```bash
# Solution: Run schema migration
# 1. Get the schema SQL from supabase/schema.sql
# 2. Adapt it for Railway (remove Supabase-specific code)
# 3. Run in Railway's PostgreSQL query editor
```

**Problem:** "pgvector extension not found"
```sql
-- Run this in Railway SQL editor:
CREATE EXTENSION IF NOT EXISTS vector;
```

### AI Features Issues

**Problem:** "ANTHROPIC_API_KEY invalid"
```bash
# Solution: Get a new API key
# 1. Visit https://console.anthropic.com/settings/keys
# 2. Create new key
# 3. Update in Railway: Dashboard → App → Variables → ANTHROPIC_API_KEY
```

**Problem:** "Rate limit exceeded"
```bash
# Solution: Check your usage and upgrade plan if needed
# Visit: https://console.anthropic.com/settings/billing
```

### Deployment Issues

**Problem:** "Build failed on Railway"
```bash
# Check build logs in Railway dashboard
# Common causes:
# - Missing dependencies in package.json
# - Build script errors
# - Environment variables not set during build
```

**Problem:** "App crashes on Railway"
```bash
# Check runtime logs
railway logs

# Common causes:
# - Database connection string incorrect
# - Missing environment variables
# - Port binding issues (Railway sets PORT automatically)
```

## Performance Monitoring

### Monitor Railway Metrics:

1. **CPU & Memory:**
   - Railway Dashboard → Service → Metrics
   - Watch for spikes or sustained high usage

2. **Database:**
   - Railway Dashboard → pgvector → Metrics
   - Monitor query performance
   - Check connection pool usage

3. **Response Times:**
   - Test API endpoints
   - Monitor Claude API latency

### Optimize Performance:

```bash
# 1. Enable production mode
NODE_ENV=production

# 2. Use connection pooling (already configured in neon.js)

# 3. Implement caching for frequent queries

# 4. Monitor API usage to stay within rate limits
```

## Next Steps

After successful testing:

1. ✓ Database connected and working
2. ✓ AI features operational
3. ✓ App running on Railway
4. ✓ Environment variables configured

**What's Next:**
- [ ] Create sample workflows
- [ ] Add tutorials to knowledge base
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)
- [ ] Add more MCP tools
- [ ] Implement user authentication
- [ ] Set up CI/CD pipeline

## Support Resources

- **Railway Docs:** https://docs.railway.app/
- **Anthropic Docs:** https://docs.anthropic.com/
- **VidDazzle Deployment Guides:**
  - `RAILWAY_DEPLOYMENT.md` - Railway-specific guide
  - `DEPLOYMENT_OPTIONS.md` - All deployment options
  - `DEPLOYMENT_GUIDE.md` - General deployment guide

## Quick Links

- [Railway Dashboard](https://railway.com/dashboard)
- [Anthropic Console](https://console.anthropic.com/)
- [Your Deployment URL](https://your-app.up.railway.app) ← Update with your actual URL

---

**Ready to test?** Run: `node test-railway-db.js && node test-ai-features.js`
