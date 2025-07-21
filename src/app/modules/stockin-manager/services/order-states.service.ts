import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { BusinessPlan, StockOperation } from '../models/order.model';

export interface OrderStatesConfig {
  version: string;
  lastUpdated: string;
  businessPlans: {
    [key in BusinessPlan]: {
      name: string;
      statuses: string[];
    };
  };
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  statusTransitions: Record<string, string[]>;
  stockOperations: Record<string, string>;
  enterpriseFeatures: {
    userTracking: boolean;
    automaticStatusChanges: boolean;
    additionalColumns: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderStatesService {
  private statesConfig$ = new BehaviorSubject<OrderStatesConfig | null>(null);
  private configLoaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Cargar configuración de estados desde archivo JSON
   */
  async loadStatesConfig(): Promise<OrderStatesConfig> {
    if (this.configLoaded && this.statesConfig$.value) {
      return this.statesConfig$.value;
    }

    try {
      const config = await firstValueFrom(
        this.http.get<OrderStatesConfig>('/assets/data/order-states.json')
      );

      this.statesConfig$.next(config);
      this.configLoaded = true;

      console.log(`Order states config loaded - Version: ${config.version}, Updated: ${config.lastUpdated}`);
      return config;
    } catch (error) {
      console.error('Error loading order states config:', error);
      throw error;
    }
  }

  /**
   * Obtener configuración de estados como Observable
   */
  getStatesConfig$(): Observable<OrderStatesConfig | null> {
    return this.statesConfig$.asObservable();
  }

  /**
   * Obtener configuración de estados actual (síncrono)
   */
  getCurrentConfig(): OrderStatesConfig | null {
    return this.statesConfig$.value;
  }

  /**
   * Obtener estados disponibles para un plan específico
   */
  getStatusesForPlan(plan: BusinessPlan): string[] {
    const config = this.getCurrentConfig();
    if (!config) return [];

    return config.businessPlans[plan]?.statuses || [];
  }

  /**
   * Obtener etiqueta de un estado
   */
  getStatusLabel(status: string): string {
    const config = this.getCurrentConfig();
    if (!config) return status;

    return config.statusLabels[status] || status;
  }

  /**
   * Obtener clases CSS de un estado
   */
  getStatusClasses(status: string): string {
    const config = this.getCurrentConfig();
    if (!config) return 'bg-gray-100 text-gray-800';

    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full border';
    const statusClasses = config.statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return `${baseClasses} ${statusClasses}`;
  }

  /**
   * Obtener transiciones válidas para un estado
   */
  getValidTransitions(status: string): string[] {
    const config = this.getCurrentConfig();
    if (!config) return [];

    return config.statusTransitions[status] || [];
  }

  /**
   * Obtener operación de stock para un estado
   */
  getStockOperation(status: string): StockOperation {
    const config = this.getCurrentConfig();
    if (!config) return StockOperation.NO_CHANGE;

    const operation = config.stockOperations[status];
    return (operation as StockOperation) || StockOperation.NO_CHANGE;
  }

  /**
   * Verificar si un estado es válido para un plan
   */
  isValidStatusForPlan(status: string, plan: BusinessPlan): boolean {
    const planStatuses = this.getStatusesForPlan(plan);
    return planStatuses.includes(status);
  }

  /**
   * Verificar si un estado es plan-based
   */
  isPlanBasedStatus(status: string): boolean {
    const config = this.getCurrentConfig();
    if (!config) return false;

    return Object.keys(config.statusLabels).includes(status);
  }

  /**
   * Verificar si una transición es válida
   */
  isValidTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions = this.getValidTransitions(fromStatus);
    return validTransitions.includes(toStatus);
  }

  /**
   * Obtener estados elegibles para acciones masivas
   */
  getBulkActionStatuses(plan: BusinessPlan): Array<{ value: string; label: string }> {
    const planStatuses = this.getStatusesForPlan(plan);
    const bulkEligibleStatuses = planStatuses.filter(status =>
      ['preparing', 'prepared', 'dispatched', 'canceled', 'in_delivery', 'delivered'].includes(status)
    );

    return bulkEligibleStatuses.map(status => ({
      value: status,
      label: `Cambiar a ${this.getStatusLabel(status)}`
    }));
  }

  /**
   * Obtener todas las opciones de estado para un plan
   */
  getStatusOptions(plan: BusinessPlan): Array<{ value: string; label: string }> {
    const planStatuses = this.getStatusesForPlan(plan);

    return planStatuses.map(status => ({
      value: status,
      label: this.getStatusLabel(status)
    }));
  }

  /**
   * Obtener configuración para características Enterprise
   */
  getEnterpriseFeatures() {
    const config = this.getCurrentConfig();
    return config?.enterpriseFeatures || {
      userTracking: false,
      automaticStatusChanges: false,
      additionalColumns: []
    };
  }

  /**
   * Forzar recarga de configuración
   */
  async reloadConfig(): Promise<OrderStatesConfig> {
    this.configLoaded = false;
    this.statesConfig$.next(null);
    return this.loadStatesConfig();
  }
}
