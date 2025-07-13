import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CustomerService } from '../../../services/customer.service';
import { Customer, UpdateCustomerRequest, CustomerType, DocumentType } from '../../../models/customer.model';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  selector: 'app-edit-customer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" (click)="closeModal()"></div>

    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6" (click)="$event.stopPropagation()">
          <div class="absolute right-0 top-0 pr-4 pt-4">
            <button type="button"
                    (click)="closeModal()"
                    class="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <span class="sr-only">Cerrar</span>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                Editar Cliente: {{ customer.firstName }} {{ customer.lastName }}
              </h3>

              <!-- Tabs Navigation -->
              <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav class="-mb-px flex space-x-8">
                  @for (tab of tabs; track tab.id) {
                    <button
                      type="button"
                      (click)="switchTab(tab.id)"
                      [class]="'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ' + (activeTab === tab.id 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300')">
                      {{ tab.label }}
                    </button>
                  }
                </nav>
              </div>

              <form [formGroup]="customerForm" (ngSubmit)="onSubmit()">
                
                <!-- Personal Information Tab -->
                @if (activeTab === 'personal') {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Código (solo lectura) -->
                    <div>
                      <label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código
                      </label>
                      <input type="text"
                             id="code"
                             [value]="customer.code"
                             readonly
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm bg-gray-50 dark:bg-gray-900 sm:text-sm">
                    </div>

                    <!-- Tipo de Cliente -->
                    <div>
                      <label for="customerType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tipo de Cliente *
                      </label>
                      <select id="customerType"
                              formControlName="customerType"
                              class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              [class.border-red-500]="customerForm.get('customerType')?.invalid && customerForm.get('customerType')?.touched">
                        @for (type of customerTypes; track type.value) {
                          <option [value]="type.value">{{ type.label }}</option>
                        }
                      </select>
                      @if (customerForm.get('customerType')?.invalid && customerForm.get('customerType')?.touched) {
                        <p class="mt-2 text-sm text-red-600">El tipo de cliente es requerido</p>
                      }
                    </div>

                    <!-- Nombre -->
                    <div>
                      <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre *
                      </label>
                      <input type="text"
                             id="firstName"
                             formControlName="firstName"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                             [class.border-red-500]="customerForm.get('firstName')?.invalid && customerForm.get('firstName')?.touched">
                      @if (customerForm.get('firstName')?.invalid && customerForm.get('firstName')?.touched) {
                        <p class="mt-2 text-sm text-red-600">El nombre es requerido</p>
                      }
                    </div>

                    <!-- Apellido -->
                    <div>
                      <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Apellido *
                      </label>
                      <input type="text"
                             id="lastName"
                             formControlName="lastName"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                             [class.border-red-500]="customerForm.get('lastName')?.invalid && customerForm.get('lastName')?.touched">
                      @if (customerForm.get('lastName')?.invalid && customerForm.get('lastName')?.touched) {
                        <p class="mt-2 text-sm text-red-600">El apellido es requerido</p>
                      }
                    </div>

                    <!-- Email -->
                    <div>
                      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email *
                      </label>
                      <input type="email"
                             id="email"
                             formControlName="email"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                             [class.border-red-500]="customerForm.get('email')?.invalid && customerForm.get('email')?.touched">
                      @if (customerForm.get('email')?.invalid && customerForm.get('email')?.touched) {
                        <p class="mt-2 text-sm text-red-600">
                          @if (customerForm.get('email')?.errors?.['required']) {
                            El email es requerido
                          } @else if (customerForm.get('email')?.errors?.['email']) {
                            El email no es válido
                          }
                        </p>
                      }
                    </div>

                    <!-- Teléfono -->
                    <div>
                      <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Teléfono
                      </label>
                      <input type="tel"
                             id="phone"
                             formControlName="phone"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Tipo de Documento -->
                    <div>
                      <label for="documentType" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tipo de Documento
                      </label>
                      <select id="documentType"
                              formControlName="documentType"
                              class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="">Selecciona un tipo</option>
                        @for (docType of documentTypes; track docType.value) {
                          <option [value]="docType.value">{{ docType.label }}</option>
                        }
                      </select>
                    </div>

                    <!-- Número de Documento -->
                    <div>
                      <label for="documentNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Número de Documento
                      </label>
                      <input type="text"
                             id="documentNumber"
                             formControlName="documentNumber"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Estado Activo -->
                    <div class="col-span-2">
                      <div class="flex items-center">
                        <input type="checkbox"
                               id="isActive"
                               formControlName="isActive"
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded">
                        <label for="isActive" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          Cliente activo
                        </label>
                      </div>
                    </div>
                  </div>
                }

                <!-- Address Information Tab -->
                @if (activeTab === 'address') {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Dirección -->
                    <div class="col-span-2">
                      <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dirección
                      </label>
                      <input type="text"
                             id="address"
                             formControlName="address"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Ciudad -->
                    <div>
                      <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ciudad
                      </label>
                      <input type="text"
                             id="city"
                             formControlName="city"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Estado/Provincia -->
                    <div>
                      <label for="state" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Estado/Provincia
                      </label>
                      <input type="text"
                             id="state"
                             formControlName="state"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- País -->
                    <div>
                      <label for="country" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        País
                      </label>
                      <input type="text"
                             id="country"
                             formControlName="country"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Código Postal -->
                    <div>
                      <label for="postalCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Código Postal
                      </label>
                      <input type="text"
                             id="postalCode"
                             formControlName="postalCode"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>
                  </div>
                }

                <!-- Commercial Information Tab -->
                @if (activeTab === 'commercial') {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Límite de Crédito -->
                    <div>
                      <label for="creditLimit" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Límite de Crédito
                      </label>
                      <input type="number"
                             id="creditLimit"
                             formControlName="creditLimit"
                             min="0"
                             step="0.01"
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>

                    <!-- Puntos de Fidelidad (solo lectura) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Puntos de Fidelidad
                      </label>
                      <input type="text"
                             [value]="customer.loyaltyPoints | number"
                             readonly
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white shadow-sm sm:text-sm">
                    </div>

                    <!-- Total de Compras (solo lectura) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total de Compras
                      </label>
                      <input type="text"
                             [value]="customer.totalPurchases | currency"
                             readonly
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white shadow-sm sm:text-sm">
                    </div>

                    <!-- Fecha de registro (solo lectura) -->
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha de Registro
                      </label>
                      <input type="text"
                             [value]="customer.createdAt | date:'medium'"
                             readonly
                             class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white shadow-sm sm:text-sm">
                    </div>

                    <!-- Notas -->
                    <div class="col-span-2">
                      <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notas
                      </label>
                      <textarea id="notes"
                                formControlName="notes"
                                rows="4"
                                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="Notas adicionales sobre el cliente..."></textarea>
                    </div>
                  </div>
                }

                <div class="mt-6 sm:flex sm:flex-row-reverse">
                  <button type="submit"
                          [disabled]="customerForm.invalid || isSubmitting || !hasChanges()"
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                    @if (isSubmitting) {
                      <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    } @else {
                      Actualizar Cliente
                    }
                  </button>
                  <button type="button"
                          (click)="closeModal()"
                          class="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-600 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 sm:mt-0 sm:w-auto">
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
export class EditCustomerModalComponent implements OnInit {
  @Input() customer!: Customer;
  @Output() modalClose = new EventEmitter<void>();

