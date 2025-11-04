# Seller Products & Buyer Engagement Feature

## Overview

This feature enables sellers to manage multiple products/solutions and automatically match them with interested buyers based on positive engagement triggers. When a buyer shows interest through trigger words or phrases, the system presents the appropriate seller's solution with buyer permission tracking.

---

## 🎯 Key Features

1. **Multiple Products Per Seller** - Sellers can run multiple products/solutions simultaneously
2. **Smart Product-Buyer Matching** - AI-powered matching based on keywords, sentiment, and intent
3. **Positive Trigger Detection** - Detects when buyers show interest using trigger words/phrases
4. **Buyer Consent Tracking** - Tracks buyer permissions and consent for GDPR compliance
5. **Automated Product Offers** - Presents the right product to the right buyer at the right time
6. **Rate Limiting** - Prevents spam with per-product daily limits
7. **Performance Analytics** - Track which products perform best

---

## 📊 Database Schema

### Products Table
Stores seller products/solutions:

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Product details
  features JSONB,
  benefits JSONB,
  target_audience TEXT,

  -- Offer configuration
  call_to_action TEXT,
  offer_url TEXT,
  offer_type TEXT, -- product, service, consultation, etc.
  response_template TEXT,
  ai_personalization_enabled BOOLEAN DEFAULT true,

  -- Matching criteria
  matching_keywords TEXT[],  -- Keywords to match buyers
  exclude_keywords TEXT[],   -- Keywords to avoid
  target_sentiment TEXT[],   -- positive, neutral, negative
  target_intent TEXT[],      -- purchase_intent, question, etc.
  min_opportunity_score INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,
  max_offers_per_day INTEGER DEFAULT 10,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Positive Trigger Words Table
Defines trigger words that indicate buyer interest:

```sql
CREATE TABLE positive_trigger_words (
  id UUID PRIMARY KEY,
  trigger_phrase TEXT NOT NULL,
  trigger_type TEXT, -- interest, purchase_intent, confirmation, etc.
  match_type TEXT,   -- exact, contains, regex, fuzzy
  case_sensitive BOOLEAN DEFAULT false,
  confidence_boost INTEGER, -- How much to boost opportunity score
  is_system_default BOOLEAN,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);
```

**Default Trigger Words Include:**
- Interest: "interested", "tell me more", "sounds good"
- Purchase Intent: "how much", "where can i buy", "ready to buy"
- Confirmation: "yes please", "absolutely", "definitely"
- Request Info: "send me details", "dm me", "email me"

### Buyer Responses Table
Tracks buyer responses to outreach:

```sql
CREATE TABLE buyer_responses (
  id UUID PRIMARY KEY,
  outreach_message_id UUID REFERENCES outreach_messages(id),
  original_mention_id UUID REFERENCES social_mentions(id),
  product_id UUID REFERENCES products(id),

  -- Response content
  response_content TEXT NOT NULL,
  response_platform TEXT,
  response_url TEXT,
  author_username TEXT,

  -- AI analysis
  detected_triggers JSONB, -- Array of detected trigger phrases
  sentiment TEXT,
  sentiment_score DECIMAL(3, 2),
  buyer_interest_level TEXT, -- high, medium, low, none
  is_positive_response BOOLEAN,
  suggested_next_action TEXT,
  ai_analysis JSONB,

  -- Status
  response_processed BOOLEAN DEFAULT false,
  next_outreach_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ
);
```

### Buyer Consent Table
Tracks buyer permissions:

```sql
CREATE TABLE buyer_consent (
  id UUID PRIMARY KEY,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  seller_id UUID REFERENCES auth.users(id),

  -- Consent details
  consent_type TEXT, -- explicit, implicit, opt_out
  consent_given BOOLEAN DEFAULT true,
  consent_source TEXT,

  -- Permissions
  can_contact BOOLEAN DEFAULT true,
  can_store_data BOOLEAN DEFAULT true,
  can_share_with_partners BOOLEAN DEFAULT false,

  -- Tracking
  consent_obtained_at TIMESTAMPTZ,
  consent_expires_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,

  UNIQUE(platform, platform_user_id, seller_id)
);
```

### Product-Mention Matches Table
Tracks which products match which mentions:

