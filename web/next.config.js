/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  // 添加自定义HTTP头
  async headers() {
    return [
      {
        // 为所有路由应用这些头
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // 静态资源优化
  images: {
    domains: ['ipfs.io', 'infura-ipfs.io', 'img.picgo.net'], // 添加 img.picgo.net
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // 添加 webpack 配置解决 pino-pretty 问题
  webpack: (config, { isServer }) => {
    // 忽略 pino-pretty 相关警告
    config.ignoreWarnings = [
      { module: /node_modules\/pino/ }
    ];
    
    // 如果在客户端构建时发现 pino 相关问题
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        pino: false,
        'pino-pretty': false
      };
    }
    
    return config;
  },
}

module.exports = nextConfig