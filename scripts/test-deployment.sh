#!/bin/bash

# VidDazzle - Deployment Testing Script
# Tests Railway deployment and all endpoints

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOYMENT_URL=${DEPLOYMENT_URL:-"https://viddazzle-production-3965.up.railway.app"}

echo -e "${BLUE}🧪 VidDazzle Deployment Test Suite${NC}"
echo "=============================================="
echo ""

# Counter for passed/failed tests
PASSED=0
FAILED=0

# Function to run a test
run_test() {
    local TEST_NAME=$1
    local TEST_COMMAND=$2

    echo -n "Testing: $TEST_NAME... "

    if eval "$TEST_COMMAND" &> /dev/null; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to test endpoint
test_endpoint() {
    local ENDPOINT=$1
    local EXPECTED=$2
    local NAME=$3

    echo -n "Testing: $NAME... "

    RESPONSE=$(curl -s "$DEPLOYMENT_URL$ENDPOINT" || echo "ERROR")

    if echo "$RESPONSE" | grep -q "$EXPECTED"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected: $EXPECTED"
        echo "  Got: ${RESPONSE:0:100}"
        ((FAILED++))
        return 1
    fi
}

echo "Deployment URL: $DEPLOYMENT_URL"
echo ""

# 1. Test Railway Connection
echo -e "${BLUE}1. Railway Connection Tests${NC}"
echo ""

if command -v railway &> /dev/null; then
    run_test "Railway CLI installed" "command -v railway"
    run_test "Railway authentication" "railway whoami"
    run_test "Railway project linked" "railway status"
else
    echo -e "${YELLOW}⚠️  Railway CLI not installed (skipping CLI tests)${NC}"
fi

echo ""

# 2. Test Environment Variables
echo -e "${BLUE}2. Environment Variables Tests${NC}"
echo ""

if command -v railway &> /dev/null && railway status &> /dev/null; then
    run_test "DATABASE_URL configured" "railway variables get DATABASE_URL"
    run_test "ANTHROPIC_API_KEY configured" "railway variables get ANTHROPIC_API_KEY"
    run_test "NEXT_PUBLIC_SUPABASE_URL configured" "railway variables get NEXT_PUBLIC_SUPABASE_URL"
else
    echo -e "${YELLOW}⚠️  Cannot verify Railway variables (not linked)${NC}"
fi

echo ""

# 3. Test GitHub Secrets
echo -e "${BLUE}3. GitHub Secrets Tests${NC}"
echo ""

if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    run_test "RAILWAY_TOKEN secret" "gh secret list -R VidDazzleLLC/viddazzle | grep -q RAILWAY_TOKEN"
    run_test "RAILWAY_PROJECT_ID secret" "gh secret list -R VidDazzleLLC/viddazzle | grep -q RAILWAY_PROJECT_ID"
    run_test "DATABASE_URL secret" "gh secret list -R VidDazzleLLC/viddazzle | grep -q DATABASE_URL"
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available (cannot verify secrets)${NC}"
    echo "   Manually check: https://github.com/VidDazzleLLC/viddazzle/settings/secrets/actions"
fi

echo ""

# 4. Test Deployment Endpoints
echo -e "${BLUE}4. Deployment Endpoint Tests${NC}"
echo ""

test_endpoint "/api/health" "healthy" "Health check endpoint"
test_endpoint "/api/health" "database" "Database connection in health check"

# Test if deployment is accessible
run_test "Deployment URL accessible" "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL | grep -q 200"

echo ""

# 5. Test Database Connection
echo -e "${BLUE}5. Database Connection Tests${NC}"
echo ""

if command -v railway &> /dev/null && railway status &> /dev/null; then
    run_test "Database connection from Railway" "railway run node -e 'const { Pool } = require(\"pg\"); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT NOW()\").then(() => process.exit(0)).catch(() => process.exit(1));'"
fi

echo ""

# 6. Test GitHub Actions
echo -e "${BLUE}6. GitHub Actions Tests${NC}"
echo ""

if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    # Check last workflow run
    LAST_RUN=$(gh run list -R VidDazzleLLC/viddazzle -L 1 --json conclusion -q '.[0].conclusion' 2>/dev/null || echo "unknown")

    if [ "$LAST_RUN" = "success" ]; then
        echo -e "${GREEN}✅ PASSED${NC} Last GitHub Actions run"
        ((PASSED++))
    elif [ "$LAST_RUN" = "unknown" ]; then
        echo -e "${YELLOW}⚠️  SKIPPED${NC} Cannot check GitHub Actions"
    else
        echo -e "${RED}❌ FAILED${NC} Last GitHub Actions run: $LAST_RUN"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available${NC}"
fi

echo ""

# 7. Test Build Artifacts
echo -e "${BLUE}7. Build Tests${NC}"
echo ""

run_test "Next.js build directory exists" "[ -d .next ]"
run_test "Package dependencies installed" "[ -d node_modules ]"

echo ""

# Summary
echo "=============================================="
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo ""
echo -e "  ${GREEN}✅ Passed: $PASSED${NC}"
echo -e "  ${RED}❌ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Your deployment is working correctly.${NC}"
    echo ""
    echo "Your app is live at: $DEPLOYMENT_URL"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Check Railway environment variables"
    echo "2. Verify GitHub Secrets are set"
    echo "3. Check Railway deployment logs: railway logs"
    echo "4. Review GitHub Actions: https://github.com/VidDazzleLLC/viddazzle/actions"
    echo ""
    exit 1
fi
