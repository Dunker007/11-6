/**
 * audienceGrowthService.ts
 * Audience growth analytics: follower growth, engagement, forecasting.
 */

import { logger } from '../logging/loggerService';

export interface GrowthMetrics {
  platform: string;
  followers: number;
  change24h: number;
  change7d: number;
  change30d: number;
  engagementRate: number;
  forecast30d: number;
}

export interface EngagementData {
  date: Date;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

class AudienceGrowthService {
  private platforms = new Map<string, { followers: number[]; engagement: EngagementData[] }>();

  trackGrowth(platform: string, followers: number, engagement: EngagementData) {
    const existing = this.platforms.get(platform) || { followers: [], engagement: [] };
    existing.followers.push(followers);
    existing.engagement.push(engagement);
    this.platforms.set(platform, existing);
  }

  getMetrics(platform: string): GrowthMetrics {
    const data = this.platforms.get(platform) || { followers: [1000], engagement: [] };
    const followers = data.followers;
    const current = followers[followers.length - 1];
    const prev24h = followers.length > 1 ? followers[followers.length - 2] : current;
    const prev7d = followers.length > 7 ? followers[followers.length - 8] : current;
    const prev30d = followers.length > 30 ? followers[followers.length - 31] : current;

    const avgEngagement = data.engagement.reduce((sum, e) => sum + e.engagementRate, 0) / (data.engagement.length || 1);
    const growthRate = followers.length > 1 ? (current - followers[0]) / followers[0] : 0.05;
    const forecast30d = Math.round(current * (1 + growthRate));

    return {
      platform,
      followers: current,
      change24h: current - prev24h,
      change7d: current - prev7d,
      change30d: current - prev30d,
      engagementRate: Math.round(avgEngagement * 100) / 100,
      forecast30d,
    };
  }

  getAllMetrics(): GrowthMetrics[] {
    return Array.from(this.platforms.keys()).map(platform => this.getMetrics(platform));
  }

  quickTest() {
    this.trackGrowth('twitter', 5000, { date: new Date(), likes: 150, comments: 20, shares: 10, engagementRate: 3.6 });
    this.trackGrowth('twitter', 5050, { date: new Date(), likes: 160, comments: 22, shares: 12, engagementRate: 3.8 });
    this.trackGrowth('linkedin', 3000, { date: new Date(), likes: 80, comments: 15, shares: 8, engagementRate: 3.4 });

    return this.getAllMetrics();
  }
}

export const audienceGrowthService = new AudienceGrowthService();
if (typeof window !== 'undefined') (window as any).testAudienceGrowth = () => audienceGrowthService.quickTest();
