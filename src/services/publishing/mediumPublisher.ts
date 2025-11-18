/**
 * Medium Publisher Service
 *
 * PURPOSE:
 * Medium auto-publisher for passive income content distribution.
 * Automate publishing to Medium with optimal timing and formatting.
 *
 * FEATURES:
 * - Auto-publish to Medium (demo mode)
 * - Schedule publishing
 * - Tag optimization
 * - Canonical URL support
 * - Draft vs published status
 * - Publication targeting (submit to publications)
 * - SEO metadata
 * - Cross-posting detection
 * - Analytics tracking
 * - Batch publishing
 *
 * COST TIER: Free (with Partner Program for earnings)
 *
 * USAGE:
 * ```typescript
 * import { mediumPublisher } from '@/services/publishing/mediumPublisher';
 *
 * // Auto-connects from vault
 * const post = await mediumPublisher.publish({
 *   title: 'My Article',
 *   content: '# Markdown content here',
 *   tags: ['AI', 'Automation']
 * });
 * ```
 *
 * NOTE: Demo mode - simulates Medium API calls.
 * In production, integrate with Medium's OAuth and API.
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from '../integrations/BaseIntegrationService';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface MediumPost {
  id: string;
  title: string;
  content: string; // Markdown format
  contentFormat: 'markdown' | 'html';
  tags: string[]; // Max 5 tags on Medium
  canonicalUrl?: string;
  publishStatus: 'draft' | 'public' | 'unlisted';
  license: 'all-rights-reserved' | 'cc-40-by' | 'cc-40-by-sa' | 'cc-40-by-nd' | 'cc-40-by-nc' | 'cc-40-by-nc-nd' | 'cc-40-by-nc-sa' | 'cc-40-zero' | 'public-domain';
  notifyFollowers: boolean;
  publishedUrl?: string;
  scheduledTime?: Date;
  publishedAt?: Date;
  stats?: {
    views: number;
    reads: number;
    fans: number;
    claps: number;
  };
  metadata: {
    wordCount: number;
    readingTime: number;
    imageCount: number;
  };
}

export interface PublishOptions {
  title: string;
  content: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus?: 'draft' | 'public' | 'unlisted';
  notifyFollowers?: boolean;
  scheduleTime?: Date;
  targetPublication?: string; // Submit to a Medium publication
}

export interface PublicationSubmission {
  postId: string;
  publicationName: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: Date;
  respondedAt?: Date;
}

/**
 * Medium Publisher Service
 * Extends BaseIntegrationService for credential management and OAuth
 */
class MediumPublisher extends BaseIntegrationService {
  private posts: MediumPost[] = [];
  private submissions: PublicationSubmission[] = [];
  private schedulerInterval: NodeJS.Timeout | null = null;

  // ========================================
  // REQUIRED ABSTRACT METHODS
  // ========================================

  getServiceId(): string {
    return 'medium';
  }

  getServiceName(): string {
    return 'Medium';
  }

  getBaseURL(): string {
    return 'https://api.medium.com/v1';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free'; // Free to publish, Partner Program for earnings
  }

