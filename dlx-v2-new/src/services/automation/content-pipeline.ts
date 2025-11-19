/**
 * Content Automation Pipeline
 * AI-powered content generation and distribution
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAIStore } from '../ai/ai-router';
import { useRevenueStore } from '../revenue/revenue-engine';
import { logger } from '../foundation/logger';
import { toast } from '../../components/ui/Toast';

export type ContentType = 'blog-post' | 'social-media' | 'email' | 'product-description' | 'ad-copy';
export type ContentStatus = 'generating' | 'reviewing' | 'published' | 'failed';

export interface ContentPiece {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  status: ContentStatus;
  createdAt: Date;
  publishedAt?: Date;
  platform?: string;
  metadata?: {
    keywords?: string[];
    targetAudience?: string;
    tone?: string;
    wordCount?: number;
  };
  revenue?: number; // cents earned from this content
}

export interface ContentPipelineState {
  content: ContentPiece[];
  isGenerating: boolean;
  settings: {
    enabled: boolean;
    autoPublish: boolean;
    defaultType: ContentType;
    schedule?: string; // cron expression
  };

  // Actions
  generateContent: (type: ContentType, prompt: string, metadata?: any) => Promise<string>;
  publishContent: (id: string, platform: string) => Promise<void>;
  deleteContent: (id: string) => void;
  updateSettings: (settings: Partial<ContentPipelineState['settings']>) => void;
  trackRevenue: (contentId: string, amount: number) => void;
}

export const useContentPipeline = create<ContentPipelineState>()(
  persist(
    (set, get) => ({
      content: [],
      isGenerating: false,
      settings: {
        enabled: false,
        autoPublish: false,
        defaultType: 'blog-post',
      },

      generateContent: async (type, prompt, metadata = {}) => {
        const { generate, activeProvider } = useAIStore.getState();

        if (!activeProvider) {
          throw new Error('No AI provider configured');
        }

        set({ isGenerating: true });
        logger.info('📝 Generating content', { type, prompt });

        try {
          // Build content generation prompt
          const systemPrompt = getContentPrompt(type, metadata);
          const fullPrompt = `${systemPrompt}\n\nUser request: ${prompt}`;

          const content = await generate([
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: fullPrompt,
              timestamp: new Date(),
            }
          ], { temperature: 0.8, maxTokens: 2048 });

          // Create content piece
          const piece: ContentPiece = {
            id: crypto.randomUUID(),
            type,
            title: prompt.slice(0, 60),
            content,
            status: 'reviewing',
            createdAt: new Date(),
            metadata: {
              ...metadata,
              wordCount: content.split(/\s+/).length,
            },
          };

          set(state => ({
            content: [piece, ...state.content],
          }));

          logger.info('✅ Content generated', { id: piece.id, words: piece.metadata?.wordCount });
          toast.success('Content generated!', { description: `${piece.metadata?.wordCount} words` });

          // Auto-publish if enabled
          if (get().settings.autoPublish) {
            await get().publishContent(piece.id, metadata.platform || 'manual');
          }

          return piece.id;
        } catch (error) {
          logger.error('Content generation failed', { error });
          toast.error('Generation failed', { description: String(error) });
          throw error;
        } finally {
          set({ isGenerating: false });
        }
      },

      publishContent: async (id, platform) => {
        const piece = get().content.find(c => c.id === id);

        if (!piece) {
          throw new Error('Content not found');
        }

        logger.info('🚀 Publishing content', { id, platform });

        // Update status
        set(state => ({
          content: state.content.map(c =>
            c.id === id
              ? { ...c, status: 'published' as ContentStatus, publishedAt: new Date(), platform }
              : c
          ),
        }));

        toast.success('Content published!', { description: `Published to ${platform}` });

        // In a real app, this would integrate with publishing APIs
        // For now, just log it
        logger.info('Content ready for publishing', {
          id,
          platform,
          title: piece.title,
          words: piece.metadata?.wordCount,
        });
      },

      deleteContent: (id) => {
        set(state => ({
          content: state.content.filter(c => c.id !== id),
        }));
        toast.info('Content deleted');
      },

      updateSettings: (newSettings) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings },
        }));
        logger.info('Content pipeline settings updated', newSettings);
      },

      trackRevenue: (contentId, amount) => {
        const { addStream } = useRevenueStore.getState();

        set(state => ({
          content: state.content.map(c =>
            c.id === contentId
              ? { ...c, revenue: (c.revenue || 0) + amount }
              : c
          ),
        }));

        // Add to revenue tracking
        addStream({
          source: 'content',
          name: `Content revenue: ${contentId.slice(0, 8)}`,
          amount,
          currency: 'USD',
          timestamp: new Date(),
          metadata: { contentId },
        });

        logger.info('Content revenue tracked', { contentId, amount });
      },
    }),
    {
      name: 'dlx-content-pipeline',
      version: 1,
    }
  )
);

// Content generation prompts by type
function getContentPrompt(type: ContentType, metadata: any): string {
  const baseInstructions = `You are a professional content writer. Generate high-quality, engaging content.`;

  const prompts: Record<ContentType, string> = {
    'blog-post': `${baseInstructions}

Write a comprehensive blog post that is:
- SEO-optimized with natural keyword usage
- Well-structured with clear headings
- Engaging and valuable to readers
- 800-1500 words
- Includes introduction, main points, and conclusion

${metadata.keywords ? `Keywords to include: ${metadata.keywords.join(', ')}` : ''}
${metadata.tone ? `Tone: ${metadata.tone}` : 'Tone: Professional but approachable'}`,

    'social-media': `${baseInstructions}

Create social media content that is:
- Attention-grabbing and shareable
- Concise (under 280 characters for Twitter, or appropriate for platform)
- Includes relevant hashtags
- Has a clear call-to-action
- Optimized for engagement

${metadata.platform ? `Platform: ${metadata.platform}` : ''}`,

    'email': `${baseInstructions}

Write an email that is:
- Personalized and conversational
- Has a compelling subject line
- Clear value proposition
- Strong call-to-action
- Mobile-friendly formatting

${metadata.targetAudience ? `Target audience: ${metadata.targetAudience}` : ''}`,

    'product-description': `${baseInstructions}

Write a product description that is:
- Benefit-focused (not just features)
- Compelling and persuasive
- SEO-optimized
- Scannable with bullet points
- Addresses customer pain points

Include: Benefits, features, use cases, specifications`,

    'ad-copy': `${baseInstructions}

Create ad copy that is:
- Attention-grabbing headline
- Clear value proposition
- Urgency or FOMO elements
- Strong call-to-action
- Optimized for conversions

${metadata.platform ? `Ad platform: ${metadata.platform}` : ''}`,
  };

  return prompts[type] || baseInstructions;
}
