/**
 * Semantic Index Service
 * Manages semantic code search using LanceDB vector database
 */

// Dynamic import for LanceDB to avoid initial load issues
let lancedb: typeof import('@lancedb/lancedb') | null = null;

const loadLanceDB = async () => {
  if (!lancedb) {
    lancedb = await import('@lancedb/lancedb');
  }
  return lancedb;
};

import EmbeddingService from './embeddingService';
import { useProjectStore } from '../project/projectStore';
import { errorLogger } from '../errors/errorLogger';
import type { CodeChunk, SemanticSearchResult, IndexingProgress } from '@/types/semantic';
import { fileSystemService } from '../filesystem/fileSystemService';

// Use app data directory for LanceDB
const DB_PATH = '.dlx-studios/vector-data';

interface CodeChunkRow {
  id: string;
  file_path: string;
  content: string;
  line_start: number;
  line_end: number;
  embedding: number[];
  language?: string;
  function_name?: string;
  class_name?: string;
}

class SemanticIndexService {
  private db: any = null;
  private table: any = null;
  private isIndexing = false;
  private currentProgress: IndexingProgress = {
    status: 'idle',
    totalFiles: 0,
    indexedFiles: 0,
  };
  private progressCallbacks: Set<(progress: IndexingProgress) => void> = new Set();

  /**
   * Connect to LanceDB
   */
  private async connect(): Promise<any> {
    if (this.db) {
      return this.db;
    }

    try {
      const ldb = await loadLanceDB();
      // Ensure directory exists
      const dbDir = DB_PATH.substring(0, DB_PATH.lastIndexOf('/'));
      const existsResult = await fileSystemService.exists(dbDir);
      if (!existsResult.success || !existsResult.data) {
        await fileSystemService.mkdir(dbDir, true);
      }

      this.db = await ldb.connect(DB_PATH);
      return this.db;
    } catch (error) {
      console.error('Failed to connect to LanceDB:', error);
      errorLogger.logFromError('semantic-index', error as Error, 'error', {
        source: 'SemanticIndexService.connect',
      });
      throw error;
    }
  }

  /**
   * Get or create the code chunks table
   */
  private async getTable(): Promise<any> {
    if (this.table) {
      return this.table;
    }

    const db = await this.connect();
    const ldb = await loadLanceDB();
    
    try {
      // Try to open existing table
      this.table = await db.openTable('code_chunks');
    } catch {
      // Table doesn't exist, create it
      const schema = {
        id: ldb.vector(ldb.float32(), 384), // MiniLM-L6-v2 produces 384-dim embeddings
        file_path: ldb.utf8(),
        content: ldb.utf8(),
        line_start: ldb.int32(),
        line_end: ldb.int32(),
        embedding: ldb.vector(ldb.float32(), 384),
        language: ldb.utf8(),
        function_name: ldb.utf8(),
        class_name: ldb.utf8(),
      };

      // Create empty table with sample data
      const sampleData: CodeChunkRow[] = [];
      this.table = await db.createTable('code_chunks', sampleData);
    }

    return this.table;
  }

  /**
   * Start indexing the current project
   */
  public async startIndexingForCurrentProject(): Promise<void> {
    if (this.isIndexing) {
      console.log('Indexing already in progress');
      return;
    }

    const activeProject = useProjectStore.getState().activeProject;
    if (!activeProject) {
      console.warn('No active project to index');
      return;
    }

    this.isIndexing = true;
    this.currentProgress = {
      status: 'indexing',
      totalFiles: 0,
      indexedFiles: 0,
    };

    try {
      const projectPath = activeProject.path;
      const chunks = await this.chunkProjectFiles(projectPath);
      
      this.currentProgress.totalFiles = chunks.length;
      this.notifyProgress();

      const table = await this.getTable();
      
      // Generate embeddings and insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const embedding = await EmbeddingService.generateEmbedding(chunk.content);
          
          const row: CodeChunkRow = {
            id: chunk.id,
            file_path: chunk.filePath,
            content: chunk.content,
            line_start: chunk.lineStart,
            line_end: chunk.lineEnd,
            embedding,
            language: chunk.metadata?.language,
            function_name: chunk.metadata?.functionName,
            class_name: chunk.metadata?.className,
          };

          await table.add([row]);
          
          this.currentProgress.indexedFiles = i + 1;
          this.currentProgress.currentFile = chunk.filePath;
          this.notifyProgress();
        } catch (error) {
          console.error(`Failed to index chunk ${chunk.id}:`, error);
          // Continue with next chunk
        }
      }

