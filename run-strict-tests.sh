#!/bin/bash

# Strict E2E Test Runner for TypeFast
# These tests ONLY run against real deployed URLs (no localhost)
# 
# Usage:
#   ./run-strict-tests.sh <DEPLOYED_URL>
#
# Example:
#   ./run-strict-tests.sh https://typefast-web-yogd.onrender.com

set -e

if [ -z "$1" ]; then
  echo "Error: Missing deployed URL"
  echo ""
  echo "Usage: ./run-strict-tests.sh <DEPLOYED_URL>"
  echo ""
  echo "Examples:"
  echo "  ./run-strict-tests.sh https://typefast-web-yogd.onrender.com"
  echo "  ./run-strict-tests.sh https://staging.typefast.com"
  echo ""
  echo "DO NOT use localhost or 127.0.0.1 - only real deployed URLs"
  exit 1
fi

DEPLOYED_URL="$1"

# Validate URL is not localhost
if [[ "$DEPLOYED_URL" == *"localhost"* ]] || [[ "$DEPLOYED_URL" == *"127.0.0.1"* ]] || [[ "$DEPLOYED_URL" == *"0.0.0.0"* ]]; then
  echo "Error: URL must be a real deployed URL, not localhost"
  echo "Received: $DEPLOYED_URL"
  exit 1
fi

echo "======================================================"
echo "TypeFast Strict E2E Test Suite"
echo "======================================================"
echo "Testing against: $DEPLOYED_URL"
echo ""
echo "This suite tests:"
echo "  ✓ Google OAuth callback flow"
echo "  ✓ Signup/Signin lifecycle (real user creation)"
echo "  ✓ Multiplayer room creation & joining"
echo "  ✓ Typing result persistence & save"
echo ""
echo "Running tests in --headed mode for visual inspection..."
echo "======================================================"
echo ""

# Set environment variable
export PLAYWRIGHT_BASE_URL="$DEPLOYED_URL"

# Run all strict tests with headed Chromium and HTML report
npx playwright test \
  apps/web/e2e/browser/strict-*.spec.ts \
  --headed \
  --project=chromium \
  --reporter=html \
  --reporter=list

echo ""
echo "======================================================"
echo "Test run complete!"
echo "HTML report: playwright-report/index.html"
echo "======================================================"
