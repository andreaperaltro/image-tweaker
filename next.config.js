// Import next-pwa
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/picsum\.photos\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['picsum.photos'],
    unoptimized: true, // Required for static export
  },
  output: 'export', // Changed from 'standalone' to 'export' for static builds
  basePath: process.env.NODE_ENV === 'development' ? '' : (process.env.NEXT_PUBLIC_BASE_PATH || ''),
  experimental: {
    optimizeCss: false, // Disabled to prevent critters issues
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(otf|ttf|woff|woff2)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext][query]'
      }
    });
    return config;
  }
};

// Export the configuration with PWA support
module.exports = withPWA(nextConfig); 