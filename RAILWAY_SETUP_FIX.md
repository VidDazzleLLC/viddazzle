# 🚨 CRITICAL: Railway Deployment Setup Fix

**Status:** Setup is incomplete and deployments are failing.

**Root Cause:** Missing critical environment variables in Railway and GitHub.

---

## ⚠️ Critical Issues Found

### 1. Railway Environment Variables - MISSING
- **DATABASE_URL** is NOT set in Railway
- **POSTGRES_URL** is NOT set in Railway
- Without these, your app cannot connect to the database, causing health check failures

### 2. GitHub Secrets - COMPLETELY MISSING
- **NO GitHub Secrets are configured**
- This means GitHub Actions cannot deploy to Railway
- Auto-deployment is effectively disabled

### 3. Deployment Status
- Recent deployments showing failures
- `/api/health` endpoint failing due to no database connection
- Automated CI/CD pipeline never executed successfully

---

## 🔧 Immediate Fix Required

### Step 1: Get Your Supabase Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rhbqgquapitkwazhqpdc`
3. Go to **Settings** → **Database**
4. Under **Connection String**, look for the **Connection Pooling** section
5. Copy the **URI** - it will look like:
   ```
   postgresql://postgres.rhbqgquapitkwazhqpdc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. This is your `DATABASE_URL` - save it securely

**Alternatively**, if you want to use Transaction mode:
```
postgresql://postgres:[YOUR-PASSWORD]@db.rhbqgquapitkwazhqpdc.supabase.co:5432/postgres
```

---

### Step 2: Add Railway Environment Variables

**CRITICAL: You must add these to Railway immediately**

1. Go to [Railway Project](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57/service/7269fb20-0d9e-46ad-ac69-3fc5309f65e5/variables?environmentId=40a7572e-8281-4f6a-9522-fae06c6adff4)

2. Click **"New Variable"** and add each of these:

#### Essential Variables (Must Add Now):

```bash
# Database Connection (CRITICAL - GET FROM SUPABASE)
DATABASE_URL=postgresql://postgres.rhbqgquapitkwazhqpdc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# OR if using direct connection:
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.rhbqgquapitkwazhqpdc.supabase.co:5432/postgres
```

#### Verify These Are Already Set:
(These should already be in Railway - verify they exist)

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
CLAUDE_MODEL=claude-opus-4-20250514

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://rhbqgquapitkwazhqpdc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Config
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production

# MCP Config
MCP_TOOLS_ENABLED=true
MCP_MAX_RETRIES=3
MCP_TIMEOUT=30000

# Workflow Config
MAX_WORKFLOW_STEPS=50
WORKFLOW_TIMEOUT=300000
ENABLE_WORKFLOW_LEARNING=true

# Vector Embeddings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

3. Click **"Add"** to save each variable
4. Railway will automatically redeploy with the new variables

---

### Step 3: Add GitHub Secrets

**CRITICAL: GitHub Actions cannot run without these secrets**

1. Go to your GitHub repository: [VidDazzleLLC/viddazzle](https://github.com/VidDazzleLLC/viddazzle)

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Click **"New repository secret"** for each:

#### Required GitHub Secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `RAILWAY_TOKEN` | Get from Railway | [Railway Account → Tokens](https://railway.app/account/tokens) |
| `RAILWAY_PROJECT_ID` | `9a9c205d-62a1-4c33-8a73-298d83464e57` | From your Railway project URL |
| `RAILWAY_SERVICE_NAME` | `web` | Default service name in Railway |
| `DATABASE_URL` | Same as Step 2 | Your Supabase connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rhbqgquapitkwazhqpdc.supabase.co` | Already known |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | From your .env.local |

#### How to Get RAILWAY_TOKEN:

