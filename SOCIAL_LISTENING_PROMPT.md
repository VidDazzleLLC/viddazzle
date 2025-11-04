# Prompt for Social Media Listening & Outreach Feature

Copy and paste this entire prompt into a new Claude chat:

---

I need you to build a **Social Media Listening & Outreach Tool** for my workflow automation platform called Workflow Autopilot (VidDazzle).

## Current Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with pgvector (Supabase/Neon.tech)
- **AI**: Claude Opus 4.1 via Anthropic API
- **Authentication**: Supabase Auth (likely)

## Existing Architecture

The app has:
1. **MCP Tools System** - 15+ tools like file operations, HTTP requests, web scraping, database queries, email sending, etc.
2. **Connector Library** - Integrations with Slack, Gmail, GitHub, Stripe, Google Calendar, Notion, Airtable, etc.
3. **Workflow Engine** - AI-powered automation workflows

Directory structure:
```
/src
  /app          # Next.js 14 app directory
  /components   # React components
  /lib          # Utilities and helpers
```

## What I Need You To Build

Create a **complete Social Media Listening & Outreach system** with the following features:

### Core Features

1. **Social Media Monitoring**
   - Monitor Twitter/X, LinkedIn, Reddit, and optionally Facebook
   - Track keywords, hashtags, mentions, and user accounts
   - Real-time or scheduled listening (configurable intervals)
   - Filter by engagement metrics, sentiment, location, language

2. **Smart Detection & Analysis**
   - AI-powered sentiment analysis
   - Relevance scoring for each mention
   - Intent detection (informational, purchase intent, complaint, etc.)
   - Opportunity scoring (likelihood of conversion/engagement)

3. **Automated Outreach**
   - Rule-based triggers (e.g., "respond when keyword X is mentioned with positive sentiment")
   - AI-generated personalized responses
   - Multi-channel outreach (reply on platform, send DM, email follow-up)
   - Rate limiting and scheduling to avoid spam
   - Approval workflow (auto-send or require manual approval)

4. **Dashboard & Management**
   - View all detected mentions in a feed
   - Filter and search capabilities
   - Engagement analytics (response rate, conversion tracking)
   - Campaign performance metrics
   - Configure listening rules and outreach templates

5. **Integration with Existing System**
   - Add new MCP tools: `social_listen`, `social_post`, `social_dm`
   - Add new connectors for social platforms
   - Store data in PostgreSQL
   - Use vector search for semantic matching of mentions

### Technical Requirements

1. **API Integrations** - Use these APIs:
   - Twitter/X API v2 (or Apify/RapidAPI alternative if needed)
   - LinkedIn API (or web scraping via Apify)
   - Reddit API (PRAW or similar)
   - Facebook Graph API (optional)

2. **Database Schema** - Create tables for:
   - `listening_campaigns` (keywords, platforms, filters, status)
   - `social_mentions` (platform, content, author, engagement, sentiment, relevance_score)
   - `outreach_rules` (triggers, conditions, response templates)
   - `outreach_history` (sent messages, status, conversions)

3. **API Routes** - Create Next.js API routes:
   - `POST /api/social-listening/campaigns` - Create listening campaign
   - `GET /api/social-listening/mentions` - Fetch mentions
   - `POST /api/social-listening/analyze` - Analyze mention with AI
   - `POST /api/social-outreach/send` - Send outreach message
   - `GET /api/social-listening/analytics` - Get campaign analytics

4. **UI Components**:
   - Campaign setup wizard
   - Mentions feed/dashboard
   - Outreach composer with AI suggestions
   - Analytics dashboard with charts
   - Settings page for API keys and configurations

5. **Background Jobs**:
   - Scheduled listener that runs every X minutes
   - Queue system for outreach messages
   - Webhook handlers for real-time platform events (if available)

### File Structure I Need

Please provide complete code for:

```
/src/app/social-listening/
  page.tsx                          # Main dashboard
  campaigns/page.tsx                # Campaigns list
  campaigns/new/page.tsx            # Create campaign
  mentions/page.tsx                 # Mentions feed
  analytics/page.tsx                # Analytics dashboard

/src/app/api/social-listening/
  campaigns/route.ts                # CRUD for campaigns
  mentions/route.ts                 # Fetch mentions
  analyze/route.ts                  # AI analysis
  listen/route.ts                   # Trigger listening job

/src/app/api/social-outreach/
  send/route.ts                     # Send outreach
  queue/route.ts                    # Manage outreach queue

/src/lib/social/
  twitter-client.ts                 # Twitter API wrapper
  linkedin-client.ts                # LinkedIn API wrapper
  reddit-client.ts                  # Reddit API wrapper
  listener.ts                       # Core listening logic
  analyzer.ts                       # AI sentiment/relevance analysis
  outreach.ts                       # Outreach automation logic

/src/components/social-listening/
  CampaignWizard.tsx               # Campaign setup flow
  MentionsFeed.tsx                 # Display mentions
  MentionCard.tsx                  # Individual mention card
  OutreachComposer.tsx             # Compose outreach messages
  AnalyticsDashboard.tsx           # Charts and metrics
  PlatformSelector.tsx             # Select platforms to monitor
  KeywordManager.tsx               # Manage keywords/hashtags

/src/types/
  social-listening.ts               # TypeScript types

/prisma/ or /supabase/
  migrations/                       # SQL migrations for tables
```

### Example User Flow

1. User creates a campaign: "Monitor Twitter for 'video editing software' mentions"
2. System monitors Twitter every 15 minutes
3. Finds a tweet: "Anyone know a good video editing software for Mac?"
4. AI analyzes: Sentiment=Neutral, Intent=Purchase, OpportunityScore=85
5. Triggers outreach rule: "Reply with product suggestion when OpportunityScore > 80"
6. AI generates reply: "Hey! VidDazzle works great on Mac and has AI-powered editing. Check it out: [link]"
7. Shows in approval queue OR auto-sends (based on settings)
8. Tracks response and engagement

### Environment Variables Needed

```
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
ANTHROPIC_API_KEY=         # Already have this
DATABASE_URL=              # Already have this
```

### Deliverables

Please provide:

1. ✅ Complete source code for all files listed above
2. ✅ Database migration SQL scripts
3. ✅ package.json updates (new dependencies)
4. ✅ .env.example with all required variables
5. ✅ README_SOCIAL_LISTENING.md with:
   - Setup instructions
   - How to get API keys for each platform
   - How to use the feature
   - Troubleshooting guide

### Additional Notes

- Use TypeScript for all code
- Follow Next.js 14 App Router conventions
- Use React Server Components where appropriate
- Include proper error handling and loading states
- Add rate limiting to avoid API quota issues
- Make it production-ready with proper security (API key validation, user auth checks)
- Use the existing Anthropic Claude API for AI analysis
- Make the UI responsive and follow TailwindCSS best practices

---

## Start Building

Please provide the complete implementation with all code, migrations, and documentation. Be thorough and production-ready.
