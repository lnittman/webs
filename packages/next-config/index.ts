import withBundleAnalyzer from '@next/bundle-analyzer';

// @ts-expect-error No declaration file
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
import type { NextConfig } from 'next';

const otelRegex = /@opentelemetry\/instrumentation/;
const libsqlRegex = /(@libsql\/client|libsql)/;

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

  // Allow libsql and @libsql/client packages to be bundled with the server
  // This prevents the version mismatch issues
  experimental: {
    serverComponentsExternalPackages: [],
    serverMinification: true,
  },

  // @ts-ignore - Next.js webpack config type issues
  webpack(config, { isServer }) {
    if (isServer) {
      config.plugins = config.plugins || [];
      config.plugins.push(new PrismaPlugin());
      
      // Handle LibSQL dependencies differently
      if (config.externals) {
        // Filter out libsql packages from externals
        if (Array.isArray(config.externals)) {
          // @ts-ignore - Type issues with externals
          config.externals = config.externals.filter(external => {
            if (typeof external === 'string') {
              return !external.match(libsqlRegex);
            }
            return true;
          });
        } else if (typeof config.externals === 'function') {
          const originalExternals = config.externals;
          // @ts-ignore - Not going to match the exact function type
          config.externals = (ctx, callback) => {
            originalExternals(ctx, (err, result) => {
              if (err) return callback(err);
              
              if (typeof result === 'string' && result.match(libsqlRegex)) {
                return callback(null, undefined);
              }
              
              callback(null, result);
            });
          };
        }
      }
    }

    config.ignoreWarnings = [
      { module: otelRegex },
      // Ignore LibSQL warnings about mismatched versions
      { module: libsqlRegex }
    ];

    return config;
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// @ts-ignore - Ignore type mismatch between Next.js versions
export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);
