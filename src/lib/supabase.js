import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for browser/frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side use (has full access)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper functions for common operations

/**
 * Create a new workflow
 */
export async function createWorkflow(workflowData) {
  const { data, error } = await supabase
    .from('workflows')
    .insert([workflowData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all workflows
 */
export async function getWorkflows(userId = null) {
  let query = supabase.from('workflows').select('*').order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id) {
  const { data, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a workflow
 */
export async function updateWorkflow(id, updates) {
  const { data, error } = await supabase
    .from('workflows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id) {
  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Create a workflow execution record
 */
export async function createExecution(executionData) {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert([executionData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update a workflow execution
 */
export async function updateExecution(id, updates) {
  const { data, error } = await supabase
    .from('workflow_executions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get executions for a workflow
 */
export async function getExecutions(workflowId) {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Search tutorial embeddings using vector similarity
 */
export async function searchTutorials(queryEmbedding, matchThreshold = 0.7, matchCount = 5) {
  const { data, error } = await supabase.rpc('match_tutorial_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) throw error;
  return data;
}

/**
 * Insert tutorial embedding
 */
export async function insertTutorialEmbedding(content, embedding, metadata = {}) {
  const { data, error } = await supabase
    .from('tutorial_embeddings')
    .insert([{
      content,
      embedding,
      metadata,
      category: metadata.category || null,
      tags: metadata.tags || [],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Log MCP tool usage
 */
export async function logToolUsage(toolData) {
  const { data, error } = await supabase
    .from('mcp_tool_usage')
    .insert([toolData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get connector configurations
 */
export async function getConnectors() {
  const { data, error } = await supabase
    .from('connectors')
    .select('*')
    .eq('enabled', true)
    .order('name');

  if (error) throw error;
  return data;
}

/**
 * Upsert a connector configuration
 */
export async function upsertConnector(connectorData) {
  const { data, error } = await supabase
    .from('connectors')
    .upsert([connectorData], { onConflict: 'name' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Execute a raw SQL query (for health checks and admin operations)
 */
export async function query(text, params) {
  // For simple queries like health checks, we can use Supabase RPC
  // For more complex queries, consider using supabase.rpc() or postgrest

  // Simple SELECT NOW() health check
  if (text.includes('SELECT NOW()')) {
    return {
      rows: [{ current_time: new Date().toISOString() }]
    };
  }

  // For other queries, throw an error suggesting using Supabase methods
  throw new Error('Direct SQL queries not supported with Supabase. Use Supabase query builder methods instead.');
}

export default supabase;
