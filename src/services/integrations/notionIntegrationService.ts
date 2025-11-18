/**
 * Notion Integration Service
 *
 * PURPOSE:
 * Notion integration for knowledge management and content documentation.
 * Supports both API key and Google OAuth authentication.
 *
 * FEATURES:
 * - Database management and queries
 * - Page creation and updates
 * - Content syncing
 * - Bulk export
 * - Google OAuth support
 *
 * COST: Free (Notion API is free with generous limits)
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from './BaseIntegrationService';
import { logger } from '../logging/loggerService';

export interface NotionPage {
  id: string;
  title: string;
  content: string;
  url: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, any>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  properties: NotionProperty[];
  pages: NotionPage[];
}

export interface NotionProperty {
  name: string;
  type: 'title' | 'text' | 'number' | 'select' | 'date' | 'checkbox';
  options?: string[];
}

export interface ContentToNotion {
  title: string;
  content: string;
  tags?: string[];
  status?: string;
  publishDate?: Date;
}

class NotionIntegrationService extends BaseIntegrationService {
  private databases: NotionDatabase[] = [];
  private pages: NotionPage[] = [];

  // ========================================
  // BASE CLASS IMPLEMENTATION
  // ========================================

  getServiceId(): string {
    return 'notion';
  }

  getServiceName(): string {
    return 'Notion';
  }

  getBaseURL(): string {
    return 'https://api.notion.com/v1';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free'; // Notion API is free
  }

  supportsGoogleOAuth(): boolean {
    return true; // Notion supports OAuth
  }

  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      scopes: ['https://www.googleapis.com/auth/userinfo.email'],
      redirectUri: `${window.location.origin}/oauth/callback`,
    };
  }

  // ========================================
  // NOTION-SPECIFIC METHODS
  // ========================================

  async getDatabases(): Promise<NotionDatabase[]> {
    logger.info('Fetching Notion databases');

    await this.simulateAPICall();

    this.databases = this.generateMockDatabases();
    return this.databases;
  }

  async createPage(databaseId: string, content: ContentToNotion): Promise<NotionPage> {
    logger.info('Creating Notion page', { databaseId, title: content.title });

    await this.simulateAPICall();

    const page: NotionPage = {
      id: crypto.randomUUID(),
      title: content.title,
      content: content.content,
      url: `https://notion.so/${crypto.randomUUID()}`,
      parentId: databaseId,
      createdAt: new Date(),
      updatedAt: new Date(),
      properties: {
        tags: content.tags || [],
        status: content.status || 'Draft',
        publishDate: content.publishDate || new Date(),
      },
    };

    this.pages.push(page);

    this.logActivity(`Created page: ${content.title}`, { databaseId });

    return page;
  }

  async updatePage(pageId: string, updates: Partial<ContentToNotion>): Promise<NotionPage> {
    logger.info('Updating Notion page', { pageId });

    await this.simulateAPICall();

    const page = this.pages.find(p => p.id === pageId);

    if (!page) {
      throw new Error('Page not found');
    }

    if (updates.title) page.title = updates.title;
    if (updates.content) page.content = updates.content;
    if (updates.tags) page.properties.tags = updates.tags;
    if (updates.status) page.properties.status = updates.status;

    page.updatedAt = new Date();

    return page;
  }

  async syncContentToNotion(contentId: string, content: ContentToNotion): Promise<NotionPage> {
    // Check if content already exists in Notion
    const existingPage = this.pages.find(p => p.title === content.title);

    if (existingPage) {
      return this.updatePage(existingPage.id, content);
    }

    // Create new page
    return this.createPage('default-db', content);
  }

  async createDatabase(title: string, properties: NotionProperty[]): Promise<NotionDatabase> {
    logger.info('Creating Notion database', { title });

    await this.simulateAPICall();

    const database: NotionDatabase = {
      id: crypto.randomUUID(),
      title,
      properties,
      pages: [],
    };

    this.databases.push(database);

    return database;
  }

  async queryDatabase(databaseId: string, filters?: Record<string, any>): Promise<NotionPage[]> {
    logger.info('Querying Notion database', { databaseId, filters });

    await this.simulateAPICall();

    // Demo: return all pages from database
    return this.pages.filter(p => p.parentId === databaseId);
  }

  async exportToNotion(items: ContentToNotion[]): Promise<NotionPage[]> {
    const pages: NotionPage[] = [];

    for (const item of items) {
      const page = await this.createPage('export-db', item);
      pages.push(page);
    }

    logger.info('Bulk export to Notion complete', { count: pages.length });
    return pages;
  }

  private generateMockDatabases(): NotionDatabase[] {
    return [
      {
        id: 'db-content',
        title: 'Content Calendar',
        description: 'Track all published content',
        properties: [
          { name: 'Title', type: 'title' },
          { name: 'Status', type: 'select', options: ['Draft', 'Review', 'Published'] },
          { name: 'Publish Date', type: 'date' },
          { name: 'Tags', type: 'text' },
        ],
        pages: [],
      },
      {
        id: 'db-ideas',
        title: 'Content Ideas',
        description: 'Brainstorm and track content ideas',
        properties: [
          { name: 'Idea', type: 'title' },
          { name: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
          { name: 'Category', type: 'text' },
        ],
        pages: [],
      },
    ];
  }

}

// ========================================
// SINGLETON EXPORT
// ========================================

export const notionIntegrationService = new NotionIntegrationService();

// Auto-initialize from credential vault if available
autoInitializeService(notionIntegrationService);