  supportsGoogleOAuth(): boolean {
    return false; // Medium uses its own OAuth flow
  }

  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return null;
  }

  // ========================================
  // MEDIUM-SPECIFIC METHODS
  // ========================================

  /**
   * Publish article to Medium
   */
  async publish(options: PublishOptions): Promise<MediumPost> {
    this.logActivity('Publishing to Medium', { title: options.title });

    try {
      // Validate
      if (!this.isConnected()) {
        throw new Error('Medium API token not configured');
      }

      // Optimize tags (Medium allows max 5)
      const tags = this.optimizeTags(options.tags || []);

      // Calculate metadata
      const wordCount = options.content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200);
      const imageCount = (options.content.match(/!\[.*?\]/g) || []).length;

      const post: MediumPost = {
        id: crypto.randomUUID(),
        title: options.title,
        content: options.content,
        contentFormat: 'markdown',
        tags,
        canonicalUrl: options.canonicalUrl,
        publishStatus: options.publishStatus || 'public',
        license: 'all-rights-reserved',
        notifyFollowers: options.notifyFollowers !== false,
        scheduledTime: options.scheduleTime,
        metadata: {
          wordCount,
          readingTime,
          imageCount,
        },
      };

      // Schedule or publish immediately
      if (options.scheduleTime && options.scheduleTime > new Date()) {
        post.publishStatus = 'draft';
        logger.info('Post scheduled for later', { scheduleTime: options.scheduleTime });
      } else {
        // DEMO MODE: Simulate API call
        await this.simulateMediumPublish(post);
      }

      this.posts.push(post);

      activityService.addActivity({
        type: 'automation',
        action: 'medium_post_published',
        description: `Published "${post.title}" to Medium`,
        metadata: {
          postId: post.id,
          status: post.publishStatus,
          wordCount,
        },
      });

      logger.info('Medium post published', {
        id: post.id,
        title: post.title,
        status: post.publishStatus,
      });

      return post;
    } catch (error) {
      logger.error('Medium publishing failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Simulate Medium API publish call (demo mode)
   */
  private async simulateMediumPublish(post: MediumPost): Promise<void> {
    // Simulate API delay
    await this.simulateAPICall(500);

    // Generate mock published URL
    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    post.publishedUrl = `https://medium.com/@demo-user/${slug}-${post.id.slice(0, 8)}`;
    post.publishedAt = new Date();

    // Simulate initial stats
    post.stats = {
      views: Math.floor(Math.random() * 100) + 50,
      reads: Math.floor(Math.random() * 50) + 20,
      fans: Math.floor(Math.random() * 10),
      claps: Math.floor(Math.random() * 30) + 5,
    };

    logger.info('Medium post published (simulated)', { url: post.publishedUrl });
  }

  /**
   * Optimize tags for Medium (max 5, relevant)
   */
  private optimizeTags(tags: string[]): string[] {
    // Medium allows max 5 tags
    const cleaned = tags
      .map(t => t.replace(/^#/, '').toLowerCase())
      .filter(t => t.length > 0 && t.length <= 25); // Medium tag length limit

    // Remove duplicates
    const unique = [...new Set(cleaned)];

    // Return max 5
    return unique.slice(0, 5);
  }

  /**
   * Submit post to a Medium publication
   */
  async submitToPublication(postId: string, publicationName: string): Promise<PublicationSubmission> {
    this.logActivity('Submitting to Medium publication', { postId, publicationName });

    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // DEMO MODE: Simulate submission
    await this.simulateAPICall(300);

    const submission: PublicationSubmission = {
      postId,
      publicationName,
      status: 'pending',
      submittedAt: new Date(),
    };

    this.submissions.push(submission);

    // Simulate automatic acceptance for demo
    setTimeout(() => {
      submission.status = 'accepted';
      submission.respondedAt = new Date();
      logger.info('Publication accepted post (simulated)', { publicationName });
    }, 2000);

    activityService.addActivity({
      type: 'automation',
      action: 'submitted_to_publication',
      description: `Submitted "${post.title}" to ${publicationName}`,
      metadata: { postId, publicationName },
    });

    return submission;
  }

  /**
   * Update post
   */
  async updatePost(postId: string, updates: Partial<PublishOptions>): Promise<MediumPost> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    if (updates.title) post.title = updates.title;
    if (updates.content) post.content = updates.content;
    if (updates.tags) post.tags = this.optimizeTags(updates.tags);
    if (updates.canonicalUrl) post.canonicalUrl = updates.canonicalUrl;
    if (updates.publishStatus) post.publishStatus = updates.publishStatus;

    logger.info('Medium post updated', { postId });

    return post;
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<boolean> {
    const index = this.posts.findIndex(p => p.id === postId);
    if (index === -1) return false;

    this.posts.splice(index, 1);
    logger.info('Medium post deleted', { postId });

    return true;
  }

  /**
   * Get all posts
   */
  getPosts(): MediumPost[] {
    return [...this.posts];
  }

  /**
   * Get post by ID
   */
  getPost(postId: string): MediumPost | undefined {
    return this.posts.find(p => p.id === postId);
  }

  /**
   * Get post stats
   */
  async getStats(postId: string): Promise<MediumPost['stats']> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    // DEMO MODE: Update stats with simulated growth
    if (post.stats) {
      post.stats.views += Math.floor(Math.random() * 20);
      post.stats.reads += Math.floor(Math.random() * 10);
      post.stats.claps += Math.floor(Math.random() * 5);
    }

    return post.stats;
  }

  /**
   * Get all submissions
   */
  getSubmissions(): PublicationSubmission[] {
    return [...this.submissions];
  }

  /**
   * Schedule batch publishing
   */
  async batchPublish(posts: PublishOptions[], delayMinutes: number = 60): Promise<MediumPost[]> {
    this.logActivity('Batch publishing to Medium', { count: posts.length, delayMinutes });

    const published: MediumPost[] = [];
    let scheduleTime = new Date();

    for (const postOptions of posts) {
      try {
        const post = await this.publish({
          ...postOptions,
          scheduleTime,
        });
        published.push(post);

        // Increment schedule time for next post
        scheduleTime = new Date(scheduleTime.getTime() + delayMinutes * 60 * 1000);
      } catch (error) {
        logger.error('Failed to publish post in batch', { title: postOptions.title, error });
      }
    }

    return published;
  }

  /**
   * Process scheduled posts
   */
  async processScheduledPosts(): Promise<void> {
    const now = new Date();
    const duePosts = this.posts.filter(
      p => p.publishStatus === 'draft' && p.scheduledTime && p.scheduledTime <= now
    );

    for (const post of duePosts) {
      try {
        await this.simulateMediumPublish(post);
        post.publishStatus = 'public';
        logger.info('Scheduled post published', { id: post.id, title: post.title });
      } catch (error) {
        logger.error('Failed to publish scheduled post', { id: post.id, error });
      }
    }
  }

  /**
   * Start scheduler for auto-publishing
   */
  startScheduler() {
    if (this.schedulerInterval) {
      logger.warn('Medium scheduler already running');
      return;
    }

    logger.info('Starting Medium publishing scheduler');
    this.schedulerInterval = setInterval(() => {
      this.processScheduledPosts();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      logger.info('Medium scheduler stopped');
    }
  }

  /**
   * Get analytics summary
   */
  getAnalytics(): {
    totalPosts: number;
    published: number;
    drafts: number;
    totalViews: number;
    totalReads: number;
    totalClaps: number;
    avgReadRatio: number;
  } {
    const published = this.posts.filter(p => p.publishStatus === 'public');
    const drafts = this.posts.filter(p => p.publishStatus === 'draft');

    const totalViews = this.posts.reduce((sum, p) => sum + (p.stats?.views || 0), 0);
    const totalReads = this.posts.reduce((sum, p) => sum + (p.stats?.reads || 0), 0);
    const totalClaps = this.posts.reduce((sum, p) => sum + (p.stats?.claps || 0), 0);

    const avgReadRatio = totalViews > 0 ? (totalReads / totalViews) * 100 : 0;

    return {
      totalPosts: this.posts.length,
      published: published.length,
      drafts: drafts.length,
      totalViews,
      totalReads,
      totalClaps,
      avgReadRatio: Math.round(avgReadRatio),
    };
  }

  /**
   * Export post to Medium-compatible markdown
   */
  exportToMarkdown(postId: string): string {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    let output = `# ${post.title}\n\n`;

    // Add canonical URL if exists
    if (post.canonicalUrl) {
      output += `*Originally published at [${post.canonicalUrl}](${post.canonicalUrl})*\n\n`;
    }

    output += post.content;

    // Add tags at the end
    if (post.tags.length > 0) {
      output += `\n\n---\n\nTags: ${post.tags.join(', ')}`;
    }

    return output;
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<MediumPost> {
    // Initialize with demo credentials
    this.setCredentials({ integrationToken: 'demo-api-token', userId: 'demo-user-id' });

    return await this.publish({
      title: 'Building Passive Income with AI Automation',
      content: `# Introduction

Passive income through AI automation is revolutionizing how we work.

## Key Strategies

1. **Content Automation** - Generate articles, videos, and social media posts
2. **Revenue Optimization** - Track and optimize income streams
3. **Workflow Automation** - Streamline repetitive tasks

## Conclusion

The future of passive income is automated. Start today!`,
      tags: ['AI', 'Automation', 'Passive Income', 'Technology', 'Entrepreneurship'],
      publishStatus: 'public',
      notifyFollowers: true,
    });
  }
}

// Export singleton
export const mediumPublisher = new MediumPublisher();

// Auto-initialize from credential vault
autoInitializeService(mediumPublisher);
