# 🔍 Setup Muraena.ai in Albato - Step-by-Step Guide

## Overview

**Muraena.ai** is a B2B leads database with 200M+ profiles. This guide shows you how to add it to Albato using the App Integrator.

### What You'll Be Able to Do:
✅ Search for B2B leads by filters (company, title, location, etc.)
✅ Reveal contact details (email, phone, LinkedIn)
✅ Enrich existing contacts with full profile data
✅ Integrate with Aitable CRM, Blastable, and other platforms

---

## 📋 Prerequisites

Before starting, make sure you have:

1. **Muraena.ai Business Plan** ($149/mo minimum)
   - Includes 10,000 credits/month
   - API access is only available on Business plan

2. **Muraena API Key**
   - Log into: https://app.muraena.ai
   - Go to **Settings** → **API** or **Developer**
   - Copy your API key (looks like: `mur_xxxxxxxxxxxxx`)

3. **Albato Account**
   - Already logged in
   - Ready to use App Integrator

---

## 🚀 Part 1: Create Custom App in Albato

### Step 1: Open App Integrator

1. Go to: https://albato.com/app/builder/constructor
2. Click **"Create New App"**

### Step 2: Basic App Information

**Fill in the details:**

```
App Name: Muraena B2B Leads
Description: B2B lead database with 200M+ profiles. Search and reveal contact details.
Category: CRM / Lead Generation
Icon: (optional - upload Muraena logo if you have it)
```

Click **"Next"** or **"Continue"**

### Step 3: Configure Authorization

**Select Authorization Type:**
- Choose: **"Bearer Token"** or **"API Key"**

**Authorization Configuration:**

```
Field Name: API Key
Field Type: Password (hidden)
Label: Muraena API Key
Placeholder: Enter your Muraena API key
Required: Yes
```

**Authorization Header:**
```
Header Name: Authorization
Header Value: Bearer {{api_key}}
```

**Or if they use X-API-Key format:**
```
Header Name: X-API-Key
Header Value: {{api_key}}
```

**Test Connection URL:**
```
URL: https://api.muraena.ai/v1/account
Method: GET
```

**Expected Response:** JSON with account info (credits, plan, etc.)

Click **"Save"** and **"Test Connection"**

---

## 🔧 Part 2: Add Triggers (Optional)

**Triggers** are events that start automations. Muraena likely doesn't have webhook triggers, so you can skip this or add scheduled triggers.

### Example Scheduled Trigger:

```
Trigger Name: Get New Leads Daily
Type: Scheduled
Description: Check for new leads matching criteria
Schedule: Daily at 9 AM
```

*If you don't need triggers, skip to Actions.*

---

## ⚡ Part 3: Add Actions

Actions are what Albato can DO with Muraena. Add these key actions:

### Action 1: Search People

**Action Configuration:**

```
Action Name: Search People
Description: Search for B2B leads by filters
Category: Search
```

**Request Configuration:**

```
Method: POST
URL: https://api.muraena.ai/v1/people/search
Content-Type: application/json
```

**Request Body (JSON):**

```json
{
  "filters": {
    "job_title": "{{job_title}}",
    "company_name": "{{company_name}}",
    "location": "{{location}}",
    "industry": "{{industry}}",
    "company_size": "{{company_size}}"
  },
  "limit": {{limit}},
  "offset": {{offset}}
}
```

**Input Fields:**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| job_title | Text | No | Job title to search (e.g., "CEO", "Marketing Director") |
| company_name | Text | No | Company name or keywords |
| location | Text | No | Location (e.g., "United States", "San Francisco") |
| industry | Text | No | Industry (e.g., "Technology", "Healthcare") |
| company_size | Text | No | Company size (e.g., "1-10", "51-200", "1000+") |
| limit | Number | No | Max results (default: 25, max: 100) |
| offset | Number | No | Pagination offset (default: 0) |

**Response Mapping:**

Map the response fields to make them available in Albato:

```
{{response.data.people}} → Array of people
{{response.data.people[0].id}} → Person ID
{{response.data.people[0].name}} → Full name
{{response.data.people[0].job_title}} → Job title
{{response.data.people[0].company}} → Company name
{{response.data.people[0].linkedin_url}} → LinkedIn URL
{{response.total}} → Total results count
```

**Save this action.**

---

### Action 2: Reveal Contact Details

**Action Configuration:**

```
Action Name: Reveal Contact Details
Description: Get email, phone, and full profile for a person (costs 1 credit)
Category: Enrichment
```

**Request Configuration:**

```
Method: POST
URL: https://api.muraena.ai/v1/people/reveal
Content-Type: application/json
```

**Request Body (JSON):**

```json
{
  "person_id": "{{person_id}}",
  "linkedin_url": "{{linkedin_url}}"
}
```

*Note: Provide either person_id OR linkedin_url, not both*

**Input Fields:**

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| person_id | Text | Conditional | Person ID from search results |
| linkedin_url | Text | Conditional | LinkedIn profile URL |

**Response Mapping:**

```
{{response.data.email}} → Email address
{{response.data.phone}} → Phone number
{{response.data.linkedin_url}} → LinkedIn URL
{{response.data.full_name}} → Full name
{{response.data.job_title}} → Current job title
{{response.data.company}} → Current company
{{response.data.location}} → Location
{{response.credits_used}} → Credits used (should be 1)
```

**Save this action.**

---

### Action 3: Enrich Contact (Optional)

**If Muraena has an enrich endpoint:**

