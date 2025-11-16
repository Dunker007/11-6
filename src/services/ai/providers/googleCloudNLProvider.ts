/**
 * @/services/ai/providers/googleCloudNLProvider.ts
 *
 * PURPOSE:
 * Provides an interface to the Google Cloud Natural Language API.
 * This service will be used for advanced text analysis features, such as
 * sentiment analysis of code comments or entity extraction from documentation.
 */
import { apiKeyService } from '@/services/apiKeys/apiKeyService';
import type {
  SentimentAnalysisResponse,
  EntityAnalysisResponse,
  NLDocument,
} from '@/types/googleCloudNL';

const API_BASE_URL = 'https://language.googleapis.com/v1';

interface GoogleCloudErrorResponse {
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

class GoogleCloudNLProvider {
  private apiKey: string | null = null;
  public isAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await apiKeyService.ensureInitialized();
    // For Google Cloud services, we'll need a specific API key.
    // We will look for a 'googlecloud' key type.
    this.apiKey = await apiKeyService.getKeyForProviderAsync('googlecloud');
    this.isAvailable = !!this.apiKey;
  }

  /**
   * Analyzes the sentiment of a given text document.
   *
   * @param document - The document to analyze.
   * @returns A promise that resolves to the sentiment analysis response.
   */
  public async analyzeSentiment(document: NLDocument): Promise<SentimentAnalysisResponse> {
    if (!this.isAvailable || !this.apiKey) {
      throw new Error('Google Cloud NL API key is not configured.');
    }

    const response = await fetch(`${API_BASE_URL}/documents:analyzeSentiment?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document,
        encodingType: 'UTF8',
      }),
    });

    if (!response.ok) {
      const error: GoogleCloudErrorResponse = await response.json();
      throw new Error(`Google Cloud NL API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Analyzes the entities within a given text document.
   *
   * @param document - The document to analyze.
   * @returns A promise that resolves to the entity analysis response.
   */
  public async analyzeEntities(document: NLDocument): Promise<EntityAnalysisResponse> {
    if (!this.isAvailable || !this.apiKey) {
      throw new Error('Google Cloud NL API key is not configured.');
    }

    const response = await fetch(`${API_BASE_URL}/documents:analyzeEntities?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document,
        encodingType: 'UTF8',
      }),
    });

    if (!response.ok) {
      const error: GoogleCloudErrorResponse = await response.json();
      throw new Error(`Google Cloud NL API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }
}

export const googleCloudNLProvider = new GoogleCloudNLProvider();
