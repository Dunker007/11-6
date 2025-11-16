// Crypto Trading Types

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_1h?: number;
  price_change_percentage_7d?: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply?: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface MarketData {
  coins: Coin[];
  trending: Coin[];
  lastUpdated: Date;
}

export interface TradingPair {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  displayName: string;
  marketType: MarketType;
  price: number;
  volume24h: number;
  change24h: number;
}

export type MarketType = 'spot' | 'futures';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';

export interface CoinbaseOrder {
  order_id: string;
  product_id: string;
  user_id: string;
  order_configuration: {
    market_market_ioc?: {
      quote_size: string;
      base_size: string;
    };
    limit_limit_gtc?: {
      base_size: string;
      limit_price: string;
      post_only: boolean;
    };
    limit_limit_gtd?: {
      base_size: string;
      limit_price: string;
      end_time: string;
      post_only: boolean;
    };
    stop_limit_stop_limit_gtc?: {
      base_size: string;
      limit_price: string;
      stop_price: string;
    };
    stop_limit_stop_limit_gtd?: {
      base_size: string;
      limit_price: string;
      stop_price: string;
      end_time: string;
    };
  };
  side: OrderSide;
  client_order_id: string;
  status: OrderStatus;
  time_in_force: string;
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
  number_of_fills: string;
  filled_value: string;
  pending_cancel: boolean;
  size_in_quote: boolean;
  total_fees: string;
  size_inclusive_of_fees: boolean;
  total_value_after_fees: string;
  trigger_status: string;
  order_type: OrderType;
  reject_reason: string;
  settled: boolean;
  product_type: MarketType;
  reject_message?: string;
  cancel_message?: string;
}

export interface CoinbasePosition {
  entry_price: string;
  product_id: string;
  product_type: MarketType;
  side: 'LONG' | 'SHORT';
  size: string;
  unrealized_pnl: string;
  funding: string;
  leverage: string;
  margin_used: string;
  margin_ratio: string;
  liquidation_price: string;
  mark_price: string;
  max_position_size: string;
  collateral: string;
}

export interface CoinbaseAccount {
  uuid: string;
  name: string;
  currency: string;
  available_balance: {
    value: string;
    currency: string;
  };
  hold: {
    value: string;
    currency: string;
  };
  type: 'SPOT' | 'FUTURES';
}

export interface CoinbaseFill {
  entry_id: string;
  trade_id: string;
  order_id: string;
  trade_time: string;
  trade_type: string;
  price: string;
  size: string;
  commission: string;
  product_id: string;
  sequence_timestamp: string;
  liquidity_indicator: string;
  size_in_quote: boolean;
  user_id: string;
  side: OrderSide;
}

export interface Portfolio {
  totalValue: number;
  availableBalance: number;
  totalPnL: number;
  totalPnLPercentage: number;
  positions: CoinbasePosition[];
  accounts: CoinbaseAccount[];
}

export interface SocialSentiment {
  coinId: string;
  symbol: string;
  sentimentScore: number; // -1 to 1
  socialVolume: number;
  mentions: number;
  bullishPercentage: number;
  bearishPercentage: number;
  lastUpdated: Date;
}

export interface OnChainData {
  coinId: string;
  symbol: string;
  activeAddresses: number;
  transactionCount: number;
  exchangeInflows: number;
  exchangeOutflows: number;
  whaleMovements: number;
  holderDistribution: {
    addresses: number;
    percentage: number;
  }[];
  lastUpdated: Date;
}

export interface CryptoNews {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  description?: string;
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  coins?: string[];
}

export interface MarketMetrics {
  fearGreedIndex: number; // 0-100
  bitcoinDominance: number;
  ethereumDominance: number;
  totalMarketCap: number;
  totalVolume24h: number;
  lastUpdated: Date;
}

// Coinbase candle data structure: [timestamp, low, high, open, close, volume]
export interface CoinbaseCandle {
  time: number; // Unix timestamp
  low: string;
  high: string;
  open: string;
  close: string;
  volume: string;
}

// Alternative array format from Coinbase API
export type CoinbaseCandleArray = [number, string, string, string, string, string];


