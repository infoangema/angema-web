import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { Customer, CustomerFilters, CustomerType } from '../../../models/customer.model';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { RootBusinessSelectorService } from '../../../services/root-business-selector.service';
import { EditCustomerModalComponent } from '../edit-customer/edit-customer.modal';
import { CustomerHistoryComponent } from '../customer-history/customer-history.component';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, EditCustomerModalComponent, CustomerHistoryComponent],
  templateUrl: './customers-list.component.html'
})
export class CustomersListComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  
  // Edit modal state
  selectedCustomer: Customer | null = null;
  isEditModalVisible = false;
  
  // History modal state
  selectedCustomerForHistory: Customer | null = null;
  isHistoryModalVisible = false;
  
  // Propiedades para control de visibilidad
  get isRoot(): boolean {
    return this.authService.isRoot();
  }
  
  get canManageCustomer(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }
  
  // Filtros
  filters: CustomerFilters = {
    search: '',
    type: '',
    active: '',
    city: null
  };

  // Paginación
  currentPage = 1;
  pageSize = 10;
  
  get totalPages(): number {
    return Math.ceil(this.filteredCustomers.length / this.pageSize);
  }
  
  get paginatedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCustomers.slice(start, end);
  }

  private destroy$ = new Subject<void>();
  loading = false;

  customerTypes: { value: string; label: string }[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Empresa' },
    { value: 'wholesale', label: 'Mayorista' },
    { value: 'vip', label: 'VIP' }
  ];

  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' }
  ];

  constructor(
    private customerService: CustomerService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.watchCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.notificationService.showError('Error al cargar clientes');
          this.loading = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(customer => {
      // Filtro de búsqueda
      if (this.filters.search.trim()) {
        const searchTerm = this.filters.search.toLowerCase();
        const matchesSearch = 
          customer.firstName.toLowerCase().includes(searchTerm) ||
          customer.lastName.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.code.toLowerCase().includes(searchTerm) ||
          (customer.phone && customer.phone.includes(searchTerm)) ||
          (customer.documentNumber && customer.documentNumber.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Filtro por tipo
      if (this.filters.type && this.filters.type !== '' && customer.customerType !== this.filters.type) {
        return false;
      }

      // Filtro por estado activo - manejar tanto string como boolean
      if (this.filters.active !== null && this.filters.active !== '') {
        const activeValue = this.filters.active === 'true' ? true : this.filters.active === 'false' ? false : this.filters.active;
        if (customer.isActive !== activeValue) {
          return false;
        }
      }

      // Filtro por ciudad
      if (this.filters.city && (!customer.city || !customer.city.toLowerCase().includes(this.filters.city.toLowerCase()))) {
        return false;
      }

      return true;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      type: '',
      active: '',
      city: null
    };
    this.applyFilters();
  }

  // Paginación
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Acciones de cliente
  editCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
    this.isEditModalVisible = true;
  }

  viewCustomerHistory(customer: Customer): void {
    this.selectedCustomerForHistory = customer;
    this.isHistoryModalVisible = true;
  }

  async toggleCustomerStatus(customer: Customer): Promise<void> {
    try {
      await this.customerService.updateCustomer(customer.id, { 
        isActive: !customer.isActive 
      });
      this.notificationService.showSuccess(
        `Cliente ${customer.isActive ? 'desactivado' : 'activado'} correctamente`
      );
    } catch (error) {
      console.error('Error updating customer status:', error);
      this.notificationService.showError('Error al actualizar el estado del cliente');
    }
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    if (confirm(`¿Estás seguro de que quieres eliminar al cliente ${customer.firstName} ${customer.lastName}?`)) {
      try {
        await this.customerService.deleteCustomer(customer.id);
        this.notificationService.showSuccess('Cliente eliminado correctamente');
      } catch (error) {
        console.error('Error deleting customer:', error);
        this.notificationService.showError('Error al eliminar el cliente');
      }
    }
  }

  onEditModalClose(): void {
    this.isEditModalVisible = false;
    this.selectedCustomer = null;
  }

  onHistoryModalClose(): void {
    this.isHistoryModalVisible = false;
    this.selectedCustomerForHistory = null;
  }

  // Utilidades
  getCustomerTypeLabel(type: CustomerType): string {
    const typeOption = this.customerTypes.find(t => t.value === type);
    return typeOption?.label || type;
  }

  getCustomerTypeClasses(type: CustomerType): string {
    const baseClasses = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
    
    switch (type) {
      case 'individual':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case 'business':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200`;
      case 'wholesale':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200`;
      case 'vip':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  getCustomerFullName(customer: Customer): string {
    return `${customer.firstName} ${customer.lastName}`;
  }

  getCustomerDisplayAddress(customer: Customer): string {
    const parts = [];
    if (customer.address) parts.push(customer.address);
    if (customer.city) parts.push(customer.city);
    if (customer.state) parts.push(customer.state);
    return parts.join(', ') || 'No especificada';
  }

  async exportCustomers(): Promise<void> {
    try {
      const csvContent = await this.customerService.exportCustomersToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.notificationService.showSuccess('Clientes exportados correctamente');
    } catch (error) {
      console.error('Error exporting customers:', error);
      this.notificationService.showError('Error al exportar clientes');
    }
  }

  // Métodos para cálculos en el template
  getActiveCustomersCount(): number {
    return this.customers.filter(c => c.isActive).length;
  }

  getVipCustomersCount(): number {
    return this.customers.filter(c => c.customerType === 'vip').length;
  }

  // Helper para Math en el template
  get Math() {
    return Math;
  }

  // Helper para generar números de página
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}