#!/bin/bash
set -e

cd apps/web

echo "=== Starting TypeFast Production Service ==="
echo "Step 1: Generating Prisma Client..."
npx prisma generate

echo "Step 2: Running Database Migrations..."
npx prisma migrate deploy

echo "Step 3: Starting Next.js Server..."
cd ../..
yarn start
