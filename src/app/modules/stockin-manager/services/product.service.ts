import { Injectable } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { DatabaseService } from '../../../core/services/database.service';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/services/auth.service';
import { CacheService } from '../../../core/services/cache.service';
import { ChangeDetectionService } from '../../../core/services/change-detection.service';
// import { FirebaseMetricsService } from '../../../core/services/firebase-metrics.service';
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
    private cacheService: CacheService,
    private changeDetectionService: ChangeDetectionService,
    // private firebaseMetricsService: FirebaseMetricsService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {}

  /**
   * Obtener productos con cache inteligente y lazy loading
   */
  getProductsWithCache(businessId: string): Observable<SKU[]> {
    const cacheKey = `products_${businessId}`;
    
    // Verificar si necesita refresh
    if (!this.changeDetectionService.needsRefresh('products', businessId)) {
      const cached = this.cacheService.get<SKU[]>(cacheKey, 'sessionStorage');
      if (cached) {
        console.log(`ProductService: Cache hit for ${businessId} (${cached.length} products)`);
        // this.firebaseMetricsService.trackCacheHit('products', businessId);
        return of(cached);
      }
    }

    // Consultar Firebase y actualizar cache
    console.log(`ProductService: Fetching fresh data for ${businessId}`);
    const startTime = Date.now();
    return from(this.databaseService.getOnce<SKU>('products', where('businessId', '==', businessId), where('isActive', '==', true)))
      .pipe(
        map((products: SKU[]) => products.sort((a: SKU, b: SKU) => a.name.localeCompare(b.name))),
        tap((products: SKU[]) => {
          // Tracking de métricas
          const responseTime = Date.now() - startTime;
          // this.firebaseMetricsService.trackFirebaseRead('products', businessId);
          // this.firebaseMetricsService.trackResponseTime(`products_${businessId}`, responseTime);
          
          // Actualizar cache (sessionStorage para datos por sesión)
          this.cacheService.set(cacheKey, products, 15 * 60 * 1000, 'sessionStorage'); // 15 minutos TTL
          
          // Marcar como actualizado
          this.changeDetectionService.markAsUpdated('products', businessId);
          
          console.log(`ProductService: Cached ${products.length} products for ${businessId} (${responseTime}ms)`);
        })
      );
  }

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

      if (!businessId) {
        return { items: [], lastDoc: null, hasMore: false };
      }

      // Usar cache para obtener productos
      const products = await this.getProductsWithCache(businessId).toPromise() as SKU[];
      if (!products) {
        return { items: [], lastDoc: null, hasMore: false };
      }

      // Aplicar filtros client-side
      let filteredItems = [...products];

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

      // Aplicar ordenamiento
      filteredItems.sort((a, b) => {
        const aValue = (a as any)[sortField] || '';
        const bValue = (b as any)[sortField] || '';
        
        if (sortDirection === 'asc') {
          return aValue.toString().localeCompare(bValue.toString());
        } else {
          return bValue.toString().localeCompare(aValue.toString());
        }
      });

      // Aplicar paginación client-side
      const startIndex = lastDoc ? 0 : 0; // Simplificado para el ejemplo
      const endIndex = startIndex + pageSize;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredItems.length;

      return {
        items: paginatedItems,
        lastDoc: paginatedItems.length > 0 ? null : null, // Simplificado
        hasMore
      };
    } catch (error) {
      console.error('Error getting products:', error);
      return { items: [], lastDoc: null, hasMore: false };
    }
  }

  async createProduct(product: Omit<SKU, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const productId = await this.databaseService.create('products', product);
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('products', product.businessId);
    
    console.log(`ProductService: Product created and cache invalidated for business ${product.businessId}`);

    return productId;
  }

  async updateProduct(id: string, product: Partial<SKU>): Promise<void> {
    await this.databaseService.update('products', id, product);
    
    // Obtener businessId para invalidar cache
    const businessId = await this.getBusinessId();
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('products', businessId);
    
    console.log(`ProductService: Product updated and cache invalidated for business ${businessId}`);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.databaseService.softDelete('products', id);
    
    // Obtener businessId para invalidar cache
    const businessId = await this.getBusinessId();
    
    // Solo invalidar cache, sin notificación adicional
    this.changeDetectionService.invalidateCollection('products', businessId);
    
    console.log(`ProductService: Product deleted and cache invalidated for business ${businessId}`);
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

  /**
   * Método utilitario para obtener businessId
   */
  private async getBusinessId(): Promise<string> {
    const isRoot = this.authService.isRoot();
    
    if (isRoot) {
      const businessId = this.rootBusinessSelector.getEffectiveBusinessId();
      if (!businessId) {
        throw new Error('No se encontró el ID del negocio');
      }
      return businessId;
    } else {
      const businessId = await this.businessService.getCurrentBusinessId();
      if (!businessId) {
        throw new Error('No se encontró el ID del negocio');
      }
      return businessId;
    }
  }
}
