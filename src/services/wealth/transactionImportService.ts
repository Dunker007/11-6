/**
 * Transaction Import Service
 * 
 * Auto-imports transactions from connected accounts
 * Categorizes transactions using ML/rules engine
 * Matches transactions to budgets
 * Handles duplicate detection
 */

import { wealthService } from './wealthService';
import { accountAggregationService } from './accountAggregationService';
import type { Transaction, BudgetCategory, TransactionRule, Merchant } from '@/types/wealth';

export interface ImportedTransaction {
  id?: string;
  date: Date;
  amount: number;
  description: string;
  merchant?: string;
  accountId: string;
  category?: BudgetCategory;
  tags?: string[];
  notes?: string;
  isDuplicate?: boolean;
  duplicateOf?: string;
}

export interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  categorized: number;
  uncategorized: number;
  transactions: ImportedTransaction[];
}

class TransactionImportService {
  private static instance: TransactionImportService;
  private merchants: Map<string, Merchant> = new Map();
  private rules: TransactionRule[] = [];
  private duplicateThreshold = 24 * 60 * 60 * 1000; // 24 hours
  private amountTolerance = 0.01; // $0.01 tolerance for duplicate detection

  private constructor() {
    this.loadMerchants();
    this.loadRules();
  }

  static getInstance(): TransactionImportService {
    if (!TransactionImportService.instance) {
      TransactionImportService.instance = new TransactionImportService();
    }
    return TransactionImportService.instance;
  }

  /**
   * Load merchants from storage
   */
  private loadMerchants(): void {
    try {
      const stored = localStorage.getItem('wealth_merchants');
      if (stored) {
        const merchants: Merchant[] = JSON.parse(stored);
        merchants.forEach(merchant => {
          this.merchants.set(merchant.id, merchant);
        });
      }
    } catch (error) {
      console.error('Failed to load merchants:', error);
    }
  }

