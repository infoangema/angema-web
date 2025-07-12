import { Injectable } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { RootBusinessSelectorService } from './root-business-selector.service';
import { SKU, SKUFilters, ProductsResponse, SortField, SortDirection } from '../models/sku.model';
import { DocumentSnapshot } from '@angular/fire/firestore';
import { where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private databaseService: DatabaseService,
    private businessService: BusinessService,
    private authService: AuthService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  async getProductsByBusiness(
    filters: SKUFilters,
    pageSize: number = 10,
    lastDoc: DocumentSnapshot<any> | null = null,
    sortField: SortField = 'name',
    sortDirection: SortDirection = 'asc'
  ): Promise<ProductsResponse> {
    try {
      const isRoot = this.authService.isRoot();
      let businessId: string | null = null;

      if (isRoot) {
        businessId = this.rootBusinessSelector.getEffectiveBusinessId();
      } else {
        businessId = await this.businessService.getCurrentBusinessId();
      }

      // Simplified query to avoid Firestore tracking errors
      const queryOptions: any = {
        pageSize,
        orderBy: [{ field: sortField, direction: sortDirection }]
      };

      // Only add business filter when necessary
      if (businessId && !isRoot) {
        queryOptions.where = [{ field: 'businessId', operator: '==', value: businessId }];
      } else if (businessId && isRoot) {
        queryOptions.where = [{ field: 'businessId', operator: '==', value: businessId }];
      }

      // Always filter for active products
      if (!queryOptions.where) {
        queryOptions.where = [];
      }
      queryOptions.where.push({ field: 'isActive', operator: '==', value: true });

      if (lastDoc) {
        queryOptions.startAfter = lastDoc;
      }

      const result = await this.databaseService.query<SKU>('products', queryOptions);

      // Apply client-side filtering for complex filters
      let filteredItems = result.items;

      if (filters.category) {
        filteredItems = filteredItems.filter(p => p.category === filters.category);
      }

      if (filters.warehouse) {
        filteredItems = filteredItems.filter(p => p.location?.warehouseId === filters.warehouse);
      }

      if (filters.lowStock) {
        filteredItems = filteredItems.filter(p => p.stock?.current <= p.stock?.minimum);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(p => 
          p.name?.toLowerCase().includes(searchTerm) ||
          p.code?.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm)
        );
      }

      return {
        items: filteredItems,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return { items: [], lastDoc: null, hasMore: false };
    }
  }

  async createProduct(product: Omit<SKU, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.databaseService.create('products', product);
  }

  async updateProduct(id: string, product: Partial<SKU>): Promise<void> {
    await this.databaseService.update('products', id, product);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.databaseService.softDelete('products', id);
  }

  async getProductById(id: string): Promise<SKU | null> {
    return this.databaseService.getById<SKU>('products', id);
  }

  // Simplified method to get all products for debugging
  async getAllProducts(): Promise<SKU[]> {
    try {
      const result = await this.databaseService.getOnce<SKU>('products');
      return result;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }

  // Simplified debug method
  async debugBusinessIdConsistency(): Promise<void> {
    // This method is kept for compatibility but simplified to reduce console noise
    try {
      const allProducts = await this.getAllProducts();
      console.log(`Total products in database: ${allProducts.length}`);
    } catch (error) {
      console.error('Error in business ID consistency check:', error);
    }
  }
}
