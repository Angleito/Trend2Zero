/** @type {import('next').NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle ES modules
    config.module = {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.m?js$/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false
          }
        }
      ]
    };

    // Add resolve extensions and module directories
    config.resolve = {
      ...config.resolve,
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      fallback: {
        ...(!isServer ? {
          fs: false,
          path: false,
          os: false
        } : {})
      }
    };

    return config;
  },
  // Ensure proper file paths in standalone mode
  output: 'standalone',
  distDir: '.next',
  // Environment configuration
  env: {
    PORT: process.env.NEXT_PUBLIC_PORT || '3000'
  },
  // Enable experimental features for ES modules support
  experimental: {
    esmExternals: true
  }
};

export default config;