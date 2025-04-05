// Import the necessary configurations
const { config, withAnalyzer } = require('../../packages/next-config');
const { 
  externalPackages, 
  ignoreWarningPatterns, 
  resolveAliases, 
  setupLibsqlEnvironment 
} = require('../../packages/next-config/turbo-config');

// Setup environment variables for LibSQL
setupLibsqlEnvironment();

// Create the configuration object
let nextConfig = {
  ...config,

  // Add LibSQL conflict handling
  experimental: {
    ...(config.experimental || {}),
    serverComponentsExternalPackages: externalPackages,
    turbo: {
      resolveAlias: resolveAliases,
    },
  },

  // Extend webpack configuration
  webpack(webpackConfig, context) {
    // Apply the original webpack config if it exists
    const origConfig = typeof config.webpack === 'function' 
      ? config.webpack(webpackConfig, context) 
      : webpackConfig;
    
    // Add our warning ignores
    origConfig.ignoreWarnings = [
      ...(origConfig.ignoreWarnings || []),
      ...ignoreWarningPatterns.map(pattern => ({ message: pattern })),
    ];
    
    return origConfig;
  },
};

// Add analyzer if needed
const env = process.env;
if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

module.exports = nextConfig; 