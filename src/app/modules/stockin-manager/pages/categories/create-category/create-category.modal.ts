import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { NotificationService } from '../../../../../core/services/notification.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { BusinessService } from '../../../../../core/services/business.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-create-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

    <div class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
              <h3 class="text-base font-semibold leading-6 text-gray-900">{{ isEditMode ? 'Editar Categoría' : 'Nueva Categoría' }}</h3>

              <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" class="mt-4">
                <div class="space-y-4">
                  <!-- Selección de Negocio (solo para usuarios root) -->
                  <div *ngIf="isRoot && !isEditMode">
                    <label for="businessId" class="block text-sm font-medium text-gray-700">Negocio</label>
                    <select id="businessId"
                            formControlName="businessId"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            [class.border-red-500]="categoryForm.get('businessId')?.invalid && categoryForm.get('businessId')?.touched">
                      <option value="">Selecciona un negocio</option>
                      <option *ngFor="let business of businesses" [value]="business.id">
                        {{business.name}}
                      </option>
                    </select>
                    <p *ngIf="categoryForm.get('businessId')?.invalid && categoryForm.get('businessId')?.touched"
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
                           [class.border-red-500]="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched">
                    <p *ngIf="categoryForm.get('name')?.invalid && categoryForm.get('name')?.touched"
                       class="mt-2 text-sm text-red-600">
                      El nombre es requerido
                    </p>
                  </div>

                  <!-- Descripción -->
                  <div>
                    <label for="description" class="block text-sm font-medium text-gray-700">Descripción</label>
                    <textarea id="description"
                              formControlName="description"
                              rows="3"
                              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                  </div>

                  <!-- Categoría Padre -->
                  <div>
                    <label for="parentId" class="block text-sm font-medium text-gray-700">Categoría Padre</label>
                    <select id="parentId"
                            formControlName="parentId"
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option value="">Ninguna</option>
                      <option *ngFor="let category of categories" [value]="category.id">
                        {{category.name}}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="submit"
                          [disabled]="categoryForm.invalid || isSubmitting"
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                          [class.opacity-50]="categoryForm.invalid || isSubmitting">
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
export class CreateCategoryModal implements OnInit {
  @Input() category?: Category;
  @Output() modalClose = new EventEmitter<void>();

  categoryForm: FormGroup;
  categories: Category[] = [];
  businesses: any[] = [];
  isSubmitting = false;
  isRoot = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private businessService: BusinessService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      parentId: [''],
      businessId: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.checkUserRole();
    this.loadCategories();
    this.setupForm();
  }

  private checkUserRole() {
    this.authService.currentUser$.subscribe(user => {
      this.isRoot = user?.roleId === 'root';
      if (this.isRoot) {
        this.loadBusinesses();
        this.categoryForm.get('businessId')?.setValidators([Validators.required]);
      }
    });
  }

  private setupForm() {
    if (this.category) {
      this.isEditMode = true;
      this.categoryForm.patchValue({
        name: this.category.name,
        description: this.category.description,
        parentId: this.category.parentId || '',
        businessId: this.category.businessId,
        isActive: this.category.isActive
      });
    }
  }

  async loadBusinesses() {
    try {
      this.businesses = await firstValueFrom(this.businessService.getBusinesses());
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  }

  async loadCategories() {
    try {
      this.categories = await this.categoryService.getCategories();
      if (this.isEditMode && this.category) {
        this.categories = this.categories.filter(cat => cat.id !== this.category!.id);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async onSubmit() {
    if (this.categoryForm.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      if (this.isEditMode) {
        await this.categoryService.updateCategory(this.category!.id, {
          ...this.categoryForm.value,
          updatedAt: new Date()
        });
        this.notificationService.success('Categoría actualizada exitosamente');
      } else {
        const category: Omit<Category, 'id'> = {
          ...this.categoryForm.value,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.categoryService.createCategory(category);
        this.notificationService.success('Categoría creada exitosamente');
      }

      this.closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      this.notificationService.error('Error al guardar la categoría');
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal() {
    this.modalClose.emit();
  }
}
