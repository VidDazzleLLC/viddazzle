# Deployment Readiness Checklist

## Pre-Deployment Verification

Use this checklist to ensure your VidDazzle application is ready for deployment.

## ✅ Database Setup

- [x] **Supabase project created**
- [x] **Database schema applied** (`schema/supabase-schema.sql` executed)
- [x] **pgvector extension enabled**
- [x] **All tables created:**
  - [x] workflows
  - [x] workflow_executions
  - [x] tutorial_embeddings
  - [x] mcp_tool_usage
  - [x] connectors
- [x] **Indexes created** (for performance optimization)
- [x] **Functions created:**
  - [x] match_tutorial_embeddings (vector similarity search)
  - [x] update_updated_at_column (timestamp automation)
- [x] **Triggers created** (automatic timestamp updates)

**Verification:** Check Supabase Dashboard > Table Editor to confirm all tables exist.

## ✅ Environment Configuration

### Local Environment (.env)

- [x] **ANTHROPIC_API_KEY** - Claude API key configured
- [x] **CLAUDE_MODEL** - Model name set (claude-opus-4-20250514)
- [x] **NEXT_PUBLIC_SUPABASE_URL** - Supabase project URL
- [x] **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key
- [x] **SUPABASE_SERVICE_ROLE_KEY** - Supabase service role key
- [x] **All optional settings** - MCP, workflow, embedding configs

**Verification:** Run `npm run dev` locally to test.

### Production Environment

Before deploying to Railway/Vercel, ensure:

- [ ] All environment variables from `.env` are added to the deployment platform
- [ ] Production Supabase credentials are used (not development)
- [ ] API keys are valid and have sufficient quota
- [ ] `NODE_ENV` is set to `production` (if needed)

## ✅ Application Setup

- [x] **Dependencies installed** (`npm install` completed)
- [x] **Supabase client configured** (`lib/supabase.ts`)
- [x] **Build succeeds** (test with `npm run build`)
- [x] **No TypeScript errors**
- [x] **No ESLint errors**

**Verification:** Run `npm run build` to ensure production build works.

## ✅ Database Connection Test

### Option 1: Local Test (if environment allows)

```bash
npm run test:db
```

**Expected output:** All tests pass, or at least Supabase Dashboard confirms tables exist.

**Note:** May fail with DNS errors in restricted environments (containers, CI/CD). This doesn't indicate a problem with the database itself.

### Option 2: Supabase Dashboard

1. Go to Supabase Dashboard > Table Editor
2. Verify all 5 tables are visible
3. Try inserting a test row into `workflows` table
4. Verify the row appears

### Option 3: API Test (Post-Deployment)

After deploying, test these endpoints:

```bash
# Health check
curl https://your-app.com/api/health

# Create a test workflow
curl -X POST https://your-app.com/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "steps": []}'
```

## 🚀 Deployment Options

Choose your deployment platform:

### Option A: Railway

**Pros:**
- PostgreSQL database included
- Easy environment variable management
- Automatic deployments from GitHub
- Built-in monitoring

**Steps:**
1. Connect GitHub repository to Railway
2. Add environment variables
3. Deploy

See [RAILWAY_DEPLOYMENT.md](../RAILWAY_DEPLOYMENT.md) for detailed instructions.

### Option B: Vercel

**Pros:**
- Optimized for Next.js
- Global CDN
- Automatic scaling
- Free tier generous

**Steps:**
1. Connect GitHub repository to Vercel
2. Add environment variables
3. Deploy

**Note:** Requires external database (Supabase, Neon, etc.)

### Option C: Docker

For self-hosting:

```bash
# Build image
docker build -t viddazzle .

# Run container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=xxx \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  viddazzle
```

## 📝 Post-Deployment Verification

After deployment, verify:

### 1. Application Loads

- [ ] Homepage loads without errors
- [ ] No console errors in browser
- [ ] UI renders correctly

### 2. Database Connectivity

- [ ] Can view workflows in Library tab
- [ ] Can create a new workflow
- [ ] Can execute a workflow
- [ ] Execution history is saved

### 3. API Endpoints Working

Test critical endpoints:

```bash
# Generate workflow
curl -X POST https://your-app.com/api/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Send me an email"}'

# List workflows
curl https://your-app.com/api/workflows

# Execute workflow
curl -X POST https://your-app.com/api/execute-workflow \
  -H "Content-Type: application/json" \
  -d '{"workflowId": "uuid", "input": {}}'
```

### 4. Claude Integration

- [ ] Can generate workflows using AI
- [ ] Claude responses are appropriate
- [ ] Workflow generation completes successfully

### 5. Error Handling

- [ ] 404 pages work
- [ ] API errors return proper status codes
- [ ] Error messages are user-friendly

## 🔧 Troubleshooting

### Build Fails

**Check:**
- All dependencies installed
- No TypeScript errors
- Environment variables set correctly
- Build script in package.json is correct

### Database Connection Fails

**Check:**
- Supabase URL is correct
- API keys are valid
- Database tables exist
- Firewall allows outbound connections

### Claude API Errors

**Check:**
- `ANTHROPIC_API_KEY` is set
- API key has sufficient quota
- Model name is correct
- Request format is valid

### Execution Timeouts

**Check:**
- Increase `WORKFLOW_TIMEOUT` environment variable
- Check network connectivity
- Optimize workflow steps
- Review execution logs

## 📊 Monitoring Setup

### Supabase Dashboard

Monitor database activity:
- Query performance
- Storage usage
- API requests
- Error rates

### Application Logs

Set up logging for:
- API requests
- Workflow executions
- Error tracking
- Performance metrics

### Alerts

Configure alerts for:
- High error rates
- Slow response times
- Database connection failures
- API quota warnings

## 🎉 Ready to Deploy!

Once all checklist items are complete:

1. Commit your changes
2. Push to your GitHub repository
3. Deploy to your chosen platform
4. Run post-deployment verification
5. Monitor for any issues

## 📚 Additional Resources

- [Database Setup Guide](./DATABASE_SETUP.md) - Detailed database setup
- [Railway Deployment Guide](../RAILWAY_DEPLOYMENT.md) - Railway-specific instructions
- [Configuration Templates](./CONFIGURATION_TEMPLATES.md) - MCP tools and connectors
- [Main README](../README.md) - Project overview and quick start

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment variables
4. Test database connectivity
5. Check API keys and quotas

For persistent issues, review the documentation or create an issue on GitHub.

---

**Last Updated:** November 3, 2025
