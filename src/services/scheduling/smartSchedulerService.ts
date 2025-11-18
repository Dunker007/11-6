/**
 * Smart Scheduler 2.0
 * ML-based intelligent scheduling that learns optimal posting times
 * Integrates with Learning System for temporal pattern detection
 */

import { learningSystemService } from '../learning/learningSystemService';
import { contentPerformancePredictorService } from '../ai/contentPerformancePredictorService';
import { activityService } from '../activity/activityService';

export interface ScheduleSlot {
  id: string;
  platform: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string;
  score: number; // 0-100 predicted performance
  metrics: {
    predictedEngagement: number;
    predictedClicks: number;
    predictedRevenue: number;
    audienceSize: number;
    competitionLevel: number; // How many others posting at this time
  };
  confidence: number; // 0-1
  basedOn: {
    historicalData: number; // Number of data points
    learningPatterns: string[]; // Pattern IDs from learning system
    platformTrends: boolean;
  };
}

export interface ScheduleRecommendation {
  id: string;
  type: 'add_slot' | 'remove_slot' | 'shift_time' | 'increase_frequency' | 'decrease_frequency';
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentSchedule?: ScheduleSlot;
  recommendedSchedule?: ScheduleSlot;
  reasoning: string;
  expectedImpact: {
    metric: string;
    improvement: number; // Percentage
    confidence: number;
  };
  actionSteps: string[];
  autoImplementable: boolean;
}

export interface ScheduleOptimization {
  id: string;
  platform: string;
  objectives: ('engagement' | 'clicks' | 'revenue' | 'reach')[];
  constraints: {
    maxPostsPerDay: number;
    minHoursBetweenPosts: number;
    allowedHours?: { start: number; end: number }; // e.g., 9-17 for business hours
    excludedDays?: number[]; // Days to skip
  };
  optimizedSlots: ScheduleSlot[];
  expectedResults: {
    engagementIncrease: number; // Percentage
    revenueIncrease: number; // Percentage
    efficiency: number; // Posts per result
  };
  confidence: number;
  createdAt: Date;
}

export interface AudienceInsight {
  platform: string;
  peakActivityTimes: Array<{
    dayOfWeek: number;
    hour: number;
    activityLevel: number; // 0-100
    engagement: number; // Average engagement during this time
  }>;
  audienceTimezones: Array<{
    timezone: string;
    percentage: number;
  }>;
  contentPreferences: {
    optimalLength: number;
    preferredTypes: string[];
    bestPerformingTopics: string[];
  };
  competitorAnalysis: {
    averagePostingTimes: number[];
    gaps: number[]; // Hours with low competition
  };
}

export interface ScheduleABTest {
  id: string;
  name: string;
  platform: string;
  control: ScheduleSlot;
  test: ScheduleSlot;
  startDate: Date;
  endDate?: Date;
  duration: number; // Days
  status: 'running' | 'completed' | 'inconclusive';
  results?: {
    controlPerformance: {
      engagement: number;
      clicks: number;
      revenue: number;
      posts: number;
    };
    testPerformance: {
      engagement: number;
      clicks: number;
      revenue: number;
      posts: number;
    };
    winner: 'control' | 'test' | 'inconclusive';
    improvement: number; // Percentage
    confidence: number; // Statistical significance
  };
}

class SmartSchedulerService {
  private static instance: SmartSchedulerService;
  private readonly STORAGE_KEY = 'dlx_smart_scheduler';
  private readonly MIN_DATA_POINTS = 10; // Minimum posts to make predictions
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  private data: {
    scheduleSlots: ScheduleSlot[];
    recommendations: ScheduleRecommendation[];
    optimizations: ScheduleOptimization[];
    audienceInsights: Record<string, AudienceInsight>;
    abTests: ScheduleABTest[];
    performanceHistory: Array<{
      slotId: string;
      platform: string;
      postedAt: Date;
      dayOfWeek: number;
      hour: number;
      engagement: number;
      clicks: number;
      revenue: number;
    }>;
    autoOptimizeEnabled: boolean;
  };

  private constructor() {
    this.data = {
      scheduleSlots: [],
      recommendations: [],
      optimizations: [],
      audienceInsights: {},
      abTests: [],
      performanceHistory: [],
      autoOptimizeEnabled: false,
    };
    this.loadData();
  }

