/**
 * Import Service
 * 
 * Imports wealth data from various sources:
 * - CSV (transactions, positions)
 * - Mint exports
 * - Personal Capital exports
 * - Broker statements (PDF parsing)
 * - Crypto exchange exports
 */

import { wealthService } from './wealthService';
import type { Transaction, Asset } from '@/types/wealth';

export type ImportSource = 'csv' | 'mint' | 'personal_capital' | 'broker_statement' | 'crypto_exchange';

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  skipped: number;
  errorsList: Array<{
    row?: number;
    message: string;
  }>;
}

export interface CSVImportOptions {
  hasHeaders: boolean;
  dateFormat?: string;
  delimiter?: string;
  accountId?: string;
}

class ImportService {
  private static instance: ImportService;

  private constructor() {}

  static getInstance(): ImportService {
    if (!ImportService.instance) {
      ImportService.instance = new ImportService();
    }
    return ImportService.instance;
  }

  /**
   * Import from file
   */
  async importFromFile(
    file: File,
    source: ImportSource,
    options?: CSVImportOptions
  ): Promise<ImportResult> {
    const text = await file.text();
    
    switch (source) {
      case 'csv':
        return this.importFromCSV(text, options);
      case 'mint':
        return this.importFromMint(text);
      case 'personal_capital':
        return this.importFromPersonalCapital(text);
      case 'broker_statement':
        return this.importFromBrokerStatement(file);
      case 'crypto_exchange':
        return this.importFromCryptoExchange(text, file.name);
      default:
        throw new Error(`Unsupported import source: ${source}`);
    }
  }

  /**
   * Import from CSV
   */
  private async importFromCSV(text: string, options?: CSVImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: 0,
      skipped: 0,
      errorsList: [],
    };

