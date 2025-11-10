// Wealth Lab Types

export type AccountType = 'checking' | 'savings' | 'investment' | 'retirement' | 'credit_card' | 'loan' | 'mortgage' | 'other';

export type AssetType = 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'crypto' | 'real_estate' | 'cash' | 'domain' | 'collectible' | 'nft' | 'private_investment' | 'commodity' | 'derivative' | 'other';

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

// Tax Lot for tax reporting (FIFO, LIFO, specific identification)
export interface TaxLot {
  id: string;
  assetId: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  saleDate?: Date;
  salePrice?: number;
  realizedGain?: number;
  realizedGainPercent?: number;
  holdingPeriod?: number; // Days held
  isLongTerm?: boolean; // > 1 year for tax purposes
}

// Dividend payment record
export interface DividendPayment {
  id: string;
  assetId: string;
  symbol: string;
  amount: number; // Per share
  totalAmount: number; // Total for position
  quantity: number; // Shares held at ex-dividend date
  exDividendDate: Date;
  paymentDate: Date;
  recordDate?: Date;
  taxWithheld?: number;
  qualified?: boolean; // Qualified dividends for tax purposes
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
  exchange?: string; // Exchange name (e.g., "NYSE", "NASDAQ", "Binance")
  country?: string; // ISO country code (e.g., "US", "GB", "JP")
  dividendYield?: number; // Annual dividend yield percentage
  dividendHistory?: DividendPayment[]; // Historical dividend payments
  taxLots?: TaxLot[]; // Tax lot tracking for tax reporting
  notes?: string;
  tags?: string[];
  // Enhanced fields for portfolio management
  marketData?: {
    price: number;
    change24h: number;
    changePercent24h: number;
    volume?: number;
    marketCap?: number;
    lastUpdated: Date;
  };
  holdings?: Position[];
  performance?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    ytd?: number;
  };
  metadata?: {
    sector?: string;
    industry?: string;
    description?: string;
    logoUrl?: string;
    expenseRatio?: number; // For ETFs and mutual funds (annual percentage)
  };
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  costBasis: number; // Average cost per share
  purchaseDate: Date;
  unrealizedPL: number; // Unrealized profit/loss
  unrealizedPLPercent: number;
  accountId?: string;
  notes?: string;
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
  name?: string; // For multiple budgets per month (e.g., "Personal", "Business")
  categories: Record<BudgetCategory, number>; // Budgeted amount per category
  rolloverEnabled: boolean; // Whether unspent amounts carry forward
  rolloverCategories?: BudgetCategory[]; // Which categories can rollover (empty = all)
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

// Portfolio Management Types
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  holdings: Position[];
  allocation: Record<AssetType, number>; // Asset class breakdown
  performance: {
    totalReturn: number;
    totalReturnPercent: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    volatility?: number;
    beta?: number;
  };
  benchmark?: 'SP500' | 'BTC' | 'CUSTOM';
  customBenchmark?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  alerts: Alert[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'price' | 'news';
  priceAlert?: {
    targetPrice: number;
    direction: 'above' | 'below';
    triggered: boolean;
    triggeredAt?: Date;
  };
  newsAlert?: {
    keywords: string[];
    triggered: boolean;
    triggeredAt?: Date;
  };
  createdAt: Date;
}

// Crypto ETF Types
export type ETFType = 'spot' | 'futures' | 'etn' | 'other';
export type ETFStatus = 'approved' | 'pending' | 'filed' | 'live';

export interface CryptoETF {
  ticker: string;
  name: string;
  type: ETFType;
  underlyingAssets: string[]; // Array of crypto symbols
  expenseRatio: number;
  aum: number; // Assets under management
  launchDate?: Date;
  status: ETFStatus;
  news: string[]; // Array of news article IDs
  filingDate?: Date;
  approvalDate?: Date;
  issuer?: string;
  description?: string;
}

// News & Insights Types
export type NewsSentiment = 'positive' | 'negative' | 'neutral';

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  tags: string[];
  sentiment: NewsSentiment;
  relatedAssets: string[]; // Array of asset symbols
  impactScore: number; // 0-100, estimated market impact
  imageUrl?: string;
}

export type InsightType = 'trend' | 'alert' | 'recommendation' | 'risk';

export interface MarketInsight {
  id: string;
  type: InsightType;
  asset?: string; // Related asset symbol
  message: string;
  confidence: number; // 0-100
  timestamp: Date;
  actionable?: boolean;
  actionUrl?: string;
}

// Personal Finance Types (Monarch Money Style)
export interface TransactionRule {
  id: string;
  name: string;
  condition: {
    field: 'merchant' | 'description' | 'amount' | 'account';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
    value: string | number;
  };
  action: {
    category: BudgetCategory;
    tags?: string[];
    notes?: string;
  };
  priority: number; // Higher priority rules apply first
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: BudgetCategory;
  accountId: string;
  nextDueDate: Date;
  merchant?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  nextChargeDate: Date;
  category: BudgetCategory;
  accountId: string;
  merchant?: string;
  notes?: string;
  isActive: boolean;
  cancelledAt?: Date;
  createdAt: Date;
}

export interface SplitTransaction {
  id: string;
  transactionId: string;
  amount: number;
  category: BudgetCategory;
  description?: string;
}

