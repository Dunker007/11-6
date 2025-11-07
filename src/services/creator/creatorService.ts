import type { ContentDocument, ContentTemplate } from '@/types/creator';

const DOCUMENTS_STORAGE_KEY = 'dlx_content_documents';
const TEMPLATES: ContentTemplate[] = [
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Template for blog articles',
    category: 'blog',
    content: `# Blog Post Title

## Introduction

Write your introduction here...

## Main Content

Your main content goes here...

## Conclusion

Wrap up your thoughts...`,
  },
  {
    id: 'readme',
    name: 'README',
    description: 'Project README template',
    category: 'readme',
    content: `# Project Name

## Description

Brief description of your project...

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

How to use the project...

## License

MIT`,
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Technical documentation template',
    category: 'documentation',
    content: `# Documentation

## Overview

## Getting Started

## API Reference

## Examples

## Troubleshooting`,
  },
];

export class CreatorService {
  private static instance: CreatorService;
  private documents: Map<string, ContentDocument> = new Map();

  private constructor() {
    this.loadDocuments();
  }

  static getInstance(): CreatorService {
    if (!CreatorService.instance) {
      CreatorService.instance = new CreatorService();
    }
    return CreatorService.instance;
  }

  private loadDocuments(): void {
    try {
      const stored = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
      if (stored) {
        const docs: ContentDocument[] = JSON.parse(stored);
        docs.forEach((doc) => {
          doc.createdAt = new Date(doc.createdAt);
          doc.updatedAt = new Date(doc.updatedAt);
          this.documents.set(doc.id, doc);
        });
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }

  private saveDocuments(): void {
    try {
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(Array.from(this.documents.values())));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  }

  getTemplates(): ContentTemplate[] {
    return TEMPLATES;
  }

  createDocument(title: string, type: ContentDocument['type'] = 'markdown', templateId?: string): ContentDocument {
    let content = '';
    if (templateId) {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        content = template.content;
      }
    }

    const doc: ContentDocument = {
      id: crypto.randomUUID(),
      title,
      content,
      type,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      template: templateId,
    };

    this.documents.set(doc.id, doc);
    this.saveDocuments();
    return doc;
  }

  getDocument(id: string): ContentDocument | null {
    return this.documents.get(id) || null;
  }

  getAllDocuments(): ContentDocument[] {
    return Array.from(this.documents.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  updateDocument(id: string, updates: Partial<ContentDocument>): ContentDocument | null {
    const doc = this.documents.get(id);
    if (!doc) return null;

    const updated: ContentDocument = {
      ...doc,
      ...updates,
      updatedAt: new Date(),
    };
    this.documents.set(id, updated);
    this.saveDocuments();
    return updated;
  }

  deleteDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) this.saveDocuments();
    return deleted;
  }
}

export const creatorService = CreatorService.getInstance();

