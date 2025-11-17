/**
 * linkedInArticleService.ts
 *
 * LinkedIn article automation for professional thought leadership.
 * Generate engaging, professional articles optimized for LinkedIn's algorithm.
 *
 * FEATURES:
 * ✅ Thought leadership articles
 * ✅ Industry insights & trends
 * ✅ Personal story integration
 * ✅ Data-driven content
 * ✅ Professional formatting
 * ✅ Engagement hooks
 * ✅ Call-to-action optimization
 * ✅ Hashtag strategy
 * ✅ Preview image suggestions
 * ✅ Publishing schedule optimization
 */

import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type ArticleType = 'thought-leadership' | 'how-to' | 'industry-trend' | 'personal-story' | 'case-study' | 'opinion';

export interface ArticleSection {
  type: 'intro' | 'body' | 'data' | 'story' | 'conclusion' | 'cta';
  heading?: string;
  content: string;
  formatting?: 'bold' | 'italic' | 'quote' | 'bullet' | 'numbered';
}

export interface LinkedInArticle {
  id: string;
  title: string;
  subtitle?: string;
  articleType: ArticleType;
  sections: ArticleSection[];
  fullText: string;
  openingHook: string;
  hashtags: string[];
  suggestedImage?: string;
  readingTime: number; // minutes
  engagementScore: number; // 0-100
  publishTime?: Date;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  generatedAt: Date;
  metadata: {
    wordCount: number;
    paragraphCount: number;
    dataPoints: number;
    callsToAction: number;
  };
}

export interface GenerateArticleOptions {
  topic: string;
  articleType: ArticleType;
  targetLength: number; // words (1000-2000 recommended)
  includePersonalStory?: boolean;
  includeData?: boolean;
  includeCallToAction?: boolean;
  tone?: 'professional' | 'inspiring' | 'analytical' | 'conversational';
  targetAudience?: string;
}

class LinkedInArticleService {
  private articles: LinkedInArticle[] = [];

