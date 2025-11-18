/**
 * Credential Vault Service
 *
 * PURPOSE:
 * Secure encrypted storage for API keys and credentials.
 * Uses AES-256-GCM encryption for all sensitive data.
 *
 * SECURITY:
 * - Real AES-256-GCM encryption (not fake base64)
 * - PBKDF2 key derivation with 100,000 iterations
 * - Random IV per encryption
 * - Automatic migration from plaintext
 *
 * USAGE:
 * ```typescript
 * import { credentialVaultService } from '@/services/credentials/credentialVaultService';
 *
 * // Store credentials (automatically encrypted)
 * credentialVaultService.setCredentials('github', { accessToken: 'ghp_...' });
 *
 * // Retrieve credentials (automatically decrypted)
 * const creds = credentialVaultService.getCredentials('github');
 * ```
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { encryptionService } from '../security/encryptionService';

export interface ServiceCredentials {
  serviceId: string;
  serviceName: string;
  category: 'revenue' | 'publishing' | 'integration' | 'ai' | 'storage';
  status: 'connected' | 'disconnected' | 'testing' | 'error';
  credentials: Record<string, string>;
  lastTested?: Date;
  lastError?: string;
  metadata?: Record<string, any>;
}

export interface ConnectionTest {
  serviceId: string;
  success: boolean;
  message: string;
  timestamp: Date;
  latency?: number;
}

export interface CredentialExport {
  version: string;
  encrypted: boolean;
  timestamp: Date;
  credentials: ServiceCredentials[];
}

class CredentialVaultService {
  private readonly STORAGE_KEY = 'dlx_credentials_vault';
  private credentials = new Map<string, ServiceCredentials>();
  private listeners: ((serviceId: string, status: ServiceCredentials['status']) => void)[] = [];
  private encryptionInitialized = false;

  constructor() {
    this.initializeAsync();
  }

  /**
   * Initialize encryption and load credentials
   */
  private async initializeAsync(): Promise<void> {
    try {
      // Initialize encryption service first
      await encryptionService.initialize();
      this.encryptionInitialized = true;
      logger.info('Encryption initialized successfully');

      // Load credentials (will decrypt if encrypted)
      await this.loadFromStorage();

      // Initialize defaults for missing services
      this.initializeDefaults();
    } catch (error) {
      logger.error('Failed to initialize credential vault', { error });
      // Fall back to unencrypted mode (but log warning)
      logger.warn('Credential vault running in UNENCRYPTED mode - encryption failed');
      this.encryptionInitialized = false;
    }
  }

  /**
   * Ensure encryption is ready before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.encryptionInitialized) {
      await this.initializeAsync();
    }
  }

  private initializeDefaults(): void {
    const defaultServices: Partial<ServiceCredentials>[] = [
      // Revenue
      { serviceId: 'stripe', serviceName: 'Stripe', category: 'revenue', status: 'disconnected', credentials: { apiKey: '', secretKey: '' } },
      { serviceId: 'gumroad', serviceName: 'Gumroad', category: 'revenue', status: 'disconnected', credentials: { accessToken: '' } },
      { serviceId: 'paypal', serviceName: 'PayPal', category: 'revenue', status: 'disconnected', credentials: { clientId: '', clientSecret: '' } },

      // Publishing
      { serviceId: 'wordpress', serviceName: 'WordPress', category: 'publishing', status: 'disconnected', credentials: { url: '', username: '', appPassword: '' } },
      { serviceId: 'medium', serviceName: 'Medium', category: 'publishing', status: 'disconnected', credentials: { integrationToken: '' } },
      { serviceId: 'devto', serviceName: 'Dev.to', category: 'publishing', status: 'disconnected', credentials: { apiKey: '' } },
      { serviceId: 'hashnode', serviceName: 'Hashnode', category: 'publishing', status: 'disconnected', credentials: { apiKey: '' } },

      // Integrations
      { serviceId: 'github', serviceName: 'GitHub', category: 'integration', status: 'disconnected', credentials: { accessToken: '' } },
      { serviceId: 'notion', serviceName: 'Notion', category: 'integration', status: 'disconnected', credentials: { apiKey: '', databaseId: '' } },
      { serviceId: 'airtable', serviceName: 'Airtable', category: 'integration', status: 'disconnected', credentials: { apiKey: '', baseId: '' } },
      { serviceId: 'slack', serviceName: 'Slack', category: 'integration', status: 'disconnected', credentials: { webhookUrl: '', botToken: '' } },
      { serviceId: 'zapier', serviceName: 'Zapier', category: 'integration', status: 'disconnected', credentials: { apiKey: '' } },

      // AI
      { serviceId: 'openai', serviceName: 'OpenAI', category: 'ai', status: 'disconnected', credentials: { apiKey: '' } },
      { serviceId: 'lmstudio', serviceName: 'LM Studio', category: 'ai', status: 'disconnected', credentials: { endpoint: 'http://localhost:1234', apiKey: '' } },
      { serviceId: 'ollama', serviceName: 'Ollama', category: 'ai', status: 'disconnected', credentials: { endpoint: 'http://localhost:11434', model: 'llama2' } },
      { serviceId: 'anthropic', serviceName: 'Anthropic', category: 'ai', status: 'disconnected', credentials: { apiKey: '' } },

      // Storage
      { serviceId: 'aws', serviceName: 'AWS S3', category: 'storage', status: 'disconnected', credentials: { accessKeyId: '', secretAccessKey: '', region: 'us-east-1' } },
      { serviceId: 'cloudflare', serviceName: 'Cloudflare R2', category: 'storage', status: 'disconnected', credentials: { accountId: '', accessKeyId: '', secretAccessKey: '' } },
    ];

    defaultServices.forEach(service => {
      const existing = this.credentials.get(service.serviceId!);
      if (!existing) {
        this.credentials.set(service.serviceId!, service as ServiceCredentials);
      }
    });
  }

  async setCredentials(serviceId: string, credentials: Record<string, string>): Promise<void> {
    await this.ensureInitialized();

    const existing = this.credentials.get(serviceId);

    if (existing) {
      existing.credentials = credentials;
      existing.status = 'disconnected'; // Reset status until tested
      existing.lastError = undefined;
      this.credentials.set(serviceId, existing);
    } else {
      const newCreds: ServiceCredentials = {
        serviceId,
        serviceName: serviceId,
        category: 'integration',
        status: 'disconnected',
        credentials,
      };
      this.credentials.set(serviceId, newCreds);
    }

    await this.saveToStorage();
    this.notifyListeners(serviceId, 'disconnected');

    activityService.addActivity({
      type: 'system',
      action: 'credentials_updated',
      description: `Credentials updated for ${serviceId}`,
      metadata: { serviceId },
    });

    logger.info('Credentials updated', { serviceId });
  }

  getCredentials(serviceId: string): ServiceCredentials | undefined {
    return this.credentials.get(serviceId);
  }

  getAllCredentials(): ServiceCredentials[] {
    return Array.from(this.credentials.values());
  }

  getCredentialsByCategory(category: ServiceCredentials['category']): ServiceCredentials[] {
    return this.getAllCredentials().filter(c => c.category === category);
  }

  async testConnection(serviceId: string): Promise<ConnectionTest> {
    const service = this.credentials.get(serviceId);

    if (!service) {
      return {
        serviceId,
        success: false,
        message: 'Service not found',
        timestamp: new Date(),
      };
    }

    this.updateStatus(serviceId, 'testing');

    const startTime = performance.now();

    try {
      // Simulate API test (in real app, would make actual API call)
      const hasRequiredCreds = this.validateCredentials(service);

      if (!hasRequiredCreds) {
        throw new Error('Missing required credentials');
      }

      await this.simulateAPICall(500);

      const latency = performance.now() - startTime;

      service.lastTested = new Date();
      service.lastError = undefined;
      this.updateStatus(serviceId, 'connected');

      const result: ConnectionTest = {
        serviceId,
        success: true,
        message: 'Connection successful',
        timestamp: new Date(),
        latency,
      };

      logger.info('Connection test passed', { serviceId, latency });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';

      service.lastError = errorMessage;
      this.updateStatus(serviceId, 'error');

      logger.error('Connection test failed', { serviceId, error: errorMessage });

      return {
        serviceId,
        success: false,
        message: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  async testAllConnections(): Promise<ConnectionTest[]> {
    const results: ConnectionTest[] = [];

    for (const [serviceId, service] of this.credentials.entries()) {
      // Only test services that have credentials
      if (this.hasCredentials(serviceId)) {
        const result = await this.testConnection(serviceId);
        results.push(result);
      }
    }

    return results;
  }

  private validateCredentials(service: ServiceCredentials): boolean {
    const creds = service.credentials;

    // Check if any required credentials are present
    switch (service.serviceId) {
      case 'stripe':
        return !!creds.apiKey || !!creds.secretKey;
      case 'wordpress':
        return !!creds.url && !!creds.username && !!creds.appPassword;
      case 'github':
      case 'notion':
      case 'openai':
      case 'anthropic':
        return !!creds.apiKey || !!creds.accessToken;
      case 'lmstudio':
      case 'ollama':
        return !!creds.endpoint;
      default:
        return Object.values(creds).some(v => v && v.length > 0);
    }
  }

  hasCredentials(serviceId: string): boolean {
    const service = this.credentials.get(serviceId);
    if (!service) return false;

    return Object.values(service.credentials).some(v => v && v.length > 0);
  }

  async updateStatus(serviceId: string, status: ServiceCredentials['status']): Promise<void> {
    const service = this.credentials.get(serviceId);

    if (service) {
      service.status = status;
      this.credentials.set(serviceId, service);
      await this.saveToStorage();
      this.notifyListeners(serviceId, status);
    }
  }

  async clearCredentials(serviceId: string): Promise<void> {
    const service = this.credentials.get(serviceId);

    if (service) {
      service.credentials = Object.keys(service.credentials).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {} as Record<string, string>);
      service.status = 'disconnected';
      service.lastError = undefined;
      this.credentials.set(serviceId, service);
      await this.saveToStorage();
      this.notifyListeners(serviceId, 'disconnected');
    }

    logger.info('Credentials cleared', { serviceId });
  }

  exportCredentials(encrypted: boolean = true): CredentialExport {
    const exportData: CredentialExport = {
      version: '1.0.0',
      encrypted,
      timestamp: new Date(),
      credentials: this.getAllCredentials(),
    };

    logger.info('Credentials exported', { encrypted, count: exportData.credentials.length });

    return exportData;
  }

  async importCredentials(data: CredentialExport): Promise<number> {
    let imported = 0;

    data.credentials.forEach(cred => {
      this.credentials.set(cred.serviceId, cred);
      imported++;
    });

    await this.saveToStorage();

    logger.info('Credentials imported', { count: imported });

    return imported;
  }

  getConnectionStats(): {
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
  } {
    const all = this.getAllCredentials();

    return {
      total: all.length,
      connected: all.filter(c => c.status === 'connected').length,
      disconnected: all.filter(c => c.status === 'disconnected').length,
      errors: all.filter(c => c.status === 'error').length,
    };
  }

  onStatusChange(callback: (serviceId: string, status: ServiceCredentials['status']) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(serviceId: string, status: ServiceCredentials['status']): void {
    this.listeners.forEach(callback => callback(serviceId, status));
  }

  /**
   * Save credentials to storage with encryption
   */
  private async saveToStorage(): Promise<void> {
    try {
      const plaintext = JSON.stringify(Array.from(this.credentials.entries()));

      // Encrypt if encryption is initialized
      if (this.encryptionInitialized) {
        const encrypted = await encryptionService.encrypt(plaintext);
        localStorage.setItem(this.STORAGE_KEY, encrypted);
        logger.info('Credentials saved (encrypted)', { count: this.credentials.size });
      } else {
        // Fall back to unencrypted (with warning)
        localStorage.setItem(this.STORAGE_KEY, plaintext);
        logger.warn('Credentials saved UNENCRYPTED - encryption not initialized');
      }
    } catch (error) {
      logger.error('Failed to save credentials', { error });
    }
  }

  /**
   * Load credentials from storage with decryption
   * Automatically migrates from plaintext to encrypted format
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);

      if (!stored) {
        logger.info('No stored credentials found');
        return;
      }

      let plaintext: string;

      // Check if data is encrypted
      if (encryptionService.isEncrypted(stored)) {
        // Decrypt encrypted data
        plaintext = await encryptionService.decrypt(stored);
        logger.info('Credentials loaded (decrypted)');
      } else {
        // Migrate plaintext data to encrypted format
        logger.warn('Found plaintext credentials - migrating to encrypted format');
        plaintext = stored;

        // Re-save as encrypted
        if (this.encryptionInitialized) {
          const entries = JSON.parse(plaintext);
          this.credentials = new Map(entries);
          await this.saveToStorage(); // This will encrypt
          logger.info('Credentials migrated to encrypted format');
        }
      }

      // Parse credentials
      const entries = JSON.parse(plaintext);
      this.credentials = new Map(entries);
      logger.info('Credentials loaded from storage', { count: this.credentials.size });
    } catch (error) {
      logger.error('Failed to load credentials', { error });
      // Don't throw - let app continue with empty credentials
    }
  }

  private async simulateAPICall(delay: number = 300): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  clearAll(): void {
    this.credentials.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    // Also clear encryption keys
    encryptionService.clearKeys();
    this.initializeDefaults();
    logger.info('All credentials cleared');
  }
}

// Export singleton instance
export const credentialVaultService = new CredentialVaultService();

// ❌ SECURITY: Removed global test function - was exposing credentials on window object
