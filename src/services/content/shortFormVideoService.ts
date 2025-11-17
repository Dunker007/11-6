/**
 * shortFormVideoService.ts
 *
 * TikTok/YouTube Shorts/Instagram Reels script generator.
 * Create viral short-form video scripts optimized for mobile viewing.
 *
 * FEATURES:
 * ✅ Multiple viral formats (hook, tutorial, story, comedy, facts)
 * ✅ 15-60 second scripts
 * ✅ Visual cue annotations
 * ✅ Text overlay suggestions
 * ✅ Trending sound recommendations
 * ✅ Hashtag optimization
 * ✅ Caption generation
 * ✅ Hook templates (pattern interrupt)
 * ✅ CTA optimization
 * ✅ Batch generation
 */

import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type ShortFormat = 'hook-reveal' | 'tutorial' | 'story' | 'facts' | 'comedy' | 'before-after' | 'trending';

export interface VideoScene {
  timestamp: string; // "0:00-0:03"
  visual: string; // What to show
  audio: string; // What to say
  textOverlay?: string; // On-screen text
  effect?: string; // Transitions, zooms, etc.
}

export interface ShortScript {
  id: string;
  title: string;
  format: ShortFormat;
  duration: number; // seconds
  hook: string; // First 3 seconds
  scenes: VideoScene[];
  caption: string;
  hashtags: string[];
  soundSuggestion?: string;
  cta: string;
  targetPlatforms: ('tiktok' | 'youtube-shorts' | 'instagram-reels')[];
  estimatedViralScore: number; // 0-100
  generatedAt: Date;
  metadata: {
    sceneCount: number;
    wordCount: number;
    hookStrength: number; // 0-100
  };
}

export interface GenerateShortOptions {
  topic: string;
  format: ShortFormat;
  duration: number; // 15, 30, or 60 seconds
  targetPlatform?: 'tiktok' | 'youtube-shorts' | 'instagram-reels' | 'all';
  includeTextOverlays?: boolean;
  tone?: 'energetic' | 'calm' | 'funny' | 'educational' | 'dramatic';
}

class ShortFormVideoService {
  private scripts: ShortScript[] = [];

