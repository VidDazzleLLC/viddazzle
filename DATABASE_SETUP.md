# Automated Database Setup

Your Workflow Autopilot now supports **fully automated database setup** - no more manual SQL copy/paste!

## 🚀 Quick Setup (Recommended)

### Option 1: One-Click API Setup

Simply visit this URL in your browser **once** after deployment:

```
https://viddazzle-production.up.railway.app/api/admin/setup-db
```

**What it does:**
- ✅ Creates all required tables automatically
- ✅ Adds indexes for performance
- ✅ Enables pgvector extension for embeddings
- ✅ Safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`)

**Response:**
```json
{
  "success": true,
  "message": "Database setup complete",
  "tables": [
    "workflows",
    "workflow_executions",
    "tutorial_embeddings",
    "mcp_tool_usage",
    "connectors",
    "email_logs",
    "workflow_logs"
  ]
}
```

### Option 2: POST Request

For automated deployment pipelines:

```bash
curl -X POST https://viddazzle-production.up.railway.app/api/admin/setup-db
```

### Option 3: Check Database Status

Check if database is already initialized:

```bash
curl https://viddazzle-production.up.railway.app/api/admin/setup-db
```

Response:
```json
{
  "initialized": true,
  "message": "Database is already initialized"
}
```

---

## 🔄 Reset Database (Advanced)

**⚠️ WARNING: This will DELETE all data!**

To drop and recreate all tables:

```
https://viddazzle-production.up.railway.app/api/admin/setup-db?reset=true
```

Or via curl:

```bash
curl -X POST "https://viddazzle-production.up.railway.app/api/admin/setup-db?reset=true"
```

---

## 📋 Tables Created

The automated setup creates these tables:

### Core Tables
- **workflows** - Stores AI-generated workflows
- **workflow_executions** - Tracks workflow execution history
- **mcp_tool_usage** - Logs MCP tool usage and performance

### Logging Tables
- **email_logs** - Tracks emails sent by workflows
- **workflow_logs** - General purpose workflow logging

### Integration Tables
- **connectors** - External service configurations
- **tutorial_embeddings** - Vector embeddings for AI learning (requires pgvector)

---

## 🛠️ Manual Setup (If Needed)

If you prefer manual control, the SQL schema is in:
- `supabase/schema.sql`

Or access the database setup code:
- `/src/lib/db-setup.js`

---

## 🎯 When to Run Setup

Run the setup endpoint:
1. **After first deployment** - Initialize fresh database
2. **After adding new tables** - Updates are safe (IF NOT EXISTS)
3. **After database reset** - Recreate schema

---

## 🔐 Security Note

In production, you may want to:
1. Add authentication to `/api/admin/*` endpoints
2. Restrict access by IP
3. Use environment variables to enable/disable admin endpoints

Example protection:
```javascript
// In /src/pages/api/admin/setup-db.js
if (process.env.ADMIN_SECRET !== req.headers['x-admin-secret']) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## ✅ Automated in CI/CD

Add to your deployment pipeline:

```yaml
# Example: GitHub Actions
- name: Setup Database
  run: |
    curl -X POST https://viddazzle-production.up.railway.app/api/admin/setup-db
```

---

**That's it! No more manual SQL execution needed.** 🎉