  customerForm: FormGroup;
  isSubmitting = false;
  private originalFormValue: any;
  
  // Tabs management
  activeTab: 'personal' | 'address' | 'commercial' = 'personal';
  
  customerTypes: { value: CustomerType; label: string }[] = [];
  documentTypes: { value: DocumentType; label: string }[] = [];

  tabs = [
    { id: 'personal' as const, label: 'Información Personal', icon: 'user' },
    { id: 'address' as const, label: 'Dirección y Contacto', icon: 'location' },
    { id: 'commercial' as const, label: 'Información Comercial', icon: 'business' }
  ];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private notificationService: NotificationService
  ) {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      documentType: [''],
      documentNumber: [''],
      address: [''],
      city: [''],
      state: [''],
      country: [''],
      postalCode: [''],
      customerType: ['', [Validators.required]],
      creditLimit: [0, [Validators.min(0)]],
      notes: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadOptions();
    this.setupForm();
  }

  private loadOptions() {
    this.customerTypes = this.customerService.getCustomerTypes();
    this.documentTypes = this.customerService.getDocumentTypes();
  }

  private setupForm() {
    if (this.customer) {
      const formValue = {
        firstName: this.customer.firstName,
        lastName: this.customer.lastName,
        email: this.customer.email,
        phone: this.customer.phone || '',
        documentType: this.customer.documentType || '',
        documentNumber: this.customer.documentNumber || '',
        address: this.customer.address || '',
        city: this.customer.city || '',
        state: this.customer.state || '',
        country: this.customer.country || '',
        postalCode: this.customer.postalCode || '',
        customerType: this.customer.customerType,
        creditLimit: this.customer.creditLimit || 0,
        notes: this.customer.notes || '',
        isActive: this.customer.isActive
      };
      
      this.customerForm.patchValue(formValue);
      this.originalFormValue = { ...formValue };
    }
  }

  hasChanges(): boolean {
    if (!this.originalFormValue) return false;
    
    const currentValue = this.customerForm.value;
    return JSON.stringify(currentValue) !== JSON.stringify(this.originalFormValue);
  }

  async onSubmit() {
    if (this.customerForm.invalid || this.isSubmitting || !this.hasChanges()) {
      if (this.customerForm.invalid) {
        this.customerForm.markAllAsTouched();
      }
      return;
    }

    this.isSubmitting = true;
    try {
      const updateData: UpdateCustomerRequest = {};
      const formValue = this.customerForm.value;

      // Solo incluir campos que han cambiado
      Object.keys(formValue).forEach(key => {
        if (formValue[key] !== this.originalFormValue[key]) {
          updateData[key as keyof UpdateCustomerRequest] = formValue[key];
        }
      });

      // Limpiar campos vacíos
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof UpdateCustomerRequest];
        if (typeof value === 'string' && !value.trim()) {
          updateData[key as keyof UpdateCustomerRequest] = undefined;
        }
      });

      if (Object.keys(updateData).length === 0) {
        this.notificationService.showInfo('No hay cambios para guardar');
        this.closeModal();
        return;
      }

      await this.customerService.updateCustomer(this.customer.id, updateData);
      this.notificationService.showSuccess('Cliente actualizado exitosamente');
      this.closeModal();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      this.notificationService.showError(error.message || 'Error al actualizar el cliente');
    } finally {
      this.isSubmitting = false;
    }
  }

  switchTab(tabId: 'personal' | 'address' | 'commercial') {
    this.activeTab = tabId;
  }

  closeModal() {
    this.modalClose.emit();
  }
}