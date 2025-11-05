# Automated Database Setup - Complete Guide

## 🎯 Overview

Your VidDazzle application now has **fully automated database initialization**. The database schema will be automatically created when you deploy or start your application. No manual steps required!

---

## ✅ What's Been Automated

### 1. **Automatic Initialization on Deployment**
When you deploy to Railway, Vercel, or any cloud platform:
- The `build` script runs: `node scripts/init-database.js && next build`
- Database schema is automatically created if it doesn't exist
- App builds and deploys with database ready

### 2. **Automatic Initialization on Startup**
When your app starts:
- The `start` script runs: `node scripts/init-database.js && next start`
- Database is checked and initialized if needed
- App starts with database ready

### 3. **Health Check with Auto-Init**
Your health check endpoint now auto-initializes the database:
- **Endpoint:** `GET /api/health`
- **Force init:** `GET /api/health?init=true`
- Automatically sets up database on first request

### 4. **API Endpoints for Manual Control**
Three API endpoints are available if you need manual control:
- `GET /api/db/status` - Check database initialization status
- `GET /api/db/setup` - Manually trigger database setup
- `GET /api/health?init=true` - Health check with forced init

---

## 🚀 How It Works

### Automatic Flow:

```
1. Deploy/Start App
   ↓
2. Database Init Script Runs
   ↓
3. Check if tables exist
   ↓
4a. Tables exist → Skip, continue
4b. No tables → Run complete-schema.sql
   ↓
5. App starts with ready database
```

### Idempotent & Safe:
- ✅ Safe to run multiple times
- ✅ Won't recreate existing tables
- ✅ Won't lose data
- ✅ Uses `CREATE TABLE IF NOT EXISTS`

---

## 📦 Deployment Scenarios

### Scenario 1: Railway Deployment
```bash
# Just push to git - everything is automatic!
git push origin main

# Railway will:
# 1. Pull your code
# 2. Run npm install
# 3. Run npm run build (which includes db init)
# 4. Run npm start (which checks db again)
# 5. Your app is live with database ready! 🎉
```

### Scenario 2: Vercel Deployment
```bash
# Push to git or use Vercel CLI
vercel deploy

# Vercel will:
# 1. Build your app (db init runs during build)
# 2. Deploy
# 3. First request initializes if needed
# 4. Your app is live! 🎉
```

### Scenario 3: Docker Deployment
```bash
# Build and run
docker build -t viddazzle .
docker run -e DATABASE_URL=$DATABASE_URL viddazzle

# Container will:
# 1. Start app
# 2. Auto-initialize database
# 3. Serve requests 🎉
```

---

## 🔧 NPM Scripts Available

### Automatic (No Action Needed):
```bash
npm run build    # Auto-initializes DB before build
npm start        # Auto-initializes DB before start
```

### Manual (If You Want Control):
```bash
npm run db:init   # Run database initialization manually
npm run db:status # Check database status (via API)
npm run db:test   # Test database connection
```

---

## 🌐 API Endpoints

### 1. Health Check (Auto-Init)
```bash
# Basic health check
curl https://your-app.com/api/health

# Force database initialization
curl https://your-app.com/api/health?init=true
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "app": "viddazzle",
  "version": "1.0.0",
  "database": {
    "configured": true,
    "type": "postgresql",
    "initialized": true,
    "init_message": "Database initialized successfully"
  },
  "anthropic_api": true
}
```

### 2. Database Status
```bash
curl https://your-app.com/api/db/status
```

**Response:**
```json
{
  "configured": true,
  "initialized": true,
  "database": {
    "tables": {
      "required": 10,
      "existing": 10,
      "missing": []
    },
    "extensions": {
      "required": 2,
      "existing": 2,
      "missing": []
    }
  },
  "message": "Database is fully initialized"
}
```

### 3. Manual Database Setup
```bash
curl https://your-app.com/api/db/setup
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-05T12:00:00.000Z",
  "steps": [
    { "step": "connect", "status": "success" },
    { "step": "load_schema", "status": "success", "size": "15234 bytes" },
    { "step": "execute_schema", "status": "success" },
    { "step": "verify_tables", "status": "success", "count": 10 },
    { "step": "verify_extensions", "status": "success" },
    { "step": "verify_functions", "status": "success" }
  ],
  "message": "Database schema setup completed successfully"
}
```

---

## 🗄️ Database Schema Created

### Tables (10 total):

