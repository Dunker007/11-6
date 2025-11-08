import { ErrorContext } from '../../types/error';
import { useActivityStore } from '../activity/activityStore';

/**
 * Error Context Capture Service
 * Captures application context for error logging
 */

class ErrorContextCapture {
  private static instance: ErrorContextCapture;
  private currentWorkflow: string | null = null;
  private currentProject: string | null = null;
  private currentFile: string | null = null;

  private constructor() {}

  static getInstance(): ErrorContextCapture {
    if (!ErrorContextCapture.instance) {
      ErrorContextCapture.instance = new ErrorContextCapture();
    }
    return ErrorContextCapture.instance;
  }

  /**
   * Set the current workflow
   */
  setWorkflow(workflow: string): void {
    this.currentWorkflow = workflow;
  }

  /**
   * Set the current project
   */
  setProject(project: string | null): void {
    this.currentProject = project;
  }

  /**
   * Set the current file
   */
  setFile(file: string | null): void {
    this.currentFile = file;
  }

  /**
   * Get the current context
   */
  getContext(): Partial<ErrorContext> {
    // Get recent activities from store
    const recentActions = this.getRecentActions();

    return {
      activeWorkflow: this.currentWorkflow || undefined,
      activeProject: this.currentProject || undefined,
      activeFile: this.currentFile || undefined,
      recentActions,
      url: window.location.href,
      browser: this.getBrowserInfo(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Get recent activity descriptions
   */
  private getRecentActions(): string[] {
    try {
      const activities = useActivityStore.getState().activities.slice(0, 5);
      return activities.map(a => `${a.action} ${a.description}`);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get browser information
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }
}

export const errorContext = ErrorContextCapture.getInstance();

