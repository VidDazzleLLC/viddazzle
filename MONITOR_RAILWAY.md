# Railway Deployment Monitoring Guide

## Quick Access Links

- **Railway Dashboard:** https://railway.com/dashboard
- **Your Project:** https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb
- **VidDazzle App Service:** https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/5615a68b-0d2a-4396-b9a6-214d6dae01cf
- **pgvector Database:** https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/2ab87db8-58f4-41f6-bab7-10dfc986b527

## Monitor Deployment Logs

### Option 1: Railway Web Dashboard (Easiest)

1. **View VidDazzle App Logs:**
   - Visit: [VidDazzle Service](https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/5615a68b-0d2a-4396-b9a6-214d6dae01cf)
   - Click **"Deployments"** tab
   - Click on the latest deployment
   - Click **"View Logs"** button
   - Watch real-time logs stream

2. **View Database Logs:**
   - Visit: [pgvector Service](https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb/service/2ab87db8-58f4-41f6-bab7-10dfc986b527)
   - Same process: Deployments → Latest → View Logs

### Option 2: Railway CLI (Advanced)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link 7fac9f16-a149-4ebf-b45a-44e10d1c33bb

# View VidDazzle app logs
railway logs --service viddazzle

# View database logs
railway logs --service pgvector

# Follow logs in real-time
railway logs --follow

# Filter logs by deployment
railway logs --deployment <deployment-id>
```

## What to Look For in Logs

### ✅ Healthy Deployment Signs

**VidDazzle App:**
```
✓ Compiled successfully
✓ Ready in Xms
✓ - Local: http://localhost:3000
✓ - On Your Network: http://0.0.0.0:3000
🔌 Using Neon/PostgreSQL client
✓ Connected to database
```

**pgvector Database:**
```
database system is ready to accept connections
LOG: database system was shut down at ...
LOG: database system is ready
```

### ⚠️ Warning Signs to Watch

**Connection Issues:**
```
❌ Error: connect ECONNREFUSED
❌ Error: getaddrinfo ENOTFOUND
❌ FATAL: password authentication failed
```
**Solution:** Check DATABASE_URL in environment variables

**API Issues:**
```
❌ Error: 401 Unauthorized
❌ Error: 429 Too Many Requests
❌ Error: Invalid API key
```
**Solution:** Verify ANTHROPIC_API_KEY

**Build Failures:**
```
❌ npm ERR! code ELIFECYCLE
❌ Error: Cannot find module
❌ Type error: ...
```
**Solution:** Check package.json dependencies

## Monitor Performance Metrics

### Railway Dashboard Metrics

1. **CPU Usage:**
   - Navigate to Service → Metrics
   - Normal: <50% average
   - Warning: >70% sustained
   - Critical: >90% sustained

2. **Memory Usage:**
   - Normal: <512MB for Next.js app
   - Warning: >768MB sustained
   - Critical: >1GB or increasing

3. **Network Traffic:**
   - Monitor inbound/outbound requests
   - Watch for unusual spikes
   - Check bandwidth usage

4. **Database Connections:**
   - pgvector → Metrics
   - Active connections should be <20 typically
   - Watch for connection pool exhaustion

### Key Metrics to Track

| Metric | Normal Range | Action Threshold |
|--------|-------------|------------------|
| Response Time | <500ms | >2000ms |
| CPU Usage | <50% | >80% |
| Memory | <512MB | >900MB |
| DB Connections | <10 | >50 |
| Error Rate | <1% | >5% |

## Set Up Alerts (Optional)

### Railway Webhooks

1. Go to: Project Settings → Webhooks
2. Add webhook URL for monitoring service
3. Configure events:
   - Deployment failed
   - Service crashed
   - Resource limits exceeded

### External Monitoring Services

Consider integrating:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Datadog** - APM monitoring
- **Prometheus** - Metrics collection

## Common Log Patterns

### Successful Deployment

```
[Build] Installing dependencies...
[Build] ✓ Dependencies installed
[Build] Building application...
[Build] ✓ Build complete
[Deploy] Starting deployment...
[Deploy] ✓ Deployment successful
[Runtime] Server started on port 3000
[Runtime] 🔌 Using Neon/PostgreSQL client
```

### Database Connection

```
[App] Testing database connection...
[App] ✓ Database connected successfully
[App] ✓ pgvector extension loaded
[App] Ready to handle requests
```

### AI Feature Usage

```
[App] POST /api/generate-workflow
[App] → Calling Claude API (model: claude-opus-4-20250514)
[App] ✓ Workflow generated (1234ms)
[App] ✓ Saved to database
[App] Response: 200 OK
```

### Error Examples

```
[Error] TypeError: Cannot read property 'map' of undefined
[Error]   at /app/src/pages/api/workflows.js:42
[Error] Stack trace: ...

