/**
 * notionIntegrationService.ts
 * Notion integration for knowledge management and content documentation.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

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

class NotionIntegrationService {
  private accessToken?: string;
  private databases: NotionDatabase[] = [];
  private pages: NotionPage[] = [];

  setAccessToken(token: string) {
    this.accessToken = token;
    logger.info('Notion access token configured');
  }

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

    activityService.logActivity({
      type: 'notion_page_created',
      message: `Created Notion page: ${content.title}`,
      metadata: { databaseId },
    });

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

  private async simulateAPICall(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async quickTest() {
    this.setAccessToken('demo_notion_token');

    const databases = await this.getDatabases();

    const page1 = await this.createPage('db-content', {
      title: 'Complete Guide to Passive Income',
      content: 'Learn how to build multiple revenue streams...',
      tags: ['passive income', 'guide'],
      status: 'Published',
    });

    const page2 = await this.createPage('db-content', {
      title: 'AI Automation Tools Review',
      content: 'Top 10 AI tools for content creators...',
      tags: ['ai', 'tools'],
      status: 'Draft',
    });

    const updatedPage = await this.updatePage(page1.id, {
      status: 'Updated',
    });

    return {
      databases,
      pages: [page1, page2],
      updatedPage,
      totalPages: this.pages.length,
    };
  }
}

export const notionIntegrationService = new NotionIntegrationService();
if (typeof window !== 'undefined') (window as any).testNotionIntegration = () => notionIntegrationService.quickTest();
