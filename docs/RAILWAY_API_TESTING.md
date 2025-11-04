# Railway API Testing Guide

Complete guide for testing your VidDazzle Workflow Autopilot API endpoints after Railway deployment.

## Prerequisites

- Railway deployment URL (e.g., `https://your-app.railway.app`)
- Supabase credentials configured in Railway environment variables
- API testing tool (curl, Postman, or browser)

## Environment Setup

Before testing, ensure your Railway environment has these variables set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key (optional for AI features)
OPENAI_API_KEY=your_openai_key (optional for embeddings)
```

## API Endpoints Overview

### 1. Workflows API (`/api/workflows`)

**Purpose**: Manage workflow CRUD operations

**Methods**:
- `GET` - List all workflows or get a specific workflow
- `POST` - Create a new workflow
- `PUT` - Update an existing workflow
- `DELETE` - Delete a workflow

### 2. Generate Workflow API (`/api/generate-workflow`)

**Purpose**: AI-powered workflow generation using Claude

**Methods**:
- `POST` - Generate a workflow from natural language prompt

### 3. Execute Workflow API (`/api/execute-workflow`)

**Purpose**: Execute a workflow and track its execution

**Methods**:
- `POST` - Execute a workflow by ID or inline definition

### 4. Learn Tutorial API (`/api/learn-tutorial`)

**Purpose**: Store and search tutorial embeddings for AI-powered learning

**Methods**:
- `POST` - Store a new tutorial with embeddings
- `GET` - Search for tutorials by query

---

## Quick Test Commands

Replace `YOUR_RAILWAY_URL` with your actual Railway deployment URL.

### Test 1: List All Workflows

```bash
curl -X GET "https://YOUR_RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json"
```

**Expected Response**: `200 OK` with JSON array of workflows

### Test 2: Get Specific Workflow

```bash
curl -X GET "https://YOUR_RAILWAY_URL/api/workflows?id=WORKFLOW_ID" \
  -H "Content-Type: application/json"
```

### Test 3: Create New Workflow

```bash
curl -X POST "https://YOUR_RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "A test workflow for Railway deployment",
    "steps": [
      {
        "id": "step1",
        "name": "HTTP Request",
        "tool": "http_request",
        "input": {
          "url": "https://api.example.com/data",
          "method": "GET"
        },
        "on_error": "stop"
      }
    ],
    "status": "draft"
  }'
```

**Expected Response**: `201 Created` with workflow object including `id`

### Test 4: Update Workflow

```bash
curl -X PUT "https://YOUR_RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WORKFLOW_ID",
    "status": "active",
    "description": "Updated description"
  }'
```

**Expected Response**: `200 OK` with updated workflow

### Test 5: Delete Workflow

```bash
curl -X DELETE "https://YOUR_RAILWAY_URL/api/workflows?id=WORKFLOW_ID" \
  -H "Content-Type: application/json"
```

**Expected Response**: `200 OK` with `{"success": true}`

### Test 6: Generate Workflow with AI

```bash
curl -X POST "https://YOUR_RAILWAY_URL/api/generate-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a workflow that fetches data from an API and saves it to the database",
    "save": true
  }'
```

**Expected Response**: `200 OK` with generated workflow and saved workflow ID

**Note**: Requires `ANTHROPIC_API_KEY` environment variable

### Test 7: Execute Workflow

```bash
curl -X POST "https://YOUR_RAILWAY_URL/api/execute-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "WORKFLOW_ID"
  }'
```

**Expected Response**: `200 OK` with execution results and logs

### Test 8: Store Tutorial

```bash
curl -X POST "https://YOUR_RAILWAY_URL/api/learn-tutorial" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "How to create automated email workflows using the platform",
    "metadata": {
      "title": "Email Automation Tutorial",
      "difficulty": "beginner"
    },
    "category": "automation",
    "tags": ["email", "tutorial"]
  }'
```

**Expected Response**: `200 OK` with tutorial ID

**Note**: Requires `OPENAI_API_KEY` for embedding generation (or uses fallback)

### Test 9: Search Tutorials

```bash
curl -X GET "https://YOUR_RAILWAY_URL/api/learn-tutorial?query=email%20automation&matchCount=3" \
  -H "Content-Type: application/json"
```

**Expected Response**: `200 OK` with array of matching tutorials

---

## Database Tables Testing

These tables are managed by the API but can be queried directly via Supabase:

### 1. `workflows`
- Test CRUD operations via `/api/workflows`
- Verify fields: id, name, description, steps, status, created_at, updated_at

### 2. `workflow_executions`
- Created automatically when executing workflows via `/api/execute-workflow`
- Verify fields: id, workflow_id, status, started_at, completed_at, result, error

### 3. `tutorial_embeddings`
- Created via `/api/learn-tutorial` POST
- Verify vector search via `/api/learn-tutorial` GET

### 4. `mcp_tool_usage`
- Logged automatically during workflow execution
- Query directly from Supabase to verify tool usage tracking

### 5. `connectors`
- Helper functions available in `/lib/supabase.js`
- Use `getConnectors()` and `upsertConnector()` for testing

---

## Comprehensive Test Script

Save as `test-railway-api.sh` and make executable:

```bash
#!/bin/bash

