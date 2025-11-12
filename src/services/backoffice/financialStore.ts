import { create } from 'zustand';
import { financialService } from './financialService';
import type { Expense, Income, FinancialSummary, PnLReport } from '@/types/backoffice';
import { withAsyncOperation } from '@/utils/storeHelpers';

interface FinancialStore {
  // State
  expenses: Expense[];
  income: Income[];
  summary: FinancialSummary | null;
  selectedPeriod: { start: Date; end: Date };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadExpenses: (startDate?: Date, endDate?: Date) => void;
  loadIncome: (startDate?: Date, endDate?: Date) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'date'> & { date?: Date }) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  addIncome: (income: Omit<Income, 'id' | 'date'> & { date?: Date }) => Promise<Income>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<Income | null>;
  deleteIncome: (id: string) => Promise<boolean>;
  getSummary: (startDate: Date, endDate: Date) => FinancialSummary;
  generatePnLReport: (period: 'monthly' | 'quarterly' | 'yearly', date?: Date) => PnLReport;
  setPeriod: (start: Date, end: Date) => void;
  refresh: () => void;
}

export const useFinancialStore = create<FinancialStore>((set, get) => ({
  expenses: [],
  income: [],
  summary: null,
  selectedPeriod: {
    start: new Date(new Date().getFullYear(), 0, 1), // Start of year
    end: new Date(),
  },
  isLoading: false,
  error: null,

  loadExpenses: (startDate, endDate) => {
    try {
      const expenses = financialService.getExpenses(startDate, endDate);
      set({ expenses });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  loadIncome: (startDate, endDate) => {
    try {
      const income = financialService.getIncomeSources(startDate, endDate);
      set({ income });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addExpense: async (expense) => {
    const result = await withAsyncOperation(
      async () => {
        const newExpense = financialService.addExpense(expense);
        await get().refresh();
        return newExpense;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
    if (!result) {
      throw new Error('Failed to add expense');
    }
    return result;
  },

  updateExpense: async (id, updates) => {
    return await withAsyncOperation(
      async () => {
        const updated = financialService.updateExpense(id, updates);
        await get().refresh();
        return updated;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
  },

  deleteExpense: async (id) => {
    const result = await withAsyncOperation(
      async () => {
        const deleted = financialService.deleteExpense(id);
        await get().refresh();
        return deleted;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
    return result ?? false;
  },

  addIncome: async (income) => {
    const result = await withAsyncOperation(
      async () => {
        const newIncome = financialService.addIncome(income);
        await get().refresh();
        return newIncome;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
    if (!result) {
      throw new Error('Failed to add income');
    }
    return result;
  },

  updateIncome: async (id, updates) => {
    return await withAsyncOperation(
      async () => {
        const updated = financialService.updateIncome(id, updates);
        await get().refresh();
        return updated;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
  },

  deleteIncome: async (id) => {
    const result = await withAsyncOperation(
      async () => {
        const deleted = financialService.deleteIncome(id);
        await get().refresh();
        return deleted;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
    return result ?? false;
  },

  getSummary: (startDate, endDate) => {
    return financialService.getSummary(startDate, endDate);
  },

  generatePnLReport: (period, date) => {
    return financialService.generatePnLReport(period, date);
  },

  setPeriod: (start, end) => {
    set({ selectedPeriod: { start, end } });
    get().refresh();
  },

  refresh: async () => {
    const { selectedPeriod } = get();
    await withAsyncOperation(
      async () => {
        get().loadExpenses(selectedPeriod.start, selectedPeriod.end);
        get().loadIncome(selectedPeriod.start, selectedPeriod.end);
        const summary = get().getSummary(selectedPeriod.start, selectedPeriod.end);
        set({ summary });
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'financialStore'
    );
  },
}));

