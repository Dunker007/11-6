/**
 * Account Aggregation Service
 * 
 * Unified interface for connecting financial accounts via:
 * - Plaid (banks, credit cards, investment accounts)
 * - Yodlee (comprehensive account aggregation)
 * - Schwab (direct API integration)
 * 
 * Handles OAuth flows, account syncing, and credential storage
 */

import type { AccountConnection } from '@/types/wealth';
import { schwabService } from './schwabService';

export type AggregationProvider = 'plaid' | 'yodlee' | 'schwab' | 'manual';

export interface Institution {
  id: string;
  name: string;
  logo?: string;
  supportedProviders: AggregationProvider[];
  country: string;
  type: 'bank' | 'credit_card' | 'investment' | 'loan' | 'other';
}

export interface ConnectionConfig {
  provider: AggregationProvider;
  institutionId?: string;
  apiKey?: string;
  apiSecret?: string;
  environment?: 'sandbox' | 'development' | 'production';
  redirectUri?: string;
}

export interface SyncResult {
  success: boolean;
  accountsAdded: number;
  accountsUpdated: number;
  accountsRemoved: number;
  transactionsImported: number;
  error?: string;
}

class AccountAggregationService {
  private static instance: AccountAggregationService;
  private connections: Map<string, AccountConnection> = new Map();
  private institutions: Map<string, Institution> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeInstitutions();
  }

  static getInstance(): AccountAggregationService {
    if (!AccountAggregationService.instance) {
      AccountAggregationService.instance = new AccountAggregationService();
    }
    return AccountAggregationService.instance;
  }

  /**
   * Initialize list of supported institutions
   */
  private initializeInstitutions(): void {
    // Major US banks
    this.addInstitution({
      id: 'chase',
      name: 'Chase',
      supportedProviders: ['plaid', 'yodlee'],
      country: 'US',
      type: 'bank',
    });

    this.addInstitution({
      id: 'bank-of-america',
      name: 'Bank of America',
      supportedProviders: ['plaid', 'yodlee'],
      country: 'US',
      type: 'bank',
    });

    this.addInstitution({
      id: 'wells-fargo',
      name: 'Wells Fargo',
      supportedProviders: ['plaid', 'yodlee'],
      country: 'US',
      type: 'bank',
    });

    this.addInstitution({
      id: 'schwab',
      name: 'Charles Schwab',
      supportedProviders: ['schwab', 'plaid', 'yodlee'],
      country: 'US',
      type: 'investment',
    });

    this.addInstitution({
      id: 'fidelity',
      name: 'Fidelity',
      supportedProviders: ['plaid', 'yodlee'],
      country: 'US',
      type: 'investment',
    });

    this.addInstitution({
      id: 'vanguard',
      name: 'Vanguard',
      supportedProviders: ['plaid', 'yodlee'],
      country: 'US',
      type: 'investment',
    });

    // Add more institutions as needed
  }

  private addInstitution(institution: Institution): void {
    this.institutions.set(institution.id, institution);
  }

  /**
   * Search for institutions by name
   */
  searchInstitutions(query: string, provider?: AggregationProvider): Institution[] {
    const results: Institution[] = [];
    const lowerQuery = query.toLowerCase();

    this.institutions.forEach(institution => {
      if (institution.name.toLowerCase().includes(lowerQuery)) {
        if (!provider || institution.supportedProviders.includes(provider)) {
          results.push(institution);
        }
      }
    });

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all institutions (optionally filtered by provider)
   */
  getSupportedInstitutions(provider?: AggregationProvider): Institution[] {
    const results: Institution[] = [];
    this.institutions.forEach(institution => {
      if (!provider || institution.supportedProviders.includes(provider)) {
        results.push(institution);
      }
    });
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get all institutions for a provider
   */
  getInstitutions(provider: AggregationProvider): Institution[] {
    return this.getSupportedInstitutions(provider);
  }

  /**
   * Initiate OAuth flow for account connection
   */
  async initiateConnection(
    provider: AggregationProvider,
    institutionId: string,
    config: ConnectionConfig
  ): Promise<{
    authUrl: string;
    connectionId: string;
  }> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (provider) {
      case 'plaid':
        return this.initiatePlaidConnection(institutionId, config, connectionId);
      
      case 'yodlee':
        return this.initiateYodleeConnection(institutionId, config, connectionId);
      
      case 'schwab':
        return this.initiateSchwabConnection(config, connectionId);
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Initiate Plaid Link flow
   */
  private async initiatePlaidConnection(
    institutionId: string,
    _config: ConnectionConfig,
    connectionId: string
  ): Promise<{ authUrl: string; connectionId: string }> {
    // Plaid uses Link SDK for OAuth
    // In a real implementation, this would:
    // 1. Create a link token via Plaid API
    // 2. Return the token to the frontend
    // 3. Frontend uses Plaid Link SDK to complete OAuth
    
    // For now, return a mock auth URL
    const authUrl = `https://plaid.com/auth?institution_id=${institutionId}&connection_id=${connectionId}`;
    
    // Store connection state
    const connection: AccountConnection = {
      id: connectionId,
      institution: institutionId,
      provider: 'plaid',
      status: 'syncing',
      accountIds: [],
      createdAt: new Date(),
    };
    this.connections.set(connectionId, connection);

    return { authUrl, connectionId };
  }

  /**
   * Initiate Yodlee FastLink flow
   */
  private async initiateYodleeConnection(
    institutionId: string,
    _config: ConnectionConfig,
    connectionId: string
  ): Promise<{ authUrl: string; connectionId: string }> {
    // Yodlee uses FastLink for OAuth
    // Similar flow to Plaid but with Yodlee's API
    
    const authUrl = `https://yodlee.com/fastlink?institution_id=${institutionId}&connection_id=${connectionId}`;
    
    const connection: AccountConnection = {
      id: connectionId,
      institution: institutionId,
      provider: 'yodlee',
      status: 'syncing',
      accountIds: [],
      createdAt: new Date(),
    };
    this.connections.set(connectionId, connection);

    return { authUrl, connectionId };
  }

  /**
   * Initiate Schwab OAuth flow
   */
  private async initiateSchwabConnection(
    config: ConnectionConfig,
    connectionId: string
  ): Promise<{ authUrl: string; connectionId: string }> {
    // Schwab uses OAuth 2.0
    // Use the existing schwabService if available
    try {
      if (config.apiKey && config.apiSecret) {
        const authUrl = await schwabService.getAuthorizationUrl(config.redirectUri || window.location.origin);
        
        const connection: AccountConnection = {
          id: connectionId,
          institution: 'schwab',
          provider: 'schwab',
          status: 'syncing',
          accountIds: [],
          createdAt: new Date(),
        };
        this.connections.set(connectionId, connection);

        return { authUrl, connectionId };
      }
    } catch (error) {
      console.error('Schwab OAuth initiation failed:', error);
    }

    throw new Error('Schwab API credentials required');
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async completeConnection(
    connectionId: string,
    authCode: string,
    _state?: string
  ): Promise<AccountConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    try {
      switch (connection.provider) {
        case 'plaid':
          await this.completePlaidConnection(connectionId, authCode);
          break;
        
        case 'yodlee':
          await this.completeYodleeConnection(connectionId, authCode);
          break;
        
        case 'schwab':
          await this.completeSchwabConnection(connectionId, authCode);
          break;
      }

      connection.status = 'connected';
      connection.lastSynced = new Date();
      
      // Perform initial sync
      await this.syncAccounts(connectionId);

      return connection;
    } catch (error) {
      connection.status = 'error';
      connection.errorMessage = (error as Error).message;
      throw error;
    }
  }

  /**
   * Complete Plaid connection
   */
  private async completePlaidConnection(_connectionId: string, _publicToken: string): Promise<void> {
    // Exchange public token for access token
    // In real implementation, this would call Plaid API
    // For now, simulate success
    console.log('Completing Plaid connection');
  }

  /**
   * Complete Yodlee connection
   */
  private async completeYodleeConnection(_connectionId: string, _token: string): Promise<void> {
    // Complete Yodlee FastLink flow
    console.log('Completing Yodlee connection');
  }

  /**
   * Complete Schwab connection
   */
  private async completeSchwabConnection(_connectionId: string, authCode: string): Promise<void> {
    // Exchange authorization code for access token
    await schwabService.exchangeAuthorizationCode(authCode);
  }

  /**
   * Sync accounts from a connected institution
   */
  async syncAccounts(connectionId: string): Promise<SyncResult> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    if (connection.status !== 'connected') {
      throw new Error(`Connection not connected: ${connection.status}`);
    }

    try {
      connection.status = 'syncing';
      connection.lastSynced = new Date();

      let result: SyncResult;

      switch (connection.provider) {
        case 'plaid':
          result = await this.syncPlaidAccounts(connectionId);
          break;
        
        case 'yodlee':
          result = await this.syncYodleeAccounts(connectionId);
          break;
        
        case 'schwab':
          result = await this.syncSchwabAccounts(connectionId);
          break;
        
        default:
          throw new Error(`Unsupported provider: ${connection.provider}`);
      }

      connection.status = 'connected';
      return result;
    } catch (error) {
      connection.status = 'error';
      connection.errorMessage = (error as Error).message;
      throw error;
    }
  }

  /**
   * Sync accounts from Plaid
   */
  private async syncPlaidAccounts(_connectionId: string): Promise<SyncResult> {
    // Fetch accounts from Plaid API
    // In real implementation, this would:
    // 1. Call Plaid /accounts/get endpoint
    // 2. Transform Plaid accounts to our Account format
    // 3. Update or create accounts in our store
    
    return {
      success: true,
      accountsAdded: 0,
      accountsUpdated: 0,
      accountsRemoved: 0,
      transactionsImported: 0,
    };
  }

  /**
   * Sync accounts from Yodlee
   */
  private async syncYodleeAccounts(_connectionId: string): Promise<SyncResult> {
    // Similar to Plaid but using Yodlee API
    return {
      success: true,
      accountsAdded: 0,
      accountsUpdated: 0,
      accountsRemoved: 0,
      transactionsImported: 0,
    };
  }

  /**
   * Sync accounts from Schwab
   */
  private async syncSchwabAccounts(connectionId: string): Promise<SyncResult> {
    // Use existing schwabService
    try {
      const accounts = await schwabService.getAccounts();
      
      return {
        success: true,
        accountsAdded: accounts.length,
        accountsUpdated: 0,
        accountsRemoved: 0,
        transactionsImported: 0,
      };
    } catch (error) {
      return {
        success: false,
        accountsAdded: 0,
        accountsUpdated: 0,
        accountsRemoved: 0,
        transactionsImported: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Set up automatic syncing for a connection
   */
  setupAutoSync(connectionId: string, interval: 'daily' | 'weekly' | 'manual' = 'daily'): void {
    this.stopAutoSync(connectionId);

    if (interval === 'manual') return;

    const intervalMs = interval === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    const syncInterval = setInterval(() => {
      this.syncAccounts(connectionId).catch(error => {
        console.error(`Auto-sync failed for ${connectionId}:`, error);
      });
    }, intervalMs);

    this.syncIntervals.set(connectionId, syncInterval);
  }

  /**
   * Stop automatic syncing
   */
  stopAutoSync(connectionId: string): void {
    const interval = this.syncIntervals.get(connectionId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(connectionId);
    }
  }

  /**
   * Disconnect an account connection
   */
  async disconnect(connectionId: string): Promise<void> {
    this.stopAutoSync(connectionId);
    
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = 'disconnected';
      
      // In real implementation, would revoke tokens with provider
      // For now, just mark as disconnected
    }
  }

  /**
   * Get all connections
   */
  getConnections(): AccountConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get a specific connection
   */
  getConnection(connectionId: string): AccountConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Handle multi-factor authentication
   */
  async handleMFA(connectionId: string, _mfaResponse: string): Promise<AccountConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // In real implementation, would send MFA response to provider
    // For now, simulate success
    connection.status = 'connected';
    connection.lastSynced = new Date();

    return connection;
  }

  /**
   * Store encrypted credentials securely
   */
  private async storeCredentials(_connectionId: string, _credentials: unknown): Promise<void> {
    // In real implementation, would encrypt and store securely
    // For now, just log (credentials should never be stored in plain text)
    console.log('Storing encrypted credentials');
  }
}

export const accountAggregationService = AccountAggregationService.getInstance();
