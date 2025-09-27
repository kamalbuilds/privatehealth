import { apiClient } from './api';
import { NotificationState, ApiResponse } from '@/types';
import { API_ENDPOINTS } from '@/utils/constants';

class NotificationService {
  async getNotifications(params: {
    limit?: number;
    offset?: number;
  }): Promise<{
    notifications: NotificationState[];
    unreadCount: number;
    total: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await apiClient.get<ApiResponse<any>>(
      `${API_ENDPOINTS.NOTIFICATIONS}?${queryParams.toString()}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch notifications');
    }

    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(
      API_ENDPOINTS.MARK_READ(id)
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark notification as read');
    }
  }

  async markAllAsRead(): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(
      '/api/notifications/mark-all-read'
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to mark all notifications as read');
    }
  }

  async deleteNotification(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/api/notifications/${id}`
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete notification');
    }
  }

  async createNotification(notificationData: {
    userId: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }): Promise<NotificationState> {
    const response = await apiClient.post<ApiResponse<NotificationState>>(
      API_ENDPOINTS.NOTIFICATIONS,
      notificationData
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create notification');
    }

    return response.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/api/notifications/unread-count'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch unread count');
    }

    return response.data.count;
  }

  async updateNotificationSettings(settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    consentUpdates: boolean;
    dataRequests: boolean;
    researchUpdates: boolean;
    systemAlerts: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  }): Promise<void> {
    const response = await apiClient.patch<ApiResponse<void>>(
      '/api/notifications/settings',
      settings
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to update notification settings');
    }
  }

  async getNotificationSettings(): Promise<{
    emailNotifications: boolean;
    pushNotifications: boolean;
    consentUpdates: boolean;
    dataRequests: boolean;
    researchUpdates: boolean;
    systemAlerts: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/notifications/settings'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch notification settings');
    }

    return response.data;
  }

  async subscribeToWebPush(subscription: PushSubscription): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      '/api/notifications/push-subscribe',
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.getKey('p256dh'),
          auth: subscription.getKey('auth'),
        },
      }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to subscribe to push notifications');
    }
  }

  async unsubscribeFromWebPush(): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      '/api/notifications/push-unsubscribe'
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to unsubscribe from push notifications');
    }
  }

  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    recentActivity: Array<{
      date: string;
      count: number;
    }>;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      '/api/notifications/stats'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to fetch notification stats');
    }

    return response.data;
  }

  async clearAllNotifications(): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      '/api/notifications/clear-all'
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to clear all notifications');
    }
  }

  async exportNotifications(format: 'csv' | 'json'): Promise<void> {
    await apiClient.download(`/api/notifications/export?format=${format}`);
  }

  // Real-time notification handling
  async subscribeToRealTimeNotifications(
    onNotification: (notification: NotificationState) => void,
    onError?: (error: any) => void
  ): Promise<() => void> {
    try {
      const cancelStream = await apiClient.stream(
        '/api/notifications/stream',
        (data) => {
          if (data.type === 'notification') {
            onNotification(data.notification);
          }
        },
        onError
      );

      return cancelStream;
    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  // Browser notification API integration
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  showBrowserNotification(notification: NotificationState): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/notification-badge.png',
      tag: notification.id,
      data: {
        id: notification.id,
        actionUrl: notification.actionUrl,
      },
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      browserNotification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  }

  // Service Worker integration for background notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }

  // Notification batching for better UX
  private notificationQueue: NotificationState[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  queueNotification(notification: NotificationState): void {
    this.notificationQueue.push(notification);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatchedNotifications();
    }, 1000); // Batch notifications for 1 second
  }

  private processBatchedNotifications(): void {
    if (this.notificationQueue.length === 0) return;

    if (this.notificationQueue.length === 1) {
      // Single notification
      this.showBrowserNotification(this.notificationQueue[0]);
    } else {
      // Multiple notifications - show summary
      const summaryNotification: NotificationState = {
        id: 'batch-' + Date.now(),
        type: 'info',
        title: `${this.notificationQueue.length} new notifications`,
        message: this.notificationQueue.map(n => n.title).join(', '),
        timestamp: new Date().toISOString(),
        read: false,
      };

      this.showBrowserNotification(summaryNotification);
    }

    this.notificationQueue = [];
    this.batchTimeout = null;
  }
}

export const notificationService = new NotificationService();