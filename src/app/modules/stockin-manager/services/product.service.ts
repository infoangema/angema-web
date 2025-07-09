import { Injectable } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { SKU, SKUFilters, ProductsResponse, SortField, SortDirection } from '../models/sku.model';
import { DocumentSnapshot } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(
    private databaseService: DatabaseService,
    private businessService: BusinessService
  ) {}

  async getProductsByBusiness(
    filters: SKUFilters,
    pageSize: number = 10,
    lastDoc: DocumentSnapshot<any> | null = null,
    sortField: SortField = 'name',
    sortDirection: SortDirection = 'asc'
  ): Promise<ProductsResponse> {
    try {
      const businessId = await this.businessService.getCurrentBusinessId();
      const whereConditions = [
        { field: 'businessId', operator: '==', value: businessId }
      ];

      // Filtros básicos
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }
      if (filters.warehouse) {
        whereConditions.push({ field: 'location.warehouseId', operator: '==', value: filters.warehouse });
      }
      if (filters.lowStock) {
        whereConditions.push({ field: 'stock.current', operator: '<=', value: '5' }); // Valor por defecto como string
      }
      if (filters.active !== undefined) {
        whereConditions.push({ field: 'isActive', operator: '==', value: filters.active ? 'true' : 'false' });
      }

      const result = await this.databaseService.query<SKU>('products', {
        where: whereConditions,
        orderBy: [{ field: sortField, direction: sortDirection }],
        pageSize,
        startAfter: lastDoc || undefined
      });
      
      return {
        items: result.items,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async createProduct(product: SKU): Promise<string> {
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
} 