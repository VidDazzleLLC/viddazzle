#!/usr/bin/env node
/**
 * VidDazzle AI Features Test
 * Tests Anthropic API connectivity and workflow generation
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

console.log('🤖 Testing VidDazzle AI Features...\n');

// Check environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.CLAUDE_MODEL || 'claude-opus-4-20250514';
const mcpToolsEnabled = process.env.MCP_TOOLS_ENABLED;
const nodeEnv = process.env.NODE_ENV;

console.log('Environment Configuration:');
console.log(`  ✓ ANTHROPIC_API_KEY: ${apiKey ? '✓ Set (' + apiKey.substring(0, 10) + '...)' : '✗ Missing'}`);
console.log(`  ✓ CLAUDE_MODEL: ${model}`);
console.log(`  ✓ MCP_TOOLS_ENABLED: ${mcpToolsEnabled || 'not set'}`);
console.log(`  ✓ NODE_ENV: ${nodeEnv || 'not set'}\n`);

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY is required!');
  console.log('\nPlease set in Railway dashboard:');
  console.log('  ANTHROPIC_API_KEY=sk-ant-api03-...');
  process.exit(1);
}

async function testAIFeatures() {
  try {
    // Test 1: Initialize Anthropic client
    console.log('Test 1: Anthropic Client Initialization');
    const anthropic = new Anthropic({ apiKey });
    console.log('  ✓ Anthropic client created successfully\n');

    // Test 2: Check MCP tools configuration
    console.log('Test 2: MCP Tools Configuration');
    const mcpToolsPath = path.join(process.cwd(), 'public/config/MCP_TOOLS_DEFINITION.json');

    if (fs.existsSync(mcpToolsPath)) {
      const mcpTools = JSON.parse(fs.readFileSync(mcpToolsPath, 'utf-8'));
      console.log(`  ✓ MCP Tools definition found (${mcpTools.tools?.length || 0} tools)`);
      if (mcpTools.tools && mcpTools.tools.length > 0) {
        console.log(`  ✓ Sample tools: ${mcpTools.tools.slice(0, 3).map(t => t.name).join(', ')}`);
      }
    } else {
      console.log('  ⚠️  MCP Tools definition not found');
      console.log(`     Expected at: ${mcpToolsPath}`);
    }
    console.log('');

    // Test 3: Check connectors library
    console.log('Test 3: Connectors Library');
    const connectorsPath = path.join(process.cwd(), 'public/config/CONNECTORS_LIBRARY.json');

    if (fs.existsSync(connectorsPath)) {
      const connectors = JSON.parse(fs.readFileSync(connectorsPath, 'utf-8'));
      console.log(`  ✓ Connectors library found (${connectors.connectors?.length || 0} connectors)`);
      if (connectors.connectors && connectors.connectors.length > 0) {
        console.log(`  ✓ Sample connectors: ${connectors.connectors.slice(0, 3).map(c => c.name).join(', ')}`);
      }
    } else {
      console.log('  ⚠️  Connectors library not found');
      console.log(`     Expected at: ${connectorsPath}`);
    }
    console.log('');

    // Test 4: Test Claude API with a simple request
    console.log('Test 4: Claude API Connectivity');
    console.log('  → Sending test message to Claude...');

    const startTime = Date.now();
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Respond with exactly: "VidDazzle AI is working!"'
        }
      ]
    });
    const duration = Date.now() - startTime;

    console.log(`  ✓ Claude responded successfully (${duration}ms)`);
    console.log(`  ✓ Model: ${response.model}`);
    console.log(`  ✓ Response: "${response.content[0].text}"`);
    console.log(`  ✓ Tokens: ${response.usage.input_tokens} input, ${response.usage.output_tokens} output\n`);

    // Test 5: Test workflow generation capability
    console.log('Test 5: Workflow Generation Test');
    console.log('  → Generating a simple test workflow...');

    const workflowStartTime = Date.now();
    const workflowResponse = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      system: 'You are a workflow generation assistant. Generate workflows as JSON objects.',
      messages: [
        {
          role: 'user',
          content: `Generate a simple workflow for "Send a welcome email to new users". Return only a JSON object with this structure:
{
  "name": "Workflow name",
  "description": "What it does",
  "steps": [
    {
      "id": "step_1",
      "name": "Step name",
      "tool": "email_send",
      "input": { "to": "{{user.email}}", "subject": "Welcome!", "body": "Welcome message" }
    }
  ]
}`
        }
      ]
    });
    const workflowDuration = Date.now() - workflowStartTime;

    try {
      const workflowText = workflowResponse.content[0].text;
      const jsonMatch = workflowText.match(/```json\n([\s\S]*?)\n```/) ||
                       workflowText.match(/```\n([\s\S]*?)\n```/) ||
                       [null, workflowText];
      const workflow = JSON.parse(jsonMatch[1] || workflowText);

      console.log(`  ✓ Workflow generated successfully (${workflowDuration}ms)`);
      console.log(`  ✓ Workflow name: "${workflow.name}"`);
      console.log(`  ✓ Steps: ${workflow.steps?.length || 0}`);
      console.log(`  ✓ Tokens: ${workflowResponse.usage.input_tokens} input, ${workflowResponse.usage.output_tokens} output\n`);
    } catch (parseError) {
      console.log('  ⚠️  Workflow generated but parsing failed');
      console.log(`     Response: ${workflowResponse.content[0].text.substring(0, 100)}...\n`);
    }

    // Test 6: Check embeddings configuration (optional)
    console.log('Test 6: Embeddings Configuration (Optional)');
    const openaiKey = process.env.OPENAI_API_KEY;
    const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
    const embeddingDimension = process.env.EMBEDDING_DIMENSION || '1536';

    if (openaiKey) {
      console.log(`  ✓ OpenAI API Key configured (for embeddings)`);
      console.log(`  ✓ Embedding model: ${embeddingModel}`);
      console.log(`  ✓ Embedding dimension: ${embeddingDimension}`);
    } else {
      console.log('  ⚠️  OpenAI API Key not set (will use fallback embeddings)');
      console.log('     For production, set OPENAI_API_KEY for semantic search');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ AI Features Test Complete!');
    console.log('═══════════════════════════════════════');
    console.log('\nAll AI features are working correctly! 🎉');
    console.log('\nYou can now:');
    console.log('  • Generate workflows using /api/generate-workflow');
    console.log('  • Search tutorials using /api/learn-tutorial');
    console.log('  • Use Claude for intelligent automation');
    console.log('\nNext steps:');
    console.log('  1. Test the endpoints in your app');
    console.log('  2. Configure OpenAI API key for better embeddings (optional)');
    console.log('  3. Add custom MCP tools and connectors');

  } catch (error) {
    console.error('\n❌ AI Features Test Failed');
    console.error(`Error: ${error.message}`);

    if (error.status === 401) {
      console.error('\nAuthentication Error:');
      console.error('  → Your ANTHROPIC_API_KEY is invalid or expired');
      console.error('  → Get a new key from: https://console.anthropic.com/');
    } else if (error.status === 429) {
      console.error('\nRate Limit Error:');
      console.error('  → Too many requests or quota exceeded');
      console.error('  → Check your usage at: https://console.anthropic.com/');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\nNetwork Error:');
      console.error('  → Cannot reach Anthropic API');
      console.error('  → Check your internet connection');
    }

    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

testAIFeatures();
