/**
 * socialMediaScheduler.ts
 *
 * FAST BUILD: Social media post scheduler for passive income automation.
 * Schedule posts across Twitter, LinkedIn, Facebook with optimal timing.
 *
 * FEATURES:
 * ✅ Multi-platform scheduling (Twitter, LinkedIn, Facebook, Instagram)
 * ✅ Optimal posting time recommendations
 * ✅ Content queue management
 * ✅ Auto-posting (simulated - needs API integration)
 * ✅ Analytics tracking
 * ✅ Hashtag optimization
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

export interface ScheduledPost {
  id: string;
  platform: SocialPlatform;
  content: string;
  mediaUrls?: string[];
  scheduledTime: Date;
  status: 'pending' | 'posted' | 'failed' | 'cancelled';
  hashtags: string[];
  metadata: {
    characterCount: number;
    estimatedReach?: number;
    engagementScore?: number;
  };
  postedAt?: Date;
  errorMessage?: string;
}

export interface PostingStrategy {
  platform: SocialPlatform;
  optimalTimes: string[]; // Time slots like "09:00", "13:00", "18:00"
  frequency: number; // posts per day
  hashtagCount: number; // recommended hashtag count
  characterLimit: number;
}

export interface ScheduleOptions {
  platform: SocialPlatform;
  content: string;
  scheduledTime?: Date;
  mediaUrls?: string[];
  hashtags?: string[];
  useOptimalTime?: boolean; // Auto-schedule at best time
}

class SocialMediaScheduler {
  private scheduledPosts: ScheduledPost[] = [];
  private postingStrategies: Map<SocialPlatform, PostingStrategy> = new Map();
  private postingIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize optimal posting strategies for each platform
   */
  private initializeStrategies() {
    const strategies: PostingStrategy[] = [
      {
        platform: 'twitter',
        optimalTimes: ['09:00', '12:00', '15:00', '17:00', '20:00'],
        frequency: 3, // 3 posts per day
        hashtagCount: 2, // 1-2 hashtags optimal
        characterLimit: 280,
      },
      {
        platform: 'linkedin',
        optimalTimes: ['07:30', '12:00', '17:00'],
        frequency: 1, // 1 post per day
        hashtagCount: 5, // 3-5 hashtags optimal
        characterLimit: 3000,
      },
      {
        platform: 'facebook',
        optimalTimes: ['09:00', '13:00', '19:00'],
        frequency: 2, // 2 posts per day
        hashtagCount: 3, // 2-3 hashtags
        characterLimit: 63206,
      },
      {
        platform: 'instagram',
        optimalTimes: ['11:00', '14:00', '19:00'],
        frequency: 1, // 1 post per day
        hashtagCount: 11, // 10-11 hashtags optimal
        characterLimit: 2200,
      },
    ];

    strategies.forEach(strategy => this.postingStrategies.set(strategy.platform, strategy));
  }

  /**
   * Schedule a post
   */
  async schedulePost(options: ScheduleOptions): Promise<ScheduledPost> {
    logger.info('Scheduling social media post', { platform: options.platform });

    try {
      const strategy = this.postingStrategies.get(options.platform);
      if (!strategy) {
        throw new Error(`Unknown platform: ${options.platform}`);
      }

      // Determine scheduled time
      let scheduledTime = options.scheduledTime;
      if (!scheduledTime && options.useOptimalTime) {
        scheduledTime = this.getNextOptimalTime(options.platform);
      }
      if (!scheduledTime) {
        // Default to 1 hour from now
        scheduledTime = new Date(Date.now() + 60 * 60 * 1000);
      }

      // Validate content length
      const characterCount = options.content.length;
      if (characterCount > strategy.characterLimit) {
        logger.warn('Content exceeds character limit', {
          platform: options.platform,
          count: characterCount,
          limit: strategy.characterLimit,
        });
      }

      // Optimize hashtags
      const hashtags = options.hashtags || [];
      const optimizedHashtags = this.optimizeHashtags(hashtags, strategy.hashtagCount);

      // Create scheduled post
      const post: ScheduledPost = {
        id: crypto.randomUUID(),
        platform: options.platform,
        content: options.content,
        mediaUrls: options.mediaUrls,
        scheduledTime,
        status: 'pending',
        hashtags: optimizedHashtags,
        metadata: {
          characterCount,
          estimatedReach: this.estimateReach(options.platform, characterCount, optimizedHashtags.length),
        },
      };

      this.scheduledPosts.push(post);

      // Log activity
      activityService.addActivity({
        type: 'automation',
        action: 'Post Scheduled',
        description: `Scheduled ${options.platform} post for ${scheduledTime.toLocaleString()}`,
        metadata: {
          platform: options.platform,
          scheduledTime: scheduledTime.toISOString(),
        },
      });

      logger.info('Post scheduled successfully', {
        id: post.id,
        platform: options.platform,
        scheduledTime: scheduledTime.toISOString(),
      });

      return post;
    } catch (error) {
      logger.error('Failed to schedule post', { error: error as Error });
      throw error;
    }
  }

  /**
   * Schedule multiple posts across platforms
   */
  async scheduleMultiple(posts: ScheduleOptions[]): Promise<ScheduledPost[]> {
    logger.info('Scheduling multiple posts', { count: posts.length });

    const scheduled: ScheduledPost[] = [];
    for (const postOptions of posts) {
      try {
        const post = await this.schedulePost(postOptions);
        scheduled.push(post);
      } catch (error) {
        logger.error('Failed to schedule one post', { error: error as Error, platform: postOptions.platform });
      }
    }

    return scheduled;
  }

  /**
   * Get next optimal posting time for a platform
   */
  private getNextOptimalTime(platform: SocialPlatform): Date {
    const strategy = this.postingStrategies.get(platform);
    if (!strategy) {
      return new Date(Date.now() + 60 * 60 * 1000); // Default 1 hour
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Find next optimal time slot
    for (const timeSlot of strategy.optimalTimes) {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const slotTime = hours * 60 + minutes;

      if (slotTime > currentTime) {
        const scheduledDate = new Date(now);
        scheduledDate.setHours(hours, minutes, 0, 0);
        return scheduledDate;
      }
    }

    // If no slot today, use first slot tomorrow
    const [hours, minutes] = strategy.optimalTimes[0].split(':').map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setDate(scheduledDate.getDate() + 1);
    scheduledDate.setHours(hours, minutes, 0, 0);
    return scheduledDate;
  }

  /**
   * Optimize hashtags for platform
   */
  private optimizeHashtags(hashtags: string[], targetCount: number): string[] {
    if (hashtags.length <= targetCount) {
      return hashtags;
    }

    // Simple optimization: take first N hashtags
    // In production, would rank by popularity/relevance
    return hashtags.slice(0, targetCount);
  }

  /**
   * Estimate post reach based on platform and content
   */
  private estimateReach(platform: SocialPlatform, characterCount: number, hashtagCount: number): number {
    // Simple heuristic estimation
    const baseReach: Record<SocialPlatform, number> = {
      twitter: 100,
      linkedin: 200,
      facebook: 150,
      instagram: 180,
    };

    const base = baseReach[platform] || 100;
    const hashtagBoost = hashtagCount * 10;
    const lengthPenalty = characterCount > 200 ? -20 : 0;

    return Math.max(base + hashtagBoost + lengthPenalty, 50);
  }

  /**
   * Start auto-posting scheduler
   */
  startScheduler() {
    if (this.postingIntervalId) {
      logger.warn('Scheduler already running');
      return;
    }

    logger.info('Starting social media scheduler');

    // Check every minute for posts to publish
    this.postingIntervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 60 * 1000); // Check every 60 seconds

    // Run immediately
    this.processScheduledPosts();
  }

  /**
   * Stop auto-posting scheduler
   */
  stopScheduler() {
    if (this.postingIntervalId) {
      clearInterval(this.postingIntervalId);
      this.postingIntervalId = null;
      logger.info('Social media scheduler stopped');
    }
  }

  /**
   * Process scheduled posts that are due
   */
  private async processScheduledPosts() {
    const now = Date.now();
    const duePosts = this.scheduledPosts.filter(
      post => post.status === 'pending' && post.scheduledTime.getTime() <= now
    );

    if (duePosts.length > 0) {
      logger.info('Processing due posts', { count: duePosts.length });
    }

    for (const post of duePosts) {
      try {
        await this.publishPost(post);
      } catch (error) {
        logger.error('Failed to publish post', { error: error as Error, postId: post.id });
        post.status = 'failed';
        post.errorMessage = (error as Error).message;
      }
    }
  }

  /**
   * Publish a post (simulated - needs real API integration)
   */
  private async publishPost(post: ScheduledPost): Promise<void> {
    logger.info('Publishing post', { id: post.id, platform: post.platform });

    // SIMULATION: In production, this would call actual social media APIs
    // For now, just mark as posted
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    post.status = 'posted';
    post.postedAt = new Date();

    activityService.addActivity({
      type: 'automation',
      action: 'Post Published',
      description: `Published ${post.platform} post`,
      metadata: {
        platform: post.platform,
        postId: post.id,
      },
    });

    logger.info('Post published successfully', { id: post.id, platform: post.platform });
  }

  /**
   * Cancel a scheduled post
   */
  cancelPost(postId: string): boolean {
    const post = this.scheduledPosts.find(p => p.id === postId);
    if (!post) {
      return false;
    }

    if (post.status !== 'pending') {
      logger.warn('Cannot cancel non-pending post', { postId, status: post.status });
      return false;
    }

    post.status = 'cancelled';
    logger.info('Post cancelled', { postId });
    return true;
  }

  /**
   * Get all scheduled posts
   */
  getScheduledPosts(platform?: SocialPlatform): ScheduledPost[] {
    if (platform) {
      return this.scheduledPosts.filter(p => p.platform === platform);
    }
    return [...this.scheduledPosts];
  }

  /**
   * Get posting statistics
   */
  getStats(): {
    totalScheduled: number;
    posted: number;
    pending: number;
    failed: number;
    byPlatform: Record<SocialPlatform, number>;
  } {
    const byPlatform: Record<SocialPlatform, number> = {
      twitter: 0,
      linkedin: 0,
      facebook: 0,
      instagram: 0,
    };

    this.scheduledPosts.forEach(post => {
      if (post.status === 'posted') {
        byPlatform[post.platform]++;
      }
    });

    return {
      totalScheduled: this.scheduledPosts.length,
      posted: this.scheduledPosts.filter(p => p.status === 'posted').length,
      pending: this.scheduledPosts.filter(p => p.status === 'pending').length,
      failed: this.scheduledPosts.filter(p => p.status === 'failed').length,
      byPlatform,
    };
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<ScheduledPost[]> {
    logger.info('Running social media scheduler quick test');

    const posts: ScheduleOptions[] = [
      {
        platform: 'twitter',
        content: '🚀 Just shipped a new feature for DLX Studios! AI-powered automation is changing the game. #AI #Automation #PassiveIncome',
        useOptimalTime: true,
        hashtags: ['AI', 'Automation', 'PassiveIncome'],
      },
      {
        platform: 'linkedin',
        content: 'Excited to share our latest insights on building passive income with AI automation. The future of work is here! 💼',
        useOptimalTime: true,
        hashtags: ['AI', 'Automation', 'PassiveIncome', 'FutureOfWork', 'Technology'],
      },
      {
        platform: 'facebook',
        content: 'Check out our new AI automation tools! Making passive income has never been easier. 🎯',
        useOptimalTime: true,
        hashtags: ['AI', 'Automation', 'MakeMoneyOnline'],
      },
    ];

    return await this.scheduleMultiple(posts);
  }
}

// Export singleton
export const socialMediaScheduler = new SocialMediaScheduler();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testSocialScheduler = () => socialMediaScheduler.quickTest();
  (window as any).socialMediaScheduler = socialMediaScheduler; // For manual testing
}
