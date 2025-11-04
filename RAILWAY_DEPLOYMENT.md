# VidDazzle - Railway Automated Deployment Guide

Complete guide for setting up fully automated CI/CD deployment on Railway with zero manual intervention.

## 🚂 Why Railway?

Railway is perfect for VidDazzle because:
- ✅ **Pro Plan Features**: Enhanced performance, more resources, priority support
- ✅ **PostgreSQL with pgvector**: Built-in database with vector support
- ✅ **Automatic Deployments**: Deploy on every git push
- ✅ **Environment Management**: Built-in secrets management
- ✅ **Preview Environments**: Test PRs before merging
- ✅ **Zero Configuration**: Railway auto-detects Next.js apps
- ✅ **Database Backups**: Automatic backups on Pro plan
- ✅ **Custom Domains**: Free SSL certificates included

---

## 🚀 Overview

Your automated deployment workflow:

```
Push Code → GitHub Actions → Quality Checks → Railway Build →
Database Migrations → Deploy → Live! 🎉
```

**Key Features:**
- ✅ Automatic database migrations on every deployment
- ✅ Environment variables managed in Railway dashboard
- ✅ No manual terminal commands needed
- ✅ Automatic preview deployments for pull requests
- ✅ Production deployments on main branch merges
- ✅ Built-in PostgreSQL database with pgvector

---

## 📋 Prerequisites

1. **Railway Pro Account** ✓ (You already have this!)
2. **GitHub Repository** - Your code repository
3. **Required API Keys**:
   - Anthropic API Key
   - Supabase credentials (or use Railway PostgreSQL)

---

## 🔧 Step 1: Railway Project Setup

### 1.1 Create Railway Project (If Not Done Already)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `viddazzle` repository
5. Railway will auto-detect Next.js and PostgreSQL needs

### 1.2 Add PostgreSQL Database

Railway Pro includes PostgreSQL with pgvector support:

1. In your Railway project, click **"New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will provision a database and provide `DATABASE_URL`
4. The `DATABASE_URL` is automatically added to your app's environment

**Or Use Your Existing Supabase Database:**
- You already have Supabase configured
- Just add the `DATABASE_URL` from Supabase to Railway environment variables

### 1.3 Configure Environment Variables

In Railway Dashboard → Your Service → Variables:

#### **Required Variables:**

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
CLAUDE_MODEL=claude-opus-4-20250514

# Supabase (if using Supabase instead of Railway PostgreSQL)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (automatically set if using Railway PostgreSQL)
# If using Supabase, add manually:
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# App Configuration
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NODE_ENV=production

# MCP Configuration
MCP_TOOLS_ENABLED=true
MCP_MAX_RETRIES=3
MCP_TIMEOUT=30000

# Workflow Configuration
MAX_WORKFLOW_STEPS=50
WORKFLOW_TIMEOUT=300000
ENABLE_WORKFLOW_LEARNING=true
```

#### **Optional Variables (for specific features):**

```bash
# Social Media APIs
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET=your_twitter_secret
REDDIT_CLIENT_ID=your_reddit_id
LINKEDIN_CLIENT_ID=your_linkedin_id
```

**Pro Tip:** Copy from your `.env.railway` file!

### 1.4 Enable Automatic Deployments

1. In Railway → Settings → GitHub
2. Enable **"Automatic Deploys"** for `main` branch
3. Enable **"PR Previews"** for pull requests
4. Save settings

**Result:** Every push to `main` = automatic deployment! 🚀

---

## 🤖 Step 2: GitHub Actions Setup

### 2.1 Get Railway Token

1. Go to [Railway Account Settings → Tokens](https://railway.app/account/tokens)
2. Click **"Create Token"**
3. Name it: `GitHub Actions CI/CD`
4. Copy the token (you'll only see it once!)

### 2.2 Get Railway Project ID

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
cd /path/to/viddazzle
railway link

# Get project ID
railway status
# Look for "Project ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Or find it in Railway Dashboard → Project Settings → Project ID

### 2.3 Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `RAILWAY_TOKEN` | Your Railway API token | Railway → Account → Tokens |
| `RAILWAY_PROJECT_ID` | Your project ID | `railway status` or Railway Dashboard |
| `RAILWAY_SERVICE_NAME` | `web` (or your service name) | Railway → Project → Service name |
| `DATABASE_URL` | Your database connection string | Railway → PostgreSQL → Variables |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL (if using) | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (if using) | Supabase Dashboard |

### 2.4 Workflow Configuration

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured to:

1. ✅ Run quality checks (lint, type check)
2. ✅ Run database migrations
3. ✅ Deploy to Railway
4. ✅ Post preview URLs on pull requests

**No additional configuration needed!**

---

## 🎯 Step 3: How Automated Deployment Works

### Workflow Diagram

```
┌──────────────────┐
│   Developer      │
│   Pushes Code    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  GitHub Actions  │
│  Triggered       │
└────────┬─────────┘
         │
         ├─► Quality Check (Lint/Type Check)
         │
         ├─► Database Migration Check
         │
         ▼
