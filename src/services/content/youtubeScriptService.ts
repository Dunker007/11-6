/**
 * youtubeScriptService.ts
 *
 * FAST BUILD: YouTube script generator for passive income automation.
 * Generates engaging video scripts optimized for YouTube algorithm.
 *
 * FEATURES:
 * ✅ Hook + intro + body + CTA structure
 * ✅ Timestamp generation
 * ✅ Keyword optimization for SEO
 * ✅ Demo mode fallback
 * ✅ Multiple video styles (tutorial, review, vlog)
 */

import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface VideoStyle {
  id: string;
  name: string;
  description: string;
  template: string;
}

export interface ScriptSection {
  timestamp: string;
  title: string;
  content: string;
  notes?: string;
}

export interface YouTubeScript {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration: number; // seconds
  style: string;
  sections: ScriptSection[];
  fullScript: string;
  generatedAt: Date;
  metadata: {
    wordCount: number;
    estimatedViewTime: string;
    keywordDensity: number;
  };
}

export interface ScriptGenerationOptions {
  topic: string;
  style: 'tutorial' | 'review' | 'vlog' | 'educational';
  duration: number; // target duration in minutes
  keywords?: string[];
  targetAudience?: string;
}

class YouTubeScriptService {
  private styles: Map<string, VideoStyle> = new Map();
  private generatedScripts: YouTubeScript[] = [];

  constructor() {
    this.initializeStyles();
  }

  private initializeStyles() {
    const styles: VideoStyle[] = [
      {
        id: 'tutorial',
        name: 'Tutorial',
        description: 'Step-by-step instructional content',
        template: `Create a YouTube tutorial script about {topic}.

Structure:
- HOOK (0:00-0:15): Grab attention with the problem/benefit
- INTRO (0:15-0:45): Introduce yourself and preview what viewers will learn
- BODY: Step-by-step instructions with clear explanations
- CONCLUSION: Recap + call to action (like, subscribe, comment)

Duration: {duration} minutes
Keywords: {keywords}
Target audience: {audience}`
      },
      {
        id: 'review',
        name: 'Product Review',
        description: 'Honest product review and recommendation',
        template: `Create a YouTube product review script for {topic}.

Structure:
- HOOK (0:00-0:20): Bold statement about the product
- OVERVIEW (0:20-1:00): What is it and who is it for?
- FEATURES (1:00-4:00): Detailed walkthrough of key features
- PROS & CONS (4:00-5:00): Honest assessment
- VERDICT (5:00-end): Final recommendation and CTA

Duration: {duration} minutes
Keywords: {keywords}`
      },
      {
        id: 'vlog',
        name: 'Vlog Style',
        description: 'Casual, personality-driven content',
        template: `Create a vlog-style YouTube script about {topic}.

Style: Conversational, authentic, personal
Structure:
- COLD OPEN (0:00-0:30): Jump right into the most exciting moment
- INTRO (0:30-1:00): Explain what this video is about
- STORY (1:00-end): Tell the story naturally with your personality
- OUTRO: Thank viewers, CTA, tease next video

Duration: {duration} minutes`
      },
      {
        id: 'educational',
        name: 'Educational',
        description: 'In-depth educational content',
        template: `Create an educational YouTube script about {topic}.

Structure:
- HOOK (0:00-0:20): Why this topic matters
- CONTEXT (0:20-1:30): Background and foundation
- MAIN CONTENT (1:30-end): Deep dive with examples
- KEY TAKEAWAYS: Summarize main points
- NEXT STEPS: What viewers should do next

Duration: {duration} minutes
Keywords: {keywords}
Audience: {audience}`
      }
    ];

    styles.forEach(style => this.styles.set(style.id, style));
  }

