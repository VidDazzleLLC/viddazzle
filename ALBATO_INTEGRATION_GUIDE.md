# 🔗 Albato Integration Hub - Complete Guide

## Overview

**Use Albato as your central integration hub** to connect all your 100+ platforms to Autopilot without dealing with individual API keys!

### Why This Approach Works:

✅ **No API Key Headaches** - You've already connected platforms in Albato
✅ **One Hub, All Platforms** - Aitable, Blastable, and 100+ others through one interface
✅ **Webhook-Based** - Works without needing Albato API key
✅ **No 403 Errors** - Albato handles all authentication
✅ **Quota Protected** - Track your 150k monthly operations

---

## 🎯 How It Works

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Autopilot  │ ◄─────► │   Albato    │ ◄─────► │ Your 100+   │
│  Dashboard  │ Webhook │ Integration │ Already │  Platforms  │
│             │         │     Hub     │ Connected│             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### **Two-Way Communication:**

**1. Autopilot → Albato → Platforms**
- Autopilot sends HTTP request to Albato webhook
- Albato automation triggers
- Albato performs action on connected platform (Aitable, Blastable, etc.)

**2. Platforms → Albato → Autopilot**
- Something happens in your platform (new record, email sent, etc.)
- Albato detects the event
- Albato sends webhook to Autopilot
- Autopilot processes and responds

---

## 📋 Setup Instructions

### **Part 1: Configure Albato to Send to Autopilot**

**Use this when you want Albato to notify Autopilot about events:**

1. **Get Your Webhook URL:**
   ```
   Production: https://your-app.railway.app/api/webhooks/albato-incoming
   Local Dev: http://localhost:3000/api/webhooks/albato-incoming
   ```

2. **In Albato Dashboard:**
   - Go to **Automations** → **Create New Automation**
   - **Trigger**: Choose your platform (Aitable, Blastable, etc.)
     - Example: "When record is created in Aitable"
   - **Action**: Choose **"HTTP Request / Outgoing Webhook"**
   - **Configure Webhook:**
     ```
     URL: https://your-app.railway.app/api/webhooks/albato-incoming
     Method: POST
     Headers: Content-Type: application/json
     Body (JSON):
     {
       "platform": "aitable",
       "event_type": "record_created",
       "data": {
         "record_id": "{{record_id}}",
         "fields": {{all_fields}}
       },
       "automation_id": "your_automation_name"
     }
     ```

3. **Test the Connection:**
   - Click "Send Test" in Albato
   - Check Autopilot logs for incoming webhook
   - You should see: "📨 Received webhook from Albato"

### **Part 2: Configure Autopilot to Trigger Albato**

**Use this when you want Autopilot to perform actions via Albato:**

1. **In Albato, Create an Automation with Webhook Trigger:**
   - Go to **Automations** → **Create New Automation**
   - **Trigger**: Choose **"Webhook"**
   - Albato will generate a webhook URL like:
     ```
     https://webhooks.albato.com/p/XXXXX/your-webhook-id
     ```
   - **Copy this URL!**

2. **Configure Action in Albato:**
   - **Action**: Choose your platform (Aitable, Blastable, etc.)
   - Example: "Create record in Aitable"
   - Map webhook data to platform fields:
     ```
     Name: {{webhook.name}}
     Email: {{webhook.email}}
     Status: {{webhook.status}}
     ```

3. **Save the Automation in Albato**

4. **Use in Autopilot:**
   - In Autopilot dashboard, create workflow with:
     ```
     "Send HTTP POST to https://webhooks.albato.com/p/XXXXX/your-webhook-id
      with body {
        'name': 'John Doe',
        'email': 'john@example.com',
        'status': 'Active'
      }"
     ```

---

## 🚀 Real-World Examples

### **Example 1: Create Aitable Record from Autopilot**

**In Albato:**
1. Create automation with Webhook trigger
2. Action: "Create record in Aitable"
3. Copy webhook URL: `https://webhooks.albato.com/p/123/create-aitable-record`

**In Autopilot:**
```
"Add a new customer to Aitable CRM with name John Doe and email john@example.com"
```

