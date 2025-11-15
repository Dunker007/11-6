import { create } from 'zustand';
import type {
  Coin,
  MarketData,
  TradingPair,
  CoinbaseOrder,
  CoinbasePosition,
  CoinbaseAccount,
  CoinbaseFill,
  Portfolio,
  SocialSentiment,
  OnChainData,
  CryptoNews,
  MarketMetrics,
  MarketType,
  CoinbaseCandle,
} from '@/types/crypto';
import { marketDataService } from './marketDataService';
import { coinbaseService } from './coinbaseService';

interface OrderBookData {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

interface CryptoStore {
  // Market Data
  marketData: MarketData | null;
  selectedCoin: Coin | null;
  selectedPair: TradingPair | null;
  isLoadingMarketData: boolean;
  marketDataError: string | null;

  // Coinbase Trading
  accounts: CoinbaseAccount[];
  positions: CoinbasePosition[];
  openOrders: CoinbaseOrder[];
  fills: CoinbaseFill[];
  portfolio: Portfolio | null;
  selectedMarketType: MarketType;
  isLoadingTrading: boolean;
  tradingError: string | null;

  // Trading Mode
  tradingMode: 'paper' | 'live';

  // Trading Interface State
  selectedProduct: string;
  orderBook: OrderBookData | null;
  chartData: CoinbaseCandle[];
  ticker: any | null;
  isLoadingOrderBook: boolean;
  isLoadingChart: boolean;

  // Analytics
  socialSentiment: SocialSentiment[];
  onChainData: OnChainData[];
  news: CryptoNews[];
  marketMetrics: MarketMetrics | null;

  // Actions - Market Data
  loadMarketData: () => Promise<void>;
  setSelectedCoin: (coin: Coin | null) => void;
  setSelectedPair: (pair: TradingPair | null) => void;

  // Actions - Trading
  loadAccounts: () => Promise<void>;
  loadPositions: () => Promise<void>;
  loadOrders: () => Promise<void>;
  loadFills: (productId?: string) => Promise<void>;
  loadPortfolio: () => Promise<void>;
  placeOrder: (
    productId: string,
    side: 'BUY' | 'SELL',
    orderConfig: CoinbaseOrder['order_configuration']
  ) => Promise<CoinbaseOrder>;
  cancelOrder: (orderId: string) => Promise<void>;
  setSelectedMarketType: (type: MarketType) => void;

  // Trading Mode Actions
  setTradingMode: (mode: 'paper' | 'live') => void;

  // Trading Interface Actions
  setSelectedProduct: (product: string) => void;
  loadOrderBook: (productId: string) => Promise<void>;
  loadChartData: (productId: string, granularity?: string) => Promise<void>;
  loadTicker: (productId: string) => Promise<void>;

