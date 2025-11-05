# Database Setup Guide

Your Supabase connection is configured but having network issues. Let's set up all three databases for redundancy.

## Current Status
- ❌ Supabase: Configured but network error (fetch failed)
- ⚠️  Neon: Not configured
- ⚠️  Railway: Not configured

## Quick Setup Instructions

### Option 1: Fix Supabase (Already Configured)

Your current Supabase config:
```
URL: https://rhbqgquapitkwazhqpdc.supabase.co
```

**To fix:**
1. Go to https://supabase.com/dashboard
2. Check if the project `rhbqgquapitkwazhqpdc` is active
3. Verify it's not paused or suspended
4. Check if you need to pause/unpause the project

### Option 2: Add Neon Database

**To set up Neon:**
1. Go to https://console.neon.tech
2. Select your project or create new one
3. Copy your connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname`)
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://YOUR_CONNECTION_STRING_HERE
   ```

### Option 3: Add Railway Database

**To set up Railway:**
1. Go to https://railway.app/dashboard
2. Select your project
3. Go to PostgreSQL service
4. Copy the connection string from "Connect" tab
5. Add to `.env.local`:
   ```
   RAILWAY_DATABASE_URL=postgresql://YOUR_RAILWAY_STRING_HERE
   ```

## What I Need From You

Please provide ONE of the following:

**A) Neon Connection String:**
```
DATABASE_URL=postgresql://...
```

**B) Railway Connection String:**
```
RAILWAY_DATABASE_URL=postgresql://...
```

**C) New/Fixed Supabase Credentials:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

Just paste the connection string(s) and I'll configure everything automatically.

## Priority Recommendation

**Best setup: Neon or Railway** (faster, simpler PostgreSQL)
- Direct PostgreSQL connection
- No API wrapper overhead
- Better for this application structure

**Fallback: Supabase** (if you want auth + storage + realtime)
- Includes authentication built-in
- Has additional services
- Already partially configured