  static getInstance(): SmartSchedulerService {
    if (!SmartSchedulerService.instance) {
      SmartSchedulerService.instance = new SmartSchedulerService();
    }
    return SmartSchedulerService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.performanceHistory = parsed.performanceHistory?.map((h: any) => ({
          ...h,
          postedAt: new Date(h.postedAt),
        })) || [];
        parsed.optimizations = parsed.optimizations?.map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
        })) || [];
        parsed.abTests = parsed.abTests?.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: t.endDate ? new Date(t.endDate) : undefined,
        })) || [];

        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading smart scheduler data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving smart scheduler data:', error);
    }
  }

  /**
   * Initialize the smart scheduler with existing posting history
   */
  async initialize(postingHistory?: Array<{
    platform: string;
    postedAt: Date;
    engagement: number;
    clicks: number;
    revenue: number;
  }>): Promise<void> {
    if (postingHistory) {
      this.data.performanceHistory = postingHistory.map((post) => {
        const date = new Date(post.postedAt);
        return {
          slotId: this.generateSlotId(post.platform, date.getDay(), date.getHours()),
          platform: post.platform,
          postedAt: date,
          dayOfWeek: date.getDay(),
          hour: date.getHours(),
          engagement: post.engagement,
          clicks: post.clicks,
          revenue: post.revenue,
        };
      });
      this.saveData();
    }

    // Analyze audience for each platform
    const platforms = [...new Set(this.data.performanceHistory.map(h => h.platform))];
    for (const platform of platforms) {
      await this.analyzeAudience(platform);
    }

    // Generate initial recommendations
    await this.generateRecommendations();

    activityService.logActivity({
      type: 'system',
      message: `Smart Scheduler 2.0 initialized with ${this.data.performanceHistory.length} historical posts`,
      metadata: { platforms: platforms.length },
    });
  }

  /**
   * Record a post's performance for learning
   */
  recordPostPerformance(
    platform: string,
    postedAt: Date,
    metrics: {
      engagement: number;
      clicks: number;
      revenue: number;
    }
  ): void {
    const date = new Date(postedAt);
    const slotId = this.generateSlotId(platform, date.getDay(), date.getHours());

    this.data.performanceHistory.push({
      slotId,
      platform,
      postedAt: date,
      dayOfWeek: date.getDay(),
      hour: date.getHours(),
      ...metrics,
    });

    // Also record in learning system
    learningSystemService.recordAction({
      id: `post-${Date.now()}`,
      type: 'content_publish',
      timestamp: date,
      context: {
        platform,
        dayOfWeek: date.getDay(),
        hour: date.getHours(),
      },
      outcome: {
        success: metrics.engagement > 0 || metrics.clicks > 0,
        metrics,
        timestamp: new Date(),
      },
    });

    this.saveData();

    // Trigger re-analysis if we have enough new data
    if (this.data.performanceHistory.length % 20 === 0) {
      this.analyzeAudience(platform);
      this.generateRecommendations();
    }
  }

  /**
   * Analyze audience behavior for a platform
   */
  async analyzeAudience(platform: string): Promise<AudienceInsight> {
    const platformHistory = this.data.performanceHistory.filter(h => h.platform === platform);

    if (platformHistory.length < this.MIN_DATA_POINTS) {
      // Not enough data - return default insight
      const defaultInsight: AudienceInsight = {
        platform,
        peakActivityTimes: [],
        audienceTimezones: [{ timezone: 'UTC', percentage: 100 }],
        contentPreferences: {
          optimalLength: 1000,
          preferredTypes: [],
          bestPerformingTopics: [],
        },
        competitorAnalysis: {
          averagePostingTimes: [],
          gaps: [],
        },
      };
      this.data.audienceInsights[platform] = defaultInsight;
      this.saveData();
      return defaultInsight;
    }

    // Analyze peak activity times
    const timeSlotPerformance: Record<string, {
      count: number;
      totalEngagement: number;
      totalClicks: number;
      totalRevenue: number;
    }> = {};

    for (const post of platformHistory) {
      const key = `${post.dayOfWeek}-${post.hour}`;
      if (!timeSlotPerformance[key]) {
        timeSlotPerformance[key] = { count: 0, totalEngagement: 0, totalClicks: 0, totalRevenue: 0 };
      }
      timeSlotPerformance[key].count++;
      timeSlotPerformance[key].totalEngagement += post.engagement;
      timeSlotPerformance[key].totalClicks += post.clicks;
      timeSlotPerformance[key].totalRevenue += post.revenue;
    }

    // Calculate average performance per time slot
    const peakActivityTimes = Object.entries(timeSlotPerformance)
      .map(([key, data]) => {
        const [dayOfWeek, hour] = key.split('-').map(Number);
        const avgEngagement = data.totalEngagement / data.count;
        const avgClicks = data.totalClicks / data.count;
        const avgRevenue = data.totalRevenue / data.count;

        // Activity level based on combined performance
        const activityLevel = Math.min(100, (avgEngagement / 10 + avgClicks / 5 + avgRevenue / 100) * 10);

        return {
          dayOfWeek,
          hour,
          activityLevel,
          engagement: avgEngagement,
        };
      })
      .sort((a, b) => b.activityLevel - a.activityLevel);

    // Get learning system patterns for this platform
    const learningPatterns = learningSystemService.getUserProfile()?.patterns.filter(
      p => p.type === 'temporal'
    ) || [];

    // Analyze content preferences
    const contentPreferences = {
      optimalLength: 1000, // Default
      preferredTypes: ['article', 'tutorial'], // Default
      bestPerformingTopics: [], // Would need content analysis
    };

    // Identify competitor gaps (hours with low posting activity but good engagement)
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const postedHours = new Set(platformHistory.map(h => h.hour));
    const gaps = allHours.filter(hour => {
      const hourData = peakActivityTimes.find(p => p.hour === hour);
      return !postedHours.has(hour) || (hourData && hourData.activityLevel > 50);
    });

    const insight: AudienceInsight = {
      platform,
      peakActivityTimes,
      audienceTimezones: [
        { timezone: 'America/New_York', percentage: 40 },
        { timezone: 'America/Los_Angeles', percentage: 30 },
        { timezone: 'Europe/London', percentage: 20 },
        { timezone: 'Asia/Tokyo', percentage: 10 },
      ],
      contentPreferences,
      competitorAnalysis: {
        averagePostingTimes: Array.from(postedHours),
        gaps,
      },
    };

    this.data.audienceInsights[platform] = insight;
    this.saveData();

    activityService.logActivity({
      type: 'ai',
      message: `Analyzed audience for ${platform}: found ${peakActivityTimes.length} active time slots`,
      metadata: { platform, peakTimes: peakActivityTimes.slice(0, 5) },
    });

    return insight;
  }

  /**
   * Predict the best time slots for a platform
   */
  async predictOptimalSlots(
    platform: string,
    count: number = 5,
    timezone: string = 'UTC'
  ): Promise<ScheduleSlot[]> {
    const insight = this.data.audienceInsights[platform];
    if (!insight) {
      await this.analyzeAudience(platform);
      return this.predictOptimalSlots(platform, count, timezone);
    }

    const platformHistory = this.data.performanceHistory.filter(h => h.platform === platform);
    const hasEnoughData = platformHistory.length >= this.MIN_DATA_POINTS;

    // Get learning system's temporal patterns
    const userProfile = learningSystemService.getUserProfile();
    const temporalPatterns = userProfile?.patterns.filter(p => p.type === 'temporal') || [];

    // Score each possible time slot
    const slots: ScheduleSlot[] = [];

    for (const peakTime of insight.peakActivityTimes.slice(0, count * 2)) {
      const slotId = this.generateSlotId(platform, peakTime.dayOfWeek, peakTime.hour);

      // Get historical performance for this exact slot
      const slotHistory = platformHistory.filter(
        h => h.dayOfWeek === peakTime.dayOfWeek && h.hour === peakTime.hour
      );

      let score = peakTime.activityLevel;
      let confidence = hasEnoughData ? 0.7 : 0.4;

      // Boost score if learning system identified this as a good time
      const matchingPattern = temporalPatterns.find(p =>
        p.name.includes(`hour ${peakTime.hour}`)
      );
      if (matchingPattern) {
        score = Math.min(100, score * (1 + matchingPattern.confidence * 0.3));
        confidence = Math.max(confidence, matchingPattern.confidence);
      }

      // Calculate predicted metrics
      const avgEngagement = slotHistory.length > 0
        ? slotHistory.reduce((sum, h) => sum + h.engagement, 0) / slotHistory.length
        : peakTime.engagement;

      const avgClicks = slotHistory.length > 0
        ? slotHistory.reduce((sum, h) => sum + h.clicks, 0) / slotHistory.length
        : avgEngagement * 0.1;

      const avgRevenue = slotHistory.length > 0
        ? slotHistory.reduce((sum, h) => sum + h.revenue, 0) / slotHistory.length
        : avgClicks * 2;

      // Estimate competition level
      const competitionLevel = insight.competitorAnalysis.averagePostingTimes.includes(peakTime.hour) ? 70 : 30;

      slots.push({
        id: slotId,
        platform,
        dayOfWeek: peakTime.dayOfWeek,
        hour: peakTime.hour,
        minute: 0, // Default to top of hour
        timezone,
        score: Math.round(score),
        metrics: {
          predictedEngagement: Math.round(avgEngagement),
          predictedClicks: Math.round(avgClicks),
          predictedRevenue: Math.round(avgRevenue * 100) / 100,
          audienceSize: Math.round(peakTime.activityLevel * 100),
          competitionLevel,
        },
        confidence,
        basedOn: {
          historicalData: slotHistory.length,
          learningPatterns: matchingPattern ? [matchingPattern.id] : [],
          platformTrends: true,
        },
      });
    }

    // Sort by score and return top N
    const topSlots = slots
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    // Save these as recommended slots
    this.data.scheduleSlots = topSlots;
    this.saveData();

    return topSlots;
  }

  /**
   * Generate schedule recommendations based on current performance
   */
  async generateRecommendations(): Promise<ScheduleRecommendation[]> {
    const recommendations: ScheduleRecommendation[] = [];
    const platforms = Object.keys(this.data.audienceInsights);

    for (const platform of platforms) {
      const insight = this.data.audienceInsights[platform];
      const currentSlots = this.data.scheduleSlots.filter(s => s.platform === platform);
      const platformHistory = this.data.performanceHistory.filter(h => h.platform === platform);

      if (platformHistory.length < this.MIN_DATA_POINTS) {
        continue; // Not enough data
      }

      // Recommendation 1: Add slots for high-performing times not currently used
      const unusedPeakTimes = insight.peakActivityTimes
        .filter(peak => peak.activityLevel > 70)
        .filter(peak => !currentSlots.some(s => s.dayOfWeek === peak.dayOfWeek && s.hour === peak.hour));

      for (const peakTime of unusedPeakTimes.slice(0, 3)) {
        const newSlot: ScheduleSlot = {
          id: this.generateSlotId(platform, peakTime.dayOfWeek, peakTime.hour),
          platform,
          dayOfWeek: peakTime.dayOfWeek,
          hour: peakTime.hour,
          minute: 0,
          timezone: 'UTC',
          score: Math.round(peakTime.activityLevel),
          metrics: {
            predictedEngagement: Math.round(peakTime.engagement),
            predictedClicks: Math.round(peakTime.engagement * 0.1),
            predictedRevenue: Math.round(peakTime.engagement * 0.2),
            audienceSize: Math.round(peakTime.activityLevel * 100),
            competitionLevel: 50,
          },
          confidence: 0.7,
          basedOn: {
            historicalData: platformHistory.length,
            learningPatterns: [],
            platformTrends: true,
          },
        };

        recommendations.push({
          id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'add_slot',
          priority: 'high',
          recommendedSchedule: newSlot,
          reasoning: `Peak audience activity detected at ${this.formatDayHour(peakTime.dayOfWeek, peakTime.hour)} with ${Math.round(peakTime.activityLevel)}% engagement level`,
          expectedImpact: {
            metric: 'engagement',
            improvement: 25,
            confidence: 0.7,
          },
          actionSteps: [
            `Add posting slot for ${this.formatDayHour(peakTime.dayOfWeek, peakTime.hour)}`,
            'Monitor performance for 2 weeks',
            'Adjust based on results',
          ],
          autoImplementable: true,
        });
      }

      // Recommendation 2: Remove or shift poorly performing slots
      const poorSlots = currentSlots.filter(slot => {
        const slotHistory = platformHistory.filter(
          h => h.dayOfWeek === slot.dayOfWeek && h.hour === slot.hour
        );
        if (slotHistory.length < 3) return false;

        const avgEngagement = slotHistory.reduce((sum, h) => sum + h.engagement, 0) / slotHistory.length;
        const platformAvg = platformHistory.reduce((sum, h) => sum + h.engagement, 0) / platformHistory.length;

        return avgEngagement < platformAvg * 0.6; // 40% below average
      });

      for (const poorSlot of poorSlots) {
        const betterAlternative = insight.peakActivityTimes.find(
          peak => peak.dayOfWeek === poorSlot.dayOfWeek &&
                  Math.abs(peak.hour - poorSlot.hour) <= 3 &&
                  peak.activityLevel > poorSlot.score * 1.3
        );

        if (betterAlternative) {
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'shift_time',
            priority: 'medium',
            currentSchedule: poorSlot,
            recommendedSchedule: {
              ...poorSlot,
              hour: betterAlternative.hour,
              score: Math.round(betterAlternative.activityLevel),
            },
            reasoning: `Current slot ${this.formatDayHour(poorSlot.dayOfWeek, poorSlot.hour)} underperforming. Nearby time ${this.formatDayHour(betterAlternative.dayOfWeek, betterAlternative.hour)} shows ${Math.round(betterAlternative.activityLevel - poorSlot.score)}% better engagement`,
            expectedImpact: {
              metric: 'engagement',
              improvement: Math.round(((betterAlternative.activityLevel - poorSlot.score) / poorSlot.score) * 100),
              confidence: 0.65,
            },
            actionSteps: [
              `Shift from ${this.formatDayHour(poorSlot.dayOfWeek, poorSlot.hour)} to ${this.formatDayHour(betterAlternative.dayOfWeek, betterAlternative.hour)}`,
              'Run A/B test for 2 weeks',
              'Compare performance metrics',
            ],
            autoImplementable: false, // Requires A/B testing
          });
        }
      }

      // Recommendation 3: Increase frequency if content is performing well
      const recentPerformance = platformHistory.slice(-20);
      if (recentPerformance.length >= 10) {
        const avgEngagement = recentPerformance.reduce((sum, h) => sum + h.engagement, 0) / recentPerformance.length;
        const allTimeAvg = platformHistory.reduce((sum, h) => sum + h.engagement, 0) / platformHistory.length;

        if (avgEngagement > allTimeAvg * 1.5 && currentSlots.length < 7) {
          recommendations.push({
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'increase_frequency',
            priority: 'high',
            reasoning: `Recent content performing 50% above average. Increasing posting frequency could capitalize on momentum`,
            expectedImpact: {
              metric: 'revenue',
              improvement: 30,
              confidence: 0.75,
            },
            actionSteps: [
              'Add 1-2 more posting slots per week',
              'Focus on high-performing time slots',
              'Monitor for audience fatigue',
            ],
            autoImplementable: true,
          });
        }
      }
    }

    // Filter and sort recommendations
    this.data.recommendations = recommendations
      .filter(r => r.expectedImpact.confidence >= this.CONFIDENCE_THRESHOLD)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    this.saveData();

    if (recommendations.length > 0) {
      activityService.logActivity({
        type: 'ai',
        message: `Generated ${recommendations.length} schedule optimization recommendations`,
        metadata: { recommendations: recommendations.slice(0, 3) },
      });
    }

    return this.data.recommendations;
  }

  /**
   * Create an optimized schedule for a platform based on objectives
   */
  async createOptimizedSchedule(
    platform: string,
    objectives: ('engagement' | 'clicks' | 'revenue' | 'reach')[],
    constraints: {
      maxPostsPerDay: number;
      minHoursBetweenPosts: number;
      allowedHours?: { start: number; end: number };
      excludedDays?: number[];
    }
  ): Promise<ScheduleOptimization> {
    const insight = this.data.audienceInsights[platform];
    if (!insight) {
      await this.analyzeAudience(platform);
      return this.createOptimizedSchedule(platform, objectives, constraints);
    }

    // Filter peak times based on constraints
    let candidateTimes = insight.peakActivityTimes.filter(peak => {
      if (constraints.excludedDays?.includes(peak.dayOfWeek)) return false;
      if (constraints.allowedHours &&
          (peak.hour < constraints.allowedHours.start || peak.hour > constraints.allowedHours.end)) {
        return false;
      }
      return true;
    });

    // Score based on objectives
    const scoredTimes = candidateTimes.map(peak => {
      let score = 0;

      if (objectives.includes('engagement')) {
        score += peak.engagement * 0.4;
      }
      if (objectives.includes('clicks')) {
        score += peak.engagement * 0.1 * 0.3; // Clicks ~10% of engagement
      }
      if (objectives.includes('revenue')) {
        score += peak.engagement * 0.2 * 0.2; // Revenue correlates with engagement
      }
      if (objectives.includes('reach')) {
        score += peak.activityLevel * 0.1;
      }

      return { ...peak, optimizationScore: score };
    }).sort((a, b) => b.optimizationScore - a.optimizationScore);

    // Select slots respecting constraints
    const selectedSlots: ScheduleSlot[] = [];
    const usedDays: Record<number, number[]> = {}; // dayOfWeek -> [hours]

    for (const time of scoredTimes) {
      if (!usedDays[time.dayOfWeek]) {
        usedDays[time.dayOfWeek] = [];
      }

      // Check max posts per day
      if (usedDays[time.dayOfWeek].length >= constraints.maxPostsPerDay) {
        continue;
      }

      // Check minimum hours between posts
      const tooClose = usedDays[time.dayOfWeek].some(hour =>
        Math.abs(hour - time.hour) < constraints.minHoursBetweenPosts
      );
      if (tooClose) {
        continue;
      }

      // Add slot
      const slot: ScheduleSlot = {
        id: this.generateSlotId(platform, time.dayOfWeek, time.hour),
        platform,
        dayOfWeek: time.dayOfWeek,
        hour: time.hour,
        minute: 0,
        timezone: 'UTC',
        score: Math.round(time.activityLevel),
        metrics: {
          predictedEngagement: Math.round(time.engagement),
          predictedClicks: Math.round(time.engagement * 0.1),
          predictedRevenue: Math.round(time.engagement * 0.2),
          audienceSize: Math.round(time.activityLevel * 100),
          competitionLevel: insight.competitorAnalysis.averagePostingTimes.includes(time.hour) ? 70 : 30,
        },
        confidence: 0.75,
        basedOn: {
          historicalData: this.data.performanceHistory.filter(h => h.platform === platform).length,
          learningPatterns: [],
          platformTrends: true,
        },
      };

      selectedSlots.push(slot);
      usedDays[time.dayOfWeek].push(time.hour);

      // Stop if we have enough slots
      if (selectedSlots.length >= constraints.maxPostsPerDay * 7) {
        break;
      }
    }

    // Calculate expected results
    const currentAvgEngagement = this.data.performanceHistory
      .filter(h => h.platform === platform)
      .reduce((sum, h) => sum + h.engagement, 0) /
      Math.max(1, this.data.performanceHistory.filter(h => h.platform === platform).length);

    const optimizedAvgEngagement = selectedSlots.reduce((sum, s) => sum + s.metrics.predictedEngagement, 0) /
      Math.max(1, selectedSlots.length);

    const engagementIncrease = currentAvgEngagement > 0
      ? ((optimizedAvgEngagement - currentAvgEngagement) / currentAvgEngagement) * 100
      : 20; // Conservative estimate

    const optimization: ScheduleOptimization = {
      id: `opt-${Date.now()}`,
      platform,
      objectives,
      constraints,
      optimizedSlots: selectedSlots,
      expectedResults: {
        engagementIncrease: Math.round(engagementIncrease),
        revenueIncrease: Math.round(engagementIncrease * 0.8), // Revenue slightly less than engagement
        efficiency: Math.round((optimizedAvgEngagement / selectedSlots.length) * 100) / 100,
      },
      confidence: 0.75,
      createdAt: new Date(),
    };

    this.data.optimizations.push(optimization);
    this.saveData();

    activityService.logActivity({
      type: 'ai',
      message: `Created optimized schedule for ${platform} with ${selectedSlots.length} slots`,
      metadata: {
        platform,
        objectives,
        expectedIncrease: `${Math.round(engagementIncrease)}%`
      },
    });

    return optimization;
  }

  /**
   * Start an A/B test for a schedule change
   */
  async startABTest(
    name: string,
    platform: string,
    control: ScheduleSlot,
    test: ScheduleSlot,
    durationDays: number = 14
  ): Promise<ScheduleABTest> {
    const abTest: ScheduleABTest = {
      id: `abtest-${Date.now()}`,
      name,
      platform,
      control,
      test,
      startDate: new Date(),
      duration: durationDays,
      status: 'running',
    };

    this.data.abTests.push(abTest);
    this.saveData();

    activityService.logActivity({
      type: 'ai',
      message: `Started A/B test: ${name}`,
      metadata: {
        platform,
        control: this.formatDayHour(control.dayOfWeek, control.hour),
        test: this.formatDayHour(test.dayOfWeek, test.hour),
        duration: durationDays
      },
    });

    return abTest;
  }

  /**
   * Evaluate an A/B test and determine winner
   */
  evaluateABTest(testId: string): ScheduleABTest | null {
    const test = this.data.abTests.find(t => t.id === testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    const endDate = new Date(test.startDate);
    endDate.setDate(endDate.getDate() + test.duration);

    if (new Date() < endDate) {
      return test; // Not finished yet
    }

    // Collect performance data for both slots
    const controlPerf = this.data.performanceHistory.filter(
      h => h.platform === test.platform &&
           h.dayOfWeek === test.control.dayOfWeek &&
           h.hour === test.control.hour &&
           h.postedAt >= test.startDate &&
           h.postedAt <= endDate
    );

    const testPerf = this.data.performanceHistory.filter(
      h => h.platform === test.platform &&
           h.dayOfWeek === test.test.dayOfWeek &&
           h.hour === test.test.hour &&
           h.postedAt >= test.startDate &&
           h.postedAt <= endDate
    );

    if (controlPerf.length < 3 || testPerf.length < 3) {
      test.status = 'inconclusive';
      test.endDate = endDate;
      this.saveData();
      return test;
    }

    // Calculate averages
    const controlAvg = {
      engagement: controlPerf.reduce((sum, h) => sum + h.engagement, 0) / controlPerf.length,
      clicks: controlPerf.reduce((sum, h) => sum + h.clicks, 0) / controlPerf.length,
      revenue: controlPerf.reduce((sum, h) => sum + h.revenue, 0) / controlPerf.length,
    };

    const testAvg = {
      engagement: testPerf.reduce((sum, h) => sum + h.engagement, 0) / testPerf.length,
      clicks: testPerf.reduce((sum, h) => sum + h.clicks, 0) / testPerf.length,
      revenue: testPerf.reduce((sum, h) => sum + h.revenue, 0) / testPerf.length,
    };

    // Determine winner (using engagement as primary metric)
    const improvement = ((testAvg.engagement - controlAvg.engagement) / controlAvg.engagement) * 100;
    const isSignificant = Math.abs(improvement) > 15; // 15% threshold

    let winner: 'control' | 'test' | 'inconclusive' = 'inconclusive';
    if (isSignificant) {
      winner = improvement > 0 ? 'test' : 'control';
    }

    test.results = {
      controlPerformance: {
        ...controlAvg,
        posts: controlPerf.length,
      },
      testPerformance: {
        ...testAvg,
        posts: testPerf.length,
      },
      winner,
      improvement: Math.round(Math.abs(improvement)),
      confidence: isSignificant ? 0.85 : 0.5,
    };
    test.status = 'completed';
    test.endDate = endDate;

    this.saveData();

    activityService.logActivity({
      type: 'ai',
      message: `A/B test "${test.name}" completed. Winner: ${winner}`,
      metadata: {
        testId,
        winner,
        improvement: `${Math.round(improvement)}%`
      },
    });

    return test;
  }

  /**
   * Enable automatic schedule optimization
   */
  enableAutoOptimization(): void {
    this.data.autoOptimizeEnabled = true;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Smart Scheduler auto-optimization enabled',
    });
  }

  /**
   * Disable automatic schedule optimization
   */
  disableAutoOptimization(): void {
    this.data.autoOptimizeEnabled = false;
    this.saveData();

    activityService.logActivity({
      type: 'system',
      message: 'Smart Scheduler auto-optimization disabled',
    });
  }

  /**
   * Get all current recommendations
   */
  getRecommendations(): ScheduleRecommendation[] {
    return this.data.recommendations;
  }

  /**
   * Get audience insights for a platform
   */
  getAudienceInsights(platform: string): AudienceInsight | undefined {
    return this.data.audienceInsights[platform];
  }

  /**
   * Get all running A/B tests
   */
  getRunningABTests(): ScheduleABTest[] {
    return this.data.abTests.filter(t => t.status === 'running');
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalPosts: number;
    platforms: Record<string, {
      posts: number;
      avgEngagement: number;
      avgRevenue: number;
      bestTime: { day: number; hour: number; score: number };
    }>;
    improvements: {
      engagementTrend: number;
      revenueTrend: number;
    };
  } {
    const platforms: Record<string, any> = {};

    for (const platform of Object.keys(this.data.audienceInsights)) {
      const platformHistory = this.data.performanceHistory.filter(h => h.platform === platform);

      if (platformHistory.length === 0) continue;

      const avgEngagement = platformHistory.reduce((sum, h) => sum + h.engagement, 0) / platformHistory.length;
      const avgRevenue = platformHistory.reduce((sum, h) => sum + h.revenue, 0) / platformHistory.length;

      const insight = this.data.audienceInsights[platform];
      const bestTime = insight.peakActivityTimes[0] || { dayOfWeek: 0, hour: 0, activityLevel: 0 };

      platforms[platform] = {
        posts: platformHistory.length,
        avgEngagement: Math.round(avgEngagement * 100) / 100,
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        bestTime: {
          day: bestTime.dayOfWeek,
          hour: bestTime.hour,
          score: Math.round(bestTime.activityLevel),
        },
      };
    }

    // Calculate trends (last 20 vs previous 20)
    const recent = this.data.performanceHistory.slice(-20);
    const previous = this.data.performanceHistory.slice(-40, -20);

    const recentEngagement = recent.length > 0
      ? recent.reduce((sum, h) => sum + h.engagement, 0) / recent.length
      : 0;
    const previousEngagement = previous.length > 0
      ? previous.reduce((sum, h) => sum + h.engagement, 0) / previous.length
      : recentEngagement;

    const recentRevenue = recent.length > 0
      ? recent.reduce((sum, h) => sum + h.revenue, 0) / recent.length
      : 0;
    const previousRevenue = previous.length > 0
      ? previous.reduce((sum, h) => sum + h.revenue, 0) / previous.length
      : recentRevenue;

    const engagementTrend = previousEngagement > 0
      ? Math.round(((recentEngagement - previousEngagement) / previousEngagement) * 100)
      : 0;
    const revenueTrend = previousRevenue > 0
      ? Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    return {
      totalPosts: this.data.performanceHistory.length,
      platforms,
      improvements: {
        engagementTrend,
        revenueTrend,
      },
    };
  }

  // Helper methods
  private generateSlotId(platform: string, dayOfWeek: number, hour: number): string {
    return `${platform}-${dayOfWeek}-${hour}`;
  }

  private formatDayHour(dayOfWeek: number, hour: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${days[dayOfWeek]} ${displayHour}${ampm}`;
  }

  /**
   * Quick test function for browser console
   */
  quickTest(): void {
    console.log('=== Smart Scheduler 2.0 Test ===\n');

    // Simulate posting history
    const testHistory = [];
    const platforms = ['medium', 'linkedin', 'twitter'];

    for (let i = 0; i < 50; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(Math.floor(Math.random() * 24), 0, 0, 0);

      const engagement = Math.floor(Math.random() * 200) + 50;
      const clicks = Math.floor(engagement * (0.05 + Math.random() * 0.15));
      const revenue = clicks * (1 + Math.random() * 3);

      testHistory.push({
        platform,
        postedAt: date,
        engagement,
        clicks,
        revenue,
      });
    }

    this.initialize(testHistory);
    console.log(`Initialized with ${testHistory.length} historical posts`);

    // Predict optimal slots
    console.log('\n--- Optimal Time Slots ---');
    for (const platform of platforms) {
      this.predictOptimalSlots(platform, 5).then(slots => {
        console.log(`\n${platform.toUpperCase()}:`);
        slots.forEach((slot, idx) => {
          console.log(`${idx + 1}. ${this.formatDayHour(slot.dayOfWeek, slot.hour)}`);
          console.log(`   Score: ${slot.score}/100`);
          console.log(`   Predicted: ${slot.metrics.predictedEngagement} engagement, $${slot.metrics.predictedRevenue} revenue`);
          console.log(`   Confidence: ${Math.round(slot.confidence * 100)}%`);
        });
      });
    }

    // Generate recommendations
    setTimeout(() => {
      this.generateRecommendations().then(recs => {
        console.log('\n--- Recommendations ---');
        recs.forEach((rec, idx) => {
          console.log(`\n${idx + 1}. ${rec.type.toUpperCase()} (${rec.priority})`);
          console.log(`   ${rec.reasoning}`);
          console.log(`   Expected impact: ${rec.expectedImpact.improvement}% improvement in ${rec.expectedImpact.metric}`);
        });
      });
    }, 1000);

    // Create optimized schedule
    setTimeout(() => {
      this.createOptimizedSchedule('medium', ['engagement', 'revenue'], {
        maxPostsPerDay: 2,
        minHoursBetweenPosts: 4,
        allowedHours: { start: 8, end: 20 },
      }).then(opt => {
        console.log('\n--- Optimized Schedule for Medium ---');
        console.log(`Objectives: ${opt.objectives.join(', ')}`);
        console.log(`Slots: ${opt.optimizedSlots.length}`);
        console.log(`Expected engagement increase: ${opt.expectedResults.engagementIncrease}%`);
        console.log(`Expected revenue increase: ${opt.expectedResults.revenueIncrease}%`);

        console.log('\nSchedule:');
        opt.optimizedSlots.forEach(slot => {
          console.log(`  ${this.formatDayHour(slot.dayOfWeek, slot.hour)} - Score: ${slot.score}`);
        });
      });
    }, 1500);

    // Performance summary
    setTimeout(() => {
      const summary = this.getPerformanceSummary();
      console.log('\n--- Performance Summary ---');
      console.log(`Total posts: ${summary.totalPosts}`);
      console.log('\nBy Platform:');
      for (const [platform, data] of Object.entries(summary.platforms)) {
        console.log(`  ${platform}: ${data.posts} posts, avg ${data.avgEngagement} engagement, $${data.avgRevenue} revenue`);
        console.log(`    Best time: ${this.formatDayHour(data.bestTime.day, data.bestTime.hour)}`);
      }
      console.log(`\nTrends: ${summary.improvements.engagementTrend > 0 ? '+' : ''}${summary.improvements.engagementTrend}% engagement, ${summary.improvements.revenueTrend > 0 ? '+' : ''}${summary.improvements.revenueTrend}% revenue`);
    }, 2000);
  }
}

export const smartSchedulerService = SmartSchedulerService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).smartSchedulerService = smartSchedulerService;
}
