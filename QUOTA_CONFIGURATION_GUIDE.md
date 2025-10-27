# Quota Management System - Configuration Guide

## 🎯 Purpose

This system **protects your lifetime deal credits** by:
- ✅ Tracking every API call across all platforms
- ⚠️  Warning you at 80% usage
- 🛑 Auto-pausing at 100% to prevent overage
- 🔄 Automatically resetting monthly
- 📊 Providing real-time usage dashboard

---

## 🔧 Step 1: Configure YOUR Specific Limits

You mentioned **"Those limits are unique to my accounts"** - here's how to set them:

### Edit Environment Variables

Add these to your Railway environment variables (or `.env.local` for testing):

```env
# ============================================
# YOUR LIFETIME DEAL LIMITS
# ============================================

# Blastable.com - Email Campaigns
# Check your AppSumo tier: Tier 1 = 20k, Tier 3 = 100k, Tier 6 = 1M, etc.
BLASTABLE_MONTHLY_LIMIT=100000        # Your monthly send limit
BLASTABLE_CONTACT_LIMIT=100000        # Your contact limit

# Albato.com - Automations
# Tier 3 = 150k operations, Tier 4 = 250k operations
ALBATO_MONTHLY_LIMIT=150000           # Your monthly operations limit

# Aitable.ai - CRM
# Check your tier: varies from 1,000 to 12,000 AI credits/month
AITABLE_MONTHLY_LIMIT=2000            # Your monthly AI credits

# Muraena.ai - B2B Leads
# Business plan = 10,000 credits/month standard
MURAENA_MONTHLY_LIMIT=10000           # Your monthly lead reveal credits

# Twitter/X API
# Standard free tier = 50k tweets/month
TWITTER_MONTHLY_LIMIT=50000           # Your Twitter API limit

# Admin Key for Quota Reset (set to secure random string)
QUOTA_ADMIN_KEY=your-secure-random-key-here
```

---

## 📋 Step 2: Find Your Exact Limits

### Blastable.com

1. Log into your Blastable account
2. Go to **Account Settings** → **Plan Details**
3. Look for:
   - "Monthly Sends": This is your `BLASTABLE_MONTHLY_LIMIT`
   - "Contacts": This is your `BLASTABLE_CONTACT_LIMIT`
4. Example: If you have Tier 3, you likely have:
   - Monthly Sends: 100,000
   - Contacts: 100,000

### Albato.com

1. Log into Albato
2. Go to **Settings** → **Billing** → **Current Plan**
3. Look for "Operations per month"
4. Common tiers:
   - Tier 1 (Basic): Not specified in your case
   - Tier 3 (Pro): 150,000 operations/month
   - Tier 4 (Pro+): 250,000 operations/month

### Aitable.ai

1. Log into Aitable
2. Check your plan tier
3. AI Credits vary by tier:
   - Lower tiers: 1,000-2,000 credits/month
   - Mid tiers: 4,000-6,000 credits/month
   - Higher tiers: 8,000-12,000 credits/month
4. Remember:
   - GPT-3.5 query = 1 credit
   - GPT-4 query = 20 credits

### Muraena.ai

