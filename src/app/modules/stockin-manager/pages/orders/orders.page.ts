import { Component, OnInit, OnDestroy, ViewChild, ViewContainerRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArgentineCurrencyPipe } from '../../../../shared/pipes/argentine-currency.pipe';
import { Subject, takeUntil } from 'rxjs';

import { StockinNavbarComponent } from '../../components/shared/navbar.component';
import { PageHeaderComponent, PageHeaderAction } from '../../components/shared/page-header.component';
import { PageHeaderIcons } from '../../components/shared/page-header-icons';
import { CreateOrderModalComponent } from './create-order/create-order.modal';
import { BusinessSelectorModalComponent } from '../../components/business-selector-modal/business-selector-modal.component';
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
  BusinessPlan,
  PlanBasedOrderStatus,
  BUSINESS_PLAN_STATUSES,
  PLAN_BASED_STATUS_LABELS,
  PLAN_BASED_STATUS_COLORS
} from '../../models/order.model';

@Component({
  selector: 'stockin-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, StockinNavbarComponent, PageHeaderComponent, CreateOrderModalComponent, BusinessSelectorModalComponent, ArgentineCurrencyPipe],
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
  showBusinessSelector = false;
  
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
  pageSize = 20;

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
  
  // Stats Cards carousel control
  currentCarouselIndex = 0;
  cardsPerView = 5; // Desktop default
  
  // Options for dropdowns - dynamically generated based on plan
  get orderStatuses() {
    return this.orderStatesService.getStatusOptions(this.currentBusinessPlan);
  }
  
  // Bulk actions available statuses - dynamically generated based on plan
  get bulkActionStatuses() {
    return this.orderStatesService.getBulkActionStatuses(this.currentBusinessPlan);
  }

  // Get all status cards data for carousel (including total card)
  get statusCardsData() {
    const statuses = BUSINESS_PLAN_STATUSES[this.currentBusinessPlan];
    
    // Create total orders card first
    const totalCard = {
      status: 'total' as const,
      label: 'Total de Órdenes',
      color: 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-800 border-blue-200',
      count: this.orders?.length || 0,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', // Document icon
      isTotal: true
    };
    
    // Create status cards
    const statusCards = statuses.map(status => ({
      status,
      label: PLAN_BASED_STATUS_LABELS[status],
      color: PLAN_BASED_STATUS_COLORS[status],
      count: this.getStatusCount(status),
      icon: this.getStatusIcon(status),
      isTotal: false
    }));
    
    // Return total card first, then status cards
    return [totalCard, ...statusCards];
  }

  // Get visible cards for current carousel view
  get visibleStatusCards() {
    const start = this.currentCarouselIndex;
    const end = start + this.cardsPerView;
    return this.statusCardsData.slice(start, end);
  }

  // Check if can navigate left
  get canNavigateLeft(): boolean {
    return this.currentCarouselIndex > 0;
  }

  // Check if can navigate right  
  get canNavigateRight(): boolean {
    return this.currentCarouselIndex + this.cardsPerView < this.statusCardsData.length;
  }

  // Get current carousel page for indicators
  get currentCarouselPage(): number {
    return Math.floor(this.currentCarouselIndex / this.cardsPerView);
  }

  // Get carousel indicators array
  get carouselIndicators(): number[] {
    const totalPages = Math.ceil(this.statusCardsData.length / this.cardsPerView);
    return Array.from({ length: totalPages }, (_, i) => i);
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
    // Verificar selección de negocio para usuarios root
    if (this.isRoot) {
      this.checkBusinessSelection();
    }
    // Inicializar stats con valores por defecto
    this.initializeDefaultStats();
    console.log('📊 Stats inicializadas con valores por defecto:', this.orderStats);
    await this.loadOrders();
    this.updateCarouselCardsPerView();
  }

  ngAfterViewInit() {
    if (this.modalContainer) {
      this.modalService.setModalContainer(this.modalContainer);
    }
    
    // Listen for window resize to update cards per view
    window.addEventListener('resize', () => this.updateCarouselCardsPerView());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', () => this.updateCarouselCardsPerView());
  }
  
  /**
   * Inicializar stats con valores por defecto
   */
  private initializeDefaultStats() {
    this.orderStats = {
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
  }

  /**
   * Verificar si el usuario root tiene negocio seleccionado
   */
  private checkBusinessSelection(): void {
    // Verificar si el usuario root tiene negocio seleccionado
    if (!this.rootBusinessSelector.hasValidSelection()) {
      console.log('Orders: Usuario root sin negocio seleccionado, mostrando selector...');
      this.showBusinessSelector = true;
    }
  }

  /**
   * Manejar cierre del modal de selección de negocio
   */
  onBusinessSelectorClosed(): void {
    this.showBusinessSelector = false;
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
  

  async loadOrders() {
    this.loading = true;
    try {
      this.orderService.watchOrders()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (orders) => {
            console.log('📦 Órdenes recibidas del servicio:', orders.length);
            this.orders = orders;
            this.applyFilters();
            console.log('🔢 Ejecutando cálculo de stats...');
            this.calculateOrderStatsFromLocalData(); // Recalcular stats después de cargar datos
            console.log('📊 Stats actualizadas:', this.orderStats);
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
      this.calculateOrderStatsFromLocalData(); // Recalcular stats después de forzar recarga
      this.notificationService.showSuccess('Órdenes actualizadas');
    } catch (error) {
      console.error('Error force reloading orders:', error);
      this.notificationService.showError('Error al actualizar órdenes');
    } finally {
      this.loading = false;
    }
  }


  /**
   * Calcular estadísticas dinámicamente desde los datos cargados
   */
  private calculateOrderStatsFromLocalData() {
    if (!this.orders || this.orders.length === 0) {
      return;
    }

    // Calcular stats basadas en estados plan-based
    const deliveredStatuses = ['delivered', 'dispatched'];
    const preparingStatuses = ['preparing', 'prepared'];
    // Estados que NO deben contar para ingresos totales
    const excludedFromRevenueStatuses = ['canceled', 'cancelled', 'returned', 'refunded'];
    
    // Filtrar órdenes válidas para ingresos
    const validOrdersForRevenue = this.orders.filter(o => !excludedFromRevenueStatuses.includes(o.status));
    
    const totalRevenue = validOrdersForRevenue.reduce((sum, o) => {
      const orderTotal = o.total || 0;
      return sum + orderTotal;
    }, 0);
    
    this.orderStats = {
      totalOrders: this.orders.length,
      pendingOrders: this.orders.filter(o => o.status === 'pending').length,
      preparingOrders: this.orders.filter(o => preparingStatuses.includes(o.status)).length,
      shippedOrders: this.orders.filter(o => o.status === 'shipped').length,
      deliveredOrders: this.orders.filter(o => deliveredStatuses.includes(o.status)).length,
      cancelledOrders: this.orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: totalRevenue,
      averageOrderValue: this.calculateAverageOrderValueForRevenue(),
      ordersByStatus: this.calculateOrdersByStatus()
    };
  }

  /**
   * Calcular valor promedio de órdenes
   */
  private calculateAverageOrderValue(): number {
    if (!this.orders || this.orders.length === 0) return 0;
    
    const totalValue = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return totalValue / this.orders.length;
  }

  /**
   * Calcular valor promedio de órdenes que cuentan para ingresos (excluyendo canceladas y devueltas)
   */
  private calculateAverageOrderValueForRevenue(): number {
    if (!this.orders || this.orders.length === 0) return 0;
    
    const excludedFromRevenueStatuses = ['canceled', 'cancelled', 'returned', 'refunded'];
    const validOrders = this.orders.filter(o => !excludedFromRevenueStatuses.includes(o.status));
    
    if (validOrders.length === 0) return 0;
    
    const totalValue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return totalValue / validOrders.length;
  }

  /**
   * Calcular órdenes por estado
   */
  private calculateOrdersByStatus(): Record<OrderStatus, number> {
    const statusCounts: Record<OrderStatus, number> = {
      pending: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    if (!this.orders) return statusCounts;

    this.orders.forEach(order => {
      if (order.status in statusCounts) {
        statusCounts[order.status as OrderStatus]++;
      } else {
        // Para estados plan-based, mapear a estados base
        switch (order.status) {
          case 'prepared':
            statusCounts['preparing']++;
            break;
          case 'dispatched':
          case 'in_delivery':
            statusCounts['delivered']++;
            break;
          case 'canceled':
            statusCounts['cancelled']++;
            break;
          default:
            // Para estados no reconocidos, no hacer nada o mapear a pending
            console.warn(`Estado no reconocido: ${order.status}`);
        }
      }
    });

    return statusCounts;
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

    // Status filter (works with both plan-based and legacy statuses)
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
        this.calculateOrderStatsFromLocalData(); // Recalcular stats después de cambio de estado
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
      
      this.calculateOrderStatsFromLocalData(); // Recalcular stats después de cambios masivos
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
    
    // Forzar recarga como respaldo en caso de que el tiempo real no funcione
    setTimeout(() => {
      this.forceReloadOrders(); // Ya incluye recálculo de stats
    }, 1000);
    
    this.notificationService.showSuccess('Orden creada correctamente');
  }

  onOrderUpdated() {
    this.closeModals();
    // Las órdenes se actualizan automáticamente via watchOrders() que ya recalcula stats
    this.notificationService.showSuccess('Orden actualizada correctamente');
  }

  onModalClosed() {
    this.closeModals();
  }

  // Carousel navigation methods
  navigateCarouselLeft() {
    if (this.canNavigateLeft) {
      this.currentCarouselIndex--;
    }
  }

  navigateCarouselRight() {
    if (this.canNavigateRight) {
      this.currentCarouselIndex++;
    }
  }

  // Navigate to specific carousel page
  goToCarouselPage(pageIndex: number) {
    const newIndex = pageIndex * this.cardsPerView;
    if (newIndex >= 0 && newIndex < this.statusCardsData.length) {
      this.currentCarouselIndex = newIndex;
    }
  }

  // Filter orders by status when clicking on a stats card or clear all filters
  filterByStatus(status: PlanBasedOrderStatus | 'total') {
    // Si es la card total, limpiar todos los filtros
    if (status === 'total') {
      this.clearFilters();
      this.notificationService.showSuccess('Todos los filtros eliminados - Mostrando todas las órdenes');
      return;
    }
    
    const wasFiltered = this.filters.status === status;
    
    // Si ya está filtrado por este estado, limpiar el filtro
    if (wasFiltered) {
      this.filters.status = '';
      this.notificationService.showSuccess('Filtro eliminado - Mostrando todas las órdenes');
    } else {
      // Aplicar nuevo filtro
      this.filters.status = status;
      const statusLabel = this.orderStatesService.getStatusLabel(status);
      const filteredCount = this.orders.filter(order => order.status === status).length;
      this.notificationService.showSuccess(`Filtrado por ${statusLabel} - ${filteredCount} orden(es) encontrada(s)`);
    }
    
    // Aplicar filtros y resetear paginación
    this.applyFilters();
    
    // Scroll suavemente a la tabla de órdenes si se aplicó un filtro
    if (!wasFiltered) {
      setTimeout(() => {
        const ordersTable = document.querySelector('.md\\:block');
        if (ordersTable) {
          ordersTable.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }

  // Check if a status is currently being filtered
  isStatusFiltered(status: PlanBasedOrderStatus | 'total'): boolean {
    if (status === 'total') {
      // La card total está "activa" cuando NO hay filtros aplicados
      return !this.hasActiveFilters();
    }
    return this.filters.status === status;
  }

  // Get count for specific status
  private getStatusCount(status: PlanBasedOrderStatus): number {
    if (!this.orders) return 0;
    return this.orders.filter(order => order.status === status).length;
  }

  // Get icon for specific status
  private getStatusIcon(status: PlanBasedOrderStatus): string {
    switch (status) {
      case 'pending':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'; // Clock
      case 'preparing':
        return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'; // Package
      case 'prepared':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Check circle
      case 'dispatched':
        return 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2'; // Truck
      case 'in_delivery':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'; // Info circle (in transit)
      case 'delivered':
        return 'M5 13l4 4L19 7'; // Check
      case 'canceled':
        return 'M6 18L18 6M6 6l12 12'; // X
      case 'returned':
        return 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6'; // Return arrow
      case 'refunded':
        return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'; // Dollar sign
      default:
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'; // Document
    }
  }

  // Update cards per view based on screen size with mobile optimization
  private updateCarouselCardsPerView() {
    const width = window.innerWidth;
    
    if (width < 640) { // sm - Mobile optimization
      this.cardsPerView = 1;
    } else if (width < 768) { // md - Small tablet
      this.cardsPerView = 2;
    } else if (width < 1024) { // lg - Large tablet
      this.cardsPerView = 3;
    } else if (width < 1280) { // xl - Small desktop
      this.cardsPerView = 4;
    } else { // 2xl - Large desktop
      this.cardsPerView = Math.min(5, this.statusCardsData.length);
    }
    
    // Reset carousel index if needed
    const maxStartIndex = Math.max(0, this.statusCardsData.length - this.cardsPerView);
    if (this.currentCarouselIndex > maxStartIndex) {
      this.currentCarouselIndex = maxStartIndex;
    }
  }
} 