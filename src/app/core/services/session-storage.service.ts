import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  
  constructor() {}

  /**
   * Guarda un valor en sessionStorage con un tipo específico
   */
  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error guardando en sessionStorage:', error);
    }
  }

  /**
   * Obtiene un valor tipado desde sessionStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error leyendo de sessionStorage:', error);
      return null;
    }
  }

  /**
   * Remueve un item específico
   */
  remove(key: string): void {
    sessionStorage.removeItem(key);
  }

  /**
   * Limpia todo el sessionStorage
   */
  clear(): void {
    sessionStorage.clear();
  }

  /**
   * Verifica si existe una key
   */
  exists(key: string): boolean {
    return !!sessionStorage.getItem(key);
  }

  /**
   * Obtiene el tiempo transcurrido desde un timestamp guardado
   */
  getElapsedTime(timestampKey: string): number {
    const timestamp = this.get<number>(timestampKey);
    return timestamp ? Date.now() - timestamp : 0;
  }

  /**
   * Actualiza o establece un timestamp
   */
  updateTimestamp(key: string): void {
    this.set(key, Date.now());
  }
} 