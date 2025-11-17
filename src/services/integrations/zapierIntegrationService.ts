/**
 * zapierIntegrationService.ts
 * Zapier integration for workflow automation and app connections.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

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

class ZapierIntegrationService {
  private apiKey?: string;
  private zaps: ZapierZap[] = [];
  private webhooks: ZapierWebhook[] = [];
  private runHistory: { zapId: string; timestamp: Date; success: boolean }[] = [];

  setAPIKey(key: string) {
    this.apiKey = key;
    logger.info('Zapier API key configured');
  }

  async createZap(name: string, trigger: Omit<ZapierTrigger, 'id'>, actions: Omit<ZapierAction, 'id'>[]): Promise<ZapierZap> {
    logger.info('Creating Zap', { name });

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

    activityService.logActivity({
      type: 'zapier_zap_created',
      message: `Created Zap: ${name}`,
      metadata: { trigger: trigger.name },
    });

    return zap;
  }

  async activateZap(zapId: string): Promise<boolean> {
    logger.info('Activating Zap', { zapId });

    await this.simulateAPICall();

    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap) {
      return false;
    }

    zap.status = 'active';
    logger.info('Zap activated', { name: zap.name });
    return true;
  }

  async pauseZap(zapId: string): Promise<boolean> {
    const zap = this.zaps.find(z => z.id === zapId);

    if (!zap) {
      return false;
    }

    zap.status = 'paused';
    logger.info('Zap paused', { name: zap.name });
    return true;
  }

  async triggerZap(zapId: string, data: Record<string, any>): Promise<boolean> {
    logger.info('Triggering Zap', { zapId, dataKeys: Object.keys(data) });

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

    activityService.logActivity({
      type: 'zapier_zap_triggered',
      message: `Triggered Zap: ${zap.name}`,
      metadata: { runsCount: zap.runsCount },
    });

    return true;
  }

  async createWebhook(event: string, secret?: string): Promise<ZapierWebhook> {
    logger.info('Creating webhook', { event });

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

  async sendWebhook(webhookId: string, payload: Record<string, any>): Promise<boolean> {
    logger.info('Sending webhook', { webhookId });

    await this.simulateAPICall();

    const webhook = this.webhooks.find(w => w.id === webhookId);

    if (!webhook) {
      return false;
    }

    // Demo mode: simulate webhook send
    logger.info('Webhook sent', { url: webhook.url, payloadSize: JSON.stringify(payload).length });

    return true;
  }

  getZaps(status?: 'active' | 'paused' | 'draft'): ZapierZap[] {
    if (status) {
      return this.zaps.filter(z => z.status === status);
    }
    return this.zaps;
  }

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

  async quickTest() {
    this.setAPIKey('demo_zapier_key');

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

  private async simulateAPICall(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export const zapierIntegrationService = new ZapierIntegrationService();
if (typeof window !== 'undefined') (window as any).testZapierIntegration = () => zapierIntegrationService.quickTest();
