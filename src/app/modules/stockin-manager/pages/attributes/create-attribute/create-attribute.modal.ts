import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AttributeType, CreateAttributeRequest } from '../../../models/attribute.model';
import { AttributeService } from '../../../services/attribute.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-create-attribute-modal',
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
                <h3 class="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">Nuevo Atributo</h3>
                <div class="mt-4">
                  <form [formGroup]="attributeForm" (ngSubmit)="onSubmit()" class="space-y-4">
                    <!-- Tipo -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Tipo *</label>
                      <select formControlName="type" (change)="onTypeChange()"
                        [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' + 
                        (attributeForm.get('type')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                        <option value="">Selecciona un tipo</option>
                        <option value="color">Color</option>
                        <option value="size">Tamaño</option>
                        <option value="material">Material</option>
                      </select>
                      @if (attributeForm.get('type')?.invalid && showValidationErrors) {
                        <p class="mt-1 text-sm text-red-600">Debe seleccionar un tipo</p>
                      }
                    </div>

                    <!-- Opciones predeterminadas -->
                    @if (selectedType && defaultOptions.length > 0) {
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                          Opciones predeterminadas (opcional)
                        </label>
                        <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                          @for (option of defaultOptions; track option.code) {
                            <label class="flex items-center">
                              <input
                                type="checkbox"
                                [value]="option.code"
                                (change)="onDefaultOptionChange(option, $event)"
                                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                {{option.code}} - {{option.name}}
                              </span>
                            </label>
                          }
                        </div>
                        @if (selectedDefaultOptions.length > 0) {
                          <p class="mt-1 text-sm text-blue-600">
                            Se crearán {{selectedDefaultOptions.length}} atributos predeterminados
                          </p>
                        }
                      </div>
                    }

                    <!-- Código manual (solo si no hay opciones predeterminadas seleccionadas) -->
                    @if (selectedDefaultOptions.length === 0) {
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Código *</label>
                        <input type="text" formControlName="code" placeholder="ej: ROJ, XL, ALG"
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
                        <input type="text" formControlName="name" placeholder="ej: Rojo, Extra Large, Algodón"
                          [class]="'mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 ' + 
                          (attributeForm.get('name')?.invalid && showValidationErrors ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600')">
                        @if (attributeForm.get('name')?.invalid && showValidationErrors) {
                          <p class="mt-1 text-sm text-red-600">El nombre es obligatorio</p>
                        }
                      </div>

                      <!-- Descripción -->
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Descripción</label>
                        <textarea formControlName="description" rows="2" placeholder="Descripción opcional..."
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"></textarea>
                      </div>
                    }
                  </form>
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button type="button" (click)="onSubmit()"
              [disabled]="loading"
              class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50">
              {{ loading ? 'Guardando...' : 'Guardar' }}
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
                @if (attributeForm.get('type')?.invalid) {
                  <li>• Debe seleccionar un tipo</li>
                }
                @if (selectedDefaultOptions.length === 0 && attributeForm.get('code')?.invalid) {
                  <li>• El código es obligatorio</li>
                }
                @if (selectedDefaultOptions.length === 0 && attributeForm.get('name')?.invalid) {
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
export class CreateAttributeModalComponent implements OnInit, OnDestroy {
  @Output() modalClose = new EventEmitter<void>();
  @Output() attributeCreated = new EventEmitter<void>();

  attributeForm: FormGroup;
  loading = false;
  showValidationErrors = false;
  codeExistsError = false;
  
  selectedType: AttributeType | null = null;
  defaultOptions: { code: string; name: string }[] = [];
  selectedDefaultOptions: { code: string; name: string }[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private attributeService: AttributeService,
    private notificationService: NotificationService
  ) {
    this.attributeForm = this.fb.group({
      type: ['', Validators.required],
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Reset validation when form changes
    const subscription = this.attributeForm.valueChanges.subscribe(() => {
      this.codeExistsError = false;
    });
    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onTypeChange(): void {
    const type = this.attributeForm.get('type')?.value as AttributeType;
    this.selectedType = type;
    this.selectedDefaultOptions = [];
    
    if (type) {
      this.defaultOptions = this.attributeService.getDefaultOptions(type);
      // Clear manual fields when switching types
      this.attributeForm.patchValue({
        code: '',
        name: '',
        description: ''
      });
    } else {
      this.defaultOptions = [];
    }
  }

  onDefaultOptionChange(option: { code: string; name: string }, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    
    if (checkbox.checked) {
      this.selectedDefaultOptions.push(option);
    } else {
      this.selectedDefaultOptions = this.selectedDefaultOptions.filter(o => o.code !== option.code);
    }

    // Update form validators based on whether we have default options selected
    this.updateFormValidators();
  }

  private updateFormValidators(): void {
    const codeControl = this.attributeForm.get('code');
    const nameControl = this.attributeForm.get('name');

    if (this.selectedDefaultOptions.length > 0) {
      // If we have default options, code and name are not required
      codeControl?.clearValidators();
      nameControl?.clearValidators();
    } else {
      // If no default options, code and name are required
      codeControl?.setValidators([Validators.required]);
      nameControl?.setValidators([Validators.required]);
    }

    codeControl?.updateValueAndValidity();
    nameControl?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    this.showValidationErrors = true;
    this.codeExistsError = false;

    // Validate form
    if (this.selectedDefaultOptions.length === 0 && this.attributeForm.invalid) {
      return;
    }

    if (!this.selectedType) {
      return;
    }

    this.loading = true;

    try {
      if (this.selectedDefaultOptions.length > 0) {
        // Create multiple attributes from default options
        for (const option of this.selectedDefaultOptions) {
          // Check if code already exists
          const isUnique = await this.attributeService.isCodeUnique(option.code, this.selectedType);
          if (!isUnique) {
            this.notificationService.error(`El código ${option.code} ya existe`);
            continue;
          }

          const attributeData: CreateAttributeRequest = {
            type: this.selectedType,
            code: option.code,
            name: option.name,
            description: this.attributeForm.get('description')?.value || ''
          };

          await this.attributeService.createAttribute(attributeData);
        }

        this.notificationService.success(`${this.selectedDefaultOptions.length} atributos creados exitosamente`);
      } else {
        // Create single attribute
        const formValue = this.attributeForm.value;
        
        // Check if code already exists
        const isUnique = await this.attributeService.isCodeUnique(formValue.code, this.selectedType);
        if (!isUnique) {
          this.codeExistsError = true;
          this.loading = false;
          return;
        }

        const attributeData: CreateAttributeRequest = {
          type: this.selectedType,
          code: formValue.code,
          name: formValue.name,
          description: formValue.description || ''
        };

        await this.attributeService.createAttribute(attributeData);
        this.notificationService.success('Atributo creado exitosamente');
      }

      this.attributeCreated.emit();
      this.closeModal();
    } catch (error) {
      console.error('Error creating attribute:', error);
      this.notificationService.error('Error al crear el atributo');
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