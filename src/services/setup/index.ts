/**
 * Setup Services Index
 * Central export point for setup and onboarding services
 */

export { guidedSetupService } from './guidedSetupService';
export { providerDetectionService } from './providerDetectionService';
export * from './apiKeyValidator';

export type { ServiceSetup, SetupStep } from './guidedSetupService';
export type { DetectedProvider, ProviderDetectionResult } from './providerDetectionService';
