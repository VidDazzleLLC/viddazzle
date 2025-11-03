# 🚂 Deploy to Railway NOW - Step-by-Step Guide

## ✅ Prerequisites
- ✅ Railway account (you have this!)
- ✅ GitHub repo: `VidDazzleLLC/viddazzle` (ready!)
- ✅ Code is ready for deployment (all set!)

---

## 🚀 Step 1: Deploy from GitHub (2 minutes)

1. **Open Railway**: Go to [railway.app/dashboard](https://railway.app/dashboard)

2. **New Project**: Click **"New Project"**

3. **Deploy from GitHub**:
   - Click **"Deploy from GitHub repo"**
   - Select **`VidDazzleLLC/viddazzle`**
   - Railway will auto-detect Next.js ✅

4. **Wait for build**: ~2 minutes (Railway builds your app automatically)

---

## 🗄️ Step 2: Add PostgreSQL Database (30 seconds)

1. In your Railway project, click **"+ New"**

2. Select **"Database"**

3. Click **"Add PostgreSQL"**

4. **Done!** Railway automatically:
   - Creates the database
   - Sets `DATABASE_URL` environment variable
   - Connects it to your app

---

## 🔧 Step 3: Configure Database (2 minutes)

### 3.1 Enable pgvector Extension

1. Click on your **PostgreSQL** service (not the app)

2. Go to **"Query"** tab

3. **Copy and paste** this command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. Click **"Run"** (or press Ctrl/Cmd + Enter)

5. You should see: `CREATE EXTENSION` ✅

### 3.2 Run Database Schema

1. Still in the **Query** tab

2. **Open** the file: `supabase/schema.sql` (on your machine or from GitHub)

3. **Copy ALL contents** of the file

4. **Paste** into the Railway Query tab

5. Click **"Run"**

6. You should see multiple `CREATE TABLE` and `CREATE INDEX` success messages ✅

---

## ⚙️ Step 4: Set Environment Variables (1 minute)

1. Click on your **App service** (not the database)

2. Go to **"Variables"** tab

3. Click **"New Variable"** and add these:

### Required Variables:

```bash
ANTHROPIC_API_KEY
```
Value: Your Claude API key (starts with `sk-ant-api03-`)

```bash
CLAUDE_MODEL
```
Value: `claude-opus-4-20250514`

### Optional but Recommended:

```bash
MCP_TOOLS_ENABLED
```
Value: `true`

```bash
MAX_WORKFLOW_STEPS
```
Value: `50`

```bash
WORKFLOW_TIMEOUT
```
Value: `300000`

```bash
NODE_ENV
```
Value: `production`

### Optional (for embeddings):

```bash
OPENAI_API_KEY
```
Value: Your OpenAI API key (if you want to use embeddings)

**Note**: You don't need to set `DATABASE_URL` - Railway already set it automatically! ✅

---

## ✅ Step 5: Deploy & Get Your URL (Auto)

Railway automatically redeploys when you add environment variables.

1. Wait ~2 minutes for deployment

2. Look for **"Deployments"** tab - should show "Success" ✅

3. **Get your URL**:
   - Go to **"Settings"** tab
   - Under **"Domains"**, you'll see your app URL
   - It looks like: `https://viddazzle-production.up.railway.app`

4. **Click the URL** to open your app! 🎉

---

## 🎯 Quick Verification Checklist

After deployment, verify everything works:

- [ ] App loads at Railway URL
- [ ] Can see the homepage with "Workflow Autopilot" title
- [ ] Can navigate between tabs (Generate, Workflow, Execution, Library)
- [ ] Try generating a simple workflow
- [ ] Check if it saves to database

---

## 🔗 Your Environment Variables Summary

Here's what should be set:

| Variable | Source | Status |
|----------|--------|--------|
| `DATABASE_URL` | Auto-set by Railway | ✅ Auto |
| `POSTGRES_URL` | Auto-set by Railway | ✅ Auto |
| `ANTHROPIC_API_KEY` | You add manually | ⚙️ Required |
| `CLAUDE_MODEL` | You add manually | ⚙️ Required |
| `MCP_TOOLS_ENABLED` | You add manually | 📝 Optional |
| `MAX_WORKFLOW_STEPS` | You add manually | 📝 Optional |
| `NODE_ENV` | You add manually | 📝 Optional |
| `OPENAI_API_KEY` | You add manually | 📝 Optional |

---

## 📊 What to Copy/Paste

### For pgvector (Step 3.1):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### For schema (Step 3.2):
Copy the entire file: `supabase/schema.sql`

Or get it from GitHub:
https://github.com/VidDazzleLLC/viddazzle/blob/main/supabase/schema.sql

---

## 🎨 Custom Domain (Optional)

Want a custom domain like `app.yourdomain.com`?

1. In Railway, go to **Settings** → **Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain
4. Update your DNS with the CNAME record Railway provides
5. Done!

---

## 🐛 Troubleshooting

### Build fails?
- Check Railway **Logs** tab for errors
- Verify all dependencies in `package.json`
- Make sure branch is pushed to GitHub

### Database connection error?
- Verify pgvector extension is enabled
- Check schema was run successfully
- Look for "CREATE TABLE" success messages

### API errors?
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check it starts with `sk-ant-api03-`
- Make sure `CLAUDE_MODEL` is set

### Can't generate workflows?
- Check Railway Logs for errors
- Verify database tables exist
- Test database connection in Railway Query tab:
  ```sql
  SELECT * FROM workflows LIMIT 1;
  ```

---

## 💰 Railway Costs

### Free Tier:
- $5 free credits per month
- ~500 execution hours
- Perfect for testing and small projects

### Typical Costs for This App:
- **Hobby use**: $0-5/month (free tier covers it)
- **Active development**: $10-15/month
- **Production with traffic**: $20-30/month

You can set spending limits in Railway settings!

---

## 🎉 You're Done!

Once you see:
- ✅ Build succeeded
- ✅ Deployment active
- ✅ URL accessible
- ✅ App loads in browser

**Congratulations!** Your Workflow Autopilot is LIVE! 🚀

Share your Railway URL and start creating AI-powered workflows!

---

## 📞 Need Help?

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: Active community support
- Check Logs: Railway dashboard → Logs tab

---

**Total Time**: ~5-10 minutes
**Difficulty**: ⭐ Very Easy

Let's go! 🚂💨
