import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  
  constructor() {}

  /**
   * Guarda un valor en localStorage con un tipo específico
   */
  set<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  /**
   * Obtiene un valor tipado desde localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error leyendo de localStorage:', error);
      return null;
    }
  }

  /**
   * Remueve un item específico
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Limpia todo el localStorage
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Verifica si existe una key
   */
  exists(key: string): boolean {
    return !!localStorage.getItem(key);
  }
} 