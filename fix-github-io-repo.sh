#!/bin/bash

# This script fixes the Vercel deployment issues for the Angleito.github.io repository

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# Clone the repository
echo "Cloning the Angleito.github.io repository..."
git clone https://github.com/Angleito/Angleito.github.io.git
cd Angleito.github.io

# Check if we're on the dev branch
git checkout dev

# Fix the package.json build script
echo "Fixing the package.json build script..."
sed -i '' 's/"build": "contentlayer build && next build"/"build": "next build"/' package.json

# Create next.config.cjs file
echo "Creating next.config.cjs file..."
cat > next.config.cjs << 'EOL'
/** @type {import('next').NextConfig} */
const { withContentlayer } = require('next-contentlayer');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com'],
  },
};

// Use withContentlayer only during development, not during build
if (process.env.NODE_ENV === 'development') {
  module.exports = withContentlayer(nextConfig);
} else {
  module.exports = nextConfig;
}
EOL

# Create .vercelignore file
echo "Creating .vercelignore file..."
cat > .vercelignore << 'EOL'
.git
.github
.next
node_modules
.contentlayer
README.md
.env
.env.local
.env.development
.env.production
.env.example
.gitignore
.eslintrc.json
.prettierrc
.prettierignore
.husky
jest.config.js
jest.setup.js
tsconfig.json
postcss.config.js
tailwind.config.js
next-env.d.ts
EOL

# Update vercel.json file
echo "Updating vercel.json file..."
cat > vercel.json << 'EOL'
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "installCommand": "npm install --legacy-peer-deps",
        "buildCommand": "next build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
EOL

# Commit the changes
echo "Committing the changes..."
git add package.json next.config.cjs .vercelignore vercel.json
git commit -m "Fix Vercel deployment issues with next.config.js and contentlayer"

# Push the changes
echo "Pushing the changes..."
git push origin dev

echo "Done! The changes have been pushed to the repository."
