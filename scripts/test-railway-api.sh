#!/bin/bash

# Railway API Testing Script
# Tests all API endpoints for VidDazzle Workflow Autopilot
# Usage: ./scripts/test-railway-api.sh [RAILWAY_URL]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RAILWAY_URL="${1:-https://your-app.railway.app}"
API_URL="$RAILWAY_URL/api"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Test $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED_TESTS++))
}

test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"

    ((TOTAL_TESTS++))
    print_test "$TOTAL_TESTS" "$test_name"

    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected_status" ]; then
        print_success "Status: $http_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        echo "$body"
        return 0
    else
        print_error "Expected $expected_status, got $http_code"
        echo "$body"
        return 1
    fi
}

# Start testing
print_header "VidDazzle Workflow Autopilot - API Test Suite"
echo "Base URL: $API_URL"
echo "Timestamp: $(date)"
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: jq is not installed. JSON output will not be formatted.${NC}"
    echo "Install jq: sudo apt-get install jq (Ubuntu/Debian) or brew install jq (macOS)"
    echo ""
fi

# ============================================================
# Test 1: List all workflows
# ============================================================
print_header "Workflow Management Tests"

WORKFLOW_ID=""

if response=$(test_endpoint \
    "List all workflows" \
    "GET" \
    "$API_URL/workflows" \
    "" \
    "200"); then
    echo "$response"
else
    echo -e "${RED}Failed to list workflows${NC}"
fi

echo ""

# ============================================================
# Test 2: Create a new workflow
# ============================================================

CREATE_DATA='{
  "name": "Railway Test Workflow - '"$(date +%s)"'",
  "description": "Automated test workflow for Railway deployment verification",
  "steps": [
    {
      "id": "step1",
      "name": "HTTP Request Test",
      "tool": "http_request",
      "input": {
        "url": "https://api.github.com/zen",
        "method": "GET"
      },
      "on_error": "stop",
      "timeout": 5000
    },
    {
      "id": "step2",
      "name": "Wait Delay",
      "tool": "wait_delay",
      "input": {
        "duration": 100
      }
    }
  ],
  "status": "draft",
  "metadata": {
    "test": true,
    "created_by": "test-script"
  }
}'

if response=$(test_endpoint \
    "Create new workflow" \
    "POST" \
    "$API_URL/workflows" \
    "$CREATE_DATA" \
    "201"); then

    WORKFLOW_ID=$(echo "$response" | jq -r '.workflow.id' 2>/dev/null)
    if [ "$WORKFLOW_ID" != "null" ] && [ -n "$WORKFLOW_ID" ]; then
        echo -e "${GREEN}Created workflow ID: $WORKFLOW_ID${NC}"
    else
        echo -e "${YELLOW}⚠ Could not extract workflow ID${NC}"
    fi
fi

echo ""

# ============================================================
# Test 3: Get specific workflow
# ============================================================

if [ -n "$WORKFLOW_ID" ] && [ "$WORKFLOW_ID" != "null" ]; then
    test_endpoint \
        "Get workflow by ID" \
        "GET" \
        "$API_URL/workflows?id=$WORKFLOW_ID" \
        "" \
        "200"
    echo ""
fi

# ============================================================
# Test 4: Update workflow
# ============================================================

if [ -n "$WORKFLOW_ID" ] && [ "$WORKFLOW_ID" != "null" ]; then
    UPDATE_DATA='{
      "id": "'"$WORKFLOW_ID"'",
      "status": "active",
      "description": "Updated via test script at '"$(date)"'"
    }'

    test_endpoint \
        "Update workflow" \
        "PUT" \
        "$API_URL/workflows" \
        "$UPDATE_DATA" \
        "200"
    echo ""
fi

# ============================================================
# Test 5: Execute workflow (if workflow was created)
# ============================================================

if [ -n "$WORKFLOW_ID" ] && [ "$WORKFLOW_ID" != "null" ]; then
    print_header "Workflow Execution Tests"

    EXECUTE_DATA='{
      "workflowId": "'"$WORKFLOW_ID"'"
    }'

    if response=$(test_endpoint \
        "Execute workflow" \
        "POST" \
        "$API_URL/execute-workflow" \
        "$EXECUTE_DATA" \
        "200"); then

        EXECUTION_ID=$(echo "$response" | jq -r '.executionId' 2>/dev/null)
        echo -e "${GREEN}Execution ID: $EXECUTION_ID${NC}"
    fi
    echo ""
fi

# ============================================================
# Test 6: Generate workflow with AI (may fail if no API key)
# ============================================================

print_header "AI-Powered Workflow Generation Tests"

GENERATE_DATA='{
  "prompt": "Create a simple workflow that fetches the current time from worldtimeapi.org and logs it",
  "save": true,
  "context": {
    "test": true
  }
}'

if response=$(test_endpoint \
    "Generate workflow with AI" \
    "POST" \
    "$API_URL/generate-workflow" \
    "$GENERATE_DATA" \
    "200"); then

    GENERATED_ID=$(echo "$response" | jq -r '.saved.id' 2>/dev/null)
    if [ "$GENERATED_ID" != "null" ] && [ -n "$GENERATED_ID" ]; then
        echo -e "${GREEN}Generated workflow ID: $GENERATED_ID${NC}"
    fi
else
    echo -e "${YELLOW}⚠ AI generation may require ANTHROPIC_API_KEY${NC}"
fi

echo ""

# ============================================================
# Test 7: Store tutorial (learning system)
# ============================================================

print_header "Learning System Tests"

TUTORIAL_DATA='{
  "content": "How to create automated workflows: Start with a clear goal, break it into steps, choose appropriate tools, add error handling, and test thoroughly.",
  "metadata": {
    "title": "Workflow Creation Best Practices",
    "difficulty": "beginner",
    "author": "test-script"
  },
  "category": "best-practices",
  "tags": ["workflow", "automation", "tutorial"]
}'

if response=$(test_endpoint \
    "Store tutorial" \
    "POST" \
    "$API_URL/learn-tutorial" \
    "$TUTORIAL_DATA" \
    "200"); then

    TUTORIAL_ID=$(echo "$response" | jq -r '.id' 2>/dev/null)
    echo -e "${GREEN}Tutorial ID: $TUTORIAL_ID${NC}"
else
    echo -e "${YELLOW}⚠ Tutorial storage may require OPENAI_API_KEY or uses fallback${NC}"
fi

echo ""

# ============================================================
# Test 8: Search tutorials
# ============================================================

if response=$(test_endpoint \
    "Search tutorials" \
    "GET" \
    "$API_URL/learn-tutorial?query=workflow%20automation&matchCount=3" \
    "" \
    "200"); then

    COUNT=$(echo "$response" | jq -r '.count' 2>/dev/null)
    echo -e "${GREEN}Found $COUNT tutorials${NC}"
fi

echo ""

# ============================================================
# Test 9: Cleanup - Delete test workflow
# ============================================================

if [ -n "$WORKFLOW_ID" ] && [ "$WORKFLOW_ID" != "null" ]; then
    print_header "Cleanup Tests"

    test_endpoint \
        "Delete test workflow" \
        "DELETE" \
        "$API_URL/workflows?id=$WORKFLOW_ID" \
        "" \
        "200"
    echo ""
fi

# ============================================================
# Test Summary
# ============================================================

print_header "Test Summary"

echo -e "Total Tests:  ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed. Check the output above for details.${NC}\n"
    exit 1
fi
