export interface Business {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: 'basic' | 'premium' | 'enterprise';
  createdAt?: Date;
  isActive: boolean;
  settings: BusinessSettings;
}

export interface BusinessSettings {
  currency: string;
  timezone: string;
  lowStockThreshold: number;
}

export interface CreateBusinessRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: 'basic' | 'premium' | 'enterprise';
  adminUser: {
    email: string;
    displayName: string;
    password: string;
  };
}

export interface User {
  id?: string;
  email: string;
  displayName: string;
  businessId?: string;
  roleId: string;
  isActive: boolean;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
  businessId?: string;
  roleId: string;
  isActive: boolean;
}

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  currency: 'ARS',
  timezone: 'America/Argentina/Buenos_Aires',
  lowStockThreshold: 5
}; 