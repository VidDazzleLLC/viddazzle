# VidDazzle Deployment Automation Guide

Complete automation for Railway deployment - from zero to production in 15 minutes!

---

## 🚀 Quick Start (One Command)

```bash
npm run setup:all
```

This single command will:
- ✅ Install and configure Railway CLI
- ✅ Set up all environment variables in Railway
- ✅ Configure GitHub Secrets for CI/CD
- ✅ Deploy your app to Railway
- ✅ Test your deployment

**That's it!** Your app will be live with automatic deployments enabled.

---

## 📚 Available Automation Scripts

### 1. One-Click Complete Setup

```bash
npm run setup:all
```

**What it does:**
- Installs Railway CLI if needed
- Authenticates with Railway
- Links to your Railway project
- Configures all environment variables from `.env.local`
- Sets up GitHub Secrets
- Deploys to Railway
- Tests the deployment

**Time:** 10-15 minutes (includes some manual steps)

---

### 2. Railway Environment Setup

```bash
npm run setup:railway:env
```

**What it does:**
- Reads configuration from `.env.local`
- Automatically sets all Railway environment variables
- Configures production defaults
- Provides instructions for DATABASE_URL if not found

**Time:** 2-3 minutes

**Requirements:**
- Railway CLI installed
- Logged into Railway
- `.env.local` file with your configuration

---

### 3. GitHub Secrets Configuration

```bash
npm run setup:github
```

**What it does:**
- Checks for GitHub CLI
- If available, automatically sets all GitHub Secrets
- If not, provides detailed instructions for manual setup
- Saves reference file with all needed values

**Time:** 5-7 minutes

**Requirements:**
- GitHub CLI (optional, for automatic setup)
- Railway token (get from Railway dashboard)
- Database URL (get from Supabase)

---

### 4. Interactive Setup Wizard

```bash
npm run setup:railway
```

**What it does:**
- Step-by-step interactive setup
- Guides you through each configuration step
- Prompts for required values
- Provides helpful links and instructions
- Tests deployment at the end

**Time:** 10-15 minutes

**Best for:** First-time setup or when you want more control

---

### 5. Deployment Testing

```bash
npm run test:deployment
```

**What it does:**
- Tests Railway CLI connection
- Verifies environment variables
- Checks GitHub Secrets
- Tests deployment endpoints
- Verifies database connection
- Checks GitHub Actions status

**Time:** 1-2 minutes

**Use when:** Verifying everything is working correctly

---

## 🎯 Automation Features

### Automatic Configuration

All scripts automatically:
1. **Install dependencies** (Railway CLI, GitHub CLI if needed)
2. **Authenticate** with Railway and GitHub
3. **Read from `.env.local`** to get configuration
4. **Set environment variables** in Railway
5. **Configure GitHub Secrets** for CI/CD
6. **Provide helpful instructions** for manual steps

### Smart Detection

Scripts detect and handle:
- ✅ Already installed tools
- ✅ Existing authentication
- ✅ Previously configured variables
- ✅ Missing configuration files
- ✅ Invalid credentials

### Error Handling

All scripts include:
- Clear error messages
- Helpful troubleshooting tips
- Links to relevant documentation
- Fallback to manual instructions

---

## 📋 What Gets Automated

### Railway Environment Variables

These are automatically configured from `.env.local`:

**Critical Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**Production Defaults:**
- `NODE_ENV=production`
- `MCP_TOOLS_ENABLED=true`
- `MAX_WORKFLOW_STEPS=50`
- `WORKFLOW_TIMEOUT=300000`
- `ENABLE_WORKFLOW_LEARNING=true`
- `EMBEDDING_MODEL=text-embedding-3-small`
- `EMBEDDING_DIMENSION=1536`

### GitHub Secrets

These are configured for CI/CD automation:

