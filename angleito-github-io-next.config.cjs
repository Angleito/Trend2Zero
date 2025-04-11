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
