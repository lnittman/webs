import withBundleAnalyzer from '@next/bundle-analyzer';

// @ts-expect-error No declaration file
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
import type { NextConfig } from 'next';

const otelRegex = /@opentelemetry\/instrumentation/;

export const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },

  // biome-ignore lint/suspicious/useAwait: rewrites is async
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },

  // Force Next.js to transpile these packages to fix version conflicts
  // This helps with the LibSQL version conflicts
  experimental: {
    serverComponentsExternalPackages: [
      '@libsql/client',
      'libsql',
      '@mastra/core',
      '@mastra/memory',
      '@mastra/upstash',
    ],
    // Add turbo config to address warnings
    turbo: {
      resolveAlias: {
        // Ensure only one version of libsql is used
        '@libsql/client': '@libsql/client@0.15.2',
        'libsql': 'libsql@0.5.4',
      },
    },
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(new PrismaPlugin());
    }

    config.ignoreWarnings = [
      { module: otelRegex },
      // Ignore the version mismatch warnings for LibSQL
      { message: /^Package @libsql\/client can't be external/ },
      { message: /^Package libsql can't be external/ },
    ];

    return config;
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
