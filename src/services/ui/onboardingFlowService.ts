/**
 * onboardingFlowService.ts
 * Interactive onboarding flow for new users.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: string;
  completed: boolean;
  optional: boolean;
  order: number;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  skippedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
}

export interface OnboardingConfig {
  showWelcomeVideo: boolean;
  autoAdvance: boolean;
  allowSkip: boolean;
  trackAnalytics: boolean;
}

class OnboardingFlowService {
  private steps: OnboardingStep[] = [];
  private userProgress = new Map<string, OnboardingProgress>();
  private config: OnboardingConfig = {
    showWelcomeVideo: true,
    autoAdvance: false,
    allowSkip: true,
    trackAnalytics: true,
  };

  initializeSteps(): void {
    this.steps = [
      {
        id: 'welcome',
        title: 'Welcome to DLX Studios',
        description: 'Learn about our passive income automation platform',
        component: 'WelcomeScreen',
        completed: false,
        optional: false,
        order: 0,
      },
      {
        id: 'profile-setup',
        title: 'Set Up Your Profile',
        description: 'Tell us about yourself and your goals',
        component: 'ProfileSetup',
        completed: false,
        optional: false,
        order: 1,
      },
      {
        id: 'connect-platforms',
        title: 'Connect Your Platforms',
        description: 'Link your social media and publishing platforms',
        component: 'PlatformConnector',
        completed: false,
        optional: true,
        order: 2,
      },
      {
        id: 'content-preferences',
        title: 'Content Preferences',
        description: 'Configure your content creation preferences',
        component: 'ContentPreferences',
        completed: false,
        optional: false,
        order: 3,
      },
      {
        id: 'revenue-setup',
        title: 'Revenue Tracking Setup',
        description: 'Connect payment processors and set revenue goals',
        component: 'RevenueSetup',
        completed: false,
        optional: true,
        order: 4,
      },
      {
        id: 'first-content',
        title: 'Create Your First Content',
        description: 'Generate your first piece of automated content',
        component: 'FirstContentCreator',
        completed: false,
        optional: false,
        order: 5,
      },
      {
        id: 'dashboard-tour',
        title: 'Dashboard Tour',
        description: 'Explore the dashboard and key features',
        component: 'DashboardTour',
        completed: false,
        optional: true,
        order: 6,
      },
    ];

    logger.info('Onboarding steps initialized', { count: this.steps.length });
  }

  startOnboarding(userId: string): OnboardingProgress {
    const progress: OnboardingProgress = {
      userId,
      currentStep: 0,
      completedSteps: [],
      skippedSteps: [],
      startedAt: new Date(),
      progress: 0,
    };

    this.userProgress.set(userId, progress);

    activityService.logActivity({
      type: 'onboarding_started',
      message: 'User started onboarding',
      metadata: { userId },
    });

    logger.info('Onboarding started', { userId });

    return progress;
  }

  completeStep(userId: string, stepId: string): boolean {
    const progress = this.userProgress.get(userId);
    const step = this.steps.find(s => s.id === stepId);

    if (!progress || !step) {
      return false;
    }

    step.completed = true;
    progress.completedSteps.push(stepId);
    progress.currentStep = Math.min(progress.currentStep + 1, this.steps.length - 1);
    progress.progress = this.calculateProgress(progress);

    logger.info('Step completed', { userId, stepId, progress: progress.progress });

    // Check if onboarding is complete
    if (this.isOnboardingComplete(progress)) {
      this.completeOnboarding(userId);
    }

    return true;
  }

  skipStep(userId: string, stepId: string): boolean {
    const progress = this.userProgress.get(userId);
    const step = this.steps.find(s => s.id === stepId);

    if (!progress || !step || !step.optional) {
      return false;
    }

    progress.skippedSteps.push(stepId);
    progress.currentStep = Math.min(progress.currentStep + 1, this.steps.length - 1);

    logger.info('Step skipped', { userId, stepId });

    return true;
  }

  goToStep(userId: string, stepIndex: number): boolean {
    const progress = this.userProgress.get(userId);

    if (!progress || stepIndex < 0 || stepIndex >= this.steps.length) {
      return false;
    }

    progress.currentStep = stepIndex;
    logger.info('Navigated to step', { userId, stepIndex });

    return true;
  }

  private completeOnboarding(userId: string): void {
    const progress = this.userProgress.get(userId);

    if (!progress) {
      return;
    }

    progress.completedAt = new Date();
    progress.progress = 100;

    activityService.logActivity({
      type: 'onboarding_completed',
      message: 'User completed onboarding',
      metadata: {
        userId,
        duration: progress.completedAt.getTime() - progress.startedAt.getTime(),
        skippedSteps: progress.skippedSteps.length,
      },
    });

    logger.info('Onboarding completed', { userId });
  }

  private isOnboardingComplete(progress: OnboardingProgress): boolean {
    const requiredSteps = this.steps.filter(s => !s.optional);
    const completedRequiredSteps = requiredSteps.filter(s =>
      progress.completedSteps.includes(s.id)
    );

    return completedRequiredSteps.length === requiredSteps.length;
  }

  private calculateProgress(progress: OnboardingProgress): number {
    const totalSteps = this.steps.filter(s => !s.optional).length;
    const completedRequired = this.steps
      .filter(s => !s.optional && progress.completedSteps.includes(s.id))
      .length;

    return Math.round((completedRequired / totalSteps) * 100);
  }

  getProgress(userId: string): OnboardingProgress | undefined {
    return this.userProgress.get(userId);
  }

  getCurrentStep(userId: string): OnboardingStep | undefined {
    const progress = this.userProgress.get(userId);

    if (!progress) {
      return undefined;
    }

    return this.steps[progress.currentStep];
  }

  getAllSteps(): OnboardingStep[] {
    return [...this.steps].sort((a, b) => a.order - b.order);
  }

  resetOnboarding(userId: string): void {
    this.userProgress.delete(userId);
    this.steps.forEach(step => (step.completed = false));
    logger.info('Onboarding reset', { userId });
  }

  updateConfig(newConfig: Partial<OnboardingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Onboarding config updated', this.config);
  }

  getConfig(): OnboardingConfig {
    return { ...this.config };
  }

  quickTest() {
    this.initializeSteps();

    const userId = 'test-user-123';
    const progress = this.startOnboarding(userId);

    // Complete some steps
    this.completeStep(userId, 'welcome');
    this.completeStep(userId, 'profile-setup');
    this.skipStep(userId, 'connect-platforms');
    this.completeStep(userId, 'content-preferences');

    const currentProgress = this.getProgress(userId);
    const currentStep = this.getCurrentStep(userId);

    return {
      steps: this.getAllSteps().map(s => ({ id: s.id, title: s.title, completed: s.completed, optional: s.optional })),
      progress: currentProgress,
      currentStep,
      config: this.config,
    };
  }
}

export const onboardingFlowService = new OnboardingFlowService();
if (typeof window !== 'undefined') (window as any).testOnboardingFlow = () => onboardingFlowService.quickTest();