┌──────────────────┐
│  Railway Build   │
│  Process         │
└────────┬─────────┘
         │
         ├─► npm install
         │
         ├─► Run migrate:deploy (Auto Migrations)
         │
         ├─► next build
         │
         ▼
┌──────────────────┐
│  Deploy to       │
│  Production      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  🎉 LIVE!        │
│  Auto-deployed   │
└──────────────────┘
```

### Automatic Migrations

The `railway.json` configuration ensures migrations run automatically:

```json
{
  "build": {
    "buildCommand": "npm install && npm run build:deploy"
  }
}
```

The `build:deploy` script runs:
1. Database migration (`node scripts/deploy-migrate.js`)
2. Next.js build (`next build`)

**This happens automatically on every deployment!**

---

## 🔄 Deployment Workflows

### For Production Deployment

**Method 1: Automatic (Recommended)**
```bash
# Just push to main
git push origin main
# → Railway deploys automatically!
```

**Method 2: Manual via CLI**
```bash
# Deploy manually with Railway CLI
npm run deploy

# Or directly
railway up
```

### For Preview/Staging Deployment

**Method 1: Pull Request (Automatic)**
1. Create a feature branch
2. Push changes
3. Open a pull request
4. Railway creates preview environment automatically
5. GitHub bot comments with preview URL

**Method 2: Staging Environment**
```bash
# Deploy to staging environment
npm run deploy:staging

# Or directly
railway up --environment staging
```

### Database Migrations

**Automatic (Default)**
- Migrations run automatically during every deployment
- No manual intervention needed
- Uses `scripts/deploy-migrate.js`

**Manual (If Needed)**
```bash
# Test database connection
npm run test:railway

# Run migrations manually
npm run migrate:deploy

# Or use Railway CLI
railway run npm run migrate:deploy
```

---

## 📊 Railway Pro Features

### Database Management

**Backups:**
- Pro plan includes automatic daily backups
- Access backups in Railway → Database → Backups
- Restore with one click

**Monitoring:**
- Real-time database metrics
- Query performance insights
- Connection pool monitoring

**Scaling:**
- Vertical scaling (increase RAM/CPU)
- Connection pooling enabled by default
- pgvector extension pre-installed

### Application Monitoring

**Logs:**
```bash
# View logs in real-time
npm run railway:logs

# Or in Railway dashboard
Railway → Service → Deployments → Logs
```

**Metrics:**
- CPU usage
- Memory usage
- Network traffic
- Request latency

**Health Checks:**
- Automatic health checks via `/api/health`
- Configured in `railway.json`
- Auto-restart on failures

---

## 🎛️ Environment Management

### Development vs Production

**Development (.env.local)**
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost/viddazzle_dev
```

**Production (Railway)**
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
DATABASE_URL=${{DATABASE_URL}}  # Auto-provided by Railway
```

### Railway Variables Reference

Railway automatically provides these variables:

| Variable | Description |
|----------|-------------|
| `${{RAILWAY_PUBLIC_DOMAIN}}` | Your app's public URL |
| `${{DATABASE_URL}}` | PostgreSQL connection string |
| `${{RAILWAY_ENVIRONMENT}}` | Current environment (production/staging) |
| `${{RAILWAY_SERVICE_NAME}}` | Service name |

Use them in your Railway variables like:
```bash
NEXT_PUBLIC_APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🧪 Testing Your Setup

### 1. Test Local Configuration

```bash
# Verify environment variables
npm run verify:config

# Test database connection
npm run test:railway

# Run local dev server
npm run dev
```

### 2. Test Deployment

```bash
# Create a test commit
git commit --allow-empty -m "Test Railway deployment"
git push origin main

# Watch deployment
npm run railway:logs
```

### 3. Check Deployment Status

```bash
# View Railway status
npm run railway:status

# Or check Railway dashboard
# Railway → Project → Deployments
```

### 4. Verify Migrations

```bash
# Connect to Railway database
railway run npm run test:railway

# Should show all tables created
```

---

## 🐛 Troubleshooting

### Build Fails

**Symptom:** Deployment fails during build

**Solutions:**

1. Check Railway logs:
   ```bash
   npm run railway:logs
   ```

2. Verify environment variables:
   - Railway → Service → Variables
   - Ensure all required variables are set

3. Test build locally:
   ```bash
   npm run build:deploy
   ```

### Migration Fails

**Symptom:** Migrations fail during deployment

**Solutions:**

1. Check DATABASE_URL is correct
2. Verify database is running (Railway → PostgreSQL → Status)
3. Run migrations manually:
   ```bash
   railway run npm run migrate:deploy
   ```
4. Check migration logs in Railway deployment logs

### Application Doesn't Start

**Symptom:** Deployment succeeds but app doesn't start

**Solutions:**

1. Check start command in `railway.json`
2. Verify health check endpoint works: `/api/health`
3. Check logs for startup errors:
   ```bash
   npm run railway:logs
   ```
4. Increase startup timeout (Railway → Settings → Health Check Timeout)

### Database Connection Issues