    const delimiter = options?.delimiter || ',';
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      result.success = false;
      result.errorsList.push({ message: 'CSV file is empty' });
      return result;
    }

    let startIndex = 0;
    let headers: string[] = [];

    if (options?.hasHeaders !== false && lines.length > 0) {
      headers = this.parseCSVLine(lines[0], delimiter);
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], delimiter);
        const row = headers.length > 0 
          ? this.mapCSVRowToObject(headers, values)
          : this.mapCSVRowToObjectByPosition(values);

        // Determine if it's a transaction or asset
        if (this.isTransactionRow(row)) {
          const transaction = this.parseTransactionRow(row, options);
          if (transaction) {
            wealthService.addTransaction(transaction);
            result.imported++;
          } else {
            result.skipped++;
          }
        } else if (this.isAssetRow(row)) {
          const asset = this.parseAssetRow(row);
          if (asset) {
            wealthService.addAsset(asset);
            result.imported++;
          } else {
            result.skipped++;
          }
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors++;
        result.errorsList.push({
          row: i + 1,
          message: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Import from Mint export
   */
  private async importFromMint(text: string): Promise<ImportResult> {
    // Mint exports are CSV format with specific columns
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: 0,
      skipped: 0,
      errorsList: [],
    };

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      result.success = false;
      result.errorsList.push({ message: 'Invalid Mint export format' });
      return result;
    }

    // Mint CSV format: Date, Description, Original Description, Amount, Transaction Type, Category, Account Name, Labels, Notes
    const headers = this.parseCSVLine(lines[0], ',');

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], ',');
        const row = this.mapCSVRowToObject(headers, values);

        const date = this.parseDate(row.Date || row.date);
        const amount = parseFloat(row.Amount || row.amount || '0');
        const type = (row['Transaction Type'] || row.transaction_type || '').toLowerCase();
        const category = row.Category || row.category || 'other';
        const description = row.Description || row.description || '';
        const accountName = row['Account Name'] || row.account_name || '';

        // Find or create account
        let accountId = this.findAccountByName(accountName);
        if (!accountId && accountName) {
          const account = wealthService.addAccount({
            name: accountName,
            type: 'checking',
            institution: 'Mint Import',
            balance: 0,
            currency: 'USD',
            isConnected: false,
          });
          accountId = account.id;
        }

        if (!accountId) {
          result.skipped++;
          continue;
        }

        const transaction: Transaction = {
          id: crypto.randomUUID(),
          type: type.includes('credit') || amount > 0 ? 'income' : 'expense',
          amount: Math.abs(amount),
          date: date || new Date(),
          category: this.mapMintCategory(category) as 'food' | 'shopping' | 'transportation' | 'utilities' | 'entertainment' | 'travel' | 'healthcare' | 'education' | 'personal_care' | 'gifts' | 'investments' | 'savings' | 'other',
          accountId,
          description,
        };

        wealthService.addTransaction(transaction);
        result.imported++;
      } catch (error) {
        result.errors++;
        result.errorsList.push({
          row: i + 1,
          message: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Import from Personal Capital export
   */
  private async importFromPersonalCapital(text: string): Promise<ImportResult> {
    // Personal Capital exports are CSV format
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: 0,
      skipped: 0,
      errorsList: [],
    };

    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      result.success = false;
      result.errorsList.push({ message: 'Invalid Personal Capital export format' });
      return result;
    }

    // Personal Capital format may vary, try to detect columns
    const headers = this.parseCSVLine(lines[0], ',');

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], ',');
        const row = this.mapCSVRowToObject(headers, values);

        // Try to find date, amount, description columns
        const date = this.findDateColumn(row);
        const amount = this.findAmountColumn(row);
        const description = this.findDescriptionColumn(row);
        const accountName = this.findAccountColumn(row);

        if (!date || amount === null) {
          result.skipped++;
          continue;
        }

        let accountId = accountName ? this.findAccountByName(accountName) : undefined;
        if (!accountId && accountName) {
          const account = wealthService.addAccount({
            name: accountName,
            type: 'checking',
            institution: 'Personal Capital Import',
            balance: 0,
            currency: 'USD',
            isConnected: false,
          });
          accountId = account.id;
        }

        if (!accountId) {
          result.skipped++;
          continue;
        }

        const transaction: Transaction = {
          id: crypto.randomUUID(),
          type: amount > 0 ? 'income' : 'expense',
          amount: Math.abs(amount),
          date,
          category: 'other',
          accountId,
          description: description || '',
        };

        wealthService.addTransaction(transaction);
        result.imported++;
      } catch (error) {
        result.errors++;
        result.errorsList.push({
          row: i + 1,
          message: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Import from broker statement (PDF)
   */
  private async importFromBrokerStatement(_file: File): Promise<ImportResult> {
    // PDF parsing would require a library like pdf-parse
    // For now, return error suggesting CSV export
    return {
      success: false,
      imported: 0,
      errors: 0,
      skipped: 0,
      errorsList: [{
        message: 'PDF parsing not yet implemented. Please export your broker statement to CSV format.',
      }],
    };
  }

  /**
   * Import from crypto exchange export
   */
  private async importFromCryptoExchange(text: string, filename: string): Promise<ImportResult> {
    // Crypto exchanges typically export CSV
    // Format varies by exchange (Coinbase, Binance, Kraken, etc.)
    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: 0,
      skipped: 0,
      errorsList: [],
    };

    // Try to detect exchange type from filename
    const exchangeType = this.detectExchangeType(filename);

    // Parse as CSV
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      result.success = false;
      result.errorsList.push({ message: 'Invalid crypto exchange export format' });
      return result;
    }

    const headers = this.parseCSVLine(lines[0], ',');

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i], ',');
        const row = this.mapCSVRowToObject(headers, values);

        // Parse transaction based on exchange type
        const transaction = this.parseCryptoTransaction(row, exchangeType);
        if (transaction) {
          wealthService.addTransaction(transaction);
          result.imported++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors++;
        result.errorsList.push({
          row: i + 1,
          message: (error as Error).message,
        });
      }
    }

    return result;
  }

  /**
   * Helper methods
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private mapCSVRowToObject(headers: string[], values: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  }

  private mapCSVRowToObjectByPosition(values: string[]): Record<string, string> {
    // Default column mapping if no headers
    const defaultHeaders = ['date', 'description', 'amount', 'category', 'account'];
    return this.mapCSVRowToObject(defaultHeaders, values);
  }

  private isTransactionRow(row: Record<string, string>): boolean {
    const keys = Object.keys(row).map(k => k.toLowerCase());
    return keys.some(k => 
      k.includes('date') && 
      (k.includes('amount') || k.includes('price')) &&
      (k.includes('description') || k.includes('memo') || k.includes('note'))
    );
  }

  private isAssetRow(row: Record<string, string>): boolean {
    const keys = Object.keys(row).map(k => k.toLowerCase());
    return keys.some(k => 
      (k.includes('symbol') || k.includes('ticker')) &&
      (k.includes('quantity') || k.includes('shares') || k.includes('amount'))
    );
  }

  private parseTransactionRow(row: Record<string, string>, options?: CSVImportOptions): Transaction | null {
    try {
      const date = this.findDateColumn(row) || new Date();
      const amount = this.findAmountColumn(row);
      const description = this.findDescriptionColumn(row) || '';
      const category = this.findCategoryColumn(row) || 'other';
      const accountId = options?.accountId || this.findAccountColumn(row) || '';

      if (amount === null || !accountId) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        type: amount > 0 ? 'income' : 'expense',
        amount: Math.abs(amount),
        date,
        category: this.mapCategory(category) as 'food' | 'shopping' | 'transportation' | 'utilities' | 'entertainment' | 'travel' | 'healthcare' | 'education' | 'personal_care' | 'gifts' | 'investments' | 'savings' | 'other',
        accountId,
        description,
      };
    } catch (error) {
      return null;
    }
  }

  private parseAssetRow(row: Record<string, string>): Asset | null {
    try {
      const symbol = this.findSymbolColumn(row);
      const quantity = this.findQuantityColumn(row);
      const purchasePrice = this.findPurchasePriceColumn(row);
      const currentPrice = this.findCurrentPriceColumn(row);

      if (!symbol || quantity === null) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        name: symbol,
        type: 'stock', // Default, could be enhanced
        symbol,
        quantity,
        purchasePrice: purchasePrice || undefined,
        currentPrice: currentPrice || purchasePrice || undefined,
        value: (currentPrice || purchasePrice || 0) * quantity,
        purchaseDate: this.findDateColumn(row) || new Date(),
      };
    } catch (error) {
      return null;
    }
  }

  private findDateColumn(row: Record<string, string>): Date | null {
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes('date') && value) {
        const date = this.parseDate(value);
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return null;
  }

  private findAmountColumn(row: Record<string, string>): number | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('amount') || key.toLowerCase().includes('price')) && value) {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return null;
  }

  private findDescriptionColumn(row: Record<string, string>): string | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('description') || 
           key.toLowerCase().includes('memo') || 
           key.toLowerCase().includes('note')) && value) {
        return value;
      }
    }
    return null;
  }

  private findCategoryColumn(row: Record<string, string>): string | null {
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes('category') && value) {
        return value;
      }
    }
    return null;
  }

  private findAccountColumn(row: Record<string, string>): string | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('account') || key.toLowerCase().includes('bank')) && value) {
        return value;
      }
    }
    return null;
  }

  private findSymbolColumn(row: Record<string, string>): string | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('symbol') || key.toLowerCase().includes('ticker')) && value) {
        return value.toUpperCase();
      }
    }
    return null;
  }

  private findQuantityColumn(row: Record<string, string>): number | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('quantity') || 
           key.toLowerCase().includes('shares') || 
           key.toLowerCase().includes('amount')) && value) {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return null;
  }

  private findPurchasePriceColumn(row: Record<string, string>): number | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('purchase') || 
           key.toLowerCase().includes('cost') || 
           key.toLowerCase().includes('basis')) && value) {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return null;
  }

  private findCurrentPriceColumn(row: Record<string, string>): number | null {
    for (const [key, value] of Object.entries(row)) {
      if ((key.toLowerCase().includes('current') || 
           key.toLowerCase().includes('price') || 
           key.toLowerCase().includes('value')) && value) {
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    return null;
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;

    // Try various date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        } else {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }
    }

    // Try native Date parsing
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  }

  private mapMintCategory(category: string): string {
    // Map Mint categories to our categories
    const categoryMap: Record<string, string> = {
      'Food & Dining': 'food',
      'Shopping': 'shopping',
      'Transportation': 'transportation',
      'Bills & Utilities': 'utilities',
      'Entertainment': 'entertainment',
      'Travel': 'travel',
      'Healthcare': 'healthcare',
      'Education': 'education',
      'Personal Care': 'personal_care',
      'Gifts & Donations': 'gifts',
      'Investments': 'investments',
      'Income': 'savings',
    };

    return categoryMap[category] || 'other';
  }

  private mapCategory(category: string): string {
    // Map generic categories
    const lower = category.toLowerCase();
    if (lower.includes('food') || lower.includes('dining') || lower.includes('restaurant')) {
      return 'food';
    }
    if (lower.includes('shopping') || lower.includes('retail')) {
      return 'shopping';
    }
    if (lower.includes('transport') || lower.includes('gas') || lower.includes('fuel')) {
      return 'transportation';
    }
    if (lower.includes('utility') || lower.includes('bill')) {
      return 'utilities';
    }
    if (lower.includes('entertainment') || lower.includes('movie') || lower.includes('streaming')) {
      return 'entertainment';
    }
    if (lower.includes('travel') || lower.includes('hotel') || lower.includes('flight')) {
      return 'travel';
    }
    if (lower.includes('health') || lower.includes('medical') || lower.includes('pharmacy')) {
      return 'healthcare';
    }
    if (lower.includes('education') || lower.includes('school') || lower.includes('tuition')) {
      return 'education';
    }
    if (lower.includes('personal') || lower.includes('care') || lower.includes('gym')) {
      return 'personal_care';
    }
    if (lower.includes('gift') || lower.includes('donation') || lower.includes('charity')) {
      return 'gifts';
    }
    if (lower.includes('investment') || lower.includes('stock') || lower.includes('crypto')) {
      return 'investments';
    }
    if (lower.includes('income') || lower.includes('salary') || lower.includes('paycheck')) {
      return 'savings';
    }

    return 'other';
  }

  private findAccountByName(name: string): string | undefined {
    const accounts = wealthService.getAccounts();
    const account = accounts.find(acc => 
      acc.name.toLowerCase() === name.toLowerCase() ||
      acc.institution.toLowerCase() === name.toLowerCase()
    );
    return account?.id;
  }

  private detectExchangeType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.includes('coinbase')) return 'coinbase';
    if (lower.includes('binance')) return 'binance';
    if (lower.includes('kraken')) return 'kraken';
    if (lower.includes('gemini')) return 'gemini';
    if (lower.includes('kucoin')) return 'kucoin';
    return 'generic';
  }

  private parseCryptoTransaction(row: Record<string, string>, exchangeType: string): Transaction | null {
    try {
      const date = this.findDateColumn(row) || new Date();
      const amount = this.findAmountColumn(row);
      const description = this.findDescriptionColumn(row) || `Crypto ${exchangeType}`;

      if (amount === null) {
        return null;
      }

      // Create or find crypto account
      let accountId = this.findAccountByName(`Crypto ${exchangeType}`);
      if (!accountId) {
        const account = wealthService.addAccount({
          name: `Crypto ${exchangeType}`,
          type: 'investment',
          institution: exchangeType,
          balance: 0,
          currency: 'USD',
          isConnected: false,
        });
        accountId = account.id;
      }

      return {
        id: crypto.randomUUID(),
        type: amount > 0 ? 'income' : 'expense',
        amount: Math.abs(amount),
        date,
        category: 'investments',
        accountId,
        description,
      };
    } catch (error) {
      return null;
    }
  }
}

export const importService = ImportService.getInstance();

