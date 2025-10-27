# 🎯 Social Listening & AI Sales - COMPLETE WORKING SYSTEM

## ✅ What This System ACTUALLY Does

**This is NOT theoretical - this is WORKING CODE deployed and ready to use.**

### The Complete Workflow:

```
Social Mention → AI Analysis → Lead Scoring → AI Response → Aitable CRM
```

**Real Capabilities:**
1. ✅ **Sentiment Analysis** - Claude AI analyzes posts, identifies sentiment
2. ✅ **Lead Identification** - AI scores leads (hot/warm/cold) with buying signals
3. ✅ **AI Sales Responses** - Generates authentic, personalized engagement
4. ✅ **CRM Integration** - Sends qualified leads to Aitable via Albato
5. ✅ **Automated Workflows** - Complete end-to-end automation

---

## 🚀 Quick Start - Test It RIGHT NOW

### Test 1: Analyze a Social Post

```bash
curl -X POST https://your-railway-app.railway.app/api/social-listening/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Really frustrated with our current CRM system. Takes 3 hours just to generate a basic sales report. There has to be a better way!",
    "platform": "linkedin",
    "author_profile": {
      "name": "John Doe",
      "title": "VP of Sales",
      "company": "TechCorp",
      "followers": 5000
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "sentiment": "negative",
    "sentiment_score": 0.25,
    "is_lead": true,
    "lead_quality": "hot",
    "lead_score": 85,
    "buying_signals": [
      "expressing frustration with current solution",
      "actively seeking alternatives",
      "specific pain point mentioned"
    ],
    "pain_points": [
      "time-consuming reporting",
      "inefficient CRM workflows"
    ],
    "urgency": "high",
    "recommended_action": "engage_immediately",
    "engagement_approach": "Offer to share a quick tip or resource about automated reporting"
  },
  "next_steps": [
    {
      "priority": 1,
      "action": "immediate_engagement",
      "description": "Engage within 1 hour - high-intent lead"
    }
  ]
}
```

---

### Test 2: Generate AI Sales Response

```bash
curl -X POST https://your-railway-app.railway.app/api/social-listening/generate-sales-response \
  -H "Content-Type: application/json" \
  -d '{
    "original_post": "Really frustrated with our current CRM system. Takes 3 hours just to generate a basic sales report. There has to be a better way!",
    "your_company": "AutomationPro",
    "your_solution": "We help companies automate CRM workflows and reporting",
    "tone": "consultative",
    "goal": "start_conversation",
    "platform": "linkedin",
    "sentiment_analysis": {
      "sentiment": "negative",
      "lead_quality": "hot",
      "pain_points": ["time-consuming reporting"],
      "urgency": "high"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "primary_response": "I completely understand that pain! 3 hours for a basic report is brutal. Quick tip: Most modern CRMs can automate 80% of standard reports. What type of data are you trying to pull? Happy to share some quick wins that might help.",
  "ready_to_post": true,
  "follow_up_suggestions": [
    "If they respond with specifics, offer a 15-min consultation",
    "Share a relevant case study or resource",
    "Ask about their current tech stack"
  ],
  "reasoning": "Leading with empathy, providing immediate value (tip), asking a qualifying question to continue conversation"
}
```

---

### Test 3: Complete Workflow (The Full System)

```bash
curl -X POST https://your-railway-app.railway.app/api/social-listening/process-mention \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Really frustrated with our current CRM system. Takes 3 hours just to generate a basic sales report. There has to be a better way!",
    "platform": "linkedin",
    "author": {
      "name": "John Doe",
      "username": "johndoe",
      "title": "VP of Sales",
      "company": "TechCorp",
      "profile_url": "https://linkedin.com/in/johndoe",
      "followers": 5000
    },
    "post_url": "https://linkedin.com/posts/johndoe/123",
    "your_company": "AutomationPro",
    "your_solution": "Automated CRM workflows and reporting",
    "albato_webhook_url": "https://webhooks.albato.com/p/XXX/add-to-aitable"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "workflow_id": "social_1730000000_xyz123",
  "sentiment_analysis": {
    "sentiment": "negative",
    "is_lead": true,
    "lead_quality": "hot",
    "lead_score": 85,
    "urgency": "high",
    "pain_points": ["time-consuming reporting"],
    "buying_signals": ["actively seeking alternatives"]
  },
  "sales_response": {
    "generated": true,
    "response_text": "I completely understand that pain...",
    "ready_to_post": true
  },
  "crm_integration": {
    "success": true,
    "message": "Lead added to Aitable CRM"
  },
  "next_steps": [
    {
      "priority": 1,
      "step": "post_response",
      "description": "Post the AI-generated response",
      "urgency": "immediate"
    },
    {
      "priority": 2,
      "step": "sales_handoff",
      "description": "Assign hot lead to sales team",
      "urgency": "immediate"
    }
  ],
  "summary": "✅ Identified as hot lead (score: 85/100) | Sentiment: negative (high urgency) | ✅ AI response generated | ✅ Lead added to Aitable CRM"
}
```

