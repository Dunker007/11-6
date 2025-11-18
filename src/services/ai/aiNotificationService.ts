/**
 * AI Notification Service
 * Centralized notification and alert system for all AI operations
 * Aggregates alerts from all intelligent systems
 */

import { activityService } from '../activityService';

export interface AINotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'critical';
  source: 'learning' | 'optimization' | 'emergency' | 'revenue' | 'content' | 'scheduler' | 'idle_computing' | 'agent' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';

  metadata?: {
    affectedSystems?: string[];
    estimatedImpact?: number;
    requiresAction?: boolean;
    actionUrl?: string;
    actionLabel?: string;
  };

  status: 'unread' | 'read' | 'actioned' | 'dismissed';
  actionedAt?: Date;
  expiresAt?: Date;
}

export interface NotificationGroup {
  source: AINotification['source'];
  notifications: AINotification[];
  unreadCount: number;
  criticalCount: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<AINotification['type'], number>;
  bySource: Record<AINotification['source'], number>;
  byPriority: Record<AINotification['priority'], number>;
  criticalUnread: number;
}

class AINotificationService {
  private static instance: AINotificationService;
  private readonly STORAGE_KEY = 'dlx_ai_notifications';
  private readonly MAX_NOTIFICATIONS = 200;
  private readonly AUTO_EXPIRE_DAYS = 7;

  private data: {
    notifications: AINotification[];
    settings: {
      enabled: boolean;
      soundEnabled: boolean;
      desktopEnabled: boolean;
      mutedSources: AINotification['source'][];
      minPriority: AINotification['priority'];
    };
  };

  private listeners: Array<(notification: AINotification) => void> = [];

  private constructor() {
    this.data = {
      notifications: [],
      settings: {
        enabled: true,
        soundEnabled: true,
        desktopEnabled: false,
        mutedSources: [],
        minPriority: 'low',
      },
    };
    this.loadData();
    this.cleanupExpired();
  }

