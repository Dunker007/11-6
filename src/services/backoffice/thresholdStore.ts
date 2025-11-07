import { create } from 'zustand';
import { thresholdService, type ThresholdStatus, type ThresholdAlert } from './thresholdService';

interface ThresholdStore {
  // State
  status: ThresholdStatus | null;
  alert: ThresholdAlert | null;
  totalIncome: number;
  totalExpenses: number;

  // Actions
  updateFinancials: (income: number, expenses: number) => void;
  checkStatus: () => ThresholdStatus;
  getAlert: () => ThresholdAlert | null;
  clearAlert: (alertId: string) => void;
  setThreshold: (amount: number) => void;
}

export const useThresholdStore = create<ThresholdStore>((set, get) => ({
  status: null,
  alert: null,
  totalIncome: 0,
  totalExpenses: 0,

  updateFinancials: (income: number, expenses: number) => {
    const status = thresholdService.checkThreshold(income, expenses);
    const alert = thresholdService.generateAlert(status);

    set({
      totalIncome: income,
      totalExpenses: expenses,
      status,
      alert,
    });
  },

  checkStatus: () => {
    const { totalIncome, totalExpenses } = get();
    const status = thresholdService.checkThreshold(totalIncome, totalExpenses);
    set({ status });
    return status;
  },

  getAlert: () => {
    return get().alert;
  },

  clearAlert: (alertId: string) => {
    const currentAlert = get().alert;
    if (currentAlert?.id === alertId) {
      set({ alert: null });
    }
  },

  setThreshold: (amount: number) => {
    thresholdService.setThreshold(amount);
    get().checkStatus();
  },
}));

