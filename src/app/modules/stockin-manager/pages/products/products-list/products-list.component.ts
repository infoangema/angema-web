import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DocumentSnapshot } from '@angular/fire/firestore';

import { SKU, SKUFilters, SortField, SortDirection } from '../../../models/sku.model';
import { Category } from '../../../models/category.model';
import { Warehouse } from '../../../models/warehouse.model';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { WarehouseService } from '../../../services/warehouse.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { Business } from '../../../../../core/models/business.model';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: SKU[] = [];
  categories: Category[] = [];
  warehouses: Warehouse[] = [];
  businesses: Business[] = [];
  
  // Propiedades para control de visibilidad
  get isRoot(): boolean {
    return this.authService.isRoot();
  }
  
  get canViewCost(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }
  
  // Filtros
  filters: SKUFilters = {
    search: '',
    category: null,
    warehouse: null,
    lowStock: false,
    active: true
  };

  // Paginación
  currentPage = 1;
  pageSize = 10;
  hasMorePages = false;

  // Ordenamiento
  sortField: SortField = 'name';
  sortDirection: SortDirection = 'asc';

  private destroy$ = new Subject<void>();
  private lastDoc: DocumentSnapshot<SKU> | null = null;
  private loading = false;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadInitialData(): Promise<void> {
    // Cargar categorías
    this.categoryService.watchCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => this.categories = categories);

    // Cargar almacenes
    this.warehouseService.watchWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouses => this.warehouses = warehouses);

    // Cargar negocios solo si es usuario root
    if (this.isRoot) {
      this.businessService.getBusinesses()
        .pipe(takeUntil(this.destroy$))
        .subscribe(businesses => this.businesses = businesses);
    }

    // Cargar productos
    await this.loadProducts();
  }

  async loadProducts(resetPagination: boolean = false): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    if (resetPagination) {
      this.currentPage = 1;
      this.lastDoc = null;
    }

    try {
      // Debug: Check business ID consistency first
      await this.productService.debugBusinessIdConsistency();
      
      const result = await this.productService.getProductsByBusiness(
        this.filters,
        this.pageSize,
        this.lastDoc,
        this.sortField,
        this.sortDirection
      );
      
      if (resetPagination) {
        this.products = result.items;
      } else {
        this.products = [...this.products, ...result.items];
      }
      
      this.lastDoc = result.lastDoc;
      this.hasMorePages = result.hasMore;
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      this.loading = false;
    }
  }

  // Manejadores de paginación
  async nextPage(): Promise<void> {
    if (this.hasMorePages && !this.loading) {
      this.currentPage++;
      await this.loadProducts();
    }
  }

  async previousPage(): Promise<void> {
    if (this.currentPage > 1 && !this.loading) {
      this.currentPage--;
      // Necesitamos recargar desde el principio hasta la página actual
      this.lastDoc = null;
      this.products = [];
      for (let i = 0; i < this.currentPage; i++) {
        await this.loadProducts();
      }
    }
  }

  async onPageSizeChange(): Promise<void> {
    await this.loadProducts(true);
  }

  // Manejadores de ordenamiento
  async sortBy(field: SortField): Promise<void> {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    await this.loadProducts(true);
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return '↕️';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // Manejadores de filtros
  async onFiltersChange(): Promise<void> {
    await this.loadProducts(true);
  }

  // Utilidades
  getWarehouseName(warehouseId: string): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'No asignado';
  }
  
  getBusinessName(businessId: string): string {
    const business = this.businesses.find(b => b.id === businessId);
    return business?.name || 'No asignado';
  }

  // Acciones de productos
  createProduct(): void {
    // This method is called by the parent component but the modal is handled there
    // We can remove this method or keep it for compatibility
  }

  editProduct(product: SKU): void {
    this.router.navigate(['app', 'products', 'edit', product.id]);
  }

  async deleteProduct(product: SKU): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar el producto ${product.name}?`)) {
      await this.productService.deleteProduct(product.id);
      await this.loadProducts(true);
    }
  }
} 