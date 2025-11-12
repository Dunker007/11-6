/**
 * Financial Service - Revenue & Monetization Tracking
 * 
 * IMPORTANT SEPARATION:
 * - This service tracks BUSINESS revenue, expenses, and P&L (Revenue & Monetization tab)
 * - This is SEPARATE from Wealth Lab, which tracks PERSONAL net worth, assets, and liabilities
 * - Crypto trading profits are tracked here ONLY when withdrawn from exchanges (via trackCryptoIncome)
 * 
 * Key Distinction:
 * - Revenue/Monetization = Business income/expenses, SaaS revenue, crypto profits (when withdrawn)
 * - Wealth = Personal net worth, retirement planning, budgeting, personal assets
 */

import type { Expense, Income, FinancialSummary, PnLReport, ExpenseCategory, IncomeSource } from '@/types/backoffice';
import { useThresholdStore } from './thresholdStore';

const EXPENSES_KEY = 'dlx_expenses';
const INCOME_KEY = 'dlx_income';

export class FinancialService {
  private static instance: FinancialService;
  private expenses: Map<string, Expense> = new Map();
  private income: Map<string, Income> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  private loadData(): void {
    try {
      const expensesData = localStorage.getItem(EXPENSES_KEY);
      if (expensesData) {
        const expenses: Expense[] = JSON.parse(expensesData);
        expenses.forEach((expense) => {
          expense.date = new Date(expense.date);
          this.expenses.set(expense.id, expense);
        });
      }

      const incomeData = localStorage.getItem(INCOME_KEY);
      if (incomeData) {
        const income: Income[] = JSON.parse(incomeData);
        income.forEach((item) => {
          item.date = new Date(item.date);
          this.income.set(item.id, item);
        });
      }

      this.updateThresholdStore();
    } catch (error) {
      console.error('Failed to load financial data:', error);
    }
  }

