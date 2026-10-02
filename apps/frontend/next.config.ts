import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
export default function createNextConfig(phase: string): NextConfig {
  const nextConfig: NextConfig = {
    output: 'export',
    images: { unoptimized: true },
    reactStrictMode: false,
    transpilePackages: ['@cityborn/api', '@cityborn/core', '@cityborn/client'],
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };

  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;

  return {
    ...nextConfig,
    rewrites: async () => [
      { source: '/session/multi/:sessionId', destination: '/session/multi' },
    ],
  };
}