  /**
   * Load transaction rules from storage
   */
  private loadRules(): void {
    try {
      const stored = localStorage.getItem('wealth_transaction_rules');
      if (stored) {
        this.rules = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load transaction rules:', error);
    }
  }

  /**
   * Save merchants to storage
   */
  private saveMerchants(): void {
    try {
      localStorage.setItem('wealth_merchants', JSON.stringify(Array.from(this.merchants.values())));
    } catch (error) {
      console.error('Failed to save merchants:', error);
    }
  }

  /**
   * Save rules to storage
   */
  private saveRules(): void {
    try {
      localStorage.setItem('wealth_transaction_rules', JSON.stringify(this.rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  }

  /**
   * Import transactions from a connected account
   */
  async importFromAccount(connectionId: string, startDate?: Date, endDate?: Date): Promise<ImportResult> {
    const connection = accountAggregationService.getConnection(connectionId);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    // In real implementation, would fetch transactions from provider API
    // For now, simulate import
    const rawTransactions: ImportedTransaction[] = [];

    // Transform provider transactions to our format
    // This would be provider-specific (Plaid, Yodlee, Schwab)
    const transformed = rawTransactions.map(tx => this.transformTransaction(tx, connection.accountIds[0]));

    // Process transactions
    return this.processTransactions(transformed, connection.accountIds[0]);
  }

  /**
   * Transform provider transaction to our format
   */
  private transformTransaction(
    rawTx: any,
    accountId: string
  ): ImportedTransaction {
    return {
      date: new Date(rawTx.date),
      amount: rawTx.amount || 0,
      description: rawTx.description || rawTx.name || '',
      merchant: rawTx.merchant || rawTx.name,
      accountId,
      category: undefined, // Will be categorized
    };
  }

  /**
   * Process imported transactions
   */
  async processTransactions(
    transactions: ImportedTransaction[],
    accountId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      categorized: 0,
      uncategorized: 0,
      transactions: [],
    };

    // Get existing transactions for duplicate detection
    const existingTransactions = wealthService.getTransactions(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      new Date(),
      accountId
    );

    for (const tx of transactions) {
      try {
        // Check for duplicates
        const duplicate = this.findDuplicate(tx, existingTransactions);
        if (duplicate) {
          tx.isDuplicate = true;
          tx.duplicateOf = duplicate.id;
          result.duplicates++;
          continue;
        }

        // Categorize transaction
        const categorized = this.categorizeTransaction(tx);
        if (categorized.category) {
          result.categorized++;
        } else {
          result.uncategorized++;
        }

        // Recognize merchant
        const merchant = this.recognizeMerchant(tx);
        if (merchant) {
          tx.merchant = merchant.name;
          if (!categorized.category) {
            tx.category = merchant.defaultCategory;
          }
        }

        // Create transaction
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          type: tx.amount < 0 ? 'expense' : 'income',
          amount: Math.abs(tx.amount),
          date: tx.date,
          category: categorized.category || 'other',
          accountId: tx.accountId,
          description: tx.description,
          merchant: tx.merchant,
          tags: categorized.tags || tx.tags,
          notes: categorized.notes || tx.notes,
        };

        wealthService.addTransaction(transaction);
        result.imported++;
        result.transactions.push(tx);
      } catch (error) {
        console.error('Error processing transaction:', error);
        result.errors++;
      }
    }

    return result;
  }

  /**
   * Find duplicate transaction
   */
  private findDuplicate(
    tx: ImportedTransaction,
    existing: Transaction[]
  ): Transaction | undefined {
    return existing.find(existingTx => {
      const timeDiff = Math.abs(tx.date.getTime() - existingTx.date.getTime());
      const amountDiff = Math.abs(Math.abs(tx.amount) - existingTx.amount);

      return (
        timeDiff < this.duplicateThreshold &&
        amountDiff < this.amountTolerance &&
        tx.description.toLowerCase() === existingTx.description.toLowerCase()
      );
    });
  }

  /**
   * Categorize transaction using rules engine
   */
  private categorizeTransaction(tx: ImportedTransaction): {
    category?: BudgetCategory;
    tags?: string[];
    notes?: string;
  } {
    // Sort rules by priority (higher priority first)
    const sortedRules = [...this.rules]
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.matchesRule(tx, rule)) {
        return {
          category: rule.action.category,
          tags: rule.action.tags,
          notes: rule.action.notes,
        };
      }
    }

    return {};
  }

