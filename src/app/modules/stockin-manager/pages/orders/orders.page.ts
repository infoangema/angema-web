import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';
import { CreateOrderModalComponent } from './create-order/create-order.modal';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RootBusinessSelectorService } from '../../services/root-business-selector.service';
import { ModalService } from '../../services/modal.service';
import { CacheService } from '../../../../core/services/cache.service';
import { CacheInvalidationService } from '../../../../core/services/cache-invalidation.service';
import { OrderStatesService } from '../../services/order-states.service';

import {
  Order,
  OrderFilters,
  OrderStats,
  OrderStatus,
  OrderSource,
  OrderUtils,
  SortField,
  SortDirection,
  BusinessPlan
} from '../../models/order.model';

@Component({
  selector: 'stockin-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StockinNavbarComponent, PageHeaderComponent, CreateOrderModalComponent],
  templateUrl: './orders.page.html'
})
export class StockinOrdersPage implements OnInit, OnDestroy, AfterViewInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedOrders: Set<string> = new Set();
  
  // Sorting
  sortField: SortField = 'createdAt';
  sortDirection: SortDirection = 'desc';
  
  // Modal container for dynamic modals
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;
  orderStats: OrderStats = {
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersByStatus: {
      pending: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    }
  };

  // Modal states
  selectedOrder: Order | null = null;
  isCreateModalVisible = false;
  isEditModalVisible = false;
  isViewModalVisible = false;
  isStatusChangeModalVisible = false;
  isBulkStatusChangeModalVisible = false;
  
  // Status change modal data
  statusChangeData: {
    order: Order;
    newStatus: OrderStatus | string;
    reason: string;
  } | null = null;
  
  // Bulk status change data
  bulkStatusChangeData: {
    selectedOrders: Order[];
    newStatus: OrderStatus | string;
    reason: string;
  } | null = null;

  // UI properties
  get isRoot(): boolean {
    return this.authService.isRoot();
  }

  get canManageOrders(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }
  
  // Page header actions
  get headerActions(): PageHeaderAction[] {
    return [
      {
        label: 'Nueva Orden',
        icon: PageHeaderIcons.add,
        color: 'blue',
        action: () => this.openCreateOrderModal(),
        condition: this.canManageOrders
      },
      {
        label: 'Exportar CSV',
        icon: PageHeaderIcons.export,
        color: 'green',
        action: () => this.exportOrders()
      },
      {
        label: 'Actualizar',
        icon: PageHeaderIcons.refresh,
        color: 'gray',
        action: () => this.forceReloadOrders()
      }
    ];
  }

  // Filters
  filters: OrderFilters = {
    search: '',
    status: '',
    customer: null,
    dateFrom: null,
    dateTo: null,
    amountFrom: null,
    amountTo: null,
    source: ''
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get paginatedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredOrders.slice(start, end);
  }

  // Business plan configuration - TODO: Get from business service
  currentBusinessPlan: BusinessPlan = 'premium'; // Default to premium for now
  
  // Options for dropdowns - dynamically generated based on plan
  get orderStatuses() {
    return this.orderStatesService.getStatusOptions(this.currentBusinessPlan);
  }
  
  // Bulk actions available statuses - dynamically generated based on plan
  get bulkActionStatuses() {
    return this.orderStatesService.getBulkActionStatuses(this.currentBusinessPlan);
  }

  orderSources = [
    { value: 'manual', label: 'Manual' },
    { value: 'mercadolibre', label: 'MercadoLibre' },
    { value: 'tiendanube', label: 'TiendaNube' },
    { value: 'website', label: 'Sitio Web' }
  ];

  private destroy$ = new Subject<void>();
  loading = false;

  // Expose Math for template
  Math = Math;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private rootBusinessSelector: RootBusinessSelectorService,
    private modalService: ModalService,
    private cacheService: CacheService,
    private cacheInvalidationService: CacheInvalidationService,
    private orderStatesService: OrderStatesService
  ) {}

  async ngOnInit() {
    await this.loadOrderStatesConfig();
    await this.loadOrders();
    await this.loadOrderStats();
  }
  
  /**
   * Cargar configuración de estados desde archivo JSON
   */
  private async loadOrderStatesConfig() {
    try {
      await this.orderStatesService.loadStatesConfig();
      console.log('Order states configuration loaded from JSON file');
    } catch (error) {
      console.error('Error loading order states configuration:', error);
      this.notificationService.showError('Error al cargar configuración de estados');
    }
  }
  
  ngAfterViewInit() {
    if (this.modalContainer) {
      this.modalService.setModalContainer(this.modalContainer);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadOrders() {
    this.loading = true;
    try {
      this.orderService.watchOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders) => {
            this.orders = orders;
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading orders:', error);
            this.notificationService.showError('Error al cargar las órdenes');
            this.loading = false;
          }
        });
    } catch (error) {
      console.error('Error setting up orders watcher:', error);
      this.loading = false;
    }
  }

  async forceReloadOrders() {
    this.loading = true;
    try {
      const orders = await this.orderService.forceReloadOrders();
      this.orders = orders;
      this.applyFilters();
      this.notificationService.showSuccess('Órdenes actualizadas');
    } catch (error) {
      console.error('Error force reloading orders:', error);
      this.notificationService.showError('Error al actualizar órdenes');
    } finally {
      this.loading = false;
    }
  }

  async loadOrderStats() {
    try {
      const businessId = this.isRoot
        ? this.rootBusinessSelector.getEffectiveBusinessId()
        : await this.orderService['businessService'].getCurrentBusinessId();

      if (businessId) {
        this.orderStats = await this.orderService.getOrderStats(businessId);
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
    }
  }

  applyFilters() {
    let filtered = [...this.orders];
    
    // Clear selection when filters change
    this.selectedOrders.clear();

    // Search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.email.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.productName.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (this.filters.status && this.filters.status !== '') {
      filtered = filtered.filter(order => order.status === this.filters.status);
    }

    // Source filter
    if (this.filters.source && this.filters.source !== '') {
      filtered = filtered.filter(order => order.source === this.filters.source);
    }

    // Date filters
    if (this.filters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(this.filters.dateFrom!)
      );
    }

    if (this.filters.dateTo) {
      const dateTo = new Date(this.filters.dateTo!);
      dateTo.setHours(23, 59, 59, 999); // Include full day
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= dateTo
      );
    }

    // Amount filters
    if (this.filters.amountFrom !== null) {
      filtered = filtered.filter(order => order.total >= this.filters.amountFrom!);
    }

    if (this.filters.amountTo !== null) {
      filtered = filtered.filter(order => order.total <= this.filters.amountTo!);
    }

    // Customer filter
    if (this.filters.customer) {
      filtered = filtered.filter(order => order.customer.id === this.filters.customer);
    }

    // Apply sorting
    filtered = this.applySorting(filtered);
    
    this.filteredOrders = filtered;
    this.currentPage = 1; // Reset to first page when filters change
  }
  
  applySorting(orders: Order[]): Order[] {
    return orders.sort((a: Order, b: Order) => {
      let aValue: any, bValue: any;
      
      switch (this.sortField) {
        case 'orderNumber':
          aValue = a.orderNumber;
          bValue = b.orderNumber;
          break;
        case 'customer.name':
          aValue = a.customer.name;
          bValue = b.customer.name;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (this.sortDirection === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
  }

  clearFilters() {
    this.filters = {
      search: '',
      status: '',
      customer: null,
      dateFrom: null,
      dateTo: null,
      amountFrom: null,
      amountTo: null,
      source: ''
    };
    this.selectedOrders.clear();
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.status ||
      this.filters.source ||
      this.filters.dateFrom ||
      this.filters.dateTo ||
      this.filters.amountFrom !== null ||
      this.filters.amountTo !== null ||
      this.filters.customer
    );
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Sorting methods
  sortBy(field: SortField) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }
  
  getSortIcon(field: SortField): string {
    if (this.sortField !== field) {
      return 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'; // Sort icon
    }
    
    if (this.sortDirection === 'asc') {
      return 'M3 4l9 16 9-16H3z'; // Sort up
    } else {
      return 'M21 4L12 20 3 4h18z'; // Sort down
    }
  }
  
  // Selection methods
  toggleSelectAll() {
    if (this.selectedOrders.size === this.paginatedOrders.length) {
      this.selectedOrders.clear();
    } else {
      this.selectedOrders.clear();
      this.paginatedOrders.forEach(order => this.selectedOrders.add(order.id));
    }
  }
  
  toggleSelectOrder(orderId: string) {
    if (this.selectedOrders.has(orderId)) {
      this.selectedOrders.delete(orderId);
    } else {
      this.selectedOrders.add(orderId);
    }
  }
  
  isOrderSelected(orderId: string): boolean {
    return this.selectedOrders.has(orderId);
  }
  
  isAllSelected(): boolean {
    return this.paginatedOrders.length > 0 && this.selectedOrders.size === this.paginatedOrders.length;
  }
  
  isIndeterminate(): boolean {
    return this.selectedOrders.size > 0 && this.selectedOrders.size < this.paginatedOrders.length;
  }
  
  getSelectedOrdersData(): Order[] {
    return this.orders.filter(order => this.selectedOrders.has(order.id));
  }
  
  // Status change methods
  getAvailableStatusTransitions(currentStatus: OrderStatus | string): string[] {
    return this.orderStatesService.getValidTransitions(currentStatus);
  }
  
  canChangeStatus(order: Order, newStatus: OrderStatus | string): boolean {
    if (!this.canManageOrders) return false;
    if (order.status === newStatus) return false;
    return this.getAvailableStatusTransitions(order.status).includes(newStatus);
  }
  
  onStatusChange(order: Order, newStatus: OrderStatus | string) {
    if (!this.canChangeStatus(order, newStatus)) {
      this.notificationService.error('No se puede cambiar al estado seleccionado');
      return;
    }
    
    this.statusChangeData = {
      order,
      newStatus,
      reason: ''
    };
    this.isStatusChangeModalVisible = true;
  }
  
  async confirmStatusChange() {
    if (!this.statusChangeData) return;
    
    try {
      const result = await this.orderService.updateOrder(this.statusChangeData.order.id, {
        status: this.statusChangeData.newStatus,
        statusReason: this.statusChangeData.reason || undefined
      });
      
      if (result.success) {
        this.notificationService.success('Estado actualizado correctamente');
        this.closeStatusChangeModal();
      } else {
        this.notificationService.error(result.errors?.join(', ') || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      this.notificationService.error('Error al actualizar estado');
    }
  }
  
  closeStatusChangeModal() {
    this.isStatusChangeModalVisible = false;
    this.statusChangeData = null;
  }
  
  // Bulk status change methods
  openBulkStatusChangeModal(newStatus: OrderStatus | string) {
    const selectedOrdersData = this.getSelectedOrdersData();
    
    if (selectedOrdersData.length === 0) {
      this.notificationService.warning('Selecciona al menos una orden');
      return;
    }
    
    // Validar que todas las órdenes seleccionadas puedan cambiar al nuevo estado
    const invalidOrders = selectedOrdersData.filter(order => !this.canChangeStatus(order, newStatus));
    
    if (invalidOrders.length > 0) {
      this.notificationService.error(`${invalidOrders.length} orden(es) no pueden cambiar al estado ${this.getStatusLabel(newStatus)}`);
      return;
    }
    
    this.bulkStatusChangeData = {
      selectedOrders: selectedOrdersData,
      newStatus,
      reason: ''
    };
    this.isBulkStatusChangeModalVisible = true;
  }
  
  async confirmBulkStatusChange() {
    if (!this.bulkStatusChangeData) return;
    
    try {
      const promises = this.bulkStatusChangeData.selectedOrders.map(order =>
        this.orderService.updateOrder(order.id, {
          status: this.bulkStatusChangeData!.newStatus,
          statusReason: this.bulkStatusChangeData!.reason || undefined
        })
      );
      
      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      if (failed === 0) {
        this.notificationService.success(`${successful} orden(es) actualizadas correctamente`);
      } else {
        this.notificationService.warning(`${successful} orden(es) actualizadas, ${failed} fallaron`);
      }
      
      this.selectedOrders.clear();
      this.closeBulkStatusChangeModal();
    } catch (error) {
      console.error('Error bulk updating order status:', error);
      this.notificationService.error('Error al actualizar órdenes');
    }
  }
  
  closeBulkStatusChangeModal() {
    this.isBulkStatusChangeModalVisible = false;
    this.bulkStatusChangeData = null;
  }
  
  // Status and source label helpers
  getStatusLabel(status: OrderStatus | string): string {
    return this.orderStatesService.getStatusLabel(status);
  }

  getStatusClasses(status: OrderStatus | string): string {
    return this.orderStatesService.getStatusClasses(status);
  }
  
  private isKnownOrderStatus(status: string): status is OrderStatus {
    return ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'].includes(status);
  }

  getSourceLabel(source: OrderSource): string {
    return OrderUtils.getSourceLabel(source);
  }

  // Modal actions
  openCreateOrderModal() {
    this.isCreateModalVisible = true;
  }

  viewOrder(order: Order) {
    this.selectedOrder = order;
    this.isViewModalVisible = true;
  }

  editOrder(order: Order) {
    this.selectedOrder = order;
    this.isEditModalVisible = true;
  }

  closeModals() {
    this.isCreateModalVisible = false;
    this.isEditModalVisible = false;
    this.isViewModalVisible = false;
    this.selectedOrder = null;
  }

  // Export functionality
  async exportOrders() {
    try {
      const ordersToExport = this.filteredOrders;
      if (ordersToExport.length === 0) {
        this.notificationService.warning('No hay órdenes para exportar');
        return;
      }

      // Create CSV content
      const headers = ['Número', 'Cliente', 'Email', 'Estado', 'Total', 'Fecha', 'Origen', 'Items'];
      const csvContent = [
        headers.join(','),
        ...ordersToExport.map(order => [
          order.orderNumber,
          `"${order.customer.name}"`,
          order.customer.email,
          this.getStatusLabel(order.status),
          order.total,
          new Date(order.createdAt).toLocaleDateString('es-AR'),
          this.getSourceLabel(order.source),
          order.items.length
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `ordenes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.notificationService.showSuccess('Órdenes exportadas correctamente');
    } catch (error) {
      console.error('Error exporting orders:', error);
      this.notificationService.error('Error al exportar órdenes');
    }
  }

  // Event handlers for modal callbacks
  onOrderCreated() {
    this.closeModals();
    this.loadOrderStats(); // Recargar estadísticas
    
    // Forzar recarga como respaldo en caso de que el tiempo real no funcione
    setTimeout(() => {
      this.forceReloadOrders();
    }, 1000);
    
    this.notificationService.showSuccess('Orden creada correctamente');
  }

  onOrderUpdated() {
    this.closeModals();
    this.loadOrderStats(); // Solo recargar estadísticas, las órdenes se actualizan automáticamente
    this.notificationService.showSuccess('Orden actualizada correctamente');
  }

  onModalClosed() {
    this.closeModals();
  }
} 