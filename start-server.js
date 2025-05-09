#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 TypeFast Production Startup');

try {
  // Change to web app directory
  process.chdir(path.join(__dirname, 'apps', 'web'));
  console.log('📁 Working directory: ' + process.cwd());

  // Step 1: Generate Prisma Client
  console.log('📦 Step 1: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated');

  // Step 2: Run migrations
  console.log('🗄️  Step 2: Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migrations completed');

  // Step 3: Start the app
  console.log('🎯 Step 3: Starting Next.js server...');
  process.chdir(path.join(__dirname));
  execSync('yarn start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Startup failed:', error.message);
  process.exit(1);
}
