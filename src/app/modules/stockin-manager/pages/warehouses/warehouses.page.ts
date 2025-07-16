import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Warehouse } from '../../models/warehouse.model';
import { WarehouseService } from '../../services/warehouse.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateWarehouseModal } from './create-warehouse/create-warehouse.modal';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';

@Component({
  selector: 'stockin-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateWarehouseModal, StockinNavbarComponent, PageHeaderComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de Almacenes"
          subtitle="Organiza y gestiona los almacenes de tu negocio"
          [actions]="headerActions">
        </stockin-page-header>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Buscar</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="filterWarehouses()"
              placeholder="Buscar almacenes..."
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
          </div>
        </div>
      </div>

      <!-- Lista de almacenes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-6 py-3">
                    Nombre
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Código
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Dirección
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Responsable
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Sectores
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Estado
                  </th>
                  <th scope="col" class="px-6 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              @for (warehouse of filteredWarehouses; track warehouse.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {{ warehouse.name }}
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ warehouse.code }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    {{ warehouse.address || '-' }}
                  </td>
                  <td class="px-6 py-4">
                    {{ warehouse.manager || '-' }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <span class="text-sm text-gray-900 dark:text-white mr-2">
                        {{ getSectorCount(warehouse) }}
                      </span>
                      @if (warehouse.sectors && warehouse.sectors.length > 0) {
                        <button 
                          (click)="toggleSectorDetails(warehouse.id)"
                          class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                        >
                          {{ showSectorDetails[warehouse.id] ? 'Ocultar' : 'Ver detalles' }}
                        </button>
                      }
                    </div>
                    @if (showSectorDetails[warehouse.id] && warehouse.sectors) {
                      <div class="mt-2 text-xs">
                        @for (sector of warehouse.sectors; track sector.name) {
                          <div class="bg-gray-50 dark:bg-gray-700 p-2 rounded mb-1">
                            <strong>{{ sector.name }}:</strong>
                            <span class="ml-1 text-gray-600 dark:text-gray-300">
                              {{ sector.positions.join(', ') }}
                            </span>
                          </div>
                        }
                      </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="warehouse.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                      {{ warehouse.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button 
                        (click)="editWarehouse(warehouse)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button 
                        (click)="deleteWarehouse(warehouse)"
                        class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        @if (filteredWarehouses.length === 0) {
          <div class="text-center py-12">
            <div class="flex flex-col items-center">
              <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay almacenes</h3>
              <p class="text-gray-500 dark:text-gray-400 mb-4">Crea tu primer almacén para comenzar a organizar tu inventario.</p>
              <button 
                (click)="openCreateModal()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Nuevo Almacén
              </button>
            </div>
          </div>
        }

      <!-- Modal -->
      @if (showModal) {
        <app-create-warehouse-modal 
          [warehouse]="selectedWarehouse"
          (modalClose)="onModalClose()"
        ></app-create-warehouse-modal>
      }
      </main>
    </div>
  `,
  styleUrls: []
})
export class WarehousesPage implements OnInit {
  warehouses: Warehouse[] = [];
  filteredWarehouses: Warehouse[] = [];
  searchQuery: string = '';
  isRoot = false;
  showModal = false;
  selectedWarehouse?: Warehouse;
  showSectorDetails: { [key: string]: boolean } = {};

  headerActions: PageHeaderAction[] = [
    {
      label: 'Nuevo Almacén',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    }
  ];

  constructor(
    private warehouseService: WarehouseService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadWarehouses();
    this.checkUserRole();
  }

  private checkUserRole() {
    this.authService.currentUser$.subscribe(user => {
      this.isRoot = user?.roleId === 'root';
    });
  }

  async loadWarehouses() {
    try {
      this.warehouses = await this.warehouseService.getWarehouses();
      this.filteredWarehouses = [...this.warehouses];
    } catch (error) {
      this.notificationService.error('Error al cargar almacenes');
    }
  }

  filterWarehouses() {
    if (!this.searchQuery.trim()) {
      this.filteredWarehouses = [...this.warehouses];
      return;
    }

    this.filteredWarehouses = this.warehouses.filter(warehouse =>
      warehouse.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (warehouse.address && warehouse.address.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
      (warehouse.manager && warehouse.manager.toLowerCase().includes(this.searchQuery.toLowerCase()))
    );
  }

  getSectorCount(warehouse: Warehouse): string {
    if (!warehouse.sectors || warehouse.sectors.length === 0) {
      return '0 sectores';
    }
    const count = warehouse.sectors.length;
    return `${count} sector${count !== 1 ? 'es' : ''}`;
  }

  toggleSectorDetails(warehouseId: string) {
    this.showSectorDetails[warehouseId] = !this.showSectorDetails[warehouseId];
  }

  openCreateModal() {
    this.selectedWarehouse = undefined;
    this.showModal = true;
  }

  editWarehouse(warehouse: Warehouse) {
    this.selectedWarehouse = warehouse;
    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
    this.selectedWarehouse = undefined;
    this.loadWarehouses();
  }

  async deleteWarehouse(warehouse: Warehouse) {
    if (confirm(`¿Estás seguro de que deseas eliminar el almacén "${warehouse.name}"?`)) {
      try {
        await this.warehouseService.deleteWarehouse(warehouse.id);
        this.notificationService.success('Almacén eliminado correctamente');
        await this.loadWarehouses();
      } catch (error) {
        this.notificationService.error('Error al eliminar almacén');
      }
    }
  }
}