import { Timestamp } from '@angular/fire/firestore';

export interface Category {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CategoryHierarchy extends Category {
  children?: CategoryHierarchy[];
} 