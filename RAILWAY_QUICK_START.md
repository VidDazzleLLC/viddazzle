# 🚨 Railway Deployment - QUICK START

**Your deployment is failing. Here's how to fix it in 15 minutes.**

---

## The Problem

Your Railway Pro deployment has these critical issues:

- ❌ **DATABASE_URL** is missing from Railway (causing all failures)
- ❌ **GitHub Secrets** are not configured (auto-deploy doesn't work)
- ❌ `/api/health` endpoint is failing
- ❌ No successful deployments

## The Fix (Follow in Order)

### Step 1: Verify Current Status (1 minute)

```bash
npm run verify:railway
```

This will show you exactly what's missing.

### Step 2: Get Your Database Connection String (5 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc)
2. Click **Settings** → **Database**
3. Under **Connection String**, copy the **URI** (Connection Pooling):
   ```
   postgresql://postgres.rhbqgquapitkwazhqpdc:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 3: Add to Railway (2 minutes)

1. Go to [Railway Variables](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57/service/7269fb20-0d9e-46ad-ac69-3fc5309f65e5/variables)
2. Click **"New Variable"**
3. Name: `DATABASE_URL`
4. Value: Paste the connection string from Step 2
5. Click **"Add"**
6. Railway will auto-redeploy (wait 2-3 minutes)

### Step 4: Test Health Endpoint (30 seconds)

```bash
curl https://viddazzle-production-3965.up.railway.app/api/health
```

Should return: `{"status":"healthy","database":"connected"}`

✅ If you see this, your app is now working!

### Step 5: Set Up Auto-Deployment (7 minutes)

1. Get Railway Token:
   - [Create token here](https://railway.app/account/tokens)
   - Name: `GitHub Actions CI/CD`
   - Copy the token

2. Add 6 GitHub Secrets ([go here](https://github.com/VidDazzleLLC/viddazzle/settings/secrets/actions)):
   - Click **"New repository secret"** for each:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN` | Token you just created |
| `RAILWAY_PROJECT_ID` | `9a9c205d-62a1-4c33-8a73-298d83464e57` |
| `RAILWAY_SERVICE_NAME` | `web` |
| `DATABASE_URL` | Same as Step 2 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rhbqgquapitkwazhqpdc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Check your `.env.local` file |

### Step 6: Test Auto-Deployment (2 minutes)

```bash
git commit --allow-empty -m "Test: Verify Railway auto-deployment"
git push origin main
```

Watch it deploy:
- [GitHub Actions](https://github.com/VidDazzleLLC/viddazzle/actions)
- [Railway Logs](https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57)

---

## ✅ Success Checklist

- [ ] Added DATABASE_URL to Railway
- [ ] Health endpoint returns healthy
- [ ] Created Railway Token
- [ ] Added all 6 GitHub Secrets
- [ ] Pushed test commit
- [ ] GitHub Actions workflow succeeded
- [ ] Auto-deployment works

---

## 📚 Detailed Guides

Need more info? Check these guides:

1. **[RAILWAY_SETUP_SUMMARY.md](./RAILWAY_SETUP_SUMMARY.md)** - Complete overview with troubleshooting
2. **[RAILWAY_SETUP_FIX.md](./RAILWAY_SETUP_FIX.md)** - Detailed step-by-step instructions
3. **[RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)** - Full deployment guide

---

## 🆘 Still Having Issues?

**Check these:**

1. **DATABASE_URL format wrong?**
   - Must start with `postgresql://`
   - Test it: `psql "your_url" -c "SELECT NOW();"`

2. **GitHub Secrets not working?**
   - Verify all 6 are added
   - Check for typos (case-sensitive!)
   - Railway token must be valid

3. **Deployment still failing?**
   - Check Railway logs for errors
   - Verify environment variables in Railway dashboard
   - Try redeploying manually

**Get help:**
- Railway Support (you have Pro!): team@railway.app
- Check Railway logs: `npm run railway:logs`
- View deployment status: `npm run railway:status`

---

**Last Updated:** 2025-11-04
**Time to Complete:** ~15 minutes
**Status:** Critical setup required

🚀 **Let's get this fixed!**
