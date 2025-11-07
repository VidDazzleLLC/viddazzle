/**
 * Universal Database Adapter
 * Automatically detects and uses the appropriate database client:
 * - Neon/Railway/Vercel Postgres (via DATABASE_URL or POSTGRES_URL)
 * - Supabase (via NEXT_PUBLIC_SUPABASE_URL)
 */

// Import both clients
import * as neonClient from './neon.js';
import * as supabaseClient from './supabase.js';

// Detect which database client to use
const hasPostgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Validate DATABASE_URL is not using Railway internal hostname
if (hasPostgresUrl && (hasPostgresUrl.includes('railway.internal') || hasPostgresUrl.includes('postgres.railway.internal'))) {
  const errorMessage = `
❌ CRITICAL DATABASE CONFIGURATION ERROR ❌

DATABASE_URL is using Railway's internal hostname: ${hasPostgresUrl.split('@')[1]?.split('/')[0] || 'railway.internal'}

This hostname ONLY works within Railway's private network.
Your app is deployed on Vercel, which CANNOT access Railway's internal network.

SOLUTION:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update DATABASE_URL to use one of these:

   Option A - Neon PostgreSQL (recommended):
   postgresql://neondb_owner:...@ep-....neon.tech/neondb

   Option B - Railway External URL:
   postgresql://postgres:...@containers-us-west-xxx.railway.app:5432/railway
   OR
   postgresql://postgres:...@randomname.proxy.rlwy.net:12345/railway

3. Save and redeploy your application

See docs/VERCEL_DATABASE_FIX.md for detailed instructions.

NEVER use these from Vercel:
❌ postgres.railway.internal (Railway internal only)
❌ localhost or 127.0.0.1 (local only)
`;

  throw new Error(errorMessage);
}

let dbClient;

if (hasPostgresUrl) {
  console.log('🔌 Using Neon/PostgreSQL client');
  dbClient = neonClient;
} else if (hasSupabaseUrl) {
  console.log('🔌 Using Supabase client');
  dbClient = supabaseClient;
} else {
  console.warn('⚠️  No database configuration found!');
  // Provide mock functions for development
  dbClient = {
    createWorkflow: async () => ({ id: 'mock', name: 'Mock Workflow' }),
    getWorkflows: async () => [],
    getWorkflow: async (id) => ({ id, name: 'Mock Workflow' }),
    updateWorkflow: async (id, data) => ({ id, ...data }),
    deleteWorkflow: async () => {},
    createExecution: async (data) => ({ id: 'mock-exec', ...data }),
    updateExecution: async (id, data) => ({ id, ...data }),
    getExecutions: async () => [],
    searchTutorials: async () => [],
    insertTutorialEmbedding: async (content) => ({ id: 'mock-tutorial', content }),
    logToolUsage: async (data) => ({ id: 'mock-log', ...data }),
    getConnectors: async () => [],
    upsertConnector: async (data) => ({ id: 'mock-connector', ...data }),
    query: async () => ({ rows: [] }),
  };
}

// Export all database functions
export const createWorkflow = dbClient.createWorkflow;
export const getWorkflows = dbClient.getWorkflows;
export const getWorkflow = dbClient.getWorkflow;
export const updateWorkflow = dbClient.updateWorkflow;
export const deleteWorkflow = dbClient.deleteWorkflow;
export const createExecution = dbClient.createExecution;
export const updateExecution = dbClient.updateExecution;
export const getExecutions = dbClient.getExecutions;
export const searchTutorials = dbClient.searchTutorials;
export const insertTutorialEmbedding = dbClient.insertTutorialEmbedding;
export const logToolUsage = dbClient.logToolUsage;
export const getConnectors = dbClient.getConnectors;
export const upsertConnector = dbClient.upsertConnector;
export const supabase = dbClient.supabase || dbClient.default;
export const supabaseAdmin = dbClient.supabaseAdmin;
export const query = dbClient.query;

export default dbClient;
