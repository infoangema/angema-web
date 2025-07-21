import { Timestamp, DocumentSnapshot } from '@angular/fire/firestore';

export interface Order {
  id: string;
  businessId: string;
  orderNumber: string; // ORD-2025-001
  source: OrderSource;
  
  // Customer info (embedded for performance)
  customer: OrderCustomer;
  
  // Order items
  items: OrderItem[];
  
  // Status management
  status: OrderStatus | string;
  statusHistory: StatusChange[];
  
  // Financial data
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  
  // Additional info
  notes?: string;
  
  // Enterprise plan features
  lastStatusChangedBy?: string; // Last user who changed status (Enterprise)
  lastStatusChangeAt?: Date; // When status was last changed (Enterprise)
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}

export interface OrderItem {
  skuId: string;
  skuCode: string; // For display
  productName: string; // For display
  quantity: number;
  unitPrice: number;
  subtotal: number; // quantity × unitPrice
  
  // Product attributes for display
  attributes?: {
    color?: string;
    size?: string;
    material?: string;
    grams?: string;
  };
  
  // Stock validation
  availableStock?: number;
}

export interface OrderCustomer {
  id: string;
  name: string; // firstName + lastName combined
  email: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface StatusChange {
  status: OrderStatus | string;
  timestamp: Date;
  userId: string;
  userName: string;
  reason?: string; // Optional reason for status change
  userEmail?: string; // For Enterprise plan user tracking
  isAutomatic?: boolean; // For Enterprise plan automatic changes via Flutter app
}

export type OrderSource = 'manual' | 'mercadolibre' | 'tiendanube' | 'website';

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

// Plan-based status definitions
export type BasicPlanStatus = 'pending' | 'preparing' | 'prepared' | 'dispatched' | 'canceled' | 'returned' | 'refunded';
export type PremiumPlanStatus = BasicPlanStatus | 'in_delivery' | 'delivered';
export type EnterprisePlanStatus = PremiumPlanStatus;

export type PlanBasedOrderStatus = BasicPlanStatus | PremiumPlanStatus | EnterprisePlanStatus;

export type BusinessPlan = 'basic' | 'premium' | 'enterprise';

export interface OrderFilters {
  search: string; // Search by order number, customer name, or product
  status: OrderStatus | string | null;
  customer: string | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  amountFrom: number | null;
  amountTo: number | null;
  source: OrderSource | string | null;
}

export interface CreateOrderRequest {
  customerId: string;
  items: CreateOrderItem[];
  notes?: string;
  discounts?: number;
  source?: OrderSource;
}

export interface CreateOrderItem {
  skuId: string;
  quantity: number;
  unitPrice?: number; // If not provided, use current product price
}

export interface UpdateOrderRequest {
  items?: UpdateOrderItem[];
  notes?: string;
  discounts?: number;
  status?: OrderStatus | string;
  statusReason?: string;
}

export interface UpdateOrderItem {
  skuId: string;
  quantity: number;
  unitPrice?: number;
}

export interface OrdersResponse {
  items: Order[];
  lastDoc: DocumentSnapshot<Order> | null;
  hasMore: boolean;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export interface OrderValidation {
  isValid: boolean;
  errors: OrderValidationError[];
  warnings: OrderValidationWarning[];
}

export interface OrderValidationError {
  type: 'INSUFFICIENT_STOCK' | 'INVALID_CUSTOMER' | 'INVALID_PRODUCT' | 'EMPTY_ORDER' | 'INVALID_QUANTITY';
  message: string;
  skuId?: string;
  field?: string;
}

export interface OrderValidationWarning {
  type: 'LOW_STOCK' | 'HIGH_QUANTITY' | 'PRICE_CHANGE';
  message: string;
  skuId?: string;
}

// Status transition validation
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [], // Final state
  cancelled: [] // Final state
};

// Plan-based status transitions
export const PLAN_BASED_STATUS_TRANSITIONS: Record<PlanBasedOrderStatus, PlanBasedOrderStatus[]> = {
  // Basic plan states
  pending: ['preparing', 'canceled'],
  preparing: ['prepared', 'canceled'],
  prepared: ['dispatched', 'canceled'],
  dispatched: ['returned', 'refunded'],
  canceled: ['refunded'], // Can be refunded after cancellation
  returned: ['refunded'],
  refunded: [], // Final state
  
  // Premium plan additional states
  in_delivery: ['delivered', 'returned', 'canceled'],
  delivered: ['returned'], // Can be returned after delivery
};

// Status labels for UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

// Plan-based status labels
export const PLAN_BASED_STATUS_LABELS: Record<PlanBasedOrderStatus, string> = {
  // Basic plan states
  pending: 'Pendiente',
  preparing: 'Preparando',
  prepared: 'Preparado',
  dispatched: 'Despachado',
  canceled: 'Cancelado',
  returned: 'Devuelto',
  refunded: 'Reembolsado',
  
  // Premium plan additional states
  in_delivery: 'En Viaje',
  delivered: 'Entregado'
};

// Status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

// Plan-based status colors with soft colors as specified
export const PLAN_BASED_STATUS_COLORS: Record<PlanBasedOrderStatus, string> = {
  // Basic plan states with soft colors
  pending: 'bg-red-50 text-red-700 border-red-200', // rojizo suave
  preparing: 'bg-yellow-50 text-yellow-700 border-yellow-200', // amarillo suave
  prepared: 'bg-green-50 text-green-700 border-green-200', // verde suave
  dispatched: 'bg-purple-50 text-purple-700 border-purple-200', // morado suave
  canceled: 'bg-red-100 text-red-800 border-red-300', // rojo más fuerte
  returned: 'bg-yellow-100 text-yellow-800 border-yellow-300', // amarillo más fuerte
  refunded: 'bg-orange-50 text-orange-700 border-orange-200', // naranja suave
  
  // Premium plan additional states
  in_delivery: 'bg-blue-50 text-blue-700 border-blue-200', // azul suave
  delivered: 'bg-blue-100 text-blue-800 border-blue-300' // azul fuerte
};

// Source labels for UI
export const ORDER_SOURCE_LABELS: Record<OrderSource, string> = {
  manual: 'Manual',
  mercadolibre: 'MercadoLibre',
  tiendanube: 'TiendaNube',
  website: 'Sitio Web'
};

export type SortField = 'orderNumber' | 'customer.name' | 'total' | 'status' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

// Plan-based status collections for business plans
export const BUSINESS_PLAN_STATUSES: Record<BusinessPlan, PlanBasedOrderStatus[]> = {
  basic: ['pending', 'preparing', 'prepared', 'dispatched', 'canceled', 'returned', 'refunded'],
  premium: ['pending', 'preparing', 'prepared', 'dispatched', 'canceled', 'returned', 'refunded', 'in_delivery', 'delivered'],
  enterprise: ['pending', 'preparing', 'prepared', 'dispatched', 'canceled', 'returned', 'refunded', 'in_delivery', 'delivered']
};

// Stock operations for each status transition
export enum StockOperation {
  RESERVE = 'RESERVE',                   // Reserve stock (pending)
  NO_CHANGE = 'NO_CHANGE',               // No stock change
  CONFIRM = 'CONFIRM',                   // Confirm sale and update stock (dispatched)
  RELEASE = 'RELEASE',                   // Release reserved stock (canceled)
  RELEASE_AND_RESTORE = 'RELEASE_AND_RESTORE' // Release reserved and restore current stock (returned)
}

export const STATUS_STOCK_OPERATIONS: Record<PlanBasedOrderStatus, StockOperation> = {
  pending: StockOperation.RESERVE,     // Reserve stock
  preparing: StockOperation.NO_CHANGE, // No change
  prepared: StockOperation.NO_CHANGE,  // No change
  dispatched: StockOperation.CONFIRM,  // Confirm sale, update stock
  canceled: StockOperation.RELEASE,    // Release reserved stock
  returned: StockOperation.RELEASE_AND_RESTORE, // Release reserved and restore current stock
  refunded: StockOperation.NO_CHANGE,  // No stock change (already handled)
  in_delivery: StockOperation.NO_CHANGE, // No change
  delivered: StockOperation.NO_CHANGE   // No change (already confirmed at dispatch)
};

// Utility functions
export class OrderUtils {
  static calculateOrderTotal(items: OrderItem[], discounts: number = 0, taxRate: number = 0): {
    subtotal: number;
    taxes: number;
    discounts: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes - discounts;
    
    return {
      subtotal,
      taxes,
      discounts,
      total
    };
  }
  
