import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorageService } from './local-storage.service';
import { SessionStorageService } from './session-storage.service';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

export type CacheStorageType = 'memory' | 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private cacheUpdates$ = new BehaviorSubject<{ key: string; action: 'set' | 'invalidate' | 'clear' }>({ key: '', action: 'clear' });
  
  // TTL por defecto: 5 minutos
  private readonly DEFAULT_TTL = 5 * 60 * 1000;
  
  constructor(
    private localStorage: LocalStorageService,
    private sessionStorage: SessionStorageService
  ) {
    // Limpiar cache expirado al inicializar
    this.cleanExpiredCache();
  }

  /**
   * Almacenar datos en cache
   */
  set<T>(
    key: string, 
    data: T, 
    ttl: number = this.DEFAULT_TTL,
    storageType: CacheStorageType = 'memory'
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    switch (storageType) {
      case 'memory':
        this.memoryCache.set(key, entry);
        break;
      case 'localStorage':
        this.localStorage.set(`cache_${key}`, entry);
        break;
      case 'sessionStorage':
        this.sessionStorage.set(`cache_${key}`, entry);
        break;
    }

    // Notificar cambio
    this.cacheUpdates$.next({ key, action: 'set' });
    
    console.log(`Cache SET: ${key} (${storageType}, TTL: ${ttl}ms)`);
  }

  /**
   * Obtener datos del cache
   */
  get<T>(key: string, storageType: CacheStorageType = 'memory'): T | null {
    let entry: CacheEntry<T> | null = null;

    switch (storageType) {
      case 'memory':
        entry = this.memoryCache.get(key) as CacheEntry<T> || null;
        break;
      case 'localStorage':
        entry = this.localStorage.get<CacheEntry<T>>(`cache_${key}`);
        break;
      case 'sessionStorage':
        entry = this.sessionStorage.get<CacheEntry<T>>(`cache_${key}`);
        break;
    }

    if (!entry) {
      return null;
    }

    // Verificar si el cache ha expirado
    if (this.isExpired(entry)) {
      this.remove(key, storageType);
      console.log(`Cache EXPIRED: ${key} (${storageType})`);
      return null;
    }

    console.log(`Cache HIT: ${key} (${storageType})`);
    return entry.data;
  }

  /**
   * Verificar si existe un cache válido
   */
  has(key: string, storageType: CacheStorageType = 'memory'): boolean {
    return this.get(key, storageType) !== null;
  }

  /**
   * Eliminar entrada específica del cache
   */
  remove(key: string, storageType: CacheStorageType = 'memory'): void {
    switch (storageType) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'localStorage':
        this.localStorage.remove(`cache_${key}`);
        break;
      case 'sessionStorage':
        this.sessionStorage.remove(`cache_${key}`);
        break;
    }

    console.log(`Cache REMOVE: ${key} (${storageType})`);
  }

  /**
   * Invalidar cache por patrón (usando RegExp)
   */
  invalidatePattern(pattern: RegExp, storageType: CacheStorageType = 'memory'): void {
    const keysToRemove: string[] = [];

    switch (storageType) {
      case 'memory':
        for (const key of this.memoryCache.keys()) {
          if (pattern.test(key)) {
            keysToRemove.push(key);
          }
        }
        break;
      case 'localStorage':
        // Para localStorage y sessionStorage necesitamos iterar las keys disponibles
        this.invalidateFromWebStorage(pattern, 'localStorage');
        return;
      case 'sessionStorage':
        this.invalidateFromWebStorage(pattern, 'sessionStorage');
        return;
    }

    keysToRemove.forEach(key => {
      this.remove(key, storageType);
      this.cacheUpdates$.next({ key, action: 'invalidate' });
    });

    console.log(`Cache INVALIDATE PATTERN: ${pattern} (${storageType}) - ${keysToRemove.length} entries`);
  }

  /**
   * Invalidar cache por prefijo
   */
  invalidateByPrefix(prefix: string, storageType: CacheStorageType = 'memory'): void {
    const pattern = new RegExp(`^${prefix}`);
    this.invalidatePattern(pattern, storageType);
  }

  /**
   * Limpiar todo el cache
   */
  clear(storageType?: CacheStorageType): void {
    if (storageType) {
      switch (storageType) {
        case 'memory':
          this.memoryCache.clear();
          break;
        case 'localStorage':
          this.clearWebStorageCache('localStorage');
          break;
        case 'sessionStorage':
          this.clearWebStorageCache('sessionStorage');
          break;
      }
      console.log(`Cache CLEAR: ${storageType}`);
    } else {
      // Limpiar todo
      this.memoryCache.clear();
      this.clearWebStorageCache('localStorage');
      this.clearWebStorageCache('sessionStorage');
      console.log('Cache CLEAR: ALL');
    }

    this.cacheUpdates$.next({ key: 'all', action: 'clear' });
  }

  /**
   * Obtener estadísticas del cache
   */
  getStats(): {
    memory: { count: number; keys: string[] };
    localStorage: { count: number; keys: string[] };
    sessionStorage: { count: number; keys: string[] };
  } {
    const memoryKeys = Array.from(this.memoryCache.keys());
    const localStorageKeys = this.getWebStorageCacheKeys('localStorage');
    const sessionStorageKeys = this.getWebStorageCacheKeys('sessionStorage');

    return {
      memory: { count: memoryKeys.length, keys: memoryKeys },
      localStorage: { count: localStorageKeys.length, keys: localStorageKeys },
      sessionStorage: { count: sessionStorageKeys.length, keys: sessionStorageKeys }
    };
  }

  /**
   * Observable para escuchar cambios en el cache
   */
  getCacheUpdates(): Observable<{ key: string; action: 'set' | 'invalidate' | 'clear' }> {
    return this.cacheUpdates$.asObservable();
  }

  /**
   * Limpiar cache expirado
   */
  cleanExpiredCache(): void {
    // Limpiar memoria
    const expiredMemoryKeys = Array.from(this.memoryCache.entries())
      .filter(([_, entry]) => this.isExpired(entry))
      .map(([key, _]) => key);

    expiredMemoryKeys.forEach(key => this.memoryCache.delete(key));

    // Limpiar localStorage
    this.cleanExpiredWebStorageCache('localStorage');

    // Limpiar sessionStorage  
    this.cleanExpiredWebStorageCache('sessionStorage');

    if (expiredMemoryKeys.length > 0) {
      console.log(`Cache CLEANUP: Removed ${expiredMemoryKeys.length} expired entries`);
    }
  }

  /**
   * Configurar limpieza automática
   */
  setupAutoCleanup(intervalMs: number = 5 * 60 * 1000): void {
    setInterval(() => {
      this.cleanExpiredCache();
    }, intervalMs);
  }

  // Métodos privados

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private invalidateFromWebStorage(pattern: RegExp, storageType: 'localStorage' | 'sessionStorage'): void {
    const storage = storageType === 'localStorage' ? this.localStorage : this.sessionStorage;
    const keys = this.getWebStorageCacheKeys(storageType);
    
    const keysToRemove = keys.filter(key => pattern.test(key.replace('cache_', '')));
    
    keysToRemove.forEach(key => {
      storage.remove(key);
      this.cacheUpdates$.next({ key: key.replace('cache_', ''), action: 'invalidate' });
    });
  }

  private clearWebStorageCache(storageType: 'localStorage' | 'sessionStorage'): void {
    const storage = storageType === 'localStorage' ? this.localStorage : this.sessionStorage;
    const keys = this.getWebStorageCacheKeys(storageType);
    
    keys.forEach(key => storage.remove(key));
  }

  private getWebStorageCacheKeys(storageType: 'localStorage' | 'sessionStorage'): string[] {
    const storageObj = storageType === 'localStorage' ? localStorage : sessionStorage;
    const keys: string[] = [];
    
    for (let i = 0; i < storageObj.length; i++) {
      const key = storageObj.key(i);
      if (key && key.startsWith('cache_')) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  private cleanExpiredWebStorageCache(storageType: 'localStorage' | 'sessionStorage'): void {
    const storage = storageType === 'localStorage' ? this.localStorage : this.sessionStorage;
    const keys = this.getWebStorageCacheKeys(storageType);
    
    keys.forEach(key => {
      const entry = storage.get<CacheEntry>(key);
      if (entry && this.isExpired(entry)) {
        storage.remove(key);
      }
    });
  }
}