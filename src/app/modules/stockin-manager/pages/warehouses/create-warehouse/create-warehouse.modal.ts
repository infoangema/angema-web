import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { WarehouseService } from '../../../services/warehouse.service';
import { Warehouse, WarehouseSector } from '../../../models/warehouse.model';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-warehouse-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
          <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button type="button" 
                    (click)="closeModal()"
                    class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-base font-semibold leading-6 text-gray-900">{{ isEditMode ? 'Editar Almacén' : 'Nuevo Almacén' }}</h3>
              
              <form [formGroup]="warehouseForm" (ngSubmit)="onSubmit()" class="mt-4">
                <div class="space-y-4">
                  <!-- Selección de Negocio (solo para usuarios root) -->
                  <div *ngIf="isRoot && !isEditMode">
                    <label for="businessId" class="block text-sm font-medium text-gray-700">Negocio</label>
                    <select id="businessId"
                            formControlName="businessId"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            [class.border-red-500]="warehouseForm.get('businessId')?.invalid && warehouseForm.get('businessId')?.touched">
                      <option value="">Selecciona un negocio</option>
                      <option *ngFor="let business of businesses" [value]="business.id">
                        {{business.name}}
                      </option>
                    </select>
                    <p *ngIf="warehouseForm.get('businessId')?.invalid && warehouseForm.get('businessId')?.touched"
                       class="mt-2 text-sm text-red-600">
                      El negocio es requerido
                    </p>
                  </div>

                  <!-- Nombre -->
                  <div>
                    <label for="name" class="block text-sm font-medium text-gray-700">Nombre</label>
                    <input type="text" 
                           id="name" 
                           formControlName="name"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                           [class.border-red-500]="warehouseForm.get('name')?.invalid && warehouseForm.get('name')?.touched">
                    <p *ngIf="warehouseForm.get('name')?.invalid && warehouseForm.get('name')?.touched" 
                       class="mt-2 text-sm text-red-600">
                      El nombre es requerido
                    </p>
                  </div>

                  <!-- Código -->
                  <div>
                    <label for="code" class="block text-sm font-medium text-gray-700">Código</label>
                    <input type="text" 
                           id="code" 
                           formControlName="code"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                           [class.border-red-500]="warehouseForm.get('code')?.invalid && warehouseForm.get('code')?.touched">
                    <p *ngIf="warehouseForm.get('code')?.invalid && warehouseForm.get('code')?.touched" 
                       class="mt-2 text-sm text-red-600">
                      El código es requerido
                    </p>
                  </div>

                  <!-- Dirección -->
                  <div>
                    <label for="address" class="block text-sm font-medium text-gray-700">Dirección</label>
                    <input type="text" 
                           id="address" 
                           formControlName="address"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  </div>

                  <!-- Responsable -->
                  <div>
                    <label for="manager" class="block text-sm font-medium text-gray-700">Responsable</label>
                    <input type="text" 
                           id="manager" 
                           formControlName="manager"
                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  </div>

                  <!-- Sectores -->
                  <div formArrayName="sectors">
                    <div class="flex justify-between items-center mb-2">
                      <label class="block text-sm font-medium text-gray-700">Sectores</label>
                      <button type="button"
                              (click)="addSector()"
                              class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        <svg class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                        </svg>
                        Agregar Sector
                      </button>
                    </div>

                    <div *ngFor="let sector of sectors.controls; let i=index" [formGroupName]="i" class="space-y-3 p-3 border rounded-md mb-3">
                      <div class="flex justify-between items-start">
                        <div class="flex-grow mr-2">
                          <label [for]="'sector-name-'+i" class="block text-sm font-medium text-gray-700">Nombre del Sector</label>
                          <input [id]="'sector-name-'+i" 
                                type="text" 
                                formControlName="name"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        </div>
                        <button type="button" 
                                (click)="removeSector(i)"
                                class="mt-6 text-red-600 hover:text-red-800">
                          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/>
                          </svg>
                        </button>
                      </div>

                      <div formArrayName="positions">
                        <div class="flex justify-between items-center mb-2">
                          <label class="block text-sm font-medium text-gray-700">Posiciones</label>
                          <button type="button"
                                  (click)="addPosition(i)"
                                  class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            <svg class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
                            </svg>
                            Agregar Posición
                          </button>
                        </div>

                        <div *ngFor="let position of getPositions(i).controls; let j=index" class="flex items-center space-x-2 mb-2">
                          <input [id]="'position-'+i+'-'+j"
                                type="text"
                                [formControlName]="j"
                                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                          <button type="button"
                                  (click)="removePosition(i, j)"
                                  class="text-red-600 hover:text-red-800">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="submit"
                          [disabled]="warehouseForm.invalid || isSubmitting"
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                          [class.opacity-50]="warehouseForm.invalid || isSubmitting">
                    {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
                  </button>
                  <button type="button"
                          (click)="closeModal()"
                          class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CreateWarehouseModal implements OnInit {
  @Input() warehouse?: Warehouse;
  @Output() modalClose = new EventEmitter<void>();

  warehouseForm: FormGroup;
  businesses: any[] = [];
  isSubmitting = false;
  isRoot = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private businessService: BusinessService
  ) {
    this.warehouseForm = this.fb.group({
      name: ['', [Validators.required]],
      code: ['', [Validators.required]],
      address: [''],
      manager: [''],
      businessId: [''],
      isActive: [true],
      sectors: this.fb.array([])
    });
  }

  ngOnInit() {
    this.checkUserRole();
    this.setupForm();
  }

  private checkUserRole() {
    this.authService.currentUser$.subscribe(user => {
      this.isRoot = user?.roleId === 'root';
      if (this.isRoot) {
        this.loadBusinesses();
        this.warehouseForm.get('businessId')?.setValidators([Validators.required]);
      }
    });
  }

  private setupForm() {
    if (this.warehouse) {
      this.isEditMode = true;
      this.warehouseForm.patchValue({
        name: this.warehouse.name,
        code: this.warehouse.code,
        address: this.warehouse.address,
        manager: this.warehouse.manager,
        businessId: this.warehouse.businessId,
        isActive: this.warehouse.isActive
      });

      // Populate sectors
      if (this.warehouse.sectors) {
        this.warehouse.sectors.forEach(sector => {
          const sectorForm = this.fb.group({
            name: [sector.name, Validators.required],
            positions: this.fb.array(sector.positions.map(pos => this.fb.control(pos, Validators.required)))
          });
          this.sectors.push(sectorForm);
        });
      }
    }
  }

  async loadBusinesses() {
    try {
      this.businesses = await firstValueFrom(this.businessService.getBusinesses());
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  }

  get sectors() {
    return this.warehouseForm.get('sectors') as FormArray;
  }

  getPositions(sectorIndex: number): FormArray {
    return this.sectors.at(sectorIndex).get('positions') as FormArray;
  }

  addSector() {
    const sectorForm = this.fb.group({
      name: ['', Validators.required],
      positions: this.fb.array([])
    });
    this.sectors.push(sectorForm);
  }

  removeSector(index: number) {
    this.sectors.removeAt(index);
  }

  addPosition(sectorIndex: number) {
    const positions = this.getPositions(sectorIndex);
    positions.push(this.fb.control('', Validators.required));
  }

  removePosition(sectorIndex: number, positionIndex: number) {
    const positions = this.getPositions(sectorIndex);
    positions.removeAt(positionIndex);
  }

  async onSubmit() {
    if (this.warehouseForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      const formValue = this.warehouseForm.value;
      const warehouseData = {
        ...formValue,
        sectors: formValue.sectors.map((sector: any) => ({
          id: crypto.randomUUID(),
          name: sector.name,
          positions: sector.positions
        })),
        updatedAt: new Date()
      };

      if (this.isEditMode) {
        await this.warehouseService.updateWarehouse(this.warehouse!.id, warehouseData);
        this.notificationService.success('Almacén actualizado exitosamente');
      } else {
        const warehouse: Omit<Warehouse, 'id'> = {
          ...warehouseData,
          createdAt: new Date()
        };
        await this.warehouseService.createWarehouse(warehouse);
        this.notificationService.success('Almacén creado exitosamente');
      }

      this.closeModal();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      this.notificationService.error('Error al guardar el almacén');
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal() {
    this.modalClose.emit();
  }
}