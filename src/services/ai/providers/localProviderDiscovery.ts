/**
 * Local Provider Discovery Service
 * Auto-detects Ollama and LM Studio instances running locally
 */

export interface LocalProviderState {
  name: 'Ollama' | 'LM Studio';
  status: 'online' | 'offline';
  endpoint: string;
  latency?: number;
  modelCount?: number;
  lastChecked?: Date;
}

export class LocalProviderDiscovery {
  private static instance: LocalProviderDiscovery;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private readonly defaultPorts = {
    ollama: 11434,
    lmstudio: 1234,
  };
  private readonly healthCheckTimeout = 5000; // 5 seconds

  private constructor() {}

  static getInstance(): LocalProviderDiscovery {
    if (!LocalProviderDiscovery.instance) {
      LocalProviderDiscovery.instance = new LocalProviderDiscovery();
    }
    return LocalProviderDiscovery.instance;
  }

  /**
   * Discover local LLM providers
   * Checks both Ollama and LM Studio endpoints
   */
  async discover(): Promise<LocalProviderState[]> {
    const providers: LocalProviderState[] = [];

    // Check Ollama
    const ollamaStatus = await this.checkProvider('Ollama', `http://localhost:${this.defaultPorts.ollama}`);
    providers.push(ollamaStatus);

    // Check LM Studio
    const lmStudioStatus = await this.checkProvider('LM Studio', `http://localhost:${this.defaultPorts.lmstudio}`);
    providers.push(lmStudioStatus);

    return providers;
  }

  /**
   * Check if a provider is online
   */
  private async checkProvider(
    name: 'Ollama' | 'LM Studio',
    endpoint: string
  ): Promise<LocalProviderState> {
    const startTime = Date.now();
    const baseUrl = name === 'Ollama' 
      ? `${endpoint}/api/tags`
      : `${endpoint}/v1/models`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);

      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (response.ok) {
        // Try to get model count
        let modelCount = 0;
        try {
          const data = await response.json();
          if (name === 'Ollama') {
            modelCount = Array.isArray(data.models) ? data.models.length : 0;
          } else {
            modelCount = Array.isArray(data.data) ? data.data.length : 0;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        return {
          name,
          status: 'online',
          endpoint,
          latency,
          modelCount,
          lastChecked: new Date(),
        };
      }

      return {
        name,
        status: 'offline',
        endpoint,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name,
        status: 'offline',
        endpoint,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Start automatic discovery with polling
   */
  startPolling(intervalMs: number = 10000, callback?: (providers: LocalProviderState[]) => void): void {
    this.stopPolling();

    // Initial discovery
    this.discover().then((providers) => {
      callback?.(providers);
    });

    // Set up polling
    this.discoveryInterval = setInterval(async () => {
      const providers = await this.discover();
      callback?.(providers);
    }, intervalMs);
  }

  /**
   * Stop automatic discovery polling
   */
  stopPolling(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }
}

export const localProviderDiscovery = LocalProviderDiscovery.getInstance();

