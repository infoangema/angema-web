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
import { AttributeService } from '../../../services/attribute.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { RootBusinessSelectorService } from '../../../services/root-business-selector.service';
import { Attribute } from '../../../models/attribute.model';

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
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre *</label>
                      <input type="text" formControlName="name"
                        [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                        (productForm.get('name')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                      @if (productForm.get('name')?.invalid && showValidationErrors) {
                        <p class="mt-1 text-sm text-red-600">Este campo es obligatorio (mínimo 3 caracteres)</p>
                      }
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Descripción *</label>
                      <textarea formControlName="description" rows="3"
                        [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                        (productForm.get('description')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')"></textarea>
                      @if (productForm.get('description')?.invalid && showValidationErrors) {
                        <p class="mt-1 text-sm text-red-600">La descripción es obligatoria</p>
                      }
                    </div>

                    <!-- Categoría y Almacén -->
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Categoría *</label>
                        <select formControlName="category"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('category')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                          <option value="">Selecciona una categoría</option>
                          @for (category of categories; track category.id) {
                            <option [value]="category.id">
                              {{category.name}}
                            </option>
                          }
                        </select>
                        @if (productForm.get('category')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe seleccionar una categoría</p>
                        }
                      </div>

                      <div formGroupName="location">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Almacén *</label>
                        <select formControlName="warehouseId" (change)="onWarehouseChange($event)"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('location.warehouseId')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                          <option value="">Selecciona un almacén</option>
                          @for (warehouse of warehouses; track warehouse.id) {
                            <option [value]="warehouse.id">
                              {{warehouse.name}}
                            </option>
                          }
                        </select>
                        @if (productForm.get('location.warehouseId')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe seleccionar un almacén</p>
                        }
                      </div>
                    </div>

                    <!-- Ubicación -->
                    <div formGroupName="location" class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Sector</label>
                        <select formControlName="sector" (change)="onSectorChange($event)"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona un sector</option>
                          @for (sector of availableSectors; track sector.id) {
                            <option [value]="sector.id">
                              {{sector.name}}
                            </option>
                          }
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Posición</label>
                        <select formControlName="position"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600">
                          <option value="">Selecciona una posición</option>
                          @for (position of availablePositions; track position) {
                            <option [value]="position">
                              {{position}}
                            </option>
                          }
                        </select>
                      </div>
                    </div>

                    <!-- Atributos -->
                    <div formGroupName="attributes" class="grid grid-cols-4 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Color *</label>
                        <select formControlName="color"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('attributes.color')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                          <option value="">Seleccionar</option>
                          @for (color of colors; track color.id) {
                            <option [value]="color.code">{{color.code}} - {{color.name}}</option>
                          }
                        </select>
                        @if (productForm.get('attributes.color')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe seleccionar un color</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Tamaño *</label>
                        <select formControlName="size"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('attributes.size')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                          <option value="">Seleccionar</option>
                          @for (size of sizes; track size.id) {
                            <option [value]="size.code">{{size.code}} - {{size.name}}</option>
                          }
                        </select>
                        @if (productForm.get('attributes.size')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe seleccionar un tamaño</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Material *</label>
                        <select formControlName="material"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('attributes.material')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                          <option value="">Seleccionar</option>
                          @for (material of materials; track material.id) {
                            <option [value]="material.code">{{material.code}} - {{material.name}}</option>
                          }
                        </select>
                        @if (productForm.get('attributes.material')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe seleccionar un material</p>
                        }
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Gramos *</label>
                        <input type="number" formControlName="grams" min="1" step="1"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' +
                          (productForm.get('attributes.grams')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')"
                          placeholder="ej: 250">
                        @if (productForm.get('attributes.grams')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">Debe ingresar los gramos</p>
                        }
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
<!--            Error: no funciona y tampoco muestra log al guardar producto. -->
            <button type="button" (click)="onSubmit()"
              [disabled]="loading"
              class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>

            <!-- Validation messages -->
            @if (!productForm.valid && showValidationErrors) {
              <div class="w-full mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 class="text-sm font-medium text-red-800 mb-2">Por favor, corrige los siguientes errores:</h4>
                <ul class="text-xs text-red-700 space-y-1">
                  @if (productForm.get('name')?.invalid) {
                    <li>• El nombre del producto es obligatorio (mínimo 3 caracteres)</li>
                  }
                  @if (productForm.get('description')?.invalid) {
                    <li>• La descripción es obligatoria</li>
                  }
                  @if (productForm.get('category')?.invalid) {
                    <li>• Debe seleccionar una categoría</li>
                  }
                  @if (productForm.get('location.warehouseId')?.invalid) {
                    <li>• Debe seleccionar un almacén</li>
                  }
                  @if (productForm.get('location.sector')?.invalid) {
                    <li>• Debe seleccionar un sector</li>
                  }
                  @if (productForm.get('attributes.color')?.invalid) {
                    <li>• Debe seleccionar un color</li>
                  }
                  @if (productForm.get('attributes.size')?.invalid) {
                    <li>• Debe seleccionar un tamaño</li>
                  }
                  @if (productForm.get('attributes.material')?.invalid) {
                    <li>• Debe seleccionar un material</li>
                  }
                  @if (productForm.get('attributes.grams')?.invalid) {
                    <li>• Debe ingresar los gramos</li>
                  }
                  @if (productForm.get('stock.current')?.invalid) {
                    <li>• El stock inicial debe ser un número válido (0 o mayor)</li>
                  }
                  @if (productForm.get('stock.minimum')?.invalid) {
                    <li>• El stock mínimo debe ser un número válido (0 o mayor)</li>
                  }
                  @if (productForm.get('pricing.cost')?.invalid) {
                    <li>• El costo debe ser un número válido (0 o mayor)</li>
                  }
                  @if (productForm.get('pricing.price')?.invalid) {
                    <li>• El precio de venta debe ser un número válido (0 o mayor)</li>
                  }
                </ul>
              </div>
            }

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

  // Dynamic attributes
  colors: Attribute[] = [];
  sizes: Attribute[] = [];
  materials: Attribute[] = [];

  loading = false;
  showValidationErrors = false;
  private subscriptions: Subscription[] = [];
  private lastGeneratedCounter = 0;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private warehouseService: WarehouseService,
    private attributeService: AttributeService,
    private businessService: BusinessService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {
    this.productForm = this.fb.group({
      code: [{value: '', disabled: true}],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      attributes: this.fb.group({
        color: ['', Validators.required],
        size: ['', Validators.required],
        material: ['', Validators.required],
        grams: ['', Validators.required]
      }),
      location: this.fb.group({
        warehouseId: ['', Validators.required],
        sector: ['', Validators.required],
        position: [''] // No es obligatorio
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
    this.loadAttributes();
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

  private loadAttributes(): void {
    // Load colors
    const colorsSub = this.attributeService.getAttributesByType('color')
      .subscribe(colors => this.colors = colors);
    this.subscriptions.push(colorsSub);

    // Load sizes
    const sizesSub = this.attributeService.getAttributesByType('size')
      .subscribe(sizes => this.sizes = sizes);
    this.subscriptions.push(sizesSub);

    // Load materials
    const materialsSub = this.attributeService.getAttributesByType('material')
      .subscribe(materials => this.materials = materials);
    this.subscriptions.push(materialsSub);
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
        attributesForm.get('size')!.valueChanges,
        attributesForm.get('grams')!.valueChanges
      ]).pipe(
        distinctUntilChanged(),
        map(([warehouseId, categoryId, color, size, grams]) => {
          if (warehouseId && categoryId && color && size && grams) {
            return this.generateSku(warehouseId, categoryId, color, size, grams);
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

  private generateSku(warehouseId: string, categoryId: string, color: string, size: string, grams: string): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    const category = this.categories.find(c => c.id === categoryId);

    if (!warehouse || !category) {
      return '';
    }

    const prefix = `${warehouse.code}-${this.getCategoryCode(category.name)}-${color}-${size}-${grams}G`;
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
    console.log('BUTTON CLICKED - onSubmit called');
    console.log('Form valid:', this.productForm.valid);
    console.log('Form errors:', this.productForm.errors);
    console.log('Loading state:', this.loading);

    // Check individual form controls
    Object.keys(this.productForm.controls).forEach(key => {
      const control = this.productForm.get(key);
      if (control?.invalid) {
        console.log(`Invalid control: ${key}`, control.errors);
      }
    });

    // Check nested form groups
    ['location', 'stock', 'pricing', 'attributes'].forEach(groupName => {
      const group = this.productForm.get(groupName) as FormGroup;
      if (group?.invalid) {
        console.log(`Invalid group: ${groupName}`);
        Object.keys(group.controls).forEach(controlName => {
          const control = group.get(controlName);
          if (control?.invalid) {
            console.log(`  - Invalid control: ${groupName}.${controlName}`, control.errors);
          }
        });
      }
    });

    if (this.productForm.invalid) {
      console.log('Form is invalid - showing validation errors');
      this.showValidationErrors = true;
      return;
    }

    if (this.loading) {
      console.log('Already loading - exiting');
      return;
    }

    this.loading = true;
    try {
      console.log('CreateProductModal.onSubmit - Starting product creation');

      const formValue = this.productForm.getRawValue();
      console.log('Form values:', formValue);

      const isRoot = this.authService.isRoot();
      console.log('User is root:', isRoot);

      let businessId: string | null = null;

      if (isRoot) {
        businessId = this.rootBusinessSelector.getEffectiveBusinessId();
        console.log('Root user - effective business ID:', businessId);
      } else {
        businessId = await this.businessService.getCurrentBusinessId();
        console.log('Admin user - current business ID:', businessId);
      }

      if (!businessId) {
        console.error('No business ID found');
        throw new Error('No se encontró el ID del negocio');
      }

      const product: Omit<SKU, 'id' | 'createdAt' | 'updatedAt'> = {
        businessId,
        code: formValue.code,
        name: formValue.name,
        description: formValue.description || '',
        category: formValue.category,
        attributes: {
          color: formValue.attributes.color || '',
          size: formValue.attributes.size || '',
          material: formValue.attributes.material || '',
          grams: formValue.attributes.grams || ''
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
        isActive: true
      };

      console.log('Product object to create:', product);

      const productId = await this.productService.createProduct(product);
      console.log('Product created successfully with ID:', productId);

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
