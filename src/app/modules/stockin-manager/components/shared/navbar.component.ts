import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ModalService } from '../../services/modal.service';
import { BusinessSelectorModalComponent } from '../business-selector-modal/business-selector-modal.component';
import { RootBusinessSelectorService } from '../../services/root-business-selector.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'stockin-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 px-8 py-4 shadow-sm transition-colors duration-200">
    <div class="flex items-center gap-8">
      <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
        <div class="size-8">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path clip-rule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fill-rule="evenodd"></path>
          </svg>
        </div>
        <div class="flex flex-col">
          <h2 class="text-xl font-semibold tracking-tight dark:text-white">StockIn Manager</h2>
          <span class="text-xs text-gray-500 dark:text-gray-400">v{{ version }}</span>
        </div>
      </div>
      <nav class="flex items-center gap-6">
        <!-- Dashboard removido del menú (oculto) -->
        
        <!-- 1. Pedidos - Nuevo primer elemento -->
        <a
          routerLink="/app/orders"
          routerLinkActive="text-blue-600 dark:text-blue-400 font-semibold"
          class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium leading-normal transition-colors">
          Pedidos
        </a>
        
        <!-- 2. Productos -->
        <a
          routerLink="/app/products"
          routerLinkActive="text-blue-600 dark:text-blue-400 font-semibold"
          class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium leading-normal transition-colors">
          Productos
        </a>
        
        <!-- 3. Clientes -->
        <a
          routerLink="/app/customers"
          routerLinkActive="text-blue-600 dark:text-blue-400 font-semibold"
          class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium leading-normal transition-colors">
          Clientes
        </a>
        
        <!-- 4. Reportes -->
        <a
          routerLink="/app/reports"
          routerLinkActive="text-blue-600 dark:text-blue-400 font-semibold"
          class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium leading-normal transition-colors">
          Reportes
        </a>
        
        <!-- 5. Configuraciones Dropdown (solo admin/root) -->
        @if (canManageAttributes()) {
          <div class="relative">
            <button
              (click)="toggleConfigMenu()"
              class="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-lg font-medium leading-normal transition-colors"
              [class.text-blue-600]="showConfigMenu"
              [class.dark:text-blue-400]="showConfigMenu"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Configuraciones
              <svg class="w-4 h-4 transition-transform duration-200" [class.rotate-180]="showConfigMenu" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Dropdown Menu -->
            @if (showConfigMenu) {
              <div class="absolute left-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-dark-600">
                <a
                  routerLink="/app/categories"
                  routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  (click)="showConfigMenu = false"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    Categorías
                  </div>
                </a>
                <a
                  routerLink="/app/warehouses"
                  routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  (click)="showConfigMenu = false"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3"></path>
                    </svg>
                    Almacenes
                  </div>
                </a>
                <a
                  routerLink="/app/attributes"
                  routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  (click)="showConfigMenu = false"
                  class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"></path>
                    </svg>
                    Atributos
                  </div>
                </a>
              </div>
            }
          </div>
        }
        @if (isRoot()) {
          <a
            routerLink="/app/root-admin"
            routerLinkActive="text-red-700 dark:text-red-300 font-semibold"
            class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-lg font-semibold leading-normal transition-colors">
            Root Admin
          </a>
          <a
            routerLink="/app/firebase-monitoring"
            routerLinkActive="text-orange-700 dark:text-orange-300 font-semibold"
            class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-500 text-lg font-semibold leading-normal transition-colors">
            Firebase Monitor
          </a>
        }
      </nav>
    </div>
    <div class="flex items-center gap-6">
      <!-- Business Selector for Root Users -->
      @if (isRoot()) {
        <div class="relative">
        <button
          (click)="openBusinessSelector()"
          class="flex items-center gap-2 px-3 py-2 text-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0H3m13 0v-3c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3m8 0V9c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v12"></path>
          </svg>
          <span class="hidden sm:inline">{{ getBusinessSelectorText() }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        </div>
      }
      <label class="relative flex items-center">
        <div class="absolute left-3 text-gray-400 dark:text-gray-500">
          <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
            <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
          </svg>
        </div>
        <input class="form-input w-72 rounded-md border-gray-300 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 py-2 pl-10 pr-4 text-lg text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="Buscar por SKU, nombre de producto..." />
      </label>

      <!-- Theme Toggle Button -->
      <button
        (click)="toggleTheme()"
        class="relative flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        <!-- Sun icon -->
        @if (isDarkMode$ | async) {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        }
        <!-- Moon icon -->
        @if (!(isDarkMode$ | async)) {
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        }
      </button>

      <button class="relative flex cursor-pointer items-center justify-center rounded-md p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
          <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
        </svg>
        <span class="absolute top-1 right-1 flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </button>

      <!-- User Menu Dropdown -->
      <div class="relative">
        <button
          (click)="toggleUserMenu()"
          class="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-9 border border-gray-300" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBDmfIK3Of0JKkXUzeK19e_p-yA-j5bmkn-ZyxPV7fzn5sYKyELJ1MJ3OMu6mUrX5NcVvEhjKGJ9FLzgAdrcYrK_pSdVTTHeJM8BqLhgOAl5iK-Hi9fbI-XhHQjYNTHXircZMcP7biDBeiVc7woJNRoyaL6cCry90Gq2Sw8Xh7nQ7uCm6W87fYY7qmWnf88b60KnPZO3RixuJmnX8ZqHrtgiHAPIbBTN1nvnOIdwJcQlHdfLW_yyslRrn5rayq7qzHPUXRssytMcVTA");'></div>
          <svg class="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        @if (showUserMenu) {
          <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-lg font-medium text-gray-900">{{ getUserDisplayName() }}</p>
            <p class="text-xs text-gray-500">{{ getUserEmail() }}</p>
          </div>
          <button
            (click)="logout()"
            class="w-full text-left px-4 py-2 text-lg text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Cerrar sesión
          </button>
          </div>
        }
      </div>
    </div>
  </header>
  `,
  styleUrls: []
})
export class StockinNavbarComponent {
  showUserMenu = false;
  showConfigMenu = false; // Nueva propiedad para dropdown Configuraciones
  isDarkMode$;
  version = environment.version;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private router: Router,
    private modalService: ModalService,
    private rootBusinessSelector: RootBusinessSelectorService
  ) {
    this.isDarkMode$ = this.themeService.darkMode$;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    // Cerrar dropdown de configuraciones si está abierto
    this.showConfigMenu = false;
  }

  toggleConfigMenu() {
    this.showConfigMenu = !this.showConfigMenu;
    // Cerrar dropdown de usuario si está abierto
    this.showUserMenu = false;
  }

  getUserDisplayName(): string {
    const profile = this.authService.getCurrentUserProfile();
    return profile?.displayName || 'Usuario';
  }

  getUserEmail(): string {
    const profile = this.authService.getCurrentUserProfile();
    return profile?.email || '';
  }

  async logout() {
    try {
      // Clear root business selection on logout
      if (this.authService.isRoot()) {
        this.rootBusinessSelector.clearSelection();
      }

      await this.authService.logout();
      this.notificationService.success('Sesión cerrada correctamente');
      this.showUserMenu = false;
      await this.router.navigate(['/app/login']);
    } catch (error) {
      this.notificationService.error('Error al cerrar sesión');
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isRoot(): boolean {
    return this.authService.isRoot();
  }

  canManageAttributes(): boolean {
    const currentUser = this.authService.getCurrentUserProfile();
    return currentUser?.roleId === 'root' || currentUser?.roleId === 'admin';
  }

  getBusinessSelectorText(): string {
    if (!this.isRoot()) return '';

    const selection = this.rootBusinessSelector.getCurrentSelection();
    if (selection.showAll) {
      return 'Todos los negocios';
    } else if (selection.businessId) {
      return 'Negocio seleccionado';
    } else {
      return 'Seleccionar negocio';
    }
  }

  async openBusinessSelector(): Promise<void> {
    if (!this.isRoot()) return;

    try {
      await this.modalService.open(BusinessSelectorModalComponent);
      // Optionally refresh current page data after business selection change
      console.log('Business selector closed');
    } catch (error) {
      console.error('Error opening business selector:', error);
    }
  }
}