Autopilot will:
1. Generate workflow with HTTP request tool
2. POST to your Albato webhook
3. Albato creates the record in Aitable
4. Success!

---

### **Example 2: Send Blastable Email from Autopilot**

**In Albato:**
1. Create automation with Webhook trigger
2. Action: "Send email via Blastable"
3. Map fields:
   - To: `{{webhook.recipient}}`
   - Subject: `{{webhook.subject}}`
   - Body: `{{webhook.body}}`
4. Copy webhook URL: `https://webhooks.albato.com/p/123/send-blastable-email`

**In Autopilot:**
```
"Send email to customer@example.com with subject 'Welcome' via Blastable"
```

Autopilot will:
1. Parse your request
2. POST to Albato webhook with email data
3. Albato sends via Blastable (using your existing connection)
4. No API key issues!

---

### **Example 3: Auto-Process New Aitable Records**

**In Albato:**
1. **Trigger**: "When record is created in Aitable"
2. **Action**: "Send webhook to Autopilot"
3. Webhook URL: `https://your-app.railway.app/api/webhooks/albato-incoming`
4. Body:
   ```json
   {
     "platform": "aitable",
     "event_type": "record_created",
     "data": {
       "record_id": "{{record_id}}",
       "name": "{{name}}",
       "email": "{{email}}",
       "status": "{{status}}"
     }
   }
   ```

**What Happens:**
1. New record created in Aitable
2. Albato detects it
3. Albato sends webhook to Autopilot
4. Autopilot processes the data (can trigger other workflows!)
5. Could auto-send welcome email via Blastable, create task, etc.

---

## 🔧 Available Webhook Endpoints

### **Incoming Webhooks (Albato → Autopilot):**

**Endpoint:** `POST /api/webhooks/albato-incoming`

**Payload Format:**
```json
{
  "platform": "aitable|blastable|your-platform",
  "event_type": "record_created|email_sent|custom-event",
  "data": {
    // Your event data here
  },
  "automation_id": "optional-automation-name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received and processed",
  "processed_at": "2025-10-27T12:00:00.000Z",
  "result": { /* processing result */ }
}
```

---

## 📊 Supported Platform Events

### **Aitable Events:**
- `record_created` - New record added
- `record_updated` - Record modified
- `record_deleted` - Record removed

### **Blastable Events:**
- `email_sent` - Email successfully sent
- `email_opened` - Recipient opened email
- `email_clicked` - Link clicked in email
- `email_bounced` - Email delivery failed

### **Generic Events:**
- Any platform can send custom event types
- Autopilot will log and process them

---

## 🛠️ Using Albato App Integrator

**For platforms not already in Albato:**

### **Step 1: Build Custom App**

1. Go to: https://albato.com/app/builder/constructor
2. Click **"Create New App"**
3. **Enter App Details:**
   - Name: Your platform name
   - Description: What it does
   - Icon: Upload logo (optional)

4. **Configure Authorization:**
   - Choose auth type: API Key, OAuth, Basic Auth
   - Add your API credentials
   - Test connection

5. **Add Triggers:**
   - Define events that can start automations
   - Example: "New order received", "User registered"
   - Map data fields from API response

6. **Add Actions:**
   - Define what Autopilot can do
   - Example: "Create user", "Send notification"
   - Map input fields to API request

7. **Test & Publish:**
   - Test with real data
   - Save for private use
   - (Optional) Submit for public approval

### **Step 2: Use in Automations**

Once your custom app is in Albato:
- It works just like Aitable/Blastable
- Create automations with webhook triggers/actions
- Connect to Autopilot via webhooks

---

## 📈 Quota Management

### **Track Your 150k Monthly Operations:**

Your Albato lifetime deal includes **150,000 operations/month**.

**What Counts as an Operation:**
- Each trigger event = 1 operation
- Each action performed = 1 operation
- Example: Trigger (1) + Action (1) = 2 operations

**Configure Limits in Autopilot:**

Already configured in `.env.local`:
```bash
ALBATO_MONTHLY_LIMIT=150000
```

