export interface Customer {
  id: string;
  businessId: string;
  
  // Información básica
  code: string;                    // Código único del cliente
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  
  // Información de contacto
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Información comercial
  customerType: CustomerType;
  isActive: boolean;
  creditLimit?: number;
  loyaltyPoints: number;           // Puntos de fidelización
  totalPurchases: number;          // Total gastado histórico
  lastPurchaseDate?: Date;
  customerSince: Date;             // Fecha de registro
  
  // Notas y observaciones
  notes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentType = 'dni' | 'passport' | 'license' | 'ruc' | 'other';

export type CustomerType = 'individual' | 'business' | 'wholesale' | 'vip';

export interface CustomerFilters {
  search: string;
  type: CustomerType | null;
  active: boolean | null;
  city: string | null;
}

export interface CreateCustomerRequest {
  code?: string;                   // Opcional, se auto-genera si no se proporciona
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType: CustomerType;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateCustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: CustomerType;
  creditLimit?: number;
  notes?: string;
  isActive?: boolean;
  loyaltyPoints?: number;
  totalPurchases?: number;
  lastPurchaseDate?: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  totalLoyaltyPoints: number;
  totalRevenue: number;
  averageOrderValue: number;
  customersByType: Record<CustomerType, number>;
}

export interface CustomerPurchaseHistory {
  customerId: string;
  orderNumber: string;
  orderDate: Date;
  totalAmount: number;
  status: string;
  pointsEarned: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minPurchases?: number;
    maxPurchases?: number;
    minTotalSpent?: number;
    maxTotalSpent?: number;
    customerType?: CustomerType[];
    lastPurchaseDays?: number;
  };
  customerCount: number;
}