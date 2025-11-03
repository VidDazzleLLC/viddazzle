# ⚠️ CRITICAL: Setup Database Schema on Railway

## Your App Won't Work Until You Do This!

Your Railway infrastructure is deployed, but the **database tables don't exist yet**. This will cause your app to crash when users try to use it.

## 🚀 Quick Setup (5 minutes)

### Step 1: Open Railway SQL Editor

1. Go to: https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/2ab87db8-58f4-41f6-bab7-10dfc986b527

2. Click on the **"Data"** tab (or **"Query"** tab if available)

3. You should see a SQL query editor

### Step 2: Copy the Schema SQL

Open the file `railway-schema.sql` in your repository and **copy the entire contents**.

Or use this command to view it:
```bash
cat railway-schema.sql
```

### Step 3: Run the SQL in Railway

1. **Paste** the SQL into Railway's query editor
2. **Click "Run"** or press **Ctrl+Enter**
3. Wait for it to complete (should take 5-10 seconds)

### Step 4: Verify Success

You should see:
```
✅ Database schema created successfully!
```

Then verify tables were created:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output:
- ✅ connectors
- ✅ mcp_tool_usage
- ✅ tutorial_embeddings
- ✅ workflow_executions
- ✅ workflows

### Step 5: Test the Connection

Run from your local machine:
```bash
# First, add Railway DATABASE_URL to .env.local
# Get it from: https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/2ab87db8-58f4-41f6-bab7-10dfc986b527/variables

# Then test
node test-railway-db.js
```

Expected output:
```
✓ Connected successfully
✓ pgvector extension installed
✓ Found 5 table(s)
✓ All required tables exist
✅ Database Connection Test Complete!
```

---

## Alternative Method: Railway CLI

If you prefer command line:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link 7fac9f16-a149-4ebf-b45a-44e10d1c33bb

# Connect to database
railway connect postgres

# In the PostgreSQL prompt, paste the contents of railway-schema.sql
# Then type \q to exit
```

---

## What This Schema Creates

**5 Tables:**
1. **workflows** - Store user-created workflows
2. **workflow_executions** - Track workflow runs
3. **tutorial_embeddings** - AI learning database with vector search
4. **mcp_tool_usage** - Log MCP tool usage
5. **connectors** - Store connector configurations

**Key Features:**
- ✅ pgvector extension enabled for AI embeddings
- ✅ Full-text search capabilities
- ✅ Automatic timestamp updates
- ✅ Referential integrity (foreign keys)
- ✅ Optimized indexes for performance

---

## After Schema is Created

Your app will be **fully functional**:
- ✅ Create and save workflows
- ✅ Execute workflows
- ✅ Search tutorials with AI
- ✅ Track tool usage
- ✅ Manage connectors

---

## Troubleshooting

### Error: "extension vector does not exist"
The pgvector extension isn't enabled. Run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Error: "permission denied"
Make sure you're using the Railway dashboard (you have full admin access there).

### Error: "relation already exists"
That's OK! The schema uses `IF NOT EXISTS`, so it's safe to run multiple times.

---

## Quick Check: Is Your App Working?

After creating the schema:

1. **Visit your Railway app URL** (get from Railway dashboard)
2. **Try creating a workflow**
3. **Check if it saves successfully**

If it works: **🎉 You're done!**

If not: Check Railway logs for errors:
https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/5615a68b-0d2a-4396-b9a6-214d6dae01cf

---

**⏰ Do this now before your users try to use the app!**