**Symptom:** Can't connect to database

**Solutions:**

1. Verify DATABASE_URL is set:
   ```bash
   railway variables
   ```

2. Check database is running:
   - Railway → PostgreSQL → Metrics

3. Test connection:
   ```bash
   railway run npm run test:railway
   ```

4. If using Supabase:
   - Verify credentials in Railway variables
   - Check Supabase dashboard for connection limits

### GitHub Actions Fails

**Symptom:** CI/CD pipeline fails

**Solutions:**

1. Check GitHub Secrets are set correctly:
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`
   - `RAILWAY_SERVICE_NAME`

2. Verify Railway token has not expired:
   - Railway → Account → Tokens

3. Check workflow logs:
   - GitHub → Actions → Failed workflow

4. Re-create Railway token if needed

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Store all secrets in Railway Variables
- ✅ Use different API keys for staging/production
- ✅ Enable Railway's built-in DDoS protection
- ✅ Regularly rotate API keys and database passwords
- ✅ Use Railway's automatic SSL certificates
- ✅ Enable database connection limits
- ✅ Review Railway access logs regularly

### ❌ Don'ts

- ❌ Never commit `.env` files to git
- ❌ Never expose API keys in client-side code
- ❌ Never use production credentials in development
- ❌ Never share Railway tokens in team chats
- ❌ Never disable Railway's health checks
- ❌ Never skip database backups (use Pro plan backups)

---

## 💰 Railway Pro Plan Benefits

You're getting great value with Pro:

| Feature | Hobby | Pro (You!) |
|---------|-------|-----------|
| **Deployments** | 500 hrs/month | Unlimited |
| **Database Backups** | Manual only | Automatic daily |
| **Priority Support** | Community | Email + Priority |
| **Custom Domains** | 1 | Unlimited |
| **Team Members** | 1 | Unlimited |
| **Concurrent Builds** | 1 | 3 |
| **Metrics Retention** | 7 days | 30 days |
| **Egress** | 100 GB | 500 GB |

---

## 📚 Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:deploy` | Build with automatic migrations |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:railway` | Test Railway database connection |
| `npm run migrate` | Run database migrations |
| `npm run migrate:deploy` | Run deployment-time migrations |
| `npm run verify:config` | Verify deployment configuration |
| `npm run deploy` | Deploy to Railway |
| `npm run deploy:staging` | Deploy to staging environment |
| `npm run railway:link` | Link to Railway project |
| `npm run railway:status` | Check deployment status |
| `npm run railway:logs` | View real-time logs |

---

## 🎓 Advanced Configuration

### Custom Domains

1. Railway → Service → Settings → Domains
2. Click **"Add Domain"**
3. Enter your custom domain
4. Add DNS records provided by Railway
5. SSL certificate auto-generated!

### Multiple Environments

```bash
# Create staging environment
railway environment create staging

# Deploy to staging
railway up --environment staging

# List environments
railway environment list
```

### Database Migrations

Create new migration files in `migrations/` folder:

```sql
-- migrations/002_add_new_feature.sql
CREATE TABLE new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Update `scripts/run-migrations.ts` to include the new file.

### Rollback Deployments

```bash
# View deployment history
railway deployments

# Rollback to previous deployment
railway rollback
```

---

## 🎉 Success Checklist

- [x] Railway Pro account active
- [ ] Project created and linked to GitHub
- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured in Railway
- [ ] GitHub Actions secrets added
- [ ] Automatic deployments enabled
- [ ] First deployment successful
- [ ] Database migrations working
- [ ] Health checks passing
- [ ] Custom domain configured (optional)

---

## 🚀 Your Automated Workflow

Once everything is configured:

```bash
# 1. Write code
vim src/pages/api/new-feature.js

# 2. Commit changes
git add .
git commit -m "Add new feature"

# 3. Push to GitHub
git push origin main

# 4. ☕ Grab coffee
# Railway automatically:
# - Runs quality checks
# - Runs database migrations
# - Builds your app
# - Deploys to production
# - Notifies you of success

# 5. 🎉 Your feature is LIVE!
```

**That's it! No manual deployment steps ever again!**

---

## 📖 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/develop/cli)
- [Next.js on Railway](https://docs.railway.app/guides/nextjs)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [GitHub Actions + Railway](https://docs.railway.app/guides/github-actions)

---

## 💬 Support

**Railway Support:**
- Pro plan includes priority email support
- Railway → Help → Contact Support

**GitHub Issues:**
- Check deployment logs first
- Include error messages and Railway logs
- Mention you're on Railway Pro plan

---

## 🎊 Congratulations!

You now have a **fully automated, zero-touch deployment pipeline** for VidDazzle on Railway Pro!

**Your team can:**
- ✅ Deploy by just pushing code
- ✅ Get automatic preview environments for every PR
- ✅ Have database migrations run automatically
- ✅ Monitor app health in real-time
- ✅ Scale resources as needed
- ✅ Roll back deployments instantly

**No more manual deployments. No more terminal commands. Just code, push, and ship!** 🚂🚀

