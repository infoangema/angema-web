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
import { RootBusinessSelectorService } from '../../../services/root-business-selector.service';
import { EditProductModalComponent } from '../edit-product/edit-product.modal';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, EditProductModalComponent],
  templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit, OnDestroy {
  products: SKU[] = [];
  categories: Category[] = [];
  warehouses: Warehouse[] = [];
  businesses: Business[] = [];

  // Edit modal state
  selectedProduct: SKU | null = null;
  isEditModalVisible = false;
  
  // Propiedades para control de visibilidad
  get isRoot(): boolean {
    return this.authService.isRoot();
  }
  
  get canViewCost(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }

  get canManageProduct(): boolean {
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
    private rootBusinessSelector: RootBusinessSelectorService,
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
    
    // Verificar si el usuario root tiene negocio seleccionado
    if (this.isRoot && !this.rootBusinessSelector.hasValidSelection()) {
      console.log('ProductsList: Usuario root sin negocio seleccionado, redirigiendo al dashboard...');
      this.router.navigate(['/app/dashboard']);
      return;
    }
    
    this.loading = true;

    if (resetPagination) {
      this.currentPage = 1;
      this.lastDoc = null;
    }

    try {
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
        // Avoid duplicates when appending new items
        const existingIds = new Set(this.products.map(p => p.id));
        const newItems = result.items.filter(item => !existingIds.has(item.id));
        this.products = [...this.products, ...newItems];
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
    // Debug: Check product data before opening modal
    console.log('ProductsList.editProduct called with:');
    console.log('- Product:', product);
    console.log('- Product ID:', `"${product.id}"`);
    console.log('- Product ID type:', typeof product.id);
    console.log('- Product ID length:', product.id?.length);

    this.selectedProduct = product;
    this.isEditModalVisible = true;
  }

  async deleteProduct(product: SKU): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar el producto ${product.name}?`)) {
      await this.productService.deleteProduct(product.id);
      await this.loadProducts(true);
    }
  }

  // Edit modal handlers
  onProductUpdated(): void {
    this.loadProducts(true);
    this.closeEditModal();
  }

  onProductDeleted(): void {
    this.loadProducts(true);
    this.closeEditModal();
  }

  closeEditModal(): void {
    this.isEditModalVisible = false;
    this.selectedProduct = null;
  }
} 