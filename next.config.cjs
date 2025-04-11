/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Configure security headers to allow chart library to work
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:;"
          }
        ]
      }
    ];
  },
  images: {
    domains: ['www.alphavantage.co'],
  },
  output: 'standalone', // Enable standalone output for easier deployment
  reactStrictMode: true, // Enable React Strict Mode for better performance and catching potential issues
  swcMinify: true, // Enable SWC minification for faster builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundle size

  // Optional: Add webpack configuration if needed
  webpack: (config, { isServer }) => {
    // Ensure compatibility with Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        url: require.resolve('url'), // Corrected URL module import
      };
    }

    // Optimize module resolution
    config.resolve.extensions.push('.ts', '.tsx');

    // Add path aliases to webpack config
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    return config;
  }
};

module.exports = nextConfig;
