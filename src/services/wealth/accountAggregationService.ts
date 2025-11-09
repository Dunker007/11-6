import { apiKeyService } from '../apiKeys/apiKeyService';
import type { Account, Transaction } from '@/types/wealth';

interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  balances: {
    available: number;
    current: number;
    limit?: number;
  };
}

interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  category_id?: string;
}

interface YodleeAccount {
  id: string;
  accountName: string;
  accountType: string;
  balance: {
    amount: number;
    currency: string;
  };
}

interface YodleeTransaction {
  id: string;
  accountId: string;
  amount: {
    amount: number;
    currency: string;
  };
  date: string;
  description: string;
  category: string;
}

export class AccountAggregationService {
  private static instance: AccountAggregationService;
  private provider: 'plaid' | 'yodlee' | null = null;
  private accessToken: string | null = null;

  private constructor() {
    this.loadCredentials();
  }

  static getInstance(): AccountAggregationService {
    if (!AccountAggregationService.instance) {
      AccountAggregationService.instance = new AccountAggregationService();
    }
    return AccountAggregationService.instance;
  }

  private loadCredentials(): void {
    try {
      // Check for Plaid
      const plaidKeys = apiKeyService.getKeysByProvider('plaid');
      if (plaidKeys.length > 0) {
        this.provider = 'plaid';
        this.accessToken = plaidKeys[0].key;
        return;
      }

      // Check for Yodlee
      const yodleeKeys = apiKeyService.getKeysByProvider('yodlee');
      if (yodleeKeys.length > 0) {
        this.provider = 'yodlee';
        this.accessToken = yodleeKeys[0].key;
      }
    } catch (error) {
      console.error('Failed to load aggregation service credentials:', error);
    }
  }

  isConfigured(): boolean {
    return !!this.provider && !!this.accessToken;
  }

  getProvider(): 'plaid' | 'yodlee' | null {
    return this.provider;
  }