# Configuration
RAILWAY_URL="https://your-app.railway.app"
API_URL="$RAILWAY_URL/api"

echo "Testing Railway Deployment API Endpoints"
echo "=========================================="
echo "Base URL: $API_URL"
echo ""

# Test 1: List workflows
echo "Test 1: GET /api/workflows"
curl -s -X GET "$API_URL/workflows" | jq .
echo ""

# Test 2: Create workflow
echo "Test 2: POST /api/workflows"
WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Railway Test Workflow",
    "description": "Testing Railway deployment",
    "steps": [{"id": "step1", "name": "Test Step", "tool": "http_request", "input": {}}],
    "status": "draft"
  }')

echo "$WORKFLOW_RESPONSE" | jq .
WORKFLOW_ID=$(echo "$WORKFLOW_RESPONSE" | jq -r '.workflow.id')
echo "Created workflow ID: $WORKFLOW_ID"
echo ""

# Test 3: Get specific workflow
echo "Test 3: GET /api/workflows?id=$WORKFLOW_ID"
curl -s -X GET "$API_URL/workflows?id=$WORKFLOW_ID" | jq .
echo ""

# Test 4: Update workflow
echo "Test 4: PUT /api/workflows"
curl -s -X PUT "$API_URL/workflows" \
  -H "Content-Type: application/json" \
  -d "{\"id\": \"$WORKFLOW_ID\", \"status\": \"active\"}" | jq .
echo ""

# Test 5: Delete workflow
echo "Test 5: DELETE /api/workflows?id=$WORKFLOW_ID"
curl -s -X DELETE "$API_URL/workflows?id=$WORKFLOW_ID" | jq .
echo ""

echo "=========================================="
echo "All tests completed!"
```

---

## Testing Checklist

Use this checklist to verify your Railway deployment:

### Deployment Status
- [ ] Railway deployment completed successfully
- [ ] Build logs show no errors
- [ ] Application is accessible at Railway URL
- [ ] Environment variables are set correctly

### API Endpoints
- [ ] `GET /api/workflows` returns 200 OK
- [ ] `POST /api/workflows` creates new workflow
- [ ] `GET /api/workflows?id=X` retrieves specific workflow
- [ ] `PUT /api/workflows` updates workflow
- [ ] `DELETE /api/workflows?id=X` deletes workflow
- [ ] `POST /api/generate-workflow` generates AI workflow (if API key set)
- [ ] `POST /api/execute-workflow` executes workflow
- [ ] `POST /api/learn-tutorial` stores tutorial
- [ ] `GET /api/learn-tutorial` searches tutorials

### Database Operations
- [ ] Workflows are persisted to Supabase
- [ ] Workflow executions are logged
- [ ] Tutorial embeddings are stored
- [ ] MCP tool usage is tracked
- [ ] Connector configurations are accessible

### Error Handling
- [ ] Invalid requests return 400 Bad Request
- [ ] Missing resources return 404 Not Found
- [ ] Database errors return 500 Internal Server Error
- [ ] Error messages are descriptive

### Performance
- [ ] API responses within 2 seconds (simple queries)
- [ ] No memory leaks during continuous operation
- [ ] Database queries are optimized
- [ ] Proper connection pooling

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Possible Causes**:
- Missing Supabase credentials
- Database connection failure
- Missing required environment variables

**Solution**:
1. Check Railway logs: `railway logs`
2. Verify environment variables in Railway dashboard
3. Test Supabase connection with `test-supabase.js`

### Issue: Empty Response or Timeout

**Possible Causes**:
- Application not fully started
- Railway deployment in progress
- Database not responding

**Solution**:
1. Wait for deployment to complete
2. Check Railway deployment status
3. Verify database is online in Supabase

### Issue: 404 Not Found

**Possible Causes**:
- Incorrect URL path
- API route not deployed
- Next.js build issue

**Solution**:
1. Verify URL path matches API routes
2. Check Railway build logs
3. Ensure all API files are in `src/pages/api/`

### Issue: CORS Errors (Browser)

**Possible Causes**:
- Missing CORS headers
- Browser blocking cross-origin requests

**Solution**:
1. Use curl or Postman instead of browser
2. Add CORS middleware in Next.js
3. Test from same domain

---

## Next Steps

After successful testing:

1. **Monitor Performance**: Use Railway metrics dashboard
2. **Set Up Alerts**: Configure notifications for errors
3. **Enable Logging**: Review application logs regularly
4. **Scale Resources**: Adjust Railway plan if needed
5. **Implement Authentication**: Add API key or OAuth
6. **Rate Limiting**: Protect endpoints from abuse
7. **CI/CD**: Set up automated deployments

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Supabase Docs**: https://supabase.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **Project Issues**: See `MONITOR_RAILWAY.md` for debugging

---

**Last Updated**: 2025-11-03
