import { env } from '@/env';
import { config, withAnalyzer } from '../../packages/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = config;

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

// Note: Actual configuration is loaded from next.config.js
export default nextConfig;
