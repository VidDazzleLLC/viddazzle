# Railway Setup - Complete Summary & Action Plan

**Generated:** 2025-11-04
**Status:** ⚠️ CRITICAL ISSUES REQUIRE IMMEDIATE ATTENTION

---

## 🎯 Executive Summary

Your Railway Pro deployment is configured but **NOT FUNCTIONAL** due to missing critical environment variables and GitHub secrets. This document provides everything you need to fix it immediately.

**Impact:**
- ❌ Deployments are failing
- ❌ Health checks timing out
- ❌ Database connections not working
- ❌ Auto-deployment via GitHub Actions is non-functional

**Time to Fix:** ~15 minutes
**Complexity:** Low (just adding configuration)

---

## 📊 Current State Analysis

### Railway Environment - What's Working ✅

The following are already configured in Railway:

```
✅ ANTHROPIC_API_KEY (Claude API)
✅ CLAUDE_MODEL
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ NEXT_PUBLIC_APP_URL
✅ NODE_ENV
✅ MCP_TOOLS_ENABLED
✅ MCP_MAX_RETRIES
✅ MCP_TIMEOUT
✅ MAX_WORKFLOW_STEPS
✅ WORKFLOW_TIMEOUT
✅ ENABLE_WORKFLOW_LEARNING
✅ EMBEDDING_MODEL
✅ EMBEDDING_DIMENSION
```

**Total:** 15 environment variables configured

### Railway Environment - What's Missing ❌

```
❌ DATABASE_URL - CRITICAL! Your app cannot connect to database
❌ POSTGRES_URL - Alternative name for same connection
```

**Impact:** Without these, your application:
- Cannot start properly
- Fails health checks (`/api/health` returns errors)
- Cannot run migrations
- Cannot access any database features

### GitHub Secrets - What's Missing ❌

```
❌ RAILWAY_TOKEN - Required for GitHub Actions to deploy
❌ RAILWAY_PROJECT_ID - Required to identify your project
❌ RAILWAY_SERVICE_NAME - Required to identify service
❌ DATABASE_URL - Required for running migrations in CI
❌ NEXT_PUBLIC_SUPABASE_URL - Required for build verification
❌ SUPABASE_SERVICE_ROLE_KEY - Required for migrations
```

**Impact:** Without these:
- GitHub Actions workflows cannot run
- Auto-deployment on push to main is broken
- PR preview deployments don't work
- No automated quality checks or migrations

### Deployment History

Recent deployments show:
- ⚠️ Partial deployments (build succeeds, but runtime fails)
- ❌ Health check failures
- ❌ Database connection timeouts
- ❌ No successful GitHub Actions runs

---

## 🔧 IMMEDIATE ACTION REQUIRED

### Priority 1: Get Database Connection String (5 minutes)

**You need your Supabase database password to construct the DATABASE_URL.**

#### Option A: Get Full Connection String from Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc)
2. Click **Settings** → **Database**
3. Scroll to **Connection String** section
4. Click **URI** tab
5. Under **Connection Pooling**, you'll see:
   ```
   postgresql://postgres.rhbqgquapitkwazhqpdc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. Copy this entire string
7. This is your `DATABASE_URL`

#### Option B: Get Transaction Mode Connection

If you need transaction mode instead:
1. In the same section, look for **Transaction** or **Direct connection**
2. The format will be:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.rhbqgquapitkwazhqpdc.supabase.co:5432/postgres
   ```

**Recommendation:** Use **Connection Pooling** (Option A) for better performance.

---

### Priority 2: Add DATABASE_URL to Railway (2 minutes)

**Direct Link:** [Railway Variables](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57/service/7269fb20-0d9e-46ad-ac69-3fc5309f65e5/variables?environmentId=40a7572e-8281-4f6a-9522-fae06c6adff4)

1. Click the link above (or go to Railway → Your Project → Variables)
2. Click **"New Variable"**
3. Name: `DATABASE_URL`
4. Value: Paste the connection string from Priority 1
5. Click **"Add"**
6. Railway will automatically trigger a redeploy

**Expected Result:** Within 2-3 minutes, your app should redeploy and health checks should pass.

---

