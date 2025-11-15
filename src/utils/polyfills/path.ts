/**
 * Browser polyfill for path
 * Minimal implementation for browser context
 */

export default {
  join: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
  resolve: (...args: string[]) => args.join('/').replace(/\/+/g, '/'),
  basename: (p: string) => p.split('/').pop() || '',
  dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '/',
  extname: (p: string) => {
    const base = p.split('/').pop() || '';
    const dot = base.lastIndexOf('.');
    return dot > 0 ? base.slice(dot) : '';
  },
  sep: '/',
  delimiter: ':',
};

export const join = (...args: string[]) => args.join('/').replace(/\/+/g, '/');
export const resolve = (...args: string[]) => args.join('/').replace(/\/+/g, '/');
export const basename = (p: string) => p.split('/').pop() || '';
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/') || '/';
export const extname = (p: string) => {
  const base = p.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot) : '';
};
export const sep = '/';
export const delimiter = ':';