**Check Usage:**
```bash
curl https://your-app.railway.app/api/quota/status?platform=albato
```

**Monitor in Albato:**
- Dashboard shows operation count
- Resets on 1st of each month
- Get warnings at 80% usage

---

## 🎓 Quick Start Checklist

### **For Your First Integration:**

- [ ] **Pick a Platform** (Start with Aitable or Blastable)
- [ ] **In Albato:** Create automation with Webhook trigger
- [ ] **Copy** the webhook URL Albato generates
- [ ] **In Autopilot:** Test with curl:
  ```bash
  curl -X POST https://webhooks.albato.com/p/XXX/your-webhook \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```
- [ ] **Check Albato:** See if automation triggered
- [ ] **Success!** Now add more platforms

### **For Receiving Events:**

- [ ] **In Albato:** Create automation with platform trigger
- [ ] **Set Action:** HTTP Request / Outgoing Webhook
- [ ] **Use Autopilot URL:** `https://your-app.railway.app/api/webhooks/albato-incoming`
- [ ] **Test:** Create event in platform
- [ ] **Check Autopilot logs:** Should see webhook received
- [ ] **Success!** Platform events now flow to Autopilot

---

## 🔄 Common Workflows

### **1. Lead Capture & CRM:**
```
Landing Page Form → Webhook → Autopilot → Albato → Aitable CRM
```

### **2. Email Campaign:**
```
Autopilot Command → Albato → Blastable → Send Emails → Track Opens
```

### **3. Social Listening:**
```
Social Platform → Albato → Autopilot → Analyze Sentiment → Aitable CRM
```

### **4. Automated Follow-up:**
```
New Aitable Record → Albato → Autopilot → Generate Email → Blastable → Send
```

---

## 🐛 Troubleshooting

### **Webhook Not Received:**
- ✅ Check URL is correct (no typos)
- ✅ Verify Autopilot is deployed and running
- ✅ Check Albato automation is "Active"
- ✅ Look at Albato logs for errors
- ✅ Test with curl to verify endpoint works

### **Albato Webhook Fails:**
- ✅ Verify webhook URL from Albato is correct
- ✅ Check JSON format is valid
- ✅ Ensure required fields are mapped
- ✅ Test in Albato's test mode first
- ✅ Check Albato logs for error details

### **Platform Not Responding:**
- ✅ Verify platform is connected in Albato
- ✅ Check if connection needs re-authorization
- ✅ Confirm you're not hitting rate limits
- ✅ Test the platform connection in Albato directly

---

## 💡 Pro Tips

1. **Use Descriptive Automation Names** - Makes debugging easier
2. **Test with Curl First** - Verify webhooks work before complex workflows
3. **Log Everything** - Autopilot logs all webhook data
4. **Start Simple** - Get one platform working, then add more
5. **Document Your Webhooks** - Keep a list of all Albato webhook URLs
6. **Monitor Quotas** - Watch your 150k operation limit
7. **Use Albato's Test Mode** - Test automations before activating

---

## 🚀 Next Steps

**Now that you understand the system:**

1. **Create your first Albato → Autopilot automation**
   - Choose Aitable or Blastable
   - Set up webhook trigger
   - Test with Autopilot

2. **Create your first Autopilot → Albato automation**
   - Set up webhook receiver in Albato
   - Connect to a platform action
   - Test from Autopilot dashboard

3. **Add More Platforms**
   - Use App Integrator for platforms not in Albato
   - Connect all your 100+ tools
   - Build your complete automation empire!

---

## 📞 Support

- **Albato Help:** https://wiki.albato.com
- **Autopilot Issues:** Check logs in Railway dashboard
- **Test Webhooks:** Use https://webhook.site for debugging

---

## 🎉 Success!

You now have a complete integration system that:
- ✅ Bypasses all API authentication issues
- ✅ Connects 100+ platforms through Albato
- ✅ Protects your lifetime deal quotas
- ✅ Works without needing individual API keys
- ✅ Scales to any number of platforms

**Happy Automating!** 🚀
