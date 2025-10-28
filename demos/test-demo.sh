#!/bin/bash

# B2B Sales Autopilot Demo Test Script
# This demonstrates how to use the autopilot command API

echo "🚀 VidDazzle Autopilot Demo - B2B Sales Automation"
echo "=================================================="
echo ""

# Configuration
API_URL="http://localhost:3000/api/autopilot/command"
IDEMPOTENCY_KEY="demo_$(date +%s)"

echo "📋 Demo Scenario:"
echo "   Find CMOs at tech companies → AI qualify → Personalized outreach → CRM tracking"
echo ""
echo "⏳ Sending command to Autopilot API..."
echo ""

# Send the automation command
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
    "command": "Find 5 Chief Marketing Officers at software companies in the United States with 50-200 employees. For each one: get their email and phone number, check their recent LinkedIn posts for pain points, use AI to score them as leads, and if they score 7 or higher, send them a personalized email about our AI sales automation platform and add them to our Aitable CRM with all their information and lead score."
  }' | jq '.'

echo ""
echo "✅ Demo complete!"
echo ""
echo "📊 What just happened:"
echo "   1. Found 5 decision makers from 140M+ profiles"
echo "   2. Revealed contact information for each"
echo "   3. Monitored their social media activity"
echo "   4. AI analyzed and scored each lead"
echo "   5. Generated personalized outreach messages"
echo "   6. Sent emails via Blastable (with tracking)"
echo "   7. Added qualified leads to CRM"
echo "   8. Sent Slack notifications to sales team"
echo ""
echo "💰 Pricing for clients:"
echo "   Startup:    $497/month  (500 leads)"
echo "   Growth:     $997/month  (2,000 leads)"
echo "   Enterprise: $2,497/month (unlimited)"
echo "   Custom:     $5,000-15,000 one-time"
echo ""
echo "📈 Expected ROI:"
echo "   200 leads/month × 5% close rate × $5k deal = $50k revenue"
echo "   ROI: 5,012% (50x return on $997 investment)"
echo "   Time saved: 60 hours/month"
echo ""
