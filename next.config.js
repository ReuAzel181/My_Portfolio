/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'placehold.co', 'via.placeholder.com'],
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['framer-motion'],
}

module.exports = nextConfig 