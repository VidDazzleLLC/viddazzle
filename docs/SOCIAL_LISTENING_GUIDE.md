# Social Media Listening & Outreach - Complete Guide

## Overview

The Social Media Listening & Outreach feature enables automated monitoring of social media platforms (Twitter, Reddit, LinkedIn) to discover mentions, analyze sentiment, and automate personalized outreach.

## Features

### 1. Multi-Platform Monitoring
- **Twitter/X**: Search tweets by keywords, hashtags, and monitor specific accounts
- **Reddit**: Search posts and comments across subreddits
- **LinkedIn**: Limited API support (requires third-party services for full functionality)

### 2. AI-Powered Analysis
- **Sentiment Analysis**: Positive, negative, neutral, or mixed
- **Intent Detection**: Purchase intent, questions, complaints, recommendations, etc.
- **Opportunity Scoring**: 0-100 score indicating likelihood of conversion
- **Relevance Scoring**: How relevant the mention is to your campaign

### 3. Automated Outreach
- **Smart Triggers**: Rule-based automation based on sentiment, intent, and scores
- **AI Personalization**: Claude-powered message generation
- **Multi-Channel**: Reply on platform, DMs, or email follow-up
- **Approval Workflow**: Optional manual approval before sending
- **Rate Limiting**: Prevents spam with configurable limits

### 4. Analytics Dashboard
- Campaign performance metrics
- Sentiment breakdown
- Platform distribution
- Top keywords and authors
- Response and conversion tracking

## Setup Instructions

### 1. Database Setup

Run the migration to create necessary tables:

```bash
psql $DATABASE_URL < migrations/social-listening-schema.sql
```

This creates the following tables:
- `listening_campaigns` - Campaign configurations
- `social_mentions` - Discovered mentions
- `outreach_rules` - Automation rules
- `outreach_messages` - Sent/pending messages
- `platform_credentials` - API credentials (encrypted)

### 2. API Credentials

#### Twitter API (Required for Twitter monitoring)

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new App
3. Get your credentials:
   - API Key
   - API Secret
   - Bearer Token
4. Add to `.env`:

```env
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token
```

#### Reddit API (Required for Reddit monitoring)

1. Go to https://www.reddit.com/prefs/apps
2. Create a new app (script type)
3. Get your credentials:
   - Client ID
   - Client Secret
4. Add to `.env`:

```env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

#### LinkedIn API (Optional - Limited functionality)

LinkedIn's free API doesn't support public search. For full functionality:
- Use LinkedIn Marketing API (requires partnership)
- Use third-party services like Apify or PhantomBuster

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
# Or use Apify
APIFY_API_KEY=your_apify_key
```

#### Anthropic API (Required for AI analysis)

Already configured in your app:

```env
ANTHROPIC_API_KEY=your_anthropic_key
```

### 3. Store Credentials in Database

You need to store platform credentials for each user. Use the API or run SQL:

```sql
INSERT INTO platform_credentials (user_id, platform, credentials, is_active)
VALUES (
  'user-123',
  'twitter',
  '{"apiKey": "xxx", "apiSecret": "xxx", "bearerToken": "xxx"}',
  true
);

INSERT INTO platform_credentials (user_id, platform, credentials, is_active)
VALUES (
  'user-123',
  'reddit',
  '{"clientId": "xxx", "clientSecret": "xxx", "username": "xxx", "password": "xxx"}',
  true
);
```

**Important**: In production, encrypt these credentials before storing!

## Usage Guide

### Creating a Campaign

1. Navigate to `/social-listening` in your browser
2. Click "New Campaign"
3. Fill in:
   - **Name**: Descriptive name (e.g., "Video Editing Software Mentions")
   - **Description**: Campaign goal/context
   - **Platforms**: Select Twitter, Reddit, LinkedIn
   - **Keywords**: Comma-separated (e.g., "video editing, video software")
   - **Hashtags**: Optional (e.g., "videoediting, contentcreator")
   - **Check Interval**: How often to run (minutes)
4. Click "Create Campaign"

### Running a Listening Job

**Manual Run:**
1. Select a campaign from the dropdown
2. Click "Run Listening Job"
3. Wait for results

**Automatic Run (via Cron):**
```bash
# Add to crontab or use a service like Railway Cron
*/15 * * * * curl -X POST http://your-app.com/api/social-listening/listen -d '{"runAll": true}'
```

### Setting Up Outreach Rules

To automate outreach, create rules in the database:

```sql
INSERT INTO outreach_rules (
  campaign_id,
  name,
  is_active,
  triggers,
  response_template,
  use_ai_personalization,
  require_approval,
  rate_limit,
  channels
) VALUES (
  'campaign-id-here',
  'High Opportunity Response',
  true,
  '{"min_opportunity_score": 70, "sentiment": ["positive", "neutral"], "intent": ["purchase_intent", "question"]}',
  'Hey! I saw your post about video editing. Have you tried VidDazzle? It has AI-powered features that might help.',
  true,
  true,
  '{"max_per_hour": 5, "max_per_day": 20}',
  '[{"type": "reply", "platform": "twitter", "delay_minutes": 0}]'
);
```

