# Supabase Database Setup

Your VidDazzle app is now configured to use your existing Supabase database instead of multiple platforms.

## ✅ Completed Setup

1. **Supabase Client**: Created at `lib/supabase.ts`
2. **Environment Variables**: Updated with your real Supabase credentials
3. **Dependencies**: Removed unnecessary Neon database packages

## 🚀 Next Steps - Initialize Your Database

### Step 1: Run the Schema SQL

Go to your Supabase SQL Editor:
https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/sql/new

Copy and paste the contents of `supabase/schema.sql` and click **RUN**.

This will create:
- ✅ `workflows` table - Store your automation workflows
- ✅ `workflow_executions` table - Track workflow runs
- ✅ `tutorial_embeddings` table - AI learning data with vector embeddings
- ✅ `mcp_tool_usage` table - Track MCP tool usage
- ✅ `connectors` table - Store integration configurations
- ✅ pgvector extension - For AI similarity search

### Step 2: Verify the Setup

After running the schema, verify tables were created:

```bash
node test-supabase.js
```

You should see:
```
✓ Supabase client created
✓ Database connection successful
✓ Workflows table exists
```

### Step 3: Start Your App

```bash
npm run dev
```

Your app will now use Supabase for all database operations!

## 📊 Database Structure

Your database includes:

- **Workflows**: Store and manage automation workflows
- **Executions**: Track every workflow run with logs
- **Embeddings**: AI-powered tutorial and learning system
- **MCP Tools**: Monitor tool usage and performance
- **Connectors**: Manage external service integrations

## 🔗 Useful Links

- **Database Dashboard**: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/database/tables
- **SQL Editor**: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/sql/new
- **Table Editor**: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/editor
- **API Settings**: https://supabase.com/dashboard/project/rhbqgquapitkwazhqpdc/settings/api

## 🛠️ Using the Supabase Client

### In Client Components:
```typescript
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase
  .from('workflows')
  .select('*');
```

### In Server Components/API Routes:
```typescript
import { getServerSupabase } from '@/lib/supabase';

const supabase = getServerSupabase();
const { data, error } = await supabase
  .from('workflows')
  .select('*');
```

## 🎯 Benefits of This Setup

- ✅ **Single Platform**: No need to juggle Neon, Railway, and other services
- ✅ **Integrated**: Supabase provides database, auth, storage, and realtime
- ✅ **Scalable**: Automatic backups and scaling
- ✅ **Cost-Effective**: Free tier is generous for development
- ✅ **Better DX**: Built-in SQL editor and table viewer

## 🔒 Security Notes

- Your `.env` file contains sensitive keys and is gitignored
- Never commit real credentials to version control
- Use `.env.example` as a template for new environments
- The service role key has admin access - use carefully in server-side code only
