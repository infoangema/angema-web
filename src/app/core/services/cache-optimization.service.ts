import { Injectable } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CacheService } from './cache.service';
import { ChangeDetectionService } from './change-detection.service';
import { FirebaseMetricsService } from './firebase-metrics.service';

export interface CachePattern {
  key: string;
  collection: string;
  businessId?: string;
  accessCount: number;
  hitRate: number;
  lastAccess: Date;
  avgTimeBetweenAccess: number; // en milisegundos
  currentTTL: number;
  recommendedTTL: number;
}

export interface OptimizationSettings {
  // TTL mínimo y máximo en milisegundos
  minTTL: number;
  maxTTL: number;
  
  // Umbrales para ajustes
  highHitRateThreshold: number; // % por encima del cual aumentar TTL
  lowHitRateThreshold: number;  // % por debajo del cual reducir TTL
  highAccessFrequencyThreshold: number; // accesos por hora
  
  // Factores de ajuste
  ttlIncreaseFactor: number;
  ttlDecreaseFactor: number;
  
  // Intervalo de optimización
  optimizationIntervalMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheOptimizationService {
  private accessPatterns = new Map<string, CachePattern>();
  private optimizationSubscription?: Subscription;
  
  private readonly defaultSettings: OptimizationSettings = {
    minTTL: 2 * 60 * 1000,      // 2 minutos
    maxTTL: 60 * 60 * 1000,     // 1 hora
    highHitRateThreshold: 80,   // 80%
    lowHitRateThreshold: 40,    // 40%
    highAccessFrequencyThreshold: 10, // 10 accesos por hora
    ttlIncreaseFactor: 1.5,
    ttlDecreaseFactor: 0.7,
    optimizationIntervalMs: 10 * 60 * 1000 // 10 minutos
  };

  private settings: OptimizationSettings;

  constructor(
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService,
    private firebaseMetricsService: FirebaseMetricsService
  ) {
    this.settings = { ...this.defaultSettings };
    this.initializeOptimization();
  }

  /**
   * Inicializar el sistema de optimización automática
   */
  private initializeOptimization(): void {
    // Monitorear accesos al cache
    this.cacheService.getCacheUpdates().subscribe(update => {
      if (update.action === 'set') {
        this.trackCacheAccess(update.key);
      }
    });

    // Ejecutar optimización periódica
    this.startOptimizationSchedule();
  }

  /**
   * Iniciar el ciclo de optimización automática
   */
  startOptimizationSchedule(): void {
    if (this.optimizationSubscription) {
      this.optimizationSubscription.unsubscribe();
    }

    this.optimizationSubscription = interval(this.settings.optimizationIntervalMs)
      .subscribe(() => {
        this.performOptimization();
      });
  }

  /**
   * Detener la optimización automática
   */
  stopOptimizationSchedule(): void {
    if (this.optimizationSubscription) {
      this.optimizationSubscription.unsubscribe();
      this.optimizationSubscription = undefined;
    }
  }

  /**
   * Rastrear acceso al cache
   */
  private trackCacheAccess(key: string): void {
    const now = new Date();
    
    if (this.accessPatterns.has(key)) {
      const pattern = this.accessPatterns.get(key)!;
      
      // Actualizar estadísticas
      pattern.accessCount++;
      
      // Calcular tiempo promedio entre accesos
      const timeSinceLastAccess = now.getTime() - pattern.lastAccess.getTime();
      pattern.avgTimeBetweenAccess = (pattern.avgTimeBetweenAccess + timeSinceLastAccess) / 2;
      
      pattern.lastAccess = now;
    } else {
      // Crear nuevo patrón
      const { collection, businessId } = this.parseKey(key);
      
      this.accessPatterns.set(key, {
        key,
        collection,
        businessId,
        accessCount: 1,
        hitRate: 0, // Se calculará después
        lastAccess: now,
        avgTimeBetweenAccess: this.settings.minTTL, // Valor inicial
        currentTTL: this.getDefaultTTLForCollection(collection),
        recommendedTTL: this.getDefaultTTLForCollection(collection)
      });
    }
  }

  /**
   * Realizar optimización automática
   */
  private async performOptimization(): Promise<void> {
    console.log('CacheOptimization: Iniciando análisis de optimización...');
    
    const patterns = Array.from(this.accessPatterns.values());
    let optimizationsApplied = 0;

    for (const pattern of patterns) {
      // Calcular hit rate basado en métricas de Firebase
      pattern.hitRate = await this.calculateHitRate(pattern);
      
      // Calcular nuevo TTL recomendado
      const newTTL = this.calculateOptimalTTL(pattern);
      
      if (newTTL !== pattern.currentTTL) {
        pattern.recommendedTTL = newTTL;
        
        // Aplicar la optimización si la diferencia es significativa (>20%)
        const difference = Math.abs(newTTL - pattern.currentTTL) / pattern.currentTTL;
        if (difference > 0.2) {
          await this.applyTTLOptimization(pattern);
          optimizationsApplied++;
        }
      }
    }

    console.log(`CacheOptimization: ${optimizationsApplied} optimizaciones aplicadas`);
    
    // Limpiar patrones antiguos (más de 1 hora sin acceso)
    this.cleanupOldPatterns();
  }

  /**
   * Calcular TTL óptimo para un patrón
   */
  private calculateOptimalTTL(pattern: CachePattern): number {
    let newTTL = pattern.currentTTL;
    
    // Factor basado en hit rate
    if (pattern.hitRate > this.settings.highHitRateThreshold) {
      // Alta tasa de aciertos: aumentar TTL
      newTTL *= this.settings.ttlIncreaseFactor;
    } else if (pattern.hitRate < this.settings.lowHitRateThreshold) {
      // Baja tasa de aciertos: reducir TTL
      newTTL *= this.settings.ttlDecreaseFactor;
    }
    
    // Factor basado en frecuencia de acceso
    const accessesPerHour = (pattern.accessCount * 3600000) / 
      (Date.now() - pattern.lastAccess.getTime() + pattern.avgTimeBetweenAccess);
    
    if (accessesPerHour > this.settings.highAccessFrequencyThreshold) {
      // Alto acceso: TTL más largo para aprovechar cache
      newTTL *= 1.2;
    } else if (accessesPerHour < 1) {
      // Bajo acceso: TTL más corto para liberar memoria
      newTTL *= 0.8;
    }
    
    // Factor basado en tiempo promedio entre accesos
    if (pattern.avgTimeBetweenAccess < pattern.currentTTL * 0.5) {
      // Se accede frecuentemente antes de expirar: aumentar TTL
      newTTL *= 1.3;
    } else if (pattern.avgTimeBetweenAccess > pattern.currentTTL * 2) {
      // Se accede raramente: reducir TTL
      newTTL *= 0.6;
    }
    
    // Aplicar límites
    newTTL = Math.max(this.settings.minTTL, Math.min(this.settings.maxTTL, newTTL));
    
    return Math.round(newTTL);
  }

  /**
   * Aplicar optimización de TTL
   */
  private async applyTTLOptimization(pattern: CachePattern): Promise<void> {
    // Invalidar cache actual
    this.changeDetectionService.invalidateCollection(pattern.collection, pattern.businessId);
    
    // Actualizar TTL para futuras operaciones
    pattern.currentTTL = pattern.recommendedTTL;
    
    console.log(`CacheOptimization: ${pattern.key} TTL actualizado a ${pattern.recommendedTTL}ms`);
    
    // Nota: En una implementación más avanzada, se podría:
    // 1. Actualizar dinámicamente el TTL en el CacheService
    // 2. Re-cachear los datos con el nuevo TTL
    // 3. Notificar a los servicios del cambio
  }

  /**
   * Calcular hit rate para un patrón específico
   */
  private async calculateHitRate(pattern: CachePattern): Promise<number> {
    // Aquí se podría implementar una lógica más sofisticada
    // Por ahora, usamos una aproximación basada en la frecuencia de acceso
    
    const recentAccesses = pattern.accessCount;
    const timeWindow = 3600000; // 1 hora
    const timeSinceFirst = Date.now() - pattern.lastAccess.getTime();
    
    if (timeSinceFirst === 0 || recentAccesses === 0) {
      return 50; // Valor neutral
    }
    
    // Estimación simple: más accesos recientes = mayor hit rate
    const accessRate = (recentAccesses * timeWindow) / timeSinceFirst;
    return Math.min(95, Math.max(5, accessRate * 10));
  }

  /**
   * Obtener TTL por defecto para una colección
   */
  private getDefaultTTLForCollection(collection: string): number {
    const ttlMap: { [key: string]: number } = {
      'customers': 10 * 60 * 1000,    // 10 minutos
      'products': 15 * 60 * 1000,     // 15 minutos
      'businesses': 30 * 60 * 1000,   // 30 minutos
      'categories': 20 * 60 * 1000,   // 20 minutos
      'warehouses': 20 * 60 * 1000,   // 20 minutos
      'attributes': 25 * 60 * 1000,   // 25 minutos
      'orders': 5 * 60 * 1000,        // 5 minutos (más dinámico)
    };
    
    return ttlMap[collection] || this.settings.minTTL;
  }

  /**
   * Parsear key del cache para extraer información
   */
  private parseKey(key: string): { collection: string; businessId?: string } {
    const parts = key.split('_');
    
    if (parts.length >= 2) {
      return {
        collection: parts[0],
        businessId: parts[1] !== 'undefined' ? parts[1] : undefined
      };
    }
    
    return { collection: key };
  }

  /**
   * Limpiar patrones antiguos
   */
  private cleanupOldPatterns(): void {
    const cutoffTime = Date.now() - 3600000; // 1 hora
    const keysToRemove: string[] = [];
    
    this.accessPatterns.forEach((pattern, key) => {
      if (pattern.lastAccess.getTime() < cutoffTime) {
        keysToRemove.push(key);
      }
    });
    
    keysToRemove.forEach(key => {
      this.accessPatterns.delete(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`CacheOptimization: Limpiados ${keysToRemove.length} patrones antiguos`);
    }
  }

  /**
   * Obtener estadísticas de optimización
   */
  getOptimizationStats(): {
    totalPatterns: number;
    avgHitRate: number;
    optimizationOpportunities: number;
    patternsAnalyzed: CachePattern[];
  } {
    const patterns = Array.from(this.accessPatterns.values());
    
    const avgHitRate = patterns.length > 0 ? 
      patterns.reduce((sum, p) => sum + p.hitRate, 0) / patterns.length : 0;
    
    const opportunities = patterns.filter(p => 
      Math.abs(p.recommendedTTL - p.currentTTL) / p.currentTTL > 0.2
    ).length;
    
    return {
      totalPatterns: patterns.length,
      avgHitRate,
      optimizationOpportunities: opportunities,
      patternsAnalyzed: patterns.sort((a, b) => b.accessCount - a.accessCount)
    };
  }

  /**
   * Configurar ajustes de optimización
   */
  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Reiniciar ciclo de optimización con nuevos ajustes
    this.startOptimizationSchedule();
    
    console.log('CacheOptimization: Configuración actualizada', this.settings);
  }

  /**
   * Forzar optimización inmediata
   */
  async forceOptimization(): Promise<void> {
    await this.performOptimization();
  }

  /**
   * Resetear todos los patrones
   */
  resetPatterns(): void {
    this.accessPatterns.clear();
    console.log('CacheOptimization: Patrones reseteados');
  }

  /**
   * Destruir el servicio
   */
  destroy(): void {
    this.stopOptimizationSchedule();
    this.accessPatterns.clear();
  }
}