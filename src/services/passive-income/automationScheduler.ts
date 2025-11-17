/**
 * automationScheduler.ts
 *
 * PURPOSE:
 * 24/7 automation scheduler for passive income generation. Manages scheduled tasks
 * for content generation, affiliate link updates, revenue tracking, and other
 * automated operations. Provides cron-like scheduling with robust error handling
 * and retry logic.
 *
 * ARCHITECTURE:
 * - Cron-style scheduling for recurring tasks
 * - Task queue with priority management
 * - Automatic retry on failure with exponential backoff
 * - Task dependency management
 * - Performance monitoring and optimization
 * - Graceful shutdown and state persistence
 *
 * FEATURES:
 * ✅ Cron-style scheduling (daily, weekly, monthly)
 * ✅ Priority-based task queue
 * ✅ Automatic retries with exponential backoff
 * ✅ Task dependencies and chaining
 * ✅ Parallel task execution
 * ✅ Performance monitoring
 * ✅ Pause/resume functionality
 * ✅ Task history and logging
 *
 * DEPENDENCIES:
 * - contentGenerationService: Automated content generation
 * - affiliateLinkService: Affiliate link management
 * - revenueTrackingService: Revenue tracking
 * - logger: Activity logging
 */

import { contentGenerationService, type ContentGenerationOptions } from './contentGenerationService';
import { affiliateLinkService } from './affiliateLinkService';
import { revenueTrackingService } from './revenueTrackingService';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  type: 'content-generation' | 'affiliate-update' | 'revenue-sync' | 'custom';
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly' | 'interval';
    time?: string; // HH:MM format for daily
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    intervalMs?: number; // For interval type
  };
  priority: TaskPriority;
  status: TaskStatus;
  action: () => Promise<void>;
  retryConfig: {
    maxRetries: number;
    currentRetry: number;
    backoffMs: number; // Exponential backoff base
  };
  dependencies?: string[]; // IDs of tasks that must complete first
  lastRun?: Date;
  nextRun?: Date;
  lastResult?: {
    success: boolean;
    error?: string;
    duration: number;
  };
  metadata?: Record<string, any>;
}

export interface TaskHistory {
  taskId: string;
  taskName: string;
  startedAt: Date;
  completedAt?: Date;
  success: boolean;
  error?: string;
  duration: number;
}

class AutomationScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private history: TaskHistory[] = [];
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private taskQueue: string[] = []; // Task IDs in priority order

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultTasks();
  }

  /**
   * Load tasks from localStorage
   */
  private loadFromStorage() {
    try {
      const tasksData = localStorage.getItem('automation-tasks');
      const historyData = localStorage.getItem('automation-history');

      if (tasksData) {
        const parsed = JSON.parse(tasksData);
        Object.values(parsed).forEach((task: any) => {
          // Restore dates
          if (task.lastRun) task.lastRun = new Date(task.lastRun);
          if (task.nextRun) task.nextRun = new Date(task.nextRun);
          if (task.lastResult?.completedAt)
            task.lastResult.completedAt = new Date(task.lastResult.completedAt);
        });

        // Note: We can't restore action functions from JSON
        // Default actions will be re-initialized in initializeDefaultTasks()
        logger.info('Automation tasks loaded from storage');
      }

      if (historyData) {
        this.history = JSON.parse(historyData, (key, value) => {
          if (key === 'startedAt' || key === 'completedAt') {
            return new Date(value);
          }
          return value;
        });
        logger.info('Task history loaded', { count: this.history.length });
      }
    } catch (error) {
      logger.error('Failed to load automation data from storage', { error });
    }
  }

  /**
   * Save tasks to localStorage
   */
  private saveToStorage() {
    try {
      // Convert tasks Map to object, excluding action functions
      const tasksObj = Object.fromEntries(
        Array.from(this.tasks.entries()).map(([id, task]) => [
          id,
          {
            ...task,
            action: undefined, // Can't serialize functions
          },
        ])
      );

      localStorage.setItem('automation-tasks', JSON.stringify(tasksObj));
      localStorage.setItem('automation-history', JSON.stringify(this.history.slice(-100))); // Keep last 100
    } catch (error) {
      logger.error('Failed to save automation data to storage', { error });
    }
  }

  /**
   * Initialize default automation tasks
   */
  private initializeDefaultTasks() {
    // Daily content generation
    this.scheduleTask({
      id: 'daily-content-generation',
      name: 'Daily Content Generation',
      description: 'Generate blog posts and social media content',
      type: 'content-generation',
      schedule: {
        type: 'daily',
        time: '09:00',
      },
      priority: 'high',
      action: async () => {
        logger.info('Running daily content generation...');

        // Generate 3 pieces of content
        const templates = contentGenerationService.getTemplates();
        const blogTemplate = templates.find((t) => t.type === 'blog');
        const socialTemplate = templates.find((t) => t.type === 'social');

        if (blogTemplate) {
          await contentGenerationService.generateContent({
            template: blogTemplate,
            variables: {
              topic: 'Latest tech trends',
              wordCount: '800',
              tone: 'professional',
            },
          });
        }

        if (socialTemplate) {
          await contentGenerationService.generateContent({
            template: socialTemplate,
            variables: {
              topic: 'Productivity tips',
            },
          });
        }

        logger.info('Daily content generation complete');
      },
      retryConfig: {
        maxRetries: 3,
        currentRetry: 0,
        backoffMs: 60000, // 1 minute base
      },
    });

    // Weekly revenue sync
    this.scheduleTask({
      id: 'weekly-revenue-sync',
      name: 'Weekly Revenue Sync',
      description: 'Sync and analyze revenue data',
      type: 'revenue-sync',
      schedule: {
        type: 'weekly',
        dayOfWeek: 1, // Monday
        time: '10:00',
      },
      priority: 'medium',
      action: async () => {
        logger.info('Running weekly revenue sync...');

        const analytics = revenueTrackingService.getAnalytics('week');
        logger.info('Weekly revenue analytics', analytics);

        // Generate forecast
        const forecast = revenueTrackingService.getForecast(1);
        logger.info('Revenue forecast', forecast);

        activityService.addActivity({
          type: 'revenue',
          action: 'Weekly Revenue Sync',
          description: `Total: $${analytics.totalRevenue.toFixed(2)} | Growth: ${analytics.growth}`,
        });
      },
      retryConfig: {
        maxRetries: 2,
        currentRetry: 0,
        backoffMs: 30000,
      },
    });

    // Hourly affiliate link check
    this.scheduleTask({
      id: 'hourly-affiliate-check',
      name: 'Affiliate Link Health Check',
      description: 'Check affiliate links and update analytics',
      type: 'affiliate-update',
      schedule: {
        type: 'interval',
        intervalMs: 3600000, // Every hour
      },
      priority: 'low',
      action: async () => {
        logger.debug('Running affiliate link health check...');

        const analytics = affiliateLinkService.getAnalytics();
        logger.debug('Affiliate analytics', analytics);

        // Log top performers
        if (analytics.topPerformers.length > 0) {
          logger.info('Top performing affiliate links', {
            top: analytics.topPerformers[0].productName,
            revenue: analytics.topPerformers[0].revenue,
          });
        }
      },
      retryConfig: {
        maxRetries: 1,
        currentRetry: 0,
        backoffMs: 15000,
      },
    });

    logger.info('Default automation tasks initialized');
  }

  /**
   * Schedule a new task
   */
  scheduleTask(
    task: Omit<ScheduledTask, 'status' | 'retryConfig'> & {
      retryConfig?: Partial<ScheduledTask['retryConfig']>;
    }
  ): ScheduledTask {
    const scheduledTask: ScheduledTask = {
      ...task,
      status: 'pending',
      retryConfig: {
        maxRetries: task.retryConfig?.maxRetries ?? 3,
        currentRetry: 0,
        backoffMs: task.retryConfig?.backoffMs ?? 60000,
      },
      nextRun: this.calculateNextRun(task.schedule),
    };

    this.tasks.set(scheduledTask.id, scheduledTask);
    this.saveToStorage();

    logger.info('Task scheduled', {
      id: scheduledTask.id,
      name: scheduledTask.name,
      nextRun: scheduledTask.nextRun,
    });

    activityService.addActivity({
      type: 'ai',
      action: 'Task Scheduled',
      description: scheduledTask.name,
    });

    return scheduledTask;
  }

  /**
   * Calculate next run time based on schedule
   */
  private calculateNextRun(schedule: ScheduledTask['schedule']): Date {
    const now = new Date();
    const nextRun = new Date();

    switch (schedule.type) {
      case 'once':
        return now;

      case 'daily':
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);

          // If time has passed today, schedule for tomorrow
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
        }
        break;

      case 'weekly':
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = nextRun.getDay();
          const targetDay = schedule.dayOfWeek;
          let daysUntilTarget = targetDay - currentDay;

          if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
          }

          nextRun.setDate(nextRun.getDate() + daysUntilTarget);

          if (schedule.time) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            nextRun.setHours(hours, minutes, 0, 0);
          }
        }
        break;

      case 'monthly':
        if (schedule.dayOfMonth !== undefined) {
          nextRun.setDate(schedule.dayOfMonth);

          // If day has passed this month, schedule for next month
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }

          if (schedule.time) {
            const [hours, minutes] = schedule.time.split(':').map(Number);
            nextRun.setHours(hours, minutes, 0, 0);
          }
        }
        break;

      case 'interval':
        if (schedule.intervalMs) {
          nextRun.setTime(now.getTime() + schedule.intervalMs);
        }
        break;
    }

    return nextRun;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    logger.info('Automation scheduler started');

    activityService.addActivity({
      type: 'ai',
      action: 'Automation Started',
      description: '24/7 passive income automation activated',
    });

    // Check every minute for tasks to run
    this.checkInterval = setInterval(() => {
      this.checkAndRunTasks();
    }, 60000);

    // Initial check
    this.checkAndRunTasks();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    logger.info('Automation scheduler stopped');

    activityService.addActivity({
      type: 'ai',
      action: 'Automation Stopped',
      description: 'Scheduler paused',
    });
  }

  /**
   * Check for tasks that need to run
   */
  private async checkAndRunTasks(): Promise<void> {
    const now = new Date();

    for (const [id, task] of this.tasks.entries()) {
      if (task.status !== 'pending') continue;
      if (!task.nextRun || task.nextRun > now) continue;

      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const dependenciesMet = task.dependencies.every((depId) => {
          const depTask = this.tasks.get(depId);
          return depTask?.lastResult?.success;
        });

        if (!dependenciesMet) {
          logger.debug('Task dependencies not met, skipping', { taskId: id });
          continue;
        }
      }

      // Add to queue
      if (!this.taskQueue.includes(id)) {
        this.taskQueue.push(id);
        this.sortTaskQueue();
      }
    }

    // Run tasks from queue
    await this.processQueue();
  }

  /**
   * Sort task queue by priority
   */
  private sortTaskQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    this.taskQueue.sort((a, b) => {
      const taskA = this.tasks.get(a);
      const taskB = this.tasks.get(b);
      if (!taskA || !taskB) return 0;

      return priorityOrder[taskA.priority] - priorityOrder[taskB.priority];
    });
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    // Process up to 3 tasks in parallel
    const batchSize = 3;
    const batch = this.taskQueue.splice(0, batchSize);

    await Promise.all(batch.map((id) => this.runTask(id)));
  }

  /**
   * Run a specific task
   */
  private async runTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const startTime = Date.now();
    task.status = 'running';

    const historyEntry: TaskHistory = {
      taskId: task.id,
      taskName: task.name,
      startedAt: new Date(),
      success: false,
      duration: 0,
    };

    logger.info('Running task', { taskId, name: task.name });

    try {
      await task.action();

      const duration = Date.now() - startTime;
      task.status = 'completed';
      task.lastRun = new Date();
      task.lastResult = {
        success: true,
        duration,
      };
      task.retryConfig.currentRetry = 0; // Reset retries on success

      // Calculate next run
      task.nextRun = this.calculateNextRun(task.schedule);
      if (task.schedule.type === 'once') {
        task.status = 'paused'; // Don't run again
      } else {
        task.status = 'pending';
      }

      historyEntry.success = true;
      historyEntry.completedAt = new Date();
      historyEntry.duration = duration;

      logger.info('Task completed successfully', {
        taskId,
        name: task.name,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      task.lastResult = {
        success: false,
        error: errorMessage,
        duration,
      };

      historyEntry.success = false;
      historyEntry.error = errorMessage;
      historyEntry.completedAt = new Date();
      historyEntry.duration = duration;

      logger.error('Task failed', {
        taskId,
        name: task.name,
        error: errorMessage,
      });

      // Retry logic
      if (task.retryConfig.currentRetry < task.retryConfig.maxRetries) {
        task.retryConfig.currentRetry++;
        const backoffMs =
          task.retryConfig.backoffMs * Math.pow(2, task.retryConfig.currentRetry - 1);

        task.nextRun = new Date(Date.now() + backoffMs);
        task.status = 'pending';

        logger.info('Scheduling task retry', {
          taskId,
          retry: task.retryConfig.currentRetry,
          nextRun: task.nextRun,
        });
      } else {
        task.status = 'failed';
        logger.error('Task failed after max retries', { taskId, name: task.name });
      }
    }

    this.history.push(historyEntry);
    this.saveToStorage();
  }

  /**
   * Get all scheduled tasks
   */
  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * Pause task
   */
  pauseTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task) {
      task.status = 'paused';
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Resume task
   */
  resumeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (task) {
      task.status = 'pending';
      task.nextRun = this.calculateNextRun(task.schedule);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Delete task
   */
  deleteTask(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Get task history
   */
  getHistory(limit: number = 50): TaskHistory[] {
    return this.history
      .slice(-limit)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((t) => t.status === 'pending').length;
    const runningTasks = tasks.filter((t) => t.status === 'running').length;
    const failedTasks = tasks.filter((t) => t.status === 'failed').length;

    const recentHistory = this.history.slice(-100);
    const successfulRuns = recentHistory.filter((h) => h.success).length;
    const successRate =
      recentHistory.length > 0 ? (successfulRuns / recentHistory.length) * 100 : 0;

    const avgDuration =
      recentHistory.length > 0
        ? recentHistory.reduce((sum, h) => sum + h.duration, 0) / recentHistory.length
        : 0;

    return {
      totalTasks,
      activeTasks,
      runningTasks,
      failedTasks,
      isRunning: this.isRunning,
      queueLength: this.taskQueue.length,
      successRate: successRate.toFixed(1) + '%',
      avgDuration: Math.round(avgDuration) + 'ms',
      totalRuns: recentHistory.length,
    };
  }
}

// Export singleton instance
export const automationScheduler = new AutomationScheduler();

// Auto-start scheduler (can be disabled in settings)
if (typeof window !== 'undefined') {
  // Start scheduler after page load
  window.addEventListener('load', () => {
    const autoStartEnabled = localStorage.getItem('automation-auto-start') !== 'false';
    if (autoStartEnabled) {
      automationScheduler.start();
      logger.info('Automation scheduler auto-started');
    }
  });
}