[Error] Database query failed:
[Error] relation "workflows" does not exist

[Error] Anthropic API error:
[Error] 401: Invalid API key
```

## Troubleshooting Guide

### Issue: App Won't Start

**Check Logs For:**
- Port binding errors
- Environment variable errors
- Database connection failures

**Quick Fix:**
```bash
# Check environment variables
railway vars

# Restart deployment
railway up --detach

# Check service status
railway status
```

### Issue: Slow Response Times

**Check:**
1. Database query performance
2. API call latency
3. Memory usage
4. Network throughput

**Solutions:**
- Add database indexes
- Implement caching
- Optimize queries
- Scale resources

### Issue: Database Connection Errors

**Check:**
1. DATABASE_URL is correct
2. Database service is running
3. Connection pool settings
4. Network connectivity

**Quick Fix:**
```bash
# Get correct DATABASE_URL
railway vars --service pgvector

# Test connection
node test-railway-db.js

# Restart database service
# (Railway Dashboard → pgvector → Settings → Restart)
```

## Real-Time Monitoring Commands

### Check Current Status

```bash
# Overall health
railway status

# Service-specific status
railway status --service viddazzle

# Recent deployments
railway deployments

# Environment variables
railway vars
```

### Debug Specific Issues

```bash
# Last 100 log lines
railway logs --lines 100

# Filter by log level
railway logs --filter error
railway logs --filter warn

# Search logs
railway logs --search "database"
railway logs --search "API"

# Export logs to file
railway logs --lines 1000 > deployment-logs.txt
```

## Health Check Endpoints

### Create Health Check API

Add to your app for automated monitoring:

```javascript
// src/pages/api/health.js
export default async function handler(req, res) {
  const checks = {
    database: false,
    ai: false,
    timestamp: new Date().toISOString()
  };

  try {
    // Test database
    const { query } = require('@/lib/neon');
    await query('SELECT 1');
    checks.database = true;

    // Test AI (optional, may use credits)
    // checks.ai = !!process.env.ANTHROPIC_API_KEY;
    checks.ai = !!process.env.ANTHROPIC_API_KEY;

    res.status(200).json({
      status: 'healthy',
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      checks,
      error: error.message
    });
  }
}
```

### Monitor Health Check

```bash
# Using Railway public URL
curl https://your-app.up.railway.app/api/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": true,
#     "ai": true,
#     "timestamp": "2025-11-03T..."
#   }
# }
```

## Best Practices

### 1. Regular Monitoring Schedule

- **Daily:** Quick visual check of dashboards
- **Weekly:** Review error logs and metrics
- **Monthly:** Performance analysis and optimization

### 2. Log Retention

Railway keeps logs for:
- Free tier: 24 hours
- Pro tier: 7 days
- Team tier: 30 days

Export important logs regularly:
```bash
railway logs --lines 10000 > logs-$(date +%Y%m%d).txt
```

### 3. Alert Configuration

Set up alerts for:
- Deployment failures
- High error rates (>5%)
- Resource exhaustion (>80% CPU/Memory)
- Database connection issues
- API rate limits

### 4. Performance Baselines

Track baseline metrics:
- Average response time
- Typical CPU/memory usage
- Normal request volume
- Database query times

Alert when deviating >50% from baseline.

## Quick Reference

### Essential Commands

```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow

# Check status
railway status

# View environment variables
railway vars

# Restart service
railway up --detach

# Open service URL
railway open
```

### Essential Links

- [Railway Docs](https://docs.railway.app/)
- [Railway Status](https://status.railway.app/)
- [Railway Discord](https://discord.gg/railway)

## Summary

Your Railway deployment is now being monitored! 🎉

**Quick checks:**
1. ✅ Logs streaming in Railway dashboard
2. ✅ Metrics showing normal ranges
3. ✅ No error patterns in logs
4. ✅ Health check endpoints responding

**Next steps:**
1. Set up automated alerts
2. Create health check endpoints
3. Implement error tracking (Sentry)
4. Schedule regular log reviews

---

**Need help?** Check Railway logs first, then consult TEST_DEPLOYMENT.md for troubleshooting.