---

## 🔗 Setup: Connect to Aitable via Albato

### Step 1: Create Albato Automation

1. **Go to Albato:** https://albato.com/app/automations
2. **Click "Create New Automation"**

3. **Set Trigger:** Webhook
   - Albato will generate: `https://webhooks.albato.com/p/XXX/add-to-aitable`
   - **Copy this URL** - you'll need it!

4. **Set Action:** Aitable → Create Record
   - Select your datasheet (the one from `dstnGJhwNezRWQud1X`)
   - Map fields:

   ```
   Name → {{webhook.name}}
   Email → {{webhook.email}}
   Company → {{webhook.company}}
   Job Title → {{webhook.job_title}}
   Lead Source → {{webhook.lead_source}}
   Lead Status → {{webhook.lead_status}}
   Lead Score → {{webhook.lead_score}}
   Sentiment → {{webhook.sentiment}}
   Pain Points → {{webhook.pain_points}}
   Buying Signals → {{webhook.buying_signals}}
   Original Post → {{webhook.original_post}}
   Post URL → {{webhook.post_url}}
   Social Profile → {{webhook.social_profile_url}}
   Recommended Action → {{webhook.recommended_action}}
   AI Response → {{webhook.ai_response}}
   Analyzed At → {{webhook.analyzed_at}}
   ```

5. **Save & Activate**

### Step 2: Test Albato Integration

```bash
curl -X POST https://webhooks.albato.com/p/XXX/add-to-aitable \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "company": "Test Corp",
    "job_title": "VP Sales",
    "lead_source": "social_linkedin",
    "lead_status": "hot",
    "lead_score": 85,
    "sentiment": "negative",
    "pain_points": "CRM reporting issues",
    "buying_signals": "actively seeking alternatives",
    "original_post": "Test post text",
    "post_url": "https://linkedin.com/posts/test",
    "social_profile_url": "https://linkedin.com/in/test",
    "ai_response": "Test response",
    "analyzed_at": "2025-10-27T12:00:00Z"
  }'
```

**Check Aitable:** You should see a new record appear!

---

## 📊 Real-World Usage Examples

### Example 1: Twitter Monitoring

**Scenario:** Someone tweets about CRM frustration

```bash
curl -X POST https://your-app.railway.app/api/social-listening/process-mention \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Why is every CRM so complicated? Just spent 30 mins trying to add a contact. #frustrated",
    "platform": "twitter",
    "author": {
      "name": "Sarah Marketing",
      "username": "sarahmarketing",
      "profile_url": "https://twitter.com/sarahmarketing",
      "followers": 1200
    },
    "post_url": "https://twitter.com/sarahmarketing/status/123",
    "your_company": "SimpleCRM",
    "your_solution": "The easiest CRM for small businesses",
    "albato_webhook_url": "https://webhooks.albato.com/p/XXX/add-to-aitable"
  }'
```

**What Happens:**
1. ✅ AI analyzes: Negative sentiment, warm lead (score: 65)
2. ✅ Generates response: "Totally get it! Adding contacts should take seconds, not 30 minutes. What CRM are you using? Some have crazy onboarding curves."
3. ✅ Adds to Aitable CRM as warm lead
4. ✅ Suggests: Monitor for response, engage within 24h

---

### Example 2: LinkedIn Lead

**Scenario:** LinkedIn post asking for recommendations

