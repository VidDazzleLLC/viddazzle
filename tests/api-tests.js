/**
 * Comprehensive API Test Suite for Workflow Autopilot
 * Run with: node tests/api-tests.js
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

async function testEndpoint(name, method, endpoint, body = null) {
  console.log(`\n${colors.blue}━━━ Testing: ${name} ━━━${colors.reset}`);

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    log(
      response.ok ? colors.green : colors.yellow,
      response.ok ? '✓' : '⚠',
      `Status: ${response.status} ${response.statusText}`
    );

    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));

    return { success: response.ok, data, status: response.status };
  } catch (error) {
    log(colors.red, '✗', `Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test suite
async function runTests() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  🧪 Workflow Autopilot API Test Suite`);
  console.log(`  📍 Base URL: ${BASE_URL}`);
  console.log(`${'='.repeat(60)}\n`);

  const results = [];

  // Test 1: Health check (GET /)
  results.push(
    await testEndpoint('Homepage Load', 'GET', '/')
  );

  // Test 2: Get workflows
  results.push(
    await testEndpoint('Get All Workflows', 'GET', '/api/workflows')
  );

  // Test 3: Generate workflow
  results.push(
    await testEndpoint('Generate Workflow', 'POST', '/api/generate-workflow', {
      prompt: 'Send a test email to admin@example.com with subject "Test"',
      save: true,
    })
  );

  // Test 4: Execute workflow (requires workflow ID from previous test)
  const workflowId = results[2]?.data?.saved?.id;
  if (workflowId) {
    results.push(
      await testEndpoint('Execute Workflow', 'POST', '/api/execute-workflow', {
        workflowId,
      })
    );
  } else {
    log(colors.yellow, '⊘', 'Skipping workflow execution (no workflow ID)');
  }

  // Test 5: Learning system - Store tutorial
  results.push(
    await testEndpoint('Store Tutorial', 'POST', '/api/learn-tutorial', {
      content: 'How to create automated email workflows using the Workflow Autopilot platform.',
      metadata: {
        title: 'Email Automation Tutorial',
        difficulty: 'beginner',
      },
      category: 'automation',
      tags: ['email', 'tutorial', 'automation'],
    })
  );

  // Test 6: Learning system - Search tutorials
  results.push(
    await testEndpoint(
      'Search Tutorials',
      'GET',
      '/api/learn-tutorial?query=email automation&matchCount=3'
    )
  );

  // Test 7: Create workflow (direct API)
  results.push(
    await testEndpoint('Create Workflow (Direct)', 'POST', '/api/workflows', {
      name: 'Test Workflow',
      description: 'A test workflow created via API',
      steps: [
        {
          id: 'step1',
          tool: 'file_read',
          config: { path: '/tmp/test.txt' },
        },
      ],
      status: 'draft',
    })
  );

  // Test 8: Update workflow
  const createdWorkflowId = results[6]?.data?.workflow?.id;
  if (createdWorkflowId) {
    results.push(
      await testEndpoint('Update Workflow', 'PUT', '/api/workflows', {
        id: createdWorkflowId,
        status: 'active',
      })
    );
  }

  // Test 9: Delete workflow
  if (createdWorkflowId) {
    results.push(
      await testEndpoint('Delete Workflow', 'DELETE', `/api/workflows?id=${createdWorkflowId}`)
    );
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  📊 Test Summary`);
  console.log(`${'='.repeat(60)}\n`);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  log(colors.green, '✓', `Passed: ${passed}/${total}`);
  if (failed > 0) {
    log(colors.red, '✗', `Failed: ${failed}/${total}`);
  }
  log(colors.blue, 'ℹ', `Total: ${total} tests`);

  console.log(`\n${'='.repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
