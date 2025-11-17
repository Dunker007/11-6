/**
 * contentAnalyticsService.ts
 * Content performance analytics: scoring, best topics, posting times.
 */

import { logger } from '../logging/loggerService';

export interface ContentScore {
  contentId: string;
  title: string;
  platform: string;
  views: number;
  engagement: number;
  score: number;
  publishedAt: Date;
}

export interface TopicPerformance {
  topic: string;
  totalPosts: number;
  avgScore: number;
  totalViews: number;
  totalEngagement: number;
}

class ContentAnalyticsService {
  private content: ContentScore[] = [];

  trackContent(content: Omit<ContentScore, 'score'>): ContentScore {
    const score = this.calculateScore(content.views, content.engagement);
    const scored: ContentScore = { ...content, score };
    this.content.push(scored);
    return scored;
  }

  private calculateScore(views: number, engagement: number): number {
    return Math.round((views * 0.3 + engagement * 0.7) / 10);
  }

  getTopContent(limit: number = 10): ContentScore[] {
    return [...this.content].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  getTopicPerformance(): TopicPerformance[] {
    const topics = new Map<string, { posts: number; score: number; views: number; engagement: number }>();

    this.content.forEach(c => {
      const topic = c.title.split(' ')[0];
      const existing = topics.get(topic) || { posts: 0, score: 0, views: 0, engagement: 0 };
      topics.set(topic, {
        posts: existing.posts + 1,
        score: existing.score + c.score,
        views: existing.views + c.views,
        engagement: existing.engagement + c.engagement,
      });
    });

    return Array.from(topics.entries()).map(([topic, data]) => ({
      topic,
      totalPosts: data.posts,
      avgScore: Math.round(data.score / data.posts),
      totalViews: data.views,
      totalEngagement: data.engagement,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }

  getBestPostingTimes(): { hour: number; avgScore: number }[] {
    const hourlyScores = new Map<number, { total: number; count: number }>();

    this.content.forEach(c => {
      const hour = c.publishedAt.getHours();
      const existing = hourlyScores.get(hour) || { total: 0, count: 0 };
      hourlyScores.set(hour, { total: existing.total + c.score, count: existing.count + 1 });
    });

    return Array.from(hourlyScores.entries())
      .map(([hour, data]) => ({ hour, avgScore: Math.round(data.total / data.count) }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }

  quickTest() {
    this.trackContent({ contentId: '1', title: 'AI Tutorial', platform: 'youtube', views: 5000, engagement: 350, publishedAt: new Date(2024, 0, 1, 9) });
    this.trackContent({ contentId: '2', title: 'AI Guide', platform: 'blog', views: 3000, engagement: 200, publishedAt: new Date(2024, 0, 2, 14) });
    this.trackContent({ contentId: '3', title: 'Automation Tips', platform: 'twitter', views: 10000, engagement: 800, publishedAt: new Date(2024, 0, 3, 10) });

    return {
      topContent: this.getTopContent(),
      topicPerformance: this.getTopicPerformance(),
      bestTimes: this.getBestPostingTimes(),
    };
  }
}

export const contentAnalyticsService = new ContentAnalyticsService();
if (typeof window !== 'undefined') (window as any).testContentAnalytics = () => contentAnalyticsService.quickTest();
