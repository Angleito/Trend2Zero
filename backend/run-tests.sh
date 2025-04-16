#!/usr/bin/env zsh

# Print diagnostic information
echo "Current Directory: $(pwd)"
echo "Backend Directory Contents:"
ls -la

echo "Node Version:"
node --version

echo "NPM Version:"
npm --version

echo "Running Jest with verbose output:"
NODE_ENV=test npx jest --verbose --config=./jest.config.js --coverage