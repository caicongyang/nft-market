/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  experimental: {
    serverActions: true,
    serverComponents: true,
    appDir: true
  }
}

module.exports = nextConfig