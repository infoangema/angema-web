import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Customer, CustomerSegment, CustomerType } from '../../../models/customer.model';
import { CustomerService } from '../../../services/customer.service';

@Component({
  selector: 'app-customer-segments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Segmentación de Clientes
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Analiza y segmenta tu base de clientes según diferentes criterios
        </p>
      </div>

      <div class="p-6">
        <!-- Segmentos predefinidos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          @for (segment of predefinedSegments; track segment.id) {
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ segment.name }}</h4>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                  {{ getSegmentCount(segment) }}
                </span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">{{ segment.description }}</p>
              <button
                type="button"
                (click)="viewSegment(segment)"
                class="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                Ver clientes
              </button>
            </div>
          }
        </div>

        <!-- Análisis por tipo de cliente -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Distribución por Tipo</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            @for (type of customerTypes; track type.value) {
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ getCustomersByType(type.value).length }}
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ type.label }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ getPercentage(getCustomersByType(type.value).length) }}%
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Análisis de valor -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">Análisis de Valor</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4">
              <div class="text-lg font-bold text-green-800 dark:text-green-200">
                {{ getHighValueCustomers().length }}
              </div>
              <div class="text-sm text-green-700 dark:text-green-300">Clientes de Alto Valor</div>
              <div class="text-xs text-green-600 dark:text-green-400">
                >$1,000 en compras
              </div>
            </div>
            
            <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
              <div class="text-lg font-bold text-yellow-800 dark:text-yellow-200">
                {{ getMediumValueCustomers().length }}
              </div>
              <div class="text-sm text-yellow-700 dark:text-yellow-300">Clientes de Valor Medio</div>
              <div class="text-xs text-yellow-600 dark:text-yellow-400">
                $200 - $1,000 en compras
              </div>
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="text-lg font-bold text-gray-800 dark:text-gray-200">
                {{ getLowValueCustomers().length }}
              </div>
              <div class="text-sm text-gray-700 dark:text-gray-300">Clientes Nuevos/Baja Actividad</div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                <$200 en compras
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para mostrar clientes del segmento -->
    @if (selectedSegment && showSegmentModal) {
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"></div>
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
            <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
              <button type="button"
                      (click)="closeSegmentModal()"
                      class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span class="sr-only">Cerrar</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {{ selectedSegment.name }} ({{ selectedSegmentCustomers.length }} clientes)
              </h3>
              
              <div class="max-h-96 overflow-y-auto">
                <div class="space-y-2">
                  @for (customer of selectedSegmentCustomers; track customer.id) {
                    <div class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ customer.firstName }} {{ customer.lastName }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ customer.email }} | {{ customer.code }}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ customer.totalPurchases | currency }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          {{ customer.loyaltyPoints }} puntos
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay clientes en este segmento
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class CustomerSegmentsComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  selectedSegment: CustomerSegment | null = null;
  selectedSegmentCustomers: Customer[] = [];
  showSegmentModal = false;

  private destroy$ = new Subject<void>();

  customerTypes: { value: CustomerType; label: string }[] = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Empresa' },
    { value: 'wholesale', label: 'Mayorista' },
    { value: 'vip', label: 'VIP' }
  ];

  predefinedSegments: CustomerSegment[] = [
    {
      id: 'high-value',
      name: 'Alto Valor',
      description: 'Clientes con más de $1,000 en compras',
      criteria: { minTotalSpent: 1000 },
      customerCount: 0
    },
    {
      id: 'vip-customers',
      name: 'Clientes VIP',
      description: 'Clientes con tipo VIP',
      criteria: { customerType: ['vip'] },
      customerCount: 0
    },
    {
      id: 'inactive',
      name: 'Inactivos',
      description: 'Clientes sin compras en los últimos 90 días',
      criteria: { lastPurchaseDays: 90 },
      customerCount: 0
    },
    {
      id: 'new-customers',
      name: 'Clientes Nuevos',
      description: 'Clientes con menos de $200 en compras',
      criteria: { maxTotalSpent: 200 },
      customerCount: 0
    },
    {
      id: 'loyal-customers',
      name: 'Clientes Leales',
      description: 'Clientes con más de 500 puntos de fidelidad',
      criteria: { minTotalSpent: 500 },
      customerCount: 0
    },
    {
      id: 'business-customers',
      name: 'Clientes Empresariales',
      description: 'Clientes tipo empresa y mayorista',
      criteria: { customerType: ['business', 'wholesale'] },
      customerCount: 0
    }
  ];

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCustomers() {
    this.customerService.watchCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(customers => {
        this.customers = customers;
        this.updateSegmentCounts();
      });
  }

  private updateSegmentCounts() {
    this.predefinedSegments.forEach(segment => {
      segment.customerCount = this.getSegmentCount(segment);
    });
  }

  getSegmentCount(segment: CustomerSegment): number {
    return this.getCustomersForSegment(segment).length;
  }

  private getCustomersForSegment(segment: CustomerSegment): Customer[] {
    return this.customers.filter(customer => {
      const criteria = segment.criteria;

      // Filtro por gasto mínimo
      if (criteria.minTotalSpent && customer.totalPurchases < criteria.minTotalSpent) {
        return false;
      }

      // Filtro por gasto máximo
      if (criteria.maxTotalSpent && customer.totalPurchases > criteria.maxTotalSpent) {
        return false;
      }

      // Filtro por tipo de cliente
      if (criteria.customerType && !criteria.customerType.includes(customer.customerType)) {
        return false;
      }

      // Filtro por días desde última compra
      if (criteria.lastPurchaseDays && customer.lastPurchaseDate) {
        const daysSinceLastPurchase = Math.floor(
          (new Date().getTime() - new Date(customer.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastPurchase < criteria.lastPurchaseDays) {
          return false;
        }
      }

      return true;
    });
  }

  viewSegment(segment: CustomerSegment) {
    this.selectedSegment = segment;
    this.selectedSegmentCustomers = this.getCustomersForSegment(segment);
    this.showSegmentModal = true;
  }

  closeSegmentModal() {
    this.showSegmentModal = false;
    this.selectedSegment = null;
    this.selectedSegmentCustomers = [];
  }

  getCustomersByType(type: CustomerType): Customer[] {
    return this.customers.filter(customer => customer.customerType === type);
  }

  getPercentage(count: number): number {
    if (this.customers.length === 0) return 0;
    return Math.round((count / this.customers.length) * 100);
  }

  getHighValueCustomers(): Customer[] {
    return this.customers.filter(customer => customer.totalPurchases > 1000);
  }

  getMediumValueCustomers(): Customer[] {
    return this.customers.filter(customer => 
      customer.totalPurchases >= 200 && customer.totalPurchases <= 1000
    );
  }

  getLowValueCustomers(): Customer[] {
    return this.customers.filter(customer => customer.totalPurchases < 200);
  }
}