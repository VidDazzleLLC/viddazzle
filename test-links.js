#!/usr/bin/env node
/**
 * Link Testing Script for VidDazzle Application
 * Tests all internal and external links across the app
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Track all test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
  results.passed++;
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
  results.failed++;
  results.errors.push(message);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
  results.warnings++;
}

function logSection(message) {
  log(`\n${colors.bold}━━━ ${message} ━━━${colors.reset}`, colors.cyan);
}

// Make HTTP request and return promise
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Link-Tester/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Extract links from HTML
function extractLinks(html) {
  const links = {
    internal: [],
    external: []
  };

  // Extract href attributes
  const hrefMatches = html.matchAll(/href=["']([^"']+)["']/g);
  for (const match of hrefMatches) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      links.external.push(href);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      links.internal.push(href);
    }
  }

  return links;
}

// Test a page and extract its links
async function testPage(path, description) {
  logSection(`Testing ${description} (${path})`);

  try {
    const response = await makeRequest(`${BASE_URL}${path}`);

    // Check status code
    if (response.statusCode === 200) {
      logSuccess(`Page loads successfully (${response.statusCode})`);
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      logWarning(`Page redirects (${response.statusCode} -> ${response.headers.location})`);
    } else {
      logError(`Page returned error status (${response.statusCode})`);
    }

    // Extract and report links
    const links = extractLinks(response.body);

    if (links.internal.length > 0) {
      log(`\nFound ${links.internal.length} internal link(s):`);
      links.internal.forEach(link => log(`  → ${link}`, colors.blue));
    }

    if (links.external.length > 0) {
      log(`\nFound ${links.external.length} external link(s):`);
      links.external.forEach(link => log(`  → ${link}`, colors.blue));
    }

    // Test internal links
    for (const link of links.internal) {
      await testInternalLink(link);
    }

    // Test external links (just check they're valid URLs)
    for (const link of links.external) {
      testExternalLink(link);
    }

    return { success: true, links, body: response.body };
  } catch (error) {
    logError(`Failed to load page: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test an internal link
async function testInternalLink(path) {
  try {
    const response = await makeRequest(`${BASE_URL}${path}`);

    if (response.statusCode === 200) {
      logSuccess(`Internal link works: ${path}`);
    } else if (response.statusCode >= 300 && response.statusCode < 400) {
      logWarning(`Internal link redirects: ${path} -> ${response.headers.location}`);
    } else if (response.statusCode === 401 || response.statusCode === 403) {
      logWarning(`Internal link requires auth: ${path} (${response.statusCode})`);
    } else {
      logError(`Internal link broken: ${path} (${response.statusCode})`);
    }
  } catch (error) {
    logError(`Internal link failed: ${path} - ${error.message}`);
  }
}

// Test an external link (just validate URL format)
function testExternalLink(url) {
  try {
    new URL(url);
    logSuccess(`External link valid: ${url}`);
  } catch (error) {
    logError(`External link invalid: ${url} - ${error.message}`);
  }
}

// Check if Stripe link is valid
function checkStripeLinkFormat(html) {
  logSection('Checking Stripe Payment Link');

  const stripeMatch = html.match(/href=["'](https:\/\/buy\.stripe\.com\/[^"']+)["']/);

  if (stripeMatch) {
    const stripeUrl = stripeMatch[1];
    logSuccess(`Stripe link found: ${stripeUrl}`);

    // Validate format
    if (stripeUrl.match(/^https:\/\/buy\.stripe\.com\/[a-zA-Z0-9]+$/)) {
      logSuccess('Stripe link format is valid');
    } else {
      logWarning('Stripe link format looks unusual');
    }
  } else {
    logWarning('No Stripe payment link found on landing page');
  }
}

// Check forms
function checkForms(html, pageName) {
  logSection(`Checking Forms on ${pageName}`);

  const formMatches = html.matchAll(/<form[^>]*>/g);
  let formCount = 0;

  for (const match of formMatches) {
    formCount++;
    const formTag = match[0];

    // Check for action or onSubmit
    if (formTag.includes('action=') || formTag.includes('onSubmit')) {
      logSuccess(`Form ${formCount} has submit handler`);
    } else {
      logWarning(`Form ${formCount} missing submit handler`);
    }
  }

  if (formCount === 0) {
    log(`No forms found on ${pageName}`);
  }
}

// Main test runner
async function runTests() {
  log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════╗
║   VidDazzle Link Testing Suite              ║
║   Testing all links and navigation          ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

  log(`\nTarget: ${BASE_URL}\n`);

  // Test main pages
  const landingResult = await testPage('/', 'Landing Page');
  if (landingResult.success && landingResult.body) {
    checkStripeLinkFormat(landingResult.body);
    checkForms(landingResult.body, 'Landing Page');
  }

  const loginResult = await testPage('/login', 'Login Page');
  if (loginResult.success && loginResult.body) {
    checkForms(loginResult.body, 'Login Page');
  }

  // Test authenticated pages (will likely redirect or show 401)
  await testPage('/app', 'App Dashboard');
  await testPage('/social-listening', 'Social Listening Dashboard');

  // Test API endpoints (basic health check)
  logSection('Testing API Endpoints');
  await testInternalLink('/api/health');

  // Print summary
  log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════╗
║   Test Summary                               ║
╚══════════════════════════════════════════════╝
${colors.reset}`);

  log(`\n${colors.green}✓ Passed: ${results.passed}${colors.reset}`);
  log(`${colors.red}✗ Failed: ${results.failed}${colors.reset}`);
  log(`${colors.yellow}⚠ Warnings: ${results.warnings}${colors.reset}`);

  if (results.errors.length > 0) {
    log(`\n${colors.bold}${colors.red}Errors encountered:${colors.reset}`);
    results.errors.forEach((error, index) => {
      log(`  ${index + 1}. ${error}`, colors.red);
    });
  }

  log('');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
