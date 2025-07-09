import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationMessage } from '../../../core/services/notification.service';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('150ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class NotificationsComponent implements OnInit {
  notifications$: Observable<NotificationMessage[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  ngOnInit(): void {
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getNotificationClasses(type: string): string {
    const baseClasses = 'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-400`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-400`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-400`;
      case 'info':
        return `${baseClasses} border-l-4 border-blue-400`;
      default:
        return `${baseClasses} border-l-4 border-gray-400`;
    }
  }

  getIconClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'h-6 w-6 text-green-400';
      case 'error':
        return 'h-6 w-6 text-red-400';
      case 'warning':
        return 'h-6 w-6 text-yellow-400';
      case 'info':
        return 'h-6 w-6 text-blue-400';
      default:
        return 'h-6 w-6 text-gray-400';
    }
  }

  trackByNotification(index: number, notification: NotificationMessage): string {
    return notification.id;
  }
} 