1. Go to [Railway Account Settings → Tokens](https://railway.app/account/tokens)
2. Click **"Create Token"**
3. Name: `GitHub Actions CI/CD`
4. Click **"Create"**
5. **IMPORTANT:** Copy the token immediately (you'll only see it once!)
6. Add it to GitHub Secrets as `RAILWAY_TOKEN`

---

### Step 4: Verify and Test

After adding all variables:

1. **Trigger a Redeploy in Railway:**
   - Go to Railway Dashboard
   - Click **"Deploy"** → **"Redeploy"**
   - Or just push a commit to trigger auto-deploy

2. **Push a Test Commit to Trigger GitHub Actions:**
   ```bash
   git commit --allow-empty -m "Test: Trigger Railway auto-deployment"
   git push origin main
   ```

3. **Monitor the Deployment:**
   - Watch GitHub Actions: [Actions Tab](https://github.com/VidDazzleLLC/viddazzle/actions)
   - Watch Railway Logs: [Railway Deployments](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57)

4. **Check Health Endpoint:**
   ```bash
   curl https://viddazzle-production-3965.up.railway.app/api/health
   ```

   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "database": "connected"
   }
   ```

---

## 📋 Quick Reference: All Required Variables

### Railway Environment Variables Checklist

- [ ] **DATABASE_URL** (CRITICAL - MISSING)
- [ ] ANTHROPIC_API_KEY (should exist)
- [ ] CLAUDE_MODEL (should exist)
- [ ] NEXT_PUBLIC_SUPABASE_URL (should exist)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (should exist)
- [ ] SUPABASE_SERVICE_ROLE_KEY (should exist)
- [ ] NEXT_PUBLIC_APP_URL (should exist)
- [ ] NODE_ENV (should exist)
- [ ] MCP_TOOLS_ENABLED (should exist)
- [ ] MCP_MAX_RETRIES (should exist)
- [ ] MCP_TIMEOUT (should exist)
- [ ] MAX_WORKFLOW_STEPS (should exist)
- [ ] WORKFLOW_TIMEOUT (should exist)
- [ ] ENABLE_WORKFLOW_LEARNING (should exist)
- [ ] EMBEDDING_MODEL (should exist)
- [ ] EMBEDDING_DIMENSION (should exist)

### GitHub Secrets Checklist

- [ ] **RAILWAY_TOKEN** (MISSING)
- [ ] **RAILWAY_PROJECT_ID** (MISSING)
- [ ] **RAILWAY_SERVICE_NAME** (MISSING)
- [ ] **DATABASE_URL** (MISSING)
- [ ] **NEXT_PUBLIC_SUPABASE_URL** (MISSING)
- [ ] **SUPABASE_SERVICE_ROLE_KEY** (MISSING)

---

## 🔍 Troubleshooting

### Issue: "Cannot find DATABASE_URL"

**Solution:**
1. Verify DATABASE_URL is added to Railway variables
2. Check spelling (case-sensitive)
3. Redeploy after adding the variable

### Issue: "GitHub Actions failing"

**Solution:**
1. Verify all 6 GitHub Secrets are added
2. Check RAILWAY_TOKEN hasn't expired
3. Re-run the failed workflow

### Issue: "Database connection failed"

**Solution:**
1. Verify DATABASE_URL format is correct
2. Test connection string with:
   ```bash
   psql "postgresql://postgres.rhbqgquapitkwazhqpdc:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" -c "SELECT NOW();"
   ```
3. Check Supabase dashboard for database status

### Issue: "Health check timeout"

**Solution:**
1. This usually means DATABASE_URL is missing
2. Add DATABASE_URL to Railway
3. Redeploy
4. Health check should pass within 30 seconds

---

## ✅ Success Criteria

Your setup is complete when:

1. ✅ All Railway environment variables are set (especially DATABASE_URL)
2. ✅ All 6 GitHub Secrets are configured
3. ✅ GitHub Actions workflow runs successfully
4. ✅ Railway deployment succeeds
5. ✅ `/api/health` returns `{"status":"healthy"}`
6. ✅ Push to main branch triggers automatic deployment
7. ✅ Database migrations run automatically

---

## 📞 Need Help?

If you're stuck:

1. **Check Railway Logs:**
   ```bash
   npm run railway:logs
   ```

2. **Test Database Connection Locally:**
   ```bash
   DATABASE_URL="your_connection_string" npm run test:railway
   ```

3. **Verify GitHub Actions:**
   - Go to GitHub → Actions tab
   - Check the latest workflow run
   - Look for error messages

4. **Railway Support:**
   - You have Pro plan with priority support
   - Railway → Help → Contact Support

---

## 🎯 Next Steps After Setup

Once everything is working:

1. **Set up automatic backups** (Railway Pro includes this)
2. **Configure custom domain** (if needed)
3. **Set up monitoring alerts**
4. **Review security settings**
5. **Test the full deployment workflow**

---

**Last Updated:** 2025-11-04

**Your Railway Project:** [View Project](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57)

**Your Deployment URL:** https://viddazzle-production-3965.up.railway.app
