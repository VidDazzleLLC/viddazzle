# FIX YOUR DATABASE NOW

## THE PROBLEM
Your app is broken because the social listening tables don't exist in your Supabase database.

## THE FIX (2 MINUTES)

### EASIEST METHOD: Use Supabase SQL Editor

1. **Go to your Supabase SQL Editor:**
   https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/sql/new

2. **Open the complete schema file:**
   File: `supabase/complete-schema.sql`

3. **Copy ALL the SQL** from that file

4. **Paste it into the SQL Editor**

5. **Click "RUN"** button

6. **Done!** All tables will be created

### Alternative: Use the Fix Script

If you have your database password:

1. Add to your `.env` file:
   ```
   DB_PASSWORD=your_actual_database_password
   ```

2. Run:
   ```bash
   node fix-database.js
   ```

## VERIFY IT WORKED

Run this command to test:
```bash
npm run dev
```

Then visit:
- http://localhost:3000 - Main app
- http://localhost:3000/social-listening - Social Listening feature

## What Was Wrong

The app code expected these tables:
- `listening_campaigns`
- `social_mentions`
- `outreach_rules`
- `outreach_messages`
- `platform_credentials`

But they weren't in your database because the schema wasn't applied.

Now you have ONE complete schema file with EVERYTHING the app needs.