```sql
CREATE TABLE product_mention_matches (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  mention_id UUID REFERENCES social_mentions(id),
  match_score INTEGER, -- 0-100
  matched_keywords TEXT[],
  outreach_created BOOLEAN,
  outreach_message_id UUID REFERENCES outreach_messages(id),

  UNIQUE(product_id, mention_id)
);
```

---

## 🔌 API Endpoints

### Product Management

#### Create Product
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium SEO Service",
  "description": "Get your website to page 1 of Google",
  "category": "Digital Marketing",
  "price": 299.99,
  "currency": "USD",
  "features": ["Keyword Research", "On-page SEO", "Link Building"],
  "benefits": ["Increase traffic", "Higher rankings"],
  "target_audience": "Small business owners",
  "call_to_action": "Book a free consultation",
  "offer_url": "https://example.com/book",
  "offer_type": "service",
  "response_template": "Hi! I noticed you're interested in SEO...",
  "matching_keywords": ["seo", "google ranking", "website traffic"],
  "exclude_keywords": ["spam", "cheap"],
  "target_sentiment": ["positive", "neutral"],
  "target_intent": ["purchase_intent", "question", "informational"],
  "min_opportunity_score": 60,
  "max_offers_per_day": 20,
  "is_active": true,
  "campaign_ids": ["campaign-uuid-1", "campaign-uuid-2"]
}
```

#### List Products
```http
GET /api/products?is_active=true&include_performance=true
Authorization: Bearer <token>
```

Response:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Premium SEO Service",
      "is_active": true,
      "performance": {
        "total_matches": 45,
        "total_outreach_sent": 30,
        "total_responses": 12,
        "positive_responses": 8,
        "response_rate_percent": 40.0
      }
    }
  ],
  "total": 1
}
```

#### Update Product
```http
PUT /api/products/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_active": true,
  "max_offers_per_day": 30
}
```

#### Delete Product
```http
DELETE /api/products/{id}
Authorization: Bearer <token>
```

### Trigger Words Management

#### List Trigger Words
```http
GET /api/trigger-words?is_active=true
Authorization: Bearer <token>
```

#### Create Custom Trigger Word
```http
POST /api/trigger-words
Authorization: Bearer <token>
Content-Type: application/json

{
  "trigger_phrase": "i need this",
  "trigger_type": "purchase_intent",
  "match_type": "contains",
  "case_sensitive": false,
  "confidence_boost": 25,
  "is_active": true
}
```

### Buyer Response Processing

#### Process Buyer Response
```http
POST /api/buyer-responses/process
Content-Type: application/json

{
  "outreach_message_id": "uuid",
  "response_content": "Yes! Tell me more about pricing",
  "response_platform": "twitter",
  "response_url": "https://twitter.com/user/status/123",
  "author_username": "buyer_username",
  "author_profile_url": "https://twitter.com/buyer_username",
  "auto_send_product": false
}
```

Response:
```json
{
  "success": true,
  "response": {
    "id": "uuid",
    "is_positive": true,
    "interest_level": "high",
    "detected_triggers": [
      {
        "phrase": "yes",
        "type": "confirmation",
        "confidence_boost": 25
      },
      {
        "phrase": "tell me more",
        "type": "interest",
        "confidence_boost": 25
      }
    ],
    "sentiment": "positive",
    "should_send_product": true
  },
  "product_offer": {
    "id": "product-uuid",
    "name": "Premium SEO Service",
    "description": "...",
    "call_to_action": "Book a free consultation",
    "offer_url": "https://example.com/book"
  },
  "recommendations": {
    "next_steps": [
      {
        "action": "send_product_offer",
        "priority": "high",
        "description": "Send Premium SEO Service details to the buyer"
      }
    ],
    "urgency": "high"
  }
}
```

#### List Buyer Responses
```http
GET /api/buyer-responses?is_positive=true&interest_level=high
Authorization: Bearer <token>
```

---

## 🔄 Complete Workflow

### 1. Seller Setup

