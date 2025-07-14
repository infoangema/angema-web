import { Injectable } from '@angular/core';
import { ref, set, get, onDisconnect, onValue, remove, serverTimestamp } from 'firebase/database';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { BusinessService } from './business.service';

export interface SessionInfo {
  timestamp: number;
  plan: string;
  sessionId: string;
  userAgent: string;
  ip?: string;
  userId: string;
  businessId: string;
}

export interface BusinessSessionCount {
  active_count: number;
  last_updated: number;
}

@Injectable({
  providedIn: 'root'
})
export class SessionControlService {
  private currentSessionId: string | null = null;
  private cleanup: (() => void) | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private businessService: BusinessService
  ) {}

  /**
   * Registra una nueva sesión para el usuario actual
   */
  async registerSession(): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser) {
        return { success: false, message: 'Usuario no autenticado' };
      }

      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) {
        return { success: false, message: 'No se encontró el negocio asociado' };
      }

      const business = await this.businessService.getBusinessById(businessId);
      if (!business) {
        return { success: false, message: 'Negocio no encontrado' };
      }

      // Verificar límites de sesión según el plan
      const canStart = await this.checkSessionLimit(businessId, business.plan);
      if (!canStart.allowed) {
        return { success: false, message: canStart.reason };
      }

      // Generar ID de sesión único
      this.currentSessionId = this.generateSessionId();

      // Registrar sesión en Realtime Database
      const sessionRef = ref(
        this.firebaseService.realtimeDatabase, 
        `sessions/${businessId}/${currentUser.uid}`
      );

      const sessionInfo: SessionInfo = {
        timestamp: Date.now(),
        plan: business.plan,
        sessionId: this.currentSessionId,
        userAgent: navigator.userAgent,
        userId: currentUser.uid,
        businessId: businessId
      };

      await set(sessionRef, sessionInfo);

      // Configurar cleanup automático al desconectar
      onDisconnect(sessionRef).remove();

      // Actualizar contador de sesiones
      await this.updateSessionCount(businessId);

      // Configurar cleanup local
      this.setupCleanup(businessId, currentUser.uid);

      console.log('Sesión registrada exitosamente:', this.currentSessionId);
      return { success: true, message: 'Sesión iniciada correctamente' };

    } catch (error) {
      console.error('Error registrando sesión:', error);
      return { success: false, message: 'Error interno al iniciar sesión' };
    }
  }

  /**
   * Verifica si se puede iniciar una nueva sesión según el plan
   */
  private async checkSessionLimit(businessId: string, plan: string): Promise<{ allowed: boolean; reason: string }> {
    const maxSessions = this.getMaxSessionsForPlan(plan);
    
    // Si el plan permite sesiones ilimitadas, siempre permitir
    if (maxSessions === -1) {
      return { allowed: true, reason: '' };
    }

    const activeSessions = await this.getActiveSessionsCount(businessId);
    
    if (activeSessions >= maxSessions) {
      return { 
        allowed: false, 
        reason: `Plan ${plan} permite máximo ${maxSessions} sesión(es) activa(s). Actualmente hay ${activeSessions} sesión(es) activa(s).` 
      };
    }

    return { allowed: true, reason: '' };
  }

  /**
   * Obtiene el número máximo de sesiones para un plan
   */
  private getMaxSessionsForPlan(plan: string): number {
    const limits = {
      'basic': 1,
      'premium': 5,
      'enterprise': -1 // Ilimitado
    };
    
    return limits[plan as keyof typeof limits] || 1;
  }

  /**
   * Cuenta las sesiones activas para un negocio
   */
  private async getActiveSessionsCount(businessId: string): Promise<number> {
    try {
      const sessionsRef = ref(this.firebaseService.realtimeDatabase, `sessions/${businessId}`);
      const snapshot = await get(sessionsRef);
      
      if (!snapshot.exists()) {
        return 0;
      }

      const sessions = snapshot.val();
      return Object.keys(sessions).length;
    } catch (error) {
      console.error('Error contando sesiones activas:', error);
      return 0;
    }
  }

  /**
   * Actualiza el contador de sesiones para un negocio
   */
  private async updateSessionCount(businessId: string): Promise<void> {
    try {
      const count = await this.getActiveSessionsCount(businessId);
      const countRef = ref(this.firebaseService.realtimeDatabase, `business_sessions_count/${businessId}`);
      
      const countInfo: BusinessSessionCount = {
        active_count: count,
        last_updated: Date.now()
      };

      await set(countRef, countInfo);
    } catch (error) {
      console.error('Error actualizando contador de sesiones:', error);
    }
  }

  /**
   * Cierra la sesión actual
   */
  async closeSession(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser) return;

      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) return;

      const sessionRef = ref(
        this.firebaseService.realtimeDatabase, 
        `sessions/${businessId}/${currentUser.uid}`
      );

      await remove(sessionRef);
      await this.updateSessionCount(businessId);

      if (this.cleanup) {
        this.cleanup();
        this.cleanup = null;
      }

      this.currentSessionId = null;
      console.log('Sesión cerrada exitosamente');

    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  /**
   * Verifica si hay una sesión activa para el usuario actual
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser) return false;

      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) return false;

      const sessionRef = ref(
        this.firebaseService.realtimeDatabase, 
        `sessions/${businessId}/${currentUser.uid}`
      );

      const snapshot = await get(sessionRef);
      return snapshot.exists();

    } catch (error) {
      console.error('Error verificando sesión activa:', error);
      return false;
    }
  }

  /**
   * Obtiene información de todas las sesiones activas para un negocio (solo para admins/root)
   */
  async getBusinessActiveSessions(businessId: string): Promise<SessionInfo[]> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser || !['root', 'admin'].includes(currentUser.roleId)) {
        throw new Error('Permisos insuficientes');
      }

      const sessionsRef = ref(this.firebaseService.realtimeDatabase, `sessions/${businessId}`);
      const snapshot = await get(sessionsRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const sessions = snapshot.val();
      return Object.values(sessions) as SessionInfo[];

    } catch (error) {
      console.error('Error obteniendo sesiones del negocio:', error);
      return [];
    }
  }

  /**
   * Fuerza el cierre de una sesión específica (solo para admins/root)
   */
  async forceCloseSession(businessId: string, userId: string): Promise<boolean> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser || !['root', 'admin'].includes(currentUser.roleId)) {
        throw new Error('Permisos insuficientes');
      }

      const sessionRef = ref(
        this.firebaseService.realtimeDatabase, 
        `sessions/${businessId}/${userId}`
      );

      await remove(sessionRef);
      await this.updateSessionCount(businessId);

      console.log(`Sesión forzada a cerrar para usuario ${userId}`);
      return true;

    } catch (error) {
      console.error('Error forzando cierre de sesión:', error);
      return false;
    }
  }

  /**
   * Configura limpieza automática y listeners
   */
  private setupCleanup(businessId: string, userId: string): void {
    const sessionRef = ref(
      this.firebaseService.realtimeDatabase, 
      `sessions/${businessId}/${userId}`
    );

    // Listener para detectar si la sesión fue cerrada externamente
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (!snapshot.exists() && this.currentSessionId) {
        console.log('Sesión cerrada externamente');
        this.currentSessionId = null;
        // Aquí podrías emitir un evento para notificar a la UI
      }
    });

    this.cleanup = () => {
      unsubscribe();
    };

    // Cleanup automático al cerrar ventana/tab
    window.addEventListener('beforeunload', () => {
      this.closeSession();
    });
  }

  /**
   * Genera un ID único para la sesión
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene la sesión actual
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Obtiene estadísticas de sesiones para dashboard (solo para root)
   */
  async getSessionStats(): Promise<{ [businessId: string]: BusinessSessionCount }> {
    try {
      const currentUser = this.authService.getCurrentUserProfile();
      if (!currentUser || currentUser.roleId !== 'root') {
        throw new Error('Solo usuarios root pueden ver estadísticas globales');
      }

      const countsRef = ref(this.firebaseService.realtimeDatabase, 'business_sessions_count');
      const snapshot = await get(countsRef);
      
      if (!snapshot.exists()) {
        return {};
      }

      return snapshot.val() as { [businessId: string]: BusinessSessionCount };

    } catch (error) {
      console.error('Error obteniendo estadísticas de sesiones:', error);
      return {};
    }
  }
}