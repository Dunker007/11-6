import { apiKeyService } from '../apiKeys/apiKeyService';

interface SchwabAccount {
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
}

interface SchwabHolding {
  symbol: string;
  description: string;
  quantity: number;
  price: number;
  value: number;
  assetType: 'EQUITY' | 'ETF' | 'BOND' | 'MUTUAL_FUND' | 'OTHER';
}

interface SchwabTransaction {
  transactionId: string;
  date: string;
  type: string;
  amount: number;
  description: string;
}

export class SchwabService {
  private static instance: SchwabService;
  private baseUrl = 'https://api.schwabapi.com'; // Schwab API base URL
  private accessToken: string | null = null;

  private constructor() {
    this.loadCredentials();
  }

  static getInstance(): SchwabService {
    if (!SchwabService.instance) {
      SchwabService.instance = new SchwabService();
    }
    return SchwabService.instance;
  }

  private loadCredentials(): void {
    try {
      const keys = apiKeyService.getKeysByProvider('schwab');
      if (keys.length > 0) {
        this.accessToken = keys[0].key;
      }
    } catch (error) {
      console.error('Failed to load Schwab credentials:', error);
    }
  }

  isConfigured(): boolean {
    return !!this.accessToken;
  }

  async authenticate(apiKey: string, apiSecret: string): Promise<boolean> {
    try {
      // Schwab uses OAuth 2.0 - this is a placeholder for the actual OAuth flow
      // In production, implement full OAuth flow with redirect URI
      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: apiSecret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access_token;
        // Store credentials via API key service
        if (this.accessToken) {
          await apiKeyService.addKey('schwab', this.accessToken, 'Schwab API', {
            apiKey,
            apiSecret,
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Schwab authentication failed:', error);
      return false;
    }
  }

  private async authenticatedRequest<T>(endpoint: string, method: string = 'GET'): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Schwab API not authenticated');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Schwab API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getAccounts(): Promise<SchwabAccount[]> {
    try {
      const data = await this.authenticatedRequest<{ accounts: SchwabAccount[] }>('/accounts');
      return data.accounts || [];
    } catch (error) {
      console.error('Failed to fetch Schwab accounts:', error);
      throw error;
    }
  }

  async getAccountHoldings(accountNumber: string): Promise<SchwabHolding[]> {
    try {
      const data = await this.authenticatedRequest<{ holdings: SchwabHolding[] }>(
        `/accounts/${accountNumber}/holdings`
      );
      return data.holdings || [];
    } catch (error) {
      console.error('Failed to fetch Schwab holdings:', error);
      throw error;
    }
  }

  async getTransactions(accountNumber: string, startDate?: Date, endDate?: Date): Promise<SchwabTransaction[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

      const data = await this.authenticatedRequest<{ transactions: SchwabTransaction[] }>(
        `/accounts/${accountNumber}/transactions?${params.toString()}`
      );
      return data.transactions || [];
    } catch (error) {
      console.error('Failed to fetch Schwab transactions:', error);
      throw error;
    }
  }

  async syncAccount(accountNumber: string): Promise<{
    account: SchwabAccount;
    holdings: SchwabHolding[];
    transactions: SchwabTransaction[];
  }> {
    try {
      const [accountData, holdings, transactions] = await Promise.all([
        this.authenticatedRequest<SchwabAccount>(`/accounts/${accountNumber}`),
        this.getAccountHoldings(accountNumber),
        this.getTransactions(accountNumber),
      ]);

      return {
        account: accountData,
        holdings,
        transactions,
      };
    } catch (error) {
      console.error('Failed to sync Schwab account:', error);
      throw error;
    }
  }
}

export const schwabService = SchwabService.getInstance();

