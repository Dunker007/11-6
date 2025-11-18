/**
 * Service Registry
 *
 * PURPOSE:
 * Central catalog of all services in DLX Studios.
 * Provides discoverability, documentation, and dependency tracking.
 *
 * ARCHITECTURE:
 * Single source of truth for what services exist, their purpose,
 * dependencies, and how to use them.
 *
 * USAGE:
 * ```typescript
 * import { serviceRegistry } from '@/services/registry';
 *
 * // Find a service
 * const aiServices = serviceRegistry.ai;
 *
 * // Get service metadata
 * const credentialVault = serviceRegistry.credentials.vault;
 * console.log(credentialVault.description);
 * ```
 */

export interface ServiceMetadata {
  name: string;
  path: string;
  description: string;
  pattern: 'zustand-store' | 'singleton' | 'service' | 'utility';
  dependencies?: string[];
  status: 'stable' | 'beta' | 'experimental';
}

export interface ServiceCategory {
  category: string;
  description: string;
  services: Record<string, ServiceMetadata>;
}

/**
 * DLX Studios Service Registry
 * Complete catalog of all available services
 */
export const serviceRegistry: Record<string, ServiceCategory> = {
  // ========================================
  // CORE SERVICES
  // ========================================

  core: {
    category: 'Core Infrastructure',
    description: 'Essential services used throughout the application',
    services: {
      logger: {
        name: 'Logger Service',
        path: 'services/logging/loggerService',
        description: 'Centralized logging with levels and context',
        pattern: 'singleton',
        status: 'stable',
      },
      errorLogger: {
        name: 'Error Logger',
        path: 'services/errors/errorLogger',
        description: 'Error capture, tracking, and reporting',
        pattern: 'singleton',
        dependencies: ['logger'],
        status: 'stable',
      },
      eventBus: {
        name: 'Event Bus',
        path: 'services/events/eventBus',
        description: 'Application-wide event system for decoupled communication',
        pattern: 'singleton',
        status: 'stable',
      },
      notification: {
        name: 'Notification Service',
        path: 'services/notification/notificationService',
        description: 'Toast notifications and user alerts',
        pattern: 'singleton',
        status: 'stable',
      },
    },
  },

  // ========================================
  // AI & MACHINE LEARNING
  // ========================================

  ai: {
    category: 'AI & Machine Learning',
    description: 'AI integration, LLM management, and intelligent automation',
    services: {
      integration: {
        name: 'AI Integration Service',
        path: 'services/ai/aiIntegrationService',
        description: 'Master AI orchestrator - connects all AI systems',
        pattern: 'singleton',
        dependencies: ['learning', 'optimization', 'scheduler', 'recycler', 'emergency', 'orchestrator'],
        status: 'stable',
      },
      llmStore: {
        name: 'LLM Store',
        path: 'services/ai/llmStore',
        description: 'LLM configuration and provider management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      router: {
        name: 'AI Router',
        path: 'services/ai/router',
        description: 'Routes AI requests to optimal providers',
        pattern: 'service',
        status: 'stable',
      },
      learning: {
        name: 'Learning System Service',
        path: 'services/ai/learningSystemService',
        description: 'ML-based pattern learning and optimization',
        pattern: 'singleton',
        status: 'stable',
      },
      optimization: {
        name: 'Auto-Optimization Service',
        path: 'services/ai/autoOptimizationService',
        description: 'Automatic performance optimization based on learning',
        pattern: 'singleton',
        status: 'stable',
      },
      scheduler: {
        name: 'Smart Scheduler',
        path: 'services/scheduling/smartSchedulerService',
        description: 'Intelligent task scheduling with learning',
        pattern: 'singleton',
        status: 'stable',
      },
      contentPredictor: {
        name: 'Content Performance Predictor',
        path: 'services/ai/contentPerformancePredictorService',
        description: 'Predicts content performance using ML',
        pattern: 'singleton',
        status: 'beta',
      },
      recycler: {
        name: 'Content Recycler',
        path: 'services/content/contentRecyclerService',
        description: 'Repurposes and optimizes existing content',
        pattern: 'singleton',
        status: 'stable',
      },
    },
  },

  // ========================================
  // REVENUE & MONETIZATION
  // ========================================

  revenue: {
    category: 'Revenue & Monetization',
    description: 'Revenue tracking, passive income, and financial management',
    services: {
      tracker: {
        name: 'Revenue Tracker',
        path: 'revenue/tracker',
        description: 'Legacy revenue tracking system (being consolidated)',
        pattern: 'singleton',
        status: 'stable',
      },
      revenueTracking: {
        name: 'Revenue Tracking Service',
        path: 'services/passive-income/revenueTrackingService',
        description: 'Modern revenue tracking with multi-source support',
        pattern: 'service',
        status: 'stable',
      },
      stripe: {
        name: 'Stripe Integration',
        path: 'services/integrations/stripe/stripeIntegrationService',
        description: 'Stripe payment processing and webhooks',
        pattern: 'service',
        dependencies: ['credentials'],
        status: 'stable',
      },
      gumroad: {
        name: 'Gumroad Integration',
        path: 'services/integrations/gumroad/gumroadIntegrationService',
        description: 'Gumroad sales tracking',
        pattern: 'service',
        dependencies: ['credentials'],
        status: 'stable',
      },
      passiveIncome: {
        name: 'Passive Income Automation',
        path: 'services/passive-income/automationScheduler',
        description: 'Automated passive income generation',
        pattern: 'singleton',
        status: 'stable',
      },
    },
  },

  // ========================================
  // CREDENTIALS & SECURITY
  // ========================================

  credentials: {
    category: 'Credentials & Security',
    description: 'Secure credential storage and encryption',
    services: {
      vault: {
        name: 'Credential Vault',
        path: 'services/credentials/credentialVaultService',
        description: 'Encrypted credential storage for 18+ services',
        pattern: 'singleton',
        dependencies: ['logger', 'activity'],
        status: 'stable',
      },
      security: {
        name: 'Security Service',
        path: 'services/security/securityService',
        description: 'AES-256 encryption, sanitization, validation',
        pattern: 'service',
        status: 'stable',
      },
      smartErrorHandler: {
        name: 'Smart Error Handler',
        path: 'services/errors/smartErrorHandlerService',
        description: 'User-friendly error recovery with auto-fix',
        pattern: 'zustand-store',
        status: 'stable',
      },
    },
  },

  // ========================================
  // USER EXPERIENCE
  // ========================================

  ux: {
    category: 'User Experience',
    description: 'Onboarding, help, preferences, and user-facing services',
    services: {
      onboarding: {
        name: 'Welcome Wizard Service',
        path: 'services/onboarding/welcomeWizardService',
        description: '5-step first-run onboarding experience',
        pattern: 'zustand-store',
        status: 'stable',
      },
      help: {
        name: 'Help System',
        path: 'services/help/helpSystemService',
        description: 'Searchable help with articles, FAQs, shortcuts',
        pattern: 'zustand-store',
        status: 'stable',
      },
      preferences: {
        name: 'User Preferences',
        path: 'services/settings/userPreferencesService',
        description: 'Comprehensive user settings and preferences',
        pattern: 'zustand-store',
        status: 'stable',
      },
      dataPortability: {
        name: 'Data Portability',
        path: 'services/data/dataPortabilityService',
        description: 'Export/import data in multiple formats',
        pattern: 'service',
        status: 'stable',
      },
    },
  },

  // ========================================
  // CONTENT & PUBLISHING
  // ========================================

  content: {
    category: 'Content & Publishing',
    description: 'Content generation, publishing, and distribution',
    services: {
      generation: {
        name: 'Content Generation',
        path: 'services/passive-income/contentGenerationService',
        description: 'AI-powered content creation',
        pattern: 'service',
        status: 'stable',
      },
      wordpress: {
        name: 'WordPress Publisher',
        path: 'services/publishing/wordpressPublisher',
        description: 'Publish to WordPress sites',
        pattern: 'service',
        dependencies: ['credentials'],
        status: 'stable',
      },
      medium: {
        name: 'Medium Publisher',
        path: 'services/publishing/mediumPublisher',
        description: 'Publish to Medium',
        pattern: 'service',
        dependencies: ['credentials'],
        status: 'stable',
      },
      repurposing: {
        name: 'Content Repurposing',
        path: 'services/content/contentRepurposingService',
        description: 'Transform content for different platforms',
        pattern: 'service',
        status: 'stable',
      },
    },
  },

  // ========================================
  // WORKFLOWS & AUTOMATION
  // ========================================

  workflows: {
    category: 'Workflows & Automation',
    description: 'Workflow engine, task automation, and execution',
    services: {
      engine: {
        name: 'Workflow Engine',
        path: 'services/workflow/workflowEngine',
        description: 'Execute multi-step workflows with error handling',
        pattern: 'singleton',
        dependencies: ['eventBus', 'notification'],
        status: 'stable',
      },
      store: {
        name: 'Workflow Store',
        path: 'services/workflow/workflowStore',
        description: 'Workflow state management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      build: {
        name: 'Build Workflow',
        path: 'services/workflow/buildWorkflowService',
        description: 'Automated build processes',
        pattern: 'service',
        status: 'stable',
      },
      deploy: {
        name: 'Deploy Workflow',
        path: 'services/workflow/deployWorkflowService',
        description: 'Automated deployment',
        pattern: 'service',
        status: 'beta',
      },
    },
  },

  // ========================================
  // WEALTH MANAGEMENT
  // ========================================

  wealth: {
    category: 'Wealth Management',
    description: 'Portfolio tracking, market data, and financial analytics',
    services: {
      store: {
        name: 'Wealth Store',
        path: 'services/wealth/wealthStore',
        description: 'Portfolio and wealth state management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      portfolio: {
        name: 'Portfolio Service',
        path: 'services/wealth/portfolioService',
        description: 'Portfolio management and analytics',
        pattern: 'service',
        status: 'stable',
      },
      marketData: {
        name: 'Market Data Service',
        path: 'services/wealth/marketDataService',
        description: 'Real-time market data and pricing',
        pattern: 'service',
        status: 'stable',
      },
      dividends: {
        name: 'Dividend Tracking',
        path: 'services/wealth/dividendTrackingService',
        description: 'Dividend payment tracking and forecasting',
        pattern: 'service',
        status: 'stable',
      },
    },
  },

  // ========================================
  // CRYPTO & TRADING
  // ========================================

  crypto: {
    category: 'Crypto & Trading',
    description: 'Cryptocurrency trading and portfolio management',
    services: {
      store: {
        name: 'Crypto Store',
        path: 'services/crypto/cryptoStore',
        description: 'Crypto trading state management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      coinbase: {
        name: 'Coinbase Integration',
        path: 'services/crypto/coinbaseService',
        description: 'Coinbase API integration',
        pattern: 'service',
        dependencies: ['credentials'],
        status: 'stable',
      },
      marketData: {
        name: 'Crypto Market Data',
        path: 'services/crypto/cryptoMarketDataService',
        description: 'Cryptocurrency market data',
        pattern: 'service',
        status: 'stable',
      },
    },
  },

  // ========================================
  // PROJECT MANAGEMENT
  // ========================================

  project: {
    category: 'Project Management',
    description: 'Project state, file management, and operations',
    services: {
      store: {
        name: 'Project Store',
        path: 'services/project/projectStore',
        description: 'Project state and file tree management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      management: {
        name: 'Project Management',
        path: 'services/project/projectManagementService',
        description: 'Project CRUD operations',
        pattern: 'service',
        status: 'stable',
      },
    },
  },

  // ========================================
  // AGENTS & ORCHESTRATION
  // ========================================

  agents: {
    category: 'Agents & Orchestration',
    description: 'AI agents, orchestration, and autonomous systems',
    services: {
      orchestrator: {
        name: 'Agent Orchestrator',
        path: 'services/agents/agentOrchestratorService',
        description: 'Coordinates multiple AI agents',
        pattern: 'singleton',
        status: 'stable',
      },
      store: {
        name: 'Agent Store',
        path: 'services/agents/agentStore',
        description: 'Agent state management',
        pattern: 'zustand-store',
        status: 'stable',
      },
      itor: {
        name: 'Itor Service',
        path: 'services/agents/itorService',
        description: 'Itor agent implementation',
        pattern: 'service',
        status: 'stable',
      },
      ed: {
        name: 'Ed Service',
        path: 'services/agents/edService',
        description: 'Ed agent implementation',
        pattern: 'service',
        status: 'stable',
      },
    },
  },
};

