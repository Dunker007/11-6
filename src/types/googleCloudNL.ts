/**
 * @/types/googleCloudNL.ts
 *
 * PURPOSE:
 * Defines TypeScript interfaces for interacting with the Google Cloud
 * Natural Language API. This ensures type-safe handling of requests
 * and responses for features like sentiment and entity analysis.
 */

/**
 * Represents the document to be analyzed.
 */
export interface NLDocument {
  type: 'PLAIN_TEXT' | 'HTML';
  content: string;
  language?: string;
}

/**
 * The response from a sentiment analysis request.
 */
export interface SentimentAnalysisResponse {
  documentSentiment: {
    magnitude: number;
    score: number;
  };
  language: string;
  sentences: Array<{
    text: {
      content: string;
      beginOffset: number;
    };
    sentiment: {
      magnitude: number;
      score: number;
    };
  }>;
}

/**
 * Represents a single entity found in the text.
 */
export interface NLEntity {
  name: string;
  type:
    | 'UNKNOWN'
    | 'PERSON'
    | 'LOCATION'
    | 'ORGANIZATION'
    | 'EVENT'
    | 'WORK_OF_ART'
    | 'CONSUMER_GOOD'
    | 'OTHER'
    | 'PHONE_NUMBER'
    | 'ADDRESS'
    | 'DATE'
    | 'NUMBER'
    | 'PRICE';
  metadata: Record<string, string>;
  salience: number;
  mentions: Array<{
    text: {
      content: string;
      beginOffset: number;
    };
    type: 'PROPER' | 'COMMON';
  }>;
}

/**
 * The response from an entity analysis request.
 */
export interface EntityAnalysisResponse {
  entities: NLEntity[];
  language: string;
}
