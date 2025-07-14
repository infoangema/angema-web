import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { where } from '@angular/fire/firestore';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { ChangeDetectionService } from '../../../core/services/change-detection.service';
import { RootBusinessSelectorService } from './root-business-selector.service';
import { 
  Customer, 
  CustomerType, 
  DocumentType,
  CustomerFilters, 
  CreateCustomerRequest, 
  UpdateCustomerRequest,
  CustomerStats,
  CustomerPurchaseHistory,
  CustomerSegment
} from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(
    private databaseService: DatabaseService,
    private businessService: BusinessService,
    private authService: AuthService,
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  /**
   * Observar todos los clientes del negocio actual con cache inteligente
   */
  watchCustomers(): Observable<Customer[]> {
    const isRoot = this.authService.isRoot();

    if (isRoot) {
      // Para usuarios root, escuchar cambios en la selección de negocio
      return this.rootBusinessSelector.selection$.pipe(
        switchMap(selection => {
          const businessId = selection.showAll ? null : selection.businessId;
          
          if (businessId) {
            return this.getCustomersWithCache(businessId);
          } else {
            return of([]);
          }
        })
      );
    } else {
      // Para usuarios no root, usar cache con businessId fijo
      return from(this.businessService.getCurrentBusinessId()).pipe(
        switchMap(businessId => {
          if (!businessId) {
            return of([]);
          }
          return this.getCustomersWithCache(businessId);
        })
      );
    }
  }

  /**
   * Obtener clientes con estrategia de cache
   */
  private getCustomersWithCache(businessId: string): Observable<Customer[]> {
    const cacheKey = `customers_${businessId}`;
    
    // Verificar si necesita refresh
    if (!this.changeDetectionService.needsRefresh('customers', businessId)) {
      const cached = this.cacheService.get<Customer[]>(cacheKey, 'localStorage');
      if (cached) {
        console.log(`CustomerService: Returning cached data for ${businessId}`);
        return of(cached);
      }
    }

    // Consultar Firebase y actualizar cache
    console.log(`CustomerService: Fetching fresh data for ${businessId}`);
    return from(this.databaseService.getOnce<Customer>('customers', where('businessId', '==', businessId)))
      .pipe(
        map((customers: Customer[]) => customers.sort((a: Customer, b: Customer) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )),
        tap((customers: Customer[]) => {
          // Actualizar cache (localStorage para persistencia entre sesiones)
          this.cacheService.set(cacheKey, customers, 10 * 60 * 1000, 'localStorage'); // 10 minutos TTL
          
          // Marcar como actualizado
          this.changeDetectionService.markAsUpdated('customers', businessId);
          
          console.log(`CustomerService: Cached ${customers.length} customers for ${businessId}`);
        })
      );
  }

  /**
   * Obtener clientes activos para selecciones
   */
  getActiveCustomers(): Observable<Customer[]> {
    return this.watchCustomers().pipe(
      map(customers => 
        customers
          .filter(customer => customer.isActive)
          .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
      )
    );
  }

  /**
   * Buscar clientes por criterios
   */
  searchCustomers(filters: CustomerFilters): Observable<Customer[]> {
    return this.watchCustomers().pipe(
      map(customers => {
        let filtered = [...customers];

        // Filtro de búsqueda por texto
        if (filters.search.trim()) {
          const searchTerm = filters.search.toLowerCase();
          filtered = filtered.filter(customer => 
            customer.firstName.toLowerCase().includes(searchTerm) ||
            customer.lastName.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.code.toLowerCase().includes(searchTerm) ||
            (customer.phone && customer.phone.includes(searchTerm)) ||
            (customer.documentNumber && customer.documentNumber.toLowerCase().includes(searchTerm))
          );
        }

        // Filtro por tipo de cliente
        if (filters.type) {
          filtered = filtered.filter(customer => customer.customerType === filters.type);
        }

        // Filtro por estado activo
        if (filters.active !== null) {
          filtered = filtered.filter(customer => customer.isActive === filters.active);
        }

        // Filtro por ciudad
        if (filters.city) {
          filtered = filtered.filter(customer => 
            customer.city && customer.city.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }

        return filtered;
      })
    );
  }

  /**
   * Crear un nuevo cliente
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<string> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
    } else {
      businessId = await this.businessService.getCurrentBusinessId();
    }

    if (!businessId) {
      throw new Error('No se encontró el ID del negocio');
    }

    // Generar código único si no se proporciona
    let customerCode = customerData.code;
    if (!customerCode) {
      customerCode = await this.generateCustomerCode(businessId);
    } else {
      // Verificar que el código sea único
      const isUnique = await this.isCodeUnique(customerCode);
      if (!isUnique) {
        throw new Error('El código del cliente ya existe');
      }
    }

    const customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
      businessId,
      code: customerCode.toUpperCase(),
      firstName: customerData.firstName.trim(),
      lastName: customerData.lastName.trim(),
      email: customerData.email.toLowerCase().trim(),
      phone: customerData.phone?.trim(),
      documentType: customerData.documentType,
      documentNumber: customerData.documentNumber?.trim(),
      address: customerData.address?.trim(),
      city: customerData.city?.trim(),
      state: customerData.state?.trim(),
      country: customerData.country?.trim(),
      postalCode: customerData.postalCode?.trim(),
      customerType: customerData.customerType,
      isActive: true,
      creditLimit: customerData.creditLimit || 0,
      loyaltyPoints: 0,
      totalPurchases: 0,
      customerSince: new Date(),
      notes: customerData.notes?.trim()
    };

    const customerId = await this.databaseService.create('customers', customer);
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('customers', businessId);
    
    console.log(`CustomerService: Customer created and cache invalidated for business ${businessId}`);

    return customerId;
  }

  /**
   * Actualizar un cliente
   */
  async updateCustomer(id: string, customerData: UpdateCustomerRequest): Promise<void> {
    const updateData: any = { ...customerData };
    
    // Normalizar datos
    if (updateData.firstName) updateData.firstName = updateData.firstName.trim();
    if (updateData.lastName) updateData.lastName = updateData.lastName.trim();
    if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
    if (updateData.phone) updateData.phone = updateData.phone.trim();
    if (updateData.documentNumber) updateData.documentNumber = updateData.documentNumber.trim();
    if (updateData.address) updateData.address = updateData.address.trim();
    if (updateData.city) updateData.city = updateData.city.trim();
    if (updateData.state) updateData.state = updateData.state.trim();
    if (updateData.country) updateData.country = updateData.country.trim();
    if (updateData.postalCode) updateData.postalCode = updateData.postalCode.trim();
    if (updateData.notes) updateData.notes = updateData.notes.trim();

    await this.databaseService.update('customers', id, updateData);
    
    // Obtener businessId para invalidar cache
    const businessId = await this.getBusinessId();
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('customers', businessId);
    
    console.log(`CustomerService: Customer updated and cache invalidated for business ${businessId}`);
  }

  /**
   * Eliminar un cliente (soft delete)
   */
  async deleteCustomer(id: string): Promise<void> {
    await this.databaseService.softDelete('customers', id);
    
    // Obtener businessId para invalidar cache
    const businessId = await this.getBusinessId();
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('customers', businessId);
    
    console.log(`CustomerService: Customer deleted and cache invalidated for business ${businessId}`);
  }

  /**
   * Obtener un cliente por ID
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    return this.databaseService.getById<Customer>('customers', id);
  }

  /**
   * Verificar si un código de cliente ya existe
   */
  async isCodeUnique(code: string, excludeId?: string): Promise<boolean> {
    const isRoot = this.authService.isRoot();
    let businessId: string | null = null;

    if (isRoot) {
      businessId = this.rootBusinessSelector.getEffectiveBusinessId();
    } else {
      businessId = await this.businessService.getCurrentBusinessId();
    }

    if (!businessId) {
      return false;
    }

    try {
      const customers = await this.databaseService.getOnce<Customer>('customers', 
        where('businessId', '==', businessId)
      );

      const filteredCustomers = customers.filter(customer => 
        customer.code.toUpperCase() === code.toUpperCase() && 
        customer.isActive
      );

      if (excludeId) {
        return filteredCustomers.filter(customer => customer.id !== excludeId).length === 0;
      }

      return filteredCustomers.length === 0;
    } catch (error) {
      console.error('Error checking code uniqueness:', error);
      return false;
    }
  }

  /**
   * Generar código único de cliente
   */
  async generateCustomerCode(businessId: string): Promise<string> {
    const prefix = 'CLI';
    let counter = 1;
    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = `${prefix}${counter.toString().padStart(4, '0')}`;
      isUnique = await this.isCodeUnique(code);
      if (!isUnique) {
        counter++;
      }
    }

    return code;
  }

  /**
   * Actualizar puntos de fidelización
   */
  async updateLoyaltyPoints(customerId: string, points: number, operation: 'add' | 'subtract' = 'add'): Promise<void> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    const currentPoints = customer.loyaltyPoints || 0;
    let newPoints = currentPoints;

    if (operation === 'add') {
      newPoints = currentPoints + points;
    } else {
      newPoints = Math.max(0, currentPoints - points); // No permitir puntos negativos
    }

    await this.updateCustomer(customerId, { loyaltyPoints: newPoints });
  }

  /**
   * Actualizar total de compras
   */
  async updateTotalPurchases(customerId: string, amount: number): Promise<void> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    const newTotal = (customer.totalPurchases || 0) + amount;
    const updateData: UpdateCustomerRequest = {
      totalPurchases: newTotal,
      lastPurchaseDate: new Date()
    };

    await this.updateCustomer(customerId, updateData);
  }

  /**
   * Obtener estadísticas de clientes
   */
  getCustomerStats(): Observable<CustomerStats> {
    return this.watchCustomers().pipe(
      map(customers => {
        const stats: CustomerStats = {
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => c.isActive).length,
          inactiveCustomers: customers.filter(c => !c.isActive).length,
          totalLoyaltyPoints: customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
          totalRevenue: customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0),
          averageOrderValue: 0,
          customersByType: {
            individual: customers.filter(c => c.customerType === 'individual').length,
            business: customers.filter(c => c.customerType === 'business').length,
            wholesale: customers.filter(c => c.customerType === 'wholesale').length,
            vip: customers.filter(c => c.customerType === 'vip').length
          }
        };

        // Calcular valor promedio de orden
        const activeCustomersWithPurchases = customers.filter(c => c.isActive && c.totalPurchases > 0);
        if (activeCustomersWithPurchases.length > 0) {
          stats.averageOrderValue = stats.totalRevenue / activeCustomersWithPurchases.length;
        }

        return stats;
      })
    );
  }

  /**
   * Obtener tipos de cliente disponibles
   */
  getCustomerTypes(): { value: CustomerType; label: string }[] {
    return [
      { value: 'individual', label: 'Individual' },
      { value: 'business', label: 'Empresa' },
      { value: 'wholesale', label: 'Mayorista' },
      { value: 'vip', label: 'VIP' }
    ];
  }

  /**
   * Obtener tipos de documento disponibles
   */
  getDocumentTypes(): { value: DocumentType; label: string }[] {
    return [
      { value: 'dni', label: 'DNI' },
      { value: 'passport', label: 'Pasaporte' },
      { value: 'license', label: 'Licencia' },
      { value: 'ruc', label: 'RUC' },
      { value: 'other', label: 'Otro' }
    ];
  }

  /**
   * Exportar clientes a CSV
   */
  async exportCustomersToCSV(): Promise<string> {
    const isRoot = this.authService.isRoot();
    let customers: Customer[] = [];

    if (isRoot) {
      const businessId = this.rootBusinessSelector.getEffectiveBusinessId();
      const shouldShowAll = this.rootBusinessSelector.shouldShowAllBusinesses();

      if (shouldShowAll) {
        customers = await this.databaseService.getOnce<Customer>('customers');
      } else if (businessId) {
        customers = await this.databaseService.getOnce<Customer>('customers', 
          where('businessId', '==', businessId)
        );
      } else {
        customers = await this.databaseService.getOnce<Customer>('customers');
      }
    } else {
      const businessId = await this.businessService.getCurrentBusinessId();
      if (businessId) {
        customers = await this.databaseService.getOnce<Customer>('customers', 
          where('businessId', '==', businessId)
        );
      }
    }

    const headers = [
      'Código',
      'Nombre',
      'Apellido',
      'Email',
      'Teléfono',
      'Tipo de Documento',
      'Número de Documento',
      'Dirección',
      'Ciudad',
      'Estado',
      'País',
      'Código Postal',
      'Tipo de Cliente',
      'Estado',
      'Límite de Crédito',
      'Puntos de Fidelidad',
      'Total de Compras',
      'Última Compra',
      'Cliente Desde',
      'Notas'
    ];

    const csvData = customers.map(customer => [
      customer.code,
      customer.firstName,
      customer.lastName,
      customer.email,
      customer.phone || '',
      customer.documentType || '',
      customer.documentNumber || '',
      customer.address || '',
      customer.city || '',
      customer.state || '',
      customer.country || '',
      customer.postalCode || '',
      this.getCustomerTypeLabel(customer.customerType),
      customer.isActive ? 'Activo' : 'Inactivo',
      customer.creditLimit || 0,
      customer.loyaltyPoints,
      customer.totalPurchases,
      customer.lastPurchaseDate ? customer.lastPurchaseDate.toISOString().split('T')[0] : '',
      customer.customerSince.toISOString().split('T')[0],
      customer.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Obtener label del tipo de cliente
   */
  private getCustomerTypeLabel(type: CustomerType): string {
    const types = this.getCustomerTypes();
    return types.find(t => t.value === type)?.label || type;
  }

  /**
   * Obtener ID del negocio actual
   */
  private async getBusinessId(): Promise<string> {
    const isRoot = this.authService.isRoot();
    
    if (isRoot) {
      const businessId = this.rootBusinessSelector.getEffectiveBusinessId();
      if (!businessId) {
        throw new Error('No se encontró el ID del negocio');
      }
      return businessId;
    } else {
      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) {
        throw new Error('No se encontró el ID del negocio');
      }
      return businessId;
    }
  }
}