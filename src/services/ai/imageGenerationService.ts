/**
 * imageGenerationService.ts
 * AI image generation service (Stable Diffusion / DALL-E demo mode).
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface ImagePrompt {
  prompt: string;
  style?: 'photorealistic' | 'artistic' | 'anime' | '3d' | 'oil-painting' | 'sketch';
  size?: '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  model?: 'stable-diffusion' | 'dall-e-3' | 'midjourney';
  negativePrompt?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  size: string;
  model: string;
  createdAt: Date;
  cost: number;
}

class ImageGenerationService {
  private history: GeneratedImage[] = [];
  private costs = {
    'stable-diffusion': 0.02,
    'dall-e-3': 0.04,
    'midjourney': 0.08,
  };

  async generate(options: ImagePrompt): Promise<GeneratedImage> {
    const {
      prompt,
      style = 'photorealistic',
      size = '1024x1024',
      model = 'stable-diffusion',
      negativePrompt,
    } = options;

    logger.info('Generating image', { prompt, style, model });

    // Demo mode: simulate API call
    await this.simulateGeneration();

    const image: GeneratedImage = {
      id: crypto.randomUUID(),
      url: `https://demo.dlxstudios.com/images/${crypto.randomUUID()}.png`,
      prompt,
      style,
      size,
      model,
      createdAt: new Date(),
      cost: this.costs[model],
    };

    this.history.push(image);

    activityService.logActivity({
      type: 'image_generated',
      message: `Generated image: ${prompt.substring(0, 50)}...`,
      metadata: { model, style, size },
    });

    return image;
  }

  async generateBatch(prompts: ImagePrompt[]): Promise<GeneratedImage[]> {
    const results: GeneratedImage[] = [];

    for (const prompt of prompts) {
      const image = await this.generate(prompt);
      results.push(image);
    }

    logger.info('Batch generation complete', { count: results.length });
    return results;
  }

  private async simulateGeneration(): Promise<void> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getHistory(limit: number = 20): GeneratedImage[] {
    return this.history.slice(-limit).reverse();
  }

  getTotalCost(): number {
    return this.history.reduce((sum, img) => sum + img.cost, 0);
  }

  getPopularStyles(): { style: string; count: number }[] {
    const styleCounts = new Map<string, number>();

    this.history.forEach(img => {
      styleCounts.set(img.style, (styleCounts.get(img.style) || 0) + 1);
    });

    return Array.from(styleCounts.entries())
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => b.count - a.count);
  }

  optimizePrompt(prompt: string): string {
    // Simple prompt optimization
    const enhancements = [
      'highly detailed',
      'professional',
      '8k resolution',
      'trending on artstation',
    ];

    const optimized = `${prompt}, ${enhancements.join(', ')}`;
    return optimized;
  }

  async quickTest() {
    const image1 = await this.generate({
      prompt: 'A futuristic workspace with AI automation',
      style: 'photorealistic',
      size: '1024x1024',
      model: 'stable-diffusion',
    });

    const image2 = await this.generate({
      prompt: 'Abstract representation of passive income streams',
      style: 'artistic',
      size: '1024x1024',
      model: 'dall-e-3',
    });

    return {
      images: [image1, image2],
      history: this.getHistory(),
      totalCost: this.getTotalCost(),
      popularStyles: this.getPopularStyles(),
    };
  }
}

export const imageGenerationService = new ImageGenerationService();
if (typeof window !== 'undefined') (window as any).testImageGeneration = () => imageGenerationService.quickTest();
