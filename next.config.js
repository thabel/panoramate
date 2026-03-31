/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Add this to handle Pino internals correctly in Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],
  },
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix for Hot Reload in WSL2
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, 
        aggregateTimeout: 300, 
      };
    }

    if (isServer) {
      config.externals.push('_http_common');
    }
    return config;
  },
}

module.exports = nextConfig;
