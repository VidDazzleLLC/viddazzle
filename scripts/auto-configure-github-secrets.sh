#!/bin/bash

# VidDazzle - Auto-Configure GitHub Secrets
# This script helps configure GitHub Secrets for Railway auto-deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO="VidDazzleLLC/viddazzle"

echo -e "${BLUE}🔐 VidDazzle GitHub Secrets Configuration${NC}"
echo "=============================================="
echo ""

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found${NC}"
    echo ""
    echo "Option 1: Install GitHub CLI for automatic secret configuration"
    echo "  brew install gh  (macOS)"
    echo "  or visit: https://cli.github.com/"
    echo ""
    echo "Option 2: Continue with manual instructions"
    echo ""
    read -p "Continue with manual setup? (y/n): " MANUAL
    if [ "$MANUAL" != "y" ]; then
        exit 0
    fi
    USE_GH=false
else
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
        USE_GH=true
    else
        echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI${NC}"
        echo "Authenticating..."
        gh auth login
        USE_GH=true
    fi
fi

echo ""

# Required secrets
declare -A SECRETS
SECRETS[RAILWAY_TOKEN]="Get from https://railway.app/account/tokens"
SECRETS[RAILWAY_PROJECT_ID]="9a9c205d-62a1-4c33-8a73-298d83464e57"
SECRETS[RAILWAY_SERVICE_NAME]="web"
SECRETS[DATABASE_URL]="From Supabase Dashboard"
SECRETS[NEXT_PUBLIC_SUPABASE_URL]="From .env.local"
SECRETS[SUPABASE_SERVICE_ROLE_KEY]="From .env.local"

# Function to set secret
set_secret() {
    local KEY=$1
    local VALUE=$2

    if [ "$USE_GH" = true ]; then
        echo -e "${BLUE}Setting${NC} $KEY in GitHub..."
        if echo "$VALUE" | gh secret set "$KEY" -R "$REPO" 2>/dev/null; then
            echo -e "${GREEN}✅${NC} $KEY set"
            return 0
        else
            echo -e "${RED}❌${NC} Failed to set $KEY"
            return 1
        fi
    else
        return 1
    fi
}

# Function to check if secret exists
check_secret() {
    local KEY=$1

    if [ "$USE_GH" = true ]; then
        if gh secret list -R "$REPO" 2>/dev/null | grep -q "^$KEY"; then
            echo -e "${GREEN}✅${NC} $KEY"
            return 0
        else
            echo -e "${RED}❌${NC} $KEY (missing)"
            return 1
        fi
    fi
}

# Check existing secrets
if [ "$USE_GH" = true ]; then
    echo "Checking existing GitHub Secrets..."
    echo ""

    for secret in "${!SECRETS[@]}"; do
        check_secret "$secret" || true
    done

    echo ""
    echo "=============================================="
    echo ""
fi

# Auto-configure what we can
echo "Configuring GitHub Secrets..."
echo ""

# 1. RAILWAY_PROJECT_ID (we know this)
if [ "$USE_GH" = true ]; then
    set_secret "RAILWAY_PROJECT_ID" "9a9c205d-62a1-4c33-8a73-298d83464e57"
    set_secret "RAILWAY_SERVICE_NAME" "web"
fi

# 2. Railway Token (need to get from user)
echo ""
echo -e "${YELLOW}Railway Token Required${NC}"
echo "1. Go to: https://railway.app/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name: 'GitHub Actions CI/CD'"
echo "4. Copy the token"
echo ""
read -s -p "Paste your Railway token (hidden): " RAILWAY_TOKEN
echo ""

if [ -n "$RAILWAY_TOKEN" ]; then
    if [ "$USE_GH" = true ]; then
        set_secret "RAILWAY_TOKEN" "$RAILWAY_TOKEN"
    else
        echo "RAILWAY_TOKEN=$RAILWAY_TOKEN" >> .github-secrets.env
    fi
fi

# 3. DATABASE_URL
echo ""
echo -e "${YELLOW}Database URL Required${NC}"
echo "Get from: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc"
echo "Settings → Database → Connection Pooling URI"
echo ""
read -s -p "Paste your DATABASE_URL (hidden): " DATABASE_URL
echo ""

if [ -n "$DATABASE_URL" ]; then
    if [ "$USE_GH" = true ]; then
        set_secret "DATABASE_URL" "$DATABASE_URL"
    else
        echo "DATABASE_URL=$DATABASE_URL" >> .github-secrets.env
    fi
fi

# 4. Read from .env.local
if [ -f ".env.local" ]; then
    echo ""
    echo -e "${GREEN}✅ Found .env.local${NC}"
    echo "Reading Supabase configuration..."
    echo ""

    # Extract Supabase URL
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    if [ -n "$SUPABASE_URL" ]; then
        if [ "$USE_GH" = true ]; then
            set_secret "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
        else
            echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> .github-secrets.env
        fi
    fi

    # Extract Service Role Key
    SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    if [ -n "$SERVICE_KEY" ]; then
        if [ "$USE_GH" = true ]; then
            set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE_KEY"
        else
            echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY" >> .github-secrets.env
        fi
    fi
fi

echo ""
echo "=============================================="

if [ "$USE_GH" = true ]; then
    echo -e "${GREEN}✅ GitHub Secrets configured!${NC}"
    echo ""
    echo "Verify at:"
    echo "https://github.com/$REPO/settings/secrets/actions"
else
    echo -e "${YELLOW}Manual Setup Required${NC}"
    echo ""
    echo "Add these secrets at:"
    echo "https://github.com/$REPO/settings/secrets/actions"
    echo ""

    if [ -f ".github-secrets.env" ]; then
        echo "Your secrets have been saved to: .github-secrets.env"
        echo -e "${RED}⚠️  DO NOT COMMIT THIS FILE!${NC}"
        echo ""
        cat .github-secrets.env
        echo ""
        echo "After adding secrets, delete .github-secrets.env"
    fi
fi

echo ""
echo "Next step: Push to main branch to trigger auto-deployment!"
echo ""
echo "  git add ."
echo "  git commit -m \"Configure Railway auto-deployment\""
echo "  git push origin main"
echo ""
