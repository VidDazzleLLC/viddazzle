# Platform Integrations & API Configuration Guide

This guide explains how to configure all the platform integrations for your Workflow Autopilot sales automation system.

## 🔧 Required API Keys

Add these environment variables to your `.env.local` file (local development) and Railway environment variables (production).

### 1. **Aitable.ai (CRM)**
```env
AITABLE_API_KEY=your_aitable_api_key_here
AITABLE_LEADS_DATASHEET_ID=your_datasheet_id_here
```

**How to Get:**
1. Log in to [Aitable.ai](https://aitable.ai)
2. Go to Account Settings → API Tokens
3. Create a new API token
4. Copy the token and add to environment variables
5. Create a "Leads" datasheet and copy its ID from the URL

**API Documentation:** https://developers.aitable.ai/api/introduction

---

### 2. **Muraena.ai (B2B Lead Generation)**
```env
MURAENA_API_KEY=your_muraena_api_key_here
```

**How to Get:**
1. Log in to [Muraena.ai](https://muraena.ai)
2. Upgrade to Business plan ($149/month minimum for API access)
3. Go to Settings → API
4. Generate an API key
5. Copy and add to environment variables

**Requirements:**
- Business plan or higher
- 10,000 credits/month included
- Access to 140M+ B2B profiles

**API Documentation:** https://muraena.readme.io/reference

---

### 3. **Social Media Platform APIs**

#### Twitter/X
```env
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

**How to Get:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Navigate to "Keys and Tokens"
4. Generate Bearer Token (for read-only access)
5. Generate API Key & Secret
6. Generate Access Token & Secret (for posting)

**Required Access Level:** Elevated (for posting/replies)

---

#### Reddit
```env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

**How to Get:**
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Select "script" type
4. Copy Client ID and Secret

---

#### LinkedIn
```env
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
```

**How to Get:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create an app
3. Request API access (requires approval)
4. Get OAuth credentials

**Note:** LinkedIn API requires app verification

---

#### Facebook/Meta
```env
FACEBOOK_ACCESS_TOKEN=your_facebook_page_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id
```

**How to Get:**
1. Go to [Facebook for Developers](https://developers.facebook.com/)
2. Create an app
3. Add Facebook Login product
4. Get Page Access Token from Graph API Explorer

---

### 4. **Anthropic Claude (AI)**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Already Configured** - You should have this from initial setup.

---

### 5. **OpenAI (Optional - for embeddings)**
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**How to Get:**
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Navigate to API Keys
3. Create new secret key

**Used For:** Tutorial embeddings and vector search (optional - has fallback)

---

## 🚀 Quick Start Configuration

### Minimum Setup (Core Features)
```env
# Required for AI
ANTHROPIC_API_KEY=sk-ant-...

# Required for CRM
AITABLE_API_KEY=usk...
AITABLE_LEADS_DATASHEET_ID=dst...

# Required for social listening
TWITTER_BEARER_TOKEN=AAAA...
```

### Full Sales Automation Setup
```env
# AI & Database (Already configured)
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...

# CRM
AITABLE_API_KEY=usk...
AITABLE_LEADS_DATASHEET_ID=dst...

# B2B Lead Generation
MURAENA_API_KEY=...

# Social Monitoring
TWITTER_BEARER_TOKEN=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...

# Optional: For posting/engagement
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

---

## 📊 Setting Up Your Aitable CRM

### 1. Create Leads Datasheet

Create a datasheet in Aitable with these fields:

| Field Name | Field Type | Description |
|-----------|-----------|-------------|
| Lead Name | Single Line Text | Name or username |
| Platform | Single Select | twitter, linkedin, reddit, facebook |
| Post Content | Long Text | Original social media post |
| Lead Score | Number | 0-100 qualification score |
| Pain Points | Long Text | Identified pain points |
| Status | Single Select | New, Contacted, Qualified, Closed |
| Source URL | URL | Link to original post |
| Email | Email | Contact email (if revealed) |
| Company | Single Line Text | Company name |
| Job Title | Single Line Text | Job title |
| Created Date | Created Time | Auto-populated |

### 2. Get Datasheet ID

1. Open the datasheet in Aitable
2. Look at the URL: `https://aitable.ai/workbench/dst1234567890/viw...`
3. Copy the part starting with `dst` (e.g., `dst1234567890`)
4. Add to environment as `AITABLE_LEADS_DATASHEET_ID`

---

## 🧪 Testing Your Setup

### Test Aitable CRM
```bash
# Test via Autopilot sidebar
"Create a test lead in Aitable with name 'Test Lead' and platform 'twitter'"
```

### Test Muraena Lead Search
```bash
# Test via Autopilot sidebar
"Search for CEO leads in the SaaS industry using Muraena"
```

### Test Social Listening
```bash
# Test via Autopilot sidebar
"Monitor Twitter for mentions of 'need voice AI' and 'customer service automation'"
```

### Test AI Sentiment Analysis
```bash
# Test via Autopilot sidebar
"Analyze this post: 'Our customer support is overwhelmed. We need automation ASAP!'"
```

### Test Full Sales Automation
```bash
# Test via Autopilot sidebar
"Run full sales automation monitoring for keywords: voice AI, customer service automation on twitter and reddit. Offer voice_ai solution."
```

---

## 🔐 Security Best Practices

1. **Never commit API keys to Git**
   - Use `.env.local` for development
   - Add `.env.local` to `.gitignore`

2. **Use Railway environment variables for production**
   - Go to Railway dashboard → Your service → Variables
   - Add each environment variable individually

3. **Rotate keys regularly**
   - Change API keys every 90 days
   - Immediately revoke compromised keys

4. **Restrict API permissions**
   - Only grant necessary scopes
   - Use read-only tokens when possible

---

## 🎯 Example Workflows

### Workflow 1: Find and Qualify Leads
```javascript
{
  "name": "Find SaaS CEOs Needing Voice AI",
  "steps": [
    {
      "id": "step1",
      "tool": "muraena_search_people",
      "input": {
        "job_title": "CEO",
        "industry": "SaaS",
        "company_size": "11-50",
        "limit": 20
      }
    },
    {
      "id": "step2",
      "tool": "muraena_reveal_contact",
      "input": {
        "person_id": "{{step1.profiles[0].id}}"
      }
    },
    {
      "id": "step3",
      "tool": "aitable_create_record",
      "input": {
        "datasheet_id": process.env.AITABLE_LEADS_DATASHEET_ID,
        "fields": {
          "Lead Name": "{{step2.name}}",
          "Email": "{{step2.email}}",
          "Company": "{{step2.company}}",
          "Job Title": "{{step2.job_title}}",
          "Status": "New"
        }
      }
    }
  ]
}
```

### Workflow 2: Social Listening & Auto-Engagement
```javascript
{
  "name": "Monitor Social Media & Engage Leads",
  "steps": [
    {
      "id": "monitor",
      "tool": "social_monitor_mentions",
      "input": {
        "keywords": ["need voice AI", "automate customer service"],
        "platforms": ["twitter", "reddit"],
        "limit": 10
      }
    },
    {
      "id": "analyze",
      "tool": "social_analyze_sentiment",
      "input": {
        "text": "{{monitor.mentions[0].text}}"
      }
    },
    {
      "id": "qualify",
      "tool": "social_identify_lead",
      "input": {
        "post_content": "{{monitor.mentions[0].text}}",
        "business_context": "We offer iProsper.io voice AI system"
      }
    },
    {
      "id": "respond",
      "tool": "ai_generate_sales_response",
      "input": {
        "lead_info": "{{qualify}}",
        "offer_type": "voice_ai",
        "tone": "consultative"
      }
    },
    {
      "id": "save_to_crm",
      "tool": "aitable_create_record",
      "input": {
        "datasheet_id": process.env.AITABLE_LEADS_DATASHEET_ID,
        "fields": {
          "Lead Name": "{{monitor.mentions[0].author_id}}",
          "Platform": "{{monitor.mentions[0].platform}}",
          "Post Content": "{{monitor.mentions[0].text}}",
          "Lead Score": "{{qualify.lead_score}}",
          "Status": "New",
          "Source URL": "{{monitor.mentions[0].url}}"
        }
      }
    }
  ]
}
```

### Workflow 3: One-Click Full Automation
```javascript
{
  "name": "Complete Sales Automation",
  "steps": [
    {
      "id": "automation",
      "tool": "workflow_full_sales_automation",
      "input": {
        "keywords": ["voice AI", "customer service automation", "need automation"],
        "platforms": ["twitter", "reddit"],
        "offer_types": ["voice_ai", "neuro_marketing"],
        "auto_engage": true
      }
    }
  ]
}
```

---

## 🐛 Troubleshooting

### "Aitable API error: Unauthorized"
- Check that `AITABLE_API_KEY` is set correctly
- Verify the API key is still valid in Aitable settings
- Ensure the datasheet ID is correct

### "Muraena API error: Insufficient credits"
- Check your credit balance in Muraena dashboard
- Upgrade plan or purchase additional credits
- Each contact reveal costs 1 credit

### "Twitter API error: Forbidden"
- Verify your app has Elevated access
- Check that all Twitter environment variables are set
- Ensure tokens haven't expired

### "Social monitoring returns empty results"
- Keywords may be too specific
- Try broader search terms
- Check platform API rate limits

### "Claude AI errors"
- Verify `ANTHROPIC_API_KEY` is valid
- Check API usage limits
- Ensure sufficient credits

---

## 📚 Additional Resources

- **Aitable API Docs:** https://developers.aitable.ai/
- **Muraena API Docs:** https://muraena.readme.io/reference
- **Twitter API Docs:** https://developer.twitter.com/en/docs
- **Reddit API Docs:** https://www.reddit.com/dev/api
- **Anthropic API Docs:** https://docs.anthropic.com/

---

## 🎉 Next Steps

1. Configure minimum required environment variables
2. Test each integration individually
3. Run example workflows via Autopilot sidebar
4. Set up automated workflows to run on schedules
5. Monitor results in Aitable CRM
6. Refine targeting based on lead quality

Your complete sales automation system is ready to go! 🚀
