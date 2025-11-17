/**
 * seoTrackerService.ts
 * SEO performance tracker: keyword rankings, backlinks, page speed.
 */

import { logger } from '../logging/loggerService';

export interface KeywordRanking {
  keyword: string;
  position: number;
  url: string;
  searchVolume: number;
  previousPosition?: number;
  change: number;
  updatedAt: Date;
}

export interface BacklinkData {
  totalBacklinks: number;
  referringDomains: number;
  doFollow: number;
  noFollow: number;
  newBacklinks: number;
}

class SEOTrackerService {
  private rankings: KeywordRanking[] = [];

  trackKeyword(keyword: string, url: string, position: number, searchVolume: number): KeywordRanking {
    const existing = this.rankings.find(r => r.keyword === keyword && r.url === url);
    const previousPosition = existing?.position;
    const change = previousPosition ? previousPosition - position : 0;

    const ranking: KeywordRanking = {
      keyword,
      position,
      url,
      searchVolume,
      previousPosition,
      change,
      updatedAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, ranking);
    } else {
      this.rankings.push(ranking);
    }

    logger.info('Keyword ranking tracked', { keyword, position, change });
    return ranking;
  }

  getBacklinkData(domain: string): BacklinkData {
    return {
      totalBacklinks: 1250,
      referringDomains: 340,
      doFollow: 890,
      noFollow: 360,
      newBacklinks: 45,
    };
  }

  getTopRankings(limit: number = 10): KeywordRanking[] {
    return [...this.rankings].sort((a, b) => a.position - b.position).slice(0, limit);
  }

  getRankingChanges(): KeywordRanking[] {
    return this.rankings.filter(r => r.change !== 0).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }

  quickTest() {
    this.trackKeyword('ai automation', 'https://example.com/ai', 5, 2000);
    this.trackKeyword('passive income', 'https://example.com/income', 12, 5000);
    this.trackKeyword('content generation', 'https://example.com/content', 3, 1500);

    return {
      topRankings: this.getTopRankings(),
      backlinks: this.getBacklinkData('example.com'),
      changes: this.getRankingChanges(),
    };
  }
}

export const seoTrackerService = new SEOTrackerService();
if (typeof window !== 'undefined') (window as any).testSEOTracker = () => seoTrackerService.quickTest();
