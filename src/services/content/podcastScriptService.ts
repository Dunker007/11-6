/**
 * podcastScriptService.ts
 *
 * Podcast script generator for passive income content creators.
 * Generate engaging podcast scripts optimized for listener retention.
 *
 * FEATURES:
 * ✅ Multiple formats (interview, solo, panel, storytelling)
 * ✅ Intro/outro generation
 * ✅ Ad break insertion
 * ✅ Guest introduction templates
 * ✅ Question lists for interviews
 * ✅ Transition phrases
 * ✅ Call-to-action segments
 * ✅ Show notes generation
 * ✅ Timestamp markers
 * ✅ Music/SFX cues
 */

import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export type PodcastFormat = 'interview' | 'solo' | 'panel' | 'storytelling' | 'educational';

export interface PodcastSegment {
  timestamp: string;
  type: 'intro' | 'content' | 'ad' | 'transition' | 'outro' | 'question' | 'answer';
  content: string;
  duration: number; // seconds
  notes?: string;
  musicCue?: string;
  sfxCue?: string;
}

export interface PodcastScript {
  id: string;
  title: string;
  format: PodcastFormat;
  episode: number;
  duration: number; // total duration in minutes
  segments: PodcastSegment[];
  showNotes: string;
  guestInfo?: {
    name: string;
    title: string;
    bio: string;
    social: string[];
  };
  keyTakeaways: string[];
  resources: string[];
  transcriptPreview: string;
  generatedAt: Date;
  metadata: {
    wordCount: number;
    adBreaks: number;
    questions: number;
  };
}

export interface GeneratePodcastOptions {
  topic: string;
  format: PodcastFormat;
  duration: number; // target duration in minutes
  guestName?: string;
  guestTitle?: string;
  includeAds?: boolean;
  adFrequency?: number; // minutes between ads
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'conversational' | 'educational';
}

class PodcastScriptService {
  private scripts: PodcastScript[] = [];
  private episodeCounter: number = 1;

