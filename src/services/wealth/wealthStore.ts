import { create } from 'zustand';
import { wealthService } from './wealthService';
import { portfolioService } from './portfolioService';
import { watchlistService } from './watchlistService';
import { newsService } from './newsService';
import { wealthMarketDataService } from './marketDataService';
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
  AccountConnection,
  Portfolio,
  Watchlist,
  Alert,
  NewsArticle,
  MarketInsight,
  CryptoETF,
} from '@/types/wealth';

interface WealthStore {
  // State
  accounts: Account[];
  assets: Asset[];
  liabilities: Liability[];
  netWorth: NetWorth | null;
  netWorthHistory: NetWorthHistory[];
  budgets: Budget[];
  transactions: Transaction[];
  retirementPlans: RetirementPlan[];
  goals: Goal[];
  accountConnections: AccountConnection[];
  
  // Selected period for budgeting/transactions
  selectedMonth: number;
  selectedYear: number;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  activeTab: 'overview' | 'portfolios' | 'crypto-etfs' | 'watchlists' | 'news' | 'analytics' | 'budgeting' | 'retirement' | 'estate';
  
  // Portfolio Management State
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  
  // Watchlist State
  watchlists: Watchlist[];
  selectedWatchlistId: string | null;
  alerts: Alert[];
  
  // News & Insights State
  news: NewsArticle[];
  insights: MarketInsight[];
  
  // Crypto ETFs State
  cryptoETFs: CryptoETF[];
  upcomingETFs: CryptoETF[];

  // Actions - Accounts
  loadAccounts: () => void;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => Account | null;
  deleteAccount: (id: string) => boolean;

  // Actions - Assets
  loadAssets: () => void;
  addAsset: (asset: Omit<Asset, 'id'>) => Asset;
  updateAsset: (id: string, updates: Partial<Asset>) => Asset | null;
  deleteAsset: (id: string) => boolean;

  // Actions - Liabilities
  loadLiabilities: () => void;
  addLiability: (liability: Omit<Liability, 'id'>) => Liability;
  updateLiability: (id: string, updates: Partial<Liability>) => Liability | null;
  deleteLiability: (id: string) => boolean;

  // Actions - Net Worth
  calculateNetWorth: () => void;
  recordNetWorthSnapshot: () => void;
  loadNetWorthHistory: () => void;

  // Actions - Budgets
  loadBudgets: () => void;
  getBudget: (month: number, year: number) => Budget | null;
  setBudget: (month: number, year: number, categories: Record<string, number>) => Budget;

