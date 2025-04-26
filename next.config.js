/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    if (!isServer) {
      config.externals = {
        ...config.externals,
        mongodb: 'mongodb',
        net: 'net',
        child_process: 'child_process',
        'fs/promises': 'fs/promises',
        tls: 'tls',
        dns: 'dns',
        fs: 'fs',
        'timers/promises': 'timers/promises',
      };
    }
    return config;
  },
  // Explicitly set output mode and server configuration
  output: 'standalone',
  env: {
    // Ensure PORT is a string
    PORT: process.env.NEXT_PUBLIC_PORT || '3000'
  }
};

export default nextConfig;