  /**
   * Generate a YouTube script
   */
  async generateScript(options: ScriptGenerationOptions): Promise<YouTubeScript> {
    logger.info('Generating YouTube script', { topic: options.topic, style: options.style });

    try {
      const style = this.styles.get(options.style);
      if (!style) {
        throw new Error(`Unknown style: ${options.style}`);
      }

      // Build prompt
      let prompt = style.template
        .replace(/\{topic\}/g, options.topic)
        .replace(/\{duration\}/g, options.duration.toString())
        .replace(/\{keywords\}/g, options.keywords?.join(', ') || 'none specified')
        .replace(/\{audience\}/g, options.targetAudience || 'general audience');

      prompt += `\n\nIMPORTANT: Include timestamps in the format [MM:SS] for each section.`;

      // Generate with LLM
      let scriptText: string;
      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.8,
          maxTokens: 2048,
        });
        scriptText = response.text;
      } catch (llmError) {
        // DEMO MODE FALLBACK
        logger.warn('LLM unavailable, using demo script', { error: llmError });
        scriptText = this.generateDemoScript(options);
      }

      // Parse sections with timestamps
      const sections = this.parseScriptSections(scriptText);

      // Extract title from first line
      const lines = scriptText.split('\n');
      const title = lines[0].replace(/^#\s*/, '').trim() || `${options.topic} - YouTube Video`;

      // Generate metadata
      const wordCount = scriptText.split(/\s+/).length;
      const estimatedViewTime = this.calculateViewTime(wordCount);
      const keywordDensity = this.calculateKeywordDensity(scriptText, options.keywords || []);

      const script: YouTubeScript = {
        id: crypto.randomUUID(),
        title,
        description: `Video script about ${options.topic}`,
        tags: options.keywords || [],
        duration: options.duration * 60,
        style: options.style,
        sections,
        fullScript: scriptText,
        generatedAt: new Date(),
        metadata: {
          wordCount,
          estimatedViewTime,
          keywordDensity,
        },
      };

      this.generatedScripts.push(script);

      // Log activity
      activityService.addActivity({
        type: 'ai',
        action: 'YouTube Script Generated',
        description: `Generated ${options.style} script: ${title}`,
        metadata: {
          style: options.style,
          duration: options.duration,
          wordCount,
        },
      });

      logger.info('YouTube script generated successfully', {
        title,
        wordCount,
        sections: sections.length,
      });

      return script;
    } catch (error) {
      logger.error('YouTube script generation failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Generate demo script for testing
   */
  private generateDemoScript(options: ScriptGenerationOptions): string {
    return `# ${options.topic} - Complete Guide

[00:00] **HOOK**
Hey everyone! Today I'm sharing something that's going to completely change how you think about ${options.topic}. Stick around because by the end of this video, you'll have everything you need to get started.

[00:15] **INTRO**
Welcome back to the channel! If you're new here, I'm all about helping you ${options.topic.toLowerCase()} effectively. Don't forget to hit that subscribe button and ring the bell so you never miss an upload.

[00:45] **MAIN CONTENT**
Let's dive right in. ${options.topic} is incredibly important in today's world, and here's why...

First, let me show you the fundamentals. [Explain key concept 1]

Next, we have an amazing technique that most people overlook. [Explain key concept 2]

And finally, here's the game-changer. [Explain key concept 3]

[0${Math.floor(options.duration - 1)}:00] **CONCLUSION**
So there you have it! Everything you need to know about ${options.topic}. If you found this helpful, smash that like button and drop a comment below telling me what you want to see next.

Don't forget to subscribe and click the bell icon. I'll see you in the next video!

---
Generated by DLX Studios YouTube Script Generator 🎬`;
  }

  /**
   * Parse script into sections with timestamps
   */
  private parseScriptSections(script: string): ScriptSection[] {
    const sections: ScriptSection[] = [];
    const lines = script.split('\n');
    let currentSection: ScriptSection | null = null;

    for (const line of lines) {
      const timestampMatch = line.match(/\[(\d{1,2}:\d{2})\]/);

      if (timestampMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }

        const title = line.replace(/\[.*?\]/, '').replace(/\*\*/g, '').trim();
        currentSection = {
          timestamp: timestampMatch[1],
          title: title || 'Section',
          content: '',
        };
      } else if (currentSection && line.trim()) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Calculate estimated view time (assumes 150 words per minute speaking rate)
   */
  private calculateViewTime(wordCount: number): string {
    const minutes = Math.ceil(wordCount / 150);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Calculate keyword density
   */
  private calculateKeywordDensity(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 0;

    const lowerText = text.toLowerCase();
    const totalWords = text.split(/\s+/).length;
    let keywordCount = 0;

    keywords.forEach(keyword => {
      const matches = lowerText.match(new RegExp(keyword.toLowerCase(), 'g'));
      keywordCount += matches ? matches.length : 0;
    });

    return Math.round((keywordCount / totalWords) * 100 * 100) / 100; // percentage with 2 decimals
  }

  /**
   * Get all generated scripts
   */
  getGeneratedScripts(): YouTubeScript[] {
    return [...this.generatedScripts];
  }

  /**
   * Get scripts by style
   */
  getScriptsByStyle(style: string): YouTubeScript[] {
    return this.generatedScripts.filter(s => s.style === style);
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<YouTubeScript> {
    return await this.generateScript({
      topic: 'Building Passive Income with AI Automation',
      style: 'tutorial',
      duration: 10,
      keywords: ['passive income', 'AI automation', 'make money online'],
      targetAudience: 'entrepreneurs and developers',
    });
  }
}

// Export singleton
export const youtubeScriptService = new YouTubeScriptService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testYouTubeScript = () => youtubeScriptService.quickTest();
}
