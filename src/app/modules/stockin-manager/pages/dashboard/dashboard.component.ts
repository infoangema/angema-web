import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { AuthService } from '../../../../core/services/auth.service';
import { RootMessagesService } from '../../../../core/services/root-messages.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RootMessage, MESSAGE_STATUS, MESSAGE_TYPES } from '../../../../core/models/root-messages.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StockinNavbarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isRoot = false;
  rootMessages: RootMessage[] = [];
  loadingMessages = false;
  messageStats = {
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0
  };
  private messagesSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private rootMessagesService: RootMessagesService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    if (this.isRoot) {
      this.loadRootMessages();
    }
  }

  ngOnDestroy() {
    if (this.messagesSubscription) {
      this.messagesSubscription.unsubscribe();
    }
  }

  private checkUserRole() {
    this.isRoot = this.authService.isRoot();
  }

  private async loadRootMessages() {
    this.loadingMessages = true;
    try {
      // Cargar mensajes iniciales
      this.rootMessages = await this.rootMessagesService.getMessages(20);
      
      // Suscribirse a cambios en tiempo real
      this.messagesSubscription = this.rootMessagesService.listenToMessages().subscribe(
        messages => {
          this.rootMessages = messages.slice(0, 20);
        }
      );

      // Cargar estadísticas
      const stats = await this.rootMessagesService.getMessageStats();
      this.messageStats = stats;
    } catch (error) {
      this.notificationService.error('Error cargando mensajes: ' + error);
    } finally {
      this.loadingMessages = false;
    }
  }

  async updateMessageStatus(messageId: string, newStatus: string) {
    try {
      await this.rootMessagesService.updateMessageStatus(messageId, newStatus);
      this.notificationService.success('Estado actualizado correctamente');
    } catch (error) {
      this.notificationService.error('Error actualizando estado: ' + error);
    }
  }

  getMessageTypeLabel(type: string): string {
    switch (type) {
      case MESSAGE_TYPES.BUSINESS_REQUEST:
        return 'Solicitud de Negocio';
      case MESSAGE_TYPES.SUPPORT_REQUEST:
        return 'Soporte';
      case MESSAGE_TYPES.SYSTEM_ALERT:
        return 'Alerta del Sistema';
      case MESSAGE_TYPES.FEATURE_REQUEST:
        return 'Solicitud de Función';
      case MESSAGE_TYPES.BUG_REPORT:
        return 'Reporte de Bug';
      default:
        return type;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case MESSAGE_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case MESSAGE_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case MESSAGE_STATUS.RESOLVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case MESSAGE_STATUS.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 