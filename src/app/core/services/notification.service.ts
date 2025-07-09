import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private addNotification(type: NotificationMessage['type'], message: string, duration = 5000): void {
    const notification: NotificationMessage = {
      id: this.generateId(),
      type,
      message,
      duration,
      timestamp: Date.now()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  success(message: string, duration = 3000): void {
    this.addNotification('success', message, duration);
  }

  error(message: string, duration = 5000): void {
    this.addNotification('error', message, duration);
  }

  warning(message: string, duration = 4000): void {
    this.addNotification('warning', message, duration);
  }

  info(message: string, duration = 3000): void {
    this.addNotification('info', message, duration);
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  clearAll(): void {
    this.notificationsSubject.next([]);
  }
} 