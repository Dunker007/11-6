import { lazy } from 'react';

/**
 * Lazy-loaded Quick Labs components
 * Improves initial bundle size by loading these components only when accessed
 */

export const MindMap = lazy(() => import('./MindMap'));
export const CodeReview = lazy(() => import('./CodeReview'));
export const AgentForge = lazy(() => import('./AgentForge'));
export const Creator = lazy(() => import('./Creator'));

// Re-export types if needed
export type { Node, Connection } from './MindMap';

