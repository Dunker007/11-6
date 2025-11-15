/**
 * Export Service
 * 
 * Exports wealth data to various formats:
 * - CSV (transactions, assets, net worth history)
 * - Excel (comprehensive reports)
 * - PDF (formatted reports, tax documents)
 * - Tax reports (1099-B, Schedule D)
 */

import { wealthService } from './wealthService';
import { taxReportingService } from './taxReportingService';
import { dividendTrackingService } from './dividendTrackingService';
import type { Asset, Transaction, NetWorthHistory, Budget, NetWorth } from '@/types/wealth';

// Type definitions for tax and dividend exports
export interface TaxReport {
  year: number;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOwed: number;
  refund: number;
  filingStatus: 'single' | 'married' | 'head' | 'widow';
  forms: Form1099BEntry[];
}

export interface Form1099BEntry {
  symbol: string;
  description: string;
  dateAcquired: Date;
  dateSold: Date;
  proceeds: number;
  costBasis: number;
  gainLoss: number;
  shortTerm: boolean;
}

export interface DividendSummary {
  year: number;
  totalDividends: number;
  qualifiedDividends: number;
  nonQualifiedDividends: number;
  foreignTaxPaid: number;
  entries: DividendCalendarEntry[];
}

export interface DividendCalendarEntry {
  date: Date;
  symbol: string;
  amount: number;
  type: 'qualified' | 'non-qualified' | 'return-of-capital';
  foreignTaxWithheld?: number;
}

export type ExportFormat = 'csv' | 'excel' | 'pdf';
export type ExportType = 
  | 'transactions'
  | 'assets'
  | 'net_worth_history'
  | 'budget'
  | 'tax_report'
  | 'dividend_report'
  | 'portfolio_report';

export interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  startDate?: Date;
  endDate?: Date;
  year?: number; // For tax reports
  includeHeaders?: boolean;
}

