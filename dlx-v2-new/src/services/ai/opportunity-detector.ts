/**
 * Opportunity Detector
 * AI-powered revenue opportunity discovery
 */

import type { RevenueSource } from '../../types/revenue';
import { useAIStore } from './ai-router';
import { logger } from '../foundation/logger';

export interface RevenueOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedRevenue: number; // cents/month
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  category: 'automation' | 'integration' | 'optimization' | 'new-source';
  sources: RevenueSource[];
  action: {
    label: string;
    handler: () => void;
  };
  aiGenerated: boolean;
  confidence: number; // 0-100
}

export async function detectOpportunities(context: {
  currentRevenue: Record<RevenueSource, number>;
  activeStreams: number;
  hasStripe: boolean;
  hasContentPipeline: boolean;
  hasIdleCompute: boolean;
}): Promise<RevenueOpportunity[]> {
  logger.info('🔍 Detecting revenue opportunities', context);

  const opportunities: RevenueOpportunity[] = [];

  // Static opportunities based on current setup
  const staticOps = getStaticOpportunities(context);
  opportunities.push(...staticOps);

  // AI-generated opportunities (if AI is available)
  try {
    const aiOps = await generateAIOpportunities(context);
    opportunities.push(...aiOps);
  } catch (error) {
    logger.warn('AI opportunity generation failed', { error });
  }

  return opportunities.sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
}

function getStaticOpportunities(context: {
  currentRevenue: Record<RevenueSource, number>;
  activeStreams: number;
  hasStripe: boolean;
  hasContentPipeline: boolean;
  hasIdleCompute: boolean;
}): RevenueOpportunity[] {
  const opportunities: RevenueOpportunity[] = [];

  // Stripe integration
  if (!context.hasStripe) {
    opportunities.push({
      id: 'opp-stripe',
      title: 'Connect Stripe',
      description: 'Accept payments and automatically track revenue from Stripe transactions',
      estimatedRevenue: 50000, // $500/month estimate
      difficulty: 'easy',
      timeToImplement: '10 minutes',
      category: 'integration',
      sources: ['stripe'],
      action: {
        label: 'Connect Stripe',
        handler: () => {
          window.open('https://stripe.com/connect', '_blank');
        },
      },
      aiGenerated: false,
      confidence: 95,
    });
  }

  // Content automation
  if (!context.hasContentPipeline) {
    opportunities.push({
      id: 'opp-content',
      title: 'Automate Content Creation',
      description: 'Use AI to generate blog posts, social media content, and marketing materials',
      estimatedRevenue: 30000, // $300/month
      difficulty: 'medium',
      timeToImplement: '1-2 hours',
      category: 'automation',
      sources: ['content', 'affiliate'],
      action: {
        label: 'Setup Content Pipeline',
        handler: () => {
          logger.info('Content pipeline setup initiated');
        },
      },
      aiGenerated: false,
      confidence: 85,
    });
  }

  // Idle compute
  if (!context.hasIdleCompute) {
    opportunities.push({
      id: 'opp-idle-compute',
      title: 'Monetize Idle Compute',
      description: 'Earn passive income by sharing unused CPU/GPU power when your computer is idle',
      estimatedRevenue: 20000, // $200/month
      difficulty: 'easy',
      timeToImplement: '15 minutes',
      category: 'new-source',
      sources: ['idle-compute'],
      action: {
        label: 'Enable Idle Compute',
        handler: () => {
          logger.info('Idle compute setup initiated');
        },
      },
      aiGenerated: false,
      confidence: 80,
    });
  }

  // Optimize existing streams
  if (context.activeStreams > 0) {
    const topSource = Object.entries(context.currentRevenue)
      .sort(([, a], [, b]) => b - a)[0];

    if (topSource && topSource[1] > 1000) {
      opportunities.push({
        id: 'opp-optimize-top',
        title: `Optimize ${topSource[0]} Revenue`,
        description: `Your top source is ${topSource[0]}. AI analysis suggests 30-50% improvement potential through optimization`,
        estimatedRevenue: Math.round(topSource[1] * 0.4), // 40% of current
        difficulty: 'medium',
        timeToImplement: '2-3 hours',
        category: 'optimization',
        sources: [topSource[0] as RevenueSource],
        action: {
          label: 'Analyze Optimization',
          handler: () => {
            logger.info(`Optimizing ${topSource[0]}`);
          },
        },
        aiGenerated: false,
        confidence: 75,
      });
    }
  }

  // Diversification opportunity
  if (context.activeStreams === 1) {
    opportunities.push({
      id: 'opp-diversify',
      title: 'Diversify Revenue Sources',
      description: 'Reduce risk by adding 2-3 additional revenue streams. Recommended: affiliate marketing, digital products',
      estimatedRevenue: 25000, // $250/month
      difficulty: 'medium',
      timeToImplement: '1 week',
      category: 'new-source',
      sources: ['affiliate', 'content', 'ads'],
      action: {
        label: 'Explore Options',
        handler: () => {
          logger.info('Diversification analysis initiated');
        },
      },
      aiGenerated: false,
      confidence: 70,
    });
  }

  return opportunities;
}

