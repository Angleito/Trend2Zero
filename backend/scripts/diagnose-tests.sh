#!/bin/bash

echo "Current Directory: $(pwd)"
echo "Node Version: $(node --version)"
echo "NPM Version: $(npm --version)"

echo "Backend Directory Contents:"
ls -la

echo "Running Jest Diagnostic:"
npx jest --listTests --config=./jest.config.js

echo "Attempting to run tests with verbose output:"
NODE_ENV=test npx jest --verbose --config=./jest.config.js