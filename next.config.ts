
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: {
    buildActivity: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverActions: {
    // 2 minutes timeout for server actions
    // @see https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#executiontimeout
    executionTimeout: 120,
  }
};

export default nextConfig;
