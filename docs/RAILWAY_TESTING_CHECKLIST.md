# Railway API Testing Checklist

Comprehensive checklist for testing your VidDazzle Workflow Autopilot deployment on Railway.

**Railway URL**: ____________________________________

**Test Date**: ____________________________________

**Tester**: ____________________________________

---

## Pre-Testing Setup

### Environment Verification
- [ ] Railway deployment shows "Success" status
- [ ] Railway URL is accessible in browser
- [ ] Environment variables confirmed in Railway dashboard:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `ANTHROPIC_API_KEY` (optional)
  - [ ] `OPENAI_API_KEY` (optional)

### Testing Tools Prepared
- [ ] curl installed and working
- [ ] jq installed (for JSON formatting) - `brew install jq` or `sudo apt-get install jq`
- [ ] Postman installed (optional)
- [ ] Railway URL saved to environment: `export RAILWAY_URL=https://your-app.railway.app`

---

## API Endpoint Testing

### Workflows API (`/api/workflows`)

#### Test 1: List All Workflows (GET)
```bash
curl -X GET "$RAILWAY_URL/api/workflows"
```

- [ ] Returns `200 OK` status
- [ ] Returns JSON with `workflows` array
- [ ] No errors in response
- [ ] Response time < 2 seconds

**Notes**: _______________________________________________

#### Test 2: Create Workflow (POST)
```bash
curl -X POST "$RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "description": "Testing Railway deployment",
    "steps": [{
      "id": "step1",
      "name": "Test Step",
      "tool": "http_request",
      "input": {"url": "https://api.github.com/zen", "method": "GET"}
    }],
    "status": "draft"
  }'
```

- [ ] Returns `201 Created` status
- [ ] Response contains `workflow` object with `id`
- [ ] Workflow ID is a valid UUID
- [ ] Workflow persists in database

**Workflow ID**: _______________________________________________

#### Test 3: Get Specific Workflow (GET)
```bash
curl -X GET "$RAILWAY_URL/api/workflows?id=WORKFLOW_ID"
```

- [ ] Returns `200 OK` status
- [ ] Returns correct workflow data
- [ ] All fields populated correctly

#### Test 4: Update Workflow (PUT)
```bash
curl -X PUT "$RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WORKFLOW_ID",
    "status": "active",
    "description": "Updated description"
  }'
```

- [ ] Returns `200 OK` status
- [ ] Response shows updated fields
- [ ] Changes persist in database

#### Test 5: Delete Workflow (DELETE)
```bash
curl -X DELETE "$RAILWAY_URL/api/workflows?id=WORKFLOW_ID"
```

- [ ] Returns `200 OK` status
- [ ] Response shows `{"success": true}`
- [ ] Workflow removed from database
- [ ] Subsequent GET returns 404 or null

---

### Workflow Execution API (`/api/execute-workflow`)

#### Test 6: Execute Workflow (POST)
```bash
curl -X POST "$RAILWAY_URL/api/execute-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "WORKFLOW_ID"
  }'
```

- [ ] Returns `200 OK` status
- [ ] Response contains `executionId`
- [ ] Response contains `success` boolean
- [ ] Execution log is detailed
- [ ] Duration is reasonable

**Execution ID**: _______________________________________________

#### Test 7: Execute Inline Workflow (POST)
```bash
curl -X POST "$RAILWAY_URL/api/execute-workflow" \
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
  }'
```

- [ ] Returns `200 OK` status
- [ ] Workflow executes without saving
- [ ] Execution results are returned
- [ ] No errors in execution

---

### AI Generation API (`/api/generate-workflow`)

#### Test 8: Generate Workflow with AI (POST)
```bash
curl -X POST "$RAILWAY_URL/api/generate-workflow" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a workflow that fetches data from an API",
    "save": true
  }'
```

- [ ] Returns `200 OK` status OR
- [ ] Returns `500` with message about missing API key (acceptable if not configured)
- [ ] If successful: response contains generated workflow
- [ ] If successful: workflow saved to database
- [ ] Usage tokens are reported

**Generated Workflow ID**: _______________________________________________

**Note**: Requires `ANTHROPIC_API_KEY` in Railway environment

---

### Learning System API (`/api/learn-tutorial`)

#### Test 9: Store Tutorial (POST)
```bash
curl -X POST "$RAILWAY_URL/api/learn-tutorial" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Best practices for workflow automation",
    "metadata": {"title": "Best Practices", "difficulty": "beginner"},
    "category": "tutorial",
    "tags": ["automation"]
  }'
```

- [ ] Returns `200 OK` status
- [ ] Response contains tutorial `id`
- [ ] Tutorial persists in database
- [ ] Embedding generated (or fallback used)

**Tutorial ID**: _______________________________________________

#### Test 10: Search Tutorials (GET)
```bash
curl -X GET "$RAILWAY_URL/api/learn-tutorial?query=automation&matchCount=3"
```

- [ ] Returns `200 OK` status
- [ ] Response contains `results` array
- [ ] Results have similarity scores
- [ ] Relevant tutorials returned

---

## Database Verification

### Supabase Dashboard Checks

#### Table: workflows
- [ ] Open Supabase → Table Editor → `workflows`
- [ ] Test workflow(s) visible
- [ ] Fields populated correctly: `id`, `name`, `description`, `steps`, `status`, `created_at`
- [ ] Can manually insert a row
- [ ] Can manually update a row
- [ ] Can manually delete a row

