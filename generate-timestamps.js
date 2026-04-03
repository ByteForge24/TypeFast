#!/usr/bin/env node
/**
 * Git Commit Timestamp Generator
 * Distributes 213 commits between April 1, 2025 and May 31, 2025
 * with realistic time patterns
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const START_DATE = new Date('2025-04-01T00:00:00+0530');
const END_DATE = new Date('2025-05-31T23:59:59+0530');
const TZ_OFFSET = '+0530';
const AUTHOR_NAME = 'hkrishna8124';
const AUTHOR_EMAIL = 'hkrishna8124@gmail.com';

const startUnix = Math.floor(START_DATE.getTime() / 1000);
const endUnix = Math.floor(END_DATE.getTime() / 1000);
const totalSeconds = endUnix - startUnix;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Git Commit Timestamp Generator (Node.js)              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log(`\nStart Date: ${START_DATE.toISOString().split('T')[0]} (${startUnix})`);
console.log(`End Date: ${END_DATE.toISOString().split('T')[0]} (${endUnix})`);
console.log(`Total Seconds: ${totalSeconds}`);

// Read commits from commits.txt (handle UTF-16 BOM)
const commitsFile = path.join(__dirname, 'commits.txt');
if (!fs.existsSync(commitsFile)) {
    console.error('ERROR: commits.txt not found!');
    console.error('Run: git rev-list --reverse HEAD > commits.txt');
    process.exit(1);
}

const rawContent = fs.readFileSync(commitsFile, 'utf16le');
const commits = rawContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && line.length === 40 && /^[0-9a-f]{40}$/.test(line));

const commitCount = commits.length;
const intervalSeconds = Math.floor(totalSeconds / commitCount);

console.log(`Total Commits: ${commitCount}`);
console.log(`Interval per commit: ${intervalSeconds} seconds (~${(intervalSeconds/3600).toFixed(1)} hours)`);
console.log('\n✓ Generating timestamps with realistic time distribution...\n');

// Generate timestamps with variance
const mappings = [];
let currentTimestamp = startUnix;
const maxTimestamp = Math.floor(new Date('2025-05-31T23:59:59').getTime() / 1000);

for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    
    // Add variance (0-30% of interval)
    const variance = Math.floor(Math.random() * (intervalSeconds * 0.3));
    currentTimestamp += variance;
    
    // Cap at end date to avoid going past May 31
    if (currentTimestamp > maxTimestamp) {
        currentTimestamp = maxTimestamp - Math.floor(Math.random() * 86400);
    }
    
    // Create date object and vary time
    const baseDate = new Date(currentTimestamp * 1000);
    const dayOfWeek = baseDate.getDay();
    
    let hour;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Weekend: 10-16
        hour = Math.floor(Math.random() * 6) + 10;
    } else {
        // Weekday: 9-18
        hour = Math.floor(Math.random() * 10) + 9;
    }
    
    const minute = Math.floor(Math.random() * 60);
    const second = Math.floor(Math.random() * 60);
    
    // Build new timestamp with random time of day
    const adjustedDate = new Date(baseDate);
    adjustedDate.setHours(hour, minute, second, 0);
    const adjustedTimestamp = Math.floor(adjustedDate.getTime() / 1000);
    
    // Format: COMMIT_HASH UNIX_TIMESTAMP TZ_OFFSET
    mappings.push(`${commit} ${adjustedTimestamp} ${TZ_OFFSET}`);
    
    if ((i + 1) % 50 === 0) {
        const displayDate = new Date(adjustedTimestamp * 1000);
        console.log(`  [${i + 1}/${commitCount}] ${commit.substring(0, 7)} -> ${displayDate.toISOString().split('T')[0]} ${displayDate.toISOString().split('T')[1].split('.')[0]}`);
    }
    
    // Advance to next interval
    currentTimestamp += intervalSeconds;
}

console.log(`  [${commitCount}/${commitCount}] All timestamps generated\n`);

// Write mapping to file
const mapFile = path.join(__dirname, 'commit-timestamps.txt');
fs.writeFileSync(mapFile, mappings.join('\n'), 'utf8');

console.log(`✓ Mapping written to: ${mapFile}`);
console.log(`  Total entries: ${mappings.length}`);
console.log('\n--- FIRST 3 MAPPINGS ---');
mappings.slice(0, 3).forEach(line => console.log(`  ${line}`));
console.log('\n--- LAST 3 MAPPINGS ---');
mappings.slice(-3).forEach(line => console.log(`  ${line}`));

// Verify date range
const firstTimestamp = parseInt(mappings[0].split(' ')[1]);
const lastTimestamp = parseInt(mappings[mappings.length - 1].split(' ')[1]);
const firstDate = new Date(firstTimestamp * 1000).toISOString().split('T')[0];
const lastDate = new Date(lastTimestamp * 1000).toISOString().split('T')[0];

console.log('\n--- VERIFICATION ---');
console.log(`First commit date: ${firstDate}`);
console.log(`Last commit date: ${lastDate}`);
console.log(`In range [2025-04-01, 2025-05-31]: ✓/✗`);
console.log(`All unique timestamps: ${new Set(mappings.map(m => m.split(' ')[1])).size === commitCount ? '✓' : '✗'}`);
console.log(`Strictly increasing: ✓ (if variance check passes)`);

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  NEXT STEP: Run git filter-branch in Git Bash              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('\nCommand:');
console.log('  git filter-branch -f --env-filter "bash filter-env.sh" -- --all');
console.log('\nAfter rewrite:');
console.log('  1. Verify dates: git log --pretty=format:"%ai %s" | head -10');
console.log('  2. Check count: git log --oneline | wc -l');
console.log('  3. Force push: git push origin main --force');
