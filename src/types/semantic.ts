/**
 * Semantic Search Types
 * Types for semantic code search using vector embeddings
 */

export interface CodeChunk {
  id: string;
  filePath: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  embedding?: number[];
  metadata?: {
    language?: string;
    functionName?: string;
    className?: string;
  };
}

export interface SemanticSearchResult {
  chunk: CodeChunk;
  similarity: number;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  preview: string;
}

export type IndexingStatus = 'idle' | 'indexing' | 'completed' | 'error';

export interface IndexingProgress {
  status: IndexingStatus;
  totalFiles: number;
  indexedFiles: number;
  currentFile?: string;
  error?: string;
}