1. `RAILWAY_TOKEN` - Railway API token (for deployments)
2. `RAILWAY_PROJECT_ID` - Your Railway project ID
3. `RAILWAY_SERVICE_NAME` - Service name (usually "web")
4. `DATABASE_URL` - Database connection string
5. `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
6. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key

---

## 🔧 Manual Steps Required

Some steps cannot be fully automated and require your input:

### 1. Railway Token

**Why needed:** Allows GitHub Actions to deploy to Railway

**How to get:**
1. Go to [Railway Account Tokens](https://railway.app/account/tokens)
2. Click "Create Token"
3. Name: `GitHub Actions CI/CD`
4. Copy the token

**Used in:** GitHub Secrets setup

### 2. Database URL

**Why needed:** Your app needs to connect to the database

**How to get:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc)
2. Click Settings → Database
3. Under "Connection String", copy the **URI (Connection Pooling)**

**Used in:** Railway variables and GitHub Secrets

### 3. GitHub Secrets

**Why needed:** Enables automatic deployments on every push

**Two options:**

**Option A: Automatic (with GitHub CLI)**
```bash
npm run setup:github
# Follow prompts - secrets are set automatically
```

**Option B: Manual**
1. Go to [GitHub Secrets](https://github.com/VidDazzleLLC/viddazzle/settings/secrets/actions)
2. Click "New repository secret"
3. Add each secret from the list above

---

## 🎬 Step-by-Step Guide

### First-Time Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/VidDazzleLLC/viddazzle.git
   cd viddazzle
   npm install
   ```

2. **Create `.env.local`:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run one-click setup:**
   ```bash
   npm run setup:all
   ```

4. **Follow prompts:**
   - Login to Railway when prompted
   - Paste Railway token when asked
   - Paste DATABASE_URL when asked
   - Review and confirm deployment

5. **Done!** 🎉
   - Your app is deployed
   - Auto-deployment is enabled
   - Push to `main` to deploy

### Quick Verification

```bash
# 1. Check configuration
npm run verify:railway

# 2. Test deployment
npm run test:deployment

# 3. View logs
npm run railway:logs
```

---

## 🚦 Workflow After Setup

Once setup is complete, your workflow is:

```bash
# 1. Make changes to your code
vim src/pages/api/new-feature.js

# 2. Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# 3. ☕ That's it! Deployment happens automatically:
#    - GitHub Actions runs tests
#    - Migrations run automatically
#    - Deploys to Railway
#    - App is live in 2-3 minutes
```

