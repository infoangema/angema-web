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
  status: OrderStatus;
  statusHistory: StatusChange[];
  
  // Financial data
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  
  // Additional info
  notes?: string;
  
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
  status: OrderStatus;
  timestamp: Date;
  userId: string;
  userName: string;
  reason?: string; // Optional reason for status change
}

export type OrderSource = 'manual' | 'mercadolibre' | 'tiendanube' | 'website';

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

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
  status?: OrderStatus;
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

// Status labels for UI
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

// Status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
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
}