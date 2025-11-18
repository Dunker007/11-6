/**
 * welcomeWizardService.ts
 *
 * PURPOSE:
 * Manages the first-run onboarding experience for new users. Tracks completion status,
 * current step, user profile setup, and provides methods to navigate through the wizard.
 *
 * FEATURES:
 * - 5-step onboarding flow (Welcome → Profile → Quick Wins → Tour → Dashboard)
 * - Persistent state via localStorage
 * - Resume capability
 * - Skip option
 * - Progress tracking
 * - User profile management
 *
 * ARCHITECTURE:
 * Service using Zustand for state management with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep =
  | 'welcome'
  | 'profile'
  | 'quick-wins'
  | 'tour'
  | 'dashboard';

export interface UserProfile {
  name: string;
  email?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  interests: string[];
}

interface OnboardingState {
  // State
  isCompleted: boolean;
  isSkipped: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  userProfile: Partial<UserProfile>;

  // Actions
  startOnboarding: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  goToStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  markStepComplete: (step: OnboardingStep) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  resetOnboarding: () => void;

  // Getters
  getProgress: () => number;
  shouldShowWizard: () => boolean;
  isStepComplete: (step: OnboardingStep) => boolean;
}

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'profile',
  'quick-wins',
  'tour',
  'dashboard',
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      isCompleted: false,
      isSkipped: false,
      currentStep: 'welcome',
      completedSteps: [],
      userProfile: {},

      // Actions
      startOnboarding: () => {
        set({
          currentStep: 'welcome',
          isCompleted: false,
          isSkipped: false,
          completedSteps: [],
        });
      },

      skipOnboarding: () => {
        set({
          isSkipped: true,
          isCompleted: true,
        });
      },

      completeOnboarding: () => {
        set({
          isCompleted: true,
          completedSteps: STEP_ORDER,
        });
      },

      goToStep: (step: OnboardingStep) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        const state = get();
        const currentIndex = STEP_ORDER.indexOf(state.currentStep);

        // Mark current step as complete
        if (!state.completedSteps.includes(state.currentStep)) {
          set({
            completedSteps: [...state.completedSteps, state.currentStep],
          });
        }

        // Move to next step or complete
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[currentIndex + 1] });
        } else {
          get().completeOnboarding();
        }
      },

      previousStep: () => {
        const state = get();
        const currentIndex = STEP_ORDER.indexOf(state.currentStep);

        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },

      markStepComplete: (step: OnboardingStep) => {
        const state = get();
        if (!state.completedSteps.includes(step)) {
          set({
            completedSteps: [...state.completedSteps, step],
          });
        }
      },

      updateProfile: (profile: Partial<UserProfile>) => {
        set((state) => ({
          userProfile: { ...state.userProfile, ...profile },
        }));
      },

      resetOnboarding: () => {
        set({
          isCompleted: false,
          isSkipped: false,
          currentStep: 'welcome',
          completedSteps: [],
          userProfile: {},
        });
      },

      // Getters
      getProgress: () => {
        const state = get();
        const currentIndex = STEP_ORDER.indexOf(state.currentStep);
        return ((currentIndex + 1) / STEP_ORDER.length) * 100;
      },

      shouldShowWizard: () => {
        const state = get();
        return !state.isCompleted && !state.isSkipped;
      },

      isStepComplete: (step: OnboardingStep) => {
        const state = get();
        return state.completedSteps.includes(step);
      },
    }),
    {
      name: 'dlx-onboarding',
      version: 1,
    }
  )
);

// Service helper methods
export const welcomeWizardService = {
  /**
   * Check if this is the user's first time using the app
   */
  isFirstRun(): boolean {
    const state = useOnboardingStore.getState();
    return !state.isCompleted && !state.isSkipped && state.completedSteps.length === 0;
  },

  /**
   * Get current step index (0-based)
   */
  getCurrentStepIndex(): number {
    const state = useOnboardingStore.getState();
    return STEP_ORDER.indexOf(state.currentStep);
  },

  /**
   * Get total number of steps
   */
  getTotalSteps(): number {
    return STEP_ORDER.length;
  },

  /**
   * Get step title for display
   */
  getStepTitle(step: OnboardingStep): string {
    const titles: Record<OnboardingStep, string> = {
      welcome: 'Welcome to DLX Studios',
      profile: 'Set Up Your Profile',
      'quick-wins': 'Your First Success',
      tour: 'Feature Tour',
      dashboard: "You're Ready!",
    };
    return titles[step];
  },

  /**
   * Get step description
   */
  getStepDescription(step: OnboardingStep): string {
    const descriptions: Record<OnboardingStep, string> = {
      welcome: 'Transform your computer into a passive income machine',
      profile: 'Tell us a bit about yourself',
      'quick-wins': 'Generate your first piece of content in 5 minutes',
      tour: 'Discover what DLX can do for you',
      dashboard: 'Start earning with DLX',
    };
    return descriptions[step];
  },

  /**
   * Check if user can skip current step
   */
  canSkipStep(step: OnboardingStep): boolean {
    // Welcome can be skipped, profile is optional, others should be experienced
    return step === 'welcome' || step === 'profile';
  },

  /**
   * Get recommended actions for each step
   */
  getStepActions(step: OnboardingStep): string[] {
    const actions: Record<OnboardingStep, string[]> = {
      welcome: [
        'Watch the 2-minute intro video',
        'Read about key features',
        'Get started',
      ],
      profile: [
        'Enter your name',
        'Select your experience level',
        'Choose your goals',
      ],
      'quick-wins': [
        'Connect your first service',
        'Generate a blog post',
        'See your results',
      ],
      tour: [
        'Explore AI features',
        'Try content generation',
        'Learn about automation',
      ],
      dashboard: [
        'Connect more services',
        'Set up your first workflow',
        'Start earning',
      ],
    };
    return actions[step];
  },
};