### Priority 3: Get Railway Token (3 minutes)

1. Go to [Railway Account Settings → Tokens](https://railway.app/account/tokens)
2. Click **"Create Token"**
3. Name it: `GitHub Actions CI/CD`
4. Click **"Create"**
5. **IMPORTANT:** Copy the token immediately (shown only once!)
6. Save it somewhere secure temporarily

---

### Priority 4: Add All GitHub Secrets (5 minutes)

**Direct Link:** Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these **6 secrets** by clicking "New repository secret" for each:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `RAILWAY_TOKEN` | Token from Priority 3 | Just created |
| `RAILWAY_PROJECT_ID` | `9a9c205d-62a1-4c33-8a73-298d83464e57` | From your Railway URL |
| `RAILWAY_SERVICE_NAME` | `web` | Default service name |
| `DATABASE_URL` | Same as Priority 1 | Your Supabase connection |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rhbqgquapitkwazhqpdc.supabase.co` | Already known |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | From your `.env.local` |

**For `SUPABASE_SERVICE_ROLE_KEY`:** Check your local `.env.local` file, it's already there.

---

### Priority 5: Test Everything (5 minutes)

#### Step 1: Verify Railway Deployment

After adding DATABASE_URL, Railway should auto-redeploy. Check:

```bash
# Test the health endpoint
curl https://viddazzle-production-3965.up.railway.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-04T...","database":"connected"}
```

#### Step 2: Trigger GitHub Actions

Push a test commit to trigger the CI/CD pipeline:

```bash
git commit --allow-empty -m "Test: Verify Railway auto-deployment"
git push origin main
```

#### Step 3: Monitor

Watch the deployment:
- **GitHub Actions:** [View Workflows](https://github.com/VidDazzleLLC/viddazzle/actions)
- **Railway Logs:** [View Logs](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57)

#### Step 4: Verify Success

All of these should be green/passing:
- ✅ GitHub Actions workflow completes successfully
- ✅ Railway deployment succeeds
- ✅ Health check returns `{"status":"healthy"}`
- ✅ No errors in Railway logs

---

## 📋 Complete Checklist

Print this and check off each item as you complete it:

### Railway Environment Variables
- [ ] Get DATABASE_URL from Supabase Dashboard
- [ ] Add DATABASE_URL to Railway variables
- [ ] Verify Railway auto-redeploys
- [ ] Test `/api/health` endpoint returns healthy

### GitHub Secrets Setup
- [ ] Create Railway Token
- [ ] Add `RAILWAY_TOKEN` to GitHub Secrets
- [ ] Add `RAILWAY_PROJECT_ID` to GitHub Secrets
- [ ] Add `RAILWAY_SERVICE_NAME` to GitHub Secrets
- [ ] Add `DATABASE_URL` to GitHub Secrets
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` to GitHub Secrets
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to GitHub Secrets

### Verification
- [ ] Push test commit to main
- [ ] GitHub Actions workflow runs successfully
- [ ] Railway deployment completes
- [ ] Health endpoint returns healthy status
- [ ] Database migrations run automatically
- [ ] Application is accessible and functional

---

## 🔍 Verification Commands

Run these locally to verify your configuration:

```bash
# Check what environment variables are set
npm run verify:railway

# Test Railway database connection (with proper DATABASE_URL)
DATABASE_URL="your_connection_string" npm run test:railway

# View Railway deployment status
npm run railway:status

# View live Railway logs
npm run railway:logs
```

---

## 📖 Detailed Documentation References

For more information, see:

1. **[RAILWAY_SETUP_FIX.md](./RAILWAY_SETUP_FIX.md)** - Detailed troubleshooting guide
2. **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Complete deployment guide
3. **[.github/workflows/deploy.yml](./.github/workflows/deploy.yml)** - CI/CD configuration

---

## 🆘 Troubleshooting

### "I can't find my database password"

**Solution:**
1. Go to Supabase Dashboard → Settings → Database
2. The connection string should show `[YOUR-PASSWORD]`
3. If you've forgotten it, you can reset it in Supabase Settings → Database → Database Password → Reset Password

### "Railway keeps failing even after adding DATABASE_URL"

**Check:**
1. Is the DATABASE_URL format correct? (should start with `postgresql://`)
2. Can you connect to the database from your local machine?
   ```bash
   psql "your_database_url" -c "SELECT NOW();"
   ```
3. Check Railway logs for specific error messages
4. Verify the Supabase database is running (check Supabase dashboard)

### "GitHub Actions still failing"

**Check:**
1. Are all 6 GitHub Secrets added? (Go to Settings → Secrets → Actions)
2. Is the RAILWAY_TOKEN valid? (Check Railway → Account → Tokens)
3. Look at the GitHub Actions workflow logs for specific errors
4. Try re-running the failed workflow

### "Health check timing out"

This is almost always due to missing DATABASE_URL:
1. Verify DATABASE_URL is in Railway variables
2. Check Railway logs for database connection errors
3. Redeploy if you just added the variable
4. Wait 30-60 seconds for health check to complete

---

## ✅ Success Indicators

You'll know everything is working when:

1. **Railway Dashboard:**
   - Latest deployment shows "Success"
   - Health check shows green/healthy
   - No errors in logs
   - CPU/Memory usage looks normal

2. **GitHub Actions:**
   - Latest workflow shows green checkmark
   - All jobs (quality-check, database-migration, deploy) pass
   - Deployment URL posted in PR comments (for PRs)

3. **Application:**
   - `/api/health` returns `{"status":"healthy"}`
   - Main page loads correctly
   - Login works
   - Database operations work

4. **Automation:**
   - Push to main → automatic deployment
   - PR created → automatic preview deployment
   - No manual intervention needed

---

## 🎉 After Setup is Complete

Once everything is working:

### 1. Document Your Configuration
Create a secure note with:
- DATABASE_URL (keep this secret!)
- RAILWAY_TOKEN (keep this secret!)
- Railway Project ID
- Supabase Project Details

### 2. Set Up Monitoring
- Configure Railway alerts for deployment failures
- Set up Supabase alerts for database issues
- Add your team to Railway project (if needed)

### 3. Test the Full Workflow
- Create a test branch
- Make a small change
- Push and verify auto-deployment
- Verify database migrations work

### 4. Review Security
- Rotate API keys if they're old
- Review Railway access logs
- Check GitHub repository settings
- Verify secrets are not exposed in logs

---

## 📞 Support Resources

### Railway Support (You Have Pro!)
- Email: team@railway.app
- Discord: [Railway Community](https://discord.gg/railway)
- Docs: [Railway Docs](https://docs.railway.app)

### Supabase Support
- Dashboard: [Supabase Dashboard](https://supabase.com/dashboard)
- Docs: [Supabase Docs](https://supabase.com/docs)
- Discord: [Supabase Community](https://discord.supabase.com)

### GitHub Actions
- Docs: [GitHub Actions Docs](https://docs.github.com/en/actions)
- Status: [GitHub Status](https://www.githubstatus.com/)

---

## 🚀 Your Deployment Architecture

Once configured, here's how your automated pipeline works:

```
┌─────────────────┐
│  Developer      │
│  Pushes Code    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │◄──── Secrets configured
│ Workflow Starts │      (RAILWAY_TOKEN, etc.)
└────────┬────────┘
         │
         ├─► Quality Check (Lint, Type Check)
         ├─► Database Migrations (Using DATABASE_URL)
         │
         ▼
┌─────────────────┐
│ Railway Deploy  │◄──── Environment variables set
│ Build & Deploy  │      (DATABASE_URL, API keys)
└────────┬────────┘
         │
         ├─► Install Dependencies
         ├─► Run Migrations (deploy-migrate.js)
         ├─► Build Next.js App
         ├─► Start Application
         │
         ▼
┌─────────────────┐
│ Health Check    │◄──── Database connection works
│ Passes ✅       │      (because DATABASE_URL set)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 🎉 LIVE!        │
│ viddazzle-      │
│ production.     │
│ railway.app     │
└─────────────────┘
```

**Every step is automatic after the initial setup!**

---

**Last Updated:** 2025-11-04
**Estimated Setup Time:** 15-20 minutes
**Next Steps:** Follow Priority 1-5 above in order
