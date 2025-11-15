/**
 * Browser polyfill for fs
 * Returns empty object since fs is Node.js-only
 */

export default {};
export const readFileSync = () => { throw new Error('fs is only available in Node.js'); };
export const writeFileSync = () => { throw new Error('fs is only available in Node.js'); };

