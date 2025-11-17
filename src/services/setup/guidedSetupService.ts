/**
 * guidedSetupService.ts
 * Multi-step guided setup wizards for all services.
 */

import { logger } from '../logging/loggerService';
import { credentialVaultService } from '../credentials/credentialVaultService';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: 'check' | 'credentials' | 'test' | 'success' | 'signup';
  completed: boolean;
  skippable: boolean;
  data?: Record<string, any>;
}

export interface ServiceSetup {
  serviceId: string;
  serviceName: string;
  steps: SetupStep[];
  currentStep: number;
  signupUrl?: string;
  docsUrl?: string;
  canAutoCreate?: boolean;
  estimatedTime: number; // minutes
}

export interface SetupProgress {
  serviceId: string;
  stepId: string;
  timestamp: Date;
  data?: Record<string, any>;
}

class GuidedSetupService {
  private setups = new Map<string, ServiceSetup>();
  private progress = new Map<string, SetupProgress[]>();

  initializeSetups(): void {
    // Stripe Setup
    this.setups.set('stripe', {
      serviceId: 'stripe',
      serviceName: 'Stripe',
      currentStep: 0,
      estimatedTime: 5,
      signupUrl: 'https://dashboard.stripe.com/register',
      docsUrl: 'https://stripe.com/docs/keys',
      steps: [
        {
          id: 'check-account',
          title: 'Do you have a Stripe account?',
          description: 'Stripe is required for processing payments and tracking revenue.',
          type: 'check',
          completed: false,
          skippable: false,
        },
        {
          id: 'enter-credentials',
          title: 'Enter Stripe API Keys',
          description: 'Get your API keys from Stripe Dashboard → Developers → API Keys',
          type: 'credentials',
          completed: false,
          skippable: false,
          data: {
            fields: [
              { name: 'apiKey', label: 'Publishable Key', type: 'text', placeholder: 'pk_test_...' },
              { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_test_...' },
            ],
          },
        },
        {
          id: 'test-connection',
          title: 'Test Connection',
          description: 'We\'ll verify your Stripe credentials are working correctly.',
          type: 'test',
          completed: false,
          skippable: false,
        },
        {
          id: 'success',
          title: 'Stripe Connected!',
          description: 'You can now track payments and revenue from Stripe.',
          type: 'success',
          completed: false,
          skippable: false,
        },
      ],
    });

    // WordPress Setup
    this.setups.set('wordpress', {
      serviceId: 'wordpress',
      serviceName: 'WordPress',
      currentStep: 0,
      estimatedTime: 7,
      signupUrl: 'https://wordpress.com/start',
      docsUrl: 'https://wordpress.com/support/application-passwords/',
      canAutoCreate: true,
      steps: [
        {
          id: 'check-account',
          title: 'Do you have a WordPress site?',
          description: 'We can help you create one or connect to your existing site.',
          type: 'check',
          completed: false,
          skippable: false,
        },
        {
          id: 'enter-credentials',
          title: 'Enter WordPress Details',
          description: 'Create an Application Password in your WordPress admin panel.',
          type: 'credentials',
          completed: false,
          skippable: false,
          data: {
            fields: [
              { name: 'url', label: 'Site URL', type: 'url', placeholder: 'https://yourblog.com' },
              { name: 'username', label: 'Username', type: 'text', placeholder: 'admin' },
              { name: 'appPassword', label: 'Application Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx' },
            ],
          },
        },
        {
          id: 'test-connection',
          title: 'Test Connection',
          description: 'We\'ll verify we can publish to your WordPress site.',
          type: 'test',
          completed: false,
          skippable: false,
        },
        {
          id: 'success',
          title: 'WordPress Connected!',
          description: 'You can now automatically publish content to your WordPress site.',
          type: 'success',
          completed: false,
          skippable: false,
        },
      ],
    });

    // Medium Setup
    this.setups.set('medium', {
      serviceId: 'medium',
      serviceName: 'Medium',
      currentStep: 0,
      estimatedTime: 3,
      signupUrl: 'https://medium.com',
      docsUrl: 'https://github.com/Medium/medium-api-docs',
      steps: [
        {
          id: 'check-account',
          title: 'Do you have a Medium account?',
          description: 'Medium is a popular publishing platform for reaching a wider audience.',
          type: 'check',
          completed: false,
          skippable: false,
        },
        {
          id: 'enter-credentials',
          title: 'Enter Medium Integration Token',
          description: 'Get your token from Medium Settings → Security and apps → Integration tokens',
          type: 'credentials',
          completed: false,
          skippable: false,
          data: {
            fields: [
              { name: 'integrationToken', label: 'Integration Token', type: 'password', placeholder: 'Enter token...' },
            ],
          },
        },
        {
          id: 'test-connection',
          title: 'Test Connection',
          description: 'We\'ll verify your Medium credentials.',
          type: 'test',
          completed: false,
          skippable: false,
        },
        {
          id: 'success',
          title: 'Medium Connected!',
          description: 'You can now publish articles to Medium automatically.',
          type: 'success',
          completed: false,
          skippable: false,
        },
      ],
    });

    // GitHub Setup
    this.setups.set('github', {
      serviceId: 'github',
      serviceName: 'GitHub',
      currentStep: 0,
      estimatedTime: 4,
      signupUrl: 'https://github.com/signup',
      docsUrl: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
      steps: [
        {
          id: 'check-account',
          title: 'Do you have a GitHub account?',
          description: 'GitHub integration allows automated repository management and documentation.',
          type: 'check',
          completed: false,
          skippable: false,
        },
        {
          id: 'enter-credentials',
          title: 'Enter GitHub Personal Access Token',
          description: 'Create a token at GitHub Settings → Developer settings → Personal access tokens',
          type: 'credentials',
          completed: false,
          skippable: false,
          data: {
            fields: [
              { name: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'ghp_...' },
            ],
          },
        },
        {
          id: 'test-connection',
          title: 'Test Connection',
          description: 'We\'ll verify your GitHub access token.',
          type: 'test',
          completed: false,
          skippable: false,
        },
        {
          id: 'success',
          title: 'GitHub Connected!',
          description: 'You can now manage repositories and create releases automatically.',
          type: 'success',
          completed: false,
          skippable: false,
        },
      ],
    });

    // LM Studio Setup
    this.setups.set('lmstudio', {
      serviceId: 'lmstudio',
      serviceName: 'LM Studio',
      currentStep: 0,
      estimatedTime: 2,
      signupUrl: 'https://lmstudio.ai',
      docsUrl: 'https://lmstudio.ai/docs',
      steps: [
        {
          id: 'check-account',
          title: 'Is LM Studio running locally?',
          description: 'LM Studio allows you to run AI models locally on your machine.',
          type: 'check',
          completed: false,
          skippable: false,
        },
        {
          id: 'enter-credentials',
          title: 'Configure LM Studio Endpoint',
          description: 'LM Studio typically runs on http://localhost:1234',
          type: 'credentials',
          completed: false,
          skippable: false,
          data: {
            fields: [
              { name: 'endpoint', label: 'API Endpoint', type: 'url', placeholder: 'http://localhost:1234' },
              { name: 'apiKey', label: 'API Key (optional)', type: 'password', placeholder: 'Leave empty if not required' },
            ],
          },
        },
        {
          id: 'test-connection',
          title: 'Test Connection',
          description: 'We\'ll check if LM Studio is running and accessible.',
          type: 'test',
          completed: false,
          skippable: false,
        },
        {
          id: 'success',
          title: 'LM Studio Connected!',
          description: 'You can now use local AI models for content generation.',
          type: 'success',
          completed: false,
          skippable: false,
        },
      ],
    });

    logger.info('Guided setups initialized', { count: this.setups.size });
  }

  getSetup(serviceId: string): ServiceSetup | undefined {
    return this.setups.get(serviceId);
  }

  getAllSetups(): ServiceSetup[] {
    return Array.from(this.setups.values());
  }

  nextStep(serviceId: string): boolean {
    const setup = this.setups.get(serviceId);
    if (!setup) return false;

    if (setup.currentStep < setup.steps.length - 1) {
      setup.steps[setup.currentStep].completed = true;
      setup.currentStep++;
      return true;
    }

    return false;
  }

  previousStep(serviceId: string): boolean {
    const setup = this.setups.get(serviceId);
    if (!setup) return false;

    if (setup.currentStep > 0) {
      setup.currentStep--;
      return true;
    }

    return false;
  }

  skipStep(serviceId: string): boolean {
    const setup = this.setups.get(serviceId);
    if (!setup) return false;

    const currentStep = setup.steps[setup.currentStep];
    if (!currentStep.skippable) return false;

    return this.nextStep(serviceId);
  }

  saveCredentials(serviceId: string, credentials: Record<string, string>): void {
    credentialVaultService.setCredentials(serviceId, credentials);

    this.recordProgress(serviceId, 'credentials-saved', { credentialsSet: true });

    logger.info('Setup credentials saved', { serviceId });
  }

  async testSetup(serviceId: string): Promise<boolean> {
    const result = await credentialVaultService.testConnection(serviceId);

    this.recordProgress(serviceId, 'connection-tested', {
      success: result.success,
      message: result.message,
    });

    return result.success;
  }

  completeSetup(serviceId: string): void {
    const setup = this.setups.get(serviceId);
    if (!setup) return;

    setup.steps.forEach(step => (step.completed = true));

    this.recordProgress(serviceId, 'setup-complete', { completed: true });

    logger.info('Setup completed', { serviceId });
  }

  resetSetup(serviceId: string): void {
    const setup = this.setups.get(serviceId);
    if (!setup) return;

    setup.currentStep = 0;
    setup.steps.forEach(step => (step.completed = false));

    logger.info('Setup reset', { serviceId });
  }

  private recordProgress(serviceId: string, stepId: string, data?: Record<string, any>): void {
    const history = this.progress.get(serviceId) || [];

    history.push({
      serviceId,
      stepId,
      timestamp: new Date(),
      data,
    });

    this.progress.set(serviceId, history);
  }

  getProgress(serviceId: string): SetupProgress[] {
    return this.progress.get(serviceId) || [];
  }

  getSetupStats(): {
    totalSetups: number;
    completedSetups: number;
    inProgressSetups: number;
  } {
    const setups = this.getAllSetups();

    return {
      totalSetups: setups.length,
      completedSetups: setups.filter(s => s.steps.every(step => step.completed)).length,
      inProgressSetups: setups.filter(s => s.currentStep > 0 && !s.steps.every(step => step.completed)).length,
    };
  }

  quickTest() {
    this.initializeSetups();

    const stripe = this.getSetup('stripe');
    const wordpress = this.getSetup('wordpress');

    // Simulate setup flow
    if (stripe) {
      this.nextStep('stripe');
      this.saveCredentials('stripe', { apiKey: 'pk_test_123', secretKey: 'sk_test_456' });
      this.nextStep('stripe');
    }

    const stats = this.getSetupStats();

    return {
      totalSetups: this.setups.size,
      stats,
      stripeSetup: stripe
        ? {
            currentStep: stripe.currentStep,
            stepTitle: stripe.steps[stripe.currentStep]?.title,
          }
        : null,
      availableSetups: this.getAllSetups().map(s => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        estimatedTime: s.estimatedTime,
        canAutoCreate: s.canAutoCreate,
      })),
    };
  }
}

export const guidedSetupService = new GuidedSetupService();
if (typeof window !== 'undefined') (window as any).testGuidedSetup = () => guidedSetupService.quickTest();