#### Table: workflow_executions
- [ ] Open Supabase → Table Editor → `workflow_executions`
- [ ] Execution records visible
- [ ] Fields populated: `id`, `workflow_id`, `status`, `started_at`, `completed_at`, `result`
- [ ] Execution logs are detailed
- [ ] Duration tracked

#### Table: tutorial_embeddings
- [ ] Open Supabase → Table Editor → `tutorial_embeddings`
- [ ] Tutorial records visible
- [ ] Embedding vectors stored (check `embedding` column)
- [ ] Metadata populated
- [ ] Tags array populated

#### Table: mcp_tool_usage
- [ ] Open Supabase → Table Editor → `mcp_tool_usage`
- [ ] Tool usage logs visible
- [ ] Fields: `tool_name`, `workflow_id`, `execution_id`, `success`, `duration_ms`
- [ ] Logs created during workflow execution

#### Table: connectors
- [ ] Open Supabase → Table Editor → `connectors`
- [ ] Check if connector configurations exist
- [ ] Can add new connector configuration

---

## Automated Testing

### Run Test Script
```bash
./scripts/test-railway-api.sh $RAILWAY_URL
```

- [ ] Script runs without errors
- [ ] All tests pass (green checkmarks)
- [ ] Summary shows 0 failed tests
- [ ] Workflow created and cleaned up
- [ ] Execution completed successfully

**Test Results**:
- Total: _____
- Passed: _____
- Failed: _____

---

## Error Handling Tests

### Test Invalid Requests

#### Test 11: Invalid Method
```bash
curl -X PATCH "$RAILWAY_URL/api/workflows"
```

- [ ] Returns `405 Method Not Allowed`

#### Test 12: Missing Required Field
```bash
curl -X POST "$RAILWAY_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d '{"description": "Missing name field"}'
```

- [ ] Returns `400 Bad Request`
- [ ] Error message indicates missing field

#### Test 13: Invalid Workflow ID
```bash
curl -X GET "$RAILWAY_URL/api/workflows?id=invalid-id"
```

- [ ] Returns appropriate error (404 or 500)
- [ ] Error message is descriptive

#### Test 14: Delete Non-Existent Workflow
```bash
curl -X DELETE "$RAILWAY_URL/api/workflows?id=00000000-0000-0000-0000-000000000000"
```

- [ ] Handles gracefully (doesn't crash app)
- [ ] Returns appropriate status code

---

## Performance Testing

### Response Time Checks
- [ ] Simple GET requests < 500ms
- [ ] Workflow creation < 2 seconds
- [ ] Workflow execution < 30 seconds (depending on complexity)
- [ ] Database queries optimized

### Load Testing (Optional)
```bash
# Run 10 requests concurrently
for i in {1..10}; do
  curl -X GET "$RAILWAY_URL/api/workflows" &
done
wait
```

- [ ] All requests complete successfully
- [ ] No timeout errors
- [ ] Response times remain acceptable
- [ ] No memory leaks or crashes

---

## Security Checks

### Environment Variable Security
- [ ] No API keys in response bodies
- [ ] No database credentials exposed
- [ ] Error messages don't leak sensitive info
- [ ] Environment variables not accessible via API

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Large payloads handled gracefully
- [ ] Special characters handled correctly

---

## Integration Tests

### End-to-End Workflow Test
1. [ ] Create workflow via API
2. [ ] Verify workflow in database
3. [ ] Execute workflow
4. [ ] Check execution logs
5. [ ] Verify execution in database
6. [ ] Delete workflow
7. [ ] Confirm deletion

**Workflow Lifecycle Test**: [ ] PASS [ ] FAIL

### AI-Powered Workflow Test (if API key configured)
1. [ ] Generate workflow with AI
2. [ ] Verify generated workflow structure
3. [ ] Save workflow to database
4. [ ] Execute generated workflow
5. [ ] Check results

**AI Integration Test**: [ ] PASS [ ] FAIL [ ] SKIPPED (no API key)

---

## Postman Collection Testing

### Import and Configure
- [ ] Import `docs/VidDazzle_API.postman_collection.json`
- [ ] Set `base_url` variable to Railway URL
- [ ] Run collection

### Collection Tests
- [ ] All requests complete successfully
- [ ] Variables auto-populate (workflow_id, execution_id)
- [ ] Test scripts pass
- [ ] Response validation succeeds

---

## Documentation Verification

### Test Instructions Accuracy
- [ ] `docs/RAILWAY_API_TESTING.md` instructions work
- [ ] `docs/QUICK_TEST_GUIDE.md` commands work
- [ ] Curl examples are correct
- [ ] Environment variable names match

---

## Final Checklist

### Deployment Quality
- [ ] All critical endpoints working
- [ ] Database operations successful
- [ ] Error handling appropriate
- [ ] Performance acceptable
- [ ] No console errors
- [ ] No memory leaks

### Production Readiness
- [ ] Monitoring configured
- [ ] Logging enabled
- [ ] Alerts set up (optional)
- [ ] Documentation complete
- [ ] Backup strategy defined

---

## Test Summary

**Overall Status**: [ ] PASS [ ] FAIL [ ] PARTIAL

**Critical Issues**: _______________________________________________

**Non-Critical Issues**: _______________________________________________

**Recommendations**: _______________________________________________

**Sign-Off**: _______________________________________________

**Date**: _______________________________________________

---

## Next Steps

After successful testing:

1. [ ] Update README.md with Railway URL
2. [ ] Configure monitoring tools
3. [ ] Set up CI/CD for automatic deployments
4. [ ] Share deployment URL with stakeholders
5. [ ] Schedule regular health checks
6. [ ] Plan for scaling (if needed)

---

**Last Updated**: 2025-11-03