#### Workflow Automation:
1. **workflows** - Workflow definitions
2. **workflow_executions** - Execution history
3. **tutorial_embeddings** - Vector embeddings (RAG)
4. **mcp_tool_usage** - Tool usage tracking
5. **connectors** - External connectors

#### Social Listening & Outreach:
6. **listening_campaigns** - Campaign configurations
7. **social_mentions** - Detected mentions
8. **outreach_rules** - Outreach automation rules
9. **outreach_messages** - Message queue
10. **platform_credentials** - Platform API credentials

### Extensions:
- ✅ **uuid-ossp** - UUID generation
- ✅ **vector** - pgvector for embeddings

### Functions:
- ✅ **match_tutorial_embeddings()** - Vector similarity search
- ✅ **update_updated_at_column()** - Auto timestamps

---

## 🔍 Verification

### Option 1: Via Health Check
```bash
curl https://your-app.com/api/health
```
Look for `"database": { "initialized": true }`

### Option 2: Via Status Endpoint
```bash
curl https://your-app.com/api/db/status
```
Check the `tables.existing` count (should be 10)

### Option 3: Check Logs
After deployment, check your platform logs:
```bash
# Railway
railway logs

# Vercel
vercel logs

# You should see:
# 🔧 Database Initialization Script
# ✅ Connected successfully
# ✅ Database already initialized
# OR
# 🎉 Database initialization completed successfully!
```

---

## 🛡️ Safety Features

### 1. Idempotent Design
- Safe to run unlimited times
- Won't recreate existing tables
- Won't lose any data

### 2. Graceful Failure Handling
- If database is unreachable during build → Continues without failing
- App will retry initialization on startup
- Each request can trigger init via health check

### 3. Network Error Handling
```
DNS Error (EAI_AGAIN) → Skip, retry later
Connection Timeout → Skip, retry later
Other Errors → Log and continue
```

### 4. Multiple Initialization Paths
1. Build time (`npm run build`)
2. Start time (`npm start`)
3. First request (via auto-init module)
4. Health check request
5. Manual API call

---

## 🎯 Zero-Configuration Deployment

### What You Need:
1. ✅ `DATABASE_URL` environment variable set
2. ✅ Push to git or deploy

### What Happens Automatically:
1. ✅ Database connection detected
2. ✅ Schema initialized (if needed)
3. ✅ Tables, extensions, functions created
4. ✅ App starts serving requests

### That's It! 🎉

No manual SQL execution needed. No separate migration step. No database setup commands. Just deploy and go!

---

## 📊 Environment Variables Required

```bash
# Neon PostgreSQL (Primary)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# OR Vercel Postgres
POSTGRES_URL=postgresql://user:pass@host/db

# OR Supabase (Fallback)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🚨 Troubleshooting

### Problem: "Database not initialized"
**Solution:** The database will auto-initialize on the next request. Just visit:
```bash
curl https://your-app.com/api/health?init=true
```

### Problem: "Cannot connect to database"
**Solution:** Check your `DATABASE_URL` environment variable:
```bash
# Railway
railway variables

# Vercel
vercel env ls
```

### Problem: "Schema execution failed"
**Solution:** Check if you have the right permissions. The database user needs:
- CREATE TABLE
- CREATE EXTENSION
- CREATE FUNCTION

### Problem: Build succeeds but app can't connect
**Solution:** This is normal! Build may not have internet access. The app will initialize on first startup or request.

---

## 🎉 Summary

Your database setup is now **100% automated**:

✅ No manual SQL execution needed
✅ No manual schema setup required
✅ No separate migration steps
✅ No command-line database operations

**Just deploy and go!**

The database will automatically initialize:
- During build (if possible)
- On app startup (if not built)
- On first request (if startup failed)
- Via health check (anytime)

**It just works!** 🚀

---

## 📚 Files Created

- `/src/lib/db-auto-init.js` - Auto-initialization module
- `/src/pages/api/db/setup.js` - Manual setup endpoint
- `/src/pages/api/db/status.js` - Status check endpoint
- `/src/pages/api/health.js` - Enhanced health check
- `/scripts/init-database.js` - Build-time initialization
- `package.json` - Updated with auto-init scripts

---

## 🔗 Quick Links

- Health Check: `https://your-app.com/api/health`
- DB Status: `https://your-app.com/api/db/status`
- DB Setup: `https://your-app.com/api/db/setup`
- Schema File: `supabase/complete-schema.sql`

---

**Need help?** All initialization is logged. Check your deployment platform's logs for details!
