// Import next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
    unoptimized: true, // Required for static export
  },
  output: 'export', // Enable static exports
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // Set base path for GitHub Pages
};

// Export the configuration with PWA support
module.exports = withPWA(nextConfig); 