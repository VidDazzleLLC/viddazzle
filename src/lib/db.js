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
