// src/services/notification/notificationService.ts
import { useNotificationStore } from './notificationStore';
import { eventBus } from '../events/eventBus';
import { LucideIcon } from 'lucide-react';

class NotificationService {
  private store = useNotificationStore;

  constructor() {
    // Subscribe to workflow events for cross-tab notifications
    eventBus.on('workflow:started', (payload) => {
      this.info('Workflow Started', `Workflow "${payload.workflowName}" has started`, undefined);
    });

    eventBus.on('workflow:completed', (payload) => {
      const duration = payload.duration ? `${(payload.duration / 1000).toFixed(1)}s` : '';
      this.success(
        'Workflow Completed',
        `Workflow "${payload.workflowName}" completed successfully${duration ? ` in ${duration}` : ''}`,
        undefined
      );
    });

    eventBus.on('workflow:failed', (payload) => {
      this.error(
        'Workflow Failed',
        `Workflow "${payload.workflowName}" failed: ${payload.error || 'Unknown error'}`,
        undefined
      );
    });

    // Subscribe to system health alerts
    eventBus.on('system:health-alert', (payload) => {
      const severity = payload.severity || 'warning';
      const message = payload.alert || payload.message || 'System health alert';
      
      switch (severity) {
        case 'critical':
        case 'error':
          this.error('System Alert', message, undefined);
          break;
        case 'warning':
          this.warn('System Warning', message, undefined);
          break;
        default:
          this.info('System Info', message, undefined);
      }
    });

    // Subscribe to project events
    eventBus.on('project:created', (payload) => {
      this.success('Project Created', `Project "${payload.name}" has been created`, undefined);
    });

    eventBus.on('project:completed', (payload) => {
      this.success('Project Completed', `Project "${payload.name}" has been completed`, undefined);
    });

    eventBus.on('project:deployed', (payload) => {
      this.success('Project Deployed', `Project "${payload.name}" deployed to ${payload.environment || 'production'}`, undefined);
    });

    eventBus.on('project:build-failed', (payload) => {
      this.error('Build Failed', `Build failed for project "${payload.name}": ${payload.error || 'Unknown error'}`, undefined);
    });
  }

  info(title: string, message: string, icon?: LucideIcon) {
    const notification = { title, message, type: 'info' as const, icon };
    this.store.getState().addNotification(notification);
    // Emit cross-tab notification event
    eventBus.emit('system:notification', { type: 'info', title, message });
  }

  success(title: string, message: string, icon?: LucideIcon) {
    const notification = { title, message, type: 'success' as const, icon };
    this.store.getState().addNotification(notification);
    // Emit cross-tab notification event
    eventBus.emit('system:notification', { type: 'success', title, message });
  }

  warn(title: string, message: string, icon?: LucideIcon) {
    const notification = { title, message, type: 'warning' as const, icon };
    this.store.getState().addNotification(notification);
    // Emit cross-tab notification event
    eventBus.emit('system:notification', { type: 'warning', title, message });
  }

  error(title: string, message: string, icon?: LucideIcon) {
    const notification = { title, message, type: 'error' as const, icon };
    this.store.getState().addNotification(notification);
    // Emit cross-tab notification event
    eventBus.emit('system:notification', { type: 'error', title, message });
  }

  markAsRead(id: string) {
    this.store.getState().markAsRead(id);
  }

  clearAll() {
    this.store.getState().clearAll();
  }
}

export const notificationService = new NotificationService();
