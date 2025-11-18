/**
 * providerDetectionService.ts
 *
 * PURPOSE:
 * Auto-detects local AI providers (LM Studio, Ollama) running on the user's machine.
 * Provides instant setup for users who already have these tools running.
 *
 * FEATURES:
 * - Auto-detect LM Studio (localhost:1234)
 * - Auto-detect Ollama (localhost:11434)
 * - Detect available models
 * - Test provider connectivity
 * - Return provider capabilities
 *
 * ARCHITECTURE:
 * Service that probes known local provider endpoints and returns detection results.
 */

import { logger } from '../logging/loggerService';

export interface DetectedProvider {
  name: 'lmstudio' | 'ollama' | 'unknown';
  detected: boolean;
  url: string;
  models?: string[];
  version?: string;
  status: 'online' | 'offline' | 'error';
  responseTime?: number; // milliseconds
}

export interface ProviderDetectionResult {
  lmstudio: DetectedProvider;
  ollama: DetectedProvider;
  hasAnyProvider: boolean;
  timestamp: Date;
}

class ProviderDetectionService {
  private readonly LM_STUDIO_URL = 'http://localhost:1234';
  private readonly OLLAMA_URL = 'http://localhost:11434';
  private readonly TIMEOUT_MS = 3000; // 3 second timeout

  /**
   * Detect all local AI providers
   */
  async detectAll(): Promise<ProviderDetectionResult> {
    const startTime = Date.now();
    logger.info('[ProviderDetection] Starting auto-detection...');

    // Run detections in parallel for speed
    const [lmstudio, ollama] = await Promise.all([
      this.detectLMStudio(),
      this.detectOllama(),
    ]);

    const result: ProviderDetectionResult = {
      lmstudio,
      ollama,
      hasAnyProvider: lmstudio.detected || ollama.detected,
      timestamp: new Date(),
    };

    const elapsed = Date.now() - startTime;
    logger.info('[ProviderDetection] Detection complete', {
      elapsed,
      hasAnyProvider: result.hasAnyProvider,
      providers: {
        lmstudio: lmstudio.detected,
        ollama: ollama.detected,
      },
    });

    return result;
  }

  /**
   * Detect LM Studio on localhost:1234
   */
  async detectLMStudio(): Promise<DetectedProvider> {
    const startTime = Date.now();
    const provider: DetectedProvider = {
      name: 'lmstudio',
      detected: false,
      url: this.LM_STUDIO_URL,
      status: 'offline',
    };

    try {
      // LM Studio exposes an OpenAI-compatible API at /v1/models
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${this.LM_STUDIO_URL}/v1/models`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      provider.responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        provider.detected = true;
        provider.status = 'online';
        provider.models = data.data?.map((m: any) => m.id) || [];

        logger.info('[ProviderDetection] LM Studio detected', {
          models: provider.models,
          responseTime: provider.responseTime,
        });
      } else {
        provider.status = 'error';
        logger.warn('[ProviderDetection] LM Studio responded with error', {
          status: response.status,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.debug('[ProviderDetection] LM Studio detection timeout');
      } else {
        logger.debug('[ProviderDetection] LM Studio not detected', {
          error: error.message,
        });
      }
      provider.status = 'offline';
    }

    return provider;
  }

  /**
   * Detect Ollama on localhost:11434
   */
  async detectOllama(): Promise<DetectedProvider> {
    const startTime = Date.now();
    const provider: DetectedProvider = {
      name: 'ollama',
      detected: false,
      url: this.OLLAMA_URL,
      status: 'offline',
    };

    try {
      // Ollama exposes API at /api/tags to list models
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${this.OLLAMA_URL}/api/tags`, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      provider.responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        provider.detected = true;
        provider.status = 'online';
        provider.models = data.models?.map((m: any) => m.name) || [];

        // Try to get version from /api/version
        try {
          const versionResponse = await fetch(`${this.OLLAMA_URL}/api/version`, {
            signal: controller.signal,
          });
          if (versionResponse.ok) {
            const versionData = await versionResponse.json();
            provider.version = versionData.version;
          }
        } catch {
          // Version endpoint not critical
        }

        logger.info('[ProviderDetection] Ollama detected', {
          models: provider.models,
          version: provider.version,
          responseTime: provider.responseTime,
        });
      } else {
        provider.status = 'error';
        logger.warn('[ProviderDetection] Ollama responded with error', {
          status: response.status,
        });
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        logger.debug('[ProviderDetection] Ollama detection timeout');
      } else {
        logger.debug('[ProviderDetection] Ollama not detected', {
          error: error.message,
        });
      }
      provider.status = 'offline';
    }

    return provider;
  }

  /**
   * Test connectivity to a specific provider URL
   */
  async testProvider(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get recommended setup steps based on detection results
   */
  getSetupRecommendations(result: ProviderDetectionResult): string[] {
    const recommendations: string[] = [];

    if (result.hasAnyProvider) {
      if (result.lmstudio.detected) {
        recommendations.push(
          `✅ LM Studio detected with ${result.lmstudio.models?.length || 0} models - Ready to use!`
        );
      }
      if (result.ollama.detected) {
        recommendations.push(
          `✅ Ollama detected with ${result.ollama.models?.length || 0} models - Ready to use!`
        );
      }
      recommendations.push('💡 You can skip API key setup and use your local models');
    } else {
      recommendations.push('No local AI providers detected');
      recommendations.push('💡 Install LM Studio or Ollama for free local AI');
      recommendations.push('💡 Or configure cloud providers (OpenAI, Anthropic, etc.)');
    }

    return recommendations;
  }

  /**
   * Quick check if any provider is available (fast, no model fetching)
   */
  async quickCheck(): Promise<boolean> {
    try {
      const results = await Promise.race([
        this.detectLMStudio(),
        this.detectOllama(),
      ]);
      return results.detected;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const providerDetectionService = new ProviderDetectionService();

// Make available for debugging
if (typeof window !== 'undefined') {
  (window as any).testProviderDetection = () => providerDetectionService.detectAll();
}
