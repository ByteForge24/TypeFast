#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const testFiles = [
  { path: 'apps/web/db/user.test.mjs', name: 'Database: User Layer' },
  { path: 'apps/web/auth.test.mjs', name: 'Authentication & Sessions' },
  { path: 'apps/web/app/api/api.test.mjs', name: 'API Routes' },
  { path: 'apps/web/actions/register.test.mjs', name: 'Registration Actions' },
  { path: 'apps/ws/src/websocket.test.mjs', name: 'WebSocket Server' },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('TypeFast Backend Test Suite - Execution Report');
console.log('═══════════════════════════════════════════════════════════════\n');

let totalPass = 0;
let totalFail = 0;
let completedTests = 0;

async function runTest(file) {
  return new Promise((resolve) => {
    const child = spawn('node', ['--test', file.path], {
      cwd: process.cwd(),
      stdio: 'pipe',
    });

    let output = '';
    let passed = 0;
    let failed = 0;

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      // Parse output for test counts
      const passMatch = output.match(/ℹ pass (\d+)/);
      const failMatch = output.match(/ℹ fail (\d+)/);

      passed = passMatch ? parseInt(passMatch[1]) : 0;
      failed = failMatch ? parseInt(failMatch[1]) : 0;

      totalPass += passed;
      totalFail += failed;
      completedTests++;

      const status = failed === 0 ? '✓' : '✗';
      console.log(`${status} ${file.name}`);
      console.log(`  Tests: ${passed} passed${failed > 0 ? `, ${failed} failed` : ''}`);

      if (output.includes('✖ failing tests')) {
        const failLines = output.split('\n').filter(l => l.includes('✖'));
        failLines.slice(0, 3).forEach(l => console.log(`    ${l.trim()}`));
      }
      console.log();

      resolve({ passed, failed });
    });
  });
}

(async () => {
  for (const test of testFiles) {
    await runTest(test);
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('FINAL RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${totalPass + totalFail}`);
  console.log(`Passed: ${totalPass}`);
  console.log(`Failed: ${totalFail}`);
  console.log(`Status: ${totalFail === 0 ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  process.exit(totalFail > 0 ? 1 : 0);
})();
