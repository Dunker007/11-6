/**
 * NFT Service
 * 
 * Integrates with OpenSea API for NFT floor price and transaction tracking
 * Supports Ethereum, Polygon, and Solana NFTs
 */

import type { NFTAsset } from '@/types/wealth';
import { logger } from '../logging/loggerService';

const OPENSEA_API_BASE = 'https://api.opensea.io/api/v2';
const OPENSEA_POLYGON_API_BASE = 'https://api.opensea.io/api/v2';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for NFT prices

interface OpenSeaCollection {
  collection: string;
  name: string;
  description?: string;
  image_url?: string;
  floor_price?: number;
  num_owners?: number;
  total_supply?: number;
}

interface OpenSeaCollectionResponse {
  collection?: OpenSeaCollection;
}

interface OpenSeaNFT {
  identifier: string;
  collection: string;
  name?: string;
  description?: string;
  image_url?: string;
  traits?: Array<{
    trait_type: string;
    value: string;
    display_type?: string;
  }>;
  last_sale?: {
    total_price: number;
    payment_token: {
      symbol: string;
      decimals: number;
    };
    event_timestamp: string;
  };
  orders?: Array<{
    current_price: number;
    payment_token: {
      symbol: string;
      decimals: number;
    };
  }>;
}

interface OpenSeaNFTResponse {
  nft?: OpenSeaNFT;
}

interface OpenSeaAssetEvent {
  event_type: string;
  total_price?: string;
  payment_token?: {
    decimals: number;
  };
  seller?: { address: string };
  from_account?: { address: string };
  to_account?: { address: string };
  winner_account?: { address: string };
  transaction?: { transaction_hash: string };
  event_timestamp?: string;
  created_date?: string;
}

interface OpenSeaEventsResponse {
  asset_events?: OpenSeaAssetEvent[];
  events?: OpenSeaAssetEvent[];
}

