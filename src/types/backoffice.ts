export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags: string[];
  receipt?: string; // File path or URL
  notes?: string;
}

export interface Income {
  id: string;
  source: IncomeSource;
  description: string;
  amount: number;
  date: Date;
  recurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  tags: string[];
  notes?: string;
}

export type ExpenseCategory =
  | 'api_costs'
  | 'hosting'
  | 'tools'
  | 'subscriptions'
  | 'infrastructure'
  | 'services'
  | 'development'
  | 'legal'
  | 'marketing'
  | 'other';

export type IncomeSource =
  | 'saas_subscriptions'
  | 'affiliate'
  | 'crypto_trading'
  | 'crypto_staking'
  | 'idle_computing'
  | 'product_sales'
  | 'service_revenue'
  | 'certifications'
  | 'other';

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  period: {
    start: Date;
    end: Date;
  };
  byCategory: {
    expenses: Record<ExpenseCategory, number>;
    income: Record<IncomeSource, number>;
  };
}

export interface PnLReport {
  period: 'monthly' | 'quarterly' | 'yearly';
  summary: FinancialSummary;
  expenses: Expense[];
  income: Income[];
  trends: {
    income: number[];
    expenses: number[];
    profit: number[];
  };
}