### Approving Outreach Messages

1. Go to the "Outreach" tab
2. Review pending messages
3. Click "Approve & Send" or "Reject"
4. Approved messages will be sent automatically

### Viewing Analytics

1. Select a campaign
2. Go to "Analytics" tab
3. View:
   - Total mentions
   - Sentiment breakdown
   - Platform distribution
   - Top keywords
   - Response rates

## API Reference

### Campaigns

**Create Campaign:**
```bash
POST /api/social-listening/campaigns
{
  "name": "Campaign Name",
  "description": "Description",
  "platforms": ["twitter", "reddit"],
  "keywords": ["keyword1", "keyword2"],
  "hashtags": ["hashtag1"],
  "interval_minutes": 15,
  "user_id": "user-123"
}
```

**Get Campaigns:**
```bash
GET /api/social-listening/campaigns?userId=user-123
```

**Update Campaign:**
```bash
PUT /api/social-listening/campaigns?id=campaign-id
{
  "status": "active"
}
```

### Mentions

**Get Mentions:**
```bash
GET /api/social-listening/mentions?campaignId=xxx&platform=twitter&minOpportunityScore=70
```

### Listening

**Run Listening Job:**
```bash
POST /api/social-listening/listen
{
  "campaignId": "campaign-id"
}
```

**Run All Active Campaigns:**
```bash
POST /api/social-listening/listen
{
  "runAll": true
}
```

### Analytics

**Get Campaign Analytics:**
```bash
GET /api/social-listening/analytics?campaignId=xxx&startDate=2024-01-01&endDate=2024-01-31
```

### Outreach

**Send Message:**
```bash
POST /api/social-outreach/send
{
  "messageId": "message-id",
  "action": "send"
}
```

**Approve Message:**
```bash
POST /api/social-outreach/send
{
  "messageId": "message-id",
  "action": "approve",
  "userId": "user-123"
}
```

**Get Pending Messages:**
```bash
GET /api/social-outreach/queue?userId=user-123
```

## Best Practices

### 1. Keyword Selection
- Use specific, relevant keywords
- Include variations and misspellings
- Test keywords to ensure quality results
- Exclude irrelevant terms in filters

### 2. Sentiment Targeting
- Positive sentiment: Good for product recommendations
- Neutral + Questions: Best for helpful responses
- Negative sentiment: Use carefully, offer solutions not sales

### 3. Opportunity Scoring
- Set minimum scores to avoid spam
- 70+ is typically high-value
- Combine with intent for better targeting

### 4. Rate Limiting
- Start conservative (5/hour, 20/day)
- Monitor response rates
- Adjust based on platform policies
- Avoid seeming like a bot

### 5. Message Personalization
- Always use AI personalization
- Reference specific parts of their post
- Add value, don't just sell
- Match platform tone

### 6. Response Timing
- Don't reply instantly (looks like a bot)
- Add 5-30 minute delays
- Vary timing naturally

## Troubleshooting

### No Mentions Found
- Check API credentials are correct
- Verify keywords are not too specific
- Check platform rate limits
- Review campaign status (must be 'active')

### Outreach Not Sending
- Check outreach rule triggers
- Verify rate limits not exceeded
- Check platform credentials
- Review message approval status

### AI Analysis Failing
- Verify ANTHROPIC_API_KEY is set
- Check API quota/limits
- Review error logs

### LinkedIn Not Working
- LinkedIn API is limited
- Consider using Apify integration
- Check credentials and permissions

## Production Considerations

### Security
1. **Encrypt credentials** in `platform_credentials` table
2. **Use environment variables** for API keys
3. **Implement user authentication** (not shown in this version)
4. **Rate limit API endpoints**
5. **Sanitize user inputs**

### Scaling
1. **Use background jobs** for listening (e.g., Bull Queue, Celery)
2. **Implement caching** for analytics
3. **Add database indexes** (already included)
4. **Use connection pooling** for database
5. **Monitor API rate limits**

### Monitoring
1. **Track API usage** and costs
2. **Monitor mention quality** (relevance scores)
3. **Track response rates** and conversions
4. **Set up alerts** for errors
5. **Log all outreach** for compliance

## Future Enhancements

- [ ] Facebook integration
- [ ] Instagram monitoring
- [ ] Webhook support for real-time listening
- [ ] Advanced filtering (location, language)
- [ ] A/B testing for outreach messages
- [ ] Team collaboration features
- [ ] White-label reporting
- [ ] CRM integrations
- [ ] Bulk actions UI
- [ ] Custom ML models for scoring

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API logs in your console
3. Consult platform-specific documentation:
   - [Twitter API Docs](https://developer.twitter.com/en/docs)
   - [Reddit API Docs](https://www.reddit.com/dev/api)
   - [Anthropic API Docs](https://docs.anthropic.com)

## License

Part of Workflow Autopilot - All rights reserved