class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export data based on options
   */
  async export(options: ExportOptions): Promise<Blob> {
    switch (options.type) {
      case 'transactions':
        return this.exportTransactions(options);
      case 'assets':
        return this.exportAssets(options);
      case 'net_worth_history':
        return this.exportNetWorthHistory(options);
      case 'budget':
        return this.exportBudget(options);
      case 'tax_report':
        return this.exportTaxReport(options);
      case 'dividend_report':
        return this.exportDividendReport(options);
      case 'portfolio_report':
        return this.exportPortfolioReport(options);
      default:
        throw new Error(`Unsupported export type: ${options.type}`);
    }
  }

  /**
   * Export transactions to CSV/Excel
   */
  private async exportTransactions(options: ExportOptions): Promise<Blob> {
    const transactions = wealthService.getTransactions(options.startDate, options.endDate);
    
    if (options.format === 'csv') {
      return this.toCSV(
        transactions.map(tx => ({
          Date: tx.date.toISOString().split('T')[0],
          Type: tx.type,
          Amount: tx.amount.toFixed(2),
          Category: tx.category,
          Description: tx.description,
          Merchant: tx.merchant || '',
          Account: tx.accountId,
          Tags: tx.tags?.join(', ') || '',
          Notes: tx.notes || '',
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Transactions',
        transactions.map(tx => ({
          Date: tx.date.toISOString().split('T')[0],
          Type: tx.type,
          Amount: tx.amount,
          Category: tx.category,
          Description: tx.description,
          Merchant: tx.merchant || '',
          Account: tx.accountId,
          Tags: tx.tags?.join(', ') || '',
          Notes: tx.notes || '',
        }))
      );
    } else {
      return this.toPDF('Transactions Report', this.formatTransactionsForPDF(transactions));
    }
  }

  /**
   * Export assets to CSV/Excel
   */
  private async exportAssets(options: ExportOptions): Promise<Blob> {
    const assets = wealthService.getAssets();
    
    if (options.format === 'csv') {
      return this.toCSV(
        assets.map(asset => ({
          Name: asset.name,
          Type: asset.type,
          Symbol: asset.symbol || '',
          Quantity: asset.quantity?.toFixed(2) || '',
          Purchase_Price: asset.purchasePrice?.toFixed(2) || '',
          Current_Price: asset.currentPrice?.toFixed(2) || '',
          Value: asset.value.toFixed(2),
          Purchase_Date: asset.purchaseDate?.toISOString().split('T')[0] || '',
          Exchange: asset.exchange || '',
          Country: asset.country || '',
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Assets',
        assets.map(asset => ({
          Name: asset.name,
          Type: asset.type,
          Symbol: asset.symbol || '',
          Quantity: asset.quantity || 0,
          Purchase_Price: asset.purchasePrice || 0,
          Current_Price: asset.currentPrice || 0,
          Value: asset.value,
          Purchase_Date: asset.purchaseDate?.toISOString().split('T')[0] || '',
          Exchange: asset.exchange || '',
          Country: asset.country || '',
        }))
      );
    } else {
      return this.toPDF('Assets Report', this.formatAssetsForPDF(assets));
    }
  }

  /**
   * Export net worth history
   */
  private async exportNetWorthHistory(options: ExportOptions): Promise<Blob> {
    const history = wealthService.getNetWorthHistory();
    const filtered = options.startDate && options.endDate
      ? history.filter(h => h.date >= options.startDate! && h.date <= options.endDate!)
      : history;

    if (options.format === 'csv') {
      return this.toCSV(
        filtered.map(h => ({
          Date: h.date.toISOString().split('T')[0],
          Net_Worth: h.netWorth.toFixed(2),
          Assets: h.assets.toFixed(2),
          Liabilities: h.liabilities.toFixed(2),
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Net Worth History',
        filtered.map(h => ({
          Date: h.date.toISOString().split('T')[0],
          Net_Worth: h.netWorth,
          Assets: h.assets,
          Liabilities: h.liabilities,
        }))
      );
    } else {
      return this.toPDF('Net Worth History', this.formatNetWorthHistoryForPDF(filtered));
    }
  }

  /**
   * Export budget
   */
  private async exportBudget(options: ExportOptions): Promise<Blob> {
    const now = new Date();
    const month = options.startDate?.getMonth() || now.getMonth() + 1;
    const year = options.startDate?.getFullYear() || now.getFullYear();
    
    const budget = wealthService.getBudget(month, year);
    if (!budget) {
      throw new Error(`Budget not found for ${month}/${year}`);
    }

    const budgetVsActual = wealthService.getBudgetVsActual(month, year, budget.name);

    if (options.format === 'csv') {
      return this.toCSV(
        Object.entries(budgetVsActual).map(([category, data]) => ({
          Category: category,
          Budgeted: data.budgeted.toFixed(2),
          Actual: data.actual.toFixed(2),
          Remaining: data.remaining.toFixed(2),
          Percent_Used: data.percentUsed.toFixed(2),
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Budget',
        Object.entries(budgetVsActual).map(([category, data]) => ({
          Category: category,
          Budgeted: data.budgeted,
          Actual: data.actual,
          Remaining: data.remaining,
          Percent_Used: data.percentUsed,
        }))
      );
    } else {
      return this.toPDF('Budget Report', this.formatBudgetForPDF(budget, budgetVsActual));
    }
  }

  /**
   * Export tax report (1099-B style)
   */
  private async exportTaxReport(options: ExportOptions): Promise<Blob> {
    if (!options.year) {
      throw new Error('Year required for tax report');
    }

    const report = taxReportingService.generateTaxReport(options.year);
    const form1099B = taxReportingService.generate1099BReport(options.year);

    if (options.format === 'csv') {
      return this.toCSV(
        form1099B.map(entry => ({
          Description: entry.description,
          Date_Acquired: entry.dateAcquired.toISOString().split('T')[0],
          Date_Sold: entry.dateSold.toISOString().split('T')[0],
          Proceeds: entry.proceeds.toFixed(2),
          Cost_Basis: entry.costBasis.toFixed(2),
          Gain_Loss: entry.gainLoss.toFixed(2),
          Short_Term: entry.shortTerm ? 'Yes' : 'No',
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Tax Report',
        form1099B.map(entry => ({
          Description: entry.description,
          Date_Acquired: entry.dateAcquired.toISOString().split('T')[0],
          Date_Sold: entry.dateSold.toISOString().split('T')[0],
          Proceeds: entry.proceeds,
          Cost_Basis: entry.costBasis,
          Gain_Loss: entry.gainLoss,
          Short_Term: entry.shortTerm,
        }))
      );
    } else {
      return this.toPDF('Tax Report', this.formatTaxReportForPDF(report, form1099B));
    }
  }

  /**
   * Export dividend report
   */
  private async exportDividendReport(options: ExportOptions): Promise<Blob> {
    const startDate = options.startDate || new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = options.endDate || new Date();

    const summary = await dividendTrackingService.getDividendSummary(startDate, endDate);
    const calendar = await dividendTrackingService.getDividendCalendar(startDate, endDate);

    if (options.format === 'csv') {
      return this.toCSV(
        calendar.map(entry => ({
          Payment_Date: entry.paymentDate.toISOString().split('T')[0],
          Ex_Dividend_Date: entry.exDividendDate.toISOString().split('T')[0],
          Symbol: entry.symbol,
          Asset_Name: entry.assetName,
          Amount_Per_Share: entry.amount.toFixed(4),
          Total_Amount: entry.totalAmount.toFixed(2),
          Quantity: entry.quantity.toFixed(2),
          Qualified: entry.qualified ? 'Yes' : 'No',
        })),
        options.includeHeaders !== false
      );
    } else if (options.format === 'excel') {
      return this.toExcel(
        'Dividend Report',
        calendar.map(entry => ({
          Payment_Date: entry.paymentDate.toISOString().split('T')[0],
          Ex_Dividend_Date: entry.exDividendDate.toISOString().split('T')[0],
          Symbol: entry.symbol,
          Asset_Name: entry.assetName,
          Amount_Per_Share: entry.amount,
          Total_Amount: entry.totalAmount,
          Quantity: entry.quantity,
          Qualified: entry.qualified || false,
        }))
      );
    } else {
      return this.toPDF('Dividend Report', this.formatDividendReportForPDF(summary, calendar));
    }
  }

  /**
   * Export portfolio report
   */
  private async exportPortfolioReport(options: ExportOptions): Promise<Blob> {
    const assets = wealthService.getAssets();
    const netWorth = wealthService.calculateNetWorth();
    const history = wealthService.getNetWorthHistory();

    if (options.format === 'csv' || options.format === 'excel') {
      const data = [
        { Metric: 'Total Assets', Value: netWorth.totalAssets.toFixed(2) },
        { Metric: 'Total Liabilities', Value: netWorth.totalLiabilities.toFixed(2) },
        { Metric: 'Net Worth', Value: netWorth.netWorth.toFixed(2) },
        ...Object.entries(netWorth.breakdown.assets).map(([type, value]) => ({
          Metric: `${type} Assets`,
          Value: value.toFixed(2),
        })),
      ];

      if (options.format === 'csv') {
        return this.toCSV(data, options.includeHeaders !== false);
      } else {
        return this.toExcel('Portfolio Report', data);
      }
    } else {
      return this.toPDF('Portfolio Report', this.formatPortfolioReportForPDF(assets, netWorth, history));
    }
  }

  /**
   * Convert data to CSV
   */
  private toCSV(data: Record<string, unknown>[], includeHeaders: boolean = true): Blob {
    if (data.length === 0) {
      return new Blob([''], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const rows: string[] = [];

    if (includeHeaders) {
      rows.push(headers.join(','));
    }

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape commas and quotes in CSV
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      rows.push(values.join(','));
    });

    return new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Convert data to Excel (simplified - would use a library like xlsx in production)
   */
  private toExcel(_sheetName: string, data: Record<string, unknown>[]): Blob {
    // In production, would use xlsx library
    // For now, return CSV with .xlsx extension (not ideal, but functional)
    const csv = this.toCSV(data, true);
    return new Blob([csv], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Convert data to PDF (simplified - would use a library like jsPDF in production)
   */
  private toPDF(title: string, content: string): Blob {
    // In production, would use jsPDF or similar library
    // For now, return HTML that can be printed to PDF
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
        </body>
      </html>
    `;
    return new Blob([html], { type: 'application/pdf' });
  }

  /**
   * Format data for PDF (simplified)
   */
  private formatTransactionsForPDF(transactions: Transaction[]): string {
    return `<table>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Amount</th>
        <th>Category</th>
        <th>Description</th>
      </tr>
      ${transactions.map(tx => `
        <tr>
          <td>${tx.date.toISOString().split('T')[0]}</td>
          <td>${tx.type}</td>
          <td>$${tx.amount.toFixed(2)}</td>
          <td>${tx.category}</td>
          <td>${tx.description}</td>
        </tr>
      `).join('')}
    </table>`;
  }

  private formatAssetsForPDF(assets: Asset[]): string {
    return `<table>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Value</th>
        <th>Purchase Price</th>
        <th>Current Price</th>
      </tr>
      ${assets.map(asset => `
        <tr>
          <td>${asset.name}</td>
          <td>${asset.type}</td>
          <td>$${asset.value.toFixed(2)}</td>
          <td>$${asset.purchasePrice?.toFixed(2) || 'N/A'}</td>
          <td>$${asset.currentPrice?.toFixed(2) || 'N/A'}</td>
        </tr>
      `).join('')}
    </table>`;
  }

  private formatNetWorthHistoryForPDF(history: NetWorthHistory[]): string {
    return `<table>
      <tr>
        <th>Date</th>
        <th>Net Worth</th>
        <th>Assets</th>
        <th>Liabilities</th>
      </tr>
      ${history.map(h => `
        <tr>
          <td>${h.date.toISOString().split('T')[0]}</td>
          <td>$${h.netWorth.toFixed(2)}</td>
          <td>$${h.assets.toFixed(2)}</td>
          <td>$${h.liabilities.toFixed(2)}</td>
        </tr>
      `).join('')}
    </table>`;
  }

  private formatBudgetForPDF(_budget: Budget, budgetVsActual: Record<string, { budgeted: number; actual: number; remaining: number; percentUsed: number; }>): string {
    return `<table>
      <tr>
        <th>Category</th>
        <th>Budgeted</th>
        <th>Actual</th>
        <th>Remaining</th>
        <th>% Used</th>
      </tr>
      ${Object.entries(budgetVsActual).map(([category, data]) => `
        <tr>
          <td>${category}</td>
          <td>$${data.budgeted.toFixed(2)}</td>
          <td>$${data.actual.toFixed(2)}</td>
          <td>$${data.remaining.toFixed(2)}</td>
          <td>${data.percentUsed.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </table>`;
  }

  private formatTaxReportForPDF(report: TaxReport, form1099B: Form1099BEntry[]): string {
    return `
      <h2>Tax Report Summary</h2>
      <p>Total Realized Gains: $${report.totalRealizedGains.toFixed(2)}</p>
      <p>Total Realized Losses: $${report.totalRealizedLosses.toFixed(2)}</p>
      <p>Net Realized Gains: $${report.netRealizedGains.toFixed(2)}</p>
      <h2>1099-B Form</h2>
      <table>
        <tr>
          <th>Description</th>
          <th>Date Acquired</th>
          <th>Date Sold</th>
          <th>Proceeds</th>
          <th>Cost Basis</th>
          <th>Gain/Loss</th>
          <th>Short Term</th>
        </tr>
        ${form1099B.map(entry => `
          <tr>
            <td>${entry.description}</td>
            <td>${entry.dateAcquired.toISOString().split('T')[0]}</td>
            <td>${entry.dateSold.toISOString().split('T')[0]}</td>
            <td>$${entry.proceeds.toFixed(2)}</td>
            <td>$${entry.costBasis.toFixed(2)}</td>
            <td>$${entry.gainLoss.toFixed(2)}</td>
            <td>${entry.shortTerm ? 'Yes' : 'No'}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private formatDividendReportForPDF(summary: DividendSummary, calendar: DividendCalendarEntry[]): string {
    return `
      <h2>Dividend Summary</h2>
      <p>Total Dividends: $${summary.totalDividends.toFixed(2)}</p>
      <p>Qualified Dividends: $${summary.qualifiedDividends.toFixed(2)}</p>
      <p>Non-Qualified Dividends: $${summary.nonQualifiedDividends.toFixed(2)}</p>
      <p>Dividend Yield: ${summary.dividendYield.toFixed(2)}%</p>
      <h2>Dividend Calendar</h2>
      <table>
        <tr>
          <th>Payment Date</th>
          <th>Symbol</th>
          <th>Amount</th>
          <th>Total</th>
        </tr>
        ${calendar.map(entry => `
          <tr>
            <td>${entry.paymentDate.toISOString().split('T')[0]}</td>
            <td>${entry.symbol}</td>
            <td>$${entry.amount.toFixed(4)}</td>
            <td>$${entry.totalAmount.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }

  private formatPortfolioReportForPDF(_assets: Asset[], netWorth: NetWorth, _history: NetWorthHistory[]): string {
    return `
      <h2>Portfolio Summary</h2>
      <p>Total Assets: $${netWorth.totalAssets.toFixed(2)}</p>
      <p>Total Liabilities: $${netWorth.totalLiabilities.toFixed(2)}</p>
      <p>Net Worth: $${netWorth.netWorth.toFixed(2)}</p>
      <h2>Asset Breakdown</h2>
      <table>
        <tr>
          <th>Type</th>
          <th>Value</th>
        </tr>
        ${Object.entries(netWorth.breakdown.assets).map(([type, value]) => `
          <tr>
            <td>${type}</td>
            <td>$${(value as number).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
    `;
  }
}

export const exportService = ExportService.getInstance();

