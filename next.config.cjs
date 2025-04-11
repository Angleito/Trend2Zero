/** @type {import('next').NextConfig} */
const nextConfig = {
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

    return config;
  }
};

module.exports = nextConfig;
