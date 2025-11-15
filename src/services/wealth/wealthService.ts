/**
 * Wealth Service - Personal Net Worth & Financial Planning
 * 
 * IMPORTANT SEPARATION:
 * - This service tracks PERSONAL wealth, net worth, assets, liabilities, retirement planning
 * - This is SEPARATE from Revenue & Monetization, which tracks BUSINESS income/expenses
 * - Crypto assets held personally (not on exchange) can be tracked here as assets
 * - Crypto trading profits on exchanges stay in Crypto Lab until withdrawn
 * 
 * Key Distinction:
 * - Wealth = Personal net worth, retirement planning, budgeting, personal assets/liabilities
 * - Revenue/Monetization = Business income/expenses, SaaS revenue, crypto profits (when withdrawn)
 */

import { logger } from '../logging/loggerService';
import type {
  Account,
  Asset,
  Liability,
  NetWorth,
  NetWorthHistory,
  Budget,
  Transaction,
  RetirementPlan,
  RetirementProjection,
  Goal,
  BudgetCategory,
  AssetType,
} from '@/types/wealth';
import { WEALTH_CONSTANTS } from '@/utils/constants';
import { transactionImportService, type ImportedTransaction } from './transactionImportService';

const ACCOUNTS_KEY = 'dlx_wealth_accounts';
const ASSETS_KEY = 'dlx_wealth_assets';
const LIABILITIES_KEY = 'dlx_wealth_liabilities';
const BUDGETS_KEY = 'dlx_wealth_budgets';
const TRANSACTIONS_KEY = 'dlx_wealth_transactions';
const RETIREMENT_PLANS_KEY = 'dlx_wealth_retirement_plans';
const GOALS_KEY = 'dlx_wealth_goals';
const NET_WORTH_HISTORY_KEY = 'dlx_wealth_net_worth_history';

export class WealthService {
  private static instance: WealthService;
  private accounts: Map<string, Account> = new Map();
  private assets: Map<string, Asset> = new Map();
  private liabilities: Map<string, Liability> = new Map();
  private budgets: Map<string, Budget> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private retirementPlans: Map<string, RetirementPlan> = new Map();
  private goals: Map<string, Goal> = new Map();
  private netWorthHistory: NetWorthHistory[] = [];

  private constructor() {
    this.loadData();
  }

  static getInstance(): WealthService {
    if (!WealthService.instance) {
      WealthService.instance = new WealthService();
    }
    return WealthService.instance;
  }

