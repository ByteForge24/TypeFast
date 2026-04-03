#!/usr/bin/env node
/**
 * Git History Rewrite - Nov 1 to Dec 31, 2025
 * Self-contained Node.js solution
 * Redistributes all commits with dynamic timestamp calculation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const START_DATE = new Date('2025-11-01T00:00:00+0530');
const END_DATE = new Date('2025-12-31T23:59:59+0530');
const AUTHOR_NAME = 'hkrishna8124';
const AUTHOR_EMAIL = 'hkrishna8124@gmail.com';
const TZ_OFFSET = '+0530';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  Git History Rewrite - Nov 1 to Dec 31, 2025           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Verify git repo
try {
  execSync('git rev-parse --git-dir', { stdio: 'pipe' });
} catch {
  console.error('✗ Not a git repository');
  process.exit(1);
}

// Verify backup
try {
  execSync('git rev-parse --verify backup-before-rewrite-nov-dec', { stdio: 'pipe' });
  console.log('✓ Backup branch exists: backup-before-rewrite-nov-dec\n');
} catch {
  console.error('✗ Backup branch not found');
  console.error('Run: git branch backup-before-rewrite-nov-dec');
  process.exit(1);
}

// Get commits
let commits;
try {
  const output = execSync('git rev-list --reverse HEAD', { encoding: 'utf8' });
  commits = output.trim().split('\n').filter(c => c.length > 0);
} catch (e) {
  console.error('✗ Failed to get commits:', e.message);
  process.exit(1);
}

const commitCount = commits.length;
const startUnix = Math.floor(START_DATE.getTime() / 1000);
const endUnix = Math.floor(END_DATE.getTime() / 1000);
const totalSeconds = endUnix - startUnix;
const intervalSeconds = Math.floor(totalSeconds / commitCount);

console.log('Configuration:');
console.log(`  Start: ${START_DATE.toISOString()} (Unix: ${startUnix})`);
console.log(`  End:   ${END_DATE.toISOString()} (Unix: ${endUnix})`);
console.log(`  Range: ${totalSeconds} seconds`);
console.log(`  Commits: ${commitCount}`);
console.log(`  Interval: ~${intervalSeconds} seconds (~${(intervalSeconds / 3600).toFixed(1)} hours)\n`);

// Build commit → timestamp mapping
const commitMap = new Map();
let currentTimestamp = startUnix;

console.log('→ Generating timestamps...');
for (let i = 0; i < commits.length; i++) {
  const commit = commits[i];
  
  // Add variance (0-30% of interval)
  const variance = Math.floor(Math.random() * (intervalSeconds * 0.3));
  currentTimestamp += variance;
  
  // Ensure within range
  if (currentTimestamp > endUnix) {
    currentTimestamp = endUnix - Math.floor(Math.random() * 86400);
  }
  
  // Add time-of-day variation
  const date = new Date(currentTimestamp * 1000);
  const dayOfWeek = date.getDay();
  const hour = (dayOfWeek === 0 || dayOfWeek === 6)
    ? Math.floor(Math.random() * 6) + 10  // weekend: 10-16
    : Math.floor(Math.random() * 10) + 9; // weekday: 9-18
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  const adjustedDate = new Date(date);
  adjustedDate.setHours(hour, minute, second, 0);
  const adjustedTimestamp = Math.floor(adjustedDate.getTime() / 1000);
  
  commitMap.set(commit, adjustedTimestamp);
  
  if ((i + 1) % 50 === 0) {
    console.log(`  [${i + 1}/${commitCount}] Timestamp generated`);
  }
  
  currentTimestamp += intervalSeconds;
}

console.log(`✓ Generated ${commitCount} timestamps\n`);

// Create filter script
const filterScript = path.join(__dirname, 'git-filter-env-nov-dec.sh');
const scriptContent = `#!/bin/bash
# Auto-generated git filter-branch environment script
# This script sets timestamps for each commit

# Commit → timestamp mapping (bash associative array)
declare -A TIMESTAMPS=(
${Array.from(commitMap.entries())
  .map(([commit, ts]) => `  ["${commit}"]=${ts}`)
  .join('\n')}
)

COMMIT=\$GIT_COMMIT
TIMESTAMP=\${TIMESTAMPS[\$COMMIT]}

# Fallback (should not happen)
if [ -z "\$TIMESTAMP" ]; then
  TIMESTAMP=$((${startUnix} + ${intervalSeconds}))
fi

TZ_OFFSET="${TZ_OFFSET}"

export GIT_AUTHOR_DATE="\$TIMESTAMP \$TZ_OFFSET"
export GIT_COMMITTER_DATE="\$TIMESTAMP \$TZ_OFFSET"
export GIT_AUTHOR_NAME="${AUTHOR_NAME}"
export GIT_AUTHOR_EMAIL="${AUTHOR_EMAIL}"
export GIT_COMMITTER_NAME="${AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${AUTHOR_EMAIL}"
`;

fs.writeFileSync(filterScript, scriptContent, { encoding: 'utf8', mode: 0o755 });

console.log(`✓ Filter script created: ${filterScript}\n`);

// Show warning
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ⚠️  WARNING - DESTRUCTIVE OPERATION                      ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log('║  This will rewrite your entire commit history              ║');
console.log(`║  Dates will be set to: Nov 1 - Dec 31, 2025              ║`);
console.log(`║  Author: ${AUTHOR_NAME} <${AUTHOR_EMAIL}>         ║`);
console.log('║  Backup branch: backup-before-rewrite-nov-dec             ║');
console.log('║  Force push required after rewrite                        ║');
console.log('║  Commits will be preserved but timestamps changed         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Continue with history rewrite? (yes/no): ', (answer) => {
  rl.close();
  
  if (answer !== 'yes') {
    console.log('Cancelled.\n');
    fs.unlinkSync(filterScript);
    process.exit(0);
  }
  
  console.log('\n→ Running git filter-branch...');
  console.log('  This may take 1-5 minutes\n');
  
  try {
    execSync(`git filter-branch -f --env-filter "bash ${filterScript}" -- --all`, {
      stdio: 'inherit'
    });
    
    console.log('\n✓ Rewrite complete!\n');
    
    // Cleanup
    try {
      execSync('git update-ref -d refs/original/refs/heads/main', { stdio: 'pipe' });
    } catch {}
    
    fs.unlinkSync(filterScript);
    
    // Verification
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  VERIFICATION                                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const newCount = parseInt(execSync('git log --oneline | wc -l', { encoding: 'utf8' }));
    console.log(`✓ Commit count: ${newCount} (expected: ${commitCount})`);
    
    if (newCount !== commitCount) {
      console.error(`\n✗ ERROR: Commit mismatch! Expected ${commitCount}, got ${newCount}`);
      console.log(`Restore: git reset --hard backup-before-rewrite-nov-dec\n`);
      process.exit(1);
    }
    
    console.log('\nFirst 5 commits:');
    try {
      const first = execSync('git log --reverse --pretty=format:"%ai [%h] %s" | head -5', { encoding: 'utf8' });
      console.log(first.split('\n').map(l => '  ' + l).join('\n'));
    } catch {}
    
    console.log('\nLast 5 commits:');
    try {
      const last = execSync('git log --pretty=format:"%ai [%h] %s" | head -5', { encoding: 'utf8' });
      console.log(last.split('\n').map(l => '  ' + l).join('\n'));
    } catch {}
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  NEXT STEPS                                                 ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log('║  1. Verify dates are in Nov-Dec 2025:                      ║');
    console.log('║     git log --pretty=fuller | head -30                     ║');
    console.log('║                                                              ║');
    console.log('║  2. Force push to GitHub:                                  ║');
    console.log('║     git push origin main --force                           ║');
    console.log('║                                                              ║');
    console.log('║  3. Check GitHub (5-10 minutes to refresh)                 ║');
    console.log('║                                                              ║');
    console.log('║  If error, restore:                                        ║');
    console.log('║     git reset --hard backup-before-rewrite-nov-dec         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (e) {
    console.error(`\n✗ Error during rewrite: ${e.message}`);
    console.log(`Restore with: git reset --hard backup-before-rewrite-nov-dec\n`);
    fs.unlinkSync(filterScript);
    process.exit(1);
  }
});
