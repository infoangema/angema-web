import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { CreateOrderModalComponent } from './create-order/create-order.modal';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RootBusinessSelectorService } from '../../services/root-business-selector.service';

import {
  Order,
  OrderFilters,
  OrderStats,
  OrderStatus,
  OrderSource,
  OrderUtils,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_SOURCE_LABELS
} from '../../models/order.model';

@Component({
  selector: 'stockin-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StockinNavbarComponent, CreateOrderModalComponent],
  templateUrl: './orders.page.html'
})
export class StockinOrdersPage implements OnInit, OnDestroy {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
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

  // UI properties
  get isRoot(): boolean {
    return this.authService.isRoot();
  }

  get canManageOrders(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
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

  // Options for dropdowns
  orderStatuses = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'preparing', label: 'Preparando' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

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
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  async ngOnInit() {
    await this.loadOrders();
    await this.loadOrderStats();
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

    this.filteredOrders = filtered;
    this.currentPage = 1; // Reset to first page when filters change
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

  // Status and source label helpers
  getStatusLabel(status: OrderStatus): string {
    return OrderUtils.getStatusLabel(status);
  }

  getStatusClasses(status: OrderStatus): string {
    return OrderUtils.getStatusColor(status);
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
      this.notificationService.showError('Error al exportar órdenes');
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