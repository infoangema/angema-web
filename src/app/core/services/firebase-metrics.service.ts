import { Injectable, Injector } from '@angular/core';
import { Observable, BehaviorSubject, interval, combineLatest } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';
import { ChangeDetectionService } from './change-detection.service';
import { BusinessService } from './business.service';
import { Business } from '../models/business.model';

export interface FirebaseMetrics {
  totalReads: number;
  readsToday: number;
  cacheHitRate: number;
  activeSessions: SessionMetrics[];
  businessMetrics: BusinessMetrics[];
  cacheStats: CacheStats;
  optimizationSuggestions: OptimizationSuggestion[];
}

export interface SessionMetrics {
  businessId: string;
  businessName: string;
  plan: string;
  activeSessions: number;
  maxAllowed: number;
  lastActivity: Date;
  userAgents: string[];
}

export interface BusinessMetrics {
  businessId: string;
  businessName: string;
  plan: string;
  readsToday: number;
  cacheHitRate: number;
  mostAccessedCollections: CollectionAccess[];
  avgResponseTime: number;
}

export interface CollectionAccess {
  collection: string;
  reads: number;
  cacheHits: number;
  lastAccess: Date;
}

export interface CacheStats {
  memoryEntries: number;
  localStorageEntries: number;
  sessionStorageEntries: number;
  totalSize: string;
  expiredEntries: number;
  hitRate: number;
}

