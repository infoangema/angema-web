import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SKU } from '../../../models/sku.model';
import { Category } from '../../../models/category.model';
import { Warehouse } from '../../../models/warehouse.model';
import { Business } from '../../../../../core/models/business.model';
import { Attribute } from '../../../models/attribute.model';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { WarehouseService } from '../../../services/warehouse.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AttributeService } from '../../../services/attribute.service';

@Component({
  selector: 'app-edit-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './edit-product.modal.html',
  styleUrls: ['./edit-product.modal.css']
})
export class EditProductModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() product: SKU | null = null;
  @Input() isVisible = false;
  @Output() productUpdated = new EventEmitter<void>();
  @Output() productDeleted = new EventEmitter<void>();
  @Output() modalClose = new EventEmitter<void>();

  productForm!: FormGroup;
  categories: Category[] = [];
  warehouses: Warehouse[] = [];
  businesses: Business[] = [];
  colors: Attribute[] = [];
  sizes: Attribute[] = [];
  materials: Attribute[] = [];
  loading = false;

  activeTab = 'details';
  tabs = [
    { id: 'details', label: 'Detalles' },
    { id: 'stock', label: 'Stock' },
    { id: 'pricing', label: 'Precios' },
    { id: 'status', label: 'Estado' }
  ];

  private destroy$ = new Subject<void>();

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

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private warehouseService: WarehouseService,
    private businessService: BusinessService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private attributeService: AttributeService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(): void {
    if (this.product && this.productForm) {
      this.updateFormWithProduct();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.productForm = this.fb.group({
      code: [''],
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      businessId: [''],
      color: [''],
      size: [''],
      material: [''],
      currentStock: [0, [Validators.required, Validators.min(0)]],
      minimumStock: [0, [Validators.required, Validators.min(0)]],
      reservedStock: [0],
      warehouseId: ['', Validators.required],
      sector: [''],
      position: [''],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });

    // Si no es root, no necesita validación de businessId
    if (!this.isRoot) {
      this.productForm.get('businessId')?.clearValidators();
    }

    // Si no puede ver costos, no necesita validación de cost
    if (!this.canViewCost) {
      this.productForm.get('cost')?.clearValidators();
    }
  }

  private loadData(): void {
    // Cargar categorías
    this.categoryService.watchCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => this.categories = categories);

    // Cargar almacenes
    this.warehouseService.watchWarehouses()
      .pipe(takeUntil(this.destroy$))
      .subscribe(warehouses => this.warehouses = warehouses);

    // Cargar atributos dinámicos
    this.loadAttributes();

    // Cargar negocios solo si es root
    if (this.isRoot) {
      this.businessService.getBusinesses()
        .pipe(takeUntil(this.destroy$))
        .subscribe(businesses => this.businesses = businesses);
    }

    // Actualizar formulario cuando cambie el producto
    if (this.product) {
      this.updateFormWithProduct();
    }
  }

  private updateFormWithProduct(): void {
    if (!this.product) return;

    this.productForm.patchValue({
      code: this.product.code,
      name: this.product.name,
      description: this.product.description || '',
      category: this.product.category,
      businessId: this.product.businessId,
      color: this.product.attributes?.color || '',
      size: this.product.attributes?.size || '',
      material: this.product.attributes?.material || '',
      currentStock: this.product.stock?.current || 0,
      minimumStock: this.product.stock?.minimum || 0,
      reservedStock: this.product.stock?.reserved || 0,
      warehouseId: this.product.location?.warehouseId || '',
      sector: this.product.location?.sector || '',
      position: this.product.location?.position || '',
      cost: this.product.pricing?.cost || 0,
      price: this.product.pricing?.price || 0,
      isActive: this.product.isActive
    });
  }

  getTabClasses(tabId: string): string {
    const baseClasses = 'whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors';
    if (this.activeTab === tabId) {
      return `${baseClasses} border-blue-500 text-blue-600`;
    }
    return `${baseClasses} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`;
  }

  calculateProfitMargin(): string {
    const cost = this.productForm.get('cost')?.value || 0;
    const price = this.productForm.get('price')?.value || 0;
    
    if (cost === 0 || price === 0) return '0';
    
    const margin = ((price - cost) / price) * 100;
    return margin.toFixed(1);
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid || !this.product) return;

    // Debug: Check product data
    console.log('EditProductModal.onSubmit called with:');
    console.log('- Product:', this.product);
    console.log('- Product ID:', `"${this.product.id}"`);
    console.log('- Product ID type:', typeof this.product.id);
    console.log('- Product ID length:', this.product.id?.length);

    this.loading = true;
    try {
      const formValue = this.productForm.value;
      
      const updatedProduct: Partial<SKU> = {
        name: formValue.name,
        description: formValue.description,
        category: formValue.category,
        attributes: {
          color: formValue.color,
          size: formValue.size,
          material: formValue.material
        },
        stock: {
          current: formValue.currentStock,
          minimum: formValue.minimumStock,
          reserved: formValue.reservedStock
        },
        location: {
          warehouseId: formValue.warehouseId,
          sector: formValue.sector,
          position: formValue.position
        },
        pricing: {
          cost: formValue.cost,
          price: formValue.price
        },
        isActive: formValue.isActive,
        updatedAt: new Date() as any
      };

      // Solo actualizar businessId si es root
      if (this.isRoot) {
        updatedProduct.businessId = formValue.businessId;
      }

      await this.productService.updateProduct(this.product.id, updatedProduct);
      
      this.notificationService.success('Producto actualizado correctamente');
      this.productUpdated.emit();
      this.closeModal();
      
    } catch (error) {
      console.error('Error updating product:', error);
      this.notificationService.error('Error al actualizar el producto');
    } finally {
      this.loading = false;
    }
  }

  async toggleProductStatus(): Promise<void> {
    if (!this.product) return;

    try {
      const newStatus = !this.product.isActive;
      await this.productService.updateProduct(this.product.id, { 
        isActive: newStatus,
        updatedAt: new Date() as any
      });
      
      this.product.isActive = newStatus;
      this.productForm.patchValue({ isActive: newStatus });
      
      this.notificationService.success(
        `Producto ${newStatus ? 'activado' : 'desactivado'} correctamente`
      );
      this.productUpdated.emit();
      
    } catch (error) {
      console.error('Error toggling product status:', error);
      this.notificationService.error('Error al cambiar el estado del producto');
    }
  }

  async deleteProduct(): Promise<void> {
    if (!this.product) return;

    const confirmed = confirm(`¿Estás seguro de eliminar el producto "${this.product.name}"? Esta acción no se puede deshacer.`);
    
    if (confirmed) {
      try {
        await this.productService.deleteProduct(this.product.id);
        this.notificationService.success('Producto eliminado correctamente');
        this.productDeleted.emit();
        this.closeModal();
        
      } catch (error) {
        console.error('Error deleting product:', error);
        this.notificationService.error('Error al eliminar el producto');
      }
    }
  }

  private loadAttributes(): void {
    // Cargar colores
    this.attributeService.getAttributesByType('color')
      .pipe(takeUntil(this.destroy$))
      .subscribe(colors => this.colors = colors);

    // Cargar tamaños
    this.attributeService.getAttributesByType('size')
      .pipe(takeUntil(this.destroy$))
      .subscribe(sizes => this.sizes = sizes);

    // Cargar materiales
    this.attributeService.getAttributesByType('material')
      .pipe(takeUntil(this.destroy$))
      .subscribe(materials => this.materials = materials);
  }

  closeModal(): void {
    this.isVisible = false;
    this.activeTab = 'details';
    this.modalClose.emit();
  }
}