  private saveData(): void {
    try {
      const expensesArray = Array.from(this.expenses.values());
      const incomeArray = Array.from(this.income.values());
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(expensesArray));
      localStorage.setItem(INCOME_KEY, JSON.stringify(incomeArray));
      this.updateThresholdStore();
    } catch (error) {
      console.error('Failed to save financial data:', error);
    }
  }

  private updateThresholdStore(): void {
    const summary = this.getSummary(new Date(new Date().getFullYear(), 0, 1), new Date());
    useThresholdStore.getState().updateFinancials(summary.totalIncome, summary.totalExpenses);
  }

  // Expense Management
  addExpense(expense: Omit<Expense, 'id' | 'date'> & { date?: Date }): Expense {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      date: expense.date || new Date(),
      ...expense,
    };
    this.expenses.set(newExpense.id, newExpense);
    this.saveData();
    return newExpense;
  }

  updateExpense(id: string, updates: Partial<Expense>): Expense | null {
    const expense = this.expenses.get(id);
    if (!expense) return null;

    const updated = { ...expense, ...updates };
    this.expenses.set(id, updated);
    this.saveData();
    return updated;
  }

  deleteExpense(id: string): boolean {
    const deleted = this.expenses.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  getExpense(id: string): Expense | null {
    return this.expenses.get(id) || null;
  }

  getExpenses(startDate?: Date, endDate?: Date): Expense[] {
    let expenses = Array.from(this.expenses.values());

    if (startDate || endDate) {
      expenses = expenses.filter((expense) => {
        const expenseDate = expense.date;
        // Drop transactions that fall outside the requested time window.
        if (startDate && expenseDate < startDate) return false;
        if (endDate && expenseDate > endDate) return false;
        return true;
      });
    }

    // Sort newest-first so dashboards always show most recent activity first.
    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Income Management
  addIncome(income: Omit<Income, 'id' | 'date'> & { date?: Date }): Income {
    const newIncome: Income = {
      id: crypto.randomUUID(),
      date: income.date || new Date(),
      ...income,
    };
    this.income.set(newIncome.id, newIncome);
    this.saveData();
    return newIncome;
  }

  updateIncome(id: string, updates: Partial<Income>): Income | null {
    const income = this.income.get(id);
    if (!income) return null;

    const updated = { ...income, ...updates };
    this.income.set(id, updated);
    this.saveData();
    return updated;
  }

  deleteIncome(id: string): boolean {
    const deleted = this.income.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  getIncome(id: string): Income | null {
    return this.income.get(id) || null;
  }

  getIncomeSources(startDate?: Date, endDate?: Date): Income[] {
    let income = Array.from(this.income.values());

    if (startDate || endDate) {
      income = income.filter((item) => {
        const itemDate = item.date;
        // Mirror expense filtering: only keep dates within the requested range.
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Return newest income first to align with expense ordering.
    return income.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Summary & Reports
  getSummary(startDate: Date, endDate: Date): FinancialSummary {
    const expenses = this.getExpenses(startDate, endDate);
    const income = this.getIncomeSources(startDate, endDate);

    // Aggregate totals before breaking down into category buckets.
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    const profit = totalIncome - totalExpenses;
    // Guard division by zero when no income exists for the period.
    const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    // Group by category
    const expensesByCategory: Record<ExpenseCategory, number> = {
      api_costs: 0,
      hosting: 0,
      tools: 0,
      subscriptions: 0,
      infrastructure: 0,
      services: 0,
      development: 0,
      legal: 0,
      marketing: 0,
      other: 0,
    };

    expenses.forEach((exp) => {
      // Buckets are pre-seeded so we can safely add without null checks.
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
    });

    const incomeBySource: Record<IncomeSource, number> = {
      saas_subscriptions: 0,
      affiliate: 0,
      crypto_trading: 0,
      crypto_staking: 0,
      idle_computing: 0,
      product_sales: 0,
      service_revenue: 0,
      certifications: 0,
      other: 0,
    };

    income.forEach((inc) => {
      // Mirror expense aggregation for quick ratio calculations in the UI.
      incomeBySource[inc.source] = (incomeBySource[inc.source] || 0) + inc.amount;
    });

    return {
      totalIncome,
      totalExpenses,
      profit,
      profitMargin,
      period: { start: startDate, end: endDate },
      byCategory: {
        expenses: expensesByCategory,
        income: incomeBySource,
      },
    };
  }

  generatePnLReport(period: 'monthly' | 'quarterly' | 'yearly', date: Date = new Date()): PnLReport {
    let startDate: Date;
    let endDate: Date = new Date(date);

    switch (period) {
      case 'monthly':
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        startDate = new Date(date.getFullYear(), quarter * 3, 1);
        endDate = new Date(date.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(date.getFullYear(), 0, 1);
        endDate = new Date(date.getFullYear(), 11, 31);
        break;
    }

    const expenses = this.getExpenses(startDate, endDate);
    const income = this.getIncomeSources(startDate, endDate);
    const summary = this.getSummary(startDate, endDate);

    // Calculate trends (last 12 months for context)
    const trends = {
      income: [] as number[],
      expenses: [] as number[],
      profit: [] as number[],
    };

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
      const monthSummary = this.getSummary(monthStart, monthEnd);
      trends.income.push(monthSummary.totalIncome);
      trends.expenses.push(monthSummary.totalExpenses);
      trends.profit.push(monthSummary.profit);
    }

    return {
      period,
      summary,
      expenses,
      income,
      trends,
    };
  }

  // Auto-tracking integrations
  trackAPIExpense(provider: string, amount: number, date: Date = new Date()): void {
    this.addExpense({
      category: 'api_costs',
      description: `API usage - ${provider}`,
      amount,
      date,
      recurring: false,
      tags: ['api', provider.toLowerCase()],
    });
  }

  trackIdleComputingIncome(amount: number, source: string, date: Date = new Date()): void {
    this.addIncome({
      source: 'idle_computing',
      description: `Idle computing - ${source}`,
      amount,
      date,
      recurring: false,
      tags: ['idle_computing', source.toLowerCase()],
    });
  }

  /**
   * Track crypto income from withdrawals
   * 
   * IMPORTANT: This method is called when crypto profits are withdrawn from exchanges.
   * Crypto trading profits stay in Crypto Lab until explicitly withdrawn.
   * When withdrawn, they become business revenue and are tracked here.
   * 
   * This is SEPARATE from Wealth Lab, which tracks personal net worth.
   * 
   * @param amount - USD value of the withdrawal
   * @param source - 'trading' for trading profits, 'staking' for staking rewards
   * @param date - Date of withdrawal (defaults to now)
   */
  trackCryptoIncome(amount: number, source: 'trading' | 'staking', date: Date = new Date()): void {
    this.addIncome({
      source: source === 'trading' ? 'crypto_trading' : 'crypto_staking',
      description: `Crypto ${source}`,
      amount,
      date,
      recurring: false,
      tags: ['crypto', source],
    });
  }
}

export const financialService = FinancialService.getInstance();

