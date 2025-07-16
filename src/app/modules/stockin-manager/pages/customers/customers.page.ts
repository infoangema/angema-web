import { Component, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';
import { CustomersListComponent } from './customers-list/customers-list.component';
import { CreateCustomerModalComponent } from './create-customer/create-customer.modal';
import { CustomerSegmentsComponent } from './customer-segments/customer-segments.component';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'stockin-customers-page',
  standalone: true,
  imports: [CommonModule, StockinNavbarComponent, PageHeaderComponent, CustomersListComponent, CreateCustomerModalComponent, CustomerSegmentsComponent],
  template: `
    <stockin-navbar></stockin-navbar>
    
    <div class="min-h-screen bg-gray-100">
      <main class="container mx-auto px-4 py-6">
        <stockin-page-header 
          title="Gestión de Clientes"
          subtitle="Administra tu base de clientes y gestiona la información de contacto"
          [actions]="headerActions">
        </stockin-page-header>

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
      </main>
    </div>
    <!-- Modal -->
    @if (showModal) {
      <app-create-customer-modal
        (modalClose)="onModalClose()">
      </app-create-customer-modal>
    }

    <!-- Modal Container for Dynamic Modals -->
    <div #modalContainer></div>
  `
})
export class StockinCustomersPage implements AfterViewInit {
  @ViewChild('customersList') customersList!: CustomersListComponent;
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;
  showModal = false;
  activeTab: 'list' | 'segments' = 'list';

  headerActions: PageHeaderAction[] = [
    {
      label: 'Nuevo Cliente',
      icon: PageHeaderIcons.add,
      color: 'blue',
      action: () => this.openCreateModal()
    },
    {
      label: 'Exportar CSV',
      icon: PageHeaderIcons.export,
      color: 'green',
      action: () => this.exportToCSV()
    }
  ];

  constructor(private modalService: ModalService) {}

  ngAfterViewInit() {
    this.modalService.setModalContainer(this.modalContainer);
  }

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

  exportToCSV() {
    // TODO: Implement CSV export functionality
    console.log('Export to CSV functionality to be implemented');
  }
}
