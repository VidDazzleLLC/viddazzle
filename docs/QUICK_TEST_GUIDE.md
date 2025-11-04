# Quick Test Guide - Railway Deployment

Fast reference for testing your Railway deployment. Replace `YOUR_RAILWAY_URL` with your actual Railway app URL.

## Environment Setup

```bash
export RAILWAY_URL="https://your-app.railway.app"
export API_URL="$RAILWAY_URL/api"
```

## Quick Health Check

```bash
# Test if app is running
curl $RAILWAY_URL
```

## Workflows API - Quick Commands

### List all workflows
```bash
curl -X GET "$API_URL/workflows" | jq .
```

### Create workflow
```bash
curl -X POST "$API_URL/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Quick test",
    "steps": [{
      "id": "step1",
      "name": "Test",
      "tool": "http_request",
      "input": {"url": "https://api.github.com/zen", "method": "GET"}
    }],
    "status": "draft"
  }' | jq .
```

### Get workflow (replace WORKFLOW_ID)
```bash
curl -X GET "$API_URL/workflows?id=WORKFLOW_ID" | jq .
```

### Update workflow (replace WORKFLOW_ID)
```bash
curl -X PUT "$API_URL/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WORKFLOW_ID",
    "status": "active"
  }' | jq .
```

### Delete workflow (replace WORKFLOW_ID)
```bash
curl -X DELETE "$API_URL/workflows?id=WORKFLOW_ID" | jq .
```

## Workflow Execution - Quick Commands

### Execute workflow (replace WORKFLOW_ID)
```bash
curl -X POST "$API_URL/execute-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "WORKFLOW_ID"
  }' | jq .
```

### Execute inline workflow (no save)
```bash
curl -X POST "$API_URL/execute-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "name": "Inline Test",
      "steps": [{
        "id": "step1",
        "tool": "http_request",
        "input": {"url": "https://api.github.com/users/github", "method": "GET"}
      }],
      "variables": {}
    }
  }' | jq .
```

## AI Generation - Quick Commands

### Generate workflow with AI
```bash
curl -X POST "$API_URL/generate-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a workflow that fetches data from an API and saves it to the database",
    "save": true
  }' | jq .
```

**Note**: Requires `ANTHROPIC_API_KEY` environment variable

## Learning System - Quick Commands

### Store tutorial
```bash
curl -X POST "$API_URL/learn-tutorial" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Best practices for workflow automation",
    "metadata": {"title": "Best Practices", "difficulty": "beginner"},
    "category": "tutorial",
    "tags": ["automation", "workflow"]
  }' | jq .
```

### Search tutorials
```bash
curl -X GET "$API_URL/learn-tutorial?query=automation&matchCount=3" | jq .
```

**Note**: Uses `OPENAI_API_KEY` for embeddings or fallback method

## One-Line Full Test

Run all tests at once:

```bash
./scripts/test-railway-api.sh $RAILWAY_URL
```

## Using Postman

1. Import collection: `docs/VidDazzle_API.postman_collection.json`
2. Edit collection variables → Set `base_url` to your Railway URL
3. Run requests in order (workflow ID auto-populates)

## Common Issues

### 500 Internal Server Error
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Test database connection

### 404 Not Found
- Verify Railway deployment completed
- Check URL path is correct
- Ensure API routes exist in build

### Empty/Null Response
- Wait for deployment to complete
- Check Railway build logs
- Verify Supabase is online

## Success Indicators

✅ All GET requests return 200
✅ POST creates resources and returns 201
✅ PUT updates and returns 200
✅ DELETE removes and returns 200
✅ Database operations persist
✅ Executions are logged

## Next Steps

1. **Review Full Documentation**: See `docs/RAILWAY_API_TESTING.md`
2. **Run Comprehensive Tests**: Use `scripts/test-railway-api.sh`
3. **Monitor Deployment**: See `MONITOR_RAILWAY.md`
4. **Set Up CI/CD**: Automate testing on push

---

**Last Updated**: 2025-11-03
