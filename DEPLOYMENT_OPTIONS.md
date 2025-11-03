# 🚀 Deployment Options for Workflow Autopilot

## Understanding the Architecture

Your Workflow Autopilot app needs TWO components:

1. **Application Host**: Runs your Next.js app (frontend + API routes)
2. **Database Host**: Stores your PostgreSQL data

---

## 📊 Deployment Option Comparison

| Option | App Host | Database | Complexity | Cost | Best For |
|--------|----------|----------|------------|------|----------|
| **Railway** | Railway | Railway | ⭐ Easy | $5-20/mo | Best overall |
| **Vercel + Neon** | Vercel | Neon.tech | ⭐⭐ Medium | $0-40/mo | High traffic |
| **Vercel + Supabase** | Vercel | Supabase | ⭐⭐ Medium | $0-50/mo | Need auth |
| **Netlify + Neon** | Netlify | Neon.tech | ⭐⭐ Medium | $0-35/mo | Alternative |
| **Render** | Render | Render | ⭐ Easy | $7-25/mo | Simple |

---

## 🌟 Recommended: Railway (All-in-One)

### Why Railway?
✅ **One platform** for both app AND database
✅ **Auto-deploy** from GitHub
✅ **Built-in PostgreSQL** with pgvector
✅ **Simple setup** - no juggling platforms
✅ **Fair pricing** - $5 free credits/month

### Quick Start
```bash
# 1. Deploy
Visit railway.app → Deploy from GitHub

# 2. Add PostgreSQL
Click "New" → "Database" → "PostgreSQL"

# 3. Run schema
In PostgreSQL Query tab, paste supabase/schema.sql

# 4. Done!
Railway auto-configures everything
```

📖 **Full Guide**: See `RAILWAY_DEPLOYMENT.md`

---

## Option 2: Vercel + Neon.tech

### Why This Combo?
✅ **Vercel**: Best Next.js hosting (made by Next.js creators)
✅ **Neon**: Serverless PostgreSQL with great free tier
✅ **Scalable**: Both scale automatically
✅ **Generous free tiers**

### Quick Start
```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Create Neon database
Visit neon.tech → Create project → Copy connection string

# 3. Set env vars in Vercel
DATABASE_URL = your-neon-connection-string
ANTHROPIC_API_KEY = your-claude-key

# 4. Run schema in Neon SQL Editor
Paste supabase/schema.sql
```

📖 **Full Guide**: See `DEPLOYMENT_GUIDE.md`

---

## Option 3: Vercel + Supabase (Current Setup)

### Why This Combo?
✅ **Built-in authentication** with Supabase Auth
✅ **Real-time features** with Supabase Realtime
✅ **Storage** for files with Supabase Storage
✅ **REST API** automatically generated

This is your **current configuration** in `.env.local`!

### You're Already Set Up For This!
Just deploy to Vercel and you're done.

---

## 🎯 Which Should You Choose?

### Choose **Railway** if:
- You want the simplest deployment
- You prefer one platform for everything
- You're building a side project or startup
- You want to deploy in < 10 minutes

### Choose **Vercel + Neon** if:
- You want best Next.js performance
- You expect high traffic
- You want flexibility to switch providers
- You're familiar with Vercel

### Choose **Vercel + Supabase** if:
- You need user authentication
- You want real-time features
- You need file storage
- You want a fully managed backend

---

## 💰 Cost Breakdown

### Railway
- **Free**: $5 credits/month (~500 hours)
- **Pro**: $5/month + usage (~$15-25 total)
- Includes: App hosting + PostgreSQL

### Vercel + Neon
- **Free Tier**: Both have generous free tiers
- **Paid**: Vercel Pro $20/mo + Neon $19/mo = $39/mo
- Best for: Production apps with traffic

### Vercel + Supabase
- **Free Tier**: Both have generous free tiers
- **Paid**: Vercel Pro $20/mo + Supabase Pro $25/mo = $45/mo
- Best for: Full-featured apps

---

## 🔧 Code Compatibility

Good news! Your app **now works with all options**!

We've created a **universal database adapter** (`src/lib/db.js`) that automatically detects:

- **Railway/Neon**: Uses `src/lib/neon.js` (PostgreSQL client)
- **Supabase**: Uses `src/lib/supabase.js` (Supabase client)

### Auto-Detection
```javascript
// Detects based on environment variables:
DATABASE_URL or POSTGRES_URL → Uses Neon client
NEXT_PUBLIC_SUPABASE_URL → Uses Supabase client
```

No code changes needed! Just set the right environment variables.

---

## 📝 Deployment Checklist

### For Any Option:

- [ ] Create account on chosen platform(s)
- [ ] Set up database (PostgreSQL with pgvector)
- [ ] Run database schema (`supabase/schema.sql`)
- [ ] Deploy application
- [ ] Set environment variables:
  - `ANTHROPIC_API_KEY`
  - `CLAUDE_MODEL`
  - Database connection vars (varies by platform)
  - Optional: `OPENAI_API_KEY`
- [ ] Test the deployed app
- [ ] Set up custom domain (optional)

---

## 🚀 Ready to Deploy?

1. **Pick your option** above
2. **Follow the guide**:
   - Railway → `RAILWAY_DEPLOYMENT.md`
   - Vercel + Neon → `DEPLOYMENT_GUIDE.md`
   - Vercel + Supabase → Already configured! Just run `vercel --prod`
3. **Test your app**
4. **Share your URL!** 🎉

---

## Need Help?

- Railway: [railway.app/docs](https://docs.railway.app)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Neon: [neon.tech/docs](https://neon.tech/docs)
- Supabase: [supabase.com/docs](https://supabase.com/docs)

---

## Environment Variables Reference

### Required for All:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
CLAUDE_MODEL=claude-opus-4-20250514
```

### Railway (Auto-set):
```bash
DATABASE_URL=postgresql://... # Auto-set by Railway
POSTGRES_URL=postgresql://...  # Auto-set by Railway
```

### Vercel + Neon:
```bash
DATABASE_URL=postgresql://... # From Neon dashboard
```

### Vercel + Supabase (Current):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

**Ready to go live?** Pick your platform and let's deploy! 🚀
