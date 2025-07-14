import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { ChangeDetectionService, ChangeNotification } from './change-detection.service';

export interface InvalidationRule {
  id: string;
  sourceCollection: string;
  targetCollections: string[];
  businessIdRequired: boolean;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CacheInvalidationService {
  private invalidationRules: InvalidationRule[] = [];
  private manualInvalidation$ = new Subject<{ collection: string; businessId?: string }>();

  constructor(
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService
  ) {
    this.setupDefaultRules();
    this.subscribeToChanges();
  }

  /**
   * Configurar reglas por defecto de invalidación
   */
  private setupDefaultRules(): void {
    this.invalidationRules = [
      {
        id: 'customer-related',
        sourceCollection: 'customers',
        targetCollections: ['customers', 'customer_stats', 'customer_segments'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con clientes'
      },
      {
        id: 'product-related',
        sourceCollection: 'products',
        targetCollections: ['products', 'inventory', 'categories', 'warehouses'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con productos'
      },
      {
        id: 'business-related',
        sourceCollection: 'businesses',
        targetCollections: ['businesses', 'users', 'business_settings'],
        businessIdRequired: false,
        description: 'Invalidar datos relacionados con negocios'
      },
      {
        id: 'orders-related',
        sourceCollection: 'orders',
        targetCollections: ['orders', 'customers', 'products', 'inventory'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con órdenes'
      },
      {
        id: 'categories-related',
        sourceCollection: 'categories',
        targetCollections: ['categories', 'products'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con categorías'
      },
      {
        id: 'warehouses-related',
        sourceCollection: 'warehouses',
        targetCollections: ['warehouses', 'products', 'inventory'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con almacenes'
      },
      {
        id: 'attributes-related',
        sourceCollection: 'attributes',
        targetCollections: ['attributes', 'products'],
        businessIdRequired: true,
        description: 'Invalidar datos relacionados con atributos'
      }
    ];

    console.log(`CacheInvalidationService: Configured ${this.invalidationRules.length} invalidation rules`);
  }

  /**
   * Suscribirse a notificaciones de cambio
   */
  private subscribeToChanges(): void {
    // Escuchar cambios automáticos del ChangeDetectionService
    this.changeDetectionService.getChangeNotifications()
      .pipe(filter(notification => notification !== null))
      .subscribe(notification => {
        if (notification) {
          this.processChangeNotification(notification);
        }
      });

    // Escuchar invalidaciones manuales
    this.manualInvalidation$.subscribe(({ collection, businessId }) => {
      this.invalidateByCollection(collection, businessId);
    });
  }

  /**
   * Procesar notificación de cambio y aplicar reglas
   */
  private processChangeNotification(notification: ChangeNotification): void {
    // Evitar procesar notificaciones de invalidación para prevenir bucles
    if (notification.action === 'update' && !notification.userId) {
      console.log(`CacheInvalidationService: Skipping invalidation-only notification for ${notification.collection}`);
      return;
    }

    const applicableRules = this.invalidationRules.filter(rule => 
      rule.sourceCollection === notification.collection
    );

    if (applicableRules.length === 0) {
      console.log(`CacheInvalidationService: No rules found for collection ${notification.collection}`);
      return;
    }

    console.log(`CacheInvalidationService: Processing ${notification.action} for ${notification.collection}`);
    applicableRules.forEach(rule => {
      this.applyInvalidationRule(rule, notification);
    });
  }

  /**
   * Aplicar regla de invalidación
   */
  private applyInvalidationRule(rule: InvalidationRule, notification: ChangeNotification): void {
    console.log(`CacheInvalidationService: Applying rule "${rule.id}" for ${notification.collection}`);

    rule.targetCollections.forEach(targetCollection => {
      if (rule.businessIdRequired && notification.businessId) {
        // Invalidar cache específico del negocio
        this.invalidateCollectionCache(targetCollection, notification.businessId);
        
        // Invalidar estado de change detection
        this.changeDetectionService.invalidateCollection(targetCollection, notification.businessId);
      } else if (!rule.businessIdRequired) {
        // Invalidar cache global
        this.invalidateCollectionCache(targetCollection);
        
        // Invalidar estado de change detection
        this.changeDetectionService.invalidateCollection(targetCollection);
      }
    });
  }

  /**
   * Invalidar cache de una colección específica
   */
  private invalidateCollectionCache(collection: string, businessId?: string): void {
    const patterns = this.getCachePatterns(collection, businessId);
    
    patterns.forEach(pattern => {
      // Invalidar en todos los tipos de storage
      this.cacheService.invalidatePattern(pattern.regex, 'memory');
      this.cacheService.invalidatePattern(pattern.regex, 'localStorage');
      this.cacheService.invalidatePattern(pattern.regex, 'sessionStorage');
      
      console.log(`CacheInvalidationService: Invalidated cache pattern ${pattern.description}`);
    });
  }

  /**
   * Obtener patrones de cache para una colección
   */
  private getCachePatterns(collection: string, businessId?: string): { regex: RegExp; description: string }[] {
    const patterns: { regex: RegExp; description: string }[] = [];

    if (businessId) {
      // Patrones específicos del negocio
      patterns.push({
        regex: new RegExp(`^${collection}_${businessId}`),
        description: `${collection} for business ${businessId}`
      });
      
      patterns.push({
        regex: new RegExp(`^${collection}_.*_${businessId}`),
        description: `${collection} variations for business ${businessId}`
      });
    } else {
      // Patrones globales
      patterns.push({
        regex: new RegExp(`^${collection}_`),
        description: `All ${collection} cache entries`
      });
      
      patterns.push({
        regex: new RegExp(`^all_${collection}`),
        description: `All ${collection} global cache`
      });
    }

    return patterns;
  }

  /**
   * Invalidar manualmente por colección
   */
  invalidateByCollection(collection: string, businessId?: string): void {
    console.log(`CacheInvalidationService: Manual invalidation of ${collection}${businessId ? ` for business ${businessId}` : ''}`);
    
    this.manualInvalidation$.next({ collection, businessId });
  }

  /**
   * Invalidar todo el cache de un negocio
   */
  invalidateBusinessCache(businessId: string): void {
    console.log(`CacheInvalidationService: Invalidating all cache for business ${businessId}`);
    
    const businessPattern = new RegExp(`_${businessId}($|_)`);
    
    // Invalidar en todos los tipos de storage
    this.cacheService.invalidatePattern(businessPattern, 'memory');
    this.cacheService.invalidatePattern(businessPattern, 'localStorage');
    this.cacheService.invalidatePattern(businessPattern, 'sessionStorage');
    
    // Invalidar change detection para el negocio
    this.changeDetectionService.invalidateBusinessCollections(businessId);
  }

  /**
   * Agregar regla personalizada de invalidación
   */
  addInvalidationRule(rule: InvalidationRule): void {
    const existingRuleIndex = this.invalidationRules.findIndex(r => r.id === rule.id);
    
    if (existingRuleIndex >= 0) {
      this.invalidationRules[existingRuleIndex] = rule;
      console.log(`CacheInvalidationService: Updated invalidation rule "${rule.id}"`);
    } else {
      this.invalidationRules.push(rule);
      console.log(`CacheInvalidationService: Added new invalidation rule "${rule.id}"`);
    }
  }

  /**
   * Remover regla de invalidación
   */
  removeInvalidationRule(ruleId: string): void {
    const index = this.invalidationRules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.invalidationRules.splice(index, 1);
      console.log(`CacheInvalidationService: Removed invalidation rule "${ruleId}"`);
    }
  }

  /**
   * Obtener todas las reglas de invalidación
   */
  getInvalidationRules(): InvalidationRule[] {
    return [...this.invalidationRules];
  }

  /**
   * Obtener observable para escuchar invalidaciones manuales
   */
  getManualInvalidations(): Observable<{ collection: string; businessId?: string }> {
    return this.manualInvalidation$.asObservable();
  }

  /**
   * Limpiar todo el cache y estado de change detection
   */
  clearAllCache(): void {
    console.log('CacheInvalidationService: Clearing all cache');
    
    // Limpiar cache service
    this.cacheService.clear();
    
    // Resetear change detection
    this.changeDetectionService.reset();
  }

  /**
   * Invalidar cache por patrón personalizado
   */
  invalidateByPattern(pattern: RegExp, storageTypes: ('memory' | 'localStorage' | 'sessionStorage')[] = ['memory', 'localStorage', 'sessionStorage']): void {
    console.log(`CacheInvalidationService: Invalidating by custom pattern ${pattern}`);
    
    storageTypes.forEach(storageType => {
      this.cacheService.invalidatePattern(pattern, storageType);
    });
  }

  /**
   * Obtener estadísticas de invalidación
   */
  getInvalidationStats(): {
    rules: { id: string; description: string }[];
    cacheStats: any;
    changeDetectionStats: any;
  } {
    return {
      rules: this.invalidationRules.map(rule => ({
        id: rule.id,
        description: rule.description
      })),
      cacheStats: this.cacheService.getStats(),
      changeDetectionStats: this.changeDetectionService.getAllCollectionStatus()
    };
  }
}