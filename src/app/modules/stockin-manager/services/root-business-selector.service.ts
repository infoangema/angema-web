import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SessionStorageService } from '../../../core/services/session-storage.service';

export interface RootBusinessSelection {
  businessId: string | null;
  showAll: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RootBusinessSelectorService {
  private readonly STORAGE_KEY = 'root_business_selection';
  private selectionSubject = new BehaviorSubject<RootBusinessSelection>({
    businessId: null,
    showAll: false, // Por defecto no hay selección válida
    timestamp: 0 // Timestamp muy antiguo para forzar la selección
  });

  selection$ = this.selectionSubject.asObservable();

  constructor(
    private authService: AuthService,
    private sessionStorage: SessionStorageService
  ) {
    this.loadSavedSelection();
  }

  /**
   * Cargar la selección guardada del sessionStorage
   */
  private loadSavedSelection(): void {
    const saved = this.sessionStorage.get<RootBusinessSelection>(this.STORAGE_KEY);
    if (saved) {
      this.selectionSubject.next(saved);
    }
  }

  /**
   * Establecer la selección de negocio para el usuario root
   */
  setBusinessSelection(businessId: string | null, showAll: boolean = false): void {
    if (!this.authService.isRoot()) {
      console.warn('Solo los usuarios root pueden cambiar la selección de negocio');
      return;
    }

    const selection: RootBusinessSelection = {
      businessId,
      showAll,
      timestamp: Date.now()
    };

    this.sessionStorage.set(this.STORAGE_KEY, selection);
    this.selectionSubject.next(selection);
  }

  /**
   * Obtener la selección actual
   */
  getCurrentSelection(): RootBusinessSelection {
    return this.selectionSubject.value;
  }

  /**
   * Obtener el businessId efectivo para consultas
   * - Para usuarios root: retorna el businessId seleccionado o null si debe mostrar todos
   * - Para usuarios no root: retorna null (se manejará en otros servicios)
   */
  getEffectiveBusinessId(): string | null {
    if (!this.authService.isRoot()) {
      return null; // Otros servicios deben manejar esto
    }

    const selection = this.getCurrentSelection();
    return selection.showAll ? null : selection.businessId;
  }

  /**
   * Verificar si el usuario root debe ver todos los negocios
   */
  shouldShowAllBusinesses(): boolean {
    if (!this.authService.isRoot()) {
      return false;
    }

    return this.getCurrentSelection().showAll;
  }

  /**
   * Limpiar la selección (para cuando el usuario hace logout)
   */
  clearSelection(): void {
    this.sessionStorage.remove(this.STORAGE_KEY);
    this.selectionSubject.next({
      businessId: null,
      showAll: false, // No hay selección válida después de limpiar
      timestamp: 0
    });
  }

  /**
   * Verificar si hay una selección válida
   * Una selección es válida si:
   * 1. El usuario eligió "Ver todos" (showAll = true)
   * 2. El usuario eligió un negocio específico (businessId existe)
   * 3. La selección no es muy antigua (menos de 24 horas)
   */
  hasValidSelection(): boolean {
    if (!this.authService.isRoot()) {
      return true; // Los usuarios no root no necesitan selección
    }

    const selection = this.getCurrentSelection();
    
    // Verificar si la selección es muy antigua (más de 24 horas)
    const isOld = Date.now() - selection.timestamp > 24 * 60 * 60 * 1000;
    if (isOld) {
      return false;
    }

    // Verificar si tiene una selección válida
    return selection.showAll || !!selection.businessId;
  }
}