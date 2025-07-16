import { Injectable } from '@angular/core';
import { Observable, of, from, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { where, orderBy, limit, startAfter } from '@angular/fire/firestore';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { ChangeDetectionService } from '../../../core/services/change-detection.service';
import { RootBusinessSelectorService } from './root-business-selector.service';
import { CustomerService } from './customer.service';
import { ProductService } from './product.service';
import {
  Order,
  OrderItem,
  OrderCustomer,
  OrderStatus,
  OrderSource,
  OrderFilters,
  CreateOrderRequest,
  CreateOrderItem,
  UpdateOrderRequest,
  OrdersResponse,
  OrderStats,
  OrderValidation,
  OrderValidationError,
  OrderValidationWarning,
  StatusChange,
  SortField,
  SortDirection,
  OrderUtils,
  ORDER_STATUS_TRANSITIONS
} from '../models/order.model';
import { Customer } from '../models/customer.model';
import { SKU } from '../models/sku.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(
    private databaseService: DatabaseService,
    private businessService: BusinessService,
    private authService: AuthService,
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService,
    private rootBusinessSelector: RootBusinessSelectorService,
    private customerService: CustomerService,
    private productService: ProductService
  ) {}

  /**
   * Observar todas las órdenes del negocio actual con cache inteligente
   */
  watchOrders(): Observable<Order[]> {
    const isRoot = this.authService.isRoot();

    if (isRoot) {
      // Para usuarios root, escuchar cambios en la selección de negocio
      return this.rootBusinessSelector.selection$.pipe(
        switchMap(selection => {
          console.log('Root business selection:', selection);
          
          if (selection.showAll) {
            // Si debe mostrar todos, obtener órdenes de todos los negocios
            return this.getAllOrdersForRoot();
          } else if (selection.businessId) {
            // Si tiene un negocio específico seleccionado
            return this.getOrdersRealTime(selection.businessId);
          } else {
            // Sin selección válida, retornar array vacío
            console.log('No valid business selection for root user');
            return of([]);
          }
        })
      );
    } else {
      // Para usuarios no root, usar real-time con businessId fijo
      return from(this.businessService.getCurrentBusinessId()).pipe(
        switchMap(businessId => {
          if (!businessId) {
            return of([]);
          }
          return this.getOrdersRealTime(businessId);
        })
      );
    }
  }

  /**
   * Obtener todas las órdenes para usuario root (sin filtro de businessId)
   */
  private getAllOrdersForRoot(): Observable<Order[]> {
    return this.databaseService.getAll<Order>('orders', 'createdAt', 'desc')
      .pipe(
        tap((orders: Order[]) => {
          console.log(`OrderService: All orders loaded for root user: ${orders.length} orders`);
        }),
        catchError(error => {
          console.error('Error fetching all orders for root:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener órdenes en tiempo real
   */
  private getOrdersRealTime(businessId: string): Observable<Order[]> {
    // Simplificar la consulta para evitar índices compuestos
    return this.databaseService.getWhere<Order>('orders', 'businessId', '==', businessId)
      .pipe(
        map((orders: Order[]) => orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )),
        tap((orders: Order[]) => {
          console.log(`OrderService: Real-time orders loaded for ${businessId}: ${orders.length} orders`);
        }),
        catchError(error => {
          console.error('Error fetching orders real-time:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener órdenes con estrategia de cache
   */
  private getOrdersWithCache(businessId: string): Observable<Order[]> {
    const cacheKey = `orders_${businessId}`;
    
    // Verificar si necesita refresh
    if (!this.changeDetectionService.needsRefresh('orders', businessId)) {
      const cached = this.cacheService.get<Order[]>(cacheKey, 'sessionStorage');
      if (cached) {
        console.log(`OrderService: Returning cached data for ${businessId}`);
        return of(cached);
      }
    }

    // Consultar Firebase y actualizar cache
    console.log(`OrderService: Fetching fresh data for ${businessId}`);
    const startTime = Date.now();
    return from(this.databaseService.getOnce<Order>('orders', where('businessId', '==', businessId)))
      .pipe(
        map((orders: Order[]) => orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )),
        tap((orders: Order[]) => {
          const responseTime = Date.now() - startTime;
          
          // Actualizar cache (sessionStorage para datos por sesión)
          this.cacheService.set(cacheKey, orders, 10 * 60 * 1000, 'sessionStorage'); // 10 minutos TTL
          
          // Marcar como actualizado
          this.changeDetectionService.markAsUpdated('orders', businessId);
          
          console.log(`OrderService: Cached ${orders.length} orders for ${businessId} (${responseTime}ms)`);
        }),
        catchError(error => {
          console.error('Error fetching orders:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtener órdenes con filtros y paginación
   */
  async getOrdersByBusiness(
    filters: OrderFilters,
    pageSize: number = 20,
    lastDoc: any = null,
    sortField: SortField = 'createdAt',
    sortDirection: SortDirection = 'desc'
  ): Promise<OrdersResponse> {
    try {
      const isRoot = this.authService.isRoot();
      let businessId: string | null = null;

      if (isRoot) {
        businessId = this.rootBusinessSelector.getEffectiveBusinessId();
        if (!businessId) {
          return { items: [], lastDoc: null, hasMore: false };
        }
      } else {
        businessId = await this.businessService.getCurrentBusinessId();
        if (!businessId) {
          return { items: [], lastDoc: null, hasMore: false };
        }
      }

      // Construir constraints de consulta básicos
      let constraints: any[] = [
        where('businessId', '==', businessId),
        orderBy(sortField, sortDirection),
        limit(pageSize)
      ];

      // Agregar filtros
      if (filters.status && filters.status !== '') {
        constraints.splice(-2, 0, where('status', '==', filters.status));
      }

      if (filters.source && filters.source !== '') {
        constraints.splice(-2, 0, where('source', '==', filters.source));
      }

      // Simplificar consulta para evitar índices compuestos - solo filtrar por businessId
      const docs = await this.databaseService.getOnce<Order>('orders', where('businessId', '==', businessId));
      
      // Aplicar filtros del lado del cliente
      let filteredItems = docs;

      // Filtro por estado
      if (filters.status && filters.status !== '') {
        filteredItems = filteredItems.filter(order => order.status === filters.status);
      }

      // Filtro por origen
      if (filters.source && filters.source !== '') {
        filteredItems = filteredItems.filter(order => order.source === filters.source);
      }

      // Ordenamiento del lado del cliente
      filteredItems = filteredItems.sort((a: Order, b: Order) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case 'total':
            aValue = a.total;
            bValue = b.total;
            break;
          case 'orderNumber':
            aValue = a.orderNumber;
            bValue = b.orderNumber;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }

        if (sortDirection === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      // Paginación del lado del cliente
      const startIndex = lastDoc ? filteredItems.findIndex(item => item.id === (lastDoc as any).id) + 1 : 0;
      const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);
      
      const result = {
        items: paginatedItems,
        lastDoc: paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1] as any : null,
        hasMore: startIndex + pageSize < filteredItems.length
      };

      // Aplicar filtros adicionales del lado del cliente
      let finalFilteredItems = result.items;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        finalFilteredItems = finalFilteredItems.filter(order =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customer.name.toLowerCase().includes(searchLower) ||
          order.customer.email.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.productName.toLowerCase().includes(searchLower))
        );
      }

      if (filters.customer) {
        finalFilteredItems = finalFilteredItems.filter(order =>
          order.customer.id === filters.customer
        );
      }

      if (filters.dateFrom || filters.dateTo) {
        finalFilteredItems = finalFilteredItems.filter(order => {
          const orderDate = new Date(order.createdAt);
          if (filters.dateFrom && orderDate < filters.dateFrom) return false;
          if (filters.dateTo && orderDate > filters.dateTo) return false;
          return true;
        });
      }

      if (filters.amountFrom !== null || filters.amountTo !== null) {
        finalFilteredItems = finalFilteredItems.filter(order => {
          if (filters.amountFrom !== null && order.total < filters.amountFrom) return false;
          if (filters.amountTo !== null && order.total > filters.amountTo) return false;
          return true;
        });
      }

      return {
        items: finalFilteredItems,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      };

    } catch (error) {
      console.error('Error getting orders by business:', error);
      return { items: [], lastDoc: null, hasMore: false };
    }
  }

  /**
   * Obtener una orden por ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      return await this.databaseService.getById<Order>('orders', orderId);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      return null;
    }
  }

  /**
   * Crear nueva orden
   */
  async createOrder(request: CreateOrderRequest): Promise<{ success: boolean; order?: Order; errors?: string[] }> {
    try {
      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) {
        return { success: false, errors: ['No business context available'] };
      }

      // Validar la orden antes de crear
      const validation = await this.validateOrder(request, businessId);
      if (!validation.isValid) {
        return { 
          success: false, 
          errors: validation.errors.map(e => e.message) 
        };
      }

      // Obtener información del cliente
      const customer = await this.getCustomerForOrder(request.customerId);
      if (!customer) {
        return { success: false, errors: ['Customer not found'] };
      }

      // Procesar items de la orden
      const orderItems = await this.processOrderItems(request.items, businessId);
      if (orderItems.length === 0) {
        return { success: false, errors: ['No valid items in order'] };
      }

      // Calcular totales
      const totals = OrderUtils.calculateOrderTotal(orderItems, request.discounts || 0);

      // Crear objeto orden
      const currentUser = this.authService.getCurrentUserProfile();
      const order: Omit<Order, 'id'> = {
        businessId,
        orderNumber: OrderUtils.generateOrderNumber(),
        source: request.source || 'manual',
        customer: {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone || '',
          documentType: customer.documentType || '',
          documentNumber: customer.documentNumber || ''
        },
        items: orderItems,
        status: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: new Date(),
          userId: currentUser?.uid || '',
          userName: currentUser?.displayName || 'Unknown',
          reason: 'Order created'
        }],
        subtotal: totals.subtotal,
        taxes: totals.taxes,
        discounts: totals.discounts,
        total: totals.total,
        notes: request.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.uid || ''
      };

      // Guardar en Firebase
      const orderId = await this.databaseService.create('orders', order);
      const createdOrder: Order = { ...order, id: orderId };

      // Reservar stock para items de la orden
      await this.reserveOrderStock(createdOrder);

      // Invalidar cache de órdenes y productos
      this.invalidateOrderCache(businessId);
      await this.productService.invalidateProductCache(businessId);

      return { success: true, order: createdOrder };

    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, errors: ['Failed to create order'] };
    }
  }

  /**
   * Actualizar orden existente
   */
  async updateOrder(orderId: string, request: UpdateOrderRequest): Promise<{ success: boolean; order?: Order; errors?: string[] }> {
    try {
      const existingOrder = await this.getOrderById(orderId);
      if (!existingOrder) {
        return { success: false, errors: ['Order not found'] };
      }

      // Validar transición de estado si se está cambiando
      if (request.status && !OrderUtils.isValidStatusTransition(existingOrder.status, request.status)) {
        return { 
          success: false, 
          errors: [`Invalid status transition from ${existingOrder.status} to ${request.status}`] 
        };
      }

      const updateData: Partial<Order> = {
        updatedAt: new Date()
      };

      // Actualizar items si se proporcionan
      if (request.items) {
        const orderItems = await this.processOrderItems(
          request.items.map(item => ({
            skuId: item.skuId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          existingOrder.businessId
        );
        
        const totals = OrderUtils.calculateOrderTotal(orderItems, request.discounts || existingOrder.discounts);
        
        updateData.items = orderItems;
        updateData.subtotal = totals.subtotal;
        updateData.taxes = totals.taxes;
        updateData.discounts = totals.discounts;
        updateData.total = totals.total;
      }

      // Actualizar estado si se proporciona
      if (request.status) {
        const currentUser = this.authService.getCurrentUserProfile();
        const statusChange: StatusChange = {
          status: request.status,
          timestamp: new Date(),
          userId: currentUser?.uid || '',
          userName: currentUser?.displayName || 'Unknown',
          reason: request.statusReason || ''
        };

        updateData.status = request.status;
        updateData.statusHistory = [...existingOrder.statusHistory, statusChange];

        // Manejar cambios de stock según el estado
        await this.handleStockOnStatusChange(existingOrder, request.status);
        
        // Invalidar cache de productos si el estado afecta el stock
        if (request.status === 'delivered' || request.status === 'cancelled') {
          await this.productService.invalidateProductCache(existingOrder.businessId);
        }
      }

      // Actualizar notas si se proporcionan
      if (request.notes !== undefined) {
        updateData.notes = request.notes || '';
      }

      // Actualizar descuentos si se proporcionan
      if (request.discounts !== undefined && !request.items) {
        const totals = OrderUtils.calculateOrderTotal(existingOrder.items, request.discounts);
        updateData.subtotal = totals.subtotal;
        updateData.taxes = totals.taxes;
        updateData.discounts = totals.discounts;
        updateData.total = totals.total;
      }

      await this.databaseService.update('orders', orderId, updateData);
      
      // Obtener la orden actualizada
      const updatedOrder = await this.getOrderById(orderId);

      // Invalidar cache de órdenes
      this.invalidateOrderCache(existingOrder.businessId);

      return { success: true, order: updatedOrder || undefined };

    } catch (error) {
      console.error('Error updating order:', error);
      return { success: false, errors: ['Failed to update order'] };
    }
  }

  /**
   * Eliminar orden (cancelar)
   */
  async cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; errors?: string[] }> {
    try {
      const result = await this.updateOrder(orderId, {
        status: 'cancelled',
        statusReason: reason || 'Order cancelled'
      });

      return { success: result.success, errors: result.errors };
    } catch (error) {
      console.error('Error cancelling order:', error);
      return { success: false, errors: ['Failed to cancel order'] };
    }
  }

  /**
   * Obtener estadísticas de órdenes
   */
  async getOrderStats(businessId: string): Promise<OrderStats> {
    try {
      const orders = await this.databaseService.getOnce<Order>('orders', where('businessId', '==', businessId));

      const stats: OrderStats = {
        totalOrders: orders.length,
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

      orders.forEach(order => {
        stats.ordersByStatus[order.status]++;
        
        switch (order.status) {
          case 'pending':
            stats.pendingOrders++;
            break;
          case 'preparing':
            stats.preparingOrders++;
            break;
          case 'shipped':
            stats.shippedOrders++;
            break;
          case 'delivered':
            stats.deliveredOrders++;
            stats.totalRevenue += order.total;
            break;
          case 'cancelled':
            stats.cancelledOrders++;
            break;
        }
      });

      stats.averageOrderValue = stats.deliveredOrders > 0 ? stats.totalRevenue / stats.deliveredOrders : 0;

      return stats;
    } catch (error) {
      console.error('Error getting order stats:', error);
      return {
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
  }

  /**
   * Validar orden antes de crear/actualizar
   */
  private async validateOrder(request: CreateOrderRequest, businessId: string): Promise<OrderValidation> {
    const errors: OrderValidationError[] = [];
    const warnings: OrderValidationWarning[] = [];

    // Validar que hay items
    if (!request.items || request.items.length === 0) {
      errors.push({
        type: 'EMPTY_ORDER',
        message: 'Order must contain at least one item'
      });
    }

    // Validar cliente
    const customer = await this.getCustomerForOrder(request.customerId);
    if (!customer) {
      errors.push({
        type: 'INVALID_CUSTOMER',
        message: 'Customer not found'
      });
    }

    // Validar items y stock
    for (const item of request.items) {
      if (item.quantity <= 0) {
        errors.push({
          type: 'INVALID_QUANTITY',
          message: `Invalid quantity for product ${item.skuId}`,
          skuId: item.skuId
        });
        continue;
      }

      // Verificar producto existe y está activo
      const product = await this.databaseService.getById<SKU>('products', item.skuId);
      if (!product || !product.isActive) {
        errors.push({
          type: 'INVALID_PRODUCT',
          message: `Product ${item.skuId} not found or inactive`,
          skuId: item.skuId
        });
        continue;
      }

      // Verificar stock disponible
      const availableStock = product.stock.current - product.stock.reserved;
      if (item.quantity > availableStock) {
        errors.push({
          type: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`,
          skuId: item.skuId
        });
        continue;
      }

      // Advertencias de stock bajo
      if (availableStock - item.quantity < product.stock.minimum) {
        warnings.push({
          type: 'LOW_STOCK',
          message: `Low stock warning for ${product.name}`,
          skuId: item.skuId
        });
      }

      // Advertencia de cantidad alta
      if (item.quantity > 10) {
        warnings.push({
          type: 'HIGH_QUANTITY',
          message: `High quantity ordered for ${product.name}`,
          skuId: item.skuId
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Obtener información del cliente para la orden
   */
  private async getCustomerForOrder(customerId: string): Promise<Customer | null> {
    try {
      return await this.databaseService.getById<Customer>('customers', customerId);
    } catch (error) {
      console.error('Error getting customer for order:', error);
      return null;
    }
  }

  /**
   * Procesar items de la orden
   */
  private async processOrderItems(items: CreateOrderItem[], businessId: string): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const item of items) {
      try {
        const product = await this.databaseService.getById<SKU>('products', item.skuId);
        if (!product || !product.isActive) continue;

        const unitPrice = item.unitPrice || product.pricing.price;
        const subtotal = item.quantity * unitPrice;

        orderItems.push({
          skuId: product.id,
          skuCode: product.code,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          attributes: product.attributes || {},
          availableStock: product.stock.current - product.stock.reserved
        });
      } catch (error) {
        console.error(`Error processing item ${item.skuId}:`, error);
        continue;
      }
    }

    return orderItems;
  }

  /**
   * Reservar stock para la orden
   */
  private async reserveOrderStock(order: Order): Promise<void> {
    for (const item of order.items) {
      try {
        const product = await this.databaseService.getById<SKU>('products', item.skuId);
        if (product) {
          const updatedStock = {
            ...product.stock,
            reserved: product.stock.reserved + item.quantity
          };

          await this.databaseService.update('products', item.skuId, {
            stock: updatedStock,
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error(`Error reserving stock for ${item.skuId}:`, error);
      }
    }
  }

  /**
   * Manejar cambios de stock según estado de orden
   */
  private async handleStockOnStatusChange(order: Order, newStatus: OrderStatus): Promise<void> {
    if (newStatus === 'delivered') {
      // Confirmar venta: descontar del stock current y reserved
      for (const item of order.items) {
        try {
          const product = await this.databaseService.getById<SKU>('products', item.skuId);
          if (product) {
            const updatedStock = {
              ...product.stock,
              current: product.stock.current - item.quantity,
              reserved: Math.max(0, product.stock.reserved - item.quantity)
            };

            await this.databaseService.update('products', item.skuId, {
              stock: updatedStock,
              updatedAt: new Date()
            });
          }
        } catch (error) {
          console.error(`Error updating stock for delivered order ${item.skuId}:`, error);
        }
      }
    } else if (newStatus === 'cancelled') {
      // Liberar stock reservado
      for (const item of order.items) {
        try {
          const product = await this.databaseService.getById<SKU>('products', item.skuId);
          if (product) {
            const updatedStock = {
              ...product.stock,
              reserved: Math.max(0, product.stock.reserved - item.quantity)
            };

            await this.databaseService.update('products', item.skuId, {
              stock: updatedStock,
              updatedAt: new Date()
            });
          }
        } catch (error) {
          console.error(`Error releasing stock for cancelled order ${item.skuId}:`, error);
        }
      }
    }
  }

  /**
   * Forzar recarga de órdenes (usar cuando las actualizaciones en tiempo real no funcionen)
   */
  async forceReloadOrders(): Promise<Order[]> {
    try {
      const isRoot = this.authService.isRoot();
      
      if (isRoot) {
        const selection = this.rootBusinessSelector.getCurrentSelection();
        
        if (selection.showAll) {
          // Usuario root quiere ver todas las órdenes
          const orders = await this.databaseService.getOnce<Order>('orders');
          const sortedOrders = orders.sort((a: Order, b: Order) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          console.log(`OrderService: Force reloaded ${sortedOrders.length} orders for root (all businesses)`);
          return sortedOrders;
        } else if (selection.businessId) {
          // Usuario root con negocio específico
          this.invalidateOrderCache(selection.businessId);
          const orders = await this.databaseService.getOnce<Order>('orders', 
            where('businessId', '==', selection.businessId)
          );
          const sortedOrders = orders.sort((a: Order, b: Order) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          console.log(`OrderService: Force reloaded ${sortedOrders.length} orders for ${selection.businessId}`);
          return sortedOrders;
        } else {
          console.log('No valid business selection for root user');
          return [];
        }
      } else {
        // Usuario no root
        const businessId = await this.businessService.getCurrentBusinessId();
        if (!businessId) {
          return [];
        }

        this.invalidateOrderCache(businessId);
        
        const orders = await this.databaseService.getOnce<Order>('orders', 
          where('businessId', '==', businessId)
        );
        const sortedOrders = orders.sort((a: Order, b: Order) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        console.log(`OrderService: Force reloaded ${sortedOrders.length} orders for ${businessId}`);
        return sortedOrders;
      }
    } catch (error) {
      console.error('Error force reloading orders:', error);
      return [];
    }
  }

  /**
   * Invalidar cache de órdenes
   */
  private invalidateOrderCache(businessId: string): void {
    const cacheKey = `orders_${businessId}`;
    this.cacheService.remove(cacheKey, 'sessionStorage');
    this.changeDetectionService.invalidateCollection('orders', businessId);
  }
}