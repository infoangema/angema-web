export interface Attribute {
  id: string;
  businessId: string;
  type: AttributeType;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AttributeType = 'color' | 'size' | 'material';

export interface AttributeFilters {
  search: string;
  type: AttributeType | null;
  active: boolean | null;
}

export interface CreateAttributeRequest {
  type: AttributeType;
  code: string;
  name: string;
  description?: string;
  sortOrder?: number;
}