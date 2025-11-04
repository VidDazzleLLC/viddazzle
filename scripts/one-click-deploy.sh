#!/bin/bash

# VidDazzle One-Click Railway Deployment
# Master automation script that sets up everything

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear

cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ██╗   ██╗██╗██████╗ ██████╗  █████╗ ███████╗███████╗   ║
║   ██║   ██║██║██╔══██╗██╔══██╗██╔══██╗╚══███╔╝╚══███╔╝   ║
║   ██║   ██║██║██║  ██║██║  ██║███████║  ███╔╝   ███╔╝    ║
║   ╚██╗ ██╔╝██║██║  ██║██║  ██║██╔══██║ ███╔╝   ███╔╝     ║
║    ╚████╔╝ ██║██████╔╝██████╔╝██║  ██║███████╗███████╗   ║
║     ╚═══╝  ╚═╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝   ║
║                                                           ║
║         One-Click Railway Deployment Automation           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BOLD}This script will automatically:${NC}"
echo "  1. ✅ Install and configure Railway CLI"
echo "  2. ✅ Set up all environment variables"
echo "  3. ✅ Configure GitHub Secrets"
echo "  4. ✅ Deploy to Railway"
echo "  5. ✅ Test your deployment"
echo ""
echo -e "${YELLOW}Time estimate: 10-15 minutes${NC}"
echo ""

read -p "Ready to begin? (y/n): " START
if [ "$START" != "y" ] && [ "$START" != "Y" ]; then
    echo "Exiting..."
    exit 0
fi

echo ""
echo "=============================================="
echo ""

# Step 1: Install Railway CLI
echo -e "${BLUE}Step 1/5: Installing Railway CLI...${NC}"
echo ""

if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI installed${NC}"
else
    echo -e "${GREEN}✅ Railway CLI already installed${NC}"
fi

# Login to Railway
if ! railway whoami &> /dev/null; then
    echo "Opening browser for Railway login..."
    railway login
    echo -e "${GREEN}✅ Logged into Railway${NC}"
else
    echo -e "${GREEN}✅ Already logged into Railway${NC}"
fi

# Link project
if ! railway status &> /dev/null; then
    echo "Linking to VidDazzle project..."
    railway link 9a9c205d-62a1-4c33-8a73-298d83464e57
    echo -e "${GREEN}✅ Project linked${NC}"
else
    echo -e "${GREEN}✅ Project already linked${NC}"
fi

echo ""
echo "=============================================="
echo ""

# Step 2: Configure Railway Environment Variables
echo -e "${BLUE}Step 2/5: Configuring Railway environment variables...${NC}"
echo ""

bash scripts/auto-configure-railway.sh

echo ""
echo -e "${GREEN}✅ Railway environment configured${NC}"
echo ""
echo "=============================================="
echo ""

# Step 3: Configure GitHub Secrets
echo -e "${BLUE}Step 3/5: Configuring GitHub Secrets...${NC}"
echo ""

bash scripts/auto-configure-github-secrets.sh

echo ""
echo -e "${GREEN}✅ GitHub Secrets configured${NC}"
echo ""
echo "=============================================="
echo ""

# Step 4: Deploy to Railway
echo -e "${BLUE}Step 4/5: Deploying to Railway...${NC}"
echo ""

read -p "Deploy to Railway now? (y/n): " DEPLOY
if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo "🚀 Starting deployment..."
    echo ""

    railway up

    echo ""
    echo -e "${GREEN}✅ Deployment started!${NC}"
    echo ""

    # Get deployment URL
    echo "Getting deployment URL..."
    sleep 5

    DOMAIN=$(railway domain 2>/dev/null || echo "")
    if [ -n "$DOMAIN" ]; then
        export DEPLOYMENT_URL="https://$DOMAIN"
        echo -e "${GREEN}Deployment URL: $DEPLOYMENT_URL${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Deployment skipped${NC}"
fi

echo ""
echo "=============================================="
echo ""

# Step 5: Test Deployment
echo -e "${BLUE}Step 5/5: Testing deployment...${NC}"
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    read -p "Run deployment tests? (y/n): " TEST
    if [ "$TEST" = "y" ] || [ "$TEST" = "Y" ]; then
        echo ""
        bash scripts/test-deployment.sh
    fi
fi

echo ""
echo "=============================================="
echo ""
echo -e "${GREEN}${BOLD}🎉 Setup Complete!${NC}"
echo ""
echo "Your VidDazzle app is configured for automatic deployment!"
echo ""
echo -e "${BOLD}What happens now:${NC}"
echo "  1. Every push to 'main' triggers automatic deployment"
echo "  2. Pull requests get preview deployments"
echo "  3. Database migrations run automatically"
echo "  4. No manual intervention needed!"
echo ""

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${BOLD}Your live app:${NC}"
    echo "  🌐 $DEPLOYMENT_URL"
    echo ""
fi

echo -e "${BOLD}Useful commands:${NC}"
echo "  railway logs          - View deployment logs"
echo "  railway status        - Check deployment status"
echo "  railway up            - Deploy manually"
echo "  npm run verify:railway - Verify configuration"
echo ""

echo -e "${BOLD}Next steps:${NC}"
echo "  1. Test your deployment: $DEPLOYMENT_URL/api/health"
echo "  2. Make a code change and push to test auto-deployment"
echo "  3. Monitor GitHub Actions: https://github.com/VidDazzleLLC/viddazzle/actions"
echo ""

echo "=============================================="
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
echo ""
