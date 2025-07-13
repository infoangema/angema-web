import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { CustomersListComponent } from './customers-list/customers-list.component';
import { CreateCustomerModalComponent } from './create-customer/create-customer.modal';
import { CustomerSegmentsComponent } from './customer-segments/customer-segments.component';

@Component({
  selector: 'stockin-customers-page',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent, CustomersListComponent, CreateCustomerModalComponent, CustomerSegmentsComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p class="text-gray-600 dark:text-gray-400">Gestiona tu base de clientes, información de contacto y historial de compras</p>
        </div>
        
        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ease-in-out duration-150">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Nuevo Cliente
        </button>
      </div>

      <!-- Pestañas -->
      <div class="mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="-mb-px flex space-x-8">
            <button
              type="button"
              (click)="activeTab = 'list'"
              [class]="activeTab === 'list' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Lista de Clientes
            </button>
            <button
              type="button"
              (click)="activeTab = 'segments'"
              [class]="activeTab === 'segments' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'"
              class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
              Segmentación
            </button>
          </nav>
        </div>
      </div>

      <!-- Contenido según pestaña activa -->
      @if (activeTab === 'list') {
        <app-customers-list #customersList></app-customers-list>
      } @else if (activeTab === 'segments') {
        <app-customer-segments></app-customer-segments>
      }
    </div>

    <!-- Modal -->
    @if (showModal) {
      <app-create-customer-modal 
        (modalClose)="onModalClose()">
      </app-create-customer-modal>
    }
  `
})
export class StockinCustomersPage {
  @ViewChild('customersList') customersList!: CustomersListComponent;
  showModal = false;
  activeTab: 'list' | 'segments' = 'list';

  openCreateModal() {
    this.showModal = true;
  }

  onModalClose() {
    this.showModal = false;
    // Refresh the customers list after creating a customer
    if (this.customersList) {
      this.customersList.loadCustomers();
    }
  }
} 