  /**
   * Generate short-form video script
   */
  async generateScript(options: GenerateShortOptions): Promise<ShortScript> {
    logger.info('Generating short-form video script', {
      topic: options.topic,
      format: options.format,
      duration: options.duration,
    });

    try {
      const prompt = this.buildPrompt(options);

      // Generate script with LLM
      let scriptContent: string;
      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.85, // Higher for creativity
          maxTokens: 512,
        });
        scriptContent = response.text;
      } catch (llmError) {
        // DEMO MODE FALLBACK
        logger.warn('LLM unavailable, using demo short-form script', { error: llmError });
        scriptContent = this.generateDemoScript(options);
      }

      // Parse scenes
      const scenes = this.parseScenes(scriptContent, options.duration);

      // Generate hook (first scene)
      const hook = scenes[0]?.audio || this.generateHook(options.topic, options.format);

      // Generate hashtags
      const hashtags = this.generateHashtags(options.topic, options.format);

      // Generate caption
      const caption = this.generateCaption(options.topic, scenes);

      // Calculate viral score
      const viralScore = this.calculateViralScore(hook, scenes, hashtags);

      // Calculate hook strength
      const hookStrength = this.calculateHookStrength(hook);

      const script: ShortScript = {
        id: crypto.randomUUID(),
        title: this.generateTitle(options.topic, options.format),
        format: options.format,
        duration: options.duration,
        hook,
        scenes,
        caption,
        hashtags,
        soundSuggestion: this.suggestSound(options.format),
        cta: this.generateCTA(options.format),
        targetPlatforms: this.selectPlatforms(options.targetPlatform),
        estimatedViralScore: viralScore,
        generatedAt: new Date(),
        metadata: {
          sceneCount: scenes.length,
          wordCount: scenes.reduce((sum, s) => sum + s.audio.split(' ').length, 0),
          hookStrength,
        },
      };

      this.scripts.push(script);

      activityService.addActivity({
        type: 'ai',
        action: 'Short Video Script Generated',
        description: `Generated ${options.format} script: ${script.title}`,
        metadata: {
          format: options.format,
          duration: options.duration,
          viralScore,
        },
      });

      logger.info('Short-form script generated', {
        id: script.id,
        title: script.title,
        scenes: scenes.length,
        viralScore,
      });

      return script;
    } catch (error) {
      logger.error('Short-form script generation failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Build LLM prompt
   */
  private buildPrompt(options: GenerateShortOptions): string {
    const tone = options.tone || 'energetic';

    const basePrompt = `Create a ${options.duration}-second ${options.format} video script about "${options.topic}".

Platform: ${options.targetPlatform || 'TikTok/Shorts/Reels'}
Tone: ${tone}

CRITICAL: First 3 seconds MUST hook viewers (pattern interrupt, shocking statement, or question).

Structure each scene as:
[0:00-0:03] VISUAL: [what to show] | AUDIO: "What to say" | TEXT: [on-screen text]
`;

    const formatTemplates: Record<ShortFormat, string> = {
      'hook-reveal': `
Format: Hook → Build Tension → Reveal
- Start with a shocking hook
- Build curiosity
- Deliver the payoff
- End with CTA`,

      tutorial: `
Format: Quick Tutorial
- Hook: "Here's how to..."
- Show the problem
- Show the solution (step by step)
- Results/proof
- CTA: "Try this!"`,

      story: `
Format: Micro-Story
- Hook: Jump into middle of action
- Quick setup (who/what/where)
- Conflict/challenge
- Resolution
- Lesson learned`,

      facts: `
Format: Mind-Blowing Facts
- Hook: "Did you know..."
- Fact 1 (surprising)
- Fact 2 (more surprising)
- Fact 3 (most surprising)
- "Follow for more"`,

      comedy: `
Format: Comedy Sketch
- Hook: Set up the joke
- Build up (2-3 beats)
- Punchline
- Tag/reaction`,

      'before-after': `
Format: Transformation
- Hook: Show the "before"
- Tease the transformation
- Show the process (fast)
- Reveal the "after"
- CTA: "Want this?"`,

      trending: `
Format: Trending Format
- Use current trend/meme format
- Add unique twist on ${options.topic}
- Keep it relatable
- End with shareworthy moment`,
    };

    return basePrompt + formatTemplates[options.format];
  }

  /**
   * Generate demo script
   */
  private generateDemoScript(options: GenerateShortOptions): string {
    const topic = options.topic;

    const demos: Record<ShortFormat, string> = {
      'hook-reveal': `
[0:00-0:03] VISUAL: Close-up of shocked face | AUDIO: "I can't believe this actually works..." | TEXT: "WAIT FOR IT 👀"
[0:03-0:08] VISUAL: Show problem | AUDIO: "So I was struggling with ${topic}..." | TEXT: "${topic} = IMPOSSIBLE?"
[0:08-0:15] VISUAL: Show solution process | AUDIO: "Then I found this ONE trick..." | TEXT: "The Secret 🤯"
[0:15-0:${options.duration}] VISUAL: Show results | AUDIO: "Now look at this! It actually worked!" | TEXT: "RESULTS ✅"`,

      tutorial: `
[0:00-0:03] VISUAL: Problem state | AUDIO: "Stop doing ${topic} the hard way!" | TEXT: "EASY ${topic} 🚀"
[0:03-0:10] VISUAL: Step 1 | AUDIO: "First, do this..." | TEXT: "STEP 1"
[0:10-0:18] VISUAL: Step 2 | AUDIO: "Then this..." | TEXT: "STEP 2"
[0:18-0:${options.duration}] VISUAL: Results | AUDIO: "And boom! That's it!" | TEXT: "SO SIMPLE 🎉"`,

      story: `
[0:00-0:03] VISUAL: Intense moment | AUDIO: "I never thought ${topic} would change my life..." | TEXT: "TRUE STORY"
[0:03-0:12] VISUAL: Flashback | AUDIO: "It started when..." | TEXT: "6 MONTHS AGO"
[0:12-0:${options.duration}] VISUAL: Transformation | AUDIO: "And now everything's different" | TEXT: "CHANGED EVERYTHING 🌟"`,

      facts: `
[0:00-0:03] VISUAL: Text animation | AUDIO: "3 ${topic} facts that'll blow your mind" | TEXT: "MIND = BLOWN 🤯"
[0:03-0:10] VISUAL: Fact #1 visual | AUDIO: "Fact 1: [surprising fact]" | TEXT: "FACT #1 😱"
[0:10-0:18] VISUAL: Fact #2 visual | AUDIO: "Fact 2: [more surprising]" | TEXT: "FACT #2 🤯"
[0:18-0:${options.duration}] VISUAL: Fact #3 visual | AUDIO: "Fact 3: This is crazy..." | TEXT: "FACT #3 🔥"`,

      comedy: `
[0:00-0:03] VISUAL: Normal scene | AUDIO: "POV: You're learning ${topic}" | TEXT: "RELATABLE?"
[0:03-0:10] VISUAL: Exaggerated reaction | AUDIO: "[Funny observation about ${topic}]" | TEXT: "SO TRUE 😂"
[0:10-0:${options.duration}] VISUAL: Punchline visual | AUDIO: "[Punchline]" | TEXT: "💀💀💀"`,

      'before-after': `
[0:00-0:03] VISUAL: "Before" state | AUDIO: "My ${topic} transformation in ${options.duration} seconds" | TEXT: "BEFORE 😫"
[0:03-0:15] VISUAL: Time-lapse | AUDIO: "Here's what I did..." | TEXT: "THE PROCESS ⚡"
[0:15-0:${options.duration}] VISUAL: "After" state | AUDIO: "Look at the results!" | TEXT: "AFTER 🤩"`,

      trending: `
[0:00-0:03] VISUAL: Trending format setup | AUDIO: "[Trending sound/meme applied to ${topic}]" | TEXT: "TRENDING 🔥"
[0:03-0:${options.duration}] VISUAL: Unique twist | AUDIO: "[Your take on the trend]" | TEXT: "${topic.toUpperCase()}"`,
    };

    return demos[options.format];
  }

  /**
   * Parse scenes from script
   */
  private parseScenes(script: string, duration: number): VideoScene[] {
    const scenes: VideoScene[] = [];
    const lines = script.split('\n').filter(l => l.trim());

    for (const line of lines) {
      const match = line.match(/\[([0-9:]+)-([0-9:]+)\]\s*VISUAL:\s*(.+?)\s*\|\s*AUDIO:\s*"(.+?)"\s*(?:\|\s*TEXT:\s*(.+))?/);

      if (match) {
        const [, start, end, visual, audio, textOverlay] = match;
        scenes.push({
          timestamp: `${start}-${end}`,
          visual: visual.trim(),
          audio: audio.trim(),
          textOverlay: textOverlay?.trim().replace(/"/g, ''),
          effect: this.suggestEffect(),
        });
      }
    }

    // If parsing failed, create default scenes
    if (scenes.length === 0) {
      const sceneCount = duration <= 15 ? 3 : duration <= 30 ? 4 : 6;
      const sceneDuration = Math.floor(duration / sceneCount);

      for (let i = 0; i < sceneCount; i++) {
        const start = i * sceneDuration;
        const end = Math.min(start + sceneDuration, duration);

        scenes.push({
          timestamp: `0:${start.toString().padStart(2, '0')}-0:${end.toString().padStart(2, '0')}`,
          visual: `Scene ${i + 1} visual`,
          audio: `Scene ${i + 1} narration`,
          textOverlay: i === 0 ? 'HOOK' : undefined,
        });
      }
    }

    return scenes;
  }

  /**
   * Generate hook
   */
  private generateHook(topic: string, format: ShortFormat): string {
    const hooks: Record<ShortFormat, string[]> = {
      'hook-reveal': [
        "You won't believe what happened...",
        "This changed everything...",
        "I can't believe this works...",
      ],
      tutorial: [
        `Stop doing ${topic} the hard way!`,
        `Here's the EASY way to ${topic}`,
        `${topic} in under a minute!`,
      ],
      story: [
        `This ${topic} story is crazy...`,
        `I never thought ${topic} would...`,
        `Real ${topic} transformation...`,
      ],
      facts: [
        `3 ${topic} facts that'll blow your mind`,
        `Did you know about ${topic}?`,
        `${topic} secrets they don't tell you`,
      ],
      comedy: [
        `POV: You're learning ${topic}`,
        `${topic} be like...`,
        `Nobody talks about ${topic} like this`,
      ],
      'before-after': [
        `My ${topic} transformation`,
        `${topic}: Before vs After`,
        `Watch this ${topic} change`,
      ],
      trending: [
        `${topic} + trending sound 🔥`,
        `Everyone's doing this ${topic} trend`,
        `New ${topic} trend alert`,
      ],
    };

    const options = hooks[format];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate hashtags
   */
  private generateHashtags(topic: string, format: ShortFormat): string[] {
    const topicTags = topic.toLowerCase().split(' ').filter(w => w.length > 3);
    const formatTags: Record<ShortFormat, string[]> = {
      'hook-reveal': ['viral', 'mindblown', 'wow'],
      tutorial: ['tutorial', 'howto', 'learnontiktok', 'educational'],
      story: ['storytime', 'truestory', 'storytelling'],
      facts: ['facts', 'didyouknow', 'mindblowing', 'educational'],
      comedy: ['comedy', 'funny', 'relatable', 'humor'],
      'before-after': ['transformation', 'beforeandafter', 'results'],
      trending: ['trending', 'viral', 'fyp', 'foryou'],
    };

    return [
      ...topicTags.map(t => `#${t}`),
      ...formatTags[format].map(t => `#${t}`),
      '#fyp',
      '#viral',
    ].slice(0, 8);
  }

  /**
   * Generate caption
   */
  private generateCaption(topic: string, scenes: VideoScene[]): string {
    const firstLine = scenes[0]?.audio || `Check this out!`;
    return `${firstLine} 🔥\n\n${topic}\n\nLike & follow for more! 🚀`;
  }

  /**
   * Suggest trending sound
   */
  private suggestSound(format: ShortFormat): string {
    const sounds: Record<ShortFormat, string> = {
      'hook-reveal': 'Suspenseful buildup sound',
      tutorial: 'Upbeat background music',
      story: 'Emotional piano',
      facts: 'Energetic beat',
      comedy: 'Trending comedy sound',
      'before-after': 'Transformation music',
      trending: 'Current viral sound',
    };

    return sounds[format];
  }

  /**
   * Generate CTA
   */
  private generateCTA(format: ShortFormat): string {
    const ctas = [
      'Follow for more!',
      'Try this now!',
      'Save this for later!',
      'Share with a friend!',
      'Comment below!',
      'Want more? Hit follow!',
    ];

    return ctas[Math.floor(Math.random() * ctas.length)];
  }

  /**
   * Suggest visual effect
   */
  private suggestEffect(): string {
    const effects = ['Zoom in', 'Zoom out', 'Transition', 'Text pop', 'Speed ramp', 'Cut', 'Fade'];
    return effects[Math.floor(Math.random() * effects.length)];
  }

  /**
   * Calculate viral score
   */
  private calculateViralScore(hook: string, scenes: VideoScene[], hashtags: string[]): number {
    let score = 50; // Base score

    // Strong hook
    if (hook.includes('!') || hook.includes('?')) score += 10;
    if (hook.length < 50) score += 10; // Short and punchy

    // Good pacing
    if (scenes.length >= 3 && scenes.length <= 6) score += 15;

    // Text overlays
    const hasTextOverlays = scenes.some(s => s.textOverlay);
    if (hasTextOverlays) score += 10;

    // Hashtags
    if (hashtags.includes('#fyp') || hashtags.includes('#viral')) score += 5;

    return Math.min(95, score);
  }

  /**
   * Calculate hook strength
   */
  private calculateHookStrength(hook: string): number {
    let strength = 50;

    // Pattern interrupts
    if (hook.includes('!')) strength += 15;
    if (hook.includes('?')) strength += 10;
    if (hook.toLowerCase().includes('secret') || hook.toLowerCase().includes('trick')) strength += 10;

    // Emotion words
    const emotionWords = ['crazy', 'shocking', 'amazing', 'unbelievable', 'insane'];
    if (emotionWords.some(w => hook.toLowerCase().includes(w))) strength += 15;

    return Math.min(100, strength);
  }

  /**
   * Select target platforms
   */
  private selectPlatforms(target?: string): ('tiktok' | 'youtube-shorts' | 'instagram-reels')[] {
    if (target === 'all' || !target) {
      return ['tiktok', 'youtube-shorts', 'instagram-reels'];
    }
    return [target as 'tiktok' | 'youtube-shorts' | 'instagram-reels'];
  }

  /**
   * Generate title
   */
  private generateTitle(topic: string, format: ShortFormat): string {
    return `${format.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}: ${topic}`;
  }

  /**
   * Batch generate scripts
   */
  async batchGenerate(topics: string[], format: ShortFormat, duration: number = 30): Promise<ShortScript[]> {
    logger.info('Batch generating short-form scripts', { count: topics.length });

    const scripts: ShortScript[] = [];
    for (const topic of topics) {
      try {
        const script = await this.generateScript({ topic, format, duration });
        scripts.push(script);
      } catch (error) {
        logger.error('Failed to generate script for topic', { topic, error });
      }
    }

    return scripts;
  }

  /**
   * Get all scripts
   */
  getScripts(): ShortScript[] {
    return [...this.scripts];
  }

  /**
   * Export script for teleprompter
   */
  exportForTeleprompter(scriptId: string): string {
    const script = this.scripts.find(s => s.id === scriptId);
    if (!script) throw new Error('Script not found');

    return script.scenes.map(s => `${s.audio}\n[${s.textOverlay || ''}]`).join('\n\n');
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<ShortScript> {
    return await this.generateScript({
      topic: 'AI automation passive income',
      format: 'tutorial',
      duration: 30,
      includeTextOverlays: true,
      tone: 'energetic',
    });
  }
}

// Export singleton
export const shortFormVideoService = new ShortFormVideoService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testShortFormVideo = () => shortFormVideoService.quickTest();
  (window as any).shortFormVideoService = shortFormVideoService;
}
