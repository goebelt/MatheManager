/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Explicitly configure TypeScript path aliases
  experimental: {
    swcPlugins: [],
  },
};

module.exports = nextConfig;