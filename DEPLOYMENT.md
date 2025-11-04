# VidDazzle - Automated Deployment Guide

> **🚂 Using Railway?** See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for Railway-specific instructions (recommended for Railway Pro users!)

> **⚠️ Note:** This guide covers Vercel deployment. If you're using Railway Pro, please use the Railway-specific guide above for optimized configuration.

This guide will help you set up fully automated deployments for VidDazzle with zero manual intervention required.

## 🚀 Overview

VidDazzle uses a fully automated CI/CD pipeline:

```
Push Code → GitHub Actions → Database Migrations → Build → Deploy to Vercel → Live!
```

**Key Features:**
- ✅ Automatic database migrations on every deployment
- ✅ Environment variables managed in the cloud
- ✅ No manual terminal commands needed
- ✅ Automatic preview deployments for pull requests
- ✅ Production deployments on main branch merges

---

## 📋 Prerequisites

Before you begin, you'll need:

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository** - Your code should be in a GitHub repo
3. **Supabase Project** - Get your database credentials from [supabase.com](https://supabase.com)
4. **Anthropic API Key** - Get it from [console.anthropic.com](https://console.anthropic.com)

---

## 🔧 Step 1: Configure Vercel

### 1.1 Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

### 1.2 Configure Environment Variables

In your Vercel project settings, add these environment variables:

#### **Required for All Environments:**

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Supabase Dashboard → Settings → API |

#### **Required for Automated Migrations:**

| Variable | Value | Where to Get It |
|----------|-------|-----------------|
| `DATABASE_URL` | PostgreSQL connection string | See "Getting Database URL" below |
| `DB_PASSWORD` | Your database password | Supabase Dashboard → Settings → Database |

#### **Optional (for specific features):**

| Variable | Description |
|----------|-------------|
| `CLAUDE_MODEL` | Claude model to use (default: claude-opus-4-20250514) |
| `TWITTER_API_KEY` | For social listening features |
| `REDDIT_CLIENT_ID` | For Reddit integration |
| `LINKEDIN_CLIENT_ID` | For LinkedIn features |

### 1.3 Getting Your Database URL

Your Supabase `DATABASE_URL` follows this format:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**To get it:**

1. Go to Supabase Dashboard → Settings → Database
2. Find **Connection String** → **Connection pooling**
3. Copy the URI format
4. Replace `[PASSWORD]` with your actual database password

**Example:**
```
postgresql://postgres.abcdef123456:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.4 Set Environment Variables in Vercel

**Method 1: Via Vercel Dashboard**

1. Go to your project on Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Enter the variable name (e.g., `ANTHROPIC_API_KEY`)
   - Enter the value
   - Select environments: **Production**, **Preview**, and **Development**
   - Click **Save**

**Method 2: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... add all required variables
```

---

## 🤖 Step 2: Configure GitHub Actions

### 2.1 Add GitHub Secrets

To enable the full CI/CD pipeline, add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `VERCEL_TOKEN` | Your Vercel API token | Deploy to Vercel |
| `VERCEL_ORG_ID` | Your Vercel organization ID | Identify your org |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | Identify your project |
| `DATABASE_URL` | Your PostgreSQL connection string | Run migrations in CI |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Build checks |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Database access |

### 2.2 Getting Vercel Credentials

**Vercel Token:**
1. Go to [Vercel Settings → Tokens](https://vercel.com/account/tokens)
2. Create a new token with **Full Access**
3. Copy and save it as `VERCEL_TOKEN` in GitHub Secrets

**Vercel Org ID and Project ID:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
cd /path/to/your/project
vercel link

# Get IDs from .vercel/project.json
cat .vercel/project.json
```

Copy the `orgId` and `projectId` values to GitHub Secrets.

---

## 🎯 Step 3: Deploy Workflow

### How It Works

**On Every Push to Main:**
1. GitHub Actions runs quality checks (lint, type check)
2. Database migrations run automatically (if `DATABASE_URL` is set)
3. Code is built and deployed to Vercel
4. Your app goes live instantly!

**On Pull Requests:**
1. Quality checks run
2. Preview deployment is created
3. GitHub bot comments on PR with preview URL
4. You can test changes before merging

### Manual Deployment (Optional)

You can also deploy manually:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## 🔄 Database Migrations

### Automatic Migrations

Migrations run automatically during deployment via the `build:deploy` script:

```json
{
  "scripts": {
    "build:deploy": "node scripts/deploy-migrate.js && next build"
  }
}
```

The migration script:
- ✅ Checks if database connection is available
- ✅ Applies the complete schema if needed
- ✅ Verifies all tables exist
- ✅ Continues deployment even if migration fails (graceful degradation)

### Manual Migrations (if needed)

If you need to run migrations manually:

```bash
# Using the deploy migration script
npm run migrate:deploy

# Using the full migration script (requires tsx)
npm run migrate

# Using the legacy fix script
node fix-database.js
```

---

## 🌍 Environment-Specific Configuration

### Development
- Runs on `localhost:3000`
- Uses `.env.local` file for secrets
- Manual deployments via `npm run dev`

### Preview (Staging)
- Auto-deployed on every PR
- Uses Vercel preview environment variables
- Unique URL for each PR: `your-app-git-branch-name-org.vercel.app`

### Production
- Auto-deployed when merging to `main`
- Uses production environment variables
- Your custom domain: `your-app.vercel.app` or custom domain

---

## 🔒 Security Best Practices

### ✅ Do's

- ✅ Store all secrets in Vercel/GitHub Secrets
- ✅ Use different API keys for dev/staging/production
- ✅ Enable Vercel's authentication for preview deployments
- ✅ Regularly rotate API keys and database passwords
- ✅ Use environment-specific Supabase projects

### ❌ Don'ts

- ❌ Never commit `.env` files to git
- ❌ Never expose API keys in client-side code
- ❌ Never use production credentials in development
- ❌ Never share database passwords in team chats

---

## 🧪 Testing Your Setup

### 1. Test Environment Variables

Create a test endpoint: `pages/api/health.js`

```javascript
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV
  });
}
```

Visit `/api/health` to verify all environment variables are set.

### 2. Test Deployment

```bash
# Push a small change to test the pipeline
git commit --allow-empty -m "Test deployment pipeline"
git push origin main
```

Watch the deployment:
1. GitHub Actions will run (check the Actions tab)
2. Vercel will build and deploy
3. Your app will be live in ~2-3 minutes

### 3. Test Database Connection

Visit your deployed app and try features that use the database:
- Create a workflow
- Run a test execution
- Check if data persists

---

## 🐛 Troubleshooting

### Build Fails with "Missing Environment Variable"

**Solution:** Make sure all required environment variables are set in Vercel:
- Go to Vercel → Settings → Environment Variables
- Ensure variables are enabled for the correct environment (Production/Preview)
- Redeploy after adding variables

### Database Migration Fails

**Symptoms:** App deploys but database errors occur

**Solutions:**

1. **Check DATABASE_URL is correct:**
   ```bash
   # Test connection locally
   npm run test:db
   ```

2. **Run migrations manually:**
   ```bash
   # From Vercel deployment logs, copy the DATABASE_URL
   export DATABASE_URL="postgresql://..."
   npm run migrate:deploy
   ```

3. **Use Supabase SQL Editor (easiest):**
   - Go to Supabase Dashboard → SQL Editor
   - Run the SQL from `supabase/complete-schema.sql`

### GitHub Actions Fails

**Check these items:**

1. ✅ All GitHub Secrets are added
2. ✅ `VERCEL_TOKEN` has full access permissions
3. ✅ `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct
4. ✅ Repository has access to GitHub Actions

### Preview Deployments Not Working

**Solution:**
1. Ensure the workflow is triggered on PRs:
   ```yaml
   on:
     pull_request:
       branches:
         - main
   ```
2. Check GitHub Actions permissions:
   - Repo Settings → Actions → General → Workflow permissions
   - Enable "Read and write permissions"

---

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Database Connection](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 Success!

Once everything is configured, your workflow will be:

1. **Write code** → Push to GitHub
2. **Automatic checks** → Linting, type checking
3. **Automatic migrations** → Database stays in sync
4. **Automatic deployment** → Live in minutes
5. **Zero manual steps** → Just code and push!

**You're now fully automated!** 🚀

Your team can focus on building features while the pipeline handles all deployments, migrations, and infrastructure automatically.

---

## 💬 Support

If you encounter issues:

1. Check deployment logs in Vercel Dashboard
2. Check GitHub Actions logs for CI/CD issues
3. Test database connection with `npm run test:db`
4. Review this guide for any missed steps

Happy deploying! 🎊