```javascript
// Step 1: Create a product
const product = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Website Design Service",
    description: "Professional website design for small businesses",
    matching_keywords: ["website design", "need a website", "web designer"],
    target_intent: ["purchase_intent", "question"],
    min_opportunity_score: 50,
    call_to_action: "Get a free quote",
    offer_url: "https://example.com/quote"
  })
});

// Step 2: Link product to campaigns
await fetch('/api/products/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: product.id,
    campaign_id: "campaign-uuid",
    priority: 1
  })
});
```

### 2. System Finds Buyer Match

```javascript
// System automatically runs when new mentions arrive
const matcher = new ProductMatcher();
const mention = {
  id: "mention-uuid",
  content: "Looking for a good website designer for my coffee shop",
  platform: "twitter",
  sentiment: "neutral",
  intent: "question",
  opportunity_score: 75
};

// Find matching products
const matches = await matcher.findMatchingProducts(mention, campaignId);
// Returns: [{ product, matchScore: 85, matchedKeywords: ["website designer"] }]

// Record the match
await matcher.recordMatch(
  matches[0].id,
  mention.id,
  matches[0].matchScore,
  matches[0].matchedKeywords
);
```

### 3. System Sends Initial Outreach

```javascript
// Outreach message is created with product linked
const outreach = await createOutreachMessage({
  mention_id: mention.id,
  product_id: matches[0].id,
  message_content: "Hi! I saw you're looking for a website designer...",
  status: "approved"
});
```

### 4. Buyer Responds with Interest

```javascript
// Buyer replies: "Yes! Tell me more about your services"
const response = await fetch('/api/buyer-responses/process', {
  method: 'POST',
  body: JSON.stringify({
    outreach_message_id: outreach.id,
    response_content: "Yes! Tell me more about your services",
    response_platform: "twitter",
    auto_send_product: true
  })
});

// System detects:
// - Trigger: "yes" (confirmation, +25 boost)
// - Trigger: "tell me more" (interest, +25 boost)
// - Interest level: HIGH
// - Should send product: TRUE
```

### 5. System Tracks Consent & Offers Product

```javascript
// System automatically:
// 1. Records buyer consent (implicit, from positive response)
// 2. Creates product offer message
// 3. Marks response as processed
// 4. Creates follow-up outreach (pending approval)

// Seller can approve and send the product offer
await fetch('/api/social-outreach/send', {
  method: 'POST',
  body: JSON.stringify({
    message_id: followUpId,
    action: 'approve_and_send'
  })
});
```

---

## 🧩 Using ProductMatcher Class

```javascript
import { ProductMatcher } from '../lib/social/product-matcher';

const matcher = new ProductMatcher(supabaseUrl, supabaseKey);

// Find all products that match a mention
const matches = await matcher.findMatchingProducts(mention, campaignId);

// Get the best product for a mention
const bestProduct = await matcher.getBestProduct(mention, campaignId);

// Find all mentions that match a product
const mentions = await matcher.findMentionsForProduct(productId, limit);

// Batch process mentions
const results = await matcher.batchMatchMentions(mentions, campaignId);
// Returns: { totalMentions: 10, totalMatches: 7, matchesByProduct: {...} }

// Get product match statistics
const stats = await matcher.getProductMatchStats(productId);
// Returns: { totalMatches, avgMatchScore, topKeywords: [...] }
```

---

## 🧠 Using SocialAnalyzer for Trigger Detection

```javascript
import { SocialAnalyzer } from '../lib/social/analyzer';

const analyzer = new SocialAnalyzer(apiKey, supabaseUrl, supabaseKey);

// Detect positive triggers in buyer response
const triggers = await analyzer.detectPositiveTriggers(
  "Yes please! How much does it cost?",
  userId
);

// Returns:
// {
//   hasPositiveTriggers: true,
//   detectedTriggers: [
//     { phrase: "yes please", type: "confirmation", confidence_boost: 30 },
//     { phrase: "how much", type: "purchase_intent", confidence_boost: 30 }
//   ],
//   totalConfidenceBoost: 50,
//   isPurchaseIntent: true,
//   isConfirmation: true
// }

// Full response analysis
const analysis = await analyzer.analyzeBuyerResponse(
  response,
  originalMention,
  userId
);

// Returns complete analysis with:
// - Detected triggers
// - AI sentiment analysis
// - Interest level (high/medium/low)
// - Suggested next action
// - Whether to send product offer
```