export interface OptimizationSuggestion {
  type: 'cache' | 'query' | 'session' | 'plan';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  businessId?: string;
  estimatedSavings: number; // percentage
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseMetricsService {
  private metricsSubject = new BehaviorSubject<FirebaseMetrics | null>(null);
  private readCounters = new Map<string, number>();
  private cacheHitCounters = new Map<string, number>();
  private responseTimeTracking = new Map<string, number[]>();

  constructor(
    private databaseService: DatabaseService,
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService,
    private businessService: BusinessService,
    private injector: Injector
  ) {
    this.initializeMetricsCollection();
  }

  get metrics$(): Observable<FirebaseMetrics | null> {
    return this.metricsSubject.asObservable();
  }

  private initializeMetricsCollection(): void {
    // Recopilar métricas cada 30 segundos
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.collectMetrics())
    ).subscribe(metrics => {
      this.metricsSubject.next(metrics);
    });
  }

  private async collectMetrics(): Promise<FirebaseMetrics> {
    try {
      const [sessionMetrics, businesses] = await Promise.all([
        this.collectSessionMetrics(),
        this.businessService.getBusinesses().toPromise() as Promise<Business[]>
      ]);

      const businessMetrics = await this.collectBusinessMetrics(businesses);
      const cacheStats = this.collectCacheStats();
      const optimizationSuggestions = this.generateOptimizationSuggestions(sessionMetrics, businessMetrics, cacheStats);

      return {
        totalReads: this.getTotalReads(),
        readsToday: this.getReadsToday(),
        cacheHitRate: this.getOverallCacheHitRate(),
        activeSessions: sessionMetrics,
        businessMetrics,
        cacheStats,
        optimizationSuggestions
      };
    } catch (error) {
      console.error('Error collecting Firebase metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  private async collectSessionMetrics(): Promise<SessionMetrics[]> {
    try {
      // Importación lazy para evitar dependencia circular
      const { SessionControlService } = await import('./session-control.service');
      const sessionControlService = this.injector.get(SessionControlService);
      
      const businesses = await this.businessService.getBusinesses().toPromise() as Business[];
      const sessionMetrics: SessionMetrics[] = [];

      for (const business of businesses) {
        if (!business.id) continue; // Saltar negocios sin ID
        
        const activeSessions = await sessionControlService.getActiveSessionsForBusiness(business.id);
        const maxAllowed = this.getMaxSessionsForPlan(business.plan);

        sessionMetrics.push({
          businessId: business.id,
          businessName: business.name,
          plan: business.plan,
          activeSessions: activeSessions.length,
          maxAllowed,
          lastActivity: activeSessions.length > 0 ? 
            new Date(Math.max(...activeSessions.map(s => s.timestamp))) : 
            new Date(0),
          userAgents: activeSessions.map(s => s.userAgent).slice(0, 3) // Mostrar solo 3
        });
      }

      return sessionMetrics;
    } catch (error) {
      console.error('Error collecting session metrics:', error);
      return [];
    }
  }

  private async collectBusinessMetrics(businesses: Business[]): Promise<BusinessMetrics[]> {
    const businessMetrics: BusinessMetrics[] = [];

    for (const business of businesses) {
      if (!business.id) continue; // Saltar negocios sin ID
      
      const readsToday = this.getBusinessReadsToday(business.id);
      const cacheHitRate = this.getBusinessCacheHitRate(business.id);
      const mostAccessedCollections = this.getMostAccessedCollections(business.id);
      const avgResponseTime = this.getAverageResponseTime(business.id);

      businessMetrics.push({
        businessId: business.id,
        businessName: business.name,
        plan: business.plan,
        readsToday,
        cacheHitRate,
        mostAccessedCollections,
        avgResponseTime
      });
    }

    return businessMetrics;
  }

  private collectCacheStats(): CacheStats {
    const memoryEntries = this.cacheService.getStorageStats('memory');
    const localStorageEntries = this.cacheService.getStorageStats('localStorage');
    const sessionStorageEntries = this.cacheService.getStorageStats('sessionStorage');

    const totalEntries = memoryEntries.total + localStorageEntries.total + sessionStorageEntries.total;
    const totalHits = Array.from(this.cacheHitCounters.values()).reduce((sum, hits) => sum + hits, 0);
    const totalRequests = Array.from(this.readCounters.values()).reduce((sum, reads) => sum + reads, 0);

    return {
      memoryEntries: memoryEntries.total,
      localStorageEntries: localStorageEntries.total,
      sessionStorageEntries: sessionStorageEntries.total,
      totalSize: this.formatBytes(memoryEntries.size + localStorageEntries.size + sessionStorageEntries.size),
      expiredEntries: memoryEntries.expired + localStorageEntries.expired + sessionStorageEntries.expired,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0
    };
  }

  private generateOptimizationSuggestions(
    sessionMetrics: SessionMetrics[],
    businessMetrics: BusinessMetrics[],
    cacheStats: CacheStats
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Sugerencias de cache
    if (cacheStats.hitRate < 60) {
      suggestions.push({
        type: 'cache',
        priority: 'high',
        title: 'Baja tasa de aciertos de cache',
        description: `La tasa de aciertos de cache es del ${cacheStats.hitRate.toFixed(1)}%. Considere aumentar el TTL o revisar las estrategias de invalidación.`,
        estimatedSavings: 30
      });
    }

    // Sugerencias de sesiones
    for (const session of sessionMetrics) {
      if (session.plan === 'basic' && session.activeSessions > 1) {
        suggestions.push({
          type: 'session',
          priority: 'high',
          title: `Exceso de sesiones en plan básico`,
          description: `${session.businessName} tiene ${session.activeSessions} sesiones activas. El plan básico permite solo 1.`,
          businessId: session.businessId,
          estimatedSavings: 50
        });
      }
    }

    // Sugerencias de consultas
    for (const business of businessMetrics) {
      if (business.readsToday > 1000 && business.cacheHitRate < 50) {
        suggestions.push({
          type: 'query',
          priority: 'medium',
          title: 'Alto número de lecturas con cache bajo',
          description: `${business.businessName} tiene ${business.readsToday} lecturas hoy con solo ${business.cacheHitRate.toFixed(1)}% de cache hits.`,
          businessId: business.businessId,
          estimatedSavings: 40
        });
      }

      if (business.avgResponseTime > 2000) {
        suggestions.push({
          type: 'query',
          priority: 'medium',
          title: 'Tiempo de respuesta alto',
          description: `${business.businessName} tiene un tiempo promedio de respuesta de ${business.avgResponseTime}ms.`,
          businessId: business.businessId,
          estimatedSavings: 25
        });
      }
    }

    // Sugerencias de plan
    for (const business of businessMetrics) {
      if (business.plan === 'basic' && business.readsToday > 500) {
        suggestions.push({
          type: 'plan',
          priority: 'low',
          title: 'Considerar upgrade de plan',
          description: `${business.businessName} está usando intensivamente Firebase (${business.readsToday} lecturas). Un plan superior ofrecería mejor rendimiento.`,
          businessId: business.businessId,
          estimatedSavings: 20
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Métodos para tracking de métricas
  trackFirebaseRead(collection: string, businessId?: string): void {
    const key = businessId ? `${collection}_${businessId}` : collection;
    this.readCounters.set(key, (this.readCounters.get(key) || 0) + 1);
  }

  trackCacheHit(collection: string, businessId?: string): void {
    const key = businessId ? `${collection}_${businessId}` : collection;
    this.cacheHitCounters.set(key, (this.cacheHitCounters.get(key) || 0) + 1);
  }

  trackResponseTime(operation: string, timeMs: number): void {
    if (!this.responseTimeTracking.has(operation)) {
      this.responseTimeTracking.set(operation, []);
    }
    const times = this.responseTimeTracking.get(operation)!;
    times.push(timeMs);
    
    // Mantener solo las últimas 100 mediciones
    if (times.length > 100) {
      times.splice(0, times.length - 100);
    }
  }

  // Métodos de utilidad
  private getMaxSessionsForPlan(plan: string): number {
    switch (plan) {
      case 'basic': return 1;
      case 'premium': return 5;
      case 'enterprise': return -1; // -1 representa ilimitado
      default: return 1;
    }
  }

  private getTotalReads(): number {
    return Array.from(this.readCounters.values()).reduce((sum, reads) => sum + reads, 0);
  }

  private getReadsToday(): number {
    // Simplificado: en una implementación real, filtrarías por fecha
    return this.getTotalReads();
  }

  private getOverallCacheHitRate(): number {
    const totalHits = Array.from(this.cacheHitCounters.values()).reduce((sum, hits) => sum + hits, 0);
    const totalReads = this.getTotalReads();
    return totalReads > 0 ? (totalHits / totalReads) * 100 : 0;
  }

  private getBusinessReadsToday(businessId: string): number {
    return Array.from(this.readCounters.entries())
      .filter(([key]) => key.includes(businessId))
      .reduce((sum, [, reads]) => sum + reads, 0);
  }

  private getBusinessCacheHitRate(businessId: string): number {
    const businessHits = Array.from(this.cacheHitCounters.entries())
      .filter(([key]) => key.includes(businessId))
      .reduce((sum, [, hits]) => sum + hits, 0);
    
    const businessReads = this.getBusinessReadsToday(businessId);
    return businessReads > 0 ? (businessHits / businessReads) * 100 : 0;
  }

  private getMostAccessedCollections(businessId: string): CollectionAccess[] {
    const collections = new Map<string, number>();
    
    Array.from(this.readCounters.entries())
      .filter(([key]) => key.includes(businessId))
      .forEach(([key, reads]) => {
        const collection = key.split('_')[0];
        collections.set(collection, (collections.get(collection) || 0) + reads);
      });

    return Array.from(collections.entries())
      .map(([collection, reads]) => ({
        collection,
        reads,
        cacheHits: this.cacheHitCounters.get(`${collection}_${businessId}`) || 0,
        lastAccess: new Date()
      }))
      .sort((a, b) => b.reads - a.reads)
      .slice(0, 5);
  }

  private getAverageResponseTime(businessId: string): number {
    const allTimes = Array.from(this.responseTimeTracking.values()).flat();
    return allTimes.length > 0 ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getEmptyMetrics(): FirebaseMetrics {
    return {
      totalReads: 0,
      readsToday: 0,
      cacheHitRate: 0,
      activeSessions: [],
      businessMetrics: [],
      cacheStats: {
        memoryEntries: 0,
        localStorageEntries: 0,
        sessionStorageEntries: 0,
        totalSize: '0 Bytes',
        expiredEntries: 0,
        hitRate: 0
      },
      optimizationSuggestions: []
    };
  }

  // Método para forzar actualización de métricas
  async refreshMetrics(): Promise<void> {
    const metrics = await this.collectMetrics();
    this.metricsSubject.next(metrics);
  }

  // Método para resetear contadores (útil para testing)
  resetCounters(): void {
    this.readCounters.clear();
    this.cacheHitCounters.clear();
    this.responseTimeTracking.clear();
  }
}