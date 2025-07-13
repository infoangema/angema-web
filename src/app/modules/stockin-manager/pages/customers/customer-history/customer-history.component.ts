import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Customer, CustomerPurchaseHistory } from '../../../models/customer.model';
import { LoyaltyPointsComponent } from '../loyalty-points/loyalty-points.component';

@Component({
  selector: 'app-customer-history',
  standalone: true,
  imports: [CommonModule, LoyaltyPointsComponent],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Historial de Compras -->
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Historial de Compras - {{ customer.firstName }} {{ customer.lastName }}
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Total gastado: <span class="font-semibold">{{ customer.totalPurchases | currency }}</span> |
          Puntos de fidelidad: <span class="font-semibold">{{ customer.loyaltyPoints | number }}</span>
        </p>
      </div>

      <div class="p-6">
        @if (purchaseHistory.length === 0) {
          <div class="text-center py-8">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sin historial de compras</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Este cliente aún no ha realizado ninguna compra.
            </p>
            <div class="mt-4">
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Nueva Orden
              </button>
            </div>
          </div>
        } @else {
          <!-- Lista de compras -->
          <div class="space-y-4">
            @for (purchase of purchaseHistory; track purchase.orderNumber) {
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                      Orden #{{ purchase.orderNumber }}
                    </h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ purchase.orderDate | date:'short' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ purchase.totalAmount | currency }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      +{{ purchase.pointsEarned }} puntos
                    </div>
                  </div>
                </div>
                <div class="mt-2">
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                    [class]="getStatusClass(purchase.status)">
                    {{ getStatusLabel(purchase.status) }}
                  </span>
                </div>
              </div>
            }
          </div>

          <!-- Paginación simple -->
          @if (purchaseHistory.length >= 10) {
            <div class="mt-6 flex justify-center">
              <button
                type="button"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                Ver más
              </button>
            </div>
          }
        }
        </div>
      </div>
      </div>

      <!-- Panel de Puntos de Fidelidad -->
      <div class="lg:col-span-1">
        <app-loyalty-points 
          [customer]="customer"
          (pointsUpdated)="onPointsUpdated()">
        </app-loyalty-points>
      </div>
    </div>
  `
})
export class CustomerHistoryComponent implements OnInit {
  @Input() customer!: Customer;
  
  purchaseHistory: CustomerPurchaseHistory[] = [];

  ngOnInit() {
    this.loadPurchaseHistory();
  }

  onPointsUpdated() {
    // En el futuro, aquí se puede recargar información si es necesario
    // Por ahora, no es necesario hacer nada específico
  }

  private loadPurchaseHistory() {
    // Placeholder: En el futuro, esto cargará desde el servicio de órdenes
    // Por ahora, creamos datos de ejemplo si el cliente tiene compras
    if (this.customer.totalPurchases > 0) {
      this.purchaseHistory = this.generateMockHistory();
    }
  }

  private generateMockHistory(): CustomerPurchaseHistory[] {
    // Datos de ejemplo - en producción esto vendrá del servicio de órdenes
    const mockHistory: CustomerPurchaseHistory[] = [];
    const orderCount = Math.min(Math.floor(this.customer.totalPurchases / 100), 5);
    
    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - (i * 15));
      
      mockHistory.push({
        customerId: this.customer.id,
        orderNumber: `ORD${(1000 + i).toString()}`,
        orderDate: orderDate,
        totalAmount: Math.floor(Math.random() * 500) + 50,
        status: i === 0 ? 'completed' : 'completed',
        pointsEarned: Math.floor(Math.random() * 50) + 10
      });
    }
    
    return mockHistory;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  }
}