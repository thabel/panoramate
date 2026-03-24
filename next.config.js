/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
    unoptimized: true,
  },
  webpack: (config, { isServer, dev }) => {
    // Fix for Hot Reload in WSL2
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after first change
      };
    }

    if (isServer) {
      config.externals.push('_http_common');
    }
    return config;
  },
}

module.exports = nextConfig
