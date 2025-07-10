import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Warehouse } from '../../models/warehouse.model';
import { WarehouseService } from '../../services/warehouse.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateWarehouseModal } from './create-warehouse/create-warehouse.modal';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';

@Component({
  selector: 'stockin-warehouses',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateWarehouseModal, StockinNavbarComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Almacenes</h1>
          <p class="text-gray-600 dark:text-gray-400">Gestiona los almacenes y ubicaciones de productos</p>
        </div>

        <!-- Actions Bar -->
        <div class="bg-white dark:bg-dark-800 p-6 rounded-lg shadow-sm mb-6">
          <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div class="flex-1 max-w-md">
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery"
                  (input)="filterWarehouses()"
                  placeholder="Buscar almacenes..."
                  class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md leading-5 bg-white dark:bg-dark-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
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

        <!-- Warehouses Table -->
        <div class="bg-white dark:bg-dark-800 rounded-lg shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
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
              <tbody>
                <tr *ngFor="let warehouse of filteredWarehouses" 
                    class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
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
                      <button 
                        *ngIf="warehouse.sectors && warehouse.sectors.length > 0"
                        (click)="toggleSectorDetails(warehouse.id)"
                        class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                      >
                        {{ showSectorDetails[warehouse.id] ? 'Ocultar' : 'Ver detalles' }}
                      </button>
                    </div>
                    <div *ngIf="showSectorDetails[warehouse.id] && warehouse.sectors" class="mt-2 text-xs">
                      <div *ngFor="let sector of warehouse.sectors" class="bg-gray-50 dark:bg-gray-700 p-2 rounded mb-1">
                        <strong>{{ sector.name }}:</strong>
                        <span class="ml-1 text-gray-600 dark:text-gray-300">
                          {{ sector.positions.join(', ') }}
                        </span>
                      </div>
                    </div>
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
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredWarehouses.length === 0" class="text-center py-12">
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

        <!-- Modal -->
        <app-create-warehouse-modal 
          *ngIf="showModal" 
          [warehouse]="selectedWarehouse"
          (modalClose)="onModalClose()"
        ></app-create-warehouse-modal>
        </div>
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