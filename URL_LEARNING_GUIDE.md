# 🚀 Auto-Learn from Any URL - Complete Guide

## The Problem This Solves

You own 100+ SaaS platforms. Building custom integrations for each would take forever.

**The Solution:** Just give Autopilot a URL to the documentation, and it automatically learns how to use that platform!

---

## ✅ How It Works (3 Simple Steps)

### Step 1: Find Documentation URL
Go to any SaaS platform you own and find:
- API Documentation page
- Tutorial/Guide page
- Getting Started page
- Developer docs

### Step 2: Give URL to Autopilot
```bash
POST /api/learn-from-url
{
  "url": "https://docs.yourplatform.com/api-reference",
  "platform_name": "Optional Platform Name"
}
```

Or via Autopilot Sidebar Command:
```javascript
{
  "command": "Learn from https://docs.yourplatform.com/api-reference"
}
```

### Step 3: Use It Immediately!
Once learned, you can use it naturally:
```
"Use [Platform Name] to create a new user with email test@example.com"
```

Autopilot will:
- Search learned tutorials
- Find the right API operation
- Generate workflow
- Execute it!

---

## 💡 Real-World Examples

### Example 1: Learn Chatbot Platform

**You say (via Autopilot sidebar):**
```
"Learn from https://docs.chatbotbuilder.io/api"
```

**What happens:**
1. Autopilot fetches the docs
2. Claude AI reads and understands them
3. Extracts operations like:
   - Create Bot
   - Send Message
   - Update Settings
   - Get Analytics
4. Stores as searchable tutorials

**Result:**
```json
{
  "success": true,
  "tutorials_found": 8,
  "tutorials_stored": 8,
  "tutorials": [
    {
      "platform": "ChatBot Builder",
      "operation": "Create Bot"
    },
    {
      "platform": "ChatBot Builder",
      "operation": "Send Message"
    }
  ],
  "message": "Successfully learned 8 operations from ChatBot Builder"
}
```

**Now you can use it:**
```
"Create a customer support chatbot using ChatBot Builder"
```

Autopilot automatically knows how to do it!

---

### Example 2: Learn Landing Page Builder

**API Call:**
```bash
curl -X POST https://your-app.railway.app/api/learn-from-url \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api-docs.landingpagepro.com",
    "platform_name": "Landing Page Pro"
  }'
```

**Response:**
```json
{
  "success": true,
  "tutorials_found": 5,
  "tutorials_stored": 5,
  "message": "Successfully learned 5 operations from Landing Page Pro",
  "next_steps": [
    "You can now use these operations via Autopilot",
    "Try: Use Landing Page Pro to create a landing page"
  ]
}
```

**Now use it:**
```
"Create a landing page for my voice AI product with email capture using Landing Page Pro"
```

---

### Example 3: Learn Video Creation Tool

**You own:** "VideoMaker Pro" (example)

**Give Autopilot the docs:**
```javascript
// Via Autopilot command API
{
  "command": "Learn from https://videomakerpro.com/developers/api-guide"
}
```

**Autopilot learns:**
- Create video from template
- Add text overlays
- Add music tracks
- Export video
- Get render status

**Use immediately:**
```
"Create a 30-second promo video using VideoMaker Pro with our logo and voice AI messaging"
```

---

## 📋 What Autopilot Extracts Automatically

When you give it a URL, Claude AI looks for:

### 1. **Platform Information**
- Platform name
- API base URL
- Version

### 2. **Authentication**
- API key format
- OAuth setup
- Bearer tokens
- Header requirements

### 3. **Operations (CRUD)**
- Create operations
- Read/Get operations
- Update operations
- Delete operations

### 4. **Common Use Cases**
- Tutorials
- Quick starts
- Examples
- Best practices

### 5. **Request/Response Format**
- HTTP methods (GET, POST, etc.)
- Required parameters
- Optional parameters
- Response structure
- Error codes

---

## 🎯 Best URLs to Use

### ✅ **GOOD URLs** (Rich documentation):
- `https://docs.platform.com/api-reference`
- `https://api.platform.com/documentation`
- `https://developers.platform.com/guides`
- `https://platform.com/api-docs`
- `https://help.platform.com/api-tutorial`

### ⚠️ **OK URLs** (May work):
- Main website with some API info
- Knowledge base articles about API
- Third-party integration guides

### ❌ **BAD URLs** (Won't work well):
- Login pages
- Marketing pages with no technical info
- Pages behind authentication
- PDFs (use direct text/HTML URLs)

---

## 🔧 Advanced Usage

### Specify Platform Name
```bash
POST /api/learn-from-url
{
  "url": "https://obscure-docs-url.com/api",
  "platform_name": "My Custom Platform"
}
```

This helps if the platform name isn't clear from the docs.

### Learn Multiple Pages
For platforms with split documentation:

```bash
# Learn authentication
POST /api/learn-from-url
{ "url": "https://docs.platform.com/auth" }

# Learn user management
POST /api/learn-from-url
{ "url": "https://docs.platform.com/users" }

# Learn billing
POST /api/learn-from-url
{ "url": "https://docs.platform.com/billing" }
```

