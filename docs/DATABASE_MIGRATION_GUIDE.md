# Database Migration Guide

## The Problem

You're seeing this error:
```
Could not find the table 'public.platform_credentials' in the schema cache
```

This means the social listening tables haven't been created in your database yet.

## Solution: Run Database Migrations

You have **two options** to fix this:

---

## Option 1: Using npm migrate (Recommended)

This method uses the automated migration script.

### Step 1: Get Your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** (gear icon) → **Database**
4. Scroll to **Connection string** section
5. Click the **URI** tab
6. Copy the connection string (looks like this):
   ```
   postgresql://postgres.rhbqgquapitkwazhqpdc:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. **Note**: If you don't see your password (shows `[YOUR-PASSWORD]`), click "Reset database password" to get a new one

### Step 2: Update .env File

Edit your `.env` file and replace `[YOUR-PASSWORD]` in the `DATABASE_URL` line:

```env
DATABASE_URL=postgresql://postgres.rhbqgquapitkwazhqpdc:YOUR_ACTUAL_PASSWORD_HERE@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 3: Run Migrations

```bash
npm run migrate
```

You should see:
```
✅ Migration completed successfully
✨ Database is now ready for social listening features!
```

---

## Option 2: Using Supabase SQL Editor (Easier, No Password Needed)

If you don't want to deal with database passwords, use this method:

### Step 1: Open SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run the Migration SQL

1. Click **New Query**
2. Copy the entire contents of `migrations/social-listening-schema.sql`
3. Paste it into the SQL editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Tables Were Created

Run this query to verify:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'platform_credentials',
  'listening_campaigns',
  'social_mentions',
  'outreach_rules',
  'outreach_messages'
);
```

You should see all 5 tables listed.

---

## What Gets Created

The migration creates these tables:

1. **`platform_credentials`** - Stores encrypted social media credentials
2. **`listening_campaigns`** - Campaign configurations for social listening
3. **`social_mentions`** - Detected social media posts and mentions
4. **`outreach_rules`** - Automated outreach rule definitions
5. **`outreach_messages`** - Generated outreach messages

Plus indexes, triggers, and constraints for optimal performance.

---

## Verify It Worked

After running the migration, test your app:

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/social-listening`

3. The error should be gone!

---

## Troubleshooting

### "Connection refused" or "Could not connect to database"

- **Check DATABASE_URL**: Make sure the password is correct
- **Check network**: Supabase might be blocking your IP. Go to Supabase Dashboard → Settings → Database → Connection Pooling and check allowed IPs
- **Use Option 2**: The SQL Editor method doesn't require network configuration

### "Permission denied" or "Role does not exist"

- Make sure you're using the **Database Password** (not the API keys)
- Try resetting your database password in Supabase Dashboard

### "Tables already exist"

- This is fine! It means migrations ran before. You're all set.
- The migration script is idempotent (safe to run multiple times)

### Migration succeeded but still getting errors

- **Restart your dev server**: Sometimes the app caches the old schema
  ```bash
  # Stop the server (Ctrl+C) then:
  npm run dev
  ```

- **Clear Next.js cache**:
  ```bash
  rm -rf .next
  npm run dev
  ```

---

## For Production Deployment

When deploying to production (Vercel, Railway, etc.):

1. **Add DATABASE_URL** to your production environment variables
2. **Run migrations** as part of your deployment:
   - Railway: Add as a release command
   - Vercel: Run migrations locally, then deploy
   - Docker: Add `npm run migrate` to startup script

3. **Supabase Dashboard method**: You can also run the SQL directly in production Supabase via SQL Editor

---

## Alternative: Run All Schema Files

If you need to set up the entire database from scratch:

### Option A: Via SQL Editor (Easiest)

1. Open Supabase SQL Editor
2. Run `supabase/schema.sql` first (base tables)
3. Then run `migrations/social-listening-schema.sql` (social listening tables)

### Option B: Via Command Line

```bash
# Make sure DATABASE_URL is set in .env
psql $DATABASE_URL -f supabase/schema.sql
psql $DATABASE_URL -f migrations/social-listening-schema.sql
```

---

## Need Help?

If you're still having issues:

1. Check the database connection in Supabase Dashboard
2. Verify your API keys are correct
3. Make sure pgvector extension is enabled (it should be by default)
4. Check Supabase logs for any errors

---

## Quick Reference

```bash
# Run migrations
npm run migrate

# Check if tables exist (requires psql)
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

# Manual migration (requires psql)
psql $DATABASE_URL -f migrations/social-listening-schema.sql
```