  // Actions - Transactions
  loadTransactions: (startDate?: Date, endDate?: Date, accountId?: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Transaction | null;
  deleteTransaction: (id: string) => boolean;

  // Actions - Retirement
  loadRetirementPlans: () => void;
  addRetirementPlan: (plan: Omit<RetirementPlan, 'id' | 'createdAt' | 'updatedAt'>) => RetirementPlan;
  updateRetirementPlan: (id: string, updates: Partial<RetirementPlan>) => RetirementPlan | null;
  calculateRetirementProjection: (planId: string) => RetirementProjection[];

  // Actions - Goals
  loadGoals: () => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => Goal | null;
  deleteGoal: (id: string) => boolean;

  // Actions - Account Connections
  addAccountConnection: (connection: Omit<AccountConnection, 'id' | 'createdAt'>) => void;
  updateAccountConnection: (id: string, updates: Partial<AccountConnection>) => void;
  deleteAccountConnection: (id: string) => void;

  // UI Actions
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setActiveTab: (tab: 'overview' | 'portfolios' | 'crypto-etfs' | 'watchlists' | 'news' | 'analytics' | 'budgeting' | 'retirement' | 'estate') => void;
  refresh: () => void;
  
  // Portfolio Actions
  loadPortfolios: () => void;
  createPortfolio: (name: string, description?: string) => Promise<Portfolio>;
  addPosition: (portfolioId: string, symbol: string, quantity: number, costBasis: number, purchaseDate?: Date) => Promise<void>;
  removePosition: (portfolioId: string, positionId: string) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  setSelectedPortfolio: (id: string | null) => void;
  updatePortfolioPerformance: (portfolioId: string) => Promise<void>;
  
  // Watchlist Actions
  loadWatchlists: () => void;
  createWatchlist: (name: string) => Watchlist;
  addToWatchlist: (watchlistId: string, symbol: string) => void;
  removeFromWatchlist: (watchlistId: string, symbol: string) => void;
  deleteWatchlist: (id: string) => void;
  setSelectedWatchlist: (id: string | null) => void;
  setPriceAlert: (symbol: string, targetPrice: number, direction: 'above' | 'below') => Alert;
  setNewsAlert: (symbol: string, keywords: string[]) => Alert;
  deleteAlert: (id: string) => void;
  
  // News & Insights Actions
  loadNews: (symbols?: string[]) => Promise<void>;
  loadCryptoETFNews: () => Promise<void>;
  loadMarketNews: () => Promise<void>;
  loadInsights: () => void;
  generateInsights: (portfolioId: string) => Promise<void>;
  
  // Crypto ETF Actions
  loadCryptoETFs: () => Promise<void>;
  loadUpcomingETFs: () => Promise<void>;
}

export const useWealthStore = create<WealthStore>((set, get) => ({
  // Initial State
  accounts: [],
  assets: [],
  liabilities: [],
  netWorth: null,
  netWorthHistory: [],
  budgets: [],
  transactions: [],
  retirementPlans: [],
  goals: [],
  accountConnections: [],

  selectedMonth: new Date().getMonth() + 1,
  selectedYear: new Date().getFullYear(),

  isLoading: false,
  error: null,
  activeTab: 'overview',
  
  portfolios: [],
  selectedPortfolioId: null,
  watchlists: [],
  selectedWatchlistId: null,
  alerts: [],
  news: [],
  insights: [],
  cryptoETFs: [],
  upcomingETFs: [],

  // Account Actions
  loadAccounts: () => {
    const accounts = wealthService.getAccounts();
    set({ accounts });
  },

  addAccount: (account) => {
    const newAccount = wealthService.addAccount(account);
    get().loadAccounts();
    get().calculateNetWorth();
    return newAccount;
  },

  updateAccount: (id, updates) => {
    const updated = wealthService.updateAccount(id, updates);
    if (updated) {
      get().loadAccounts();
      get().calculateNetWorth();
    }
    return updated;
  },

  deleteAccount: (id) => {
    const deleted = wealthService.deleteAccount(id);
    if (deleted) {
      get().loadAccounts();
      get().calculateNetWorth();
    }
    return deleted;
  },

  // Asset Actions
  loadAssets: () => {
    const assets = wealthService.getAssets();
    set({ assets });
  },

  addAsset: (asset) => {
    const newAsset = wealthService.addAsset(asset);
    get().loadAssets();
    get().calculateNetWorth();
    return newAsset;
  },

  updateAsset: (id, updates) => {
    const updated = wealthService.updateAsset(id, updates);
    if (updated) {
      get().loadAssets();
      get().calculateNetWorth();
    }
    return updated;
  },

  deleteAsset: (id) => {
    const deleted = wealthService.deleteAsset(id);
    if (deleted) {
      get().loadAssets();
      get().calculateNetWorth();
    }
    return deleted;
  },

  // Liability Actions
  loadLiabilities: () => {
    const liabilities = wealthService.getLiabilities();
    set({ liabilities });
  },

  addLiability: (liability) => {
    const newLiability = wealthService.addLiability(liability);
    get().loadLiabilities();
    get().calculateNetWorth();
    return newLiability;
  },

  updateLiability: (id, updates) => {
    const updated = wealthService.updateLiability(id, updates);
    if (updated) {
      get().loadLiabilities();
      get().calculateNetWorth();
    }
    return updated;
  },

  deleteLiability: (id) => {
    const deleted = wealthService.deleteLiability(id);
    if (deleted) {
      get().loadLiabilities();
      get().calculateNetWorth();
    }
    return deleted;
  },

  // Net Worth Actions
  calculateNetWorth: () => {
    const netWorth = wealthService.calculateNetWorth();
    set({ netWorth });
  },

  recordNetWorthSnapshot: () => {
    wealthService.recordNetWorthSnapshot();
    get().loadNetWorthHistory();
  },

  loadNetWorthHistory: () => {
    const history = wealthService.getNetWorthHistory();
    set({ netWorthHistory: history });
  },

  // Budget Actions
  loadBudgets: () => {
    const budgets = wealthService.getBudgets();
    set({ budgets });
  },

  getBudget: (month, year) => {
    return wealthService.getBudget(month, year);
  },

  setBudget: (month, year, categories) => {
    const budget = wealthService.setBudget(month, year, categories as any);
    get().loadBudgets();
    return budget;
  },

  // Transaction Actions
  loadTransactions: (startDate, endDate, accountId) => {
    const transactions = wealthService.getTransactions(startDate, endDate, accountId);
    set({ transactions });
  },

  addTransaction: (transaction) => {
    const newTransaction = wealthService.addTransaction(transaction);
    get().loadTransactions();
    return newTransaction;
  },

  updateTransaction: (id, updates) => {
    const updated = wealthService.updateTransaction(id, updates);
    if (updated) {
      get().loadTransactions();
    }
    return updated;
  },

  deleteTransaction: (id) => {
    const deleted = wealthService.deleteTransaction(id);
    if (deleted) {
      get().loadTransactions();
    }
    return deleted;
  },

  // Retirement Actions
  loadRetirementPlans: () => {
    const plans = wealthService.getRetirementPlans();
    set({ retirementPlans: plans });
  },

  addRetirementPlan: (plan) => {
    const newPlan = wealthService.addRetirementPlan(plan);
    get().loadRetirementPlans();
    return newPlan;
  },

  updateRetirementPlan: (id, updates) => {
    const updated = wealthService.updateRetirementPlan(id, updates);
    if (updated) {
      get().loadRetirementPlans();
    }
    return updated;
  },

  calculateRetirementProjection: (planId) => {
    const plan = wealthService.getRetirementPlan(planId);
    if (!plan) return [];
    return wealthService.calculateRetirementProjection(plan);
  },

  // Goal Actions
  loadGoals: () => {
    const goals = wealthService.getGoals();
    set({ goals });
  },

  addGoal: (goal) => {
    const newGoal = wealthService.addGoal(goal);
    get().loadGoals();
    return newGoal;
  },

  updateGoal: (id, updates) => {
    const updated = wealthService.updateGoal(id, updates);
    if (updated) {
      get().loadGoals();
    }
    return updated;
  },

  deleteGoal: (id) => {
    const deleted = wealthService.deleteGoal(id);
    if (deleted) {
      get().loadGoals();
    }
    return deleted;
  },

  // Account Connection Actions (stored in localStorage for now)
  addAccountConnection: (connection) => {
    const connections = get().accountConnections;
    const newConnection: AccountConnection = {
      ...connection,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    set({ accountConnections: [...connections, newConnection] });
    // Save to localStorage
    localStorage.setItem('dlx_account_connections', JSON.stringify([...connections, newConnection]));
  },

  updateAccountConnection: (id, updates) => {
    const connections = get().accountConnections;
    const updated = connections.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn));
    set({ accountConnections: updated });
    localStorage.setItem('dlx_account_connections', JSON.stringify(updated));
  },

  deleteAccountConnection: (id) => {
    const connections = get().accountConnections.filter((conn) => conn.id !== id);
    set({ accountConnections: connections });
    localStorage.setItem('dlx_account_connections', JSON.stringify(connections));
  },

  // UI Actions
  setSelectedMonth: (month) => {
    set({ selectedMonth: month });
    const { selectedYear } = get();
    get().loadTransactions(
      new Date(selectedYear, month - 1, 1),
      new Date(selectedYear, month, 0)
    );
  },

  setSelectedYear: (year) => {
    set({ selectedYear: year });
    const { selectedMonth } = get();
    get().loadTransactions(
      new Date(year, selectedMonth - 1, 1),
      new Date(year, selectedMonth, 0)
    );
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  refresh: () => {
    get().loadAccounts();
    get().loadAssets();
    get().loadLiabilities();
    get().loadBudgets();
    get().loadTransactions();
    get().loadRetirementPlans();
    get().loadGoals();
    get().loadNetWorthHistory();
    get().calculateNetWorth();
    get().loadPortfolios();
    get().loadWatchlists();
    get().loadInsights();
    
    // Load account connections from localStorage
    try {
      const stored = localStorage.getItem('dlx_account_connections');
      if (stored) {
        const connections: AccountConnection[] = JSON.parse(stored).map((conn: any) => ({
          ...conn,
          createdAt: new Date(conn.createdAt),
          lastSynced: conn.lastSynced ? new Date(conn.lastSynced) : undefined,
        }));
        set({ accountConnections: connections });
      }
    } catch (error) {
      console.error('Failed to load account connections:', error);
    }
  },
  
  // Portfolio Actions
  loadPortfolios: () => {
    const portfolios = portfolioService.getPortfolios();
    set({ portfolios });
  },
  
  createPortfolio: async (name, description) => {
    const portfolio = await portfolioService.createPortfolio(name, description);
    get().loadPortfolios();
    return portfolio;
  },
  
  addPosition: async (portfolioId, symbol, quantity, costBasis, purchaseDate) => {
    await portfolioService.addPosition(portfolioId, symbol, quantity, costBasis, purchaseDate);
    get().loadPortfolios();
  },
  
  removePosition: (portfolioId, positionId) => {
    portfolioService.removePosition(portfolioId, positionId);
    get().loadPortfolios();
  },
  
  updatePortfolio: (id, updates) => {
    portfolioService.updatePortfolio(id, updates);
    get().loadPortfolios();
  },
  
  deletePortfolio: (id) => {
    portfolioService.deletePortfolio(id);
    get().loadPortfolios();
    if (get().selectedPortfolioId === id) {
      set({ selectedPortfolioId: null });
    }
  },
  
  setSelectedPortfolio: (id) => {
    set({ selectedPortfolioId: id });
  },
  
  updatePortfolioPerformance: async (portfolioId) => {
    await portfolioService.updatePortfolioPerformance(portfolioId);
    get().loadPortfolios();
  },
  
  // Watchlist Actions
  loadWatchlists: () => {
    const watchlists = watchlistService.getWatchlists();
    const alerts = watchlistService.getAlerts();
    set({ watchlists, alerts });
  },
  
  createWatchlist: (name) => {
    const watchlist = watchlistService.createWatchlist(name);
    get().loadWatchlists();
    return watchlist;
  },
  
  addToWatchlist: (watchlistId, symbol) => {
    watchlistService.addToWatchlist(watchlistId, symbol);
    get().loadWatchlists();
  },
  
  removeFromWatchlist: (watchlistId, symbol) => {
    watchlistService.removeFromWatchlist(watchlistId, symbol);
    get().loadWatchlists();
  },
  
  deleteWatchlist: (id) => {
    watchlistService.deleteWatchlist(id);
    get().loadWatchlists();
    if (get().selectedWatchlistId === id) {
      set({ selectedWatchlistId: null });
    }
  },
  
  setSelectedWatchlist: (id) => {
    set({ selectedWatchlistId: id });
  },
  
  setPriceAlert: (symbol, targetPrice, direction) => {
    const alert = watchlistService.setPriceAlert(symbol, targetPrice, direction);
    get().loadWatchlists();
    return alert;
  },
  
  setNewsAlert: (symbol, keywords) => {
    const alert = watchlistService.setNewsAlert(symbol, keywords);
    get().loadWatchlists();
    return alert;
  },
  
  deleteAlert: (id) => {
    watchlistService.deleteAlert(id);
    get().loadWatchlists();
  },
  
  // News & Insights Actions
  loadNews: async (symbols) => {
    set({ isLoading: true });
    try {
      const news = await newsService.fetchNews(symbols || []);
      set({ news, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  loadCryptoETFNews: async () => {
    set({ isLoading: true });
    try {
      const news = await newsService.fetchCryptoETFNews();
      set({ news, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  loadMarketNews: async () => {
    set({ isLoading: true });
    try {
      const news = await newsService.fetchMarketNews();
      set({ news, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  loadInsights: () => {
    const insights = newsService.getInsights();
    set({ insights });
  },
  
  generateInsights: async (portfolioId) => {
    const portfolio = portfolioService.getPortfolio(portfolioId);
    if (!portfolio) return;
    
    const symbols = portfolio.holdings.map(h => h.symbol);
    const news = await newsService.fetchNews(symbols);
    const insights = await newsService.generateInsights(portfolio, news);
    set({ insights });
  },
  
  // Crypto ETF Actions
  loadCryptoETFs: async () => {
    set({ isLoading: true });
    try {
      const etfs = await wealthMarketDataService.getCryptoETFs();
      set({ cryptoETFs: etfs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  loadUpcomingETFs: async () => {
    set({ isLoading: true });
    try {
      const etfs = await wealthMarketDataService.getUpcomingETFs();
      set({ upcomingETFs: etfs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));