  // Actions - Analytics
  loadSocialSentiment: () => Promise<void>;
  loadOnChainData: () => Promise<void>;
  loadNews: () => Promise<void>;
  loadMarketMetrics: () => Promise<void>;
}

export const useCryptoStore = create<CryptoStore>((set, get) => ({
  // Initial State
  marketData: null,
  selectedCoin: null,
  selectedPair: null,
  isLoadingMarketData: false,
  marketDataError: null,

  accounts: [],
  positions: [],
  openOrders: [],
  fills: [],
  portfolio: null,
  selectedMarketType: 'spot',
  isLoadingTrading: false,
  tradingError: null,

  // Trading Mode (default to paper trading)
  tradingMode: (() => {
    try {
      const stored = localStorage.getItem('coinbase_trading_mode');
      return stored === 'live' ? 'live' : 'paper';
    } catch {
      return 'paper';
    }
  })(),

  // Trading Interface State
  selectedProduct: 'BTC-USD',
  orderBook: null,
  chartData: [],
  ticker: null,
  isLoadingOrderBook: false,
  isLoadingChart: false,

  socialSentiment: [],
  onChainData: [],
  news: [],
  marketMetrics: null,

  // Market Data Actions
  loadMarketData: async () => {
    set({ isLoadingMarketData: true, marketDataError: null });
    try {
      const marketData = await marketDataService.getMarketData();
      set({ marketData, isLoadingMarketData: false });
    } catch (error) {
      set({
        marketDataError: (error as Error).message,
        isLoadingMarketData: false,
      });
    }
  },

  setSelectedCoin: (coin) => {
    set({ selectedCoin: coin });
  },

  setSelectedPair: (pair) => {
    set({ selectedPair: pair });
  },

  // Trading Actions
  loadAccounts: async () => {
    if (!coinbaseService.isConfigured()) {
      set({ tradingError: 'Coinbase API not configured' });
      return;
    }

    set({ isLoadingTrading: true, tradingError: null });
    try {
      const accounts = await coinbaseService.getAccounts();
      set({ accounts, isLoadingTrading: false });
    } catch (error) {
      set({
        tradingError: (error as Error).message,
        isLoadingTrading: false,
      });
    }
  },

  loadPositions: async () => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    try {
      const positions = await coinbaseService.getPositions();
      set({ positions });
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  },

  loadOrders: async () => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    try {
      const orders = await coinbaseService.getOrders();
      set({ openOrders: orders });
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  },

  loadFills: async (productId?: string) => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    try {
      const fills = await coinbaseService.getFills(productId);
      set({ fills });
    } catch (error) {
      console.error('Failed to load fills:', error);
    }
  },

  loadPortfolio: async () => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    set({ isLoadingTrading: true });
    try {
      const [accounts, positions] = await Promise.all([
        coinbaseService.getAccounts(),
        coinbaseService.getPositions(),
      ]);

      // Calculate portfolio totals
      const spotAccounts = accounts.filter((a) => a.type === 'SPOT');
      const futuresAccounts = accounts.filter((a) => a.type === 'FUTURES');

      const totalValue =
        spotAccounts.reduce(
          (sum, acc) => sum + parseFloat(acc.available_balance.value),
          0
        ) +
        futuresAccounts.reduce(
          (sum, acc) => sum + parseFloat(acc.available_balance.value),
          0
        );

      const availableBalance = spotAccounts.reduce(
        (sum, acc) => sum + parseFloat(acc.available_balance.value),
        0
      );

      const totalPnL = positions.reduce(
        (sum, pos) => sum + parseFloat(pos.unrealized_pnl),
        0
      );

      const portfolio: Portfolio = {
        totalValue,
        availableBalance,
        totalPnL,
        totalPnLPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
        positions,
        accounts,
      };

      set({ portfolio, isLoadingTrading: false });
    } catch (error) {
      set({
        tradingError: (error as Error).message,
        isLoadingTrading: false,
      });
    }
  },

  placeOrder: async (productId, side, orderConfig) => {
    if (!coinbaseService.isConfigured()) {
      throw new Error('Coinbase API not configured');
    }

    set({ isLoadingTrading: true, tradingError: null });
    try {
      const order = await coinbaseService.placeOrder(productId, side, orderConfig);
      // Reload orders and portfolio
      get().loadOrders();
      get().loadPortfolio();
      set({ isLoadingTrading: false });
      return order;
    } catch (error) {
      set({
        tradingError: (error as Error).message,
        isLoadingTrading: false,
      });
      throw error;
    }
  },

  cancelOrder: async (orderId) => {
    if (!coinbaseService.isConfigured()) {
      throw new Error('Coinbase API not configured');
    }

    try {
      await coinbaseService.cancelOrder(orderId);
      get().loadOrders();
      get().loadPortfolio();
    } catch (error) {
      set({ tradingError: (error as Error).message });
      throw error;
    }
  },

  setSelectedMarketType: (type) => {
    set({ selectedMarketType: type });
  },

  // Trading Mode Actions
  setTradingMode: (mode: 'paper' | 'live') => {
    coinbaseService.setTradingMode(mode);
    set({ tradingMode: mode });
    // Reload accounts and portfolio when mode changes
    get().loadAccounts();
    get().loadPortfolio();
  },

  // Trading Interface Actions
  setSelectedProduct: (product: string) => {
    set({ selectedProduct: product });
  },

  loadOrderBook: async (productId: string) => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    set({ isLoadingOrderBook: true });
    try {
      const data = await coinbaseService.getProductOrderBook(productId, 20);
      set({
        orderBook: {
          bids: data.pricebook.bids || [],
          asks: data.pricebook.asks || [],
        },
        isLoadingOrderBook: false,
      });
    } catch (error) {
      console.error('Failed to load order book:', error);
      set({ isLoadingOrderBook: false });
    }
  },

