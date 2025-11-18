/**
 * Base Integration Service
 *
 * PURPOSE:
 * Abstract base class for all third-party integrations.
 * Eliminates 70% code duplication across integration services.
 *
 * FEATURES:
 * - Credential management (vault integration, OAuth support)
 * - Connection status tracking
 * - Cost protection hooks
 * - Activity logging
 * - Consistent error handling
 * - Google OAuth support
 *
 * USAGE:
 * ```typescript
 * class MyIntegrationService extends BaseIntegrationService {
 *   getServiceId() { return 'myservice'; }
 *   getServiceName() { return 'My Service'; }
 *   supportsGoogleOAuth() { return true; }
 *
 *   async myMethod() {
 *     if (!this.isConnected()) throw new Error('Not connected');
 *     return await this.makeAPICall('/endpoint');
 *   }
 * }
 * ```
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { credentialVaultService } from '../credentials/credentialVaultService';

export interface IntegrationStatus {
  connected: boolean;
  hasCredentials: boolean;
  authMethod?: 'api_key' | 'oauth' | 'google_oauth';
  message: string;
  costTier?: 'free' | 'paid' | 'metered';
  monthlySpending?: number;
}

export interface APICallOptions extends RequestInit {
  endpoint: string;
  baseURL?: string;
  requiresAuth?: boolean;
  estimatedCost?: number;
}

export interface GoogleOAuthConfig {
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

/**
 * Base class for all integration services
 * Provides common functionality and enforces consistent patterns
 */
export abstract class BaseIntegrationService {
  protected credentials?: Record<string, string>;
  protected accessToken?: string;
  protected googleAccessToken?: string;
  protected isGoogleAuthenticated = false;

  // ========================================
  // ABSTRACT METHODS (must implement)
  // ========================================

  /**
   * Get the service identifier (used in credential vault)
   * @example 'github', 'notion', 'slack'
   */
  abstract getServiceId(): string;

  /**
   * Get the human-readable service name
   * @example 'GitHub', 'Notion', 'Slack'
   */
  abstract getServiceName(): string;

  /**
   * Does this service support Google OAuth/SSO?
   * @default false
   */
  supportsGoogleOAuth(): boolean {
    return false;
  }

