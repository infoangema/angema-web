import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionControlService } from '../../../../core/services/session-control.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BusinessService } from '../../../../core/services/business.service';

@Component({
  selector: 'app-session-limit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="mx-auto h-12 w-12 text-red-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
            </path>
          </svg>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Límite de Sesiones Alcanzado
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Su plan actual no permite más sesiones activas
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div class="space-y-6">
            
            <!-- Información del plan -->
            <div class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">
                    Sesión No Disponible
                  </h3>
                  <div class="mt-2 text-sm text-red-700">
                    <p>{{ errorMessage }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del plan actual -->
            @if (businessInfo) {
              <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 class="text-sm font-medium text-blue-800 mb-2">Información del Plan</h4>
                <dl class="text-sm text-blue-700">
                  <div class="flex justify-between">
                    <dt>Plan actual:</dt>
                    <dd class="font-medium">{{ getPlanName(businessInfo.plan) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt>Sesiones máximas:</dt>
                    <dd class="font-medium">{{ getMaxSessions(businessInfo.plan) }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt>Sesiones activas:</dt>
                    <dd class="font-medium text-red-600">{{ activeSessions }}</dd>
                  </div>
                </dl>
              </div>
            }

            <!-- Sesiones activas (para admins) -->
            @if (canViewSessions && sessions.length > 0) {
              <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 class="text-sm font-medium text-gray-800 mb-3">Sesiones Activas</h4>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  @for (session of sessions; track session.sessionId) {
                    <div class="flex justify-between items-center text-xs bg-white p-2 rounded border">
                      <div>
                        <div class="font-medium text-gray-900">Usuario: {{ session.userId }}</div>
                        <div class="text-gray-500">{{ formatTimestamp(session.timestamp) }}</div>
                      </div>
                      @if (canForceClose) {
                        <button 
                          (click)="forceCloseSession(session.userId)"
                          class="text-red-600 hover:text-red-800 text-xs"
                          [disabled]="isClosingSession">
                          Cerrar
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Acciones -->
            <div class="space-y-3">
              @if (canRetry) {
                <button
                  (click)="retryAccess()"
                  [disabled]="isRetrying"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                  @if (isRetrying) {
                    <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verificando...
                  } @else {
                    Intentar de Nuevo
                  }
                </button>
              }

              <button
                (click)="logout()"
                class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cerrar Sesión
              </button>
            </div>

            <!-- Información de contacto -->
            <div class="text-center">
              <p class="text-xs text-gray-500">
                ¿Necesita más sesiones? 
                <a href="mailto:soporte@angema.com" class="text-blue-600 hover:text-blue-500">
                  Contacte con soporte
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class SessionLimitComponent implements OnInit {
  errorMessage = '';
  businessInfo: any = null;
  activeSessions = 0;
  sessions: any[] = [];
  
  isRetrying = false;
  isClosingSession = false;
  
  canViewSessions = false;
  canForceClose = false;
  canRetry = true;

  constructor(
    private sessionControlService: SessionControlService,
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadSessionInfo();
    this.checkPermissions();
  }

  private async loadSessionInfo() {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser) return;

      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) return;

      this.businessInfo = await this.businessService.getBusinessById(businessId);
      
      if (this.canViewSessions) {
        this.sessions = await this.sessionControlService.getBusinessActiveSessions(businessId);
        this.activeSessions = this.sessions.length;
      }

      // Intentar registrar sesión para obtener el mensaje de error específico
      const result = await this.sessionControlService.registerSession();
      if (!result.success) {
        this.errorMessage = result.message;
      }

    } catch (error) {
      console.error('Error cargando información de sesión:', error);
      this.errorMessage = 'Error al verificar el estado de las sesiones.';
    }
  }

  private checkPermissions() {
    const currentUser = this.authService.getCurrentUserProfile();
    if (!currentUser) return;

    this.canViewSessions = ['root', 'admin'].includes(currentUser.roleId);
    this.canForceClose = ['root', 'admin'].includes(currentUser.roleId);
  }

  async retryAccess() {
    this.isRetrying = true;
    
    try {
      const result = await this.sessionControlService.registerSession();
      if (result.success) {
        // Sesión registrada exitosamente, redirigir a orders
        this.router.navigate(['/app/orders']);
      } else {
        // Actualizar mensaje de error
        this.errorMessage = result.message;
        await this.loadSessionInfo();
      }
    } catch (error) {
      console.error('Error reintentando acceso:', error);
      this.errorMessage = 'Error al intentar acceder al sistema.';
    } finally {
      this.isRetrying = false;
    }
  }

  async forceCloseSession(userId: string) {
    if (!confirm('¿Está seguro de que desea cerrar esta sesión?')) {
      return;
    }

    this.isClosingSession = true;

    try {
      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) return;

      const success = await this.sessionControlService.forceCloseSession(businessId, userId);
      if (success) {
        // Recargar la información de sesiones
        await this.loadSessionInfo();
      }
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      this.isClosingSession = false;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/app/login']);
  }

  getPlanName(plan: string): string {
    const planNames = {
      'basic': 'Básico',
      'premium': 'Premium', 
      'enterprise': 'Enterprise'
    };
    return planNames[plan as keyof typeof planNames] || plan;
  }

  getMaxSessions(plan: string): string {
    const limits = {
      'basic': '1',
      'premium': '5',
      'enterprise': 'Ilimitadas'
    };
    return limits[plan as keyof typeof limits] || '1';
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}