/**
 * Zapier Integration Service
 *
 * PURPOSE:
 * Integration with Zapier for workflow automation and app connections.
 * Enables creation, management, and triggering of Zaps.
 *
 * FEATURES:
 * - Create and manage Zaps
 * - Activate/pause Zaps
 * - Trigger Zaps programmatically
 * - Create webhooks
 * - Send webhook payloads
 * - Zap analytics and run history
 *
 * COST TIER: Free (with paid plans for more tasks)
 *
 * USAGE:
 * ```typescript
 * import { zapierIntegrationService } from '@/services/integrations/zapierIntegrationService';
 *
 * // Auto-connects from vault
 * const zap = await zapierIntegrationService.createZap(name, trigger, actions);
 * await zapierIntegrationService.activateZap(zap.id);
 * await zapierIntegrationService.triggerZap(zap.id, data);
 * ```
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from './BaseIntegrationService';

export interface ZapierTrigger {
  id: string;
  name: string;
  event: string;
  app: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface ZapierAction {
  id: string;
  name: string;
  operation: string;
  app: string;
  config: Record<string, any>;
}

export interface ZapierZap {
  id: string;
  name: string;
  trigger: ZapierTrigger;
  actions: ZapierAction[];
  status: 'active' | 'paused' | 'draft';
  runsCount: number;
  createdAt: Date;
  lastRun?: Date;
}

export interface ZapierWebhook {
  id: string;
  url: string;
  event: string;
  secret?: string;
}

/**
 * Zapier Integration Service
 * Extends BaseIntegrationService for credential management and OAuth
 */
class ZapierIntegrationService extends BaseIntegrationService {
  private zaps: ZapierZap[] = [];
  private webhooks: ZapierWebhook[] = [];
  private runHistory: { zapId: string; timestamp: Date; success: boolean }[] = [];

  // ========================================
  // REQUIRED ABSTRACT METHODS
  // ========================================

  getServiceId(): string {
    return 'zapier';
  }

  getServiceName(): string {
    return 'Zapier';
  }

  getBaseURL(): string {
    return 'https://api.zapier.com/v1';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free'; // Free tier available, paid plans for more tasks
  }

  supportsGoogleOAuth(): boolean {
    return false; // Zapier uses its own OAuth flow
  }

  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return null;
  }

  // ========================================
  // ZAPIER-SPECIFIC METHODS
  // ========================================

  /**
   * Create a new Zap
   */
  async createZap(name: string, trigger: Omit<ZapierTrigger, 'id'>, actions: Omit<ZapierAction, 'id'>[]): Promise<ZapierZap> {
    this.logActivity('Creating Zap', { name });

    await this.simulateAPICall();

    const zap: ZapierZap = {
      id: crypto.randomUUID(),
      name,
      trigger: { ...trigger, id: crypto.randomUUID() },
      actions: actions.map(a => ({ ...a, id: crypto.randomUUID() })),
      status: 'draft',
      runsCount: 0,
      createdAt: new Date(),
    };

    this.zaps.push(zap);

    this.logActivity(`Created Zap: ${name}`, { trigger: trigger.name });

    return zap;
  }

  /**
   * Activate a Zap
   */
  async activateZap(zapId: string): Promise<boolean> {
    this.logActivity('Activating Zap', { zapId });

    await this.simulateAPICall();

    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap) {
      return false;
    }

    zap.status = 'active';
    this.logActivity('Zap activated', { name: zap.name });
    return true;
  }

  /**
   * Pause a Zap
   */
  async pauseZap(zapId: string): Promise<boolean> {
    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap) {
      return false;
    }

    zap.status = 'paused';
    this.logActivity('Zap paused', { name: zap.name });
    return true;
  }

  /**
   * Trigger a Zap with data
   */
  async triggerZap(zapId: string, data: Record<string, any>): Promise<boolean> {
    this.logActivity('Triggering Zap', { zapId, dataKeys: Object.keys(data) });

    await this.simulateAPICall();

    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap || zap.status !== 'active') {
      return false;
    }

    // Simulate zap execution
    zap.runsCount++;
    zap.lastRun = new Date();

    this.runHistory.push({
      zapId,
      timestamp: new Date(),
      success: true,
    });

    this.logActivity(`Triggered Zap: ${zap.name}`, { runsCount: zap.runsCount });

    return true;
  }

  /**
   * Create a webhook
   */
  async createWebhook(event: string, secret?: string): Promise<ZapierWebhook> {
    this.logActivity('Creating webhook', { event });

    await this.simulateAPICall();

    const webhook: ZapierWebhook = {
      id: crypto.randomUUID(),
      url: `https://hooks.zapier.com/hooks/catch/${crypto.randomUUID()}`,
      event,
      secret,
    };

    this.webhooks.push(webhook);

    return webhook;
  }

  /**
   * Send webhook payload
   */
  async sendWebhook(webhookId: string, payload: Record<string, any>): Promise<boolean> {
    this.logActivity('Sending webhook', { webhookId });

    await this.simulateAPICall();

    const webhook = this.webhooks.find(w => w.id === webhookId);

    if (!webhook) {
      return false;
    }

    // Demo mode: simulate webhook send
    this.logActivity('Webhook sent', { url: webhook.url, payloadSize: JSON.stringify(payload).length });

    return true;
  }

  /**
   * Get list of Zaps
   */
  getZaps(status?: 'active' | 'paused' | 'draft'): ZapierZap[] {
    if (status) {
      return this.zaps.filter(z => z.status === status);
    }
    return this.zaps;
  }

  /**
   * Get analytics for a Zap
   */
  getZapAnalytics(zapId: string): { runs: number; successRate: number; lastRun?: Date } {
    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap) {
      return { runs: 0, successRate: 0 };
    }

    const runs = this.runHistory.filter(r => r.zapId === zapId);
    const successCount = runs.filter(r => r.success).length;
    const successRate = runs.length > 0 ? (successCount / runs.length) * 100 : 0;

    return {
      runs: runs.length,
      successRate,
      lastRun: zap.lastRun,
    };
  }

  /**
   * Quick test for demo purposes
   */
  async quickTest() {
    this.setAccessToken('demo_zapier_key');

    // Create a Zap for new content publishing
    const contentZap = await this.createZap(
      'Publish Content to Multiple Platforms',
      {
        name: 'New Blog Post',
        event: 'content.published',
        app: 'DLX Studios',
        enabled: true,
        config: { contentType: 'blog' },
      },
      [
        {
          name: 'Post to Twitter',
          operation: 'create_tweet',
          app: 'Twitter',
          config: { includeLink: true },
        },
        {
          name: 'Share on LinkedIn',
          operation: 'create_post',
          app: 'LinkedIn',
          config: { visibility: 'public' },
        },
      ]
    );

    await this.activateZap(contentZap.id);

    // Trigger the zap
    await this.triggerZap(contentZap.id, {
      title: 'New Blog Post: AI Automation Guide',
      url: 'https://dlxstudios.com/blog/ai-automation',
    });

    // Create a webhook
    const webhook = await this.createWebhook('revenue.received');
    await this.sendWebhook(webhook.id, { amount: 99.99, source: 'stripe' });

    const analytics = this.getZapAnalytics(contentZap.id);

    return {
      zaps: this.getZaps(),
      activeZaps: this.getZaps('active').length,
      webhooks: this.webhooks,
      analytics,
    };
  }
}

// Export singleton instance
export const zapierIntegrationService = new ZapierIntegrationService();

// Auto-initialize from credential vault
autoInitializeService(zapierIntegrationService);
