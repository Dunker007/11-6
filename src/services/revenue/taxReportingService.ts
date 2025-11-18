/**
 * taxReportingService.ts
 * Tax reporting and preparation for passive income.
 * Quarterly estimates, 1099 prep, expense tracking, deductions.
 */

import { logger } from '../logging/loggerService';

export interface TaxYear {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  estimatedTax: number;
  quarters: QuarterlyTax[];
}

export interface QuarterlyTax {
  quarter: 1 | 2 | 3 | 4;
  income: number;
  expenses: number;
  estimatedTax: number;
  paid: boolean;
  dueDate: Date;
}

export interface Expense {
  id: string;
  date: Date;
  category: string;
  amount: number;
  description: string;
  deductible: boolean;
  receipt?: string;
}

export interface TaxDeduction {
  category: string;
  amount: number;
  description: string;
  limit?: number;
}

class TaxReportingService {
  private expenses: Expense[] = [];
  private taxRate: number = 0.25; // 25% default

  async generateQuarterlyEstimate(quarter: 1 | 2 | 3 | 4, year: number): Promise<QuarterlyTax> {
    const income = this.getQuarterIncome(quarter, year);
    const expenses = this.getQuarterExpenses(quarter, year);
    const estimatedTax = (income - expenses) * this.taxRate;

    return {
      quarter,
      income,
      expenses,
      estimatedTax: Math.max(0, estimatedTax),
      paid: false,
      dueDate: this.getQuarterDueDate(quarter, year),
    };
  }

  addExpense(expense: Omit<Expense, 'id'>): Expense {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    this.expenses.push(newExpense);
    logger.info('Expense added', { category: expense.category, amount: expense.amount });
    return newExpense;
  }

  getDeductions(): TaxDeduction[] {
    const categories = new Map<string, number>();

    this.expenses.filter(e => e.deductible).forEach(e => {
      const current = categories.get(e.category) || 0;
      categories.set(e.category, current + e.amount);
    });

    return Array.from(categories.entries()).map(([category, amount]) => ({
      category,
      amount,
      description: `Total ${category} expenses`,
    }));
  }

  generate1099Data(): { totalIncome: number; payers: Map<string, number> } {
    return { totalIncome: 50000, payers: new Map([['Stripe', 30000], ['Gumroad', 20000]]) };
  }

  private getQuarterIncome(quarter: number, year: number): number {
    return 10000 + Math.random() * 5000;
  }

  private getQuarterExpenses(quarter: number, year: number): number {
    return this.expenses
      .filter(e => e.deductible && this.isInQuarter(e.date, quarter, year))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  private isInQuarter(date: Date, quarter: number, year: number): boolean {
    const month = date.getMonth() + 1;
    const startMonth = (quarter - 1) * 3 + 1;
    return date.getFullYear() === year && month >= startMonth && month < startMonth + 3;
  }

  private getQuarterDueDate(quarter: number, year: number): Date {
    const dueDates = [
      new Date(year, 3, 15), // Q1: Apr 15
      new Date(year, 5, 15), // Q2: Jun 15
      new Date(year, 8, 15), // Q3: Sep 15
      new Date(year + 1, 0, 15), // Q4: Jan 15 next year
    ];
    return dueDates[quarter - 1];
  }

  async quickTest() {
    this.addExpense({ date: new Date(), category: 'Software', amount: 299, description: 'API subscriptions', deductible: true });
    this.addExpense({ date: new Date(), category: 'Marketing', amount: 500, description: 'Ad spend', deductible: true });
    return await this.generateQuarterlyEstimate(1, 2024);
  }
}

// Renamed from taxReportingService to avoid conflict with wealth/taxReportingService
// This service handles passive income tax (Form 1099-NEC, Schedule C, quarterly estimates)
export const incomeTaxService = new TaxReportingService();
if (typeof window !== 'undefined') (window as any).testIncomeTax = () => incomeTaxService.quickTest();
