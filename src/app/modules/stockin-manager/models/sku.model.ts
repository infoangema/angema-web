import { Timestamp, DocumentSnapshot } from '@angular/fire/firestore';

export interface SKU {
  id: string;
  businessId: string;
  code: string;
  name: string;
  description: string;
  category: string;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
    [key: string]: any;
  };
  location: {
    warehouseId: string;
    sector: string;
    position: string;
  };
  stock: {
    current: number;
    minimum: number;
    reserved: number;
  };
  pricing: {
    cost: number;
    price: number;
  };
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SKUFilters {
  search: string;
  category: string | null;
  warehouse: string | null;
  lowStock: boolean;
  active: boolean;
}

export interface ProductsResponse {
  items: SKU[];
  lastDoc: DocumentSnapshot<SKU> | null;
  hasMore: boolean;
}

export type SortField = 'name' | 'code' | 'stock.current' | 'pricing.price' | 'pricing.cost';
export type SortDirection = 'asc' | 'desc'; 