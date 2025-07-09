import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RootMessagesService } from '../../../../core/services/root-messages.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-business-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
            </svg>
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Solicitar Cuenta de Negocio
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Completa el formulario para solicitar acceso a StockIn-Manager
          </p>
        </div>

        <form class="mt-8 space-y-6" [formGroup]="businessRequestForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <!-- Información Personal -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
              
              <div class="space-y-4">
                <div>
                  <label for="fromName" class="block text-sm font-medium text-gray-700">
                    Nombre completo *
                  </label>
                  <input
                    id="fromName"
                    name="fromName"
                    type="text"
                    formControlName="fromName"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Tu nombre completo"
                  >
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('fromName')">
                    {{ getErrorMessage('fromName') }}
                  </div>
                </div>

                <div>
                  <label for="fromEmail" class="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    id="fromEmail"
                    name="fromEmail"
                    type="email"
                    formControlName="fromEmail"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="tu@email.com"
                  >
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('fromEmail')">
                    {{ getErrorMessage('fromEmail') }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del Negocio -->
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Negocio</h3>
              
              <div class="space-y-4">
                <div>
                  <label for="businessName" class="block text-sm font-medium text-gray-700">
                    Nombre del negocio *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    formControlName="businessName"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre de tu empresa"
                  >
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('businessName')">
                    {{ getErrorMessage('businessName') }}
                  </div>
                </div>

                <div>
                  <label for="businessEmail" class="block text-sm font-medium text-gray-700">
                    Email del negocio *
                  </label>
                  <input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    formControlName="businessEmail"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contacto@negocio.com"
                  >
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('businessEmail')">
                    {{ getErrorMessage('businessEmail') }}
                  </div>
                </div>

                <div>
                  <label for="businessPhone" class="block text-sm font-medium text-gray-700">
                    Teléfono del negocio
                  </label>
                  <input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    formControlName="businessPhone"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+54 9 11 1234-5678"
                  >
                </div>

                <div>
                  <label for="industry" class="block text-sm font-medium text-gray-700">
                    Industria
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    formControlName="industry"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona una industria</option>
                    <option value="retail">Retail / Comercio minorista</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="manufacturing">Manufactura</option>
                    <option value="wholesale">Mayorista</option>
                    <option value="logistics">Logística</option>
                    <option value="food">Alimentos y bebidas</option>
                    <option value="fashion">Moda y textil</option>
                    <option value="electronics">Electrónicos</option>
                    <option value="automotive">Automotriz</option>
                    <option value="healthcare">Salud</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label for="estimatedUsers" class="block text-sm font-medium text-gray-700">
                    Usuarios estimados *
                  </label>
                  <select
                    id="estimatedUsers"
                    name="estimatedUsers"
                    formControlName="estimatedUsers"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona cantidad de usuarios</option>
                    <option value="1">1 usuario</option>
                    <option value="2-5">2-5 usuarios</option>
                    <option value="6-10">6-10 usuarios</option>
                    <option value="11-25">11-25 usuarios</option>
                    <option value="26-50">26-50 usuarios</option>
                    <option value="51-100">51-100 usuarios</option>
                    <option value="100+">Más de 100 usuarios</option>
                  </select>
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('estimatedUsers')">
                    {{ getErrorMessage('estimatedUsers') }}
                  </div>
                </div>

                <div>
                  <label for="planRequested" class="block text-sm font-medium text-gray-700">
                    Plan solicitado *
                  </label>
                  <select
                    id="planRequested"
                    name="planRequested"
                    formControlName="planRequested"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Selecciona un plan</option>
                    <option value="basic">Básico - Hasta 100 productos</option>
                    <option value="premium">Premium - Hasta 1000 productos</option>
                    <option value="enterprise">Enterprise - Productos ilimitados</option>
                  </select>
                  <div class="text-red-500 text-sm mt-1" *ngIf="getErrorMessage('planRequested')">
                    {{ getErrorMessage('planRequested') }}
                  </div>
                </div>

                <div>
                  <label for="requirements" class="block text-sm font-medium text-gray-700">
                    Requisitos especiales
                  </label>
                  <textarea
                    id="requirements"
                    name="requirements"
                    formControlName="requirements"
                    rows="3"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe cualquier requisito especial o funcionalidad que necesites..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg
                  class="h-5 w-5 text-primary-500 group-hover:text-primary-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  *ngIf="!loading"
                >
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                </svg>
                <svg
                  class="animate-spin h-5 w-5 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  *ngIf="loading"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Enviando solicitud...' : 'Enviar solicitud' }}
            </button>
          </div>

          <div class="text-center">
            <a [routerLink]="['/app/login']" class="font-medium text-primary-600 hover:text-primary-500">
              ← Volver al login
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: []
})
export class BusinessRequestComponent {
  businessRequestForm: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private rootMessagesService: RootMessagesService,
    private notificationService: NotificationService
  ) {
    this.businessRequestForm = this.formBuilder.group({
      fromName: ['', [Validators.required, Validators.minLength(2)]],
      fromEmail: ['', [Validators.required, Validators.email]],
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      businessEmail: ['', [Validators.required, Validators.email]],
      businessPhone: [''],
      industry: [''],
      estimatedUsers: ['', [Validators.required]],
      planRequested: ['', [Validators.required]],
      requirements: ['']
    });
  }

  async onSubmit() {
    if (this.businessRequestForm.valid) {
      this.loading = true;
      
      try {
        const formData = this.businessRequestForm.value;
        
        const businessRequest = {
          title: `Solicitud de cuenta: ${formData.businessName}`,
          message: this.generateRequestMessage(formData),
          fromEmail: formData.fromEmail,
          fromName: formData.fromName,
          businessName: formData.businessName,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone || '',
          industry: formData.industry || '',
          estimatedUsers: parseInt(formData.estimatedUsers),
          planRequested: formData.planRequested,
          requirements: formData.requirements || ''
        };

        await this.rootMessagesService.createBusinessRequest(businessRequest);
        
        this.notificationService.success('Solicitud enviada correctamente. Te contactaremos pronto.');
        this.businessRequestForm.reset();
      } catch (error: any) {
        this.notificationService.error('Error al enviar la solicitud: ' + error.message);
      } finally {
        this.loading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private generateRequestMessage(data: any): string {
    return `
Nueva solicitud de cuenta de negocio:

Negocio: ${data.businessName}
Email del negocio: ${data.businessEmail}
Teléfono: ${data.businessPhone || 'No especificado'}
Industria: ${data.industry || 'No especificada'}
Usuarios estimados: ${data.estimatedUsers}
Plan solicitado: ${data.planRequested}
Requisitos especiales: ${data.requirements || 'Ninguno'}

Solicitante: ${data.fromName} (${data.fromEmail})
    `.trim();
  }

  private markFormGroupTouched() {
    Object.keys(this.businessRequestForm.controls).forEach(key => {
      this.businessRequestForm.get(key)?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.businessRequestForm.get(fieldName);
    
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }
} 