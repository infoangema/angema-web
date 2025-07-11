import { Injectable } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
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
    private authService: AuthService
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
      const businessId = await this.businessService.getCurrentBusinessId();
      
      console.log('=== PRODUCT SERVICE DEBUG ===');
      console.log('Is Root user:', isRoot);
      console.log('Current businessId from service:', businessId);
      console.log('BusinessId type:', typeof businessId);
      console.log('BusinessId length:', businessId?.length);
      console.log('Filters applied:', filters);

      const whereConditions = [];
      
      // Only add business filter for non-Root users
      if (!isRoot && businessId) {
        whereConditions.push({ field: 'businessId', operator: '==', value: businessId });
      } else if (!isRoot && !businessId) {
        console.error('No business ID found for non-Root user!');
        return { items: [], lastDoc: null, hasMore: false };
      }

      // Debug: Let's also try a direct query without filters to see what happens
      console.log('Testing direct query without business filter...');
      const directResult = await this.databaseService.getOnce<SKU>('products');
      console.log('Direct query result:', directResult.length, 'products');
      if (directResult.length > 0) {
        console.log('First product businessId:', `"${directResult[0].businessId}"`);
        console.log('Current businessId:', `"${businessId}"`);
        console.log('Are they equal?', directResult[0].businessId === businessId);
        console.log('BusinessId comparison details:');
        console.log('- Product businessId length:', directResult[0].businessId?.length);
        console.log('- Current businessId length:', businessId?.length);
        console.log('- Product businessId type:', typeof directResult[0].businessId);
        console.log('- Current businessId type:', typeof businessId);
      }

      // Filtros básicos
      if (filters.category) {
        whereConditions.push({ field: 'category', operator: '==', value: filters.category });
      }
      if (filters.warehouse) {
        whereConditions.push({ field: 'location.warehouseId', operator: '==', value: filters.warehouse });
      }
      if (filters.lowStock) {
        whereConditions.push({ field: 'stock.current', operator: '<=', value: '5' });
      }
      // Temporarily disable active filter for debugging
      // if (filters.active !== undefined) {
      //   whereConditions.push({ field: 'isActive', operator: '==', value: filters.active.toString() });
      // }

      console.log('Where conditions:', whereConditions);

      // Let's try a simple query using the database service's getOnce method
      console.log('Trying simple businessId query...');
      try {
        const simpleResult = await this.databaseService.getOnce<SKU>('products', 
          where('businessId', '==', businessId)
        );
        console.log('Simple query result:', simpleResult.length, 'products');
      } catch (error) {
        console.log('Simple query error:', error);
      }

      // Query products with or without business filter based on user role
      const queryOptions: any = {
        pageSize,
        startAfter: lastDoc || undefined
      };
      
      if (whereConditions.length > 0) {
        queryOptions.where = whereConditions;
      }
      
      const result = await this.databaseService.query<SKU>('products', queryOptions);

      console.log('Query result:', result);
      console.log('Found products:', result.items.length);

      // Apply client-side filtering for other filters
      let filteredItems = result.items;
      
      if (filters.category) {
        filteredItems = filteredItems.filter(p => p.category === filters.category);
      }
      
      if (filters.warehouse) {
        filteredItems = filteredItems.filter(p => p.location?.warehouseId === filters.warehouse);
      }
      
      if (filters.lowStock) {
        filteredItems = filteredItems.filter(p => p.stock?.current <= 5);
      }
      
      if (filters.active !== undefined) {
        filteredItems = filteredItems.filter(p => p.isActive === filters.active);
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredItems = filteredItems.filter(p => 
          p.name.toLowerCase().includes(searchTerm) ||
          p.code?.toLowerCase().includes(searchTerm) ||
          p.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply client-side sorting
      if (sortField) {
        filteredItems.sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          // Handle nested field access
          if (sortField === 'stock.current') {
            aValue = a.stock?.current || 0;
            bValue = b.stock?.current || 0;
          } else if (sortField === 'pricing.price') {
            aValue = a.pricing?.price || 0;
            bValue = b.pricing?.price || 0;
          } else if (sortField === 'pricing.cost') {
            aValue = a.pricing?.cost || 0;
            bValue = b.pricing?.cost || 0;
          } else {
            aValue = (a as any)[sortField];
            bValue = (b as any)[sortField];
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' 
              ? aValue - bValue
              : bValue - aValue;
          }
          return 0;
        });
      }
      
      console.log('After client-side filtering:', filteredItems.length, 'products');

      return {
        items: filteredItems,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  async createProduct(product: Omit<SKU, 'id'>): Promise<string> {
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

  // Debug method to get all products without filters
  async getAllProducts(): Promise<SKU[]> {
    try {
      console.log('Getting ALL products from Firebase...');
      const result = await this.databaseService.getOnce<SKU>('products');
      console.log('All products found:', result.length);
      console.log('Products:', result);

      // Debug: List all unique business IDs
      const businessIds = new Set(result.map(p => p.businessId));
      console.log('Unique business IDs in products:', Array.from(businessIds));

      return result;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }

  // Debug method to verify business ID consistency
  async debugBusinessIdConsistency(): Promise<void> {
    try {
      console.log('=== BUSINESS ID CONSISTENCY CHECK ===');

      const isRoot = this.authService.isRoot();
      console.log('Is Root user:', isRoot);

      // Get current business ID
      const currentBusinessId = await this.businessService.getCurrentBusinessId();
      console.log('Current business ID:', currentBusinessId);

      // Get all products
      const allProducts = await this.getAllProducts();

      if (isRoot) {
        console.log('Root user - showing all products from all businesses');
        const businessGroups = allProducts.reduce((groups, product) => {
          const businessId = product.businessId || 'no-business';
          if (!groups[businessId]) groups[businessId] = [];
          groups[businessId].push(product);
          return groups;
        }, {} as Record<string, SKU[]>);
        
        Object.entries(businessGroups).forEach(([businessId, products]) => {
          console.log(`Business ${businessId}: ${products.length} products`);
        });
      } else if (currentBusinessId) {
        // Check how many products match current business ID
        const matchingProducts = allProducts.filter(p => p.businessId === currentBusinessId);
        const differentBusinessIds = allProducts.filter(p => p.businessId !== currentBusinessId);

        console.log(`Products with current business ID (${currentBusinessId}):`, matchingProducts.length);
        console.log(`Products with different business IDs:`, differentBusinessIds.length);

        if (differentBusinessIds.length > 0) {
          console.log('Products with different business IDs:');
          differentBusinessIds.forEach(p => {
            console.log(`- Product "${p.name}" has businessId: "${p.businessId}"`);
          });
        }
      }
    } catch (error) {
      console.error('Error in business ID consistency check:', error);
    }
  }
}
