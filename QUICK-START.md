# QUICK START - Fix Database & Launch App

## Current Status
✅ App code is working
✅ Dependencies installed
✅ Environment configured
❌ **DATABASE TABLES MISSING** ← THIS IS THE ONLY ISSUE

## Fix It Now (Choose ONE option)

### OPTION 1: SQL Editor (FASTEST - 2 MINUTES)

1. **Open Supabase SQL Editor:**
   https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/sql/new

2. **Copy the SQL:**
   Open file: `supabase/complete-schema.sql`
   Select all (Ctrl+A / Cmd+A) and copy

3. **Paste & Run:**
   Paste into SQL Editor → Click "RUN"

4. **Done!** All tables created

### OPTION 2: Command Line (If you have DB password)

```bash
# Add to .env file:
echo "DB_PASSWORD=your_password_here" >> .env

# Run the fix:
node fix-database.js
```

## Launch Your App

```bash
npm run dev
```

Visit:
- **Main App:** http://localhost:3000
- **Social Listening:** http://localhost:3000/social-listening
- **Workflows:** http://localhost:3000/app

## What's Fixed

Created a **complete unified schema** (`supabase/complete-schema.sql`) that includes:

### Workflow Features:
- workflows
- workflow_executions
- tutorial_embeddings
- mcp_tool_usage
- connectors

### Social Listening Features:
- listening_campaigns
- social_mentions
- outreach_rules
- outreach_messages
- platform_credentials

## Files Created

- `supabase/complete-schema.sql` - **ONE complete schema** for everything
- `fix-database.js` - Automated fix script (needs DB password)
- `check-database.js` - Verify what tables exist
- `FIX-DATABASE-NOW.md` - Detailed fix instructions
- `QUICK-START.md` - This file

## Why It Was Broken

The app had TWO separate schema files:
- `supabase/schema.sql` (workflows only)
- `migrations/social-listening-schema.sql` (social features)

The social listening schema was never applied to your database!

Now you have **ONE file** with **EVERYTHING**. Apply it once and you're done.

## Need Help?

Check database status:
```bash
node check-database.js
```

View logs:
```bash
npm run dev
# Check browser console at http://localhost:3000
```
