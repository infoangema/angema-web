import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Timestamp, serverTimestamp } from '@angular/fire/firestore';

import { SKU } from '../../../models/sku.model';
import { Category } from '../../../models/category.model';
import { Warehouse, WarehouseSector } from '../../../models/warehouse.model';

import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { WarehouseService } from '../../../services/warehouse.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-create-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div class="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                <h3 class="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">Nuevo Producto</h3>
                <div class="mt-4">
                  <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="space-y-4">
                    <!-- Código SKU generado -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Código SKU</label>
                      <input type="text" formControlName="code" readonly
                        class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500">
                      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        El código SKU se genera automáticamente
                      </p>
                    </div>

                    <!-- Información básica -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre</label>
                      <input type="text" formControlName="name"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                      <textarea formControlName="description" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>

                    <!-- Categoría y Almacén -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Categoría</label>
                        <select formControlName="category"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona una categoría</option>
                          <option *ngFor="let category of categories" [value]="category.id">
                            {{category.name}}
                          </option>
                        </select>
                      </div>

                      <div formGroupName="location">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Almacén</label>
                        <select formControlName="warehouseId" (change)="onWarehouseChange($event)"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona un almacén</option>
                          <option *ngFor="let warehouse of warehouses" [value]="warehouse.id">
                            {{warehouse.name}}
                          </option>
                        </select>
                      </div>
                    </div>

                    <!-- Ubicación -->
                    <div formGroupName="location" class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Sector</label>
                        <select formControlName="sector" (change)="onSectorChange($event)"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona un sector</option>
                          <option *ngFor="let sector of availableSectors" [value]="sector.id">
                            {{sector.name}}
                          </option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Posición</label>
                        <select formControlName="position"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona una posición</option>
                          <option *ngFor="let position of availablePositions" [value]="position">
                            {{position}}
                          </option>
                        </select>
                      </div>
                    </div>

                    <!-- Atributos -->
                    <div formGroupName="attributes" class="grid grid-cols-3 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Color</label>
                        <select formControlName="color"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Seleccionar</option>
                          <option value="BLA">Blanco</option>
                          <option value="NEG">Negro</option>
                          <option value="ROJ">Rojo</option>
                          <option value="AZU">Azul</option>
                          <!-- Agregar más colores según necesidad -->
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Tamaño</label>
                        <select formControlName="size"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Seleccionar</option>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <!-- Agregar más tamaños según necesidad -->
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Material</label>
                        <select formControlName="material"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Seleccionar</option>
                          <option value="ALG">Algodón</option>
                          <option value="POL">Poliéster</option>
                          <option value="LAN">Lana</option>
                          <option value="NIL">Nylon</option>
                          <!-- Agregar más materiales según necesidad -->
                        </select>
                      </div>
                    </div>

                    <!-- Stock -->
                    <div class="grid grid-cols-3 gap-4">
                      <div formGroupName="stock">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Inicial</label>
                        <input type="number" formControlName="current"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      </div>

                      <div formGroupName="stock">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Mínimo</label>
                        <input type="number" formControlName="minimum"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      </div>

                      <div formGroupName="stock">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Reservado</label>
                        <input type="number" formControlName="reserved"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      </div>
                    </div>

                    <!-- Precios -->
                    <div class="grid grid-cols-2 gap-4">
                      <div formGroupName="pricing">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Costo</label>
                        <input type="number" formControlName="cost"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      </div>

                      <div formGroupName="pricing">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Precio de Venta</label>
                        <input type="number" formControlName="price"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                      </div>
                    </div>

                    <!-- Estado -->
                    <div class="flex items-center">
                      <input type="checkbox" formControlName="isActive"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                      <label class="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                        Producto activo
                      </label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button type="button" (click)="onSubmit()"
              [disabled]="productForm.invalid || loading"
              class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" (click)="onCancel()"
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreateProductModalComponent implements OnInit, OnDestroy {
  @Output() modalClose = new EventEmitter<void>();
  productForm: FormGroup;
  categories: Category[] = [];
  warehouses: Warehouse[] = [];
  availableSectors: WarehouseSector[] = [];
  availablePositions: string[] = [];
  loading = false;
  private subscriptions: Subscription[] = [];
  private lastGeneratedCounter = 0;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private warehouseService: WarehouseService,
    private businessService: BusinessService,
    private notificationService: NotificationService
  ) {
    this.productForm = this.fb.group({
      code: [{value: '', disabled: true}],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['', Validators.required],
      attributes: this.fb.group({
        color: [''],
        size: [''],
        material: ['']
      }),
      location: this.fb.group({
        warehouseId: ['', Validators.required],
        sector: ['', Validators.required],
        position: ['', Validators.required]
      }),
      stock: this.fb.group({
        current: [0, [Validators.required, Validators.min(0)]],
        minimum: [0, [Validators.required, Validators.min(0)]],
        reserved: [0]
      }),
      pricing: this.fb.group({
        cost: [0, [Validators.required, Validators.min(0)]],
        price: [0, [Validators.required, Validators.min(0)]]
      }),
      isActive: [true]
    });

    this.setupSkuGeneration();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadWarehouses();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCategories(): void {
    const sub = this.categoryService.watchCategories()
      .subscribe(categories => this.categories = categories);
    this.subscriptions.push(sub);
  }

  private loadWarehouses(): void {
    const sub = this.warehouseService.watchWarehouses()
      .subscribe(warehouses => this.warehouses = warehouses);
    this.subscriptions.push(sub);
  }

  private setupSkuGeneration(): void {
    const locationForm = this.productForm.get('location');
    const attributesForm = this.productForm.get('attributes');
    const categoryControl = this.productForm.get('category');

    if (locationForm && attributesForm && categoryControl) {
      const subscription = combineLatest([
        locationForm.get('warehouseId')!.valueChanges,
        categoryControl.valueChanges,
        attributesForm.get('color')!.valueChanges,
        attributesForm.get('size')!.valueChanges
      ]).pipe(
        distinctUntilChanged(),
        map(([warehouseId, categoryId, color, size]) => {
          if (warehouseId && categoryId && color && size) {
            return this.generateSku(warehouseId, categoryId, color, size);
          }
          return '';
        })
      ).subscribe(sku => {
        if (sku) {
          this.productForm.patchValue({ code: sku }, { emitEvent: false });
        }
      });

      this.subscriptions.push(subscription);
    }
  }

  private generateSku(warehouseId: string, categoryId: string, color: string, size: string): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    const category = this.categories.find(c => c.id === categoryId);

    if (!warehouse || !category) {
      return '';
    }

    const prefix = `${warehouse.code}-${this.getCategoryCode(category.name)}-${color}-${size}`;
    this.lastGeneratedCounter++;
    const counter = this.lastGeneratedCounter.toString().padStart(4, '0');

    return `${prefix}-${counter}`;
  }

  private getCategoryCode(categoryName: string): string {
    return categoryName
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3)
      .padEnd(3, 'X');
  }

  onWarehouseChange(event: any): void {
    const warehouseId = event.target.value;
    const locationForm = this.productForm.get('location');

    locationForm?.patchValue({
      warehouseId,
      sector: '',
      position: ''
    });

    this.availableSectors = [];
    this.availablePositions = [];

    if (warehouseId) {
      const selectedWarehouse = this.warehouses.find(w => w.id === warehouseId);
      if (selectedWarehouse?.sectors) {
        this.availableSectors = selectedWarehouse.sectors;
      }
    }
  }

  onSectorChange(event: any): void {
    const sectorId = event.target.value;
    const locationForm = this.productForm.get('location');
    const warehouseId = locationForm?.get('warehouseId')?.value;

    locationForm?.patchValue({
      warehouseId,
      sector: sectorId,
      position: ''
    });

    this.availablePositions = [];

    if (sectorId && warehouseId) {
      const selectedWarehouse = this.warehouses.find(w => w.id === warehouseId);
      const selectedSector = selectedWarehouse?.sectors?.find(s => s.id === sectorId);
      if (selectedSector?.positions) {
        this.availablePositions = selectedSector.positions;
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid || this.loading) return;

    this.loading = true;
    try {
      const formValue = this.productForm.getRawValue();
      const businessId = await this.businessService.getCurrentBusinessId();

      if (!businessId) {
        throw new Error('No se encontró el ID del negocio');
      }

      const product: Omit<SKU, 'id'> = {
        businessId,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description || '',
        category: formValue.category,
        attributes: {
          color: formValue.attributes.color || '',
          size: formValue.attributes.size || '',
          material: formValue.attributes.material || ''
        },
        location: {
          warehouseId: formValue.location.warehouseId,
          sector: formValue.location.sector,
          position: formValue.location.position
        },
        stock: {
          current: Number(formValue.stock.current) || 0,
          minimum: Number(formValue.stock.minimum) || 0,
          reserved: 0
        },
        pricing: {
          cost: Number(formValue.pricing.cost) || 0,
          price: Number(formValue.pricing.price) || 0
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.productService.createProduct(product);
      this.notificationService.success('Producto creado exitosamente');
      this.closeModal();
    } catch (error) {
      console.error('Error creando producto:', error);
      this.notificationService.error('Error al crear el producto');
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.closeModal();
  }

  closeModal(): void {
    this.modalClose.emit();
  }
}
