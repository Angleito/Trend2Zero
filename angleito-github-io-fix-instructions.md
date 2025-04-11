# Instructions to Fix Vercel Deployment for Angleito.github.io

Follow these steps to fix the Vercel deployment issues with your Angleito.github.io repository:

## 1. Clone the Repository

```bash
git clone https://github.com/Angleito/Angleito.github.io.git
cd Angleito.github.io
git checkout dev
```

## 2. Update package.json

Edit the `package.json` file and change the build script from:

```json
"build": "contentlayer build && next build"
```

to:

```json
"build": "next build"
```

This will prevent contentlayer from running during the build process, which is causing the error.

## 3. Create next.config.cjs

Rename your existing `next.config.js` to `next.config.cjs` and replace its content with:

```js
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
```

This configuration will use contentlayer only during development, not during the build process.

## 4. Create .vercelignore

Create a `.vercelignore` file with the following content:

```
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
```

This will prevent unnecessary files from being uploaded to Vercel.

## 5. Update vercel.json

Create or update your `vercel.json` file with the following content:

```json
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
```

This configuration will use a custom build command that bypasses contentlayer.

## 6. Commit and Push the Changes

```bash
git add package.json next.config.cjs .vercelignore vercel.json
git commit -m "Fix Vercel deployment issues with next.config.js and contentlayer"
git push origin dev
```

## 7. Deploy to Vercel

After pushing these changes, your next Vercel deployment should succeed without the previous errors.

## Explanation of the Fix

The main issues were:

1. **Module System Conflict**: The `next.config.js` file was being treated as an ES module, but it was using CommonJS syntax. Renaming it to `next.config.cjs` fixes this.

2. **ContentLayer Error**: ContentLayer was causing an error during the build process. By removing it from the build script and conditionally using it only during development, we avoid this error.

3. **Vercel Configuration**: The custom build command in `vercel.json` ensures that Vercel uses the correct build process.