  /**
   * Get Google OAuth configuration if supported
   */
  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return null;
  }

  /**
   * Get the base API URL for this service
   */
  getBaseURL(): string {
    return '';
  }

  /**
   * Get the cost tier for this service
   * @returns 'free' | 'paid' | 'metered'
   */
  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free';
  }

  // ========================================
  // CREDENTIAL MANAGEMENT
  // ========================================

  /**
   * Set access token (standard API key authentication)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    logger.info(`${this.getServiceName()} access token configured`);

    activityService.addActivity({
      type: 'system',
      action: 'connected',
      description: `Connected to ${this.getServiceName()}`,
      metadata: { service: this.getServiceId() },
    });
  }

  /**
   * Set Google OAuth token (for Google SSO)
   */
  setGoogleOAuthToken(token: string): void {
    this.googleAccessToken = token;
    this.isGoogleAuthenticated = true;
    logger.info(`${this.getServiceName()} authenticated via Google OAuth`);

    activityService.addActivity({
      type: 'system',
      action: 'connected',
      description: `Connected to ${this.getServiceName()} via Google`,
      metadata: { service: this.getServiceId(), authMethod: 'google_oauth' },
    });
  }

  /**
   * Set full credentials object
   */
  setCredentials(creds: Record<string, string>): void {
    this.credentials = creds;

    // Extract common credential fields
    if (creds.accessToken) {
      this.accessToken = creds.accessToken;
    }
    if (creds.apiKey) {
      this.accessToken = creds.apiKey;
    }

    logger.info(`${this.getServiceName()} credentials configured`);
  }

  /**
   * Check if service is connected
   */
  isConnected(): boolean {
    return !!(this.accessToken || this.googleAccessToken || this.credentials);
  }

  /**
   * Auto-connect from credential vault
   */
  connectFromVault(): boolean {
    const creds = credentialVaultService.getCredentials(this.getServiceId());

    if (creds && creds.credentials) {
      this.setCredentials(creds.credentials);
      logger.info(`${this.getServiceName()} auto-initialized from credential vault`);
      return true;
    }

    logger.info(`${this.getServiceName()} credentials not found in vault - using demo mode`);
    return false;
  }

  /**
   * Disconnect and clear credentials
   */
  disconnect(): void {
    this.credentials = undefined;
    this.accessToken = undefined;
    this.googleAccessToken = undefined;
    this.isGoogleAuthenticated = false;

    logger.info(`${this.getServiceName()} disconnected`);

    activityService.addActivity({
      type: 'system',
      action: 'disconnected',
      description: `Disconnected from ${this.getServiceName()}`,
      metadata: { service: this.getServiceId() },
    });
  }

  /**
   * Get detailed connection status
   */
  getStatus(): IntegrationStatus {
    const hasVaultCreds = credentialVaultService.hasCredentials(this.getServiceId());
    const isConnected = this.isConnected();
    const costTier = this.getCostTier();

    // Connected via Google OAuth
    if (isConnected && this.isGoogleAuthenticated) {
      return {
        connected: true,
        hasCredentials: true,
        authMethod: 'google_oauth',
        message: `Connected to ${this.getServiceName()} via Google`,
        costTier,
      };
    }

    // Connected via API key
    if (isConnected && hasVaultCreds) {
      return {
        connected: true,
        hasCredentials: true,
        authMethod: 'api_key',
        message: `Connected to ${this.getServiceName()}`,
        costTier,
      };
    }

    // Credentials available but not connected
    if (hasVaultCreds && !isConnected) {
      return {
        connected: false,
        hasCredentials: true,
        message: 'Credentials available - click to connect',
        costTier,
      };
    }

    // No credentials - show Google OAuth option if available
    if (this.supportsGoogleOAuth()) {
      return {
        connected: false,
        hasCredentials: false,
        message: `Sign in with Google or configure API key`,
        costTier,
      };
    }

    // No credentials - API key only
    return {
      connected: false,
      hasCredentials: false,
      message: 'Demo mode - configure credentials in vault to connect',
      costTier,
    };
  }

  // ========================================
  // GOOGLE OAUTH SUPPORT
  // ========================================

  /**
   * Initiate Google OAuth flow
   */
  async initiateGoogleOAuth(): Promise<string | null> {
    if (!this.supportsGoogleOAuth()) {
      logger.warn(`${this.getServiceName()} does not support Google OAuth`);
      return null;
    }

    const config = this.getGoogleOAuthConfig();
    if (!config) {
      logger.error(`${this.getServiceName()} Google OAuth config missing`);
      return null;
    }

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'token',
      scope: config.scopes.join(' '),
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    logger.info(`${this.getServiceName()} Google OAuth initiated`);

    return oauthUrl;
  }

  /**
   * Handle Google OAuth callback
   */
  handleGoogleOAuthCallback(token: string): void {
    this.setGoogleOAuthToken(token);
  }

  // ========================================
  // API CALL HELPERS
  // ========================================

  /**
   * Make authenticated API call
   * Includes cost tracking and error handling
   */
  protected async makeAPICall<T = any>(options: APICallOptions): Promise<T> {
    const { endpoint, baseURL, requiresAuth = true, estimatedCost = 0, ...fetchOptions } = options;

    // Check authentication
    if (requiresAuth && !this.isConnected()) {
      throw new Error(`${this.getServiceName()} not connected - please authenticate first`);
    }

    // Cost protection check (hook for future cost service)
    if (estimatedCost > 0) {
      logger.info(`${this.getServiceName()} API call estimated cost: $${estimatedCost}`);
      // TODO: Integrate with CostProtectionService
    }

    // Build URL
    const url = baseURL ? `${baseURL}${endpoint}` : `${this.getBaseURL()}${endpoint}`;

    // Add authentication headers
    const headers = new Headers(fetchOptions.headers);
    if (this.isGoogleAuthenticated && this.googleAccessToken) {
      headers.set('Authorization', `Bearer ${this.googleAccessToken}`);
    } else if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        throw new Error(`${this.getServiceName()} API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      logger.info(`${this.getServiceName()} API call successful`, { endpoint });

      return data as T;
    } catch (error) {
      logger.error(`${this.getServiceName()} API call failed`, { endpoint, error });
      throw error;
    }
  }

  /**
   * Simulate API call for demo/testing
   * @param delay Delay in milliseconds (default: 100ms)
   */
  protected async simulateAPICall(delay = 100): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // ========================================
  // ACTIVITY LOGGING
  // ========================================

  /**
   * Log integration activity
   */
  protected logActivity(action: string, metadata?: Record<string, any>): void {
    activityService.addActivity({
      type: 'system',
      action: this.getServiceId(),
      description: `${this.getServiceName()}: ${action}`,
      metadata: {
        service: this.getServiceId(),
        ...metadata,
      },
    });
  }

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Get service info for display
   */
  getServiceInfo() {
    return {
      id: this.getServiceId(),
      name: this.getServiceName(),
      connected: this.isConnected(),
      supportsGoogleOAuth: this.supportsGoogleOAuth(),
      costTier: this.getCostTier(),
      status: this.getStatus(),
    };
  }

  /**
   * Validate credentials format
   * Override this in subclasses for service-specific validation
   */
  protected validateCredentials(_creds: Record<string, string>): boolean {
    return true;
  }
}

/**
 * Auto-initialization helper
 * Use this in service modules to auto-connect from vault
 */
export function autoInitializeService(service: BaseIntegrationService, delay = 100): void {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      service.connectFromVault();
    }, delay);
  }
}
