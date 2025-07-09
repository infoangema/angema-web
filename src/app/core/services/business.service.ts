import { Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { createUserWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { where } from '@angular/fire/firestore';
import { DatabaseService } from './database.service';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { Business, CreateBusinessRequest, User, CreateUserRequest, DEFAULT_BUSINESS_SETTINGS } from '../models/business.model';

@Injectable({
  providedIn: 'root'
})
export class BusinessService {

  constructor(
    private databaseService: DatabaseService,
    private firebaseService: FirebaseService,
    private authService: AuthService
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
   * Obtener todos los negocios
   */
  getBusinesses(): Observable<Business[]> {
    return this.databaseService.getAll<Business>('businesses');
  }

  /**
   * Obtener un negocio por ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    try {
      return await this.databaseService.getById<Business>('businesses', id);
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
   */
  async getCurrentBusinessId(): Promise<string> {
    const profile = await firstValueFrom(this.authService.currentUser$);
    if (!profile?.businessId) {
      throw new Error('No hay un negocio asociado al usuario actual');
    }
    return profile.businessId;
  }
} 