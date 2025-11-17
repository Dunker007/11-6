/**
 * successStoriesService.ts
 * User success stories showcase and social proof system.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface SuccessStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  metrics: SuccessMetrics;
  category: 'content' | 'revenue' | 'automation' | 'growth';
  featured: boolean;
  verified: boolean;
  testimonial?: string;
  beforeAfter?: BeforeAfter;
  timeline: TimelineEvent[];
  createdAt: Date;
  publishedAt?: Date;
  likes: number;
  tags: string[];
}

export interface SuccessMetrics {
  revenue?: number;
  revenueIncrease?: number;
  contentCreated?: number;
  timeSaved?: number;
  audienceGrowth?: number;
  monthsToSuccess?: number;
}

export interface BeforeAfter {
  before: string;
  after: string;
}

export interface TimelineEvent {
  date: Date;
  milestone: string;
  description: string;
}

export interface StoryFilter {
  category?: string;
  minRevenue?: number;
  featured?: boolean;
  verified?: boolean;
  tags?: string[];
}

class SuccessStoriesService {
  private stories: SuccessStory[] = [];

  submitStory(story: Omit<SuccessStory, 'id' | 'createdAt' | 'likes' | 'verified' | 'publishedAt'>): SuccessStory {
    const fullStory: SuccessStory = {
      id: crypto.randomUUID(),
      ...story,
      createdAt: new Date(),
      likes: 0,
      verified: false,
    };

    this.stories.push(fullStory);

    activityService.logActivity({
      type: 'success_story_submitted',
      message: `Success story submitted: ${story.title}`,
      metadata: { userId: story.userId },
    });

    logger.info('Success story submitted', { id: fullStory.id, title: story.title });

    return fullStory;
  }

  publishStory(storyId: string): boolean {
    const story = this.stories.find(s => s.id === storyId);

    if (!story) {
      return false;
    }

    story.publishedAt = new Date();
    story.verified = true;

    logger.info('Success story published', { id: storyId });

    return true;
  }

  getStory(storyId: string): SuccessStory | undefined {
    return this.stories.find(s => s.id === storyId);
  }

  getAllStories(filter?: StoryFilter): SuccessStory[] {
    let filtered = this.stories.filter(s => s.publishedAt);

    if (filter) {
      if (filter.category) {
        filtered = filtered.filter(s => s.category === filter.category);
      }

      if (filter.minRevenue) {
        filtered = filtered.filter(s => (s.metrics.revenue || 0) >= filter.minRevenue!);
      }

      if (filter.featured !== undefined) {
        filtered = filtered.filter(s => s.featured === filter.featured);
      }

      if (filter.verified !== undefined) {
        filtered = filtered.filter(s => s.verified === filter.verified);
      }

      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(s => filter.tags!.some(tag => s.tags.includes(tag)));
      }
    }

    return filtered.sort((a, b) => b.likes - a.likes);
  }

  getFeaturedStories(limit: number = 5): SuccessStory[] {
    return this.stories.filter(s => s.featured && s.publishedAt).slice(0, limit);
  }

  getStoriesByCategory(category: string): SuccessStory[] {
    return this.getAllStories({ category });
  }

  likeStory(storyId: string): boolean {
    const story = this.stories.find(s => s.id === storyId);

    if (!story) {
      return false;
    }

    story.likes++;
    logger.info('Story liked', { id: storyId, totalLikes: story.likes });

    return true;
  }

  featureStory(storyId: string): boolean {
    const story = this.stories.find(s => s.id === storyId);

    if (!story) {
      return false;
    }

    story.featured = true;
    logger.info('Story featured', { id: storyId });

    return true;
  }

  getTopStories(limit: number = 10): SuccessStory[] {
    return this.getAllStories()
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  }

  getRecentStories(limit: number = 10): SuccessStory[] {
    return this.getAllStories()
      .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0))
      .slice(0, limit);
  }

  getInspirationalQuotes(): { text: string; author: string; category: string }[] {
    return this.stories
      .filter(s => s.testimonial && s.publishedAt)
      .map(s => ({
        text: s.testimonial!,
        author: s.userName,
        category: s.category,
      }))
      .slice(0, 10);
  }

  getAggregateMetrics(): {
    totalRevenue: number;
    totalContent: number;
    totalTimeSaved: number;
    avgMonthsToSuccess: number;
  } {
    const published = this.stories.filter(s => s.publishedAt);

    const totalRevenue = published.reduce((sum, s) => sum + (s.metrics.revenue || 0), 0);
    const totalContent = published.reduce((sum, s) => sum + (s.metrics.contentCreated || 0), 0);
    const totalTimeSaved = published.reduce((sum, s) => sum + (s.metrics.timeSaved || 0), 0);

    const storiesWithTimeframe = published.filter(s => s.metrics.monthsToSuccess);
    const avgMonthsToSuccess =
      storiesWithTimeframe.length > 0
        ? storiesWithTimeframe.reduce((sum, s) => sum + (s.metrics.monthsToSuccess || 0), 0) / storiesWithTimeframe.length
        : 0;

    return {
      totalRevenue,
      totalContent,
      totalTimeSaved,
      avgMonthsToSuccess,
    };
  }

  searchStories(query: string): SuccessStory[] {
    const lowerQuery = query.toLowerCase();

    return this.getAllStories().filter(s => {
      const titleMatch = s.title.toLowerCase().includes(lowerQuery);
      const descMatch = s.description.toLowerCase().includes(lowerQuery);
      const tagMatch = s.tags.some(t => t.toLowerCase().includes(lowerQuery));

      return titleMatch || descMatch || tagMatch;
    });
  }

  initializeSampleStories(): void {
    // Story 1: Revenue Success
    const story1 = this.submitStory({
      userId: 'user1',
      userName: 'Sarah Johnson',
      title: 'From $0 to $10K MRR in 6 Months',
      description: 'Started with zero income streams, built automated content empire generating consistent passive income.',
      metrics: {
        revenue: 10000,
        revenueIncrease: 100,
        contentCreated: 250,
        timeSaved: 500,
        audienceGrowth: 15000,
        monthsToSuccess: 6,
      },
      category: 'revenue',
      featured: true,
      testimonial: 'DLX Studios transformed my side hustle into a full-time income. The automation is incredible!',
      beforeAfter: {
        before: 'Spending 40 hours/week creating content manually',
        after: 'Automated content creation, working 5 hours/week managing the system',
      },
      timeline: [
        { date: new Date('2024-01-01'), milestone: 'Started', description: 'Joined DLX Studios' },
        { date: new Date('2024-02-15'), milestone: 'First $1K', description: 'Reached first $1,000 in monthly revenue' },
        { date: new Date('2024-06-01'), milestone: '$10K MRR', description: 'Hit $10,000 monthly recurring revenue' },
      ],
      tags: ['revenue', 'automation', 'content'],
    });

    this.publishStory(story1.id);
    this.likeStory(story1.id);
    this.likeStory(story1.id);
    this.likeStory(story1.id);

    // Story 2: Content Automation
    const story2 = this.submitStory({
      userId: 'user2',
      userName: 'Mike Chen',
      title: 'Published 500+ Pieces of Content Automatically',
      description: 'Built a content machine that generates and publishes across 10 platforms without manual intervention.',
      metrics: {
        contentCreated: 500,
        timeSaved: 800,
        audienceGrowth: 25000,
        monthsToSuccess: 4,
      },
      category: 'automation',
      featured: true,
      testimonial: 'The AI content generation is mind-blowing. Quality content at scale is now a reality.',
      timeline: [
        { date: new Date('2024-03-01'), milestone: 'First Post', description: 'Generated first AI content' },
        { date: new Date('2024-04-01'), milestone: '100 Posts', description: 'Published 100th piece' },
        { date: new Date('2024-07-01'), milestone: '500 Posts', description: 'Reached 500 publications' },
      ],
      tags: ['content', 'automation', 'scale'],
    });

    this.publishStory(story2.id);
    this.likeStory(story2.id);
    this.likeStory(story2.id);

    // Story 3: Audience Growth
    const story3 = this.submitStory({
      userId: 'user3',
      userName: 'Emma Rodriguez',
      title: 'Grew Audience from 1K to 50K Followers',
      description: 'Systematic content distribution across platforms led to explosive follower growth.',
      metrics: {
        audienceGrowth: 49000,
        contentCreated: 150,
        revenue: 5000,
        monthsToSuccess: 8,
      },
      category: 'growth',
      featured: false,
      testimonial: 'Consistent, quality content automatically published everywhere. Growth was inevitable.',
      timeline: [
        { date: new Date('2023-10-01'), milestone: 'Started', description: 'Began content automation' },
        { date: new Date('2024-03-01'), milestone: '10K Followers', description: 'Hit 10,000 followers' },
        { date: new Date('2024-06-01'), milestone: '50K Followers', description: 'Reached 50,000 followers' },
      ],
      tags: ['growth', 'social', 'audience'],
    });

    this.publishStory(story3.id);
    this.likeStory(story3.id);

    logger.info('Sample success stories initialized', { count: this.stories.length });
  }

  quickTest() {
    this.initializeSampleStories();

    const featured = this.getFeaturedStories();
    const topStories = this.getTopStories(5);
    const revenueStories = this.getStoriesByCategory('revenue');
    const aggregateMetrics = this.getAggregateMetrics();
    const quotes = this.getInspirationalQuotes();

    return {
      totalStories: this.stories.length,
      publishedStories: this.getAllStories().length,
      featured: featured.map(s => ({ title: s.title, likes: s.likes })),
      topStories: topStories.map(s => ({ title: s.title, category: s.category })),
      revenueStories: revenueStories.length,
      aggregateMetrics,
      quotes: quotes.slice(0, 3),
    };
  }
}

export const successStoriesService = new SuccessStoriesService();
if (typeof window !== 'undefined') (window as any).testSuccessStories = () => successStoriesService.quickTest();