export interface TransactionReceipt {
  id: string;
  transactionId: string;
  imageData: string; // Base64 encoded image
  uploadedAt: Date;
}

// Enhanced Transaction with splits and receipts
export interface EnhancedTransaction extends Transaction {
  splits?: SplitTransaction[];
  receiptId?: string;
  receipt?: TransactionReceipt;
  isDuplicate?: boolean;
  duplicateOf?: string; // ID of original transaction
  isTransfer?: boolean;
  transferToAccountId?: string;
}

// Category & Merchant Management
export interface Category {
  id: string;
  name: string;
  parentId?: string; // For subcategories
  icon?: string;
  color?: string;
  group?: string;
  isHidden: boolean;
  defaultBudget?: number;
}

export interface Merchant {
  id: string;
  name: string;
  aliases: string[]; // Alternative names
  defaultCategory: BudgetCategory;
  isActive: boolean;
}

// Cash Flow Types
export interface CashFlow {
  date: Date;
  income: number;
  expenses: number;
  netCashFlow: number;
  byCategory: Record<BudgetCategory, number>;
}

export interface CashFlowForecast {
  date: Date;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
  confidence: number; // 0-100
}

// Real Estate Asset (Kubera-style)
export type RealEstateType = 'residential' | 'commercial' | 'land' | 'rental' | 'vacation' | 'other';

export interface RealEstateAsset {
  id: string;
  name: string;
  type: RealEstateType;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  purchasePrice: number;
  purchaseDate: Date;
  currentEstimatedValue: number; // From Zillow API or manual
  lastAppraisalDate?: Date;
  lastAppraisalValue?: number;
  rentalIncome?: {
    monthly: number;
    annual: number;
    vacancyRate?: number; // Percentage
  };
  expenses?: {
    propertyTaxes: number; // Annual
    insurance: number; // Annual
    maintenance: number; // Annual
    management?: number; // Annual (if using property manager)
    utilities?: number; // Annual
    hoa?: number; // Annual HOA fees
  };
  mortgage?: {
    principal: number;
    interestRate: number;
    monthlyPayment: number;
    remainingBalance: number;
    termYears: number;
    startDate: Date;
  };
  roi?: {
    cashOnCash: number; // Percentage
    capRate: number; // Percentage
    totalReturn: number; // Percentage
  };
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Collectible Asset (Kubera-style)
export type CollectibleType = 'art' | 'watches' | 'wine' | 'coins' | 'stamps' | 'jewelry' | 'antiques' | 'memorabilia' | 'other';

export interface CollectibleAsset {
  id: string;
  name: string;
  type: CollectibleType;
  description?: string;
  purchasePrice: number;
  purchaseDate: Date;
  currentEstimatedValue: number;
  appraisalHistory: Array<{
    date: Date;
    value: number;
    appraiser?: string;
    notes?: string;
  }>;
  condition?: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  provenance?: string; // Ownership history
  insurance?: {
    provider?: string;
    policyNumber?: string;
    coverageAmount: number;
    premium: number; // Annual
    renewalDate?: Date;
  };
  storageLocation?: string;
  notes?: string;
  tags?: string[];
  images?: string[]; // URLs or base64 encoded images
  createdAt: Date;
  updatedAt: Date;
}

// Private Investment Asset (Kubera-style)
export type PrivateInvestmentType = 'startup_equity' | 'private_equity' | 'venture_capital' | 'hedge_fund' | 'real_estate_fund' | 'private_debt' | 'other';

export interface PrivateInvestmentAsset {
  id: string;
  name: string;
  type: PrivateInvestmentType;
  companyName?: string; // For startup equity
  fundName?: string; // For funds
  initialInvestment: number;
  investmentDate: Date;
  currentValuation?: number;
  valuationHistory: Array<{
    date: Date;
    valuation: number;
    source?: string; // e.g., "409A valuation", "fund NAV"
  }>;
  distributions: Array<{
    date: Date;
    amount: number;
    type: 'dividend' | 'return_of_capital' | 'capital_gain';
  }>;
  k1Forms?: Array<{
    year: number;
    filePath?: string;
    fileData?: string; // Base64 encoded
  }>;
  ownershipPercentage?: number; // For equity investments
  liquidationPreference?: number; // For preferred stock
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// NFT Asset (Kubera-style)
export interface NFTAsset {
  id: string;
  name: string;
  collectionName: string;
  tokenId: string;
  contractAddress: string;
  chain: 'ethereum' | 'polygon' | 'solana' | 'other';
  purchasePrice: number;
  purchaseDate: Date;
  purchaseCurrency?: string; // ETH, SOL, USD, etc.
  currentFloorPrice?: number; // From OpenSea or other marketplace
  lastSalePrice?: number;
  lastSaleDate?: Date;
  marketplace?: 'opensea' | 'rarible' | 'foundation' | 'superrare' | 'other';
  marketplaceUrl?: string;
  traits?: Array<{
    traitType: string;
    value: string;
    rarity?: number; // Percentage
  }>;
  imageUrl?: string;
  transactionHistory?: Array<{
    date: Date;
    type: 'mint' | 'purchase' | 'sale' | 'transfer';
    price?: number;
    from?: string;
    to?: string;
    transactionHash?: string;
  }>;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