  /**
   * Check if transaction matches a rule
   */
  private matchesRule(tx: ImportedTransaction, rule: TransactionRule): boolean {
    const { condition } = rule;
    let value: string | number;

    switch (condition.field) {
      case 'merchant':
        value = tx.merchant || '';
        break;
      case 'description':
        value = tx.description || '';
        break;
      case 'amount':
        value = Math.abs(tx.amount);
        break;
      case 'account':
        value = tx.accountId;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'contains':
        return typeof value === 'string' && 
               value.toLowerCase().includes(String(condition.value).toLowerCase());
      case 'equals':
        return value === condition.value;
      case 'startsWith':
        return typeof value === 'string' && 
               value.toLowerCase().startsWith(String(condition.value).toLowerCase());
      case 'endsWith':
        return typeof value === 'string' && 
               value.toLowerCase().endsWith(String(condition.value).toLowerCase());
      case 'greaterThan':
        return typeof value === 'number' && value > Number(condition.value);
      case 'lessThan':
        return typeof value === 'number' && value < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Recognize merchant from transaction
   */
  private recognizeMerchant(tx: ImportedTransaction): Merchant | undefined {
    const description = (tx.description || '').toLowerCase();
    const merchantName = (tx.merchant || '').toLowerCase();

    // Check exact matches
    for (const merchant of this.merchants.values()) {
      if (merchant.name.toLowerCase() === merchantName) {
        return merchant;
      }
      if (merchant.aliases.some(alias => alias.toLowerCase() === merchantName)) {
        return merchant;
      }
    }

    // Check partial matches
    for (const merchant of this.merchants.values()) {
      if (description.includes(merchant.name.toLowerCase())) {
        return merchant;
      }
      if (merchant.aliases.some(alias => description.includes(alias.toLowerCase()))) {
        return merchant;
      }
    }

    return undefined;
  }

  /**
   * Add or update merchant
   */
  addMerchant(merchant: Omit<Merchant, 'id'>): Merchant {
    const existing = Array.from(this.merchants.values()).find(
      m => m.name.toLowerCase() === merchant.name.toLowerCase()
    );

    if (existing) {
      // Update existing
      const updated: Merchant = {
        ...existing,
        ...merchant,
      };
      this.merchants.set(existing.id, updated);
      this.saveMerchants();
      return updated;
    }

    // Create new
    const newMerchant: Merchant = {
      ...merchant,
      id: crypto.randomUUID(),
    };
    this.merchants.set(newMerchant.id, newMerchant);
    this.saveMerchants();
    return newMerchant;
  }

  /**
   * Add transaction rule
   */
  addRule(rule: Omit<TransactionRule, 'id' | 'createdAt' | 'updatedAt'>): TransactionRule {
    const newRule: TransactionRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.push(newRule);
    this.saveRules();
    return newRule;
  }

  /**
   * Update transaction rule
   */
  updateRule(ruleId: string, updates: Partial<TransactionRule>): TransactionRule | null {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index < 0) return null;

    const updated: TransactionRule = {
      ...this.rules[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.rules[index] = updated;
    this.saveRules();
    return updated;
  }

  /**
   * Delete transaction rule
   */
  deleteRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index < 0) return false;

    this.rules.splice(index, 1);
    this.saveRules();
    return true;
  }

  /**
   * Get all merchants
   */
  getMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  /**
   * Get all rules
   */
  getRules(): TransactionRule[] {
    return [...this.rules];
  }

  /**
   * Detect recurring transactions
   */
  detectRecurringTransactions(accountId: string): Array<{
    pattern: {
      amount: number;
      merchant?: string;
      description?: string;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    };
    occurrences: number;
    lastOccurrence: Date;
    nextExpected?: Date;
  }> {
    const transactions = wealthService.getTransactions(
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
      new Date(),
      accountId
    );

    // Group by merchant and amount
    const groups = new Map<string, Transaction[]>();
    transactions.forEach(tx => {
      const key = `${tx.merchant || tx.description}_${tx.amount}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(tx);
    });

    const recurring: Array<{
      pattern: {
        amount: number;
        merchant?: string;
        description?: string;
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      };
      occurrences: number;
      lastOccurrence: Date;
      nextExpected?: Date;
    }> = [];

    groups.forEach((txs, key) => {
      if (txs.length < 3) return; // Need at least 3 occurrences

      // Sort by date
      txs.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Calculate average interval
      const intervals: number[] = [];
      for (let i = 1; i < txs.length; i++) {
        intervals.push(txs[i].date.getTime() - txs[i - 1].date.getTime());
      }
      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

      // Determine frequency
      let frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      const days = avgInterval / (1000 * 60 * 60 * 24);
      if (days <= 2) {
        frequency = 'daily';
      } else if (days <= 10) {
        frequency = 'weekly';
      } else if (days <= 40) {
        frequency = 'monthly';
      } else {
        frequency = 'yearly';
      }

      const lastTx = txs[txs.length - 1];
      const nextExpected = new Date(lastTx.date.getTime() + avgInterval);

      recurring.push({
        pattern: {
          amount: txs[0].amount,
          merchant: txs[0].merchant,
          description: txs[0].description,
          frequency,
        },
        occurrences: txs.length,
        lastOccurrence: lastTx.date,
        nextExpected,
      });
    });

    return recurring;
  }
}

export const transactionImportService = TransactionImportService.getInstance();

