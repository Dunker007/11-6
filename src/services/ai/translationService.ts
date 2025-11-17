/**
 * translationService.ts
 * Multi-language content translation with quality scoring.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface TranslationRequest {
  text: string;
  from: string;
  to: string;
  preserveFormatting?: boolean;
  style?: 'formal' | 'casual' | 'technical';
}

export interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  from: string;
  to: string;
  qualityScore: number;
  confidence: number;
  createdAt: Date;
  cost: number;
  alternatives?: string[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  supported: boolean;
}

class TranslationService {
  private languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', supported: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', supported: true },
    { code: 'fr', name: 'French', nativeName: 'Français', supported: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', supported: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', supported: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', supported: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', supported: true },
    { code: 'ko', name: 'Korean', nativeName: '한국어', supported: true },
    { code: 'zh', name: 'Chinese', nativeName: '中文', supported: true },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', supported: true },
  ];

  private translationHistory: Translation[] = [];
  private costPerCharacter = 0.00002; // DeepL pricing estimate

  async translate(request: TranslationRequest): Promise<Translation> {
    const { text, from, to, preserveFormatting = true, style = 'formal' } = request;

    logger.info('Translating content', { from, to, length: text.length });

    // Demo mode: simulate API call
    await this.simulateTranslation(text.length);

    // Mock translation (in real app, would call DeepL/Google Translate API)
    const translatedText = this.mockTranslate(text, to);

    const translation: Translation = {
      id: crypto.randomUUID(),
      originalText: text,
      translatedText,
      from,
      to,
      qualityScore: Math.random() * 20 + 80, // 80-100
      confidence: Math.random() * 10 + 90, // 90-100
      createdAt: new Date(),
      cost: text.length * this.costPerCharacter,
      alternatives: this.generateAlternatives(translatedText),
    };

    this.translationHistory.push(translation);

    activityService.logActivity({
      type: 'content_translated',
      message: `Translated ${text.length} chars from ${from} to ${to}`,
      metadata: { qualityScore: translation.qualityScore },
    });

    return translation;
  }

  async translateBatch(texts: string[], from: string, to: string): Promise<Translation[]> {
    const results: Translation[] = [];

    for (const text of texts) {
      const translation = await this.translate({ text, from, to });
      results.push(translation);
    }

    logger.info('Batch translation complete', { count: results.length });
    return results;
  }

  async translateBlogPost(post: { title: string; content: string }, targetLanguages: string[]): Promise<Map<string, { title: string; content: string }>> {
    const translations = new Map<string, { title: string; content: string }>();

    for (const lang of targetLanguages) {
      const titleTranslation = await this.translate({ text: post.title, from: 'en', to: lang });
      const contentTranslation = await this.translate({ text: post.content, from: 'en', to: lang });

      translations.set(lang, {
        title: titleTranslation.translatedText,
        content: contentTranslation.translatedText,
      });
    }

    return translations;
  }

  private mockTranslate(text: string, targetLang: string): string {
    // Demo mode: return prefixed text
    const langName = this.languages.find(l => l.code === targetLang)?.name || targetLang;
    return `[${langName}] ${text}`;
  }

  private generateAlternatives(text: string): string[] {
    // Generate 2-3 alternative translations
    return [
      `${text} (alt 1)`,
      `${text} (alt 2)`,
    ];
  }

  private async simulateTranslation(textLength: number): Promise<void> {
    const delay = Math.min(50 + textLength * 0.05, 300);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getLanguages(): Language[] {
    return this.languages.filter(l => l.supported);
  }

  detectLanguage(text: string): string {
    // Simple detection (in real app, would use language detection API)
    return 'en';
  }

  getTranslationHistory(limit: number = 20): Translation[] {
    return this.translationHistory.slice(-limit).reverse();
  }

  getTotalCost(): number {
    return this.translationHistory.reduce((sum, t) => sum + t.cost, 0);
  }

  getPopularLanguagePairs(): { from: string; to: string; count: number }[] {
    const pairs = new Map<string, number>();

    this.translationHistory.forEach(t => {
      const key = `${t.from}-${t.to}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    });

    return Array.from(pairs.entries())
      .map(([pair, count]) => {
        const [from, to] = pair.split('-');
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  estimateCost(text: string): number {
    return text.length * this.costPerCharacter;
  }

  async quickTest() {
    const translation1 = await this.translate({
      text: 'Welcome to DLX Studios, your ultimate passive income platform.',
      from: 'en',
      to: 'es',
    });

    const translation2 = await this.translate({
      text: 'Build, automate, and scale your content empire.',
      from: 'en',
      to: 'fr',
    });

    const blogPost = {
      title: 'Passive Income Strategies',
      content: 'Learn how to build multiple revenue streams with automation.',
    };

    const blogTranslations = await this.translateBlogPost(blogPost, ['es', 'de']);

    return {
      translations: [translation1, translation2],
      blogTranslations,
      supportedLanguages: this.getLanguages(),
      totalCost: this.getTotalCost(),
    };
  }
}

export const translationService = new TranslationService();
if (typeof window !== 'undefined') (window as any).testTranslation = () => translationService.quickTest();
