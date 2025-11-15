import type {
  CoinbaseOrder,
  CoinbasePosition,
  CoinbaseAccount,
  CoinbaseFill,
  OrderSide,
  MarketType,
} from '@/types/crypto';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';

const COINBASE_API_BASE = 'https://api.coinbase.com/api/v3/brokerage';
const COINBASE_SANDBOX_BASE = 'https://api.coinbase.com/api/v3/brokerage'; // Same for now

interface CoinbaseCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
  sandbox?: boolean;
}

class CoinbaseService {
  private static instance: CoinbaseService;
  private credentials: CoinbaseCredentials | null = null;
  private tradingMode: 'paper' | 'live' = 'paper'; // Default to paper trading
  private credentialsLoaded: Promise<void>;

  private constructor() {
    // Load credentials asynchronously to avoid race condition
    this.credentialsLoaded = this.loadCredentialsAsync();
    this.loadTradingMode();
  }

  static getInstance(): CoinbaseService {
    if (!CoinbaseService.instance) {
      CoinbaseService.instance = new CoinbaseService();
    }
    return CoinbaseService.instance;
  }

  /**
   * Ensure credentials are loaded before use
   */
  async ensureCredentialsLoaded(): Promise<void> {
    await this.credentialsLoaded;
  }

  private loadTradingMode(): void {
    try {
      const stored = localStorage.getItem('coinbase_trading_mode');
      if (stored === 'live' || stored === 'paper') {
        this.tradingMode = stored;
      }
    } catch (error) {
      console.error('Failed to load trading mode:', error);
    }
  }

  setTradingMode(mode: 'paper' | 'live'): void {
    this.tradingMode = mode;
    try {
      localStorage.setItem('coinbase_trading_mode', mode);
    } catch (error) {
      console.error('Failed to save trading mode:', error);
    }
  }

  getTradingMode(): 'paper' | 'live' {
    return this.tradingMode;
  }

  private async loadCredentialsAsync(): Promise<void> {
    try {
      // Ensure API key service is initialized before accessing keys
      await apiKeyService.ensureInitialized();
      const keys = await apiKeyService.getKeysAsync();
      const coinbaseKey = keys.find((k) => k.provider === 'coinbase');
      if (coinbaseKey && coinbaseKey.metadata) {
        this.credentials = {
          apiKey: coinbaseKey.key,
          secret: coinbaseKey.metadata.secret || '',
          passphrase: coinbaseKey.metadata.passphrase || '',
          sandbox: coinbaseKey.metadata.sandbox || false,
        };
      }
    } catch (error) {
      console.error('Failed to load Coinbase credentials:', error);
    }
  }

  /**
   * Reload credentials from storage (useful after API key updates)
   */
  async reloadCredentials(): Promise<void> {
    await this.loadCredentialsAsync();
  }

  async setCredentials(credentials: CoinbaseCredentials): Promise<void> {
    this.credentials = credentials;
    // Save to apiKeyService
    await apiKeyService.addKey('coinbase', credentials.apiKey, 'Coinbase API', {
      secret: credentials.secret,
      passphrase: credentials.passphrase,
      sandbox: credentials.sandbox || false,
    });
    // Reload to ensure consistency
    await this.reloadCredentials();
  }

  isConfigured(): boolean {
    return !!(
      this.credentials?.apiKey &&
      this.credentials?.secret &&
      this.credentials?.passphrase
    );
  }

  /**
   * Check if credentials are configured (async version that waits for loading)
   */
  async isConfiguredAsync(): Promise<boolean> {
    await this.ensureCredentialsLoaded();
    return this.isConfigured();
  }

  private getBaseUrl(): string {
    // Use sandbox if explicitly set in credentials OR if trading mode is 'paper'
    const useSandbox = this.tradingMode === 'paper' || this.credentials?.sandbox === true;
    return useSandbox ? COINBASE_SANDBOX_BASE : COINBASE_API_BASE;
  }

