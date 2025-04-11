#!/bin/bash

set -e

echo "=== [Mock Vercel Build] Installing dependencies with npm ci ==="
npm ci

echo "=== [Mock Vercel Build] Running build script (npm run build) ==="
npm run build

echo "=== [Mock Vercel Build] Build completed successfully ==="