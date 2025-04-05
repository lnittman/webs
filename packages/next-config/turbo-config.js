/**
 * This file contains Turbopack-specific configurations to handle dependency conflicts.
 * It uses JavaScript to avoid TypeScript errors from version mismatches.
 */

// External packages that should be bundled rather than externalized
const externalPackages = [
  '@libsql/client',
  'libsql',
  '@mastra/core',
  '@mastra/memory',
  '@mastra/upstash',
];

// Package version resolution for Turbopack
const resolveAliases = {
  '@libsql/client': '@libsql/client@0.15.2',
  'libsql': 'libsql@0.5.4',
};

// Warning regex patterns to ignore in webpack
const ignoreWarningPatterns = [
  /^Package @libsql\/client can't be external/,
  /^Package libsql can't be external/,
];

/**
 * Environment variables to set for the Mastra package to avoid native LibSQL issues
 */
function setupLibsqlEnvironment() {
  if (typeof process !== 'undefined') {
    // Skip native module loading in LibSQL
    process.env.LIBSQL_SKIP_NATIVE_LOADING = 'true';
    
    // Use pure JS implementation
    process.env.LIBSQL_USE_JS_IMPLEMENTATION = 'true';
  }
}

module.exports = {
  externalPackages,
  resolveAliases,
  ignoreWarningPatterns,
  setupLibsqlEnvironment
}; 