  loadChartData: async (productId: string, granularity: string = 'ONE_HOUR') => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    set({ isLoadingChart: true });
    try {
      // Calculate start and end times based on granularity
      const now = Math.floor(Date.now() / 1000);
      let startTime = now - 24 * 60 * 60; // Default to 24 hours ago

      // Adjust based on granularity
      const granularityMap: Record<string, number> = {
        'ONE_MINUTE': 60,
        'FIVE_MINUTE': 5 * 60,
        'FIFTEEN_MINUTE': 15 * 60,
        'ONE_HOUR': 60 * 60,
        'SIX_HOUR': 6 * 60 * 60,
        'ONE_DAY': 24 * 60 * 60,
      };

      const interval = granularityMap[granularity] || 60 * 60;
      const numCandles = 100; // Get last 100 candles
      startTime = now - (numCandles * interval);

      const candles = await coinbaseService.getProductCandles(
        productId,
        startTime.toString(),
        now.toString(),
        granularity
      );

      // Convert array format to object format if needed
      const formattedCandles: CoinbaseCandle[] = (candles || []).map((candle: any) => {
        // Handle both array format [time, low, high, open, close, volume] and object format
        if (Array.isArray(candle)) {
          return {
            time: candle[0],
            low: candle[1],
            high: candle[2],
            open: candle[3],
            close: candle[4],
            volume: candle[5],
          };
        }
        return candle;
      });

      set({
        chartData: formattedCandles,
        isLoadingChart: false,
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
      set({ isLoadingChart: false });
    }
  },

  loadTicker: async (productId: string) => {
    if (!coinbaseService.isConfigured()) {
      return;
    }

    try {
      const tickerData = await coinbaseService.getProductTicker(productId);
      set({ ticker: tickerData });
    } catch (error) {
      console.error('Failed to load ticker:', error);
    }
  },

  // Analytics Actions
  loadSocialSentiment: async () => {
    // Simulated data for now - can integrate with LunarCrush API later
    const sentiment: SocialSentiment[] = [
      {
        coinId: 'bitcoin',
        symbol: 'BTC',
        sentimentScore: 0.65,
        socialVolume: 125000,
        mentions: 45000,
        bullishPercentage: 72,
        bearishPercentage: 28,
        lastUpdated: new Date(),
      },
      {
        coinId: 'ethereum',
        symbol: 'ETH',
        sentimentScore: 0.58,
        socialVolume: 89000,
        mentions: 32000,
        bullishPercentage: 68,
        bearishPercentage: 32,
        lastUpdated: new Date(),
      },
    ];
    set({ socialSentiment: sentiment });
  },

  loadOnChainData: async () => {
    // Simulated data for now - can integrate with blockchain APIs later
    const onChain: OnChainData[] = [
      {
        coinId: 'bitcoin',
        symbol: 'BTC',
        activeAddresses: 950000,
        transactionCount: 280000,
        exchangeInflows: 1250,
        exchangeOutflows: 2100,
        whaleMovements: 45,
        holderDistribution: [
          { addresses: 1000000, percentage: 45 },
          { addresses: 500000, percentage: 30 },
          { addresses: 250000, percentage: 25 },
        ],
        lastUpdated: new Date(),
      },
    ];
    set({ onChainData: onChain });
  },

  loadNews: async () => {
    // Simulated data for now - can integrate with crypto news APIs later
    const news: CryptoNews[] = [
      {
        id: '1',
        title: 'Bitcoin Reaches New Monthly High',
        source: 'CryptoNews',
        url: '#',
        publishedAt: new Date(Date.now() - 3600000),
        description: 'Bitcoin price surges amid institutional adoption news.',
        sentiment: 'positive',
        coins: ['bitcoin'],
      },
    ];
    set({ news });
  },

  loadMarketMetrics: async () => {
    try {
      const globalMetrics = await marketDataService.getGlobalMetrics();
      const metrics: MarketMetrics = {
        fearGreedIndex: 65, // Simulated - can use Fear & Greed Index API
        bitcoinDominance: globalMetrics.bitcoinDominance,
        ethereumDominance: globalMetrics.ethereumDominance,
        totalMarketCap: globalMetrics.totalMarketCap,
        totalVolume24h: globalMetrics.totalVolume,
        lastUpdated: new Date(),
      };
      set({ marketMetrics: metrics });
    } catch (error) {
      console.error('Failed to load market metrics:', error);
    }
  },
}));

