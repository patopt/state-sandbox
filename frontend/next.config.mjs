/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large API response bodies for AI generation
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // External packages for server-side (Prisma, AI SDKs)
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Disable static export (we need API routes)
  output: undefined,

  // Image domains
  images: {
    remotePatterns: [],
  },

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'State Sandbox',
  },
};

export default nextConfig;