  private loadData(): void {
    try {
      // Load accounts
      const accountsData = localStorage.getItem(ACCOUNTS_KEY);
      if (accountsData) {
        const accounts: Account[] = JSON.parse(accountsData);
        accounts.forEach((acc) => {
          acc.createdAt = new Date(acc.createdAt);
          if (acc.lastSynced) acc.lastSynced = new Date(acc.lastSynced);
          if (acc.date) acc.date = new Date(acc.date);
          this.accounts.set(acc.id, acc);
        });
      }

      // Load assets
      const assetsData = localStorage.getItem(ASSETS_KEY);
      if (assetsData) {
        const assets: Asset[] = JSON.parse(assetsData);
        assets.forEach((asset) => {
          if (asset.purchaseDate) asset.purchaseDate = new Date(asset.purchaseDate);
          this.assets.set(asset.id, asset);
        });
      }

      // Load liabilities
      const liabilitiesData = localStorage.getItem(LIABILITIES_KEY);
      if (liabilitiesData) {
        const liabilities: Liability[] = JSON.parse(liabilitiesData);
        liabilities.forEach((liab) => {
          if (liab.dueDate) liab.dueDate = new Date(liab.dueDate);
          this.liabilities.set(liab.id, liab);
        });
      }

      // Load budgets
      const budgetsData = localStorage.getItem(BUDGETS_KEY);
      if (budgetsData) {
        const budgets: Budget[] = JSON.parse(budgetsData);
        budgets.forEach((budget) => {
          budget.createdAt = new Date(budget.createdAt);
          budget.updatedAt = new Date(budget.updatedAt);
          this.budgets.set(`${budget.year}-${budget.month}`, budget);
        });
      }

      // Load transactions
      const transactionsData = localStorage.getItem(TRANSACTIONS_KEY);
      if (transactionsData) {
        const transactions: Transaction[] = JSON.parse(transactionsData);
        transactions.forEach((tx) => {
          tx.date = new Date(tx.date);
          this.transactions.set(tx.id, tx);
        });
      }

      // Load retirement plans
      const retirementData = localStorage.getItem(RETIREMENT_PLANS_KEY);
      if (retirementData) {
        const plans: RetirementPlan[] = JSON.parse(retirementData);
        plans.forEach((plan) => {
          plan.createdAt = new Date(plan.createdAt);
          plan.updatedAt = new Date(plan.updatedAt);
          this.retirementPlans.set(plan.id, plan);
        });
      }

      // Load goals
      const goalsData = localStorage.getItem(GOALS_KEY);
      if (goalsData) {
        const goals: Goal[] = JSON.parse(goalsData);
        goals.forEach((goal) => {
          goal.createdAt = new Date(goal.createdAt);
          goal.updatedAt = new Date(goal.updatedAt);
          if (goal.targetDate) goal.targetDate = new Date(goal.targetDate);
          this.goals.set(goal.id, goal);
        });
      }

      // Load net worth history
      const historyData = localStorage.getItem(NET_WORTH_HISTORY_KEY);
      if (historyData) {
        const history: NetWorthHistory[] = JSON.parse(historyData);
        this.netWorthHistory = history.map((h) => ({
          ...h,
          date: new Date(h.date),
        }));
      }
    } catch (error) {
      logger.error('Failed to load wealth data:', { error });
    }
  }