  static generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    
    return `ORD-${year}${month}${day}-${time}`;
  }
  
  static isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    return ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
  }
  
  static getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status];
  }
  
  static getStatusColor(status: OrderStatus): string {
    return ORDER_STATUS_COLORS[status];
  }
  
  static getSourceLabel(source: OrderSource): string {
    return ORDER_SOURCE_LABELS[source];
  }
  
  // Plan-based utility methods
  static getPlanBasedStatusLabel(status: PlanBasedOrderStatus): string {
    return PLAN_BASED_STATUS_LABELS[status];
  }
  
  static getPlanBasedStatusColor(status: PlanBasedOrderStatus): string {
    return PLAN_BASED_STATUS_COLORS[status];
  }
  
  static getAvailableStatusesForPlan(plan: BusinessPlan): PlanBasedOrderStatus[] {
    return BUSINESS_PLAN_STATUSES[plan];
  }
  
  static isValidPlanBasedStatusTransition(currentStatus: PlanBasedOrderStatus, newStatus: PlanBasedOrderStatus): boolean {
    return PLAN_BASED_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
  }
  
  static getStockOperation(status: PlanBasedOrderStatus): StockOperation {
    return STATUS_STOCK_OPERATIONS[status];
  }
  
  static isPlanBasedStatus(status: string): status is PlanBasedOrderStatus {
    return Object.keys(PLAN_BASED_STATUS_LABELS).includes(status);
  }
}