import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class RootGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn() && this.authService.isRoot()) {
      return true;
    }
    
    this.notificationService.error('Acceso denegado. Solo usuarios Root pueden acceder a esta sección.');
    this.router.navigate(['/app/dashboard']);
    return false;
  }
} 