// Add Node.js process type declaration
declare const process: {
  env: Record<string, string | undefined>;
};

// Prevent LibSQL native module loading with type-safe checks
if (typeof process !== 'undefined' && process.env) {
  process.env.LIBSQL_SKIP_NATIVE_LOADING = 'true';
  process.env.LIBSQL_USE_JS_IMPLEMENTATION = 'true';
}

/**
 * Placeholder memory implementation that avoids dependencies on LibSQL
 * This prevents the native module loading error in the agent
 */
export const memory = {
  hasItem: async () => false,
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
  clear: async () => {},
}; 