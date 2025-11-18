/**
 * Services Index
 *
 * PURPOSE:
 * Central export point for all DLX Studios services.
 * Provides clean, organized imports throughout the application.
 *
 * ARCHITECTURE:
 * Barrel export pattern - re-exports services from subdirectories.
 * Organized by category for easy discovery.
 *
 * USAGE:
 * ```typescript
 * // Instead of:
 * import { aiIntegrationService } from '@/services/ai/aiIntegrationService';
 * import { credentialVaultService } from '@/services/credentials/credentialVaultService';
 *
 * // You can do:
 * import { aiIntegrationService, credentialVaultService } from '@/services';
 * ```
 */

// ========================================
// CORE INFRASTRUCTURE
// ========================================

export { logger } from './logging/loggerService';
export { errorLogger } from './errors/errorLogger';
export { eventBus } from './events/eventBus';
export { notificationService } from './notification/notificationService';

// ========================================
// SERVICE REGISTRY
// ========================================

export { serviceRegistry, getServicesByCategory, findService, getAllStores } from './registry';

// ========================================
// AI & MACHINE LEARNING
// ========================================

export { aiIntegrationService } from './ai/aiIntegrationService';
export { useLLMStore } from './ai/llmStore';
export { useLLMOptimizerStore } from './ai/llmOptimizerStore';
export { router } from './ai/router';
export { learningSystemService } from './ai/learningSystemService';
export { autoOptimizationService } from './ai/autoOptimizationService';
export { contentPerformancePredictorService } from './ai/contentPerformancePredictorService';

// ========================================
// REVENUE & MONETIZATION
// ========================================

export { revenueTracker } from '../revenue/tracker';
export { revenueTrackingService } from './passive-income/revenueTrackingService';
export { unifiedRevenueService } from './revenue/unifiedRevenueService';
export { contentGenerationService } from './passive-income/contentGenerationService';
export { automationScheduler } from './passive-income/automationScheduler';
export { incomeTaxService } from './revenue/taxReportingService';

// ========================================
// CREDENTIALS & SECURITY
// ========================================

export { credentialVaultService } from './credentials/credentialVaultService';
export { securityService } from './security/securityService';
export { encryptionService } from './security/encryptionService';
export { useSmartErrorHandlerStore, smartErrorHandlerService } from './errors/smartErrorHandlerService';

// ========================================
// USER EXPERIENCE
// ========================================

export { useOnboardingStore, welcomeWizardService } from './onboarding/welcomeWizardService';
export { useHelpSystemStore, helpSystemService } from './help/helpSystemService';
export { usePreferencesStore } from './settings/userPreferencesService';
export { dataPortabilityService } from './data/dataPortabilityService';

// ========================================
// CONTENT & PUBLISHING
// ========================================

export { contentRecyclerService } from './content/contentRecyclerService';
export { contentRepurposingService } from './content/contentRepurposingService';
export { wordpressPublisher } from './publishing/wordpressPublisher';
export { mediumPublisher } from './publishing/mediumPublisher';

// ========================================
// WORKFLOWS & AUTOMATION
// ========================================

export { WorkflowEngine } from './workflow/workflowEngine';
export { useWorkflowStore } from './workflow/workflowStore';
export { buildWorkflowService } from './workflow/buildWorkflowService';
export { deployWorkflowService } from './workflow/deployWorkflowService';

// ========================================
// WEALTH MANAGEMENT
// ========================================

export { useWealthStore } from './wealth/wealthStore';
export { portfolioService } from './wealth/portfolioService';
export { wealthMarketDataService } from './wealth/marketDataService';
export { dividendTrackingService } from './wealth/dividendTrackingService';
export { capitalGainsTaxService } from './wealth/taxReportingService';

// ========================================
// CRYPTO & TRADING
// ========================================

export { useCryptoStore } from './crypto/cryptoStore';
export { coinbaseService } from './crypto/coinbaseService';
export { marketDataService as cryptoMarketDataService } from './crypto/marketDataService';

// ========================================
// PROJECT MANAGEMENT
// ========================================

export { useProjectStore } from './project/projectStore';
export { projectManagementService } from './project/projectManagementService';

// ========================================
// AGENTS & ORCHESTRATION
// ========================================

export { agentOrchestratorService } from './agents/agentOrchestratorService';
export { useAgentStore } from './agents/agentStore';
export { itorService } from './agents/itorService';
export { edService } from './agents/edService';

// ========================================
// SPECIALIZED SERVICES
// ========================================

export { smartSchedulerService } from './scheduling/smartSchedulerService';
export { emergencyResponseService } from './ai/emergencyResponseService';
export { idleProfitMaximizerService } from './ai/idleProfitMaximizerService';
export { activityService } from './activity/activityService';
export { useActivityStore } from './activity/activityStore';

// ========================================
// TYPE EXPORTS
// ========================================

export type { ServiceMetadata, ServiceCategory } from './registry';
export type { RevenueSource, RevenueEvent, RevenueMetrics } from './revenue/unifiedRevenueService';
