export interface Source {
  id: string;
  displayName: string;
  type: 'file' | 'url' | 'google_doc';
}

export interface NotebookDocument {
  id: string;
  title: string;
  content: string;
  uploadedAt: Date;
  sourceUrl?: string;
  sourcePath?: string;
  tags: string[];
}

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
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