  async connectPlaid(clientId: string, secret: string): Promise<boolean> {
    try {
      // Plaid uses Link flow - this is a placeholder
      // In production, implement Plaid Link integration
      const response = await fetch('https://production.plaid.com/link/token/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          secret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.provider = 'plaid';
        this.accessToken = data.access_token;
        if (this.accessToken) {
          await apiKeyService.addKey('plaid', this.accessToken, 'Plaid API', {
            clientId,
            secret,
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Plaid connection failed:', error);
      return false;
    }
  }

  async connectYodlee(clientId: string, secret: string): Promise<boolean> {
    try {
      // Yodlee uses FastLink - this is a placeholder
      // In production, implement Yodlee FastLink integration
      const response = await fetch('https://api.yodlee.com/ysl/authenticate/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Version': '1.1',
        },
        body: JSON.stringify({
          clientId,
          secret,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.provider = 'yodlee';
        this.accessToken = data.token?.accessToken;
        if (this.accessToken) {
          await apiKeyService.addKey('yodlee', this.accessToken, 'Yodlee API', {
            clientId,
            secret,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Yodlee connection failed:', error);
      return false;
    }
  }

  async getAccounts(): Promise<Account[]> {
    if (!this.isConfigured()) {
      throw new Error('Account aggregation service not configured');
    }

    try {
      if (this.provider === 'plaid') {
        return this.getPlaidAccounts();
      } else if (this.provider === 'yodlee') {
        return this.getYodleeAccounts();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      throw error;
    }
  }

  private async getPlaidAccounts(): Promise<Account[]> {
    const response = await fetch('https://production.plaid.com/accounts/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: this.accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Plaid API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.accounts.map((acc: PlaidAccount) => ({
      id: acc.account_id,
      name: acc.name,
      type: this.mapPlaidAccountType(acc.type, acc.subtype),
      institution: 'Plaid',
      balance: acc.balances.current,
      currency: 'USD',
      isConnected: true,
      connectionId: acc.account_id,
      createdAt: new Date(),
    }));
  }

  private async getYodleeAccounts(): Promise<Account[]> {
    const response = await fetch('https://api.yodlee.com/ysl/accounts', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Api-Version': '1.1',
      },
    });

    if (!response.ok) {
      throw new Error(`Yodlee API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.account.map((acc: YodleeAccount) => ({
      id: acc.id,
      name: acc.accountName,
      type: this.mapYodleeAccountType(acc.accountType),
      institution: 'Yodlee',
      balance: acc.balance.amount,
      currency: acc.balance.currency,
      isConnected: true,
      connectionId: acc.id,
      createdAt: new Date(),
    }));
  }

  async getTransactions(accountId: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
    if (!this.isConfigured()) {
      throw new Error('Account aggregation service not configured');
    }

    try {
      if (this.provider === 'plaid') {
        return this.getPlaidTransactions(accountId, startDate, endDate);
      } else if (this.provider === 'yodlee') {
        return this.getYodleeTransactions(accountId, startDate, endDate);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  }

  private async getPlaidTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    const response = await fetch('https://production.plaid.com/transactions/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: this.accessToken,
        account_ids: [accountId],
        start_date: startDate?.toISOString().split('T')[0] || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: endDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      }),
    });

    if (!response.ok) {
      throw new Error(`Plaid API error: ${response.statusText}`);
    }

    const data = await response.json() as { transactions: PlaidTransaction[] };
    return data.transactions.map((tx: PlaidTransaction) => ({
      id: tx.transaction_id,
      type: tx.amount < 0 ? 'expense' : 'income',
      amount: Math.abs(tx.amount),
      date: new Date(tx.date),
      category: this.mapPlaidCategory(tx.category?.[0] || 'other'),
      accountId: tx.account_id,
      description: tx.name,
      merchant: tx.merchant_name,
    }));
  }

  private async getYodleeTransactions(
    accountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({
      accountId,
    });
    if (startDate) params.append('fromDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('toDate', endDate.toISOString().split('T')[0]);

    const response = await fetch(`https://api.yodlee.com/ysl/transactions?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Api-Version': '1.1',
      },
    });

    if (!response.ok) {
      throw new Error(`Yodlee API error: ${response.statusText}`);
    }

    const data = await response.json() as { transaction: YodleeTransaction[] };
    return data.transaction.map((tx: YodleeTransaction) => ({
      id: tx.id,
      type: tx.amount.amount < 0 ? 'expense' : 'income',
      amount: Math.abs(tx.amount.amount),
      date: new Date(tx.date),
      category: this.mapYodleeCategory(tx.category || 'other'),
      accountId: tx.accountId,
      description: tx.description,
    }));
  }

  private mapPlaidAccountType(type: string, subtype: string): Account['type'] {
    if (type === 'depository') {
      if (subtype === 'checking') return 'checking';
      if (subtype === 'savings') return 'savings';
      return 'savings';
    }
    if (type === 'investment') return 'investment';
    if (type === 'credit') return 'credit_card';
    return 'other';
  }

  private mapYodleeAccountType(type: string): Account['type'] {
    const typeMap: Record<string, Account['type']> = {
      CHECKING: 'checking',
      SAVINGS: 'savings',
      CREDIT_CARD: 'credit_card',
      INVESTMENT: 'investment',
      RETIREMENT: 'retirement',
      LOAN: 'loan',
      MORTGAGE: 'mortgage',
    };
    return typeMap[type] || 'other';
  }

  private mapPlaidCategory(category: string): Transaction['category'] {
    // Map Plaid categories to our budget categories
    const categoryMap: Record<string, Transaction['category']> = {
      'Food and Drink': 'food',
      'Shops': 'shopping',
      'Transportation': 'transportation',
      'Travel': 'travel',
      'Recreation': 'entertainment',
      'Healthcare': 'healthcare',
      'Service': 'other',
      'General Merchandise': 'shopping',
      'Gas Stations': 'transportation',
      'Groceries': 'food',
      'Restaurants': 'food',
    };
    return categoryMap[category] || 'other';
  }

  private mapYodleeCategory(category: string): Transaction['category'] {
    // Map Yodlee categories to our budget categories
    const categoryMap: Record<string, Transaction['category']> = {
      'Food': 'food',
      'Shopping': 'shopping',
      'Transportation': 'transportation',
      'Travel': 'travel',
      'Entertainment': 'entertainment',
      'Healthcare': 'healthcare',
      'Utilities': 'utilities',
      'Housing': 'housing',
    };
    return categoryMap[category] || 'other';
  }
}

export const accountAggregationService = AccountAggregationService.getInstance();