  /**
   * Generate LinkedIn article
   */
  async generateArticle(options: GenerateArticleOptions): Promise<LinkedInArticle> {
    logger.info('Generating LinkedIn article', {
      topic: options.topic,
      type: options.articleType,
      length: options.targetLength,
    });

    try {
      const prompt = this.buildPrompt(options);

      // Generate article with LLM
      let articleText: string;
      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.7,
          maxTokens: Math.min(2048, Math.floor(options.targetLength * 1.5)),
        });
        articleText = response.text;
      } catch (llmError) {
        // DEMO MODE FALLBACK
        logger.warn('LLM unavailable, using demo LinkedIn article', { error: llmError });
        articleText = this.generateDemoArticle(options);
      }

      // Parse sections
      const sections = this.parseSections(articleText);

      // Generate title
      const title = this.extractTitle(articleText) || this.generateTitle(options.topic, options.articleType);

      // Extract opening hook
      const openingHook = sections[0]?.content.split('\n')[0] || this.generateHook(options.topic);

      // Generate hashtags
      const hashtags = this.generateHashtags(options.topic, options.articleType);

      // Calculate metrics
      const wordCount = articleText.split(/\s+/).length;
      const paragraphCount = articleText.split('\n\n').filter(p => p.trim()).length;
      const dataPoints = this.countDataPoints(articleText);
      const callsToAction = this.countCTAs(articleText);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(
        openingHook,
        sections,
        wordCount,
        dataPoints,
      );

      const article: LinkedInArticle = {
        id: crypto.randomUUID(),
        title,
        subtitle: this.generateSubtitle(options.topic),
        articleType: options.articleType,
        sections,
        fullText: articleText,
        openingHook,
        hashtags,
        suggestedImage: this.suggestImage(options.articleType),
        readingTime: Math.ceil(wordCount / 200), // ~200 words per minute
        engagementScore,
        publishTime: this.suggestPublishTime(),
        generatedAt: new Date(),
        metadata: {
          wordCount,
          paragraphCount,
          dataPoints,
          callsToAction,
        },
      };

      this.articles.push(article);

      activityService.addActivity({
        type: 'ai',
        action: 'LinkedIn Article Generated',
        description: `Generated ${options.articleType} article: ${title}`,
        metadata: {
          type: options.articleType,
          wordCount,
          engagementScore,
        },
      });

      logger.info('LinkedIn article generated', {
        id: article.id,
        title: article.title,
        wordCount,
        engagementScore,
      });

      return article;
    } catch (error) {
      logger.error('LinkedIn article generation failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Build LLM prompt
   */
  private buildPrompt(options: GenerateArticleOptions): string {
    const tone = options.tone || 'professional';

    const basePrompt = `Write a professional LinkedIn article about "${options.topic}".

Article Type: ${options.articleType}
Target Length: ${options.targetLength} words
Tone: ${tone}
Audience: ${options.targetAudience || 'professionals in the industry'}

Structure:
1. Engaging opening hook (question, stat, or bold statement)
2. Personal connection or story (if relevant)
3. Main insights with supporting evidence
4. Practical takeaways
5. Strong conclusion with call-to-action

Requirements:
- Professional yet engaging tone
- Use short paragraphs (2-3 sentences max)
- Include bullet points or numbered lists
- Add 1-2 relevant statistics or data points
- Make it scannable with clear headings
- End with thought-provoking question or CTA
`;

    const typeSpecific: Record<ArticleType, string> = {
      'thought-leadership': `
Focus: Unique perspective on industry trends
- Share original insights
- Challenge conventional wisdom
- Provide visionary outlook
- Establish credibility with expertise`,

      'how-to': `
Focus: Actionable step-by-step guidance
- Clear, numbered steps
- Practical examples
- Common pitfalls to avoid
- Tools and resources`,

      'industry-trend': `
Focus: Analysis of current trends
- Data-backed observations
- Future predictions
- Impact on professionals
- How to adapt`,

      'personal-story': `
Focus: Authentic personal experience
- Vulnerable opening
- Lesson learned
- Transformation arc
- Universal takeaway`,

      'case-study': `
Focus: Real-world example and results
- Context and challenge
- Solution approach
- Results with metrics
- Key learnings`,

      opinion: `
Focus: Well-reasoned perspective
- Clear thesis statement
- Supporting arguments
- Address counterpoints
- Compelling conclusion`,
    };

    return basePrompt + typeSpecific[options.articleType];
  }

  /**
   * Generate demo article
   */
  private generateDemoArticle(options: GenerateArticleOptions): string {
    return `# ${this.generateTitle(options.topic, options.articleType)}

## ${this.generateSubtitle(options.topic)}

${this.generateHook(options.topic)}

Here's what I've learned after years in ${options.topic}...

**The Landscape is Changing**

The way we approach ${options.topic} has fundamentally shifted. What worked five years ago doesn't cut it anymore. Here's why:

• Technology is evolving faster than ever
• Customer expectations are at an all-time high
• Competition is global, not local

**My Personal Journey**

${options.includePersonalStory ? `I remember when I first encountered ${options.topic}. I was skeptical, overwhelmed, and frankly, a bit intimidated.

But that experience taught me something crucial: everyone starts somewhere. The key is to start.` : ''}

**The 3 Game-Changing Insights**

After working with hundreds of professionals, I've identified three critical factors:

1. **Consistency Beats Perfection**
   Don't wait for the perfect moment. Start with what you have and improve as you go.

2. **Data-Driven Decisions**
   ${options.includeData ? 'According to recent studies, companies that use data-driven approaches see 30% better results.' : 'Measure what matters and let the numbers guide you.'}

3. **Community is Everything**
   Surround yourself with people who challenge and inspire you.

**What This Means for You**

The opportunity in ${options.topic} has never been greater. But it requires a shift in mindset:

→ Think long-term, not quick wins
→ Invest in learning and development
→ Take calculated risks

**The Path Forward**

Here's my challenge to you: pick ONE thing from this article and implement it this week.

Not next month. Not "when you have time." This week.

Because knowledge without action is just entertainment.

${options.includeCallToAction ? `**What's your biggest challenge with ${options.topic}? Drop a comment below and let's discuss.**` : ''}

---

💡 Found this helpful? Repost to help others in your network.

✨ Want more insights? Follow me for weekly thought leadership on ${options.topic}.

#${options.topic.replace(/\s+/g, '')} #Leadership #ProfessionalDevelopment

---
Generated by DLX Studios LinkedIn Article Automation 💼`;
  }

  /**
   * Parse article into sections
   */
  private parseSections(text: string): ArticleSection[] {
    const sections: ArticleSection[] = [];
    const parts = text.split('\n\n');

    let currentSection: ArticleSection | null = null;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Detect section type
      if (trimmed.startsWith('##')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'body',
          heading: trimmed.replace(/^##\s*/, ''),
          content: '',
        };
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          type: 'body',
          heading: trimmed.replace(/\*\*/g, ''),
          content: '',
        };
      } else if (trimmed.match(/^\d+\.|^•|^→/)) {
        if (!currentSection) {
          currentSection = { type: 'body', content: '' };
        }
        currentSection.content += trimmed + '\n';
        currentSection.formatting = 'bullet';
      } else {
        if (!currentSection) {
          currentSection = { type: sections.length === 0 ? 'intro' : 'body', content: '' };
        }
        currentSection.content += trimmed + '\n';
      }
    }

    if (currentSection) sections.push(currentSection);

    // Mark last section as conclusion if it contains CTA
    if (sections.length > 0) {
      const last = sections[sections.length - 1];
      if (last.content.toLowerCase().includes('challenge') ||
          last.content.toLowerCase().includes('comment') ||
          last.content.includes('?')) {
        last.type = 'cta';
      }
    }

    return sections;
  }

  /**
   * Extract title from article
   */
  private extractTitle(text: string): string | null {
    const match = text.match(/^#\s+(.+)$/m);
    return match ? match[1] : null;
  }

  /**
   * Generate title
   */
  private generateTitle(topic: string, type: ArticleType): string {
    const templates: Record<ArticleType, string[]> = {
      'thought-leadership': [
        `The Future of ${topic}: What Leaders Need to Know`,
        `${topic}: A New Perspective`,
        `Why ${topic} Matters More Than Ever`,
      ],
      'how-to': [
        `How to Master ${topic} in 2024`,
        `The Ultimate Guide to ${topic}`,
        `${topic}: A Step-by-Step Approach`,
      ],
      'industry-trend': [
        `5 ${topic} Trends Shaping the Future`,
        `The State of ${topic} in 2024`,
        `What's Next for ${topic}?`,
      ],
      'personal-story': [
        `My ${topic} Journey: Lessons Learned`,
        `How ${topic} Changed My Career`,
        `The Truth About ${topic} Nobody Tells You`,
      ],
      'case-study': [
        `How We Achieved Success with ${topic}`,
        `${topic} Case Study: Real Results`,
        `From Zero to Hero: Our ${topic} Story`,
      ],
      opinion: [
        `Why I Believe ${topic} is Overrated`,
        `The Uncomfortable Truth About ${topic}`,
        `Here's What's Wrong with ${topic}`,
      ],
    };

    const options = templates[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate subtitle
   */
  private generateSubtitle(topic: string): string {
    return `Insights and strategies for ${topic} success`;
  }

  /**
   * Generate opening hook
   */
  private generateHook(topic: string): string {
    const hooks = [
      `Here's the uncomfortable truth about ${topic} that nobody wants to admit...`,
      `I spent 5 years studying ${topic}. Here's what I learned.`,
      `${topic} is broken. Here's how to fix it.`,
      `The ${topic} playbook has changed. Are you keeping up?`,
      `Everyone's talking about ${topic}. Here's what they're missing.`,
    ];

    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(topic: string, type: ArticleType): string[] {
    const topicWords = topic.split(' ').filter(w => w.length > 3);
    const topicTags = topicWords.map(w => `#${w}`);

    const typeTags: Record<ArticleType, string[]> = {
      'thought-leadership': ['#Leadership', '#Innovation', '#FutureOfWork'],
      'how-to': ['#HowTo', '#Tips', '#Learning'],
      'industry-trend': ['#Trends', '#Industry', '#Insights'],
      'personal-story': ['#Story', '#Journey', '#Lessons'],
      'case-study': ['#CaseStudy', '#Results', '#Success'],
      opinion: ['#Opinion', '#Perspective', '#ThoughtLeadership'],
    };

    return [
      ...topicTags,
      ...typeTags[type],
      '#ProfessionalDevelopment',
      '#Career',
    ].slice(0, 8);
  }

  /**
   * Suggest cover image theme
   */
  private suggestImage(type: ArticleType): string {
    const suggestions: Record<ArticleType, string> = {
      'thought-leadership': 'Professional headshot with inspirational quote overlay',
      'how-to': 'Infographic-style diagram or step visualization',
      'industry-trend': 'Data visualization or graph',
      'personal-story': 'Authentic behind-the-scenes photo',
      'case-study': 'Before/after comparison or results chart',
      opinion: 'Bold text statement on solid background',
    };

    return suggestions[type];
  }

  /**
   * Suggest optimal publish time
   */
  private suggestPublishTime(): Date {
    // LinkedIn optimal times: Tue-Thu, 7-9 AM or 12-2 PM
    const now = new Date();
    const dayOfWeek = now.getDay();

    // If it's Friday-Monday, suggest next Tuesday
    let daysToAdd = 0;
    if (dayOfWeek >= 5 || dayOfWeek === 0) {
      daysToAdd = (9 - dayOfWeek) % 7; // Next Tuesday
    } else if (dayOfWeek < 2) {
      daysToAdd = 2 - dayOfWeek; // This Tuesday
    }

    const publishDate = new Date(now);
    publishDate.setDate(publishDate.getDate() + daysToAdd);
    publishDate.setHours(8, 0, 0, 0); // 8 AM

    return publishDate;
  }

  /**
   * Count data points in article
   */
  private countDataPoints(text: string): number {
    const patterns = [
      /\d+%/, // Percentages
      /\d+x/, // Multipliers
      /\$\d+/, // Dollar amounts
      /\d+\+/, // Plus numbers
    ];

    return patterns.reduce((count, pattern) => {
      const matches = text.match(new RegExp(pattern, 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);
  }

  /**
   * Count CTAs
   */
  private countCTAs(text: string): number {
    const ctaKeywords = ['comment', 'share', 'follow', 'connect', 'let me know', 'tell me'];
    return ctaKeywords.filter(keyword =>
      text.toLowerCase().includes(keyword)
    ).length;
  }

  /**
   * Calculate engagement score
   */
  private calculateEngagementScore(
    hook: string,
    sections: ArticleSection[],
    wordCount: number,
    dataPoints: number,
  ): number {
    let score = 50;

    // Strong hook
    if (hook.includes('?')) score += 10;
    if (hook.length < 100 && hook.length > 20) score += 10;

    // Good structure
    if (sections.length >= 4 && sections.length <= 8) score += 15;

    // Optimal length
    if (wordCount >= 1000 && wordCount <= 2000) score += 10;

    // Data-driven
    if (dataPoints > 0) score += 10;

    // Has CTA
    if (sections.some(s => s.type === 'cta')) score += 5;

    return Math.min(100, score);
  }

  /**
   * Get all articles
   */
  getArticles(): LinkedInArticle[] {
    return [...this.articles];
  }

  /**
   * Export article for LinkedIn
   */
  exportForLinkedIn(articleId: string): string {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) throw new Error('Article not found');

    let output = `${article.title}\n\n`;
    if (article.subtitle) {
      output += `${article.subtitle}\n\n`;
    }

    output += article.fullText;

    output += `\n\n${article.hashtags.join(' ')}`;

    return output;
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<LinkedInArticle> {
    return await this.generateArticle({
      topic: 'AI Automation and Passive Income',
      articleType: 'thought-leadership',
      targetLength: 1200,
      includePersonalStory: true,
      includeData: true,
      includeCallToAction: true,
      tone: 'inspiring',
    });
  }
}

// Export singleton
export const linkedInArticleService = new LinkedInArticleService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testLinkedInArticle = () => linkedInArticleService.quickTest();
  (window as any).linkedInArticleService = linkedInArticleService;
}
