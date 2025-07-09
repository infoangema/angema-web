import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  loading = false;
  loadingForgotPassword = false;
  showPassword = false;
  showForgotPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['info@angema.com.ar', [Validators.required, Validators.email]],
      password: ['geraDevs9003..Root', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    try {
      const { email, password } = this.loginForm.value;
      await this.authService.login(email, password);
      this.notificationService.success('Inicio de sesión exitoso');
      await this.router.navigate(['/app/dashboard']);
    } catch (error: any) {
      console.error('Error en login:', error);
      this.notificationService.error('Error al iniciar sesión: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loading = false;
    }
  }

  async sendPasswordReset() {
    if (this.forgotPasswordForm.invalid) return;

    this.loadingForgotPassword = true;
    try {
      const { email } = this.forgotPasswordForm.value;
      await this.authService.sendPasswordResetEmail(email);
      this.notificationService.success('Se ha enviado un enlace de recuperación a tu email');
      this.showForgotPassword = false;
    } catch (error: any) {
      console.error('Error enviando reset de contraseña:', error);
      this.notificationService.error('Error enviando email de recuperación: ' + (error.message || 'Error desconocido'));
    } finally {
      this.loadingForgotPassword = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleForgotPassword() {
    this.showForgotPassword = !this.showForgotPassword;
    if (this.showForgotPassword) {
      this.forgotPasswordForm.reset();
    }
  }

  getErrorMessage(field: string, form: 'login' | 'forgotPassword' = 'login'): string {
    const formGroup = form === 'login' ? this.loginForm : this.forgotPasswordForm;
    const control = formGroup.get(field);

    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['email']) {
      return 'Ingresa un email válido';
    }
    if (control.errors['minlength']) {
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }
}
