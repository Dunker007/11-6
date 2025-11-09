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

  private constructor() {
    // Load keys asynchronously - this will complete before first use
    this.loadKeys().catch((error) => {
      console.error('Failed to initialize API keys:', error);
    });
  }

  static getInstance(): APIKeyService {
    if (!APIKeyService.instance) {
      APIKeyService.instance = new APIKeyService();
    }
    return APIKeyService.instance;
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
      metadata,
    };

    // Validate the key
    apiKey.isValid = await this.validateKey(provider, key);

    this.keys.set(apiKey.id, apiKey);
    await this.saveKeys();
    return apiKey;
  }

  getKeys(): APIKey[] {
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

  async updateKey(id: string, updates: Partial<APIKey>): Promise<APIKey | null> {
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
    const deleted = this.keys.delete(id);
    if (deleted) {
      await this.saveKeys();
    }
    return deleted;
  }

  getKey(id: string): APIKey | null {
    return this.keys.get(id) || null;
  }

  getKeysByProvider(provider: APIProvider): APIKey[] {
    return Array.from(this.keys.values()).filter((key) => key.provider === provider);
  }

  getAllKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }

  getKeyForProvider(provider: APIProvider): string | null {
    const keys = this.getKeysByProvider(provider);
    const activeKey = keys.find((key) => key.isValid) || keys[0];
    return activeKey?.key || null;
  }

  async healthCheck(provider: APIProvider): Promise<boolean> {
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

  async recordUsage(id: string, tokens: number, cost: number): Promise<void> {
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