### For Pull Requests

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# 3. Create PR on GitHub
# 4. Railway creates preview environment automatically
# 5. GitHub bot comments with preview URL
# 6. Merge PR to deploy to production
```

---

## 🐛 Troubleshooting

### Scripts Won't Run

**Problem:** Permission denied when running scripts

**Solution:**
```bash
chmod +x scripts/*.sh
```

### Railway CLI Not Found

**Problem:** `railway: command not found`

**Solution:**
```bash
npm install -g @railway/cli
```

### GitHub CLI Not Available

**Problem:** Cannot automatically set GitHub Secrets

**Solution:** Manual setup is fine! The script will provide instructions
1. Script creates `.github-secrets-reference.txt`
2. Follow instructions to add secrets manually
3. Delete reference file when done

### DATABASE_URL Missing

**Problem:** Script can't find DATABASE_URL

**Solution:**
1. Get from Supabase Dashboard
2. Add manually: `railway variables set DATABASE_URL='your_url'`
3. Or paste when prompted during setup

### Deployment Fails

**Problem:** Deployment starts but fails

**Solution:**
```bash
# 1. Check logs
npm run railway:logs

# 2. Verify configuration
npm run verify:railway

# 3. Test deployment
npm run test:deployment

# 4. Check common issues:
#    - DATABASE_URL is set correctly
#    - All GitHub Secrets are configured
#    - Railway service is running
```

---

## 📖 Script Reference

### All Available Commands

```bash
# Setup commands
npm run setup:all              # Complete one-click setup
npm run setup:railway          # Interactive Railway setup
npm run setup:railway:env      # Configure Railway environment variables
npm run setup:github           # Configure GitHub Secrets

# Verification commands
npm run verify:railway         # Verify Railway configuration
npm run verify:config          # Verify deployment configuration
npm run test:deployment        # Test deployment

# Deployment commands
npm run deploy                 # Deploy to production
npm run deploy:staging         # Deploy to staging
npm run railway:status         # Check deployment status
npm run railway:logs           # View deployment logs

# Development commands
npm run dev                    # Start local development server
npm run build                  # Build for production locally
npm run migrate                # Run database migrations locally
```

### Direct Script Execution

If you prefer to run scripts directly:

```bash
# One-click setup
bash scripts/one-click-deploy.sh

# Railway environment variables
bash scripts/auto-configure-railway.sh

# GitHub Secrets
bash scripts/auto-configure-github-secrets.sh

# Interactive setup
bash scripts/setup-railway-automated.sh

# Test deployment
bash scripts/test-deployment.sh
```

---

## 🔒 Security Notes

### What's Safe

- ✅ Scripts read from `.env.local` (which is gitignored)
- ✅ Secrets are never committed to git
- ✅ Railway and GitHub tokens are stored securely
- ✅ Scripts use environment variables for sensitive data

### Best Practices

1. **Never commit `.env.local`** - It's gitignored by default
2. **Delete temporary files** - Scripts may create temp files for convenience
3. **Rotate tokens regularly** - Especially if shared or exposed
4. **Use different keys** - Different keys for dev/staging/production
5. **Review before running** - Check script contents if unsure

### Temporary Files Created

Some scripts may create temporary files:
- `.railway-token.tmp` - Deleted automatically after use
- `.github-secrets.env` - Only created for manual setup, should be deleted
- `.github-secrets-reference.txt` - Reference only, delete after use

**All temporary files are gitignored automatically.**

---

## 🎓 Advanced Usage

### Custom Configuration

You can customize the automation by:

1. **Editing `.env.local`** - Scripts read configuration from here
2. **Modifying scripts** - All scripts are in `scripts/` directory
3. **Adding new variables** - Update scripts to include new env vars

### CI/CD Customization

The GitHub Actions workflow (`.github/workflows/deploy.yml`) can be customized:

```yaml
# Add custom deployment steps
# Modify test commands
# Add notifications
# Configure multiple environments
```

### Multiple Environments

Setup staging environment:

```bash
# Create staging environment in Railway
railway environment create staging

# Deploy to staging
npm run deploy:staging

# Or manually
railway up --environment staging
```

---

## 📊 What's Automated vs Manual

### ✅ Fully Automated

- Railway CLI installation
- Railway authentication
- Project linking
- Environment variable configuration
- Production defaults setup
- Deployment triggering
- Database migrations
- Health checks
- Log viewing

### 🔄 Semi-Automated (Prompts for Input)

- Railway token (you provide, script sets it)
- DATABASE_URL (you provide, script sets it)
- GitHub Secrets (script guides, may need manual)

### ❌ Not Automated (Manual Required)

- Creating Railway account
- Creating GitHub account
- Getting Supabase credentials
- Reviewing deployment logs for errors
- Deciding when to deploy

---

## 🎯 Best Practices

### For First-Time Setup

1. **Prepare credentials** - Have Railway token and DATABASE_URL ready
2. **Use one-click setup** - `npm run setup:all` is the easiest
3. **Follow prompts** - Scripts guide you through each step
4. **Test after setup** - Run `npm run test:deployment`
5. **Keep reference** - Save the `.github-secrets-reference.txt` temporarily

### For Ongoing Use

1. **Use git flow** - Feature branches → PR → Main → Auto-deploy
2. **Test locally first** - `npm run dev` before pushing
3. **Check logs** - `npm run railway:logs` if issues arise
4. **Monitor GitHub Actions** - Check workflow runs
5. **Verify after deploy** - Visit `/api/health` endpoint

### For Teams

1. **Share credentials securely** - Use password manager
2. **Document changes** - Update docs when modifying setup
3. **Review PRs** - Preview deployments help catch issues
4. **Rotate tokens** - Regularly update Railway tokens
5. **Monitor costs** - Railway Pro has usage limits

---

## 🆘 Getting Help

### Common Questions

**Q: Do I need to run setup every time?**
A: No! Setup is only needed once. After that, deployments are automatic.

**Q: Can I use this without GitHub CLI?**
A: Yes! The scripts provide manual instructions if GitHub CLI isn't available.

**Q: What if I don't have a Railway account?**
A: Sign up at [Railway.app](https://railway.app) - You have Pro plan access!

**Q: How do I update environment variables?**
A: Re-run `npm run setup:railway:env` or use Railway dashboard.

**Q: Can I run this on Windows?**
A: Yes! Use Git Bash, WSL, or adjust scripts for PowerShell.

### Support Resources

- **Railway Docs:** https://docs.railway.app
- **GitHub Actions:** https://docs.github.com/actions
- **VidDazzle Docs:** See `RAILWAY_DEPLOYMENT.md`
- **Railway Support:** team@railway.app (You have Pro support!)

---

## 🎉 Success!

After running the automation:

✅ Your app is deployed to Railway
✅ Every push to `main` triggers deployment
✅ Pull requests get preview environments
✅ Database migrations run automatically
✅ No manual deployment steps needed

**You can now focus on building features instead of managing deployments!**

---

**Last Updated:** 2025-11-04
**Status:** Production Ready
**Time to Setup:** 10-15 minutes with automation

🚀 **Happy Deploying!**