1. Log into Muraena
2. Check your subscription details
3. Business plan standard: **10,000 credits/month**
4. Important: Search is **unlimited** (doesn't use credits)
5. Only **contact reveals** use credits (1 credit per reveal)

---

## 🚀 Step 3: Set Your Limits in Railway

### Option A: Via Railway Dashboard

1. Go to Railway → Your Project → Variables
2. Click "+ New Variable"
3. Add each variable one by one:

```
Name: BLASTABLE_MONTHLY_LIMIT
Value: 100000

Name: BLASTABLE_CONTACT_LIMIT
Value: 100000

Name: ALBATO_MONTHLY_LIMIT
Value: 150000

Name: AITABLE_MONTHLY_LIMIT
Value: 2000

Name: MURAENA_MONTHLY_LIMIT
Value: 10000

Name: TWITTER_MONTHLY_LIMIT
Value: 50000

Name: QUOTA_ADMIN_KEY
Value: your-secure-random-key
```

4. Click "Redeploy" to apply changes

### Option B: Via `.env.local` (Local Testing)

Create `/home/user/viddazzle/.env.local`:

```env
BLASTABLE_MONTHLY_LIMIT=100000
BLASTABLE_CONTACT_LIMIT=100000
ALBATO_MONTHLY_LIMIT=150000
AITABLE_MONTHLY_LIMIT=2000
MURAENA_MONTHLY_LIMIT=10000
TWITTER_MONTHLY_LIMIT=50000
QUOTA_ADMIN_KEY=test-admin-key-123
```

---

## 📊 Step 4: Monitor Your Usage

### View Real-Time Dashboard

Via Autopilot Sidebar:
```
"Show me my quota dashboard"
```

Or via API:
```bash
curl https://your-app.railway.app/api/quota/status?dashboard=true
```

### Dashboard Shows:

```json
{
  "month_year": "2025-01",
  "overall_health": "healthy",
  "platforms": {
    "muraena": {
      "enabled": true,
      "usage_types": {
        "reveals": {
          "current": 234,
          "limit": 10000,
          "percentage": "2.34",
          "remaining": 9766,
          "status": "healthy",
          "is_paused": false
        }
      }
    },
    "aitable": {
      "enabled": true,
      "usage_types": {
        "api_calls": {
          "current": 89,
          "limit": 2000,
          "percentage": "4.45",
          "remaining": 1911,
          "status": "healthy",
          "is_paused": false
        }
      }
    }
  },
  "critical_platforms": []
}
```

---

## ⚠️ Warning & Protection System

### At 80% Usage:

You'll see console warnings:
```
⚠️  QUOTA WARNING: muraena reveals at 8000/10000 (80%)
```

### At 90% Usage:

Second warning is logged:
```
⚠️  QUOTA WARNING: muraena reveals at 9000/10000 (90%)
```

### At 100% Usage:

Platform is **automatically paused**:
```
🚨 QUOTA LIMIT REACHED: muraena reveals is at 10000/10000 (100%).
Auto-paused until monthly reset. Your lifetime credits are protected!
```

Any API calls to that platform will throw an error until the monthly reset.

---

## 🔄 Monthly Reset

### Automatic Reset

Quotas automatically reset on the **1st of each month at midnight UTC**.

The system creates a new month entry, leaving historical data intact.

### Manual Reset (Emergency Only)

If you need to reset quotas manually:

```bash
# Reset ALL platforms
curl -X POST https://your-app.railway.app/api/quota/reset \
  -H "Content-Type: application/json" \
  -d '{"admin_key": "your-secure-random-key"}'

# Reset specific platform
curl -X POST https://your-app.railway.app/api/quota/reset \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "muraena",
    "admin_key": "your-secure-random-key"
  }'
```

**⚠️  IMPORTANT:** Manual reset doesn't add credits! It just resets the counter. Use only for testing or if you manually purchased additional credits.

---

## 🎯 Real-World Usage Example

### Scenario: Social Media Monitoring Campaign

You run:
```
"Run full sales automation for keywords: voice AI on twitter and reddit. Offer: voice_ai"
```

**Behind the scenes:**
1. Twitter monitoring: ✅ Free (no quota tracking)
2. Reddit monitoring: ✅ Free (no quota tracking)
3. AI sentiment analysis (Claude): ✅ Uses Anthropic credits (separate)
4. Muraena search: ✅ Free (unlimited searches)
5. Muraena contact reveal: **-1 credit** (tracked!) ← Important
6. Aitable CRM create record: **-1 API call** (tracked!) ← Important
7. AI sales response: ✅ Uses Anthropic credits (separate)

**Quotas Tracked:**
- `muraena.reveals`: -1 for each lead you enrich
- `aitable.api_calls`: -1 for each CRM record created

**Your Protection:**
- If you've already revealed 9,999 contacts this month, the 10,001st will fail with error
- Your workflow stops before burning lifetime credits
- You get notified to wait for monthly reset

---

## 📈 View Historical Usage

```bash
# Via API
curl https://your-app.railway.app/api/quota/status

# Via Autopilot
"Show quota usage history for muraena"
```

---

## 🔐 Security Notes

1. **QUOTA_ADMIN_KEY** must be a secure random string
   - Generate one: `openssl rand -hex 32`
   - Never share it
   - Only use for manual resets

2. **Quota tracking happens in your database**
   - Table: `quota_tracking`
   - Can be queried directly if needed
   - Historical data is preserved

3. **Quotas are enforced BEFORE API calls**
   - You never accidentally over-use credits
   - Failed quota checks don't count against your limit

---

## 🧪 Testing Your Configuration

### Test 1: Check Current Status

```javascript
// Via Autopilot Sidebar
"What is my current quota status for all platforms?"
```

Expected response:
```
Platform: muraena
- reveals: 0/10000 (0.00%) - Status: healthy

Platform: aitable
- api_calls: 0/2000 (0.00%) - Status: healthy
```

### Test 2: Make a Tracked API Call

```javascript
// Via Autopilot Sidebar
"Create a test lead in Aitable with name 'Test User'"
```

Then check status again:
```
Platform: aitable
- api_calls: 1/2000 (0.05%) - Status: healthy
```

### Test 3: Simulate High Usage (Testing Only)

You can manually insert high usage for testing:

```sql
INSERT INTO quota_tracking (platform, usage_type, usage_count, month_year)
VALUES ('muraena', 'reveals', 8500, '2025-01')
ON CONFLICT (platform, usage_type, month_year)
DO UPDATE SET usage_count = 8500;
```

Then try a Muraena reveal - you should get warning at 80%.

---

## 🛠️ Troubleshooting

### Problem: "Platform is paused" error but you have credits left

**Solution:** Check if you're looking at the right month:
```bash
SELECT * FROM quota_tracking
WHERE platform = 'muraena'
ORDER BY month_year DESC;
```

If the month is wrong, wait for automatic reset or use manual reset.

### Problem: Quota tracking not working

**Check:**
1. Database table exists: `SELECT * FROM quota_tracking LIMIT 1;`
2. Environment variables are set in Railway
3. Railway was redeployed after adding variables

### Problem: Want to increase limits mid-month

**If you purchased additional credits:**
1. Update the environment variable
2. Redeploy Railway
3. Quotas will use new limit immediately
4. Current usage is preserved

---

## 💡 Pro Tips

1. **Check quotas weekly** to avoid surprises
2. **Set up Slack/email alerts** (can be added to quota-manager.js)
3. **Reserve 20% buffer** - don't plan to use 100% each month
4. **Test with small batches** before large campaigns
5. **Monitor during first full month** to understand usage patterns

---

## 🎉 You're Protected!

With this system:
- ✅ Your lifetime credits are safe
- ✅ You get early warnings before hitting limits
- ✅ Automatic protection prevents overage
- ✅ Monthly resets happen automatically
- ✅ Full visibility into usage across all platforms

**Never worry about accidentally burning through your lifetime deals again!**

---

## 📞 Need Help?

If quotas seem incorrect or you need adjustments:
1. Check your actual platform limits first
2. Update environment variables to match
3. Redeploy Railway
4. Test with a small workflow

Questions? Ask via Autopilot sidebar: "How do I configure my quota limits?"
