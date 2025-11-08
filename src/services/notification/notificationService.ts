// src/services/notification/notificationService.ts
import { useNotificationStore } from './notificationStore';
import { LucideIcon } from 'lucide-react';

class NotificationService {
  private store = useNotificationStore;

  info(title: string, message: string, icon?: LucideIcon) {
    this.store.getState().addNotification({ title, message, type: 'info', icon });
  }

  success(title: string, message: string, icon?: LucideIcon) {
    this.store.getState().addNotification({ title, message, type: 'success', icon });
  }

  warn(title: string, message: string, icon?: LucideIcon) {
    this.store.getState().addNotification({ title, message, type: 'warning', icon });
  }

  error(title: string, message: string, icon?: LucideIcon) {
    this.store.getState().addNotification({ title, message, type: 'error', icon });
  }

  markAsRead(id: string) {
    this.store.getState().markAsRead(id);
  }

  clearAll() {
    this.store.getState().clearAll();
  }
}

export const notificationService = new NotificationService();