  static getInstance(): AINotificationService {
    if (!AINotificationService.instance) {
      AINotificationService.instance = new AINotificationService();
    }
    return AINotificationService.instance;
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.notifications = parsed.notifications?.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          actionedAt: n.actionedAt ? new Date(n.actionedAt) : undefined,
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        })) || [];
        this.data = { ...this.data, ...parsed };
      }
    } catch (error) {
      console.error('Error loading AI notifications:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving AI notifications:', error);
    }
  }

  /**
   * Send a notification
   */
  notify(notification: Omit<AINotification, 'id' | 'timestamp' | 'status'>): AINotification {
    // Check if notifications are enabled
    if (!this.data.settings.enabled) {
      return null as any;
    }

    // Check if source is muted
    if (this.data.settings.mutedSources.includes(notification.source)) {
      return null as any;
    }

    // Check minimum priority
    const priorityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = priorityLevels[this.data.settings.minPriority];
    const notifLevel = priorityLevels[notification.priority];

    if (notifLevel < minLevel) {
      return null as any;
    }

    // Create notification
    const fullNotification: AINotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      status: 'unread',
      expiresAt: notification.expiresAt || new Date(Date.now() + this.AUTO_EXPIRE_DAYS * 24 * 60 * 60 * 1000),
    };

    this.data.notifications.unshift(fullNotification);

    // Keep only recent notifications
    if (this.data.notifications.length > this.MAX_NOTIFICATIONS) {
      this.data.notifications = this.data.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    this.saveData();

    // Trigger listeners
    this.listeners.forEach(listener => {
      try {
        listener(fullNotification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });

    // Log to activity service
    activityService.logActivity({
      type: 'ai',
      message: `AI Notification: ${notification.title}`,
      metadata: { notification: fullNotification },
    });

    // Desktop notification if enabled
    if (this.data.settings.desktopEnabled && notification.priority === 'critical') {
      this.showDesktopNotification(fullNotification);
    }

    // Sound if enabled
    if (this.data.settings.soundEnabled && (notification.priority === 'critical' || notification.priority === 'high')) {
      this.playNotificationSound(notification.type);
    }

    return fullNotification;
  }

  /**
   * Show desktop notification
   */
  private showDesktopNotification(notification: AINotification): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.id,
            });
          }
        });
      }
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(type: AINotification['type']): void {
    // In a real app, would play actual sounds
    // For now, just console beep
    if (typeof window !== 'undefined') {
      console.log(`🔔 ${type.toUpperCase()} notification`);
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'read';
      this.saveData();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(source?: AINotification['source']): void {
    this.data.notifications.forEach(n => {
      if (!source || n.source === source) {
        n.status = 'read';
      }
    });
    this.saveData();
  }

  /**
   * Dismiss notification
   */
  dismiss(notificationId: string): void {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'dismissed';
      this.saveData();
    }
  }

  /**
   * Action taken on notification
   */
  action(notificationId: string): void {
    const notification = this.data.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.status = 'actioned';
      notification.actionedAt = new Date();
      this.saveData();
    }
  }

  /**
   * Get all notifications
   */
  getAll(filter?: {
    source?: AINotification['source'];
    type?: AINotification['type'];
    status?: AINotification['status'];
    priority?: AINotification['priority'];
    limit?: number;
  }): AINotification[] {
    let filtered = this.data.notifications;

    if (filter?.source) {
      filtered = filtered.filter(n => n.source === filter.source);
    }
    if (filter?.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }
    if (filter?.status) {
      filtered = filtered.filter(n => n.status === filter.status);
    }
    if (filter?.priority) {
      filtered = filtered.filter(n => n.priority === filter.priority);
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  /**
   * Get notifications grouped by source
   */
  getGrouped(): NotificationGroup[] {
    const groups: Record<string, NotificationGroup> = {};

    for (const notification of this.data.notifications) {
      if (!groups[notification.source]) {
        groups[notification.source] = {
          source: notification.source,
          notifications: [],
          unreadCount: 0,
          criticalCount: 0,
        };
      }

      groups[notification.source].notifications.push(notification);

      if (notification.status === 'unread') {
        groups[notification.source].unreadCount++;
      }

      if (notification.priority === 'critical') {
        groups[notification.source].criticalCount++;
      }
    }

    return Object.values(groups);
  }

  /**
   * Get statistics
   */
  getStats(): NotificationStats {
    const stats: NotificationStats = {
      total: this.data.notifications.length,
      unread: 0,
      criticalUnread: 0,
      byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 },
      bySource: {
        learning: 0,
        optimization: 0,
        emergency: 0,
        revenue: 0,
        content: 0,
        scheduler: 0,
        idle_computing: 0,
        agent: 0,
        system: 0,
      },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    };

    for (const notification of this.data.notifications) {
      if (notification.status === 'unread') {
        stats.unread++;
        if (notification.priority === 'critical') {
          stats.criticalUnread++;
        }
      }

      stats.byType[notification.type]++;
      stats.bySource[notification.source]++;
      stats.byPriority[notification.priority]++;
    }

    return stats;
  }

  /**
   * Subscribe to notifications
   */
  subscribe(listener: (notification: AINotification) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<typeof this.data.settings>): void {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
  }

  /**
   * Get settings
   */
  getSettings(): typeof this.data.settings {
    return { ...this.data.settings };
  }

  /**
   * Cleanup expired notifications
   */
  private cleanupExpired(): void {
    const now = new Date();
    const before = this.data.notifications.length;

    this.data.notifications = this.data.notifications.filter(
      n => !n.expiresAt || n.expiresAt > now
    );

    if (this.data.notifications.length < before) {
      this.saveData();
    }

    // Schedule next cleanup
    setTimeout(() => this.cleanupExpired(), 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Clear all notifications
   */
  clearAll(source?: AINotification['source']): void {
    if (source) {
      this.data.notifications = this.data.notifications.filter(n => n.source !== source);
    } else {
      this.data.notifications = [];
    }
    this.saveData();
  }

  /**
   * Quick test function
   */
  quickTest(): void {
    console.log('=== AI Notification Service Test ===\n');

    // Send test notifications
    this.notify({
      type: 'success',
      source: 'optimization',
      title: 'Optimization Complete',
      message: 'Successfully optimized content posting schedule. Expected 25% engagement increase.',
      priority: 'high',
      metadata: {
        estimatedImpact: 25,
        requiresAction: false,
      },
    });

    this.notify({
      type: 'critical',
      source: 'emergency',
      title: 'Revenue Drop Detected',
      message: 'Critical revenue anomaly detected. Emergency response activated.',
      priority: 'critical',
      metadata: {
        affectedSystems: ['revenue_tracking', 'monetization'],
        estimatedImpact: 500,
        requiresAction: true,
        actionUrl: '/emergency',
        actionLabel: 'View Emergency',
      },
    });

    this.notify({
      type: 'info',
      source: 'learning',
      title: 'New Pattern Detected',
      message: 'Learning system identified best posting time: Tuesdays at 3 PM.',
      priority: 'medium',
    });

    this.notify({
      type: 'warning',
      source: 'idle_computing',
      title: 'High Electricity Costs',
      message: 'Entering peak electricity hours. Consider pausing idle computing.',
      priority: 'high',
      metadata: {
        requiresAction: true,
        actionUrl: '/idle-computing',
        actionLabel: 'Adjust Settings',
      },
    });

    console.log('Sent 4 test notifications\n');

    // Show stats
    const stats = this.getStats();
    console.log('--- Notification Stats ---');
    console.log(`Total: ${stats.total}`);
    console.log(`Unread: ${stats.unread}`);
    console.log(`Critical Unread: ${stats.criticalUnread}`);
    console.log('\nBy Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      if (count > 0) console.log(`  ${type}: ${count}`);
    });
    console.log('\nBy Priority:');
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      if (count > 0) console.log(`  ${priority}: ${count}`);
    });

    // Show grouped
    console.log('\n--- Grouped by Source ---');
    const groups = this.getGrouped();
    groups.forEach(group => {
      console.log(`\n${group.source} (${group.notifications.length} total, ${group.unreadCount} unread, ${group.criticalCount} critical):`);
      group.notifications.slice(0, 2).forEach(n => {
        console.log(`  [${n.priority}] ${n.title}`);
        console.log(`    ${n.message}`);
      });
    });

    // Test filtering
    console.log('\n--- Critical Notifications ---');
    const critical = this.getAll({ priority: 'critical' });
    critical.forEach(n => {
      console.log(`  ${n.source}: ${n.title}`);
    });

    console.log('\n--- Unread Notifications ---');
    const unread = this.getAll({ status: 'unread', limit: 5 });
    console.log(`Showing ${unread.length} unread notifications`);
  }
}

export const aiNotificationService = AINotificationService.getInstance();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).aiNotificationService = aiNotificationService;
}
