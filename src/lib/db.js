/**
 * Universal Database Adapter
 * Automatically detects and uses the appropriate database client:
 * - Neon/Railway/Vercel Postgres (via DATABASE_URL or POSTGRES_URL)
 * - Supabase (via NEXT_PUBLIC_SUPABASE_URL)
 */

// Detect which database client to use
const hasPostgresUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const hasSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

let dbClient;

if (hasPostgresUrl) {
  console.log('🔌 Using Neon/PostgreSQL client');
  dbClient = require('./neon');
} else if (hasSupabaseUrl) {
  console.log('🔌 Using Supabase client');
  dbClient = require('./supabase');
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
  };
}

// Export all database functions
export const {
  createWorkflow,
  getWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  createExecution,
  updateExecution,
  getExecutions,
  searchTutorials,
  insertTutorialEmbedding,
  logToolUsage,
  getConnectors,
  upsertConnector,
  supabase,
  supabaseAdmin,
  query,
} = dbClient;

export default dbClient;
