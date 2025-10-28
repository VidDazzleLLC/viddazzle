# VidDazzle Autopilot - Sales Demos

This folder contains everything you need to demo and sell the AI Sales Autopilot to clients.

## What's Included

### 📋 `b2b-sales-automation-demo.json`
Complete workflow example showing:
- 15-step automation from lead discovery to CRM
- Multi-channel outreach (email + social)
- AI qualification and personalization
- Automated follow-ups
- Real-time notifications

**Use this to:** Show prospects the technical depth and capabilities

### 🎯 `CLIENT_PITCH.md`
Full sales playbook including:
- Demo script (step-by-step)
- Pricing tiers ($497-$2,497/month)
- ROI calculator (50x return examples)
- Objection handling
- Use cases for different industries
- Closing techniques

**Use this to:** Prepare for sales calls and demos

### 🧪 `test-demo.sh`
One-click test script that:
- Runs a live automation
- Shows real-time results
- Displays pricing and ROI
- Can be customized for each prospect's ICP

**Use this to:** Run live demos during sales calls

## Quick Start: Demo in 5 Minutes

### 1. Review the pitch
```bash
cat CLIENT_PITCH.md
```

### 2. Understand the workflow
```bash
cat b2b-sales-automation-demo.json | jq '.workflow.steps[] | {name, description}'
```

### 3. Run a test (requires dev server running)
```bash
./test-demo.sh
```

## Live Demo Checklist

**Before the call:**
- [ ] Server is running (`npm run dev`)
- [ ] Get prospect's ICP (job title, industry, company size)
- [ ] Prepare custom search parameters
- [ ] Have ROI calculator ready

**During the call:**
- [ ] Ask about current prospecting process (pain points)
- [ ] Run live automation with THEIR target customers
- [ ] Show results in real-time (dashboard)
- [ ] Calculate their specific ROI
- [ ] Address objections (use CLIENT_PITCH.md)
- [ ] Close for pilot or full contract

**After the call:**
- [ ] Send ROI doc with their numbers
- [ ] Share case study/testimonial
- [ ] Follow up in 48 hours

## Customizing for Your Prospect

Edit `test-demo.sh` to use their ICP:

```bash
{
  "command": "Find [THEIR JOB TITLE] at [THEIR INDUSTRY] companies in [THEIR REGION]..."
}
```

Example variations:
- **SaaS:** "Find VPs of Engineering at Series A startups..."
- **Agency:** "Find Marketing Directors at e-commerce brands..."
- **Manufacturing:** "Find Procurement Managers at automotive companies..."
- **Healthcare:** "Find Hospital Administrators at 500+ bed facilities..."

## Pricing Strategy

### Your Costs (per client):
- Autopilot API: ~$40-120/month (1000 commands × $0.04-0.12)
- Muraena credits: ~$100/month (100 contact reveals)
- Blastable emails: ~$10/month (500 sends)
- Infrastructure: ~$50/month (hosting, database)
- **Total cost:** ~$200-280/month per client

### What You Charge:
- **Startup:** $497/month (77% margin)
- **Growth:** $997/month (72% margin)
- **Enterprise:** $2,497/month (89% margin)

### Revenue Model:
- 10 clients @ $997 = **$9,970/month** revenue
- Your costs: ~$2,500
- **Profit: $7,470/month** (75% margin)

Scale to 50 clients = **$37k/month profit** 🚀

## Use Case Library

### 1. B2B SaaS - Lead Generation
**Target:** Software companies selling to enterprises
**Automation:** Find decision makers → AI qualify → Multi-touch outreach
**ROI:** 200 leads/month, $50k pipeline

### 2. Agencies - White Label
**Target:** Marketing/growth agencies
**Automation:** Package as "AI Growth Assistant" for their clients
**ROI:** $1,500-3,000/month per end client

### 3. Events - Follow-Up Machine
**Target:** Event organizers, conference attendees
**Automation:** Import attendee list → Personalized follow-up → Book meetings
**ROI:** 80% follow-up rate, 3x meetings booked

### 4. Real Estate - Investor Outreach
**Target:** Commercial real estate, property managers
**Automation:** Find property investors → Analyze portfolio → Personalized pitch
**ROI:** 10-15 investor meetings/month

### 5. Recruiting - Candidate Sourcing
**Target:** Recruiters, HR departments
**Automation:** Find candidates → Enrich LinkedIn → Personalized outreach
**ROI:** 50 qualified candidates/month, 60% response rate

## Success Metrics to Show

**During demo, emphasize:**
1. ⏱️ **Speed:** 25 prospects researched + contacted in 30 seconds
2. 🎯 **Quality:** AI lead scoring ensures 7+ quality leads only
3. 💬 **Personalization:** References specific pain points from social
4. 📈 **Scale:** 2,000 leads/month vs. 100 manual
5. 💰 **ROI:** 50x return in 90 days

## Demo Recording Script

**0:00 - Introduction (30 sec)**
"I'm going to show you how our AI finds, qualifies, and engages your ideal customers—completely on autopilot."

**0:30 - The Command (15 sec)**
"Watch what happens when I tell it to find CMOs at software companies..."
[Show command being typed]

**0:45 - Real-Time Execution (60 sec)**
"In real-time, it's now:
- Searching 140 million B2B profiles ✓
- Revealing email and phone numbers ✓
- Analyzing their LinkedIn activity ✓
- Scoring them with AI ✓
- Generating personalized messages ✓
- Sending emails ✓
- Adding to CRM ✓"

**1:45 - The Results (45 sec)**
"Here are the results: 25 prospects found, 18 qualified, 18 emails sent with personalized messages, all tracked in your CRM. This would take a sales rep 15 hours. It took 30 seconds."

**2:30 - The ROI (30 sec)**
"Let's talk numbers. If just 5% close at $5k each, that's $50,000 in revenue from $997/month investment. That's a 50x return."

**3:00 - The Close (30 sec)**
"Question is: what would it be worth to have this running 24/7 for YOUR ideal customers? Want to try a 14-day pilot?"

**Total: 3.5 minutes**

## Next Steps

1. **Get your first demo scheduled**
   - Reach out to 10 prospects
   - Offer free lead gen audit
   - Convert 3-5 to demos

2. **Run pilot programs**
   - 14 days free
   - Generate 50-100 leads
   - Prove ROI
   - Convert to paid

3. **Scale through partnerships**
   - Agency white-label
   - Reseller network
   - Industry-specific packages

4. **Build case studies**
   - Track client results
   - Document ROI
   - Get testimonials
   - Use in future sales

---

**Questions? Issues? Improvements?**

Open an issue or reach out. Let's sell this! 🚀