```
Action Name: Enrich Contact
Description: Enrich existing contact with Muraena data
Category: Enrichment

Method: POST
URL: https://api.muraena.ai/v1/contacts/enrich

Body:
{
  "email": "{{email}}",
  "name": "{{name}}",
  "company": "{{company}}"
}
```

**Save this action.**

---

## 💾 Part 4: Save and Test

### Step 1: Save Your Custom App

Click **"Save App"** or **"Publish"**

Your Muraena app is now private in your Albato account!

### Step 2: Connect Your Muraena Account

1. Go to: **Connections** or **Apps**
2. Find **"Muraena B2B Leads"** in your custom apps
3. Click **"Connect"**
4. Enter your Muraena API key
5. Click **"Test Connection"**
6. ✅ Should show: "Connected successfully!"

---

## 🎯 Part 5: Create Your First Automation

### Example: Search Leads → Add to Aitable CRM

**Automation Setup:**

1. **Trigger:** Webhook (or Scheduled)
   - Webhook URL: `https://webhooks.albato.com/p/XXX/search-leads`

2. **Action 1:** Muraena → Search People
   - Job Title: `{{webhook.job_title}}`
   - Company Name: `{{webhook.company_name}}`
   - Location: `{{webhook.location}}`

3. **Action 2:** Loop through results
   - For each person found

4. **Action 3:** Muraena → Reveal Contact Details
   - Person ID: `{{person_id}}`

5. **Action 4:** Aitable → Create Record
   - Name: `{{full_name}}`
   - Email: `{{email}}`
   - Phone: `{{phone}}`
   - Company: `{{company}}`
   - Job Title: `{{job_title}}`
   - LinkedIn: `{{linkedin_url}}`
   - Source: "Muraena"

**Save and Activate!**

---

## 🔗 Part 6: Connect to Autopilot

### Use Case: Trigger Muraena Search from Autopilot

**In Autopilot Dashboard:**

```
"Search for Marketing Directors at tech companies in San Francisco and add them to Aitable"
```

**What Happens:**

1. Autopilot sends HTTP POST to your Albato webhook:
   ```json
   {
     "job_title": "Marketing Director",
     "company_name": "tech",
     "location": "San Francisco",
     "industry": "Technology"
   }
   ```

2. Albato triggers Muraena search

3. For each result, reveals contact details (uses credits!)

4. Adds enriched leads to Aitable CRM

5. ✅ Done! New leads in your CRM!

---

## 📊 Credit Management

### Important: Protect Your 10k Monthly Credits!

**What Uses Credits:**
- ✅ **Search People:** FREE (doesn't use credits)
- ❌ **Reveal Contact Details:** 1 credit per person
- ❌ **Enrich Contact:** 1 credit per contact

**Best Practices:**

1. **Search First:** Always search before revealing
2. **Filter Well:** Use specific filters to reduce results
3. **Bulk Carefully:** Don't reveal 1000 contacts at once!
4. **Track Usage:** Monitor in Muraena dashboard
5. **Set Limits:** In Autopilot quota system

**Configure in Autopilot:**

Already set in `.env.local`:
```bash
MURAENA_MONTHLY_LIMIT=10000
```

**Check Usage:**
```bash
curl https://your-app.railway.app/api/quota/status?platform=muraena
```

---

## 🐛 Troubleshooting

### Connection Failed

**Check:**
- ✅ API key is correct (no extra spaces)
- ✅ You're on Business plan ($149/mo+)
- ✅ API is enabled in Muraena settings
- ✅ Authorization header format is correct

### Search Returns No Results

**Try:**
- ✅ Broader search criteria
- ✅ Different job title keywords
- ✅ Check filters are properly mapped
- ✅ Verify JSON format in request body

### Reveal Contact Fails

**Check:**
- ✅ You have credits remaining (check Muraena dashboard)
- ✅ Person ID or LinkedIn URL is valid
- ✅ Profile exists in Muraena database
- ✅ Not hitting rate limits

### Credits Depleting Too Fast

**Solutions:**
- ✅ Add filters to search (narrow results)
- ✅ Don't auto-reveal all search results
- ✅ Add manual approval step
- ✅ Set daily/weekly limits in automation

---

## 📋 Quick Reference

### API Base URL
```
https://api.muraena.ai/v1
```

### Authentication
```
Authorization: Bearer YOUR_API_KEY
```

### Key Endpoints
```
POST /people/search - Search for leads (FREE)
POST /people/reveal - Get contact details (1 credit)
GET /account - Check credits and plan
```

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "credits_remaining": 9999
}
```

---

## ✅ Setup Complete!

You now have Muraena.ai integrated in Albato and can:

- ✅ Search 200M+ B2B profiles
- ✅ Reveal contact details (email, phone)
- ✅ Auto-add leads to Aitable CRM
- ✅ Trigger from Autopilot via webhooks
- ✅ Track credit usage with quota protection

**Next Steps:**

1. Create your first search automation
2. Test with a small batch (2-3 leads)
3. Verify data flows to Aitable
4. Scale up your lead generation!

---

## 💡 Pro Tips

1. **Start Small:** Test with 5 leads before automating hundreds
2. **Use Filters:** More specific = better leads + fewer wasted credits
3. **Schedule Wisely:** Run searches during business hours
4. **Quality Over Quantity:** Reveal only qualified leads
5. **Monitor Credits:** Check Muraena dashboard weekly
6. **Document Workflows:** Keep track of what works

---

## 🆘 Need Help?

- **Muraena Support:** support@muraena.ai
- **Albato Help:** https://wiki.albato.com
- **API Docs:** https://muraena.readme.io

Happy Lead Hunting! 🎯
