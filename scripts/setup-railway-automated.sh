#!/bin/bash

# VidDazzle Railway Automated Setup
# This script automates the entire Railway deployment setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
ROCKET="🚀"
WARN="⚠️"
INFO="ℹ️"

echo -e "${BLUE}${ROCKET} VidDazzle Railway Automated Setup${NC}"
echo "=============================================="
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARN} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# Check if Railway CLI is installed
check_railway_cli() {
    print_info "Checking for Railway CLI..."
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
        print_success "Railway CLI installed!"
    else
        print_success "Railway CLI already installed"
    fi
}

# Check if logged into Railway
check_railway_login() {
    print_info "Checking Railway authentication..."
    if railway whoami &> /dev/null; then
        print_success "Already logged into Railway"
        return 0
    else
        print_warning "Not logged into Railway"
        print_info "Opening browser for Railway login..."
        railway login
        if railway whoami &> /dev/null; then
            print_success "Successfully logged into Railway!"
            return 0
        else
            print_error "Railway login failed"
            return 1
        fi
    fi
}

# Link Railway project
link_railway_project() {
    local PROJECT_ID="9a9c205d-62a1-4c33-8a73-298d83464e57"
    print_info "Linking to Railway project..."

    if railway status &> /dev/null; then
        print_success "Already linked to Railway project"
    else
        railway link "$PROJECT_ID"
        print_success "Linked to Railway project!"
    fi
}

# Get or prompt for DATABASE_URL
get_database_url() {
    print_info "Configuring DATABASE_URL..."

    # Check if already set in Railway
    if railway variables get DATABASE_URL &> /dev/null; then
        print_success "DATABASE_URL already configured in Railway"
        return 0
    fi

    echo ""
    print_warning "DATABASE_URL not set in Railway"
    echo -e "${YELLOW}To get your DATABASE_URL:${NC}"
    echo "1. Go to: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc"
    echo "2. Click Settings → Database"
    echo "3. Copy the Connection Pooling URI"
    echo ""

    read -p "Paste your DATABASE_URL here (or press Enter to skip): " DB_URL

    if [ -n "$DB_URL" ]; then
        railway variables set DATABASE_URL="$DB_URL"
        print_success "DATABASE_URL set in Railway!"
    else
        print_warning "Skipped DATABASE_URL configuration (you'll need to add this manually)"
    fi
}