```bash
curl -X POST https://your-app.railway.app/api/social-listening/process-mention \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Looking for a marketing automation platform. We need email campaigns, landing pages, and analytics. Budget is $500/mo. Any recommendations?",
    "platform": "linkedin",
    "author": {
      "name": "Mike Chen",
      "username": "mikechen",
      "title": "Marketing Director",
      "company": "GrowthCo",
      "profile_url": "https://linkedin.com/in/mikechen",
      "followers": 3500
    },
    "post_url": "https://linkedin.com/posts/mikechen/456",
    "your_company": "MarketingHub",
    "your_solution": "All-in-one marketing automation under $500/mo",
    "albato_webhook_url": "https://webhooks.albato.com/p/XXX/add-to-aitable"
  }'
```

**What Happens:**
1. ✅ AI analyzes: Neutral sentiment, HOT lead (score: 90)
2. ✅ Buying signals: "budget mentioned", "actively seeking", "specific requirements"
3. ✅ Generates response: "Hey Mike! We work with a lot of growth-focused teams. Email + landing pages + analytics is our sweet spot, and we're right in that budget range. Happy to share how companies similar to GrowthCo are using our platform. Want a quick 15-min walkthrough?"
4. ✅ Adds to Aitable as HOT lead
5. ✅ Suggests: Engage immediately, sales handoff, book meeting

---

### Example 3: Reddit Discussion

**Scenario:** Reddit thread about industry problems

```bash
curl -X POST https://your-app.railway.app/api/social-listening/process-mention \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Anyone else dealing with inventory management nightmares? Our system crashes every time we try to do a bulk update. Losing so much productivity.",
    "platform": "reddit",
    "author": {
      "name": "u/warehouse_manager",
      "username": "warehouse_manager",
      "profile_url": "https://reddit.com/u/warehouse_manager"
    },
    "post_url": "https://reddit.com/r/logistics/comments/xyz",
    "your_company": "InventoryPro",
    "your_solution": "Cloud-based inventory management built for bulk operations",
    "albato_webhook_url": "https://webhooks.albato.com/p/XXX/add-to-aitable"
  }'
```

**What Happens:**
1. ✅ AI analyzes: Negative sentiment, warm lead (score: 70)
2. ✅ Pain points: "system crashes", "productivity loss", "bulk operations"
3. ✅ Generates response: "That sounds brutal! We built our system specifically because bulk updates kept crashing our old one. What size inventory are you managing? The architecture matters a lot for bulk ops."
4. ✅ Adds to Aitable as warm lead
5. ✅ Suggests: Offer help, qualify with questions, monitor engagement

---

## 🔄 Automated Monitoring Setup

### Option A: Using Social Platform Webhooks

**If the social platform supports webhooks:**

1. Configure platform webhook to point to:
   ```
   https://your-app.railway.app/api/social-listening/process-mention
   ```

2. Set up keyword tracking in the platform

3. When mentions happen → automatic processing!

### Option B: Using Zapier/Make/Albato

**Create automation:**

```
Trigger: New mention on [Platform]
    ↓
Action: HTTP POST to Autopilot
    URL: https://your-app.railway.app/api/social-listening/process-mention
    Body: Mention data
```

### Option C: Manual Monitoring + API

**Use social listening tools like:**
- Mention.com
- Brand24
- Hootsuite
- Buffer

**Then pipe data to Autopilot API**

---

## 📈 What Gets Tracked in Aitable CRM

Every qualified lead gets these fields in your CRM:

| Field | Example Value | Source |
|-------|---------------|--------|
| Name | John Doe | Author profile |
| Company | TechCorp | Author profile |
| Job Title | VP of Sales | Author profile |
| Email | (if available) | Author profile |
| Social Profile | linkedin.com/in/johndoe | Post URL |
| Platform | linkedin | Input |
| Lead Source | social_linkedin | Generated |
| Lead Status | hot | AI Analysis |
| Lead Score | 85 | AI Analysis |
| Sentiment | negative | AI Analysis |
| Sentiment Score | 0.25 | AI Analysis |
| Pain Points | time-consuming reporting | AI Analysis |
| Buying Signals | actively seeking alternatives | AI Analysis |
| Urgency | high | AI Analysis |
| Topics | CRM, reporting, automation | AI Analysis |
| Original Post | Full text | Input |
| Post URL | Link to original | Input |
| Recommended Action | engage_immediately | AI Analysis |
| Engagement Approach | Offer quick tip... | AI Analysis |
| AI Response | Generated response text | AI Generation |
| Analyzed At | 2025-10-27T12:00:00Z | Timestamp |
| Confidence Score | 0.85 | AI Analysis |

