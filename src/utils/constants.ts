/**
 * Application-wide constants
 */

// Chart constants
export const CHART_CONSTANTS = {
  MAX_DATA_POINTS: 50,
  CHART_WIDTH: 800,
  CHART_HEIGHT: 400,
  REFRESH_INTERVAL: 30000, // 30 seconds
} as const;

// Polling intervals (in milliseconds)
export const POLLING_INTERVALS = {
  LLM_PROVIDER_DISCOVERY: 30000, // 30 seconds
  CHART_DATA: 30000, // 30 seconds
  OPEN_ORDERS: 2000, // 2 seconds
  POSITIONS: 2000, // 2 seconds
  TICKER_DATA: 5000, // 5 seconds
  ORDER_BOOK: 5000, // 5 seconds
  ACCOUNTS: 15000, // 15 seconds
  FINANCIAL_SUMMARY: 60000, // 1 minute
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  FILTER: 300,
  CHART_UPDATE: 500,
  FORM_INPUT: 300,
  SEARCH_INPUT: 300,
  FILTER_INPUT: 300,
} as const;

// Financial constants
export const FINANCIAL_CONSTANTS = {
  MONTHLY_REVENUE_TARGET: 8000,
  MONTHLY_LLM_COST_TARGET: 400,
  ESTIMATED_LLM_COST_PERCENTAGE: 0.05, // 5%
  COST_WARNING_THRESHOLD: 5, // 5% of revenue
} as const;

// Wealth Lab constants
export const WEALTH_CONSTANTS = {
  NET_WORTH_HISTORY_DAYS: 365, // Keep last 365 days
  NET_WORTH_CHART_POINTS: 30, // Last 30 data points for chart
  DEFAULT_RETIREMENT_AGE: 65,
  DEFAULT_CURRENT_AGE: 30,
  DEFAULT_RETURN_RATE: 7, // 7% annual return
  DEFAULT_TARGET_AMOUNT: 1000000,
  MONTHS_IN_YEAR: 12,
} as const;

// List thresholds for virtual scrolling
export const VIRTUAL_SCROLL_THRESHOLDS = {
  IDEA_LIST: 100,
  MODEL_CATALOG: 50,
  TRADE_HISTORY: 50,
  OPEN_ORDERS: 30,
  TRANSACTION_LIST: 100,
} as const;

// API endpoints (if needed for reference)
export const API_ENDPOINTS = {
  COINBASE_SANDBOX: 'https://api-public.sandbox.exchange.coinbase.com',
  COINBASE_PRODUCTION: 'https://api.exchange.coinbase.com',
  COINGECKO: 'https://api.coingecko.com/api/v3',
} as const;

// Default values
export const DEFAULTS = {
  SELECTED_PRODUCT: 'BTC-USD',
  CHART_TIMEFRAME: '1h' as const,
  CHART_TYPE: 'candlestick' as const,
  TRADING_MODE: 'paper' as const,
} as const;

