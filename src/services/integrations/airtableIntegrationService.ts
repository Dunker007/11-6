/**
 * airtableIntegrationService.ts
 * Airtable integration for structured data management and tracking.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface AirtableBase {
  id: string;
  name: string;
  tables: AirtableTable[];
}

export interface AirtableTable {
  id: string;
  name: string;
  fields: AirtableField[];
  records: AirtableRecord[];
}

export interface AirtableField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url';
  options?: string[];
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: Date;
}

export interface ContentRecord {
  title: string;
  platform: string;
  status: string;
  views?: number;
  revenue?: number;
  publishDate?: Date;
  tags?: string[];
}

class AirtableIntegrationService {
  private apiKey?: string;
  private bases: AirtableBase[] = [];

  setAPIKey(key: string) {
    this.apiKey = key;
    logger.info('Airtable API key configured');
  }

  async getBases(): Promise<AirtableBase[]> {
    logger.info('Fetching Airtable bases');

    await this.simulateAPICall();

    this.bases = this.generateMockBases();
    return this.bases;
  }

  async getTable(baseId: string, tableName: string): Promise<AirtableTable | undefined> {
    logger.info('Fetching Airtable table', { baseId, tableName });

    await this.simulateAPICall();

    const base = this.bases.find(b => b.id === baseId);
    return base?.tables.find(t => t.name === tableName);
  }

  async createRecord(baseId: string, tableName: string, fields: Record<string, any>): Promise<AirtableRecord> {
    logger.info('Creating Airtable record', { baseId, tableName });

    await this.simulateAPICall();

    const record: AirtableRecord = {
      id: crypto.randomUUID(),
      fields,
      createdTime: new Date(),
    };

    const base = this.bases.find(b => b.id === baseId);
    const table = base?.tables.find(t => t.name === tableName);

    if (table) {
      table.records.push(record);
    }

    activityService.logActivity({
      type: 'airtable_record_created',
      message: `Created record in ${tableName}`,
      metadata: { baseId },
    });

    return record;
  }

  async updateRecord(baseId: string, tableName: string, recordId: string, fields: Record<string, any>): Promise<AirtableRecord> {
    logger.info('Updating Airtable record', { recordId });

    await this.simulateAPICall();

    const base = this.bases.find(b => b.id === baseId);
    const table = base?.tables.find(t => t.name === tableName);
    const record = table?.records.find(r => r.id === recordId);

    if (!record) {
      throw new Error('Record not found');
    }

    record.fields = { ...record.fields, ...fields };
    return record;
  }

  async bulkCreateRecords(baseId: string, tableName: string, records: Record<string, any>[]): Promise<AirtableRecord[]> {
    const createdRecords: AirtableRecord[] = [];

    for (const fields of records) {
      const record = await this.createRecord(baseId, tableName, fields);
      createdRecords.push(record);
    }

    logger.info('Bulk create complete', { count: createdRecords.length });
    return createdRecords;
  }

  async syncContentToAirtable(content: ContentRecord): Promise<AirtableRecord> {
    const baseId = 'base-content';
    const tableName = 'Content Tracker';

    return this.createRecord(baseId, tableName, {
      Title: content.title,
      Platform: content.platform,
      Status: content.status,
      Views: content.views || 0,
      Revenue: content.revenue || 0,
      'Publish Date': content.publishDate?.toISOString(),
      Tags: content.tags?.join(', '),
    });
  }

  async queryRecords(baseId: string, tableName: string, filterFormula?: string): Promise<AirtableRecord[]> {
    logger.info('Querying Airtable records', { baseId, tableName, filterFormula });

    await this.simulateAPICall();

    const base = this.bases.find(b => b.id === baseId);
    const table = base?.tables.find(t => t.name === tableName);

    return table?.records || [];
  }

  async generateReport(baseId: string, tableName: string): Promise<{ totalRecords: number; summary: Record<string, any> }> {
    const records = await this.queryRecords(baseId, tableName);

    const summary = {
      totalRecords: records.length,
      recentRecords: records.slice(-5).length,
      oldestRecord: records[0]?.createdTime,
      newestRecord: records[records.length - 1]?.createdTime,
    };

    return { totalRecords: records.length, summary };
  }

  private generateMockBases(): AirtableBase[] {
    return [
      {
        id: 'base-content',
        name: 'Content Management',
        tables: [
          {
            id: 'tbl-content-tracker',
            name: 'Content Tracker',
            fields: [
              { name: 'Title', type: 'text' },
              { name: 'Platform', type: 'select', options: ['Blog', 'Medium', 'LinkedIn', 'YouTube'] },
              { name: 'Status', type: 'select', options: ['Draft', 'Published', 'Archived'] },
              { name: 'Views', type: 'number' },
              { name: 'Revenue', type: 'number' },
              { name: 'Publish Date', type: 'date' },
              { name: 'Tags', type: 'text' },
            ],
            records: [
              {
                id: 'rec1',
                fields: {
                  Title: 'Getting Started with Passive Income',
                  Platform: 'Blog',
                  Status: 'Published',
                  Views: 1250,
                  Revenue: 45.5,
                  'Publish Date': new Date(Date.now() - 86400000 * 7).toISOString(),
                  Tags: 'passive income, guide',
                },
                createdTime: new Date(Date.now() - 86400000 * 7),
              },
            ],
          },
        ],
      },
      {
        id: 'base-revenue',
        name: 'Revenue Tracking',
        tables: [
          {
            id: 'tbl-transactions',
            name: 'Transactions',
            fields: [
              { name: 'Source', type: 'select', options: ['Stripe', 'Gumroad', 'PayPal'] },
              { name: 'Amount', type: 'number' },
              { name: 'Date', type: 'date' },
              { name: 'Product', type: 'text' },
            ],
            records: [],
          },
        ],
      },
    ];
  }

  private async simulateAPICall(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async quickTest() {
    this.setAPIKey('demo_airtable_key');

    const bases = await this.getBases();
    const table = await this.getTable('base-content', 'Content Tracker');

    const record1 = await this.createRecord('base-content', 'Content Tracker', {
      Title: 'AI Tools for Creators',
      Platform: 'Medium',
      Status: 'Published',
      Views: 850,
      Revenue: 32.5,
    });

    const contentSync = await this.syncContentToAirtable({
      title: 'Automation Strategies 2025',
      platform: 'LinkedIn',
      status: 'Published',
      views: 420,
      revenue: 18.0,
      publishDate: new Date(),
      tags: ['automation', 'productivity'],
    });

    const report = await this.generateReport('base-content', 'Content Tracker');

    return {
      bases: bases.map(b => ({ id: b.id, name: b.name, tableCount: b.tables.length })),
      table: table ? { name: table.name, recordCount: table.records.length } : null,
      newRecords: [record1, contentSync],
      report,
    };
  }
}

export const airtableIntegrationService = new AirtableIntegrationService();
if (typeof window !== 'undefined') (window as any).testAirtableIntegration = () => airtableIntegrationService.quickTest();
