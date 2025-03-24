/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // 移除 serverComponents 和 appDir，它们已经是默认值
    // 更新 serverActions 为对象格式
    serverActions: {
      bodySizeLimit: '2mb' // 可以根据需要调整
    }
  },
  images: {
    domains: ['ipfs.io', 'gateway.ipfs.io', 'cloudflare-ipfs.com'],
  }
}

module.exports = nextConfig 