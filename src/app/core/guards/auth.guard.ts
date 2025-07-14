import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { map, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionControlService } from '../services/session-control.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private sessionControlService: SessionControlService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          this.router.navigate(['/app/login']);
          return [false];
        }

        // Verificar control de sesiones para usuarios no-root
        if (user.roleId !== 'root') {
          return from(this.checkSessionControl()).pipe(
            map(sessionAllowed => {
              if (!sessionAllowed) {
                this.router.navigate(['/app/session-limit']);
                return false;
              }
              return true;
            })
          );
        }

        // Para usuarios root, siempre permitir acceso
        return [true];
      })
    );
  }

  private async checkSessionControl(): Promise<boolean> {
    try {
      // Verificar si ya hay una sesión activa
      const hasActive = await this.sessionControlService.hasActiveSession();
      if (hasActive) {
        return true; // Ya tiene sesión activa, permitir
      }

      // Intentar registrar nueva sesión
      const result = await this.sessionControlService.registerSession();
      if (!result.success) {
        console.warn('Sesión rechazada:', result.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en control de sesiones:', error);
      // En caso de error, permitir acceso para no bloquear la app
      return true;
    }
  }
} 