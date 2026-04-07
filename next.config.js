/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Explicitly configure TypeScript path aliases
  experimental: {
    swcPlugins: [],
  },
};

module.exports = nextConfig;