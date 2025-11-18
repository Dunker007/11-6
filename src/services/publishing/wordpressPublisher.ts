/**
 * wordpressPublisher.ts
 *
 * WordPress REST API integration for auto-publishing.
 * Publish blog posts, pages, and custom post types to WordPress sites.
 *
 * FEATURES:
 * ✅ Auto-publish posts to WordPress (demo mode)
 * ✅ Schedule publishing
 * ✅ Category and tag management
 * ✅ Featured image upload
 * ✅ Custom fields/meta
 * ✅ Multiple site support
 * ✅ Draft/pending/publish status
 * ✅ SEO optimization (Yoast/RankMath)
 * ✅ Bulk publishing
 * ✅ Post revision tracking
 *
 * NOTE: Demo mode - simulates WordPress REST API.
 * In production, use WordPress REST API with Application Password.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { credentialVaultService } from '../credentials/credentialVaultService';

export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string; // WordPress Application Password
  status: 'connected' | 'disconnected' | 'error';
}

export interface WordPressPost {
  id: string;
  siteId: string;
  title: string;
  content: string; // HTML
  excerpt?: string;
  status: 'draft' | 'pending' | 'publish' | 'future' | 'private';
  categories: string[];
  tags: string[];
  featuredImage?: string; // URL or file path
  customFields?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    focusKeyphrase?: string;
  };
  scheduledTime?: Date;
  publishedUrl?: string;
  publishedAt?: Date;
  wordPressId?: number; // ID in WordPress
  revisionCount: number;
  metadata: {
    wordCount: number;
    imageCount: number;
    linkCount: number;
  };
}

export interface PublishToWordPressOptions {
  siteId: string;
  title: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'pending' | 'publish' | 'future';
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  customFields?: Record<string, any>;
  seo?: WordPressPost['seo'];
  scheduleTime?: Date;
}

class WordPressPublisher {
  private sites: WordPressSite[] = [];
  private posts: WordPressPost[] = [];
  private schedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Add WordPress site
   */
  addSite(site: Omit<WordPressSite, 'id' | 'status'>): WordPressSite {
    const newSite: WordPressSite = {
      id: crypto.randomUUID(),
      ...site,
      status: 'connected',
    };

    this.sites.push(newSite);

    logger.info('WordPress site added', { name: site.name, url: site.url });

    activityService.addActivity({
      type: 'system',
      action: 'WordPress Site Connected',
      description: `Connected to ${site.name}`,
      metadata: { siteId: newSite.id, url: site.url },
    });

    return newSite;
  }

  /**
   * Check if WordPress is connected (has any sites)
   */
  isConnected(): boolean {
    return this.sites.length > 0 && this.sites.some(s => s.status === 'connected');
  }

  /**
   * Connect from credential vault
   */
  connectFromVault(): boolean {
    const creds = credentialVaultService.getCredentials('wordpress');

    if (creds && creds.credentials.url && creds.credentials.username && creds.credentials.applicationPassword) {
      // Check if site already exists
      const existingSite = this.sites.find(s => s.url === creds.credentials.url);

      if (!existingSite) {
        this.addSite({
          name: creds.credentials.siteName || 'My WordPress Site',
          url: creds.credentials.url,
          username: creds.credentials.username,
          applicationPassword: creds.credentials.applicationPassword,
        });
        logger.info('WordPress site auto-loaded from credential vault');
        return true;
      }
    }

    logger.warn('WordPress credentials not found in vault - no sites loaded');
    return false;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; hasCredentials: boolean; message: string; siteCount: number } {
    const hasVaultCreds = credentialVaultService.hasCredentials('wordpress');
    const isConnected = this.isConnected();
    const siteCount = this.sites.length;

    if (isConnected && hasVaultCreds) {
      return {
        connected: true,
        hasCredentials: true,
        message: `Connected to ${siteCount} WordPress site(s)`,
        siteCount,
      };
    } else if (hasVaultCreds && !isConnected) {
      return {
        connected: false,
        hasCredentials: true,
        message: 'Credentials available - click to connect',
        siteCount: 0,
      };
    } else {
      return {
        connected: false,
        hasCredentials: false,
        message: 'Demo mode - configure credentials in vault to connect',
        siteCount: 0,
      };
    }
  }

  /**
   * Test site connection
   */
  async testConnection(siteId: string): Promise<boolean> {
    const site = this.sites.find(s => s.id === siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    try {
      // DEMO MODE: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      site.status = 'connected';
      logger.info('WordPress connection test successful', { siteId, url: site.url });

      return true;
    } catch (error) {
      site.status = 'error';
      logger.error('WordPress connection test failed', { siteId, error });
      return false;
    }
  }

  /**
   * Publish post to WordPress
   */
  async publish(options: PublishToWordPressOptions): Promise<WordPressPost> {
    logger.info('Publishing to WordPress', {
      siteId: options.siteId,
      title: options.title,
    });

    try {
      const site = this.sites.find(s => s.id === options.siteId);
      if (!site) {
        throw new Error('WordPress site not found');
      }

      if (site.status !== 'connected') {
        throw new Error('WordPress site not connected');
      }

      // Calculate metadata
      const wordCount = this.stripHtml(options.content).split(/\s+/).length;
      const imageCount = (options.content.match(/<img/g) || []).length;
      const linkCount = (options.content.match(/<a/g) || []).length;

      // Determine status
      let status = options.status || 'publish';
      if (options.scheduleTime && options.scheduleTime > new Date()) {
        status = 'future';
      }

      const post: WordPressPost = {
        id: crypto.randomUUID(),
        siteId: options.siteId,
        title: options.title,
        content: options.content,
        excerpt: options.excerpt || this.generateExcerpt(options.content),
        status,
        categories: options.categories || [],
        tags: options.tags || [],
        featuredImage: options.featuredImage,
        customFields: options.customFields,
        seo: options.seo || this.generateSEO(options.title, options.content),
        scheduledTime: options.scheduleTime,
        revisionCount: 0,
        metadata: {
          wordCount,
          imageCount,
          linkCount,
        },
      };

      // Publish immediately or schedule
      if (status === 'publish') {
        await this.simulatePublish(post, site);
      }

      this.posts.push(post);

      activityService.addActivity({
        type: 'automation',
        action: 'WordPress Post Published',
        description: `Published "${post.title}" to ${site.name}`,
        metadata: {
          postId: post.id,
          siteId: site.id,
          status: post.status,
          wordCount,
        },
      });

      logger.info('WordPress post published', {
        id: post.id,
        title: post.title,
        status: post.status,
      });

      return post;
    } catch (error) {
      logger.error('WordPress publishing failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Simulate WordPress REST API publish (demo mode)
   */
  private async simulatePublish(post: WordPressPost, site: WordPressSite): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate WordPress ID
    post.wordPressId = Math.floor(Math.random() * 10000) + 1;

    // Generate published URL
    const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    post.publishedUrl = `${site.url}/${slug}/`;
    post.publishedAt = new Date();

    logger.info('WordPress post published (simulated)', {
      url: post.publishedUrl,
      wpId: post.wordPressId,
    });
  }

  /**
   * Update existing post
   */
  async updatePost(postId: string, updates: Partial<PublishToWordPressOptions>): Promise<WordPressPost> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post not found');
    }

    const site = this.sites.find(s => s.id === post.siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    // Apply updates
    if (updates.title) post.title = updates.title;
    if (updates.content) post.content = updates.content;
    if (updates.excerpt) post.excerpt = updates.excerpt;
    if (updates.status) post.status = updates.status;
    if (updates.categories) post.categories = updates.categories;
    if (updates.tags) post.tags = updates.tags;
    if (updates.featuredImage) post.featuredImage = updates.featuredImage;
    if (updates.customFields) post.customFields = { ...post.customFields, ...updates.customFields };
    if (updates.seo) post.seo = { ...post.seo, ...updates.seo };

    // Increment revision count
    post.revisionCount++;

    // DEMO MODE: Simulate update
    await new Promise(resolve => setTimeout(resolve, 300));

    logger.info('WordPress post updated', { postId, revisions: post.revisionCount });

    return post;
  }

  /**
   * Delete post
   */
  async deletePost(postId: string, permanent: boolean = false): Promise<boolean> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      return false;
    }

    if (permanent) {
      // Permanently delete
      const index = this.posts.findIndex(p => p.id === postId);
      this.posts.splice(index, 1);
      logger.info('WordPress post permanently deleted', { postId });
    } else {
      // Move to trash
      post.status = 'draft';
      logger.info('WordPress post moved to trash', { postId });
    }

    return true;
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Generate excerpt from content
   */
  private generateExcerpt(content: string, maxLength: number = 150): string {
    const text = this.stripHtml(content);
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength).trim() + '...';
  }

  /**
   * Generate SEO metadata
   */
  private generateSEO(title: string, content: string): WordPressPost['seo'] {
    const text = this.stripHtml(content);
    const description = this.generateExcerpt(text, 160);

    // Extract keywords (simple approach)
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      if (word.length > 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    const keywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return {
      title: title.length <= 60 ? title : title.slice(0, 57) + '...',
      description,
      keywords,
      focusKeyphrase: keywords[0],
    };
  }

  /**
   * Bulk publish posts
   */
  async bulkPublish(posts: PublishToWordPressOptions[], delayMinutes: number = 30): Promise<WordPressPost[]> {
    logger.info('Bulk publishing to WordPress', {
      count: posts.length,
      delayMinutes,
    });

    const published: WordPressPost[] = [];
    let scheduleTime = new Date();

    for (const postOptions of posts) {
      try {
        const post = await this.publish({
          ...postOptions,
          scheduleTime,
        });
        published.push(post);

        // Increment schedule time
        scheduleTime = new Date(scheduleTime.getTime() + delayMinutes * 60 * 1000);
      } catch (error) {
        logger.error('Failed to publish post in bulk', {
          title: postOptions.title,
          error,
        });
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
      p => p.status === 'future' && p.scheduledTime && p.scheduledTime <= now
    );

    for (const post of duePosts) {
      try {
        const site = this.sites.find(s => s.id === post.siteId);
        if (site) {
          await this.simulatePublish(post, site);
          post.status = 'publish';
          logger.info('Scheduled WordPress post published', {
            id: post.id,
            title: post.title,
          });
        }
      } catch (error) {
        logger.error('Failed to publish scheduled post', { id: post.id, error });
      }
    }
  }

  /**
   * Start scheduler
   */
  startScheduler() {
    if (this.schedulerInterval) {
      logger.warn('WordPress scheduler already running');
      return;
    }

    logger.info('Starting WordPress publishing scheduler');
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
      logger.info('WordPress scheduler stopped');
    }
  }

  /**
   * Get all sites
   */
  getSites(): WordPressSite[] {
    return [...this.sites];
  }

  /**
   * Get all posts
   */
  getPosts(siteId?: string): WordPressPost[] {
    if (siteId) {
      return this.posts.filter(p => p.siteId === siteId);
    }
    return [...this.posts];
  }

  /**
   * Get post by ID
   */
  getPost(postId: string): WordPressPost | undefined {
    return this.posts.find(p => p.id === postId);
  }

  /**
   * Get analytics for a site
   */
  getAnalytics(siteId: string): {
    totalPosts: number;
    published: number;
    drafts: number;
    scheduled: number;
    totalWords: number;
    avgWordCount: number;
  } {
    const sitePosts = this.posts.filter(p => p.siteId === siteId);

    const published = sitePosts.filter(p => p.status === 'publish').length;
    const drafts = sitePosts.filter(p => p.status === 'draft').length;
    const scheduled = sitePosts.filter(p => p.status === 'future').length;

    const totalWords = sitePosts.reduce((sum, p) => sum + p.metadata.wordCount, 0);
    const avgWordCount = sitePosts.length > 0 ? Math.round(totalWords / sitePosts.length) : 0;

    return {
      totalPosts: sitePosts.length,
      published,
      drafts,
      scheduled,
      totalWords,
      avgWordCount,
    };
  }

  /**
   * Create categories
   */
  async createCategory(siteId: string, name: string, description?: string): Promise<{ id: number; name: string }> {
    const site = this.sites.find(s => s.id === siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    // DEMO MODE: Simulate category creation
    await new Promise(resolve => setTimeout(resolve, 200));

    const category = {
      id: Math.floor(Math.random() * 1000) + 1,
      name,
      description,
    };

    logger.info('WordPress category created (simulated)', { siteId, category: name });

    return category;
  }

  /**
   * Upload featured image
   */
  async uploadFeaturedImage(siteId: string, imagePath: string): Promise<string> {
    const site = this.sites.find(s => s.id === siteId);
    if (!site) {
      throw new Error('Site not found');
    }

    // DEMO MODE: Simulate image upload
    await new Promise(resolve => setTimeout(resolve, 500));

    const imageUrl = `${site.url}/wp-content/uploads/${Date.now()}.jpg`;

    logger.info('Featured image uploaded (simulated)', { siteId, imageUrl });

    return imageUrl;
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<WordPressPost> {
    // Add demo site
    const site = this.addSite({
      name: 'My Blog',
      url: 'https://myblog.com',
      username: 'admin',
      applicationPassword: 'demo-password',
    });

    // Publish test post
    return await this.publish({
      siteId: site.id,
      title: 'Getting Started with AI Automation',
      content: `<h1>Introduction</h1>
<p>AI automation is transforming the way we create content and generate passive income.</p>

<h2>Key Benefits</h2>
<ul>
  <li>Save time with automated content generation</li>
  <li>Scale your output without scaling effort</li>
  <li>Optimize revenue streams automatically</li>
</ul>

<h2>How to Get Started</h2>
<p>Follow these simple steps to begin your automation journey...</p>

<img src="https://example.com/automation.jpg" alt="AI Automation" />

<h2>Conclusion</h2>
<p>Start automating today and watch your passive income grow!</p>`,
      categories: ['Technology', 'AI'],
      tags: ['automation', 'ai', 'passive-income', 'wordpress'],
      status: 'publish',
      seo: {
        title: 'AI Automation Guide - Start Building Passive Income',
        description: 'Learn how to leverage AI automation for passive income. Step-by-step guide with proven strategies.',
        keywords: ['ai automation', 'passive income', 'content generation'],
        focusKeyphrase: 'ai automation',
      },
    });
  }
}

// Export singleton
export const wordpressPublisher = new WordPressPublisher();

// Auto-initialize from credential vault if available
if (typeof window !== 'undefined') {
  // Delay auto-init to ensure credential vault is loaded
  setTimeout(() => {
    wordpressPublisher.connectFromVault();
  }, 100);
}

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testWordPressPublisher = () => wordpressPublisher.quickTest();
  (window as any).wordpressPublisher = wordpressPublisher;
}
