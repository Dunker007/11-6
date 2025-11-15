/**
 * Browser polyfill for @lancedb/lancedb
 * Returns empty/mock implementations since this is a Node.js-only module
 */

export default {};

// Export common functions as noops
export const connect = async () => {
  throw new Error('LanceDB is only available in Electron/Node.js context');
};

