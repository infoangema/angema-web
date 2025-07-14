import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionStorageService } from './session-storage.service';

export interface ChangeNotification {
  collection: string;
  action: 'create' | 'update' | 'delete';
  businessId?: string;
  timestamp: number;
  userId?: string;
}

export interface CollectionStatus {
  lastUpdate: number;
  lastCheck: number;
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChangeDetectionService {
  private changeNotifications$ = new BehaviorSubject<ChangeNotification | null>(null);
  private collectionStatus = new Map<string, CollectionStatus>();
  private readonly STORAGE_PREFIX = 'change_detection_';

  // Tiempo de gracia para considerar que los datos están frescos (10 minutos)
  // Debe ser menor que el TTL del cache (15 min) pero lo suficientemente largo para evitar refrescos innecesarios
  private readonly FRESHNESS_THRESHOLD = 10 * 60 * 1000;

  constructor(private sessionStorage: SessionStorageService) {
    this.loadCollectionStatus();
  }

  /**
   * Verificar si una colección necesita refrescarse
   */
  needsRefresh(collection: string, businessId?: string): boolean {
    const key = this.getCollectionKey(collection, businessId);
    const status = this.collectionStatus.get(key);
    
    if (!status) {
      console.log(`ChangeDetection: ${key} - No status found, needs refresh`);
      return true;
    }

    const timeSinceLastUpdate = Date.now() - status.lastUpdate;
    const needsRefresh = timeSinceLastUpdate > this.FRESHNESS_THRESHOLD;
    
    if (needsRefresh) {
      console.log(`ChangeDetection: ${key} - Age: ${timeSinceLastUpdate}ms, needs refresh`);
    }
    return needsRefresh;
  }

  /**
   * Marcar una colección como actualizada
   */
  markAsUpdated(collection: string, businessId?: string): void {
    const key = this.getCollectionKey(collection, businessId);
    const currentStatus = this.collectionStatus.get(key);
    
    const newStatus: CollectionStatus = {
      lastUpdate: Date.now(),
      lastCheck: Date.now(),
      version: (currentStatus?.version || 0) + 1
    };

    this.collectionStatus.set(key, newStatus);
    this.saveCollectionStatus(key, newStatus);
    
    console.log(`ChangeDetection: ${key} - Marked as updated (v${newStatus.version})`);
  }

  /**
   * Invalidar cache de una colección específica
   */
  invalidateCollection(collection: string, businessId?: string): void {
    const key = this.getCollectionKey(collection, businessId);
    this.collectionStatus.delete(key);
    this.sessionStorage.remove(`${this.STORAGE_PREFIX}${key}`);
    
    console.log(`ChangeDetection: ${key} - Cache invalidated`);
    
    // NO emitir notificación automática para evitar bucles infinitos
    // La notificación debe ser explícita desde el servicio que realiza el cambio
  }

  /**
   * Invalidar todas las colecciones de un negocio
   */
  invalidateBusinessCollections(businessId: string): void {
    const keysToInvalidate = Array.from(this.collectionStatus.keys())
      .filter(key => key.includes(`_${businessId}`));

    keysToInvalidate.forEach(key => {
      this.collectionStatus.delete(key);
      this.sessionStorage.remove(`${this.STORAGE_PREFIX}${key}`);
    });

    console.log(`ChangeDetection: Invalidated ${keysToInvalidate.length} collections for business ${businessId}`);
  }

  /**
   * Notificar un cambio en los datos
   */
  notifyChange(notification: ChangeNotification): void {
    const key = this.getCollectionKey(notification.collection, notification.businessId);
    
    // Invalidar el status de la colección
    this.invalidateCollection(notification.collection, notification.businessId);
    
    // Emitir notificación
    this.changeNotifications$.next(notification);
    
    console.log(`ChangeDetection: Change notified for ${key}:`, notification);
  }

  /**
   * Obtener observable de notificaciones de cambio
   */
  getChangeNotifications(): Observable<ChangeNotification | null> {
    return this.changeNotifications$.asObservable();
  }

  /**
   * Obtener estado de una colección
   */
  getCollectionStatus(collection: string, businessId?: string): CollectionStatus | null {
    const key = this.getCollectionKey(collection, businessId);
    return this.collectionStatus.get(key) || null;
  }

  /**
   * Obtener estadísticas de todas las colecciones
   */
  getAllCollectionStatus(): { [key: string]: CollectionStatus } {
    const result: { [key: string]: CollectionStatus } = {};
    this.collectionStatus.forEach((status, key) => {
      result[key] = status;
    });
    return result;
  }

  /**
   * Limpiar status expirados (más de 1 hora)
   */
  cleanExpiredStatus(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const expiredKeys: string[] = [];

    this.collectionStatus.forEach((status, key) => {
      if (status.lastCheck < oneHourAgo) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.collectionStatus.delete(key);
      this.sessionStorage.remove(`${this.STORAGE_PREFIX}${key}`);
    });

    if (expiredKeys.length > 0) {
      console.log(`ChangeDetection: Cleaned ${expiredKeys.length} expired status entries`);
    }
  }

  /**
   * Configurar limpieza automática
   */
  setupAutoCleanup(intervalMs: number = 30 * 60 * 1000): void {
    setInterval(() => {
      this.cleanExpiredStatus();
    }, intervalMs);
  }

  /**
   * Resetear todo el estado (útil para testing o logout)
   */
  reset(): void {
    this.collectionStatus.clear();
    
    // Limpiar del sessionStorage
    const keys = this.getStorageKeys();
    keys.forEach(key => this.sessionStorage.remove(key));
    
    console.log('ChangeDetection: All status reset');
  }

  /**
   * Forzar verificación de freshness para una colección
   */
  forceCheck(collection: string, businessId?: string): boolean {
    const key = this.getCollectionKey(collection, businessId);
    const status = this.collectionStatus.get(key);
    
    if (status) {
      status.lastCheck = Date.now();
      this.collectionStatus.set(key, status);
      this.saveCollectionStatus(key, status);
    }
    
    return this.needsRefresh(collection, businessId);
  }

  // Métodos privados

  private getCollectionKey(collection: string, businessId?: string): string {
    return businessId ? `${collection}_${businessId}` : collection;
  }

  private saveCollectionStatus(key: string, status: CollectionStatus): void {
    this.sessionStorage.set(`${this.STORAGE_PREFIX}${key}`, status);
  }

  private loadCollectionStatus(): void {
    const keys = this.getStorageKeys();
    
    keys.forEach(storageKey => {
      const status = this.sessionStorage.get<CollectionStatus>(storageKey);
      if (status) {
        const collectionKey = storageKey.replace(this.STORAGE_PREFIX, '');
        this.collectionStatus.set(collectionKey, status);
      }
    });
    
    console.log(`ChangeDetection: Loaded ${this.collectionStatus.size} collection status from storage`);
  }

  private getStorageKeys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    
    return keys;
  }
}