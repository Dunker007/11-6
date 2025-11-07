import type { APIKey, LLMProvider } from '../../types/apiKeys';

const STORAGE_KEY = 'dlx_api_keys';
// In production, use Web Crypto API with a proper key derivation function

// Simple encryption (for demo - use proper crypto in production)
function encrypt(text: string): string {
  // In production, use Web Crypto API or a proper encryption library
  // This is a placeholder - DO NOT use in production!
  return btoa(text);
}

function decrypt(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
}

export class APIKeyService {
  private static instance: APIKeyService;
  private keys: Map<string, APIKey> = new Map();

  private constructor() {
    this.loadKeys();
  }

  static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  private loadKeys(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const keysArray: APIKey[] = JSON.parse(stored);
        keysArray.forEach((key) => {
          // Decrypt the key value
          key.key = decrypt(key.key);
          this.keys.set(key.id, key);
        });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  }

  private saveKeys(): void {
    try {
      const keysArray = Array.from(this.keys.values()).map((key) => ({
        ...key,
        key: encrypt(key.key), // Encrypt before saving
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keysArray));
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  async addKey(provider: LLMProvider, key: string, name: string): Promise<APIKey> {
    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      provider,
      key,
      name,
      createdAt: new Date(),
      lastUsed: null,
      isValid: false,
      usage: {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastReset: new Date(),
      },
    };

    // Validate the key
    apiKey.isValid = await this.validateKey(provider, key);

    this.keys.set(apiKey.id, apiKey);
    this.saveKeys();
    return apiKey;
  }

  async updateKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
    const key = this.keys.get(id);
    if (!key) return null;

    const updated = { ...key, ...updates };
    
    // If key value changed, validate it
    if (updates.key && updates.key !== key.key) {
      updated.isValid = await this.validateKey(updated.provider, updates.key);
    }

    this.keys.set(id, updated);
    this.saveKeys();
    return updated;
  }

  deleteKey(id: string): boolean {
    const deleted = this.keys.delete(id);
    if (deleted) {
      this.saveKeys();
    }
    return deleted;
  }

  getKey(id: string): APIKey | null {
    return this.keys.get(id) || null;
  }

  getKeysByProvider(provider: LLMProvider): APIKey[] {
    return Array.from(this.keys.values()).filter((key) => key.provider === provider);
  }

  getAllKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }

  getKeyForProvider(provider: LLMProvider): string | null {
    const keys = this.getKeysByProvider(provider);
    const activeKey = keys.find((key) => key.isValid) || keys[0];
    return activeKey?.key || null;
  }

  async validateKey(provider: LLMProvider, key: string): Promise<boolean> {
    // Skip validation for local providers
    if (provider === 'lmstudio' || provider === 'ollama') {
      return true;
    }

    // Basic validation - check if key is not empty
    if (!key || key.trim().length === 0) {
      return false;
    }

    // In production, make actual API calls to validate
    // For now, just check format
    try {
      switch (provider) {
        case 'gemini':
          return key.startsWith('AI') && key.length > 20;
        case 'openai':
          return key.startsWith('sk-') && key.length > 20;
        case 'anthropic':
          return key.startsWith('sk-ant-') && key.length > 20;
        case 'notebooklm':
          return key.length > 10; // Adjust based on actual format
        default:
          return key.length > 0;
      }
    } catch {
      return false;
    }
  }

  async healthCheck(provider: LLMProvider): Promise<boolean> {
    const key = this.getKeyForProvider(provider);
    if (!key && provider !== 'lmstudio' && provider !== 'ollama') {
      return false;
    }

    // For local providers, check if server is running
    if (provider === 'lmstudio') {
      try {
        const response = await fetch('http://localhost:1234/v1/models', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    if (provider === 'ollama') {
      try {
        const response = await fetch('http://localhost:11434/api/tags', {
          method: 'GET',
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    // For cloud providers, we'd make a test API call
    // For now, just check if key exists and is valid
    return key !== null;
  }

  recordUsage(id: string, tokens: number, cost: number): void {
    const key = this.keys.get(id);
    if (key) {
      key.usage.requests += 1;
      key.usage.tokens += tokens;
      key.usage.cost += cost;
      key.lastUsed = new Date();
      this.keys.set(id, key);
      this.saveKeys();
    }
  }

  resetUsage(id: string): void {
    const key = this.keys.get(id);
    if (key) {
      key.usage = {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastReset: new Date(),
      };
      this.keys.set(id, key);
      this.saveKeys();
    }
  }
}

export const apiKeyService = APIKeyService.getInstance();