  private saveAccounts(): void {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(Array.from(this.accounts.values())));
    } catch (error) {
      logger.error('Failed to save accounts:', { error });
    }
  }

  private saveAssets(): void {
    try {
      localStorage.setItem(ASSETS_KEY, JSON.stringify(Array.from(this.assets.values())));
    } catch (error) {
      logger.error('Failed to save assets:', { error });
    }
  }

  private saveLiabilities(): void {
    try {
      localStorage.setItem(LIABILITIES_KEY, JSON.stringify(Array.from(this.liabilities.values())));
    } catch (error) {
      logger.error('Failed to save liabilities:', { error });
    }
  }

  private saveBudgets(): void {
    try {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(Array.from(this.budgets.values())));
    } catch (error) {
      logger.error('Failed to save budgets:', { error });
    }
  }

  private saveTransactions(): void {
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(Array.from(this.transactions.values())));
    } catch (error) {
      logger.error('Failed to save transactions:', { error });
    }
  }

  private saveRetirementPlans(): void {
    try {
      localStorage.setItem(RETIREMENT_PLANS_KEY, JSON.stringify(Array.from(this.retirementPlans.values())));
    } catch (error) {
      logger.error('Failed to save retirement plans:', { error });
    }
  }

  private saveGoals(): void {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(Array.from(this.goals.values())));
    } catch (error) {
      logger.error('Failed to save goals:', { error });
    }
  }

  private saveNetWorthHistory(): void {
    try {
      localStorage.setItem(NET_WORTH_HISTORY_KEY, JSON.stringify(this.netWorthHistory));
    } catch (error) {
      logger.error('Failed to save net worth history:', { error });
    }
  }

  // Account Management
  addAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.accounts.set(newAccount.id, newAccount);
    this.saveAccounts();
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const account = this.accounts.get(id);
    if (!account) return null;
    const updated = { ...account, ...updates };
    this.accounts.set(id, updated);
    this.saveAccounts();
    return updated;
  }

  deleteAccount(id: string): boolean {
    const deleted = this.accounts.delete(id);
    if (deleted) this.saveAccounts();
    return deleted;
  }

  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  // Asset Management
  addAsset(asset: Omit<Asset, 'id'>): Asset {
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
    };
    this.assets.set(newAsset.id, newAsset);
    this.saveAssets();
    return newAsset;
  }

  updateAsset(id: string, updates: Partial<Asset>): Asset | null {
    const asset = this.assets.get(id);
    if (!asset) return null;
    const updated = { ...asset, ...updates };
    this.assets.set(id, updated);
    this.saveAssets();
    return updated;
  }

  deleteAsset(id: string): boolean {
    const deleted = this.assets.delete(id);
    if (deleted) this.saveAssets();
    return deleted;
  }

  getAssets(): Asset[] {
    return Array.from(this.assets.values());
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id);
  }

  // Liability Management
  addLiability(liability: Omit<Liability, 'id'>): Liability {
    const newLiability: Liability = {
      ...liability,
      id: crypto.randomUUID(),
    };
    this.liabilities.set(newLiability.id, newLiability);
    this.saveLiabilities();
    return newLiability;
  }

  updateLiability(id: string, updates: Partial<Liability>): Liability | null {
    const liability = this.liabilities.get(id);
    if (!liability) return null;
    const updated = { ...liability, ...updates };
    this.liabilities.set(id, updated);
    this.saveLiabilities();
    return updated;
  }

  deleteLiability(id: string): boolean {
    const deleted = this.liabilities.delete(id);
    if (deleted) this.saveLiabilities();
    return deleted;
  }

  getLiabilities(): Liability[] {
    return Array.from(this.liabilities.values());
  }

  /**
   * Calculate personal net worth
   * 
   * IMPORTANT: This calculates PERSONAL net worth (assets - liabilities).
   * This is SEPARATE from Revenue & Monetization, which tracks BUSINESS income/expenses.
   * 
   * Crypto assets held personally (not on exchange) can be tracked here as assets.
   * Crypto trading profits on exchanges stay in Crypto Lab until withdrawn.
   * 
   * @returns Net worth calculation with asset/liability breakdown
   */
  calculateNetWorth(): NetWorth {
    const assets = this.getAssets();
    const accounts = this.getAccounts();
    const liabilities = this.getLiabilities();

    // Calculate total assets
    const assetValues = assets.reduce((sum, asset) => sum + asset.value, 0);
    const accountBalances = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const totalAssets = assetValues + accountBalances;

    // Calculate total liabilities
    const totalLiabilities = liabilities.reduce((sum, liab) => sum + liab.balance, 0);

    // Asset breakdown by type
    const assetBreakdown: Record<AssetType, number> = {
      stock: 0,
      etf: 0,
      bond: 0,
      mutual_fund: 0,
      crypto: 0,
      real_estate: 0,
      cash: 0,
      domain: 0,
      collectible: 0,
      nft: 0,
      private_investment: 0,
      commodity: 0,
      derivative: 0,
      other: 0,
    };

    assets.forEach((asset) => {
      assetBreakdown[asset.type] = (assetBreakdown[asset.type] || 0) + asset.value;
    });

    // Add cash accounts
    accounts.forEach((acc) => {
      if (acc.type === 'checking' || acc.type === 'savings') {
        assetBreakdown.cash += acc.balance;
      }
    });

    // Liability breakdown
    const liabilityBreakdown: Record<string, number> = {};
    liabilities.forEach((liab) => {
      liabilityBreakdown[liab.type] = (liabilityBreakdown[liab.type] || 0) + liab.balance;
    });

    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      date: new Date(),
      breakdown: {
        assets: assetBreakdown,
        liabilities: liabilityBreakdown,
      },
    };
  }

  // Record net worth snapshot
  recordNetWorthSnapshot(): void {
    const netWorth = this.calculateNetWorth();
    this.netWorthHistory.push({
      date: new Date(),
      netWorth: netWorth.netWorth,
      assets: netWorth.totalAssets,
      liabilities: netWorth.totalLiabilities,
    });
    // Keep only last N days (from constants)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - WEALTH_CONSTANTS.NET_WORTH_HISTORY_DAYS);
    this.netWorthHistory = this.netWorthHistory.filter((h) => h.date >= cutoffDate);
    this.saveNetWorthHistory();
  }

  getNetWorthHistory(): NetWorthHistory[] {
    return this.netWorthHistory;
  }

  // Budget Management
  getBudget(month: number, year: number, name?: string): Budget | null {
    const budgets = this.getBudgetsForMonth(month, year);
    if (name) {
      return budgets.find(b => b.name === name) || null;
    }
    return budgets[0] || null;
  }

  getBudgetsForMonth(month: number, year: number): Budget[] {
    return Array.from(this.budgets.values()).filter(
      b => b.month === month && b.year === year
    );
  }

  setBudget(
    month: number,
    year: number,
    categories: Record<BudgetCategory, number>,
    name?: string,
    rolloverEnabled: boolean = false,
    rolloverCategories?: BudgetCategory[]
  ): Budget {
    const existing = this.getBudget(month, year, name);
    const budget: Budget = existing
      ? {
          ...existing,
          categories,
          rolloverEnabled,
          rolloverCategories,
          updatedAt: new Date(),
        }
      : {
          id: crypto.randomUUID(),
          month,
          year,
          name,
          categories,
          rolloverEnabled,
          rolloverCategories,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
    
    const key = `${year}-${month}${name ? `-${name}` : ''}`;
    this.budgets.set(key, budget);
    this.saveBudgets();
    return budget;
  }

  getBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Create budget from template (copy from previous month)
   */
  createBudgetFromTemplate(month: number, year: number, templateMonth?: number, templateYear?: number): Budget {
    // Default to previous month
    const prevMonth = templateMonth || (month === 1 ? 12 : month - 1);
    const prevYear = templateYear || (month === 1 ? year - 1 : year);

    const template = this.getBudget(prevMonth, prevYear);
    if (!template) {
      // Create empty budget if no template
      return this.setBudget(month, year, {} as Record<BudgetCategory, number>);
    }

    // Copy categories from template
    return this.setBudget(
      month,
      year,
      { ...template.categories },
      template.name,
      template.rolloverEnabled,
      template.rolloverCategories
    );
  }

  /**
   * Apply budget rollover (carry forward unspent amounts)
   */
  applyBudgetRollover(month: number, year: number, budgetName?: string): Budget {
    const budget = this.getBudget(month, year, budgetName);
    if (!budget || !budget.rolloverEnabled) {
      return budget || this.setBudget(month, year, {} as Record<BudgetCategory, number>);
    }

    // Get previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevBudget = this.getBudget(prevMonth, prevYear, budgetName);
    
    if (!prevBudget) {
      return budget;
    }

    // Calculate actual spending for previous month
    const startDate = new Date(prevYear, prevMonth - 1, 1);
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
    const transactions = this.getTransactions(startDate, endDate);

    const actualSpending: Record<BudgetCategory, number> = {} as Record<BudgetCategory, number>;
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        actualSpending[tx.category] = (actualSpending[tx.category] || 0) + tx.amount;
      }
    });

    // Calculate rollover amounts
    const rolloverCategories = budget.rolloverCategories || Object.keys(prevBudget.categories) as BudgetCategory[];
    const updatedCategories = { ...budget.categories };

    rolloverCategories.forEach(category => {
      const budgeted = prevBudget.categories[category] || 0;
      const spent = actualSpending[category] || 0;
      const unspent = Math.max(0, budgeted - spent);
      
      // Add unspent to current month's budget
      updatedCategories[category] = (updatedCategories[category] || 0) + unspent;
    });

    return this.setBudget(
      month,
      year,
      updatedCategories,
      budget.name,
      budget.rolloverEnabled,
      budget.rolloverCategories
    );
  }

  /**
   * Auto-categorize transaction using rules engine
   */
  autoCategorizeTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    // Use transaction import service's categorization
    const importedTx: ImportedTransaction = {
      date: transaction.date,
      amount: transaction.type === 'expense' ? -transaction.amount : transaction.amount,
      description: transaction.description,
      merchant: transaction.merchant,
      accountId: transaction.accountId,
    };
    
    // Access private method via type casting (in real implementation, would be public)
    const categorized = (transactionImportService as any).categorizeTransaction(importedTx);

    return {
      id: crypto.randomUUID(),
      ...transaction,
      category: categorized.category || transaction.category,
      tags: categorized.tags || transaction.tags,
      notes: categorized.notes || transaction.notes,
    };
  }

  /**
   * Detect recurring transactions
   */
  detectRecurringTransactions(accountId?: string): Array<{
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
    return transactionImportService.detectRecurringTransactions(accountId || '');
  }

  /**
   * Get budget vs actual spending for a month
   */
  getBudgetVsActual(month: number, year: number, budgetName?: string): Record<string, {
    budgeted: number;
    actual: number;
    remaining: number;
    percentUsed: number;
  }> {
    const budget = this.getBudget(month, year, budgetName);
    if (!budget) {
      return {};
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const transactions = this.getTransactions(startDate, endDate);

    const actualSpending: Record<BudgetCategory, number> = {} as Record<BudgetCategory, number>;
    transactions.forEach(tx => {
      if (tx.type === 'expense') {
        actualSpending[tx.category] = (actualSpending[tx.category] || 0) + tx.amount;
      }
    });

    const result: Record<string, {
      budgeted: number;
      actual: number;
      remaining: number;
      percentUsed: number;
    }> = {};

    Object.keys(budget.categories).forEach(category => {
      const cat = category as BudgetCategory;
      const budgeted = budget.categories[cat] || 0;
      const actual = actualSpending[cat] || 0;
      const remaining = budgeted - actual;
      const percentUsed = budgeted > 0 ? (actual / budgeted) * 100 : 0;

      result[cat] = {
        budgeted,
        actual,
        remaining,
        percentUsed,
      };
    });

    return result;
  }

  // Transaction Management
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };
    this.transactions.set(newTransaction.id, newTransaction);
    this.saveTransactions();
    return newTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transaction = this.transactions.get(id);
    if (!transaction) return null;
    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    this.saveTransactions();
    return updated;
  }

  deleteTransaction(id: string): boolean {
    const deleted = this.transactions.delete(id);
    if (deleted) this.saveTransactions();
    return deleted;
  }

  /**
   * Split a transaction into multiple parts
   */
  splitTransaction(transactionId: string, splits: Array<{ amount: number; category: BudgetCategory; description?: string }>): Transaction[] {
    const originalTx = this.transactions.get(transactionId);
    if (!originalTx) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplitAmount - originalTx.amount) > 0.01) {
      throw new Error(`Split amounts (${totalSplitAmount}) must equal original amount (${originalTx.amount})`);
    }

    // Delete original transaction
    this.deleteTransaction(transactionId);

    // Create new transactions for each split
    const newTransactions: Transaction[] = [];
    splits.forEach((split) => {
      const newTx = this.addTransaction({
        accountId: originalTx.accountId,
        amount: split.amount,
        date: originalTx.date,
        description: split.description || originalTx.description,
        merchant: originalTx.merchant,
        type: originalTx.type,
        category: split.category,
        tags: originalTx.tags,
        notes: originalTx.notes,
      });
      newTransactions.push(newTx);
    });

    return newTransactions;
  }

  /**
   * Bulk update multiple transactions
   */
  bulkUpdateTransactions(transactionIds: string[], updates: Partial<Transaction>): number {
    let updatedCount = 0;
    transactionIds.forEach((id) => {
      const tx = this.transactions.get(id);
      if (tx) {
        const updated = { ...tx, ...updates };
        this.transactions.set(id, updated);
        updatedCount++;
      }
    });
    if (updatedCount > 0) {
      this.saveTransactions();
    }
    return updatedCount;
  }

  /**
   * Bulk delete multiple transactions
   */
  bulkDeleteTransactions(transactionIds: string[]): number {
    let deletedCount = 0;
    transactionIds.forEach((id) => {
      if (this.transactions.delete(id)) {
        deletedCount++;
      }
    });
    if (deletedCount > 0) {
      this.saveTransactions();
    }
    return deletedCount;
  }

  /**
   * Get transactions grouped by merchant
   */
  getTransactionsByMerchant(startDate?: Date, endDate?: Date): Map<string, Transaction[]> {
    const transactions = this.getTransactions(startDate, endDate);
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach((tx) => {
      const merchant = tx.merchant || 'Unknown';
      if (!grouped.has(merchant)) {
        grouped.set(merchant, []);
      }
      grouped.get(merchant)!.push(tx);
    });

    return grouped;
  }

  getTransactions(startDate?: Date, endDate?: Date, accountId?: string): Transaction[] {
    let transactions = Array.from(this.transactions.values());
    if (startDate) {
      transactions = transactions.filter((tx) => tx.date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter((tx) => tx.date <= endDate);
    }
    if (accountId) {
      transactions = transactions.filter((tx) => tx.accountId === accountId);
    }
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Retirement Planning
  addRetirementPlan(plan: Omit<RetirementPlan, 'id' | 'createdAt' | 'updatedAt'>): RetirementPlan {
    const newPlan: RetirementPlan = {
      ...plan,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.retirementPlans.set(newPlan.id, newPlan);
    this.saveRetirementPlans();
    return newPlan;
  }

  updateRetirementPlan(id: string, updates: Partial<RetirementPlan>): RetirementPlan | null {
    const plan = this.retirementPlans.get(id);
    if (!plan) return null;
    const updated = { ...plan, ...updates, updatedAt: new Date() };
    this.retirementPlans.set(id, updated);
    this.saveRetirementPlans();
    return updated;
  }

  getRetirementPlan(id: string): RetirementPlan | undefined {
    return this.retirementPlans.get(id);
  }

  getRetirementPlans(): RetirementPlan[] {
    return Array.from(this.retirementPlans.values());
  }

  // Calculate retirement projections
  calculateRetirementProjection(plan: RetirementPlan): RetirementProjection[] {
    const projections: RetirementProjection[] = [];
    const yearsToRetirement = plan.retirementAge - plan.currentAge;
    let currentSavings = plan.currentSavings;
    const monthlyRate = plan.expectedReturnRate / 100 / 12;
    const monthsToRetirement = yearsToRetirement * 12;

    for (let month = 0; month <= monthsToRetirement; month += 12) {
      // Calculate for each year
      let yearSavings = currentSavings;
      let yearContributions = 0;

      for (let m = 0; m < 12 && month + m <= monthsToRetirement; m++) {
        const contribution = plan.monthlyContribution;
        yearContributions += contribution;
        yearSavings += contribution;
        yearSavings *= 1 + monthlyRate;
      }

      const growth = yearSavings - currentSavings - yearContributions;

      projections.push({
        age: plan.currentAge + Math.floor(month / 12),
        year: new Date().getFullYear() + Math.floor(month / 12),
        savings: yearSavings,
        contributions: yearContributions,
        growth,
      });

      currentSavings = yearSavings;
    }

    return projections;
  }

  // Goal Management
  addGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.goals.set(newGoal.id, newGoal);
    this.saveGoals();
    return newGoal;
  }

  updateGoal(id: string, updates: Partial<Goal>): Goal | null {
    const goal = this.goals.get(id);
    if (!goal) return null;
    const updated = { ...goal, ...updates, updatedAt: new Date() };
    this.goals.set(id, updated);
    this.saveGoals();
    return updated;
  }

  deleteGoal(id: string): boolean {
    const deleted = this.goals.delete(id);
    if (deleted) this.saveGoals();
    return deleted;
  }

  getGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }
}

export const wealthService = WealthService.getInstance();

