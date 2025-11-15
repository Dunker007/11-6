/**
 * llmConfig.ts
 * 
 * PURPOSE:
 * Centralized LLM configuration utilities. Maps optimization priorities to LLM parameters
 * (like temperature) to ensure consistent behavior across the application. Provides
 * dynamic configuration based on user preferences from the LLM Optimizer panel.
 * 
 * ARCHITECTURE:
 * Simple utility functions that map OptimizationPriority enum to configuration values:
 * - quality → 0.7 (more deterministic, focused)
 * - speed → 0.7 (faster, less creative)
 * - balanced → 0.91 (creative but consistent)
 * 
 * CURRENT STATUS:
 * ✅ Temperature mapping based on priority
 * ✅ Default temperature fallback
 * ✅ Used by AIAssistant component
 * ✅ Consistent across all LLM providers
 * 
 * DEPENDENCIES:
 * - @/types/optimizer: OptimizationPriority type
 * 
 * STATE MANAGEMENT:
 * - Stateless utilities (no state)
 * - No Zustand or React dependencies
 * 
 * PERFORMANCE:
 * - Simple switch statement
 * - Fast execution
 * - No side effects
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { getTemperatureForPriority } from '@/utils/llmConfig';
 * 
 * const priority = useLLMOptimizerStore(state => state.priority);
 * const temperature = getTemperatureForPriority(priority);
 * 
 * // Use temperature in LLM generation
 * await llmRouter.generate(prompt, { temperature });
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmOptimizerStore.ts: Provides priority value
 * - src/components/AIAssistant/AIAssistant.tsx: Uses this for temperature
 * - src/types/optimizer.ts: OptimizationPriority type definition
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - More configuration options (maxTokens, topP, etc.)
 * - Provider-specific configurations
 * - Task-based configuration (different settings for different tasks)
 */

import type { OptimizationPriority } from '@/types/optimizer';

/**
 * Get temperature value based on optimization priority
 * @param priority The optimization priority ('quality' | 'speed' | 'balanced')
 * @returns Temperature value (0.0 - 2.0)
 */
export function getTemperatureForPriority(priority: OptimizationPriority): number {
  switch (priority) {
    case 'quality':
      // Lower temperature for more deterministic, focused responses
      return 0.7;
    case 'speed':
      // Lower temperature for faster, less creative responses
      return 0.7;
    case 'balanced':
      // Balanced temperature for creative but consistent responses
      return 0.91;
    default:
      // Default to balanced
      return 0.91;
  }
}

/**
 * Get default temperature when no priority is specified
 * @returns Default temperature value
 */
export function getDefaultTemperature(): number {
  return 0.91;
}