  /**
   * Generate Coinbase API signature
   */
  private generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: string
  ): string {
    if (!this.credentials) {
      throw new Error('Coinbase credentials not configured');
    }

    const message = timestamp + method + path + body;
    // In a real implementation, use crypto.subtle for HMAC-SHA256
    // For now, this is a placeholder - actual implementation would need Node.js crypto or a library
    return btoa(message); // Placeholder - replace with proper HMAC-SHA256
  }

  /**
   * Make authenticated API request
   */
  private async authenticatedRequest<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    // Ensure credentials are loaded before making requests
    await this.ensureCredentialsLoaded();
    
    if (!this.isConfigured()) {
      throw new Error('Coinbase API not configured. Please add API credentials.');
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.generateSignature(method, path, bodyString, timestamp);

    const headers: Record<string, string> = {
      'CB-ACCESS-KEY': this.credentials!.apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-ACCESS-PASSPHRASE': this.credentials!.passphrase,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${this.getBaseUrl()}${path}`, {
        method,
        headers,
        body: bodyString || undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`Coinbase API error: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Coinbase API request failed:`, error);
      throw error;
    }
  }

  /**
   * Get account balances
   */
  async getAccounts(): Promise<CoinbaseAccount[]> {
    const data = await this.authenticatedRequest<{ accounts: CoinbaseAccount[] }>(
      'GET',
      '/accounts'
    );
    return data.accounts || [];
  }

  /**
   * Get account by UUID
   */
  async getAccount(accountUuid: string): Promise<CoinbaseAccount> {
    return this.authenticatedRequest<CoinbaseAccount>('GET', `/accounts/${accountUuid}`);
  }

  /**
   * Get open positions (futures)
   */
  async getPositions(): Promise<CoinbasePosition[]> {
    try {
      const data = await this.authenticatedRequest<{ positions: CoinbasePosition[] }>(
        'GET',
        '/positions'
      );
      return data.positions || [];
    } catch (error) {
      console.error('Failed to fetch positions:', error);
      return [];
    }
  }

  /**
   * Get open orders
   */
  async getOrders(
    productId?: string,
    orderStatus?: string[]
  ): Promise<CoinbaseOrder[]> {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId);
    if (orderStatus) params.append('order_status', orderStatus.join(','));

    const query = params.toString();
    const path = `/orders${query ? `?${query}` : ''}`;

    const data = await this.authenticatedRequest<{ orders: CoinbaseOrder[] }>('GET', path);
    return data.orders || [];
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<CoinbaseOrder> {
    return this.authenticatedRequest<CoinbaseOrder>('GET', `/orders/${orderId}`);
  }

  /**
   * Place a new order
   */
  async placeOrder(
    productId: string,
    side: OrderSide,
    orderConfiguration: CoinbaseOrder['order_configuration']
  ): Promise<CoinbaseOrder> {
    const body = {
      product_id: productId,
      side,
      order_configuration: orderConfiguration,
    };

    const data = await this.authenticatedRequest<{ order: CoinbaseOrder }>(
      'POST',
      '/orders',
      body
    );
    return data.order;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ order_id: string }> {
    return this.authenticatedRequest<{ order_id: string }>('DELETE', `/orders/${orderId}`);
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(productId?: string): Promise<{ order_ids: string[] }> {
    const params = productId ? `?product_id=${productId}` : '';
    return this.authenticatedRequest<{ order_ids: string[] }>(
      'DELETE',
      `/orders${params}`
    );
  }

  /**
   * Get fills (trade history)
   */
  async getFills(
    productId?: string,
    orderId?: string,
    startSequenceTimestamp?: string,
    endSequenceTimestamp?: string
  ): Promise<CoinbaseFill[]> {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId);
    if (orderId) params.append('order_id', orderId);
    if (startSequenceTimestamp) params.append('start_sequence_timestamp', startSequenceTimestamp);
    if (endSequenceTimestamp) params.append('end_sequence_timestamp', endSequenceTimestamp);

    const query = params.toString();
    const path = `/fills${query ? `?${query}` : ''}`;

    const data = await this.authenticatedRequest<{ fills: CoinbaseFill[] }>('GET', path);
    return data.fills || [];
  }

  /**
   * Get product (trading pair) information
   */
  async getProduct(productId: string): Promise<any> {
    return this.authenticatedRequest('GET', `/products/${productId}`);
  }

  /**
   * Get all products (trading pairs)
   */
  async getProducts(productType?: MarketType): Promise<any[]> {
    const params = productType ? `?product_type=${productType.toUpperCase()}` : '';
    const data = await this.authenticatedRequest<{ products: any[] }>(
      'GET',
      `/products${params}`
    );
    return data.products || [];
  }

  /**
   * Get product candles (price history)
   */
  async getProductCandles(
    productId: string,
    start: string,
    end: string,
    granularity: string = 'ONE_HOUR'
  ): Promise<any> {
    const params = new URLSearchParams({
      start,
      end,
      granularity,
    });
    const data = await this.authenticatedRequest<{ candles: any[] }>(
      'GET',
      `/products/${productId}/candles?${params.toString()}`
    );
    return data.candles || [];
  }

  /**
   * Get product ticker (24hr stats)
   */
  async getProductTicker(productId: string): Promise<any> {
    return this.authenticatedRequest('GET', `/products/${productId}/ticker`);
  }

  /**
   * Get product order book (bids and asks)
   */
  async getProductOrderBook(productId: string, limit: number = 20): Promise<{
    pricebook: {
      bids: Array<{ price: string; size: string }>;
      asks: Array<{ price: string; size: string }>;
    };
  }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    return this.authenticatedRequest<{
      pricebook: {
        bids: Array<{ price: string; size: string }>;
        asks: Array<{ price: string; size: string }>;
      };
    }>('GET', `/products/${productId}/book?${params.toString()}`);
  }
}

export const coinbaseService = CoinbaseService.getInstance();

