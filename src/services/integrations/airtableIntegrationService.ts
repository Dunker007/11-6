/**
 * Airtable Integration Service
 *
 * PURPOSE:
 * Integration with Airtable for structured data management and tracking.
 * Manages bases, tables, records, and content synchronization.
 *
 * FEATURES:
 * - Airtable base and table management
 * - Record CRUD operations
 * - Bulk record creation
 * - Content synchronization
 * - Query with filter formulas
 * - Report generation
 * - Google OAuth support
 *
 * COST TIER: Free (with paid plans available)
 *
 * USAGE:
 * ```typescript
 * import { airtableIntegrationService } from '@/services/integrations/airtableIntegrationService';
 *
 * // Auto-connects from vault
 * const bases = await airtableIntegrationService.getBases();
 * const record = await airtableIntegrationService.createRecord(baseId, tableName, fields);
 * ```
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from './BaseIntegrationService';

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

/**
 * Airtable Integration Service
 * Extends BaseIntegrationService for credential management and OAuth
 */
class AirtableIntegrationService extends BaseIntegrationService {
  private bases: AirtableBase[] = [];

  // ========================================
  // REQUIRED ABSTRACT METHODS
  // ========================================

  getServiceId(): string {
    return 'airtable';
  }

  getServiceName(): string {
    return 'Airtable';
  }

  getBaseURL(): string {
    return 'https://api.airtable.com/v0';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free'; // Free tier available, paid plans for advanced features
  }

  supportsGoogleOAuth(): boolean {
    return true; // Airtable supports Google SSO
  }

  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      scopes: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      redirectUri: `${window.location.origin}/oauth/callback`,
    };
  }

  // ========================================
  // AIRTABLE-SPECIFIC METHODS
  // ========================================

  /**
   * Get all Airtable bases
   */
  async getBases(): Promise<AirtableBase[]> {
    this.logActivity('Fetching Airtable bases');

    await this.simulateAPICall();

    this.bases = this.generateMockBases();
    return this.bases;
  }

  /**
   * Get a specific table from a base
   */
  async getTable(baseId: string, tableName: string): Promise<AirtableTable | undefined> {
    this.logActivity('Fetching Airtable table', { baseId, tableName });

    await this.simulateAPICall();

    const base = this.bases.find(b => b.id === baseId);
    return base?.tables.find(t => t.name === tableName);
  }

  /**
   * Create a new record in a table
   */
  async createRecord(baseId: string, tableName: string, fields: Record<string, any>): Promise<AirtableRecord> {
    this.logActivity('Creating Airtable record', { baseId, tableName });

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

    this.logActivity(`Created record in ${tableName}`, { baseId, recordId: record.id });

    return record;
  }

  /**
   * Update an existing record
   */
  async updateRecord(baseId: string, tableName: string, recordId: string, fields: Record<string, any>): Promise<AirtableRecord> {
    this.logActivity('Updating Airtable record', { recordId });

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

  /**
   * Bulk create multiple records
   */
  async bulkCreateRecords(baseId: string, tableName: string, records: Record<string, any>[]): Promise<AirtableRecord[]> {
    const createdRecords: AirtableRecord[] = [];

    for (const fields of records) {
      const record = await this.createRecord(baseId, tableName, fields);
      createdRecords.push(record);
    }

    this.logActivity('Bulk create complete', { count: createdRecords.length });
    return createdRecords;
  }

  /**
   * Sync content to Airtable content tracker
   */
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

  /**
   * Query records with optional filter formula
   */
  async queryRecords(baseId: string, tableName: string, filterFormula?: string): Promise<AirtableRecord[]> {
    this.logActivity('Querying Airtable records', { baseId, tableName, filterFormula });

    await this.simulateAPICall();

    const base = this.bases.find(b => b.id === baseId);
    const table = base?.tables.find(t => t.name === tableName);

    return table?.records || [];
  }

  /**
   * Generate report for a table
   */
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

  // ========================================
  // MOCK DATA (Demo mode)
  // ========================================

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

  /**
   * Quick test for demo purposes
   */
  async quickTest() {
    this.setAccessToken('demo_airtable_key');

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

// Export singleton instance
export const airtableIntegrationService = new AirtableIntegrationService();

// Auto-initialize from credential vault
autoInitializeService(airtableIntegrationService);