      this.currentProgress.status = 'completed';
      this.notifyProgress();
    } catch (error) {
      console.error('Failed to index project:', error);
      this.currentProgress.status = 'error';
      this.currentProgress.error = (error as Error).message;
      this.notifyProgress();
      
      errorLogger.logFromError('semantic-index', error as Error, 'error', {
        source: 'SemanticIndexService.startIndexingForCurrentProject',
      });
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Chunk project files into searchable segments
   */
  private async chunkProjectFiles(projectPath: string): Promise<CodeChunk[]> {
    const chunks: CodeChunk[] = [];
    const chunkSize = 20; // lines per chunk
    const chunkOverlap = 5; // overlapping lines

    try {
      const files = await this.getAllCodeFiles(projectPath);
      
      for (const filePath of files) {
        try {
          const readResult = await fileSystemService.readFile(filePath);
          if (!readResult.success || !readResult.data) {
            continue;
          }
          const content = readResult.data;
          const lines = content.split('\n');
          const language = this.detectLanguage(filePath);

          // Create chunks with overlap
          for (let i = 0; i < lines.length; i += chunkSize - chunkOverlap) {
            const chunkLines = lines.slice(i, i + chunkSize);
            const chunkContent = chunkLines.join('\n');
            
            if (chunkContent.trim().length === 0) continue;

            const chunk: CodeChunk = {
              id: `${filePath}:${i}:${i + chunkLines.length}`,
              filePath,
              content: chunkContent,
              lineStart: i + 1,
              lineEnd: i + chunkLines.length,
              metadata: {
                language,
                functionName: this.extractFunctionName(chunkContent),
                className: this.extractClassName(chunkContent),
              },
            };

            chunks.push(chunk);
          }
        } catch (error) {
          console.warn(`Failed to read file ${filePath}:`, error);
          // Continue with next file
        }
      }
    } catch (error) {
      console.error('Failed to chunk project files:', error);
      throw error;
    }

    return chunks;
  }

  /**
   * Get all code files in a project
   */
  private async getAllCodeFiles(projectPath: string): Promise<string[]> {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.go', '.rs', '.php', '.rb'];
    const files: string[] = [];

    const walkDir = async (dir: string): Promise<void> => {
      try {
        const readResult = await fileSystemService.readdir(dir);
        if (!readResult.success || !readResult.data) {
          return;
        }
        
        for (const entry of readResult.data) {
          const fullPath = `${dir}/${entry.name}`;
          
          // Skip node_modules, .git, etc.
          if (entry.name.startsWith('.') || entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory) {
            await walkDir(fullPath);
          } else if (entry.isFile) {
            const ext = entry.name.substring(entry.name.lastIndexOf('.'));
            if (codeExtensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to read directory ${dir}:`, error);
      }
    };

    await walkDir(projectPath);
    return files;
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
    };
    return langMap[ext] || 'unknown';
  }

  /**
   * Extract function name from code chunk
   */
  private extractFunctionName(content: string): string | undefined {
    const functionMatch = content.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
    return functionMatch?.[1];
  }

  /**
   * Extract class name from code chunk
   */
  private extractClassName(content: string): string | undefined {
    const classMatch = content.match(/class\s+(\w+)/);
    return classMatch?.[1];
  }

  /**
   * Search for similar code chunks
   */
  public async search(query: string, limit: number = 10): Promise<SemanticSearchResult[]> {
    try {
      const table = await this.getTable();
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      // Perform vector search
      const results = await table
        .search(queryEmbedding)
        .limit(limit)
        .toArray();

      return results.map((row: any) => ({
        chunk: {
          id: row.id,
          filePath: row.file_path,
          content: row.content,
          lineStart: row.line_start,
          lineEnd: row.line_end,
          metadata: {
            language: row.language,
            functionName: row.function_name,
            className: row.class_name,
          },
        },
        similarity: row._distance ? 1 - row._distance : 0, // Convert distance to similarity
        filePath: row.file_path,
        lineStart: row.line_start,
        lineEnd: row.line_end,
        preview: this.createPreview(row.content),
      }));
    } catch (error) {
      console.error('Semantic search failed:', error);
      errorLogger.logFromError('semantic-search', error as Error, 'error', {
        source: 'SemanticIndexService.search',
        query,
      });
      return [];
    }
  }

  /**
   * Create a preview snippet from content
   */
  private createPreview(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Subscribe to indexing progress updates
   */
  public onProgress(callback: (progress: IndexingProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Notify all progress subscribers
   */
  private notifyProgress(): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ ...this.currentProgress });
      } catch (error) {
        console.warn('Progress callback error:', error);
      }
    });
  }

  /**
   * Get current indexing progress
   */
  public getProgress(): IndexingProgress {
    return { ...this.currentProgress };
  }

  /**
   * Clear the index
   */
  public async clearIndex(): Promise<void> {
    try {
      const db = await this.connect();
      await db.dropTable('code_chunks');
      this.table = null;
      this.currentProgress = {
        status: 'idle',
        totalFiles: 0,
        indexedFiles: 0,
      };
      this.notifyProgress();
    } catch (error) {
      console.error('Failed to clear index:', error);
      throw error;
    }
  }
}

export const semanticIndexService = new SemanticIndexService();

