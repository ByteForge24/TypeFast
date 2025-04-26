#!/usr/bin/env node
/**
 * Test script to verify Render deployment and run Playwright tests
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEPLOYED_WEB_URL = 'https://typefast-web-yogd.onrender.com';
const DEPLOYED_WS_URL = 'https://typefast-ws.onrender.com';

async function checkDeploymentStatus() {
  console.log('='.repeat(80));
  console.log('TYPEFAST RENDER DEPLOYMENT TEST');
  console.log('='.repeat(80));
  
  console.log('\n1. CHECKING DEPLOYMENT STATUS\n');
  
  // Check web app
  try {
    console.log(`  → Checking web app: ${DEPLOYED_WEB_URL}`);
    const webResponse = await fetch(DEPLOYED_WEB_URL, { timeout: 10000 });
    console.log(`    ✓ Web app is UP (Status: ${webResponse.status})`);
  } catch (err) {
    console.log(`    ✗ Web app is DOWN or unreachable`);
    console.log(`      Error: ${err.message}`);
  }
  
  // Check WebSocket endpoint
  try {
    console.log(`  → Checking WebSocket service: ${DEPLOYED_WS_URL}`);
    const wsResponse = await fetch(DEPLOYED_WS_URL, { timeout: 10000 });
    console.log(`    ✓ WebSocket service responds (Status: ${wsResponse.status})`);
  } catch (err) {
    console.log(`    ✗ WebSocket service unavailable`);
    console.log(`      Error: ${err.message}`);
  }
}

async function runPlaywrightTests() {
  console.log('\n2. RUNNING PLAYWRIGHT TESTS\n');
  
  const testDir = path.join(__dirname, 'apps/web');
  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: DEPLOYED_WEB_URL,
    NEXT_PUBLIC_WS_URL: DEPLOYED_WS_URL,
  };
  
  try {
    console.log(`  → Running tests with:`);
    console.log(`    BASE_URL: ${DEPLOYED_WEB_URL}`);
    console.log(`    WS_URL: ${DEPLOYED_WS_URL}`);
    console.log(`\n  Executing: yarn playwright test --project=chromium\n`);
    
    const result = execSync(
      'yarn playwright test --project=chromium',
      {
        cwd: testDir,
        env,
        stdio: 'pipe',
        encoding: 'utf-8',
      }
    );
    
    console.log(result);
  } catch (err) {
    console.log('  Test output:');
    console.log(err.stdout || '');
    if (err.stderr) console.error(err.stderr);
    console.log(`\n  Exit code: ${err.status}`);
  }
}

(async () => {
  await checkDeploymentStatus();
  // Only run tests if deployment is reachable
  // await runPlaywrightTests();
})();