type CachedData = OpenSeaNFT | number | OpenSeaCollection | OpenSeaAssetEvent[];

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class NFTService {
  private static instance: NFTService;
  private cache: Map<string, CacheEntry<CachedData>> = new Map();
  private apiKey: string | null = null;

  private constructor() {
    this.loadApiKey();
  }

  static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  private loadApiKey(): void {
    // In real implementation, would load from API key service
    try {
      const stored = localStorage.getItem('opensea_api_key');
      if (stored) {
        this.apiKey = stored;
      }
    } catch (error) {
      logger.error('Failed to load OpenSea API key:', { error });
    }
  }

  /**
   * Set OpenSea API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    try {
      localStorage.setItem('opensea_api_key', apiKey);
    } catch (error) {
      logger.error('Failed to save OpenSea API key:', { error });
    }
  }

  /**
   * Get NFT data from OpenSea
   */
  async getNFTData(
    contractAddress: string,
    tokenId: string,
    chain: 'ethereum' | 'polygon' | 'solana' = 'ethereum'
  ): Promise<OpenSeaNFT | null> {
    if (!this.apiKey && chain !== 'solana') {
      logger.warn('OpenSea API key not configured');
      return null;
    }

    const cacheKey = `opensea_${chain}_${contractAddress}_${tokenId}`;
    const cached = this.getCached<OpenSeaNFT>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const apiBase = chain === 'polygon' ? OPENSEA_POLYGON_API_BASE : OPENSEA_API_BASE;
      const chainParam = chain === 'polygon' ? 'matic' : chain === 'ethereum' ? 'ethereum' : 'solana';
      
      const url = `${apiBase}/chain/${chainParam}/contract/${contractAddress}/nfts/${tokenId}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data: OpenSeaNFTResponse = await response.json();
      const nft: OpenSeaNFT | null = data.nft || (data as unknown as OpenSeaNFT) || null;

      if (nft) {
        this.setCache(cacheKey, nft);
      }
      return nft;
    } catch (error) {
      logger.error('Failed to fetch OpenSea NFT data:', { error, contractAddress, tokenId, chain });
      return null;
    }
  }

  /**
   * Get collection floor price
   */
  async getCollectionFloorPrice(
    collectionSlug: string,
    chain: 'ethereum' | 'polygon' | 'solana' = 'ethereum'
  ): Promise<number | null> {
    const cacheKey = `opensea_floor_${chain}_${collectionSlug}`;
    const cached = this.getCached<number>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const apiBase = chain === 'polygon' ? OPENSEA_POLYGON_API_BASE : OPENSEA_API_BASE;
      const chainParam = chain === 'polygon' ? 'matic' : chain === 'ethereum' ? 'ethereum' : 'solana';
      
      const url = `${apiBase}/chain/${chainParam}/collection/${collectionSlug}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data: OpenSeaCollectionResponse = await response.json();
      const floorPrice = data.collection?.floor_price ?? null;

      if (floorPrice !== null) {
        this.setCache(cacheKey, floorPrice);
      }

      return floorPrice;
    } catch (error) {
      logger.error('Failed to fetch OpenSea collection floor price:', { error, collectionSlug, chain });
      return null;
    }
  }

  /**
   * Get NFT transaction history
   */
  async getTransactionHistory(
    contractAddress: string,
    tokenId: string,
    chain: 'ethereum' | 'polygon' | 'solana' = 'ethereum'
  ): Promise<Array<{
    date: Date;
    type: 'mint' | 'purchase' | 'sale' | 'transfer';
    price?: number;
    from?: string;
    to?: string;
    transactionHash?: string;
  }>> {
    try {
      const apiBase = chain === 'polygon' ? OPENSEA_POLYGON_API_BASE : OPENSEA_API_BASE;
      const chainParam = chain === 'polygon' ? 'matic' : chain === 'ethereum' ? 'ethereum' : 'solana';
      
      const url = `${apiBase}/chain/${chainParam}/contract/${contractAddress}/nfts/${tokenId}/events`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data: OpenSeaEventsResponse = await response.json();
      const events = data.asset_events || data.events || [];

      return events.map((event: OpenSeaAssetEvent) => {
        const eventType = event.event_type || 'transfer';
        let type: 'mint' | 'purchase' | 'sale' | 'transfer' = 'transfer';
        
        if (eventType === 'created' || eventType === 'mint') {
          type = 'mint';
        } else if (eventType === 'successful') {
          type = event.seller?.address ? 'sale' : 'purchase';
        }

        const price = event.total_price 
          ? parseFloat(event.total_price) / Math.pow(10, event.payment_token?.decimals || 18)
          : undefined;

        return {
          date: new Date(event.event_timestamp || event.created_date || Date.now()),
          type,
          price,
          from: event.from_account?.address,
          to: event.to_account?.address || event.winner_account?.address,
          transactionHash: event.transaction?.transaction_hash,
        };
      }).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      logger.error('Failed to fetch NFT transaction history:', { error, contractAddress, tokenId, chain });
      return [];
    }
  }

  /**
   * Update NFT asset with current OpenSea data
   */
  async updateNFTAsset(asset: NFTAsset): Promise<NFTAsset> {
    // Get floor price
    const floorPrice = await this.getCollectionFloorPrice(asset.collectionName, asset.chain === 'other' ? 'ethereum' : asset.chain);
    if (floorPrice !== null) {
      asset.currentFloorPrice = floorPrice;
    }

    // Get NFT details
    const nftData = await this.getNFTData(asset.contractAddress, asset.tokenId, asset.chain === 'other' ? 'ethereum' : asset.chain);
    if (nftData) {
      if (nftData.name && !asset.name) {
        asset.name = nftData.name;
      }
      if (nftData.image_url && !asset.imageUrl) {
        asset.imageUrl = nftData.image_url;
      }
      if (nftData.traits && !asset.traits) {
        asset.traits = nftData.traits.map(trait => ({
          traitType: trait.trait_type,
          value: trait.value,
          rarity: undefined, // Would need collection-wide trait analysis
        }));
      }
      if (nftData.last_sale) {
        const price = parseFloat(nftData.last_sale.total_price.toString()) / 
          Math.pow(10, nftData.last_sale.payment_token.decimals);
        asset.lastSalePrice = price;
        asset.lastSaleDate = new Date(nftData.last_sale.event_timestamp);
      }
      if (nftData.orders && nftData.orders.length > 0) {
        const lowestPrice = Math.min(...nftData.orders.map(order => 
          parseFloat(order.current_price.toString()) / Math.pow(10, order.payment_token.decimals)
        ));
        asset.currentFloorPrice = lowestPrice;
      }
    }

    // Get transaction history
    const transactions = await this.getTransactionHistory(
      asset.contractAddress,
      asset.tokenId,
      asset.chain === 'other' ? 'ethereum' : asset.chain
    );
    if (transactions.length > 0) {
      asset.transactionHistory = transactions;
    }

    return asset;
  }

  /**
   * Search NFT collections
   */
  async searchCollections(query: string): Promise<OpenSeaCollection[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `${OPENSEA_API_BASE}/collections?search=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`OpenSea API error: ${response.status}`);
      }

      const data = await response.json();
      return (data.collections || []).map((col: OpenSeaCollection) => ({
        collection: col.collection,
        name: col.name,
        description: col.description,
        image_url: col.image_url,
        floor_price: col.floor_price,
        num_owners: col.num_owners,
        total_supply: col.total_supply,
      }));
    } catch (error) {
      logger.error('Failed to search OpenSea collections:', { error, query });
      return [];
    }
  }

  /**
   * Get marketplace URL for an NFT
   */
  getMarketplaceUrl(asset: NFTAsset): string {
    const baseUrl = asset.chain === 'polygon' 
      ? 'https://opensea.io/assets/matic'
      : asset.chain === 'solana'
      ? 'https://opensea.io/assets/solana'
      : 'https://opensea.io/assets/ethereum';
    
    return `${baseUrl}/${asset.contractAddress}/${asset.tokenId}`;
  }

  private getCached<T extends CachedData>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T extends CachedData>(key: string, data: T): void {
    this.cache.set(key, {
      data: data as CachedData,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const nftService = NFTService.getInstance();

