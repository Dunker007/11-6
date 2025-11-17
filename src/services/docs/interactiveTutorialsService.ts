/**
 * interactiveTutorialsService.ts
 * Interactive step-by-step tutorials with progress tracking.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  action?: string;
  code?: string;
  validation?: () => boolean;
  hints: string[];
  completed: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  category: string;
  steps: TutorialStep[];
  prerequisites: string[];
  tags: string[];
}

export interface UserProgress {
  userId: string;
  tutorialId: string;
  currentStep: number;
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number;
}

export interface TutorialStats {
  totalTutorials: number;
  completedTutorials: number;
  inProgressTutorials: number;
  totalTimeSpent: number;
  completionRate: number;
}

class InteractiveTutorialsService {
  private tutorials: Tutorial[] = [];
  private userProgress = new Map<string, UserProgress[]>();

  createTutorial(tutorial: Omit<Tutorial, 'id'>): Tutorial {
    const fullTutorial: Tutorial = {
      id: crypto.randomUUID(),
      ...tutorial,
    };

    this.tutorials.push(fullTutorial);

    logger.info('Tutorial created', { id: fullTutorial.id, title: tutorial.title });

    return fullTutorial;
  }

  getTutorial(tutorialId: string): Tutorial | undefined {
    return this.tutorials.find(t => t.id === tutorialId);
  }

  getAllTutorials(): Tutorial[] {
    return this.tutorials;
  }

  getTutorialsByCategory(category: string): Tutorial[] {
    return this.tutorials.filter(t => t.category === category);
  }

  getTutorialsByDifficulty(difficulty: Tutorial['difficulty']): Tutorial[] {
    return this.tutorials.filter(t => t.difficulty === difficulty);
  }

  startTutorial(userId: string, tutorialId: string): UserProgress {
    const tutorial = this.getTutorial(tutorialId);

    if (!tutorial) {
      throw new Error('Tutorial not found');
    }

    const progress: UserProgress = {
      userId,
      tutorialId,
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date(),
      timeSpent: 0,
    };

    const userProgressList = this.userProgress.get(userId) || [];
    userProgressList.push(progress);
    this.userProgress.set(userId, userProgressList);

    activityService.logActivity({
      type: 'tutorial_started',
      message: `Started tutorial: ${tutorial.title}`,
      metadata: { tutorialId, userId },
    });

    logger.info('Tutorial started', { userId, tutorialId });

    return progress;
  }

  completeStep(userId: string, tutorialId: string, stepId: string): boolean {
    const progress = this.getUserProgress(userId, tutorialId);
    const tutorial = this.getTutorial(tutorialId);

    if (!progress || !tutorial) {
      return false;
    }

    const step = tutorial.steps.find(s => s.id === stepId);

    if (!step) {
      return false;
    }

    step.completed = true;
    progress.completedSteps.push(stepId);
    progress.currentStep = Math.min(progress.currentStep + 1, tutorial.steps.length - 1);

    logger.info('Tutorial step completed', { userId, tutorialId, stepId });

    // Check if tutorial is complete
    if (progress.completedSteps.length === tutorial.steps.length) {
      this.completeTutorial(userId, tutorialId);
    }

    return true;
  }

  private completeTutorial(userId: string, tutorialId: string): void {
    const progress = this.getUserProgress(userId, tutorialId);
    const tutorial = this.getTutorial(tutorialId);

    if (!progress || !tutorial) {
      return;
    }

    progress.completedAt = new Date();
    progress.timeSpent = progress.completedAt.getTime() - progress.startedAt.getTime();

    activityService.logActivity({
      type: 'tutorial_completed',
      message: `Completed tutorial: ${tutorial.title}`,
      metadata: {
        tutorialId,
        userId,
        timeSpent: progress.timeSpent,
      },
    });

    logger.info('Tutorial completed', { userId, tutorialId, timeSpent: progress.timeSpent });
  }

  getUserProgress(userId: string, tutorialId: string): UserProgress | undefined {
    const progressList = this.userProgress.get(userId) || [];
    return progressList.find(p => p.tutorialId === tutorialId);
  }

  getAllUserProgress(userId: string): UserProgress[] {
    return this.userProgress.get(userId) || [];
  }

  getStats(userId: string): TutorialStats {
    const progressList = this.getAllUserProgress(userId);

    const completed = progressList.filter(p => p.completedAt).length;
    const inProgress = progressList.filter(p => !p.completedAt).length;
    const totalTime = progressList.reduce((sum, p) => sum + p.timeSpent, 0);

    return {
      totalTutorials: this.tutorials.length,
      completedTutorials: completed,
      inProgressTutorials: inProgress,
      totalTimeSpent: totalTime,
      completionRate: progressList.length > 0 ? (completed / progressList.length) * 100 : 0,
    };
  }

  searchTutorials(query: string): Tutorial[] {
    const lowerQuery = query.toLowerCase();

    return this.tutorials.filter(t => {
      const titleMatch = t.title.toLowerCase().includes(lowerQuery);
      const descMatch = t.description.toLowerCase().includes(lowerQuery);
      const tagMatch = t.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

      return titleMatch || descMatch || tagMatch;
    });
  }

  getRecommendations(userId: string, limit: number = 3): Tutorial[] {
    const stats = this.getStats(userId);
    const progressList = this.getAllUserProgress(userId);
    const completedIds = progressList.filter(p => p.completedAt).map(p => p.tutorialId);

    // Recommend tutorials not yet started
    const available = this.tutorials.filter(t => !completedIds.includes(t.id));

    // Sort by difficulty and relevance
    return available.slice(0, limit);
  }

  initializeDefaultTutorials(): void {
    // Tutorial 1: Getting Started
    this.createTutorial({
      title: 'Getting Started with DLX Studios',
      description: 'Learn the basics of the platform and create your first automated content',
      difficulty: 'beginner',
      estimatedTime: 10,
      category: 'Getting Started',
      steps: [
        {
          id: crypto.randomUUID(),
          title: 'Welcome',
          content: 'Welcome to DLX Studios! This tutorial will guide you through the basics.',
          hints: ['Take your time', 'You can pause anytime'],
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          title: 'Create Your Profile',
          content: 'Set up your profile with your goals and preferences.',
          action: 'profile-setup',
          hints: ['Be specific about your goals', 'You can change this later'],
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          title: 'Generate Content',
          content: 'Create your first piece of AI-generated content.',
          action: 'generate-content',
          code: 'contentService.generate({ topic: "Passive Income" })',
          hints: ['Choose a topic you\'re passionate about'],
          completed: false,
        },
      ],
      prerequisites: [],
      tags: ['basics', 'setup', 'beginner'],
    });

    // Tutorial 2: Content Automation
    this.createTutorial({
      title: 'Automate Your Content Pipeline',
      description: 'Set up automated content generation and publishing workflows',
      difficulty: 'intermediate',
      estimatedTime: 20,
      category: 'Content',
      steps: [
        {
          id: crypto.randomUUID(),
          title: 'Content Strategy',
          content: 'Define your content strategy and target audience.',
          hints: ['Focus on a specific niche'],
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          title: 'Repurposing Setup',
          content: 'Configure content repurposing across multiple formats.',
          action: 'setup-repurposing',
          hints: ['Start with 2-3 formats'],
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          title: 'Publishing Automation',
          content: 'Connect platforms and set up automatic publishing.',
          action: 'setup-publishing',
          hints: ['Test with one platform first'],
          completed: false,
        },
      ],
      prerequisites: ['getting-started'],
      tags: ['automation', 'content', 'workflow'],
    });

    // Tutorial 3: Revenue Tracking
    this.createTutorial({
      title: 'Track Your Revenue Streams',
      description: 'Set up comprehensive revenue tracking and analytics',
      difficulty: 'intermediate',
      estimatedTime: 15,
      category: 'Revenue',
      steps: [
        {
          id: crypto.randomUUID(),
          title: 'Connect Payment Processors',
          content: 'Link Stripe, Gumroad, and other payment platforms.',
          action: 'connect-payments',
          hints: ['Use API keys from your dashboard'],
          completed: false,
        },
        {
          id: crypto.randomUUID(),
          title: 'Configure Analytics',
          content: 'Set up revenue analytics and forecasting.',
          hints: ['Enable all metrics for best insights'],
          completed: false,
        },
      ],
      prerequisites: ['getting-started'],
      tags: ['revenue', 'analytics', 'tracking'],
    });

    logger.info('Default tutorials initialized', { count: this.tutorials.length });
  }

  quickTest() {
    this.initializeDefaultTutorials();

    const userId = 'test-user';

    // Start and complete a tutorial
    const tutorial = this.tutorials[0];
    const progress = this.startTutorial(userId, tutorial.id);

    tutorial.steps.forEach(step => {
      this.completeStep(userId, tutorial.id, step.id);
    });

    const stats = this.getStats(userId);
    const recommendations = this.getRecommendations(userId);
    const beginnerTutorials = this.getTutorialsByDifficulty('beginner');

    return {
      totalTutorials: this.tutorials.length,
      categories: [...new Set(this.tutorials.map(t => t.category))],
      stats,
      recommendations: recommendations.map(t => ({ title: t.title, difficulty: t.difficulty })),
      beginnerTutorials: beginnerTutorials.length,
      sampleProgress: progress,
    };
  }
}

export const interactiveTutorialsService = new InteractiveTutorialsService();
if (typeof window !== 'undefined') (window as any).testInteractiveTutorials = () => interactiveTutorialsService.quickTest();
