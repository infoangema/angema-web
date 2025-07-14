import { Injectable } from '@angular/core';
import { Observable, firstValueFrom, of, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { createUserWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { DatabaseService } from './database.service';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { ChangeDetectionService } from './change-detection.service';
// import { FirebaseMetricsService } from './firebase-metrics.service';
import { Business, CreateBusinessRequest, User, CreateUserRequest, DEFAULT_BUSINESS_SETTINGS } from '../models/business.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  constructor(
    private databaseService: DatabaseService,
    private firebaseService: FirebaseService,
    private authService: AuthService,
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService
    // private firebaseMetricsService: FirebaseMetricsService
  ) {}

  // === GESTIÓN DE NEGOCIOS ===

  /**
   * Crear un nuevo negocio con su usuario administrador
   */
  async createBusiness(request: CreateBusinessRequest): Promise<string> {
    try {
      // 1. Crear el negocio
      const businessData = {
        name: request.name,
        email: request.email,
        phone: request.phone,
        address: request.address,
        plan: request.plan,
        isActive: true,
        settings: DEFAULT_BUSINESS_SETTINGS
      };

      const businessId = await this.databaseService.create('businesses', businessData);

      // 2. Crear el usuario administrador del negocio
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        request.adminUser.email,
        request.adminUser.password
      );

      // 3. Crear el documento del usuario en Firestore
      const userData = {
        email: request.adminUser.email,
        displayName: request.adminUser.displayName,
        businessId: businessId,
        roleId: 'admin',
        isActive: true,
        uid: userCredential.user.uid
      };

      await this.databaseService.create('users', userData);

      return businessId;
    } catch (error) {
      console.error('Error creando negocio:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los negocios con cache
   */
  getBusinesses(): Observable<Business[]> {
    const cacheKey = 'all_businesses';

    // Verificar si necesita refresh
    if (!this.changeDetectionService.needsRefresh('businesses')) {
      const cached = this.cacheService.get<Business[]>(cacheKey, 'memory');
      if (cached) {
        console.log('BusinessService: Returning cached businesses');
        // this.firebaseMetricsService.trackCacheHit('businesses');
        return of(cached);
      }
    }

    // Consultar Firebase y actualizar cache
    console.log('BusinessService: Fetching fresh businesses data');
    const startTime = Date.now();
    return from(this.databaseService.getOnce<Business>('businesses'))
      .pipe(
        map((businesses: Business[]) => businesses.sort((a: Business, b: Business) => a.name.localeCompare(b.name))),
        tap((businesses: Business[]) => {
          // Tracking de métricas
          const responseTime = Date.now() - startTime;
          // this.firebaseMetricsService.trackFirebaseRead('businesses');
          // this.firebaseMetricsService.trackResponseTime('businesses', responseTime);

          // Actualizar cache (memoria para datos estáticos)
          this.cacheService.set(cacheKey, businesses, 30 * 60 * 1000, 'memory'); // 30 minutos TTL

          // Marcar como actualizado
          this.changeDetectionService.markAsUpdated('businesses');

          console.log(`BusinessService: Cached ${businesses.length} businesses (${responseTime}ms)`);
        })
      );
  }

  /**
   * Obtener un negocio por ID con cache
   */
  async getBusinessById(id: string): Promise<Business | null> {
    try {
      const cacheKey = `business_${id}`;

      // Verificar cache primero
      if (!this.changeDetectionService.needsRefresh('businesses')) {
        const cached = this.cacheService.get<Business>(cacheKey, 'memory');
        if (cached) {
          console.log(`BusinessService: Returning cached business ${id}`);
          return cached;
        }
      }

      // Consultar Firebase
      console.log(`BusinessService: Fetching fresh business data for ${id}`);
      const business = await this.databaseService.getById<Business>('businesses', id);

      if (business) {
        // Actualizar cache
        this.cacheService.set(cacheKey, business, 30 * 60 * 1000, 'memory'); // 30 minutos TTL
        console.log(`BusinessService: Cached business ${id}`);
      }

      return business;
    } catch (error) {
      console.error('Error obteniendo negocio:', error);
      throw error;
    }
  }

  /**
   * Actualizar un negocio
   */
  async updateBusiness(id: string, data: Partial<Business>): Promise<void> {
    try {
      await this.databaseService.update('businesses', id, data);

      // Solo invalidar cache, sin notificación adicional
      this.changeDetectionService.invalidateCollection('businesses');
      this.cacheService.remove(`business_${id}`, 'memory');

      console.log(`BusinessService: Business ${id} updated and cache invalidated`);
    } catch (error) {
      console.error('Error actualizando negocio:', error);
      throw error;
    }
  }

  /**
   * Eliminar un negocio (soft delete)
   */
  async deleteBusiness(id: string): Promise<void> {
    try {
      await this.databaseService.softDelete('businesses', id);

      // Solo invalidar cache, sin notificación adicional
      this.changeDetectionService.invalidateCollection('businesses');
      this.cacheService.remove(`business_${id}`, 'memory');

      console.log(`BusinessService: Business ${id} deleted and cache invalidated`);
    } catch (error) {
      console.error('Error eliminando negocio:', error);
      throw error;
    }
  }

  // === GESTIÓN DE USUARIOS ===

  /**
   * Crear un nuevo usuario
   */
  async createUser(request: CreateUserRequest): Promise<string> {
    try {
      // 1. Crear usuario en Firebase Auth
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        request.email,
        request.password
      );

      // 2. Crear documento en Firestore
      const userData = {
        email: request.email,
        displayName: request.displayName,
        businessId: request.businessId,
        roleId: request.roleId,
        isActive: request.isActive,
        uid: userCredential.user.uid
      };

      return await this.databaseService.create('users', userData);
    } catch (error) {
      console.error('Error creando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  getUsers(): Observable<User[]> {
    return this.databaseService.getAll<User>('users');
  }

  /**
   * Obtener usuarios por negocio
   */
  getUsersByBusiness(businessId: string): Observable<User[]> {
    return this.databaseService.getWhere<User>('users', 'businessId', '==', businessId);
  }

  /**
   * Actualizar un usuario
   */
  async updateUser(id: string, data: Partial<User>): Promise<void> {
    try {
      await this.databaseService.update('users', id, data);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  /**
   * Eliminar un usuario (soft delete)
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.databaseService.softDelete('users', id);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // === UTILIDADES ===

  /**
   * Obtener roles disponibles
   */
  getAvailableRoles(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'admin',
        name: 'Administrador',
        description: 'Control total del negocio'
      },
      {
        id: 'editor',
        name: 'Editor',
        description: 'Gestión de inventario y pedidos'
      },
      {
        id: 'vendedor',
        name: 'Vendedor/Operador',
        description: 'Solo gestión de pedidos'
      }
    ];
  }

  /**
   * Obtener planes disponibles
   */
  getAvailablePlans(): { id: string; name: string; description: string }[] {
    return [
      {
        id: 'basic',
        name: 'Básico',
        description: 'Funcionalidades esenciales'
      },
      {
        id: 'premium',
        name: 'Premium',
        description: 'Funcionalidades avanzadas'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Funcionalidades completas'
      }
    ];
  }

  /**
   * Obtener el ID del negocio del usuario actual
   * Para usuarios Root, considera su selección de negocio
   * Para usuarios regulares, retorna su businessId asignado
   */
  async getCurrentBusinessId(): Promise<string | null> {
    const profile = await firstValueFrom(this.authService.currentUser$);

    if (this.authService.isRoot()) {
      // Para usuarios root, usar el servicio de selección de negocio
      try {
        const { RootBusinessSelectorService } = await import('../../modules/stockin-manager/services/root-business-selector.service');
        const rootSelector = new RootBusinessSelectorService(this.authService,
          // Inyectar SessionStorageService dinámicamente
          await import('./session-storage.service').then(m => new m.SessionStorageService())
        );
        return rootSelector.getEffectiveBusinessId();
      } catch (error) {
        console.warn('Error accessing root business selector:', error);
        return null;
      }
    }

    // Para usuarios regulares
    if (!profile?.businessId) {
      throw new Error('No hay un negocio asociado al usuario actual');
    }

    return profile.businessId;
  }

  /**
   * Obtener el ID del negocio para usuarios root basado en su selección
   * Esta función está optimizada para ser usada en los servicios del módulo stockin-manager
   */
  async getRootEffectiveBusinessId(): Promise<string | null> {
    if (!this.authService.isRoot()) {
      return this.getCurrentBusinessId();
    }

    // Para usuarios root, retornar null significa "mostrar todos los negocios"
    // El businessId específico significa "filtrar por ese negocio"
    return null; // Valor por defecto para root users
  }
}
