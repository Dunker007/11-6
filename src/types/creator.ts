export interface ContentDocument {
  id: string;
  title: string;
  content: string;
  type: 'markdown' | 'html' | 'text';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  template?: string;
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'blog' | 'documentation' | 'readme' | 'notes' | 'custom';
  content: string;
}

export interface ExportOptions {
  format: 'markdown' | 'html' | 'pdf' | 'txt';
  includeMetadata: boolean;
  template?: string;
}