async function generateAIOpportunities(context: {
  currentRevenue: Record<RevenueSource, number>;
  activeStreams: number;
}): Promise<RevenueOpportunity[]> {
  const { generate, activeProvider } = useAIStore.getState();

  if (!activeProvider) {
    return [];
  }

  logger.info('🤖 Generating AI opportunities');

  const prompt = `You are a revenue optimization expert. Analyze this revenue data and suggest 1-2 specific, actionable opportunities:

Current Revenue Sources:
${Object.entries(context.currentRevenue)
    .filter(([, amount]) => amount > 0)
    .map(([source, amount]) => `- ${source}: $${(amount / 100).toFixed(2)}/month`)
    .join('\n') || 'None yet'}

Active Streams: ${context.activeStreams}

Generate 1-2 specific opportunities in this EXACT JSON format:
{
  "opportunities": [
    {
      "title": "Specific opportunity title",
      "description": "1-sentence description of what and why",
      "estimatedRevenue": 15000,
      "difficulty": "easy|medium|hard",
      "timeToImplement": "X hours/days/weeks",
      "category": "automation|integration|optimization|new-source",
      "actionLabel": "Button text"
    }
  ]
}

Focus on:
1. Opportunities that complement existing streams
2. Low-effort, high-impact ideas
3. Automation and passive income
4. Realistic revenue estimates (in cents/month)

Return ONLY valid JSON, no markdown.`;

  try {
    const response = await generate([
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: prompt,
        timestamp: new Date(),
      }
    ], { temperature: 0.7, maxTokens: 1000 });

    // Parse AI response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('AI response not JSON');
      return [];
    }

    const data = JSON.parse(jsonMatch[0]);

    const opportunities: RevenueOpportunity[] = data.opportunities.map((opp: any, index: number) => ({
      id: `opp-ai-${Date.now()}-${index}`,
      title: opp.title,
      description: opp.description,
      estimatedRevenue: opp.estimatedRevenue || 10000,
      difficulty: opp.difficulty || 'medium',
      timeToImplement: opp.timeToImplement || '1-2 days',
      category: opp.category || 'new-source',
      sources: [], // AI doesn't specify exact sources
      action: {
        label: opp.actionLabel || 'Learn More',
        handler: () => {
          logger.info(`AI opportunity action: ${opp.title}`);
        },
      },
      aiGenerated: true,
      confidence: 65,
    }));

    logger.info(`✅ Generated ${opportunities.length} AI opportunities`);
    return opportunities;
  } catch (error) {
    logger.error('Failed to generate AI opportunities', { error });
    return [];
  }
}
