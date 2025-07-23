import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="text-center text-3xl font-extrabold text-gray-900">
          Completa tu perfil
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Por favor, establece tu contraseña y completa tus datos
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <div class="mt-1">
                <input
                  type="text"
                  formControlName="displayName"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Tu nombre completo"
                >
              </div>
              <p *ngIf="profileForm.get('displayName')?.touched && profileForm.get('displayName')?.errors?.['required']" 
                 class="mt-2 text-sm text-red-600">
                El nombre es requerido
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div class="mt-1">
                <input
                  type="password"
                  formControlName="password"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Establece una contraseña segura"
                >
              </div>
              <p *ngIf="profileForm.get('password')?.touched && profileForm.get('password')?.errors?.['required']" 
                 class="mt-2 text-sm text-red-600">
                La contraseña es requerida
              </p>
              <p *ngIf="profileForm.get('password')?.touched && profileForm.get('password')?.errors?.['minlength']" 
                 class="mt-2 text-sm text-red-600">
                La contraseña debe tener al menos 6 caracteres
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>
              <div class="mt-1">
                <input
                  type="password"
                  formControlName="confirmPassword"
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirma tu contraseña"
                >
              </div>
              <p *ngIf="profileForm.get('confirmPassword')?.touched && profileForm.errors?.['passwordMismatch']" 
                 class="mt-2 text-sm text-red-600">
                Las contraseñas no coinciden
              </p>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="profileForm.invalid || loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg *ngIf="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loading ? 'Guardando...' : 'Completar perfil' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CompleteProfileComponent {
  profileForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.profileForm = this.fb.group({
      displayName: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  async onSubmit() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    try {
      await this.authService.updateUserProfile({
        displayName: this.profileForm.get('displayName')?.value,
        password: this.profileForm.get('password')?.value,
        isFirstLogin: false
      });

      this.notificationService.success('Perfil completado exitosamente');
      this.router.navigate(['/app/orders']);
    } catch (error: any) {
      console.error('Error completing profile:', error);
      this.notificationService.error('Error al completar el perfil: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loading = false;
    }
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { passwordMismatch: true };
  }
} 