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

  const webAppUrl: string | undefined = process.env.NEXT_PUBLIC_WEB_APP_URL;

  return {
    ...nextConfig,
    allowedDevOrigins: webAppUrl ? [new URL(webAppUrl).hostname] : [],
    rewrites: async () => [
      { source: '/session/solo/:sessionId', destination: '/session' },
      { source: '/session/multi/:sessionId', destination: '/session' },
    ],
  };
}
