import { apiKeyService } from '@/services/apiKeys/apiKeyService';

export interface NotebookDocument {
  id: string;
  title: string;
  content: string;
  uploadedAt: Date;
  sourceUrl?: string;
  tags: string[];
}

export interface Notebook {
  id: string;
  name: string;
  documents: NotebookDocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotebookResponse {
  text: string;
  sources: string[];
  citations: Array<{
    documentId: string;
    excerpt: string;
    page?: number;
  }>;
}

/**
 * NotebookLM Service
 * Manages document uploads, notebooks, and research features
 * Uses Gemini API (same as NotebookLM)
 */
export class NotebookLMService {
  private static instance: NotebookLMService;
  private notebooks: Map<string, Notebook> = new Map();
  private readonly STORAGE_KEY = 'dlx_notebooklm_notebooks';

  private constructor() {
    this.loadNotebooks();
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
      console.error('Failed to load notebooks:', error);
    }
  }

  private saveNotebooks(): void {
    try {
      const notebooksArray = Array.from(this.notebooks.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notebooksArray));
    } catch (error) {
      console.error('Failed to save notebooks:', error);
    }
  }

  /**
   * Create a new notebook
   */
  async createNotebook(name: string): Promise<Notebook> {
    const notebook: Notebook = {
      id: crypto.randomUUID(),
      name,
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
    title: string,
    content: string,
    sourceUrl?: string,
    tags: string[] = []
  ): Promise<NotebookDocument> {
    const notebook = this.notebooks.get(notebookId);
    if (!notebook) {
      throw new Error('Notebook not found');
    }

    const document: NotebookDocument = {
      id: crypto.randomUUID(),
      title,
      content,
      uploadedAt: new Date(),
      sourceUrl,
      tags,
    };

    notebook.documents.push(document);
    notebook.updatedAt = new Date();
    this.notebooks.set(notebookId, notebook);
    this.saveNotebooks();

    return document;
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

