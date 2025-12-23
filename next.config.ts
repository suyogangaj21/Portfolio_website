import { NextConfig } from 'next';

const baseConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist']
};
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  ...baseConfig
};

export default nextConfig;
