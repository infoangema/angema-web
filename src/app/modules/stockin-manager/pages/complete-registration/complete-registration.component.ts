import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, isSignInWithEmailLink, signInWithEmailLink } from '@angular/fire/auth';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DatabaseService } from '../../../../core/services/database.service';

@Component({
  selector: 'app-complete-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Completar registro
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Por favor, establece tu contraseña para completar el registro
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form class="space-y-6" [formGroup]="registrationForm" (ngSubmit)="onSubmit()">
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div class="mt-1">
                <input
                  type="email"
                  [value]="email"
                  disabled
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-50"
                >
              </div>
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
                  placeholder="Ingresa tu contraseña"
                >
              </div>
              <p *ngIf="registrationForm.get('password')?.touched && registrationForm.get('password')?.errors?.['required']" 
                 class="mt-2 text-sm text-red-600">
                La contraseña es requerida
              </p>
              <p *ngIf="registrationForm.get('password')?.touched && registrationForm.get('password')?.errors?.['minlength']" 
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
              <p *ngIf="registrationForm.get('confirmPassword')?.touched && registrationForm.errors?.['passwordMismatch']" 
                 class="mt-2 text-sm text-red-600">
                Las contraseñas no coinciden
              </p>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="registrationForm.invalid || loading"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <svg *ngIf="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loading ? 'Completando registro...' : 'Completar registro' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class CompleteRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  loading = false;
  email = '';
  userId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private authService: AuthService,
    private notificationService: NotificationService,
    private databaseService: DatabaseService
  ) {
    this.registrationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Verificar si es un link válido de registro
    if (!isSignInWithEmailLink(this.auth, window.location.href)) {
      this.notificationService.error('Link de registro inválido');
      this.router.navigate(['/app/login']);
      return;
    }

    // Obtener email y userId de los query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.userId = params['userId'] || '';

      if (!this.email || !this.userId) {
        this.notificationService.error('Parámetros de registro inválidos');
        this.router.navigate(['/app/login']);
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  async onSubmit() {
    if (this.registrationForm.invalid) return;

    this.loading = true;
    try {
      // 1. Completar el sign in con el link mágico
      const userCredential = await signInWithEmailLink(
        this.auth,
        this.email,
        window.location.href
      );

      // 2. Actualizar la contraseña del usuario
      await this.authService.updatePassword(this.registrationForm.get('password')?.value);

      // 3. Actualizar el documento del usuario en Firestore
      await this.databaseService.update('users', this.userId, {
        uid: userCredential.user.uid,
        pendingRegistration: false
      });

      this.notificationService.success('Registro completado exitosamente');
      this.router.navigate(['/app/dashboard']);
    } catch (error: any) {
      console.error('Error completing registration:', error);
      this.notificationService.error('Error al completar el registro: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loading = false;
    }
  }
} 