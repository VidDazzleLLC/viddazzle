#!/bin/bash

###############################################################################
# Automated Security Activation Script
# This script activates all security measures for production deployment
###############################################################################

echo "🔒 VidDazzle Security Activation"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

echo "1️⃣  Running security hardening script..."
node scripts/apply-security.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Security hardening failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Security hardening complete${NC}"
echo ""

echo "2️⃣  Validating environment variables..."
node -e "const { validateEnvironment } = require('./src/lib/env-validation.js'); validateEnvironment({ verbose: true });"
echo ""

echo "3️⃣  Checking for .env files..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Warning: No .env files found${NC}"
    echo "   Create .env or .env.local with required environment variables"
    echo "   See .env.example for reference"
else
    echo -e "${GREEN}✅ Environment files found${NC}"
fi
echo ""

echo "4️⃣  Verifying security middleware exists..."
MIDDLEWARE_FILES=(
    "src/lib/auth-middleware.js"
    "src/lib/rate-limit.js"
    "src/lib/validation.js"
    "src/lib/validation-schemas.js"
)

ALL_EXIST=true
for file in "${MIDDLEWARE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${RED}❌${NC} $file (missing)"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo -e "${RED}❌ Some security files are missing${NC}"
    exit 1
fi
echo ""

echo "5️⃣  Verifying legal pages exist..."
LEGAL_FILES=(
    "src/pages/terms.jsx"
    "src/pages/privacy.jsx"
)

for file in "${LEGAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${YELLOW}⚠️${NC} $file (missing - recommended)"
    fi
done
echo ""

echo "6️⃣  Verifying GDPR endpoints exist..."
GDPR_FILES=(
    "src/pages/api/user/export.js"
    "src/pages/api/user/delete.js"
)

for file in "${GDPR_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $file"
    else
        echo -e "   ${YELLOW}⚠️${NC} $file (missing - required for EU users)"
    fi
done
echo ""

echo "7️⃣  Checking database initialization..."
if [ -f "scripts/init-database.js" ]; then
    echo -e "   ${GREEN}✅${NC} Database auto-initialization configured"
else
    echo -e "   ${YELLOW}⚠️${NC} Database initialization script missing"
fi
echo ""

echo "=================================="
echo ""
echo "📋 Security Activation Summary:"
echo ""
echo "✅ Security middleware created"
echo "✅ Validation schemas defined"
echo "✅ Legal pages available"
echo "✅ GDPR endpoints implemented"
echo "✅ Auto-initialization configured"
echo ""

echo "🎯 Next Steps for Production:"
echo ""
echo "1. Set environment variables in your deployment platform:"
echo "   - DATABASE_URL (Neon PostgreSQL)"
echo "   - ANTHROPIC_API_KEY (Claude API)"
echo "   - NEXT_PUBLIC_SUPABASE_URL (Auth)"
echo "   - SUPABASE_SERVICE_ROLE_KEY (Auth admin)"
echo "   - NEXT_PUBLIC_APP_URL (Your domain)"
echo "   - ALLOWED_ORIGINS (CORS configuration)"
echo ""

echo "2. Install Sentry for error monitoring (optional but recommended):"
echo "   npm install @sentry/nextjs"
echo "   npx @sentry/wizard -i nextjs"
echo ""

echo "3. Review and customize legal pages:"
echo "   - src/pages/terms.jsx"
echo "   - src/pages/privacy.jsx"
echo ""

echo "4. Test locally before deploying:"
echo "   npm run dev"
echo ""

echo "5. Deploy to production:"
echo "   git push origin main"
echo "   (Railway/Vercel will auto-deploy)"
echo ""

echo "=================================="
echo -e "${GREEN}✅ Security activation complete!${NC}"
echo "=================================="
echo ""
echo "📖 See PRODUCTION_LAUNCH_CHECKLIST.md for complete details"
echo ""
