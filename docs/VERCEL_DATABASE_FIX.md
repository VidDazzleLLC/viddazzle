# Fixing Vercel Database Connection Issues

## Problem: Authentication Fails with Database Error

**Symptoms:**
- Users cannot sign in or sign up
- Error in logs: `PrismaClientInitializationError` or `getaddrinfo ENOTFOUND postgres.railway.internal`
- 500 Internal Server Error on `/login` page
- Database operations fail

## Root Cause

Your Vercel deployment has `DATABASE_URL` pointing to Railway's **internal** hostname:
```
postgresql://user:password@postgres.railway.internal:5432/database
```

**Why This Fails:**
- `postgres.railway.internal` is Railway's **private internal network** hostname
- It ONLY works from within Railway's infrastructure
- Vercel deployments run on Vercel's infrastructure, not Railway's
- Vercel **cannot reach** Railway's internal network
- Result: All database connections fail → Auth fails

## The Fix

### Step 1: Update DATABASE_URL in Vercel (REQUIRED)

You need to change the `DATABASE_URL` in Vercel to use a **publicly accessible** database URL.

#### Option A: Use Neon PostgreSQL (Recommended - Current Setup)

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Update to your Neon URL:
   ```
   postgresql://neondb_owner:npg_qos4wrNZd9LX@ep-ancient-lake-ahtrruya-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   *(This is the same URL in your `.env` file)*

4. Set for all environments: **Production**, **Preview**, **Development**
5. **Save** and **Redeploy** your application

#### Option B: Use Railway's External URL

If you want to use Railway's database instead:

1. Go to **Railway Dashboard** → **PostgreSQL Service** → **Connect**
2. Copy the **Public Network** URL (looks like):
   ```
   postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway
   ```
   Or:
   ```
   postgresql://postgres:password@randomname.proxy.rlwy.net:12345/railway
   ```
3. Update `DATABASE_URL` in Vercel with this external URL
4. **Save** and **Redeploy**

**NEVER use these hostnames from Vercel:**
- ❌ `postgres.railway.internal` (Railway internal only)
- ❌ `localhost` (local only)
- ❌ `127.0.0.1` (local only)

### Step 2: Verify the Fix

After updating and redeploying:

1. **Check Vercel Deployment Logs:**
   ```
   Look for: "✓ Database connection successful"
   Should NOT see: "ENOTFOUND" or "connection refused"
   ```

2. **Test Authentication:**
   - Go to your app's `/login` page
   - Try to sign in or sign up
   - Should work without 500 errors

3. **Check Database Connection:**
   - Visit: `https://your-app.vercel.app/api/health`
   - Should show database status as connected

## Prevention

This codebase now includes validation to prevent this issue:

1. **Startup Validation** (`src/lib/db.js`):
   - Automatically detects Railway internal URLs
   - Throws error with helpful message
   - Prevents silent failures

2. **CI/CD Validation** (`.github/workflows/deploy.yml`):
   - Validates DATABASE_URL before deployment
   - Fails build if using Railway internal hostname
   - Ensures only valid URLs are deployed

3. **Manual Validation** (run locally):
   ```bash
   npm run validate:env
   ```

## How Auth Depends on Database

Understanding why database connection affects authentication:

1. **User Signs In:**
   - Supabase Auth validates credentials ✅
   - Creates session token ✅

2. **App Needs Database:**
   - Store/retrieve user profile data
   - Save user preferences
   - Track user sessions
   - Store app-specific user data

3. **If Database Connection Fails:**
   - Cannot save user profile → Error
   - Cannot retrieve user data → Error
   - Auth appears to fail even though Supabase worked
   - User sees: "500 Internal Server Error"

**Bottom Line:** Auth needs the database. If `DATABASE_URL` is wrong, auth will fail.

## Environment Variables Checklist

Ensure these are set correctly in **Vercel**:

- ✅ `DATABASE_URL` - Public database URL (Neon or Railway external)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- ✅ `ANTHROPIC_API_KEY` - Claude API key
- ✅ `NEXT_PUBLIC_APP_URL` - Your Vercel app URL

## Still Having Issues?

### Check 1: Is DATABASE_URL actually updated in Vercel?
```bash
# In Vercel project, check environment variables
# Make sure it shows the Neon/Railway external URL
```

### Check 2: Did you redeploy after updating?
```bash
# Environment variable changes require a redeploy
# Go to Deployments → Redeploy
```

### Check 3: Is the database URL correct?
```bash
# Test locally:
DATABASE_URL="your_vercel_database_url" npm run test:db
```

### Check 4: Network/Firewall Issues?
- Ensure your database allows connections from Vercel's IP ranges
- Check if database requires allowlisting (Neon/Railway usually don't)

## Summary

**Problem:** Vercel using Railway internal URL (`postgres.railway.internal`)
**Solution:** Update `DATABASE_URL` in Vercel to use Neon or Railway external URL
**Result:** Database connections work → Auth works → App works ✅

---

**Need Help?** Check the deployment logs in Vercel for specific error messages.
