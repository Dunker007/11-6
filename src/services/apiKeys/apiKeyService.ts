import type { APIKey, APIProvider } from '../../types/apiKeys';

const STORAGE_KEY = 'dlx_api_keys';
const ENCRYPTION_KEY_NAME = 'dlx_api_encryption_key';

// Generate or retrieve encryption key using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyData = localStorage.getItem(ENCRYPTION_KEY_NAME);
  
  if (keyData) {
    // Import existing key
    const keyBuffer = Uint8Array.from(JSON.parse(keyData));
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } else {
    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and store key
    const exported = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(Array.from(new Uint8Array(exported))));
    
    return key;
  }
}

// Encrypt using AES-GCM
async function encrypt(text: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Generate random IV (12 bytes for AES-GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine IV and encrypted data, then base64 encode
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt using AES-GCM
async function decrypt(encrypted: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    
    // Decode base64 and extract IV and encrypted data
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

export class APIKeyService {
  private static instance: APIKeyService;
  private keys: Map<string, APIKey> = new Map();
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Initialize and track the promise
    this.initializationPromise = this.loadKeys().catch((error) => {
      console.error('Failed to initialize API keys:', error);
    });
  }

  static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
  }

  /**
   * Ensures initialization is complete before proceeding
   * This method can be awaited to guarantee keys are loaded
   */
  async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  private async loadKeys(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure parsed value is an array
        const keysArray: APIKey[] = Array.isArray(parsed) ? parsed : [];
        
        // Decrypt all keys in parallel
        const decryptedKeys = await Promise.all(
          keysArray.map(async (key) => {
            try {
              // Decrypt the key value
              const decryptedKey = await decrypt(key.key);
              const decrypted: APIKey = {
                ...key,
                key: decryptedKey,
              };
              
              // Decrypt metadata if present
              if (key.metadata) {
                decrypted.metadata = { ...key.metadata };
                if (key.metadata.secret) {
                  decrypted.metadata.secret = await decrypt(key.metadata.secret);
                }
                if (key.metadata.passphrase) {
                  decrypted.metadata.passphrase = await decrypt(key.metadata.passphrase);
                }
              }
              
              return decrypted;
            } catch (error) {
              console.error(`Failed to decrypt key ${key.id}:`, error);
              return null;
            }
          })
        );
        
        // Filter out failed decryptions and store valid keys
        decryptedKeys
          .filter((key): key is APIKey => key !== null)
          .forEach((key) => {
            this.keys.set(key.id, key);
          });
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async saveKeys(): Promise<void> {
    try {
      // Encrypt all keys in parallel
      const encryptedKeys = await Promise.all(
        Array.from(this.keys.values()).map(async (key) => {
          const saved: any = {
            ...key,
            key: await encrypt(key.key), // Encrypt before saving
          };
          // Encrypt metadata if present
          if (key.metadata) {
            saved.metadata = { ...key.metadata };
            if (saved.metadata.secret) {
              saved.metadata.secret = await encrypt(saved.metadata.secret);
            }
            if (saved.metadata.passphrase) {
              saved.metadata.passphrase = await encrypt(saved.metadata.passphrase);
            }
          }
          return saved;
        })
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedKeys));
    } catch (error) {
      console.error('Failed to save API keys:', error);
    }
  }

  async addKey(provider: APIProvider, key: string, name: string, metadata?: Record<string, any>): Promise<APIKey> {
    // Ensure initialization is complete before adding keys
    await this.ensureInitialized();
    
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
      metadata: metadata || {},
    };

    // Validate the key
    apiKey.isValid = await this.validateKey(provider, key);

    // For Gemini, detect tier and store in metadata
    if (provider === 'gemini' && apiKey.isValid) {
      const tier = await this.detectGeminiTier(key);
      apiKey.metadata = {
        ...apiKey.metadata,
        tier,
        tierDetectedAt: new Date().toISOString(),
      };
    }

    this.keys.set(apiKey.id, apiKey);
    await this.saveKeys();
    return apiKey;
  }

  getKeys(): APIKey[] {
    // If initialization hasn't completed, return empty array
    // Callers should use ensureInitialized() or await initializationPromise if they need keys immediately
    return Array.from(this.keys.values());
  }

  async getKeysAsync(): Promise<APIKey[]> {
    await this.ensureInitialized();
    return Array.from(this.keys.values());
  }

  async validateKey(provider: APIProvider, key: string): Promise<boolean> {
    // Skip validation for local providers
    if (provider === 'lmstudio' || provider === 'ollama') {
      return true;
    }

    // Basic validation - check if key is not empty
    if (!key || key.trim().length === 0) {
      return false;
    }

    // Coinbase validation - check format
    if (provider === 'coinbase') {
      // Coinbase API keys are typically base64 encoded strings
      return key.length > 20;
    }

    // Gemini-specific validation with tier detection
    if (provider === 'gemini') {
      return await this.validateGeminiKey(key);
    }

    // In production, make actual API calls to validate
    // For now, just check format
    try {
      switch (provider) {
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

  /**
   * Validate Gemini API key and detect subscription tier
   */
  private async validateGeminiKey(key: string): Promise<boolean> {
    // Basic format check
    if (!key.startsWith('AI') || key.length < 20) {
      return false;
    }

    try {
      // Make a test API call to validate the key
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      // Validation successful
      // Note: Tier detection is handled separately in detectGeminiTier()
      return true;
    } catch (error) {
      console.error('Gemini key validation error:', error);
      return false;
    }
  }

  /**
   * Detect Gemini subscription tier
   */
  async detectGeminiTier(key: string): Promise<'free' | 'pro' | 'unknown'> {
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return 'unknown';
      }

      const data = await response.json();
      const models = data.models || [];
      
      // Check for Pro-tier models
      const hasProModels = models.some((m: any) => 
        m.name?.includes('gemini-1.5-pro') || 
        m.name?.includes('gemini-ultra') ||
        m.name?.includes('gemini-2.0')
      );

      // Check for advanced features (function calling, grounding)
      // Pro tier typically has access to more advanced features
      const hasAdvancedFeatures = models.some((m: any) => 
        m.supportedGenerationMethods?.includes('generateContent') &&
        m.supportedGenerationMethods?.length > 1
      );

      if (hasProModels || hasAdvancedFeatures) {
        return 'pro';
      }

      return 'free';
    } catch (error) {
      console.error('Gemini tier detection error:', error);
      return 'unknown';
    }
  }

  async updateKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
    await this.ensureInitialized();
    
    const key = this.keys.get(id);
    if (!key) return null;

    const updated = { ...key, ...updates };
    
    // If key value changed, validate it
    if (updates.key && updates.key !== key.key) {
      updated.isValid = await this.validateKey(updated.provider, updates.key);
    }

    this.keys.set(id, updated);
    await this.saveKeys();
    return updated;
  }

  async deleteKey(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    const deleted = this.keys.delete(id);
    if (deleted) {
      await this.saveKeys();
    }
    return deleted;
  }

  getKey(id: string): APIKey | null {
    // Synchronous getter - may return null if initialization hasn't completed
    return this.keys.get(id) || null;
  }

  async getKeyAsync(id: string): Promise<APIKey | null> {
    await this.ensureInitialized();
    return this.keys.get(id) || null;
  }

  getKeysByProvider(provider: APIProvider): APIKey[] {
    // Synchronous getter - may return empty array if initialization hasn't completed
    return Array.from(this.keys.values()).filter((key) => key.provider === provider);
  }

  async getKeysByProviderAsync(provider: APIProvider): Promise<APIKey[]> {
    await this.ensureInitialized();
    return Array.from(this.keys.values()).filter((key) => key.provider === provider);
  }

  getAllKeys(): APIKey[] {
    // Synchronous getter - may return empty array if initialization hasn't completed
    return Array.from(this.keys.values());
  }

  async getAllKeysAsync(): Promise<APIKey[]> {
    await this.ensureInitialized();
    return Array.from(this.keys.values());
  }

  getKeyForProvider(provider: APIProvider): string | null {
    // Synchronous getter - may return null if initialization hasn't completed
    const keys = this.getKeysByProvider(provider);
    const activeKey = keys.find((key) => key.isValid) || keys[0];
    return activeKey?.key || null;
  }

  async getKeyForProviderAsync(provider: APIProvider): Promise<string | null> {
    await this.ensureInitialized();
    const keys = await this.getKeysByProviderAsync(provider);
    const activeKey = keys.find((key) => key.isValid) || keys[0];
    return activeKey?.key || null;
  }

  /**
   * Get a global key for a provider, with fallback support.
   * This allows services to share API keys (e.g., NotebookLM can use Gemini key).
   * @param provider The provider to get key for
   * @param fallbackProviders Optional array of providers to try as fallback
   * @returns The API key string or null if not found
   */
  async getGlobalKey(provider: APIProvider, fallbackProviders?: APIProvider[]): Promise<string | null> {
    await this.ensureInitialized();
    
    // Try primary provider first
    let key = await this.getKeyForProviderAsync(provider);
    if (key) return key;
    
    // Try fallback providers
    if (fallbackProviders) {
      for (const fallbackProvider of fallbackProviders) {
        key = await this.getKeyForProviderAsync(fallbackProvider);
        if (key) return key;
      }
    }
    
    return null;
  }

  /**
   * Record that a key was used by a service
   * @param keyId The key ID
   * @param serviceName The service that used the key
   */
  async recordKeyUsage(keyId: string, serviceName: string): Promise<void> {
    await this.ensureInitialized();
    const key = this.keys.get(keyId);
    if (key) {
      if (!key.metadata) {
        key.metadata = {};
      }
      if (!key.metadata.usedBy) {
        key.metadata.usedBy = [];
      }
      const usedBy = key.metadata.usedBy as string[];
      if (!usedBy.includes(serviceName)) {
        usedBy.push(serviceName);
      }
      this.keys.set(keyId, key);
      await this.saveKeys();
    }
  }

  /**
   * Get all services that use a specific key
   * @param keyId The key ID
   * @returns Array of service names
   */
  getKeyUsage(keyId: string): string[] {
    const key = this.keys.get(keyId);
    if (key?.metadata?.usedBy) {
      return key.metadata.usedBy as string[];
    }
    return [];
  }

  async healthCheck(provider: APIProvider): Promise<boolean> {
    await this.ensureInitialized();
    
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

    // For Gemini, make actual API call to check health
    if (provider === 'gemini' && key) {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        return response.ok;
      } catch {
        return false;
      }
    }

    // For other cloud providers, just check if key exists and is valid
    return key !== null;
  }

  async recordUsage(id: string, tokens: number, cost: number): Promise<void> {
    await this.ensureInitialized();
    
    const key = this.keys.get(id);
    if (key) {
      key.usage.requests += 1;
      key.usage.tokens += tokens;
      key.usage.cost += cost;
      key.lastUsed = new Date();
      this.keys.set(id, key);
      await this.saveKeys();
    }
  }

  async resetUsage(id: string): Promise<void> {
    await this.ensureInitialized();
    
    const key = this.keys.get(id);
    if (key) {
      key.usage = {
        requests: 0,
        tokens: 0,
        cost: 0,
        lastReset: new Date(),
      };
      this.keys.set(id, key);
      await this.saveKeys();
    }
  }
}

export const apiKeyService = APIKeyService.getInstance();