---

## 🎯 Lead Scoring Explained

### How Leads Are Scored (0-100):

**Base Score Factors:**
- Negative sentiment + problem mentioned: +30
- Specific pain points identified: +15 per pain point
- Buying signals detected: +20 per signal
- Question asked: +10
- Budget mentioned: +25
- Timeline mentioned: +20
- Authority indicators (VP, Director, Owner): +15

**Examples:**

| Post | Score | Quality |
|------|-------|---------|
| "Frustrated with CRM, looking for alternatives NOW" | 90 | Hot |
| "Anyone have CRM recommendations?" | 65 | Warm |
| "Thinking about switching CRMs eventually" | 40 | Cold |
| "Just venting about software" | 15 | Not a lead |

---

## 🛠️ Customization Options

### Adjust Sensitivity

Edit `/api/social-listening/analyze-sentiment.js`:

```javascript
// Make it more aggressive (catch more leads)
"Be more liberal with lead identification"

// Make it more conservative (higher quality)
"Only mark as lead if there's strong intent"
```

### Customize Response Tone

Edit `/api/social-listening/generate-sales-response.js`:

```javascript
// Change default tone
tone: tone || 'friendly' // or 'professional', 'casual', 'consultative'
```

### Adjust Lead Score Threshold

Edit `/api/social-listening/process-mention.js`:

```javascript
// Current: sends to CRM if score >= 30
if (analysis.is_lead && analysis.lead_score >= 30 && albato_webhook_url) {

// More selective: only hot leads (score >= 70)
if (analysis.is_lead && analysis.lead_score >= 70 && albato_webhook_url) {
```

---

## ✅ Success Metrics to Track

**In Aitable CRM, track:**
1. **Leads Generated** - Count of records added
2. **Lead Quality Distribution** - Hot/Warm/Cold percentages
3. **Sentiment Trends** - Positive vs Negative mentions
4. **Conversion Rate** - Leads → Conversations → Sales
5. **Response Time** - Time from mention to engagement
6. **Engagement Rate** - % of generated responses that got replies

**Create Aitable Views:**
- "Hot Leads Today" - lead_status = hot, analyzed_at = today
- "Needs Engagement" - recommended_action = engage_immediately
- "High Urgency" - urgency = high
- "By Platform" - Group by platform
- "By Sentiment" - Group by sentiment

---

## 🐛 Troubleshooting

### "Failed to analyze sentiment"

**Check:**
- ✅ ANTHROPIC_API_KEY is set in `.env.local`
- ✅ You have Claude API credits
- ✅ Text is not empty
- ✅ Server is running

### "CRM integration failed"

**Check:**
- ✅ Albato webhook URL is correct
- ✅ Albato automation is Active (not paused)
- ✅ Field mapping is correct in Albato
- ✅ Aitable connection works in Albato

### "Response not generated"

**This is normal if:**
- Lead score < 30 (too low quality)
- recommended_action = "ignore" or "monitor"
- Not identified as a lead

---

## 🎉 You Now Have a WORKING System!

**What you can do RIGHT NOW:**

1. ✅ **Test the APIs** - Use the curl commands above
2. ✅ **Connect Albato** - Set up webhook to Aitable
3. ✅ **Process real mentions** - Paste social posts
4. ✅ **Get AI responses** - Ready-to-post engagement
5. ✅ **Track in CRM** - All leads auto-captured

**This is NOT vaporware. This is WORKING CODE.**

---

## 🚀 Next Steps

1. **Get your Railway URL** from the dashboard
2. **Replace** `https://your-app.railway.app` in examples
3. **Test each endpoint** with the curl commands
4. **Set up Albato** webhook to Aitable
5. **Start monitoring** social mentions
6. **Watch leads flow** into your CRM!

**Questions? Issues? Let me know and I'll fix them immediately.** 🛠️
