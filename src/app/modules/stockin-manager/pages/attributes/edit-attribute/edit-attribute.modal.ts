import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Attribute } from '../../../models/attribute.model';
import { AttributeService } from '../../../services/attribute.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-edit-attribute-modal',
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
                <h3 class="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">Editar Atributo</h3>
                <div class="mt-4">
                  <form [formGroup]="attributeForm" (ngSubmit)="onSubmit()" class="space-y-4">
                    <!-- Tipo (solo lectura) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Tipo</label>
                      <input type="text" [value]="getTypeLabel(attribute.type)" readonly
                        class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm dark:bg-gray-600 dark:border-gray-500">
                    </div>

                    <!-- Código -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Código *</label>
                      <input type="text" formControlName="code"
                        [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' + 
                        (attributeForm.get('code')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                      @if (attributeForm.get('code')?.invalid && showValidationErrors) {
                        <p class="mt-1 text-sm text-red-600">El código es obligatorio</p>
                      }
                      @if (codeExistsError) {
                        <p class="mt-1 text-sm text-red-600">Este código ya existe para este tipo</p>
                      }
                    </div>

                    <!-- Nombre -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Nombre *</label>
                      <input type="text" formControlName="name"
                        [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' + 
                        (attributeForm.get('name')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                      @if (attributeForm.get('name')?.invalid && showValidationErrors) {
                        <p class="mt-1 text-sm text-red-600">El nombre es obligatorio</p>
                      }
                    </div>

                    <!-- Descripción -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                      <textarea formControlName="description" rows="2"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>

                    <!-- Estado -->
                    <div class="flex items-center">
                      <input type="checkbox" formControlName="isActive"
                        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                      <label class="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                        Atributo activo
                      </label>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button type="button" (click)="onSubmit()"
              [disabled]="loading"
              class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50">
              {{ loading ? 'Actualizando...' : 'Actualizar' }}
            </button>
            <button type="button" (click)="confirmDelete()"
              [disabled]="loading"
              class="mt-3 sm:mt-0 sm:mr-3 inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50">
              Eliminar
            </button>
            <button type="button" (click)="onCancel()"
              class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
              Cancelar
            </button>
          </div>

          <!-- Validation errors -->
          @if (!attributeForm.valid && showValidationErrors) {
            <div class="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <h4 class="text-sm font-medium text-red-800 mb-2">Por favor, corrige los siguientes errores:</h4>
              <ul class="text-xs text-red-700 space-y-1">
                @if (attributeForm.get('code')?.invalid) {
                  <li>• El código es obligatorio</li>
                }
                @if (attributeForm.get('name')?.invalid) {
                  <li>• El nombre es obligatorio</li>
                }
              </ul>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class EditAttributeModalComponent implements OnInit, OnDestroy {
  @Input() attribute!: Attribute;
  @Output() modalClose = new EventEmitter<void>();
  @Output() attributeUpdated = new EventEmitter<void>();
  @Output() attributeDeleted = new EventEmitter<void>();

  attributeForm: FormGroup;
  loading = false;
  showValidationErrors = false;
  codeExistsError = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private attributeService: AttributeService,
    private notificationService: NotificationService
  ) {
    this.attributeForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // Initialize form with attribute data
    this.attributeForm.patchValue({
      code: this.attribute.code,
      name: this.attribute.name,
      description: this.attribute.description || '',
      isActive: this.attribute.isActive
    });

    // Reset validation when form changes
    const subscription = this.attributeForm.valueChanges.subscribe(() => {
      this.codeExistsError = false;
    });
    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async onSubmit(): Promise<void> {
    this.showValidationErrors = true;
    this.codeExistsError = false;

    if (this.attributeForm.invalid) {
      return;
    }

    this.loading = true;

    try {
      const formValue = this.attributeForm.value;
      
      // Check if code already exists (excluding current attribute)
      if (formValue.code !== this.attribute.code) {
        const isUnique = await this.attributeService.isCodeUnique(
          formValue.code, 
          this.attribute.type, 
          this.attribute.id
        );
        
        if (!isUnique) {
          this.codeExistsError = true;
          this.loading = false;
          return;
        }
      }

      await this.attributeService.updateAttribute(this.attribute.id, {
        code: formValue.code,
        name: formValue.name,
        description: formValue.description || '',
        isActive: formValue.isActive
      });

      this.notificationService.success('Atributo actualizado exitosamente');
      this.attributeUpdated.emit();
      this.closeModal();
    } catch (error) {
      console.error('Error updating attribute:', error);
      this.notificationService.error('Error al actualizar el atributo');
    } finally {
      this.loading = false;
    }
  }

  confirmDelete(): void {
    if (confirm(`¿Estás seguro de eliminar el atributo "${this.attribute.name}"?`)) {
      this.deleteAttribute();
    }
  }

  async deleteAttribute(): Promise<void> {
    this.loading = true;

    try {
      await this.attributeService.deleteAttribute(this.attribute.id);
      this.notificationService.success('Atributo eliminado exitosamente');
      this.attributeDeleted.emit();
      this.closeModal();
    } catch (error) {
      console.error('Error deleting attribute:', error);
      this.notificationService.error('Error al eliminar el atributo');
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

  getTypeLabel(type: string): string {
    switch (type) {
      case 'color': return 'Color';
      case 'size': return 'Tamaño';
      case 'material': return 'Material';
      default: return type;
    }
  }
}