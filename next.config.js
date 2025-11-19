/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Reduce memory usage
  swcMinify: true,
  compress: true,
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native modules for server-side
      config.externals = [
        ...(config.externals || []),
        '@napi-rs/canvas',
        'canvas',
      ];
    }
    
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    
    return config;
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};

module.exports = nextConfig;