/**
 * Get all services in a category
 */
export function getServicesByCategory(category: keyof typeof serviceRegistry): ServiceMetadata[] {
  return Object.values(serviceRegistry[category].services);
}

/**
 * Find a service by name across all categories
 */
export function findService(serviceName: string): ServiceMetadata | undefined {
  for (const category of Object.values(serviceRegistry)) {
    const service = category.services[serviceName];
    if (service) return service;
  }
  return undefined;
}

/**
 * Get service dependencies (recursive)
 */
export function getServiceDependencies(serviceName: string): string[] {
  const service = findService(serviceName);
  if (!service || !service.dependencies) return [];

  const deps: string[] = [...service.dependencies];
  for (const dep of service.dependencies) {
    deps.push(...getServiceDependencies(dep));
  }

  return [...new Set(deps)]; // Remove duplicates
}

/**
 * Get all Zustand stores
 */
export function getAllStores(): ServiceMetadata[] {
  const stores: ServiceMetadata[] = [];
  for (const category of Object.values(serviceRegistry)) {
    for (const service of Object.values(category.services)) {
      if (service.pattern === 'zustand-store') {
        stores.push(service);
      }
    }
  }
  return stores;
}

/**
 * Get service count by status
 */
export function getServiceStats() {
  let stable = 0;
  let beta = 0;
  let experimental = 0;

  for (const category of Object.values(serviceRegistry)) {
    for (const service of Object.values(category.services)) {
      if (service.status === 'stable') stable++;
      if (service.status === 'beta') beta++;
      if (service.status === 'experimental') experimental++;
    }
  }

  return { stable, beta, experimental, total: stable + beta + experimental };
}