---

## 📈 Product Matching Algorithm

The system scores product-mention matches on a 0-100 scale:

### Scoring Breakdown:
- **Keyword Matching** (0-40 points): Each matching keyword = 10 points
- **Sentiment Matching** (0-20 points): Matches target_sentiment array
- **Intent Matching** (0-20 points): Matches target_intent array
- **Opportunity Score** (0-20 points): Bonus for high opportunity scores

### Matching Requirements:
- Must match at least ONE keyword
- Must meet minimum opportunity score (configurable per product)
- Must NOT contain excluded keywords
- Minimum 30/100 match score required

### Example:
```
Mention: "I need SEO help to rank my website on Google"
Product: SEO Service (keywords: ["seo", "google ranking", "website"])

Score Calculation:
- Keyword matches: "seo", "website", "google" = 30 points
- Sentiment: neutral (matches target) = 20 points
- Intent: question (matches target) = 20 points
- Opportunity: 85/100 (above min 60) = 5 bonus points
TOTAL: 75/100 ✅ MATCH
```

---

## 🔒 Privacy & Consent

### Consent Types:
1. **Implicit** - Derived from positive response to outreach
2. **Explicit** - User explicitly opted in
3. **Opt-out** - User opted out of communication

### Consent Tracking:
```javascript
// System automatically tracks consent when:
// - Buyer responds positively to outreach
// - Buyer uses trigger words showing interest
// - Buyer clicks on offer links (if tracked)

// Check if seller can contact buyer:
const { data: consent } = await supabase
  .from('buyer_consent')
  .select('*')
  .eq('platform', 'twitter')
  .eq('platform_user_id', 'buyer_username')
  .eq('seller_id', userId)
  .eq('consent_given', true)
  .single();

if (consent && consent.can_contact) {
  // OK to send follow-up
}
```

---

## 📊 Analytics & Performance Views

### Product Performance View
```sql
SELECT * FROM product_performance WHERE seller_id = 'user-id';
```

Returns:
- `total_matches` - Total mentions matched
- `total_outreach_sent` - Total outreach messages sent
- `total_responses` - Total buyer responses
- `positive_responses` - Positive responses count
- `response_rate_percent` - Response rate
- `last_outreach_sent` - Last activity timestamp

---

## 🚀 Next Steps

### To Use This Feature:

1. **Run the migration:**
   ```bash
   psql -d your_database < migrations/20251104-seller-products-and-triggers.sql
   ```

2. **Create your first product:**
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Your Product",
       "matching_keywords": ["keyword1", "keyword2"],
       "description": "Product description"
     }'
   ```

3. **Link product to campaigns:**
   ```bash
   curl -X POST http://localhost:3000/api/products/campaigns \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"product_id": "...", "campaign_id": "..."}'
   ```

4. **Monitor buyer responses:**
   ```bash
   curl http://localhost:3000/api/buyer-responses?is_positive=true \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

## 🛠️ Customization

### Add Custom Trigger Words:
```javascript
await fetch('/api/trigger-words', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    trigger_phrase: "shut up and take my money",
    trigger_type: "purchase_intent",
    confidence_boost: 40
  })
});
```

### Customize Product Templates:
```javascript
await fetch(`/api/products/${productId}`, {
  method: 'PUT',
  body: JSON.stringify({
    response_template: `
      Hi {{username}}!
      I noticed you mentioned {{keyword}}.
      Our {{product_name}} might be exactly what you need!
      {{call_to_action}}
    `
  })
});
```

---

## 📝 Notes

- All trigger words support exact, contains, regex, and fuzzy matching
- Products can be active/inactive without deletion
- Rate limits prevent spam (configurable per product)
- Buyer consent is automatically tracked
- System defaults provide 25 common trigger phrases
- AI analysis combines trigger detection with sentiment analysis
- Multiple products can match same buyer (highest score wins)

---

## 🤝 Support

For questions or issues:
1. Check the API responses for detailed error messages
2. Review the database views for analytics
3. Check console logs for debugging information
4. Ensure all migrations have been run successfully

---

**Version:** 1.0.0
**Last Updated:** 2025-11-04
