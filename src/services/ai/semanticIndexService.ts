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
import { logger } from '../logging/loggerService';
import type { LanceDBConnection, LanceDBTable } from '@/types/lancedb';
import type { LanceDBModule } from '@/types/external';

// Use app data directory for LanceDB
const DB_PATH = '.dlx-studios/vector-data';

interface CodeChunkRow {
  id: string;
  filePath: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  embedding: number[];
  language?: string;
  functionName?: string;
  className?: string;
}

class SemanticIndexService {
  private static instance: SemanticIndexService;
  private db: LanceDBConnection | null = null;
  private table: LanceDBTable | null = null;
  private isIndexing = false;
  private currentProgress: IndexingProgress = {
    status: 'idle',
    totalFiles: 0,
    indexedFiles: 0,
  };
  private progressCallbacks: Set<(progress: IndexingProgress) => void> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): SemanticIndexService {
    if (!SemanticIndexService.instance) {
      SemanticIndexService.instance = new SemanticIndexService();
    }
    return SemanticIndexService.instance;
  }

  /**
   * Connect to LanceDB
   */
  private async connect(): Promise<LanceDBConnection> {
    if (this.db) {
      return this.db;
    }

    try {
      logger.info('Connecting to LanceDB...');
      const ldb = await loadLanceDB();
      // Ensure directory exists
      const dbDir = DB_PATH.substring(0, DB_PATH.lastIndexOf('/'));
      const existsResult = await fileSystemService.exists(dbDir);
      if (!existsResult.success || !existsResult.data) {
        await fileSystemService.mkdir(dbDir, true);
      }

      this.db = await ldb.connect(DB_PATH) as unknown as LanceDBConnection;
      logger.info('LanceDB connection successful.');
      return this.db as LanceDBConnection;
    } catch (error) {
      logger.error('Failed to connect to LanceDB', { error });
      errorLogger.logFromError(
        'runtime',
        error as Error,
        'error',
        { source: 'SemanticIndexService.connect' }
      );
      throw error;
    }
  }

  /**
   * Get or create the code chunks table
   */
  private async getOrCreateTable(): Promise<LanceDBTable> {
    if (this.table) return this.table;

    const db = await this.connect();
    const tableName = 'code_chunks';
    
    try {
      // Try to open existing table
      this.table = await db.openTable(tableName);
    } catch {
      // Table doesn't exist, create it
      // Schema: { id: vector(float32, 384), file_path: utf8, content: utf8, line_start: int32, line_end: int32, 
      //           embedding: vector(float32, 384), language: utf8, function_name: utf8, class_name: utf8 }
      // MiniLM-L6-v2 produces 384-dim embeddings
      logger.info('Creating new LanceDB table.');
      const ldb = await loadLanceDB() as unknown as LanceDBModule;
      if (!ldb) throw new Error('LanceDB failed to load');
      const embedding = await EmbeddingService.generateEmbedding('test');
      const schema = ldb.Schema.from({
        embedding: ldb.Vector(embedding.length),
        filePath: 'string',
        content: 'string',
        lineStart: 'int32',
        lineEnd: 'int32',
        language: 'string',
        functionName: 'string',
        className: 'string',
      });
      this.table = await db.createTable(tableName, schema) as unknown as LanceDBTable;
    }

    return this.table!;
  }

  /**
   * Start indexing the current project
   */
  public async startIndexingForCurrentProject(): Promise<void> {
    if (this.isIndexing) {
      logger.info('Indexing already in progress');
      return;
    }

    const activeProject = useProjectStore.getState().activeProject;
    if (!activeProject) {
      logger.warn('No active project to index');
      return;
    }

    this.isIndexing = true;
    this.currentProgress = {
      status: 'indexing',
      totalFiles: 0,
      indexedFiles: 0,
    };

    try {
      const projectPath = activeProject.rootPath;
      const chunks = await this.chunkProjectFiles(projectPath);
      
      this.currentProgress.totalFiles = chunks.length;
      this.notifyProgress();

      const table = await this.getOrCreateTable();
      
      // Generate embeddings and insert chunks
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          const embedding = await EmbeddingService.generateEmbedding(chunk.content);
          
          const row: CodeChunkRow = {
            id: chunk.id,
            filePath: chunk.filePath,
            content: chunk.content,
            lineStart: chunk.lineStart,
            lineEnd: chunk.lineEnd,
            embedding,
            language: chunk.metadata?.language,
            functionName: chunk.metadata?.functionName,
            className: chunk.metadata?.className,
          };

          await table.add([row]);
          
          this.currentProgress.indexedFiles = i + 1;
          this.currentProgress.currentFile = chunk.filePath;
          this.notifyProgress();
        } catch (error) {
          logger.error(`Failed to index chunk ${chunk.id}:`, { error });
          // Continue with next chunk
        }
      }

      this.currentProgress.status = 'completed';
      this.notifyProgress();
    } catch (error) {
      logger.error('Failed to index project:', { error });
      this.currentProgress.status = 'error';
      this.currentProgress.error = (error as Error).message;
      this.notifyProgress();
      
      errorLogger.logFromError(
        'runtime',
        error as Error,
        'error',
        { source: 'SemanticIndexService.startIndexingForCurrentProject' }
      );
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
          logger.warn(`Failed to read file ${filePath}:`, { error });
          // Continue with next file
        }
      }
    } catch (error) {
      logger.error('Failed to chunk project files:', { error });
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
        logger.warn(`Failed to read directory ${dir}:`, { error });
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
    if (!this.db || !this.table) {
      logger.warn('Search attempted before index was ready.');
      return [];
    }

    try {
      const queryEmbedding = await EmbeddingService.generateEmbedding(query);

      // Perform vector search
      const results = await this.table.search(queryEmbedding).limit(limit).execute();

      return (results as CodeChunkRow[]).map((result: CodeChunkRow) => ({
        chunk: {
          id: result.id, 
          filePath: result.filePath,
          content: result.content,
          lineStart: result.lineStart,
          lineEnd: result.lineEnd,
          metadata: {
            language: result.language,
            functionName: result.functionName,
            className: result.className,
          },
        },
        similarity: 0, // LanceDB JS binding doesn't expose similarity score yet
        filePath: result.filePath,
        lineStart: result.lineStart,
        lineEnd: result.lineEnd,
        preview: result.content.substring(0, 200),
      }));
    } catch (error) {
      logger.error('Semantic search failed:', { error, query });
      errorLogger.logFromError(
        'runtime',
        error as Error,
        'error',
        { source: 'SemanticIndexService.search' }
      );
      return [];
    }
  }

  /**
   * Create a preview snippet from content
   * Reserved for future use
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _createPreview(content: string, maxLength: number = 150): string {
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
        logger.warn('Progress callback error:', { error });
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
      logger.error('Failed to clear index:', { error });
      throw error;
    }
  }
}

export const semanticIndexService = SemanticIndexService.getInstance();