Each URL adds more knowledge!

### Check What Was Learned
```bash
# Search learned tutorials
GET /api/learn-tutorial?query=platform_name
```

---

## 📊 Performance & Limits

### Processing Time
- Small docs (< 1MB): **5-10 seconds**
- Medium docs (1-3MB): **15-30 seconds**
- Large docs (3-5MB): **30-60 seconds**

### What's Extracted
- **Typical:** 3-10 operations per URL
- **Best case:** 15-20 operations from comprehensive docs
- **Worst case:** 1-2 operations from minimal docs

### Content Limits
- Max URL content: **5MB**
- Content sent to Claude: **50,000 characters** (longer content is truncated)
- Tutorials stored: **All valid operations found**

---

## 🚨 Troubleshooting

### "Failed to fetch URL"
**Causes:**
- URL requires authentication
- URL is behind a firewall
- URL is invalid
- Server timeout

**Solutions:**
- Use publicly accessible docs URL
- Copy/paste content manually to `/api/learn-tutorial`
- Check if docs have a public version

### "Could not extract tutorials"
**Causes:**
- Page has no API documentation
- Content is too generic
- Page is mostly marketing content

**Solutions:**
- Try the API reference page specifically
- Use a getting-started guide URL
- Look for developer documentation

### "AI returned invalid JSON"
**Causes:**
- Documentation format is unusual
- Claude couldn't parse structure
- Content was too short

**Solutions:**
- Try a different documentation page
- Use a more comprehensive tutorial URL
- Contact support with the URL for manual review

---

## 💡 Pro Tips

### 1. **Start with Official Docs**
Official platform documentation is usually best structured for auto-learning.

### 2. **Learn in Stages**
For complex platforms:
- Day 1: Learn authentication
- Day 2: Learn core operations
- Day 3: Learn advanced features

### 3. **Test After Learning**
After learning, test with simple commands:
```
"Use [Platform] to test connection"
"Use [Platform] to list my items"
```

### 4. **Combine Multiple Platforms**
Once learned, chain operations:
```
"Get leads from Muraena, create chatbots for them in ChatBot Builder, and send launch emails via Blastable"
```

### 5. **Build a Library**
Learn all 100 platforms gradually:
- Week 1: Top 10 most-used platforms
- Week 2: Next 20 platforms
- Week 3: Remaining platforms

---

## 🎯 Quick Start Checklist

For your 100+ platforms:

### Week 1: Core Platforms (5-10)
- [ ] Social media scheduler
- [ ] Chatbot builder
- [ ] Landing page creator
- [ ] Email marketing (Blastable already done!)
- [ ] Video creation tool
- [ ] CRM (Aitable already done!)
- [ ] Lead generation (Muraena already done!)
- [ ] File delivery service
- [ ] Remote access tool
- [ ] Affiliate program manager

### Week 2: Marketing Tools (10-15)
- [ ] PPC campaign managers
- [ ] SEO tools
- [ ] Analytics platforms
- [ ] Content schedulers
- [ ] A/B testing tools

### Week 3: Support & Operations (10-15)
- [ ] Help desk software
- [ ] Project management
- [ ] Time tracking
- [ ] Invoice/billing
- [ ] Document signing

### Week 4: Remaining Platforms
- [ ] Learn rest at pace
- [ ] Test each one
- [ ] Build workflow libraries

---

## 🎉 Real Success Example

**Before URL Learning:**
```
User: "I want to use my chatbot tool"
Autopilot: "I don't know that platform. Please provide API details."
[30 minutes of manual setup]
```

**After URL Learning:**
```
User: "Learn from https://docs.mychatbot.com/api"
Autopilot: "✅ Learned 7 operations in 12 seconds"

User: "Create a sales chatbot"
Autopilot: [Creates chatbot automatically]
[30 seconds total!]
```

---

## 📞 Support & Questions

### Via Autopilot Sidebar:
```
"How do I learn a new platform?"
"What URLs work best for learning?"
"Show me what platforms Autopilot knows"
```

### Common Questions:

**Q: Do I need to provide API keys?**
A: No! Learning just reads documentation. You add API keys to environment variables later when you want to execute.

**Q: Will this work with all 100 platforms?**
A: It works best with platforms that have public API documentation. For proprietary/internal tools, you may need to manually create tutorials.

**Q: How do I know if learning was successful?**
A: The response shows `tutorials_stored` count. You can also test by trying to use the platform immediately.

**Q: Can I delete learned tutorials?**
A: Yes, tutorials are stored in the database and can be managed. (Feature coming soon: UI for managing learned tutorials)

**Q: Does this use my platform credits?**
A: No! Learning only reads documentation. Credits are used only when you execute actual operations later.

---

## 🚀 Next Steps

1. **Find your most-used platform's API docs**
2. **Copy the documentation URL**
3. **Send to Autopilot**: `"Learn from [URL]"`
4. **Test it**: `"Use [Platform] to..."`
5. **Repeat for next platform!**

**Goal:** Learn all 100 platforms over the next month, then automate EVERYTHING! 🎯

---

*Your business automation is about to become UNLIMITED!* 🚀
