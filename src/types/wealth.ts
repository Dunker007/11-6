// Wealth Lab Types

export type AccountType = 'checking' | 'savings' | 'investment' | 'retirement' | 'credit_card' | 'loan' | 'mortgage' | 'other';

export type AssetType = 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'crypto' | 'real_estate' | 'cash' | 'domain' | 'collectible' | 'other';

export type BudgetCategory =
  | 'housing'
  | 'food'
  | 'transportation'
  | 'utilities'
  | 'healthcare'
  | 'entertainment'
  | 'shopping'
  | 'personal_care'
  | 'education'
  | 'travel'
  | 'debt_payment'
  | 'savings'
  | 'investments'
  | 'insurance'
  | 'gifts'
  | 'charity'
  | 'other';

export type TransactionType = 'expense' | 'income' | 'transfer';

export type GoalType = 'savings' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'retirement' | 'other';

export type EstateDocumentType = 'will' | 'trust' | 'deed' | 'insurance' | 'power_of_attorney' | 'beneficiary_form' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string; // e.g., "Schwab", "Chase", "Manual"
  accountNumber?: string; // Last 4 digits or masked
  balance: number;
  currency: string; // Default: 'USD'
  isConnected: boolean; // API connected vs manual
  connectionId?: string; // For Yodlee/Plaid connections
  lastSynced?: Date;
  date?: Date; // For compatibility
  createdAt: Date;
  notes?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  quantity?: number; // For stocks, crypto, etc.
  symbol?: string; // Ticker symbol
  purchasePrice?: number;
  purchaseDate?: Date;
  currentPrice?: number; // For stocks/crypto that update
  accountId?: string; // Link to account if applicable
  notes?: string;
  tags?: string[];
}

export interface Liability {
  id: string;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  balance: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: Date;
  accountId?: string;
  notes?: string;
}

export interface NetWorth {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  date: Date;
  breakdown: {
    assets: Record<AssetType, number>;
    liabilities: Record<string, number>;
  };
}

export interface NetWorthHistory {
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
}

export interface Budget {
  id: string;
  month: number; // 1-12
  year: number;
  categories: Record<BudgetCategory, number>; // Budgeted amount per category
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  category: BudgetCategory;
  accountId: string;
  description: string;
  merchant?: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  linkedGoalId?: string; // For goal tracking
  taxDeductible?: boolean; // For tax purposes
}

export interface RetirementPlan {
  id: string;
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturnRate: number; // Annual percentage (e.g., 7 for 7%)
  targetAmount: number;
  socialSecurityAmount?: number; // Monthly
  pensionAmount?: number; // Monthly
  createdAt: Date;
  updatedAt: Date;
}

export interface RetirementProjection {
  age: number;
  year: number;
  savings: number;
  contributions: number;
  growth: number;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  monthlyContribution?: number;
  linkedAccountIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface EstateDocument {
  id: string;
  name: string;
  type: EstateDocumentType;
  filePath?: string; // Encrypted storage path
  fileData?: string; // Base64 encoded (encrypted)
  uploadDate: Date;
  tags?: string[];
  notes?: string;
  beneficiaries?: string[]; // Beneficiary names or IDs
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship?: string;
  percentage?: number; // Allocation percentage
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  documents?: string[]; // Linked document IDs
}

export interface AccountConnection {
  id: string;
  institution: string;
  provider: 'schwab' | 'yodlee' | 'plaid' | 'manual';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSynced?: Date;
  errorMessage?: string;
  accountIds: string[]; // Linked account IDs
  createdAt: Date;
}

