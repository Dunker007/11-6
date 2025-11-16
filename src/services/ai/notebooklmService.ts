import { apiKeyService } from '@/services/apiKeys/apiKeyService';
import type { Notebook, Source, NotebookDocument, NotebookResponse } from '@/types/notebooklm';
import { fileSystemService } from '../filesystem/fileSystemService';
import { logger } from '../logging/loggerService';

const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.gz', '.tar', '.lock'];
const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB

/**
 * NotebookLM Service
 * Manages document uploads, notebooks, and research features
 * Uses Gemini API (same as NotebookLM)
 */
export class NotebookLMService {
  private static instance: NotebookLMService;
  private notebooks: Map<string, Notebook> = new Map();
  private readonly STORAGE_KEY = 'dlx_notebooklm_notebooks';
  private apiKey: string | null = null;

  private constructor() {
    this.loadNotebooks();
    this.initialize();
  }

  static getInstance(): NotebookLMService {
    if (!NotebookLMService.instance) {
      NotebookLMService.instance = new NotebookLMService();
    }
    return NotebookLMService.instance;
  }

  private loadNotebooks(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((notebook: Notebook) => {
          notebook.createdAt = new Date(notebook.createdAt);
          notebook.updatedAt = new Date(notebook.updatedAt);
          notebook.documents.forEach((doc: NotebookDocument) => {
            doc.uploadedAt = new Date(doc.uploadedAt);
          });
          this.notebooks.set(notebook.id, notebook);
        });
      }
    } catch (error) {
      logger.error('Failed to load notebooks:', { error });
    }
  }

  private saveNotebooks(): void {
    try {
      const notebooksArray = Array.from(this.notebooks.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notebooksArray));
    } catch (error) {
      logger.error('Failed to save notebooks:', { error });
    }
  }

  private async initialize() {
    await apiKeyService.ensureInitialized();
    this.apiKey = await apiKeyService.getKeyForProviderAsync('notebooklm');
  }

  /**
   * Create a new notebook
   */
  async createNotebook(name: string, description?: string): Promise<Notebook> {
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      name,
      description,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notebooks.set(notebook.id, notebook);
    this.saveNotebooks();
    return notebook;
  }

  /**
   * Get all notebooks
   */
  getNotebooks(): Notebook[] {
    return Array.from(this.notebooks.values());
  }

  /**
   * Get a notebook by ID
   */
  getNotebook(id: string): Notebook | null {
    return this.notebooks.get(id) || null;
  }

  /**
   * Delete a notebook
   */
  async deleteNotebook(id: string): Promise<boolean> {
    const deleted = this.notebooks.delete(id);
    if (deleted) {
      this.saveNotebooks();
    }
    return deleted;
  }

  /**
   * Upload a document to a notebook
   */
  async uploadDocument(
    notebookId: string,
    document: Omit<NotebookDocument, 'id' | 'uploadedAt'>
  ): Promise<NotebookDocument> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error('Notebook not found');
    }

    // Check if a document with the same path or title already exists to prevent duplicates
    const existingDocIndex = notebook.documents.findIndex(
      (doc) => (doc.sourcePath && doc.sourcePath === document.sourcePath) || doc.title === document.title
    );

    const newDocument: NotebookDocument = {
      id: existingDocIndex !== -1 ? notebook.documents[existingDocIndex].id : crypto.randomUUID(),
      ...document,
      uploadedAt: new Date(),
    };

    if (existingDocIndex !== -1) {
      // Update existing document
      notebook.documents[existingDocIndex] = newDocument;
    } else {
      // Add new document
      notebook.documents.push(newDocument);
    }

    notebook.updatedAt = new Date();
    this.notebooks.set(notebookId, notebook);
    this.saveNotebooks();

    return newDocument;
  }

  async syncProjectFilesToNotebook(
    notebookId: string,
    projectRoot: string
  ): Promise<{ added: number; updated: number; skipped: number }> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error('Notebook not found');
    }

    let stats = { added: 0, updated: 0, skipped: 0 };
    
    // Recursively get all files in the project
    const getAllFiles = async (dir: string): Promise<string[]> => {
      const result = await fileSystemService.readdir(dir);
      if (!result.success || !result.data) return [];
      
      const files: string[] = [];
      for (const entry of result.data) {
        if (entry.isDirectory) {
          files.push(...await getAllFiles(entry.path));
        } else {
          files.push(entry.path);
        }
      }
      return files;
    };

    const files = await getAllFiles(projectRoot);

    const processFile = async (filePath: string) => {
      const extension = filePath.substring(filePath.lastIndexOf('.'));
      if (IGNORED_EXTENSIONS.includes(extension)) {
        stats.skipped++;
        return;
      }

      try {
        const fileContentResult = await fileSystemService.readFile(filePath);
        if (!fileContentResult.success || !fileContentResult.data) {
          stats.skipped++;
          return;
        }
        
        const fileContent = fileContentResult.data;
        if (fileContent.length > MAX_FILE_SIZE_BYTES) {
          stats.skipped++;
          return;
        }

        const existingDoc = notebook.documents.find(
          (doc) => doc.sourcePath === filePath
        );

        if (existingDoc && existingDoc.content === fileContent) {
          // Content is unchanged, skip
          return;
        }

        await this.uploadDocument(notebookId, {
          title: filePath.replace(projectRoot, ''),
          content: fileContent,
          sourcePath: filePath,
          tags: ['project-file'],
        });

        if (existingDoc) {
          stats.updated++;
        } else {
          stats.added++;
        }
      } catch (error) {
        logger.error(`Failed to process file ${filePath}:`, { error });
        stats.skipped++;
      }
    };

    // Using a sequential loop to avoid overwhelming the system
    for (const file of files) {
      await processFile(file);
    }

    return stats;
  }

  async answerProjectQuestion(
    projectId: string,
    projectName: string,
    projectRoot: string,
    question: string
  ): Promise<NotebookResponse> {
    // Find or create a dedicated notebook for this project
    let projectNotebook = Array.from(this.notebooks.values()).find(
      (n) => n.projectId === projectId
    );

    if (!projectNotebook) {
      projectNotebook = await this.createNotebook(
        `Project Context: ${projectName}`,
        `This notebook contains the source code for the '${projectName}' project.`
      );
      projectNotebook.projectId = projectId;
      this.notebooks.set(projectNotebook.id, projectNotebook);
      this.saveNotebooks();
    }

    // Sync project files to the notebook
    // In a real application, you might do this in the background or only if changes are detected.
    await this.syncProjectFilesToNotebook(projectNotebook.id, projectRoot);

    // Now, query the notebook with the user's question
    return this.queryNotebook(projectNotebook.id, question);
  }

  /**
   * List all available notebooks from the NotebookLM API.
   * NOTE: This is a mocked implementation.
   */
  async listNotebooks(): Promise<Notebook[]> {
    if (!this.apiKey) {
      // Return local notebooks if API key is not available
      return this.getNotebooks();
    }

    // MOCK IMPLEMENTATION
    logger.info('Fetching notebooks from NotebookLM API...');
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    
    const mockNotebooks: Notebook[] = [
      { id: 'notebook-1', name: 'Project Titan Research', documents: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'notebook-2', name: 'Q3 Marketing Strategy', documents: [], createdAt: new Date(), updatedAt: new Date() },
      { id: 'notebook-3', name: 'Competitor Analysis', documents: [], createdAt: new Date(), updatedAt: new Date() },
    ];

    // Merge with local notebooks
    mockNotebooks.forEach(nb => {
      if (!this.notebooks.has(nb.id)) {
        this.notebooks.set(nb.id, nb);
      }
    });
    this.saveNotebooks();
    
    return Array.from(this.notebooks.values());
  }

  /**
   * List all sources for a given notebook from the NotebookLM API.
   * NOTE: This is a mocked implementation.
   */
  async listSources(notebookId: string): Promise<Source[]> {
    if (!this.apiKey) {
      throw new Error('NotebookLM API key not configured.');
    }
    
    logger.info(`Fetching sources for notebook ${notebookId}...`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    // MOCK IMPLEMENTATION
    const mockSources: { [key: string]: Source[] } = {
      'notebook-1': [
        { id: 'source-1-1', displayName: 'Titan Architecture Spec.pdf', type: 'file' },
        { id: 'source-1-2', displayName: 'User Interview Notes.gdoc', type: 'google_doc' },
        { id: 'source-1-3', displayName: 'Market Research Report.pdf', type: 'file' },
      ],
      'notebook-2': [
        { id: 'source-2-1', displayName: 'Campaign Brief.gdoc', type: 'google_doc' },
        { id: 'source-2-2', displayName: 'Social Media Analytics.url', type: 'url' },
      ],
      'notebook-3': [
        { id: 'source-3-1', displayName: 'Competitor X Website Analysis.pdf', type: 'file' },
        { id: 'source-3-2', displayName: 'Competitor Y Funding News.url', type: 'url' },
      ],
    };

    return mockSources[notebookId] || [];
  }

  /**
   * Query a notebook with a question
   * Uses Gemini API to answer questions based on notebook documents
   */
  async queryNotebook(
    notebookId: string,
    question: string
  ): Promise<NotebookResponse> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error('Notebook not found');
    }

    if (notebook.documents.length === 0) {
      throw new Error('Notebook has no documents');
    }

    // Get API key (Gemini or NotebookLM)
    await apiKeyService.ensureInitialized();
    const apiKey = await apiKeyService.getGlobalKey('notebooklm', ['gemini']);
    if (!apiKey) {
      throw new Error('NotebookLM/Gemini API key not configured');
    }

    // Build context from documents
    const context = notebook.documents
      .map((doc, idx) => `Document ${idx + 1}: ${doc.title}\n${doc.content}`)
      .join('\n\n---\n\n');

    const prompt = `Based on the following documents, answer this question: ${question}\n\nDocuments:\n${context}`;

    // Use Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`NotebookLM API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract sources (simplified - in production would use actual citation extraction)
    const sources = notebook.documents.map((doc) => doc.sourceUrl || doc.title);

    return {
      text,
      sources,
      citations: notebook.documents.map((doc) => ({
        documentId: doc.id,
        excerpt: doc.content.substring(0, 200),
      })),
    };
  }

  /**
   * Remove a document from a notebook
   */
  async removeDocument(notebookId: string, documentId: string): Promise<boolean> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      return false;
    }

    const index = notebook.documents.findIndex((doc) => doc.id === documentId);
    if (index === -1) {
      return false;
    }

    notebook.documents.splice(index, 1);
    notebook.updatedAt = new Date();
    this.notebooks.set(notebookId, notebook);
    this.saveNotebooks();
    return true;
  }
}

export const notebookLMService = NotebookLMService.getInstance();

