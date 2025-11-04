#!/bin/bash

# VidDazzle - Auto-Configure Railway Environment Variables
# This script automatically sets all Railway environment variables from .env.local

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 VidDazzle Railway Auto-Configuration${NC}"
echo "============================================="
echo ""

# Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Railway${NC}"
    echo "Please login to Railway..."
    railway login
fi

# Check if project is linked
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not linked to Railway project${NC}"
    echo "Linking to VidDazzle project..."
    railway link 9a9c205d-62a1-4c33-8a73-298d83464e57
fi

echo -e "${GREEN}✅ Connected to Railway${NC}"
echo ""

# Function to set Railway variable
set_var() {
    local KEY=$1
    local VALUE=$2

    if [ -n "$VALUE" ] && [ "$VALUE" != "your_api_key_here" ] && [ "$VALUE" != "dummy" ]; then
        echo -e "${BLUE}Setting${NC} $KEY..."
        if railway variables set "$KEY=$VALUE" 2>/dev/null; then
            echo -e "${GREEN}✅${NC} $KEY set"
        else
            echo -e "${RED}❌${NC} Failed to set $KEY"
        fi
    else
        echo -e "${YELLOW}⚠️${NC}  Skipping $KEY (no valid value)"
    fi
}

# Read from .env.local if it exists
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ Found .env.local${NC}"
    echo "Reading configuration..."
    echo ""

    # Parse .env.local and set variables
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue

        # Remove quotes and whitespace
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)

        # Set in Railway
        case $key in
            DATABASE_URL|ANTHROPIC_API_KEY|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|CLAUDE_MODEL|NEXT_PUBLIC_APP_URL)
                set_var "$key" "$value"
                ;;
        esac
    done < .env.local

    echo ""
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Creating variables manually..."
    echo ""
fi

# Set production-specific variables
echo "Setting production defaults..."
echo ""

set_var "NODE_ENV" "production"
set_var "MCP_TOOLS_ENABLED" "true"
set_var "MCP_MAX_RETRIES" "3"
set_var "MCP_TIMEOUT" "30000"
set_var "MAX_WORKFLOW_STEPS" "50"
set_var "WORKFLOW_TIMEOUT" "300000"
set_var "ENABLE_WORKFLOW_LEARNING" "true"
set_var "EMBEDDING_MODEL" "text-embedding-3-small"
set_var "EMBEDDING_DIMENSION" "1536"

echo ""
echo "============================================="
echo -e "${GREEN}✅ Railway environment variables configured!${NC}"
echo ""
echo "View your variables at:"
echo "https://railway.com/project/9a9c205d-62a1-4c33-8a73-298d83464e57/service/7269fb20-0d9e-46ad-ac69-3fc5309f65e5/variables"
echo ""

# Check if DATABASE_URL is set
if ! railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not set${NC}"
    echo ""
    echo "To set DATABASE_URL:"
    echo "1. Go to: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc"
    echo "2. Click Settings → Database"
    echo "3. Copy the Connection Pooling URI"
    echo "4. Run: railway variables set DATABASE_URL='your_connection_string'"
    echo ""
fi

echo "Next step: Deploy to Railway with 'railway up' or push to GitHub!"
