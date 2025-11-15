/**
 * Embedding Service
 * Generates embeddings for code chunks using @xenova/transformers
 */

import { pipeline, Pipeline } from '@xenova/transformers';
import { logger } from '../logging/loggerService';

class EmbeddingService {
  private static instance: Pipeline | null = null;
  private static loadingPromise: Promise<Pipeline> | null = null;
  private static readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
  private static readonly CACHE_KEY_PREFIX = 'embedding_cache_';
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  private static readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

  private constructor() {}

  /**
   * Get or load the embedding pipeline instance
   */
  public static async getInstance(): Promise<Pipeline> {
    if (EmbeddingService.instance) {
      return EmbeddingService.instance;
    }

    if (EmbeddingService.loadingPromise) {
      return EmbeddingService.loadingPromise;
    }

    EmbeddingService.loadingPromise = (async () => {
      try {
        logger.info('Loading embedding model:', { model: EmbeddingService.MODEL_NAME });
        const pipelineInstance = await pipeline('feature-extraction', EmbeddingService.MODEL_NAME, {
          quantized: true,
        });
        EmbeddingService.instance = pipelineInstance as Pipeline;
        EmbeddingService.loadingPromise = null;
        logger.info('Embedding model loaded successfully');
        return pipelineInstance as Pipeline;
      } catch (error) {
        EmbeddingService.loadingPromise = null;
        logger.error('Failed to load embedding model:', { error, model: EmbeddingService.MODEL_NAME });
        throw error;
      }
    })();

    return EmbeddingService.loadingPromise;
  }

  /**
   * Generate embedding for a text string
   */
  public static async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cached = await EmbeddingService.getCachedEmbedding(text);
    if (cached) {
      return cached;
    }

    // Generate embedding
    const pipelineInstance = await EmbeddingService.getInstance();
    const result = await pipelineInstance(text, { pooling: 'mean', normalize: true });
    
    // Convert to array
    const embedding = Array.from(result.data) as number[];

    // Cache the result
    await EmbeddingService.cacheEmbedding(text, embedding);

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  public static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Ensure model is loaded
    await EmbeddingService.getInstance();
    const embeddings: number[][] = [];

    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => EmbeddingService.generateEmbedding(text));
      const batchEmbeddings = await Promise.all(batchPromises);
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }

  /**
   * Get cached embedding if available
   */
  private static async getCachedEmbedding(text: string): Promise<number[] | null> {
    try {
      const hash = await EmbeddingService.hashText(text);
      const cacheKey = `${EmbeddingService.CACHE_KEY_PREFIX}${hash}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const timestamp = parsed.timestamp;
      
      // Check if cache is expired
      if (Date.now() - timestamp > EmbeddingService.CACHE_TTL) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.embedding;
    } catch (error) {
      logger.warn('Failed to get cached embedding:', { error });
      return null;
    }
  }

  /**
   * Cache an embedding
   */
  private static async cacheEmbedding(text: string, embedding: number[]): Promise<void> {
    try {
      const hash = await EmbeddingService.hashText(text);
      const cacheKey = `${EmbeddingService.CACHE_KEY_PREFIX}${hash}`;
      
      const cacheEntry = {
        embedding,
        timestamp: Date.now(),
      };

      // Check cache size before adding
      await EmbeddingService.enforceCacheSizeLimit();

      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      logger.warn('Failed to cache embedding:', { error });
      // Ignore cache errors - not critical
    }
  }

  /**
   * Hash text for cache key
   */
  private static async hashText(text: string): Promise<string> {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Enforce cache size limit by removing oldest entries
   */
  private static async enforceCacheSizeLimit(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(EmbeddingService.CACHE_KEY_PREFIX)
      );

      if (keys.length === 0) return;

      // Calculate total size
      let totalSize = 0;
      const entries: Array<{ key: string; timestamp: number; size: number }> = [];

      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          const parsed = JSON.parse(value);
          const size = value.length;
          totalSize += size;
          entries.push({
            key,
            timestamp: parsed.timestamp || 0,
            size,
          });
        }
      }

      // Remove oldest entries if over limit
      if (totalSize > EmbeddingService.MAX_CACHE_SIZE) {
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        let removedSize = 0;
        for (const entry of entries) {
          if (totalSize - removedSize <= EmbeddingService.MAX_CACHE_SIZE) break;
          localStorage.removeItem(entry.key);
          removedSize += entry.size;
        }
      }
    } catch (error) {
      logger.warn('Failed to enforce cache size limit:', { error });
    }
  }

  /**
   * Clear all cached embeddings
   */
  public static clearCache(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(EmbeddingService.CACHE_KEY_PREFIX)
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      logger.warn('Failed to clear embedding cache:', { error });
    }
  }
}

export default EmbeddingService;

