/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };
    return config;
  },
  // Explicitly set output mode and server configuration
  output: 'standalone',
  env: {
    PORT: process.env.NEXT_PUBLIC_PORT || 3000
  }
};

export default nextConfig;