# Configure all Railway environment variables
configure_railway_env() {
    print_info "Configuring Railway environment variables..."

    # Check .env.local for values
    if [ -f ".env.local" ]; then
        print_info "Found .env.local, reading configuration..."

        # Set ANTHROPIC_API_KEY
        if grep -q "ANTHROPIC_API_KEY" .env.local; then
            ANTHROPIC_KEY=$(grep "ANTHROPIC_API_KEY" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            if [ -n "$ANTHROPIC_KEY" ] && [ "$ANTHROPIC_KEY" != "your_api_key_here" ]; then
                railway variables set ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
                print_success "Set ANTHROPIC_API_KEY"
            fi
        fi

        # Set Supabase variables
        if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
            SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            if [ -n "$SUPABASE_URL" ]; then
                railway variables set NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
                print_success "Set NEXT_PUBLIC_SUPABASE_URL"
            fi
        fi

        if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
            ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            if [ -n "$ANON_KEY" ]; then
                railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
                print_success "Set NEXT_PUBLIC_SUPABASE_ANON_KEY"
            fi
        fi

        if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
            SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            if [ -n "$SERVICE_KEY" ]; then
                railway variables set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
                print_success "Set SUPABASE_SERVICE_ROLE_KEY"
            fi
        fi
    else
        print_warning ".env.local not found. You'll need to set variables manually."
    fi

    # Set standard production variables
    railway variables set NODE_ENV="production"
    railway variables set MCP_TOOLS_ENABLED="true"
    railway variables set MAX_WORKFLOW_STEPS="50"
    railway variables set WORKFLOW_TIMEOUT="300000"
    railway variables set ENABLE_WORKFLOW_LEARNING="true"

    print_success "Railway environment variables configured!"
}

# Get Railway token for GitHub Actions
get_railway_token() {
    print_info "Railway Token for GitHub Actions..."
    echo ""
    print_warning "You need to create a Railway API token:"
    echo "1. Go to: https://railway.app/account/tokens"
    echo "2. Click 'Create Token'"
    echo "3. Name it: 'GitHub Actions CI/CD'"
    echo "4. Copy the token"
    echo ""
    read -p "Paste your Railway token here (or press Enter to skip): " RAILWAY_TOKEN

    if [ -n "$RAILWAY_TOKEN" ]; then
        export RAILWAY_TOKEN
        print_success "Railway token stored (you'll need to add this to GitHub Secrets)"
        echo "$RAILWAY_TOKEN" > .railway-token.tmp
    else
        print_warning "Skipped Railway token"
    fi
}

# Configure GitHub Secrets (provides instructions)
configure_github_secrets() {
    print_info "GitHub Secrets Configuration..."
    echo ""
    print_warning "GitHub Secrets must be added manually. Here's what you need:"
    echo ""
    echo "Go to: https://github.com/VidDazzleLLC/viddazzle/settings/secrets/actions"
    echo ""
    echo "Add these secrets:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Get Railway project info
    PROJECT_ID="9a9c205d-62a1-4c33-8a73-298d83464e57"
    SERVICE_NAME="web"

    echo "1. RAILWAY_TOKEN"
    if [ -f ".railway-token.tmp" ]; then
        echo "   Value: $(cat .railway-token.tmp)"
    else
        echo "   Value: [Get from https://railway.app/account/tokens]"
    fi
    echo ""

    echo "2. RAILWAY_PROJECT_ID"
    echo "   Value: $PROJECT_ID"
    echo ""

    echo "3. RAILWAY_SERVICE_NAME"
    echo "   Value: $SERVICE_NAME"
    echo ""

    echo "4. DATABASE_URL"
    echo "   Value: [Your Supabase connection string]"
    echo ""

    echo "5. NEXT_PUBLIC_SUPABASE_URL"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null; then
        SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        echo "   Value: $SUPABASE_URL"
    else
        echo "   Value: [From your .env.local]"
    fi
    echo ""

    echo "6. SUPABASE_SERVICE_ROLE_KEY"
    echo "   Value: [From your .env.local]"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Save to file for reference
    cat > .github-secrets-reference.txt <<EOF
GitHub Secrets for VidDazzle Railway Deployment
================================================

Add these at: https://github.com/VidDazzleLLC/viddazzle/settings/secrets/actions

1. RAILWAY_TOKEN = $([ -f ".railway-token.tmp" ] && cat .railway-token.tmp || echo "[Get from https://railway.app/account/tokens]")
2. RAILWAY_PROJECT_ID = $PROJECT_ID
3. RAILWAY_SERVICE_NAME = $SERVICE_NAME
4. DATABASE_URL = [Your Supabase connection string]
5. NEXT_PUBLIC_SUPABASE_URL = $(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "[From .env.local]")
6. SUPABASE_SERVICE_ROLE_KEY = [From .env.local - keep secret!]

After adding all secrets, commit and push to trigger auto-deployment!
EOF

    print_success "GitHub secrets reference saved to .github-secrets-reference.txt"

    read -p "Press Enter when you've added all GitHub Secrets (or Enter to continue)..."
}

# Test Railway deployment
test_railway_deployment() {
    print_info "Testing Railway deployment..."

    echo ""
    read -p "Deploy to Railway now? (y/n): " DEPLOY_NOW

    if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
        print_info "Deploying to Railway..."
        railway up
        print_success "Deployment initiated!"

        print_info "Getting deployment URL..."
        sleep 5
        DOMAIN=$(railway domain 2>/dev/null || echo "")
        if [ -n "$DOMAIN" ]; then
            print_success "Deployment URL: https://$DOMAIN"

            # Test health endpoint
            print_info "Testing health endpoint..."
            sleep 10
            if curl -s "https://$DOMAIN/api/health" | grep -q "healthy"; then
                print_success "Health check passed! 🎉"
            else
                print_warning "Health check pending... (may take a few minutes)"
            fi
        fi
    else
        print_info "Skipped deployment (you can deploy later with 'railway up')"
    fi
}

# Main setup flow
main() {
    echo "This script will automate your Railway deployment setup."
    echo ""

    # Step 1: Install and configure Railway CLI
    check_railway_cli
    check_railway_login
    link_railway_project

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 2: Configure DATABASE_URL
    get_database_url

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 3: Configure other Railway environment variables
    configure_railway_env

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 4: Get Railway token
    get_railway_token

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 5: Configure GitHub Secrets
    configure_github_secrets

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Step 6: Test deployment
    test_railway_deployment

    # Cleanup
    if [ -f ".railway-token.tmp" ]; then
        rm .railway-token.tmp
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    print_success "Setup complete! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. ${CHECK} Railway environment variables configured"
    echo "2. ${CHECK} Add GitHub Secrets (if not done yet)"
    echo "3. ${ROCKET} Push code to trigger auto-deployment:"
    echo ""
    echo "   git add ."
    echo "   git commit -m \"Configure Railway auto-deployment\""
    echo "   git push origin main"
    echo ""
    echo "Your app will automatically deploy on every push to main! ${ROCKET}"
    echo ""
}

# Run main function
main
