# 🚀 Social Listening API - Ready to Use NOW

## Step 1: Get Your Railway URL

1. Go to: https://railway.com/project/7fac9f16-a149-4ebf-b45a-44e10d1c33bb
2. Copy your deployment URL (looks like: `your-app-name.railway.app`)
3. Replace `YOUR_RAILWAY_URL` in commands below

---

## Step 2: Use the APIs

### API #1: Analyze Any Social Post

**Copy and paste this command:**

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "text": "PASTE_SOCIAL_POST_HERE",
    "platform": "linkedin"
  }'
```

**Example:**
```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Really frustrated with our CRM. Looking for better alternatives.",
    "platform": "linkedin"
  }'
```

**You get:**
- Sentiment (positive/negative/neutral)
- Lead score (0-100)
- Buying signals
- Pain points
- Recommended action

---

### API #2: Generate AI Sales Response

**Copy and paste this command:**

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/generate-sales-response \
  -H "Content-Type: application/json" \
  -d '{
    "original_post": "PASTE_SOCIAL_POST_HERE",
    "your_company": "YOUR_COMPANY_NAME",
    "your_solution": "WHAT_YOU_OFFER",
    "platform": "linkedin"
  }'
```

**Example:**
```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/generate-sales-response \
  -H "Content-Type: application/json" \
  -d '{
    "original_post": "Looking for CRM recommendations. Budget is $500/month.",
    "your_company": "YourCompany",
    "your_solution": "Automated CRM workflows",
    "platform": "linkedin"
  }'
```

**You get:**
- Ready-to-post response
- Alternative response option
- Follow-up suggestions
- Best practices (dos and don'ts)

---

### API #3: Complete Workflow (Analysis + Response + CRM)

**Copy and paste this command:**

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/process-mention \
  -H "Content-Type: application/json" \
  -d '{
    "text": "PASTE_SOCIAL_POST_HERE",
    "platform": "linkedin",
    "author": {
      "name": "AUTHOR_NAME",
      "title": "THEIR_TITLE",
      "company": "THEIR_COMPANY"
    },
    "your_company": "YOUR_COMPANY_NAME",
    "your_solution": "WHAT_YOU_OFFER",
    "albato_webhook_url": "YOUR_ALBATO_WEBHOOK"
  }'
```

**This does everything:**
1. Analyzes sentiment
2. Scores the lead
3. Generates AI response
4. Sends to Aitable CRM (if webhook provided)

---

## Step 3: Connect to Aitable CRM (Optional)

### In Albato:

1. **Create New Automation**
2. **Trigger:** Webhook
3. **Action:** Aitable → Create Record
4. **Map these fields:**

```
Name → {{webhook.name}}
Company → {{webhook.company}}
Job Title → {{webhook.job_title}}
Lead Source → {{webhook.lead_source}}
Lead Status → {{webhook.lead_status}}
Lead Score → {{webhook.lead_score}}
Sentiment → {{webhook.sentiment}}
Pain Points → {{webhook.pain_points}}
Buying Signals → {{webhook.buying_signals}}
Original Post → {{webhook.original_post}}
AI Response → {{webhook.ai_response}}
Social Profile → {{webhook.social_profile_url}}
```

5. **Copy the webhook URL** Albato generates
6. **Use it in API #3** (the `albato_webhook_url` field)

---

## 📱 Quick Test (Right Now)

**Test with this hot lead example:**

```bash
curl -X POST https://YOUR_RAILWAY_URL/api/social-listening/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Looking for marketing automation. Need email, landing pages, analytics. Budget $500/mo. Any recommendations?",
    "platform": "linkedin"
  }'
```

**Expected result:**
- Lead Score: 90+ (HOT 🔥)
- Buying signals: budget mentioned, specific requirements
- Action: Engage immediately

---

## 💡 Real-World Usage

### Option A: Manual (Good for Starting)
1. Find social mentions manually (Twitter, LinkedIn, Reddit)
2. Copy post text
3. Run through API
4. Post the AI-generated response

### Option B: Zapier/Make (Semi-Automated)
1. Set up social listening trigger
2. Send to Autopilot API
3. Get results automatically

### Option C: Social Listening Tools (Fully Automated)
1. Use Mention.com, Brand24, or Hootsuite
2. Configure webhook to Autopilot API
3. 100% automated lead generation

---

## 🔑 Your API Endpoints

Once you have your Railway URL, these are live:

```
POST https://YOUR_RAILWAY_URL/api/social-listening/analyze-sentiment
POST https://YOUR_RAILWAY_URL/api/social-listening/generate-sales-response
POST https://YOUR_RAILWAY_URL/api/social-listening/process-mention
```

---

## ✅ That's It!

**Three APIs. All working. Use them now.**

Replace `YOUR_RAILWAY_URL` with your actual Railway URL and start analyzing social posts!

---

## 🆘 Need Help?

**Test if it's working:**
```bash
curl https://YOUR_RAILWAY_URL/api/social-listening/analyze-sentiment
```

Should return: `{"error":"Method not allowed. Use POST."}`

That means it's live and ready!
