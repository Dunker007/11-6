/**
 * voiceSynthesisService.ts
 * Text-to-speech voice synthesis for content creation.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface VoiceOptions {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  style: 'professional' | 'casual' | 'energetic' | 'calm';
  preview?: string;
}

export interface AudioFile {
  id: string;
  url: string;
  text: string;
  voice: string;
  duration: number;
  format: string;
  size: number;
  createdAt: Date;
  cost: number;
}

class VoiceSynthesisService {
  private voices: Voice[] = [
    { id: 'en-us-neural-1', name: 'Sarah', language: 'en-US', gender: 'female', style: 'professional' },
    { id: 'en-us-neural-2', name: 'John', language: 'en-US', gender: 'male', style: 'professional' },
    { id: 'en-us-neural-3', name: 'Emma', language: 'en-US', gender: 'female', style: 'energetic' },
    { id: 'en-gb-neural-1', name: 'Oliver', language: 'en-GB', gender: 'male', style: 'calm' },
    { id: 'es-es-neural-1', name: 'Sofia', language: 'es-ES', gender: 'female', style: 'casual' },
  ];

  private audioHistory: AudioFile[] = [];
  private costPerCharacter = 0.000016; // AWS Polly pricing

  async synthesize(options: VoiceOptions): Promise<AudioFile> {
    const {
      text,
      voice = 'en-us-neural-1',
      language = 'en-US',
      speed = 1.0,
      pitch = 1.0,
      format = 'mp3',
    } = options;

    logger.info('Synthesizing speech', { voice, textLength: text.length });

    // Demo mode: simulate API call
    await this.simulateSynthesis(text.length);

    const wordCount = text.split(' ').length;
    const duration = Math.ceil((wordCount / 150) * 60); // ~150 words per minute
    const size = Math.ceil(text.length * 0.5); // Rough estimate

    const audioFile: AudioFile = {
      id: crypto.randomUUID(),
      url: `https://demo.dlxstudios.com/audio/${crypto.randomUUID()}.${format}`,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      voice,
      duration,
      format,
      size,
      createdAt: new Date(),
      cost: text.length * this.costPerCharacter,
    };

    this.audioHistory.push(audioFile);

    activityService.logActivity({
      type: 'audio_generated',
      message: `Generated audio: ${duration}s using ${voice}`,
      metadata: { format, size },
    });

    return audioFile;
  }

  async synthesizeBatch(texts: string[], voice?: string): Promise<AudioFile[]> {
    const results: AudioFile[] = [];

    for (const text of texts) {
      const audio = await this.synthesize({ text, voice });
      results.push(audio);
    }

    logger.info('Batch synthesis complete', { count: results.length });
    return results;
  }

  private async simulateSynthesis(textLength: number): Promise<void> {
    // Simulate API latency based on text length
    const delay = Math.min(50 + textLength * 0.1, 500);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getVoices(language?: string): Voice[] {
    if (language) {
      return this.voices.filter(v => v.language.startsWith(language));
    }
    return this.voices;
  }

  getAudioHistory(limit: number = 20): AudioFile[] {
    return this.audioHistory.slice(-limit).reverse();
  }

  getTotalCost(): number {
    return this.audioHistory.reduce((sum, audio) => sum + audio.cost, 0);
  }

  getTotalDuration(): number {
    return this.audioHistory.reduce((sum, audio) => sum + audio.duration, 0);
  }

  async convertBlogToAudio(blogPost: { title: string; content: string }): Promise<AudioFile> {
    const script = `${blogPost.title}. ${blogPost.content}`;
    return this.synthesize({
      text: script,
      voice: 'en-us-neural-1',
      format: 'mp3',
    });
  }

  estimateCost(text: string): number {
    return text.length * this.costPerCharacter;
  }

  async quickTest() {
    const audio1 = await this.synthesize({
      text: 'Welcome to DLX Studios, your ultimate passive income automation platform. Transform your content into multiple revenue streams with AI-powered tools.',
      voice: 'en-us-neural-1',
      format: 'mp3',
    });

    const audio2 = await this.synthesize({
      text: 'Build your passive income empire with automated content creation, publishing, and monetization.',
      voice: 'en-us-neural-3',
      format: 'mp3',
    });

    return {
      audioFiles: [audio1, audio2],
      availableVoices: this.getVoices(),
      totalCost: this.getTotalCost(),
      totalDuration: this.getTotalDuration(),
    };
  }
}

export const voiceSynthesisService = new VoiceSynthesisService();
if (typeof window !== 'undefined') (window as any).testVoiceSynthesis = () => voiceSynthesisService.quickTest();