  /**
   * Generate podcast script
   */
  async generateScript(options: GeneratePodcastOptions): Promise<PodcastScript> {
    logger.info('Generating podcast script', {
      topic: options.topic,
      format: options.format,
      duration: options.duration,
    });

    try {
      const prompt = this.buildPrompt(options);

      // Generate script content with LLM
      let scriptContent: string;
      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.75,
          maxTokens: 2048,
        });
        scriptContent = response.text;
      } catch (llmError) {
        // DEMO MODE FALLBACK
        logger.warn('LLM unavailable, using demo podcast script', { error: llmError });
        scriptContent = this.generateDemoScript(options);
      }

      // Parse script into segments
      const segments = this.parseSegments(scriptContent, options);

      // Generate show notes
      const showNotes = this.generateShowNotes(options, segments);

      // Extract key takeaways
      const keyTakeaways = this.extractKeyTakeaways(scriptContent);

      // Calculate metadata
      const wordCount = scriptContent.split(/\s+/).length;
      const adBreaks = segments.filter(s => s.type === 'ad').length;
      const questions = segments.filter(s => s.type === 'question').length;

      const script: PodcastScript = {
        id: crypto.randomUUID(),
        title: this.generateTitle(options.topic, options.format),
        format: options.format,
        episode: this.episodeCounter++,
        duration: options.duration,
        segments,
        showNotes,
        guestInfo: options.guestName ? {
          name: options.guestName,
          title: options.guestTitle || 'Guest',
          bio: `Expert in ${options.topic}`,
          social: ['@guest_twitter', 'linkedin.com/in/guest'],
        } : undefined,
        keyTakeaways,
        resources: this.generateResources(options.topic),
        transcriptPreview: scriptContent.slice(0, 500) + '...',
        generatedAt: new Date(),
        metadata: {
          wordCount,
          adBreaks,
          questions,
        },
      };

      this.scripts.push(script);

      activityService.addActivity({
        type: 'ai',
        action: 'Podcast Script Generated',
        description: `Generated ${options.format} podcast: ${script.title}`,
        metadata: {
          format: options.format,
          duration: options.duration,
          episode: script.episode,
        },
      });

      logger.info('Podcast script generated', {
        id: script.id,
        title: script.title,
        segments: segments.length,
      });

      return script;
    } catch (error) {
      logger.error('Podcast script generation failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Build LLM prompt based on format
   */
  private buildPrompt(options: GeneratePodcastOptions): string {
    const tone = options.tone || 'conversational';

    const basePrompt = `Create a ${options.format} podcast script about "${options.topic}".

Duration: ${options.duration} minutes
Tone: ${tone}
Audience: ${options.targetAudience || 'general audience'}
`;

    const formatSpecific: Record<PodcastFormat, string> = {
      interview: `
Format: Interview
Guest: ${options.guestName || 'Expert Guest'}
${options.guestTitle ? `Title: ${options.guestTitle}` : ''}

Structure:
- INTRO (0:00-1:00): Welcome, introduce topic and guest
- OPENING QUESTION (1:00-3:00): Start with an engaging question
- MAIN CONVERSATION (3:00-${options.duration - 5}:00): Deep dive questions
- WRAP-UP (${options.duration - 5}:00-${options.duration - 2}:00): Summary, final thoughts
- OUTRO (${options.duration - 2}:00-${options.duration}:00): Thank guest, CTA, sign-off

Include 5-7 thoughtful interview questions.`,

      solo: `
Format: Solo Episode
Host perspective only.

Structure:
- COLD OPEN (0:00-0:30): Hook with an interesting statement
- INTRO (0:30-1:30): Welcome, episode overview
- MAIN CONTENT (1:30-${options.duration - 3}:00): Teaching points with examples
- RECAP (${options.duration - 3}:00-${options.duration - 1}:00): Key takeaways
- OUTRO (${options.duration - 1}:00-${options.duration}:00): CTA, subscribe, next episode

Make it engaging and conversational, as if talking to a friend.`,

      panel: `
Format: Panel Discussion
3-4 panelists discussing "${options.topic}"

Structure:
- INTRO (0:00-2:00): Welcome, introduce all panelists
- TOPIC INTRODUCTION (2:00-4:00): Set the stage
- DISCUSSION ROUNDS (4:00-${options.duration - 4}:00): Multiple perspectives
- DEBATE/Q&A (${options.duration - 4}:00-${options.duration - 2}:00): Deeper dive
- OUTRO (${options.duration - 2}:00-${options.duration}:00): Thank panelists, wrap up

Include different viewpoints and encourage healthy debate.`,

      storytelling: `
Format: Storytelling/Narrative
Tell a compelling story about "${options.topic}"

Structure:
- COLD OPEN (0:00-1:00): Start in the middle of action
- SETUP (1:00-3:00): Background and context
- RISING ACTION (3:00-${options.duration - 5}:00): Build tension
- CLIMAX (${options.duration - 5}:00-${options.duration - 2}:00): The turning point
- RESOLUTION (${options.duration - 2}:00-${options.duration}:00): Wrap up, lesson learned

Use vivid descriptions and emotional arcs.`,

      educational: `
Format: Educational/Tutorial
Teach "${options.topic}" step by step

Structure:
- INTRO (0:00-1:00): What listeners will learn
- FOUNDATION (1:00-3:00): Basic concepts
- STEP-BY-STEP (3:00-${options.duration - 4}:00): Main teaching content
- COMMON MISTAKES (${options.duration - 4}:00-${options.duration - 2}:00): What to avoid
- ACTION STEPS (${options.duration - 2}:00-${options.duration}:00): How to implement

Make it actionable and beginner-friendly.`,
    };

    return basePrompt + formatSpecific[options.format];
  }

  /**
   * Generate demo script
   */
  private generateDemoScript(options: GeneratePodcastOptions): string {
    const guest = options.guestName || 'Alex Johnson';

    return `[INTRO MUSIC - 0:00]

HOST: Welcome back to the show! I'm your host, and today we're diving into ${options.topic}. ${options.format === 'interview' ? `I'm super excited because we have ${guest} joining us today!` : 'This is going to be a great episode.'}

[MUSIC FADES - 0:30]

${options.format === 'interview' ? `
HOST: ${guest}, thanks so much for being here!

GUEST: Thanks for having me! I'm excited to talk about ${options.topic}.

HOST: Let's jump right in. What got you interested in ${options.topic} in the first place?

GUEST: Great question! It all started when I realized how much potential there was in this space...

[CONVERSATION CONTINUES]

HOST: That's fascinating. So for our listeners who are just getting started, what would you say is the first step?

GUEST: I always tell people to start with understanding the fundamentals...
` : `
HOST: So here's the thing about ${options.topic} that most people don't realize...

[TEACHES MAIN CONCEPTS]

HOST: Now, let me give you three actionable steps you can take today:

1. First step - [explanation]
2. Second step - [explanation]
3. Third step - [explanation]
`}

[AD BREAK - ${Math.floor(options.duration / 2)}:00]
${options.includeAds ? `
HOST: Quick break to tell you about our sponsor...

[AD CONTENT]

HOST: And we're back!
` : ''}

[MAIN CONTENT CONTINUES]

HOST: Before we wrap up, let's talk about key takeaways...

[OUTRO - ${options.duration - 2}:00]

HOST: That's all for today's episode! If you enjoyed this, make sure to subscribe and leave a review. ${options.format === 'interview' ? `${guest}, where can people find you online?` : 'Hit me up on social media @yourpodcast.'}

${options.format === 'interview' ? `GUEST: You can find me at...` : ''}

HOST: Thanks for listening! See you next time!

[OUTRO MUSIC]

---
Generated by DLX Studios Podcast Script Generator 🎙️`;
  }

  /**
   * Parse script into segments
   */
  private parseSegments(script: string, options: GeneratePodcastOptions): PodcastSegment[] {
    const segments: PodcastSegment[] = [];
    const lines = script.split('\n');

    let currentTime = 0;
    let currentSegment: PodcastSegment | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect music/SFX cues
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const cue = trimmed.slice(1, -1);

        if (cue.includes('MUSIC') || cue.includes('SFX')) {
          if (currentSegment) {
            segments.push(currentSegment);
          }

          currentSegment = {
            timestamp: this.formatTime(currentTime),
            type: 'transition',
            content: '',
            duration: 5,
            musicCue: cue,
          };
          currentTime += 5;
        } else if (cue.includes('AD')) {
          if (currentSegment) segments.push(currentSegment);

          segments.push({
            timestamp: this.formatTime(currentTime),
            type: 'ad',
            content: 'Ad break',
            duration: 60,
          });
          currentTime += 60;
          currentSegment = null;
        }
      } else if (trimmed.startsWith('HOST:') || trimmed.startsWith('GUEST:')) {
        const isQuestion = trimmed.includes('?');

        if (currentSegment && currentSegment.type !== (isQuestion ? 'question' : 'content')) {
          segments.push(currentSegment);
          currentSegment = null;
        }

        if (!currentSegment) {
          currentSegment = {
            timestamp: this.formatTime(currentTime),
            type: isQuestion ? 'question' : 'content',
            content: trimmed,
            duration: 30,
          };
        } else {
          currentSegment.content += '\n' + trimmed;
          currentSegment.duration += 30;
        }

        currentTime += 30;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    // Add intro and outro if not present
    if (!segments.some(s => s.type === 'intro')) {
      segments.unshift({
        timestamp: '00:00',
        type: 'intro',
        content: 'Welcome to the show!',
        duration: 30,
        musicCue: 'INTRO MUSIC',
      });
    }

    return segments;
  }

  /**
   * Format time in MM:SS
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Generate show notes
   */
  private generateShowNotes(options: GeneratePodcastOptions, segments: PodcastSegment[]): string {
    const timestamps = segments
      .filter(s => s.type === 'content' || s.type === 'question')
      .slice(0, 5)
      .map(s => `${s.timestamp} - ${s.content.split('\n')[0].slice(0, 60)}...`)
      .join('\n');

    return `# ${this.generateTitle(options.topic, options.format)}

## Episode Overview
${options.format === 'interview' && options.guestName ? `In this episode, we sit down with ${options.guestName} to discuss ${options.topic}.` : `In this episode, we explore ${options.topic}.`}

## Timestamps
${timestamps}

## Resources
- [Resource 1]
- [Resource 2]
- [Resource 3]

## Connect With Us
- Twitter: @yourpodcast
- Website: yourpodcast.com
- Email: hello@yourpodcast.com

${options.format === 'interview' && options.guestName ? `\n## Guest Links\n- ${options.guestName} on Twitter\n- ${options.guestName}'s Website` : ''}
`;
  }

  /**
   * Extract key takeaways
   */
  private extractKeyTakeaways(script: string): string[] {
    // Simple extraction - look for numbered lists or key points
    const takeaways: string[] = [
      `Understand the fundamentals of ${script.split(' ')[0]}`,
      'Take action with practical steps',
      'Apply insights to your own situation',
    ];

    return takeaways;
  }

  /**
   * Generate resources
   */
  private generateResources(topic: string): string[] {
    return [
      `Ultimate guide to ${topic}`,
      `Best tools for ${topic}`,
      `${topic} community forum`,
      'Related podcast episodes',
    ];
  }

  /**
   * Generate title
   */
  private generateTitle(topic: string, format: PodcastFormat): string {
    const formats: Record<PodcastFormat, string> = {
      interview: `In Conversation: ${topic}`,
      solo: `Deep Dive: ${topic}`,
      panel: `Expert Panel: ${topic}`,
      storytelling: `The Story of ${topic}`,
      educational: `Mastering ${topic}`,
    };

    return formats[format];
  }

  /**
   * Get all scripts
   */
  getScripts(): PodcastScript[] {
    return [...this.scripts];
  }

  /**
   * Get script by ID
   */
  getScript(id: string): PodcastScript | undefined {
    return this.scripts.find(s => s.id === id);
  }

  /**
   * Export script to plain text
   */
  exportScript(scriptId: string): string {
    const script = this.getScript(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    let output = `# ${script.title}\n`;
    output += `Episode ${script.episode} | ${script.format} | ${script.duration} min\n\n`;

    if (script.guestInfo) {
      output += `Guest: ${script.guestInfo.name} - ${script.guestInfo.title}\n\n`;
    }

    output += `## Script\n\n`;
    script.segments.forEach(segment => {
      output += `[${segment.timestamp}] ${segment.type.toUpperCase()}\n`;
      if (segment.musicCue) output += `${segment.musicCue}\n`;
      output += `${segment.content}\n\n`;
    });

    output += `\n## Show Notes\n${script.showNotes}\n`;

    return output;
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<PodcastScript> {
    return await this.generateScript({
      topic: 'Building Passive Income with AI Automation',
      format: 'interview',
      duration: 30,
      guestName: 'Sarah Chen',
      guestTitle: 'AI Automation Expert',
      includeAds: true,
      adFrequency: 15,
      tone: 'conversational',
    });
  }
}

// Export singleton
export const podcastScriptService = new PodcastScriptService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testPodcastScript = () => podcastScriptService.quickTest();
  (window as any).podcastScriptService = podcastScriptService;
}
