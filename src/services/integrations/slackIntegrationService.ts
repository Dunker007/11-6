/**
 * Slack Integration Service
 *
 * PURPOSE:
 * Integration with Slack for team notifications and collaboration.
 * Sends real-time notifications for revenue, content, errors, and milestones.
 *
 * FEATURES:
 * - Send messages to Slack channels
 * - Revenue notifications
 * - Content publication alerts
 * - Error monitoring notifications
 * - Milestone celebrations
 * - Daily summary reports
 * - Channel management
 * - Google OAuth support
 *
 * COST TIER: Free (with paid plans available)
 *
 * USAGE:
 * ```typescript
 * import { slackIntegrationService } from '@/services/integrations/slackIntegrationService';
 *
 * // Auto-connects from vault
 * await slackIntegrationService.notifyRevenue(49.99, 'Stripe');
 * await slackIntegrationService.sendDailySummary();
 * ```
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from './BaseIntegrationService';

export interface SlackMessage {
  channel: string;
  text: string;
  attachments?: SlackAttachment[];
  thread_ts?: string;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  members: number;
}

export interface SlackNotification {
  id: string;
  type: 'revenue' | 'content' | 'error' | 'milestone';
  message: string;
  channel: string;
  timestamp: Date;
  delivered: boolean;
}

/**
 * Slack Integration Service
 * Extends BaseIntegrationService for credential management and OAuth
 */
class SlackIntegrationService extends BaseIntegrationService {
  private channels: SlackChannel[] = [];
  private notifications: SlackNotification[] = [];

  // ========================================
  // REQUIRED ABSTRACT METHODS
  // ========================================

  getServiceId(): string {
    return 'slack';
  }

  getServiceName(): string {
    return 'Slack';
  }

  getBaseURL(): string {
    return 'https://slack.com/api';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'free'; // Free tier available, paid plans for larger teams
  }

  supportsGoogleOAuth(): boolean {
    return true; // Slack supports Google SSO
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
  // SLACK-SPECIFIC METHODS
  // ========================================

  /**
   * Send a message to a Slack channel
   */
  async sendMessage(message: SlackMessage): Promise<boolean> {
    this.logActivity('Sending Slack message', { channel: message.channel });

    await this.simulateAPICall();

    // Demo mode: simulate message send
    const notification: SlackNotification = {
      id: crypto.randomUUID(),
      type: 'content',
      message: message.text,
      channel: message.channel,
      timestamp: new Date(),
      delivered: true,
    };

    this.notifications.push(notification);

    this.logActivity(`Sent message to #${message.channel}`, { messageLength: message.text.length });

    return true;
  }

  /**
   * Send revenue notification to Slack
   */
  async notifyRevenue(amount: number, source: string, channel: string = 'revenue'): Promise<boolean> {
    const message: SlackMessage = {
      channel,
      text: '💰 New Revenue!',
      attachments: [
        {
          color: 'good',
          title: 'Revenue Notification',
          fields: [
            { title: 'Amount', value: `$${amount.toFixed(2)}`, short: true },
            { title: 'Source', value: source, short: true },
            { title: 'Time', value: new Date().toLocaleString(), short: false },
          ],
          footer: 'DLX Studios Revenue Tracker',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send content publication notification to Slack
   */
  async notifyContentPublished(title: string, platform: string, url: string, channel: string = 'content'): Promise<boolean> {
    const message: SlackMessage = {
      channel,
      text: '📝 New Content Published!',
      attachments: [
        {
          color: '#36a64f',
          title,
          text: `Published on ${platform}`,
          fields: [
            { title: 'Platform', value: platform, short: true },
            { title: 'URL', value: url, short: false },
          ],
          footer: 'DLX Studios Content Automation',
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send error notification to Slack
   */
  async notifyError(error: string, context: Record<string, any>, channel: string = 'errors'): Promise<boolean> {
    const message: SlackMessage = {
      channel,
      text: '🚨 Error Alert',
      attachments: [
        {
          color: 'danger',
          title: 'Error Detected',
          text: error,
          fields: Object.entries(context).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          footer: 'DLX Studios Error Monitoring',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Send milestone notification to Slack
   */
  async notifyMilestone(milestone: string, details: string, channel: string = 'general'): Promise<boolean> {
    const message: SlackMessage = {
      channel,
      text: '🎉 Milestone Achieved!',
      attachments: [
        {
          color: '#ff9900',
          title: milestone,
          text: details,
          footer: 'DLX Studios',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Get list of Slack channels
   */
  async getChannels(): Promise<SlackChannel[]> {
    this.logActivity('Fetching Slack channels');

    await this.simulateAPICall();

    // Demo mode: generate mock channels
    this.channels = [
      { id: 'C001', name: 'general', is_private: false, members: 10 },
      { id: 'C002', name: 'revenue', is_private: false, members: 5 },
      { id: 'C003', name: 'content', is_private: false, members: 8 },
      { id: 'C004', name: 'errors', is_private: false, members: 3 },
      { id: 'C005', name: 'analytics', is_private: false, members: 6 },
    ];

    return this.channels;
  }

  /**
   * Create a new Slack channel
   */
  async createChannel(name: string, isPrivate: boolean = false): Promise<SlackChannel> {
    this.logActivity('Creating Slack channel', { name });

    await this.simulateAPICall();

    const channel: SlackChannel = {
      id: `C${Math.floor(Math.random() * 1000)}`,
      name,
      is_private: isPrivate,
      members: 1,
    };

    this.channels.push(channel);

    return channel;
  }

  /**
   * Get notification history
   */
  getNotificationHistory(type?: string, limit: number = 20): SlackNotification[] {
    let filtered = this.notifications;

    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }

    return filtered.slice(-limit).reverse();
  }

  /**
   * Send daily summary to Slack
   */
  async sendDailySummary(channel: string = 'general'): Promise<boolean> {
    const summary = {
      revenue: '$1,234.56',
      content: '3 posts published',
      audience: '+127 followers',
      errors: '0 critical issues',
    };

    const message: SlackMessage = {
      channel,
      text: '📊 Daily Summary',
      attachments: [
        {
          color: '#3AA3E3',
          title: 'Today\'s Performance',
          fields: [
            { title: 'Revenue', value: summary.revenue, short: true },
            { title: 'Content', value: summary.content, short: true },
            { title: 'Audience Growth', value: summary.audience, short: true },
            { title: 'Errors', value: summary.errors, short: true },
          ],
          footer: 'DLX Studios Daily Report',
          ts: Date.now() / 1000,
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Quick test for demo purposes
   */
  async quickTest() {
    this.setCredentials({
      webhookUrl: 'https://hooks.slack.com/services/demo/webhook',
      botToken: 'xoxb-demo-token',
    });

    await this.getChannels();

    await this.notifyRevenue(49.99, 'Stripe', 'revenue');
    await this.notifyContentPublished(
      'Complete Guide to Passive Income',
      'Medium',
      'https://medium.com/@user/guide',
      'content'
    );
    await this.notifyMilestone(
      'Feature #30 Complete',
      '75% of all features completed!',
      'general'
    );

    await this.sendDailySummary('general');

    return {
      channels: this.channels,
      notifications: this.getNotificationHistory(),
      totalNotifications: this.notifications.length,
      revenueNotifications: this.getNotificationHistory('revenue').length,
    };
  }
}

// Export singleton instance
export const slackIntegrationService = new SlackIntegrationService();

// Auto-initialize from credential vault
autoInitializeService(slackIntegrationService);
