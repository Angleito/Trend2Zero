#!/bin/bash

# Ensure the development server is running
npm run dev &
DEV_SERVER_PID=$!

# Wait for the server to start
sleep 5

# Run continuous monitoring
npx playwright test tests/continuous-monitor.spec.ts --headed

# Kill the development server
kill $DEV_SERVER_PID